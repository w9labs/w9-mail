'use client'

import Link from 'next/link'
import { useSession } from '../../lib/session'

export default function DocsPage() {
  const { session } = useSession()
  const canView = session && (session.role === 'admin' || session.role === 'dev')

  return (
    <main className="app">
      <header className="header">
        <h1>W9 Mail / API Sheet</h1>
        <p>Monochrome reference for the HTTP surface.</p>
      </header>

      <nav className="nav">
        <Link className="nav-link" href="/">
          Composer
        </Link>
        <Link className="nav-link" href="/manage">
          Manage
        </Link>
        <Link className="nav-link active" href="/docs">
          Docs
        </Link>
      </nav>

      {!canView ? (
        <section className="box warning">
          <h2 className="section-title">Restricted</h2>
          <p>Only developer and admin roles can see the API surface. Sign in with elevated credentials.</p>
          <Link className="button" href="/login">
            Go to login
          </Link>
        </section>
      ) : (
        <>
          <section className="box">
            <h2 className="section-title">Base URL</h2>
            <code>http://localhost:8080/api</code>
            <p>Replace host with your deployed domain (e.g., https://w9.nu/api).</p>
          </section>

          <section className="box">
            <h2 className="section-title">Endpoints</h2>

            <article>
              <h3>POST /api/auth/login</h3>
              <p>Exchange email + password for a JWT. Required before every other call.</p>
              <pre>{`REQUEST:
{
  "email": "user@domain.com",
  "password": "string"
}

RESPONSE:
{
  "token": "jwt",
  "role": "user|dev|admin",
  "mustChangePassword": false
}`}</pre>
            </article>

            <article>
              <h3>POST /api/auth/change-password</h3>
              <p>Forces default admin to rotate secrets on first login.</p>
              <pre>{`HEADERS:
Authorization: Bearer &lt;jwt&gt;

BODY:
{
  "currentPassword": "string",
  "newPassword": "string"
}`}</pre>
            </article>

            <article>
              <h3>GET /api/accounts</h3>
              <p>List all sender profiles (auth required). Normal users only see status, admins can mutate.</p>
              <pre>{`HEADERS:
Authorization: Bearer &lt;jwt&gt;

RESPONSE:
[
  {
    "id": "uuid",
    "email": "ops@domain.com",
    "displayName": "Ops Bot",
    "isActive": true
  }
]`}</pre>
            </article>

            <article>
              <h3>POST /api/accounts</h3>
              <p>Create a new sender (stores password for SMTP authentication).</p>
              <pre>{`HEADERS:
Authorization: Bearer &lt;admin jwt&gt;

REQUEST:
{
  "email": "string",
  "displayName": "string",
  "password": "string",
  "isActive": boolean
}`}</pre>
            </article>

            <article>
              <h3>PATCH /api/accounts/:id</h3>
              <p>Toggle activation and/or rotate password.</p>
              <pre>{`HEADERS:
Authorization: Bearer &lt;admin jwt&gt;

REQUEST:
{
  "isActive": boolean?,
  "password": "string?"
}`}</pre>
            </article>

            <article>
              <h3>POST /api/send</h3>
              <p>Normal and developer users only. Admin JWTs are rejected.</p>
              <pre>{`HEADERS:
Authorization: Bearer &lt;user|dev jwt&gt;

REQUEST:
{
  "from": "sender@domain.com",
  "to": "to@domain.com",
  "subject": "string",
  "body": "string",
  "cc": "optional",
  "bcc": "optional"
}`}</pre>
            </article>

            <article>
              <h3>GET /api/users</h3>
              <p>Admin-only snapshot of every auth profile.</p>
            </article>

            <article>
              <h3>POST /api/users</h3>
              <p>Admin-only invite. Defaults to creating a normal user.</p>
            </article>

          <article>
            <h3>PATCH /api/users/:id</h3>
            <p>Admin-only mutation for rotating roles or forcing password resets.</p>
            <pre>{`HEADERS:
Authorization: Bearer &lt;admin jwt&gt;

REQUEST:
{
  "password": "optional string",
  "role": "admin|dev|user?",
  "mustChangePassword": boolean?
}`}</pre>
          </article>

          <article>
            <h3>DELETE /api/users/:id</h3>
            <p>Admin-only removal. Backend blocks deleting the currently authenticated admin.</p>
          </article>

            <article>
              <h3>GET /api/inbox</h3>
              <p>IMAP bridge (placeholder for future work).</p>
              <pre>{`QUERY:
account=sender@domain.com
limit=50
              `}</pre>
            </article>
          </section>
        </>
      )}
    </main>
  )
}

