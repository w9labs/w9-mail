'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from '../../lib/session'

interface EmailAccount {
  id: string
  email: string
  displayName: string
  isActive: boolean
}

interface UserSummary {
  id: string
  email: string
  role: RoleOption
  mustChangePassword: boolean
}

type RoleOption = 'admin' | 'dev' | 'user'

export default function ManagePage() {
  const { session, logout } = useSession()
  const [accounts, setAccounts] = useState<EmailAccount[]>([])
  const [users, setUsers] = useState<UserSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [editingPassword, setEditingPassword] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    displayName: '',
    password: '',
    isActive: true
  })
  const [userForm, setUserForm] = useState<{
    email: string
    password: string
    role: RoleOption
  }>({
    email: '',
    password: '',
    role: 'user'
  })
  const [editingUserPassword, setEditingUserPassword] = useState<string | null>(null)
  const [userPassword, setUserPassword] = useState('')

  useEffect(() => {
    if (!session?.token) {
      setLoading(false)
      return
    }
    const bootstrap = async () => {
      await Promise.all([fetchAccounts(), fetchUsers()])
      setLoading(false)
    }
    bootstrap()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.token])

  const fetchAccounts = async () => {
    if (!session?.token) return
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api'
      const response = await fetch(`${apiUrl}/accounts`, {
        headers: { Authorization: `Bearer ${session.token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setAccounts(data)
      } else if (response.status === 401) {
        logout()
      }
    } catch (error) {
      console.error('Failed to fetch accounts:', error)
    }
  }

  const fetchUsers = async () => {
    if (!session?.token) return
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api'
      const response = await fetch(`${apiUrl}/users`, {
        headers: { Authorization: `Bearer ${session.token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.token) return
    setMessage(null)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api'
      const response = await fetch(`${apiUrl}/accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`
        },
        body: JSON.stringify(formData)
      })
      const data = await response.json()

      if (response.ok && data.status === 'success') {
        setMessage({ type: 'success', text: data.message || 'Account created successfully!' })
        fetchAccounts()
        setFormData({ email: '', displayName: '', password: '', isActive: true })
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to create account' })
      }
    } catch (error) {
      console.error('Failed to create account:', error)
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    }
  }

  const toggleActive = async (id: string, isActive: boolean) => {
    if (!session?.token) return
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api'
      const response = await fetch(`${apiUrl}/accounts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`
        },
        body: JSON.stringify({ isActive: !isActive })
      })
      if (response.ok) {
        const data = await response.json()
        setAccounts((prev) => prev.map((acc) => (acc.id === id ? { ...acc, isActive: data.isActive } : acc)))
        setMessage({ type: 'success', text: `Account ${!isActive ? 'activated' : 'deactivated'} successfully` })
      } else {
        const error = await response.json().catch(() => ({ message: 'Failed to update account' }))
        setMessage({ type: 'error', text: error.message || 'Failed to update account' })
      }
    } catch (error) {
      console.error('Failed to update account:', error)
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    }
  }

  const handlePasswordChange = async (id: string) => {
    if (!newPassword.trim()) {
      setMessage({ type: 'error', text: 'Password cannot be empty' })
      return
    }
    if (!session?.token) return

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api'
      const response = await fetch(`${apiUrl}/accounts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`
        },
        body: JSON.stringify({ password: newPassword })
      })
      if (response.ok) {
        setMessage({ type: 'success', text: 'Password updated successfully' })
        setEditingPassword(null)
        setNewPassword('')
      } else {
        const error = await response.json().catch(() => ({ message: 'Failed to update password' }))
        setMessage({ type: 'error', text: error.message || 'Failed to update password' })
      }
    } catch (error) {
      console.error('Failed to update password:', error)
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    }
  }

  const handleDeleteAccount = async (id: string) => {
    if (!session?.token) return
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api'
      const response = await fetch(`${apiUrl}/accounts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.token}` }
      })
      if (response.ok || response.status === 204) {
        setAccounts((prev) => prev.filter((acc) => acc.id !== id))
        setMessage({ type: 'success', text: 'Account removed' })
      } else {
        const error = await response.json().catch(() => ({ message: 'Failed to delete account' }))
        setMessage({ type: 'error', text: error.message || 'Failed to delete account' })
      }
    } catch (error) {
      console.error('Failed to delete account:', error)
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    }
  }

  const handleUserCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.token) return
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api'
      const response = await fetch(`${apiUrl}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`
        },
        body: JSON.stringify(userForm)
      })
      if (response.ok) {
        setMessage({ type: 'success', text: 'User created' })
        setUserForm({ email: '', password: '', role: 'user' })
        fetchUsers()
      } else {
        const error = await response.json().catch(() => ({ message: 'Failed to create user' }))
        setMessage({ type: 'error', text: error.message || 'Failed to create user' })
      }
    } catch (error) {
      console.error('Failed to create user:', error)
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    }
  }

  const handleUserPasswordChange = async (id: string) => {
    if (!session?.token) return
    if (!userPassword.trim()) {
      setMessage({ type: 'error', text: 'Password cannot be empty' })
      return
    }
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api'
      const response = await fetch(`${apiUrl}/users/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`
        },
        body: JSON.stringify({ password: userPassword })
      })
      if (response.ok) {
        setMessage({ type: 'success', text: 'User password updated' })
        setEditingUserPassword(null)
        setUserPassword('')
        fetchUsers()
      } else {
        const error = await response.json().catch(() => ({ message: 'Failed to update password' }))
        setMessage({ type: 'error', text: error.message || 'Failed to update password' })
      }
    } catch (error) {
      console.error('Failed to update user password:', error)
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    }
  }

  const handleUserDelete = async (id: string) => {
    if (!session?.token) return
    if (!window.confirm('Delete this user? This cannot be undone.')) {
      return
    }
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api'
      const response = await fetch(`${apiUrl}/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.token}` }
      })
      if (response.ok || response.status === 204) {
        setMessage({ type: 'success', text: 'User deleted' })
        setUsers((prev) => prev.filter((u) => u.id !== id))
      } else {
        const error = await response.json().catch(() => ({ message: 'Failed to delete user' }))
        setMessage({ type: 'error', text: error.message || 'Failed to delete user' })
      }
    } catch (error) {
      console.error('Failed to delete user:', error)
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    }
  }

  const requiresAdmin = session && session.role !== 'admin'

  if (loading) {
    return (
      <main className="app">
        <div className="box">Loading…</div>
      </main>
    )
  }

  if (!session) {
    return (
      <main className="app">
        <header className="header">
          <h1>W9 Mail / Accounts</h1>
          <p>Admin login required to touch the mailing database.</p>
        </header>
        <section className="box">
          <p>Authenticate before managing sender accounts.</p>
          <Link className="button" href="/login">
            Sign in
          </Link>
        </section>
      </main>
    )
  }

  if (requiresAdmin) {
    return (
      <main className="app">
        <header className="header">
          <h1>W9 Mail / Accounts</h1>
          <p>Only admins can manage the Microsoft sender registry.</p>
        </header>
        <section className="box">
          <p>This section is locked. Sign in with an admin profile.</p>
          <button className="button subtle" onClick={logout}>
            Switch account
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="app">
      <header className="header">
        <h1>W9 Mail / Accounts</h1>
        <p>Register Microsoft senders, flip activation, rotate secrets.</p>
      </header>

      <nav className="nav">
        <Link className="nav-link" href="/">
          Composer
        </Link>
        <Link className="nav-link active" href="/manage">
          Manage
        </Link>
        <Link className="nav-link" href="/docs">
          Docs
        </Link>
      </nav>

      {message && <div className={`status ${message.type}`}>{message.text}</div>}

      <section className="box">
        <h2 className="section-title">Add Email Account</h2>
        <form className="form" onSubmit={handleSubmit}>
          <div className="row">
            <label>Email</label>
            <input
              type="email"
              placeholder="sender@domain.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div className="row">
            <label>Display name</label>
            <input
              type="text"
              placeholder="Operations Bot"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              required
            />
          </div>
          <div className="row">
            <label>Password / App password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>
          <label>
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            />{' '}
            active
          </label>
          <button className="button" type="submit">
            Add account
          </button>
        </form>
      </section>

      <section className="box">
        <h2 className="section-title">Account registry</h2>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Display</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id}>
                  <td>{account.email}</td>
                  <td>{account.displayName}</td>
                  <td>{account.isActive ? 'Active' : 'Inactive'}</td>
                  <td>
                    <div className="actions">
                      <button onClick={() => toggleActive(account.id, account.isActive)}>
                        {account.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      {editingPassword === account.id ? (
                        <div className="password-inline">
                          <input
                            type="password"
                            placeholder="New password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handlePasswordChange(account.id)
                              }
                            }}
                          />
                          <button onClick={() => handlePasswordChange(account.id)}>Save</button>
                          <button
                            onClick={() => {
                              setEditingPassword(null)
                              setNewPassword('')
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingPassword(account.id)
                            setNewPassword('')
                          }}
                        >
                          Change password
                        </button>
                      )}
                      <button onClick={() => handleDeleteAccount(account.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="box">
        <h2 className="section-title">User access</h2>
        <form className="form" onSubmit={handleUserCreate}>
          <div className="row">
            <label>User email</label>
            <input
              type="email"
              value={userForm.email}
              onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              required
            />
          </div>
          <div className="row">
            <label>Temporary password</label>
            <input
              type="password"
              value={userForm.password}
              onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
              required
            />
          </div>
          <div className="row">
            <label>Role</label>
            <select
              value={userForm.role}
              onChange={(e) => setUserForm({ ...userForm, role: e.target.value as RoleOption })}
            >
              <option value="user">Normal user</option>
              <option value="dev">Developer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button className="button" type="submit">
            Invite user
          </button>
        </form>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Must change password</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>{user.mustChangePassword ? 'Yes' : 'No'}</td>
                  <td>
                    <div className="actions">
                      {editingUserPassword === user.id ? (
                        <>
                          <input
                            type="password"
                            placeholder="New password"
                            value={userPassword}
                            onChange={(e) => setUserPassword(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleUserPasswordChange(user.id)
                              }
                            }}
                          />
                          <button onClick={() => handleUserPasswordChange(user.id)}>Save</button>
                          <button
                            onClick={() => {
                              setEditingUserPassword(null)
                              setUserPassword('')
                            }}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingUserPassword(user.id)
                            setUserPassword('')
                          }}
                        >
                          Change password
                        </button>
                      )}
                      <button onClick={() => handleUserDelete(user.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}

