use std::fmt;

use argon2::{
    password_hash::{Error as PasswordHashError, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use axum::{
    async_trait,
    extract::{FromRequestParts, Path, State},
    http::{request::Parts, StatusCode},
    response::Json,
};
use chrono::{Duration, Utc};
use rand_core::OsRng;
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use sqlx::{Row, SqlitePool};
use uuid::Uuid;

use crate::AppState;

const TOKEN_TTL_HOURS: i64 = 12;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum UserRole {
    Admin,
    Dev,
    User,
}

impl UserRole {
    pub fn as_str(&self) -> &'static str {
        match self {
            UserRole::Admin => "admin",
            UserRole::Dev => "dev",
            UserRole::User => "user",
        }
    }
}

impl TryFrom<String> for UserRole {
    type Error = anyhow::Error;

    fn try_from(value: String) -> Result<Self, Self::Error> {
        match value.as_str() {
            "admin" => Ok(UserRole::Admin),
            "dev" => Ok(UserRole::Dev),
            "user" => Ok(UserRole::User),
            other => Err(anyhow::anyhow!("Unknown user role: {}", other)),
        }
    }
}

#[derive(Debug, Clone)]
pub struct AuthUser {
    pub id: String,
    pub email: String,
    pub role: UserRole,
    pub must_change_password: bool,
}

impl AuthUser {
    pub fn ensure_password_updated(&self) -> Result<(), StatusCode> {
        if self.must_change_password {
            Err(StatusCode::FORBIDDEN)
        } else {
            Ok(())
        }
    }
}

#[derive(Serialize, Deserialize)]
struct Claims {
    sub: String,
    email: String,
    role: String,
    exp: usize,
}

#[derive(Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Serialize)]
pub struct LoginResponse {
    pub token: String,
    pub email: String,
    pub role: UserRole,
    #[serde(rename = "mustChangePassword")]
    pub must_change_password: bool,
}

#[derive(Deserialize)]
pub struct ChangePasswordRequest {
    #[serde(rename = "currentPassword")]
    pub current_password: String,
    #[serde(rename = "newPassword")]
    pub new_password: String,
}

#[derive(Deserialize)]
pub struct CreateUserRequest {
    pub email: String,
    pub password: String,
    #[serde(default)]
    pub role: Option<UserRole>,
}

#[derive(Serialize)]
pub struct UserSummary {
    pub id: String,
    pub email: String,
    pub role: UserRole,
    #[serde(rename = "mustChangePassword")]
    pub must_change_password: bool,
}

#[derive(Deserialize)]
pub struct UpdateUserRequest {
    pub password: Option<String>,
    pub role: Option<UserRole>,
    #[serde(rename = "mustChangePassword")]
    pub must_change_password: Option<bool>,
}

#[async_trait]
impl<S> FromRequestParts<S> for AuthUser
where
    State<AppState>: FromRequestParts<S>,
    S: Send + Sync,
{
    type Rejection = (StatusCode, &'static str);

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let auth_header = parts
            .headers
            .get(axum::http::header::AUTHORIZATION)
            .and_then(|value| value.to_str().map(|s| s.to_owned()).ok())
            .ok_or((StatusCode::UNAUTHORIZED, "Missing authorization header"))?;

        let token = auth_header
            .strip_prefix("Bearer ")
            .ok_or((StatusCode::UNAUTHORIZED, "Invalid authorization header"))?
            .to_string();

        let State(app_state) =
            State::<AppState>::from_request_parts(parts, state).await.map_err(|_| {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "Failed to extract application state",
                )
            })?;

        let decoding_key = DecodingKey::from_secret(app_state.jwt_secret.as_bytes());
        let token_data = decode::<Claims>(&token, &decoding_key, &Validation::default())
            .map_err(|_| (StatusCode::UNAUTHORIZED, "Invalid or expired token"))?;

        let row = sqlx::query(
            "SELECT id, email, role, must_change_password FROM users WHERE id = ?",
        )
        .bind(&token_data.claims.sub)
        .fetch_optional(&app_state.db)
        .await
        .map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "Failed to load user"))?
        .ok_or((StatusCode::UNAUTHORIZED, "User not found"))?;

        let role = row
            .get::<String, _>(2)
            .try_into()
            .map_err(|_| (StatusCode::UNAUTHORIZED, "Invalid role"))?;

        Ok(AuthUser {
            id: row.get::<String, _>(0),
            email: row.get::<String, _>(1),
            role,
            must_change_password: row.get::<bool, _>(3),
        })
    }
}

pub async fn ensure_default_admin(db: &SqlitePool) -> anyhow::Result<()> {
    const ADMIN_EMAIL: &str = "shayneeo@0.id.vn";
    const ADMIN_PASSWORD: &str = "Admin@123";

    let count: i64 = sqlx::query_scalar("SELECT COUNT(1) FROM users WHERE email = ?")
        .bind(ADMIN_EMAIL)
        .fetch_one(db)
        .await?;

    if count == 0 {
        let password_hash = hash_password(ADMIN_PASSWORD)?;
        sqlx::query(
            r#"
            INSERT INTO users (id, email, password_hash, role, must_change_password)
            VALUES (?, ?, ?, 'admin', 1)
        "#,
        )
        .bind(Uuid::new_v4().to_string())
        .bind(ADMIN_EMAIL)
        .bind(password_hash)
        .execute(db)
        .await?;
    }

    Ok(())
}

pub fn hash_password(password: &str) -> Result<String, PasswordHashError> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let hash = argon2.hash_password(password.as_bytes(), &salt)?;
    Ok(hash.to_string())
}

fn verify_password(password_hash: &str, password: &str) -> Result<bool, PasswordHashError> {
    let parsed_hash = PasswordHash::new(password_hash)?;
    Ok(Argon2::default()
        .verify_password(password.as_bytes(), &parsed_hash)
        .is_ok())
}

fn encode_token(user_id: &str, email: &str, role: &UserRole, secret: &str) -> anyhow::Result<String> {
    let exp = Utc::now()
        .checked_add_signed(Duration::hours(TOKEN_TTL_HOURS))
        .ok_or_else(|| anyhow::anyhow!("Failed to calculate token expiration"))?
        .timestamp() as usize;

    let claims = Claims {
        sub: user_id.to_string(),
        email: email.to_string(),
        role: role.as_str().to_string(),
        exp,
    };

    let encoding_key = EncodingKey::from_secret(secret.as_bytes());
    Ok(encode(&Header::default(), &claims, &encoding_key)?)
}

pub async fn login(
    State(state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<LoginResponse>, StatusCode> {
    let row = sqlx::query(
        "SELECT id, email, password_hash, role, must_change_password FROM users WHERE email = ?",
    )
    .bind(&payload.email)
    .fetch_optional(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .ok_or(StatusCode::UNAUTHORIZED)?;

    let password_hash = row.get::<String, _>(2);
    if !verify_password(&password_hash, &payload.password).map_err(|_| StatusCode::UNAUTHORIZED)? {
        return Err(StatusCode::UNAUTHORIZED);
    }

    let role: UserRole = row
        .get::<String, _>(3)
        .try_into()
        .map_err(|_| StatusCode::UNAUTHORIZED)?;

    let token = encode_token(&row.get::<String, _>(0), &payload.email, &role, &state.jwt_secret)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(LoginResponse {
        token,
        email: payload.email,
        role,
        must_change_password: row.get::<bool, _>(4),
    }))
}

pub async fn change_password(
    State(state): State<AppState>,
    user: AuthUser,
    Json(payload): Json<ChangePasswordRequest>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    if payload.new_password.len() < 8 {
        return Err(StatusCode::BAD_REQUEST);
    }

    let current_hash = sqlx::query("SELECT password_hash FROM users WHERE id = ?")
        .bind(&user.id)
        .fetch_one(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .get::<String, _>(0);

    if !verify_password(&current_hash, &payload.current_password)
        .map_err(|_| StatusCode::UNAUTHORIZED)?
    {
        return Err(StatusCode::UNAUTHORIZED);
    }

    let new_hash =
        hash_password(&payload.new_password).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    sqlx::query("UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?")
        .bind(new_hash)
        .bind(&user.id)
        .execute(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(serde_json::json!({
        "status": "success",
        "message": "Password updated"
    })))
}

pub async fn me(user: AuthUser) -> Result<Json<UserSummary>, StatusCode> {
    Ok(Json(UserSummary {
        id: user.id,
        email: user.email,
        role: user.role,
        must_change_password: user.must_change_password,
    }))
}

pub async fn create_user(
    State(state): State<AppState>,
    user: AuthUser,
    Json(payload): Json<CreateUserRequest>,
) -> Result<Json<UserSummary>, StatusCode> {
    user.ensure_password_updated()?;
    if !matches!(user.role, UserRole::Admin) {
        return Err(StatusCode::FORBIDDEN);
    }

    if payload.password.len() < 8 {
        return Err(StatusCode::BAD_REQUEST);
    }

    let role = payload.role.unwrap_or(UserRole::User);
    let password_hash =
        hash_password(&payload.password).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let id = Uuid::new_v4().to_string();

    sqlx::query(
        r#"
        INSERT INTO users (id, email, password_hash, role, must_change_password)
        VALUES (?, ?, ?, ?, 0)
    "#,
    )
    .bind(&id)
    .bind(&payload.email)
    .bind(password_hash)
    .bind(role.as_str())
    .execute(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(UserSummary {
        id,
        email: payload.email,
        role,
        must_change_password: false,
    }))
}

pub async fn list_users(
    State(state): State<AppState>,
    user: AuthUser,
) -> Result<Json<Vec<UserSummary>>, StatusCode> {
    user.ensure_password_updated()?;
    if !matches!(user.role, UserRole::Admin) {
        return Err(StatusCode::FORBIDDEN);
    }

    let rows = sqlx::query("SELECT id, email, role, must_change_password FROM users ORDER BY created_at DESC")
        .fetch_all(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let users = rows
        .into_iter()
        .map(|row| {
            let role: UserRole = row
                .get::<String, _>(2)
                .try_into()
                .unwrap_or(UserRole::User);
            UserSummary {
                id: row.get::<String, _>(0),
                email: row.get::<String, _>(1),
                role,
                must_change_password: row.get::<bool, _>(3),
            }
        })
        .collect();

    Ok(Json(users))
}

pub async fn update_user(
    State(state): State<AppState>,
    user: AuthUser,
    Path(target_id): Path<String>,
    Json(payload): Json<UpdateUserRequest>,
) -> Result<Json<UserSummary>, StatusCode> {
    user.ensure_password_updated()?;
    if !matches!(user.role, UserRole::Admin) {
        return Err(StatusCode::FORBIDDEN);
    }

    if payload.password.is_none() && payload.role.is_none() && payload.must_change_password.is_none() {
        return Err(StatusCode::BAD_REQUEST);
    }

    if let Some(role) = &payload.role {
        sqlx::query("UPDATE users SET role = ? WHERE id = ?")
            .bind(role.as_str())
            .bind(&target_id)
            .execute(&state.db)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    }

    if let Some(flag) = payload.must_change_password {
        sqlx::query("UPDATE users SET must_change_password = ? WHERE id = ?")
            .bind(flag)
            .bind(&target_id)
            .execute(&state.db)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    }

    if let Some(password) = &payload.password {
        if password.len() < 8 {
            return Err(StatusCode::BAD_REQUEST);
        }
        let new_hash =
            hash_password(password).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        sqlx::query("UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?")
            .bind(new_hash)
            .bind(&target_id)
            .execute(&state.db)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    }

    let row = sqlx::query("SELECT id, email, role, must_change_password FROM users WHERE id = ?")
        .bind(&target_id)
        .fetch_one(&state.db)
        .await
        .map_err(|_| StatusCode::NOT_FOUND)?;

    let role: UserRole = row
        .get::<String, _>(2)
        .try_into()
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(UserSummary {
        id: row.get::<String, _>(0),
        email: row.get::<String, _>(1),
        role,
        must_change_password: row.get::<bool, _>(3),
    }))
}

pub async fn delete_user(
    State(state): State<AppState>,
    user: AuthUser,
    Path(target_id): Path<String>,
) -> Result<StatusCode, StatusCode> {
    user.ensure_password_updated()?;
    if !matches!(user.role, UserRole::Admin) {
        return Err(StatusCode::FORBIDDEN);
    }
    if user.id == target_id {
        return Err(StatusCode::BAD_REQUEST);
    }

    let result = sqlx::query("DELETE FROM users WHERE id = ?")
        .bind(&target_id)
        .execute(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if result.rows_affected() == 0 {
        return Err(StatusCode::NOT_FOUND);
    }

    Ok(StatusCode::NO_CONTENT)
}

impl fmt::Display for UserRole {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.as_str())
    }
}

