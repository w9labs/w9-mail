'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface EmailAccount {
  id: string
  email: string
  displayName: string
  isActive: boolean
}

export default function ManagePage() {
  const [accounts, setAccounts] = useState<EmailAccount[]>([])
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

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api'
      const response = await fetch(`${apiUrl}/accounts`)
      if (response.ok) {
        const data = await response.json()
        setAccounts(data)
      }
    } catch (error) {
      console.error('Failed to fetch accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api'
      const response = await fetch(`${apiUrl}/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api'
      const response = await fetch(`${apiUrl}/accounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      })
      if (response.ok) {
        const data = await response.json()
        // Update the account in the local state immediately
        setAccounts(accounts.map(acc => 
          acc.id === id ? { ...acc, isActive: data.isActive } : acc
        ))
        setMessage({ type: 'success', text: `Account ${!isActive ? 'activated' : 'deactivated'} successfully` })
        // Also refresh from server to ensure consistency
        setTimeout(() => fetchAccounts(), 100)
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

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api'
      const response = await fetch(`${apiUrl}/accounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
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

  if (loading) {
    return (
      <main className="app">
        <div className="box">Loading…</div>
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
        <Link className="nav-link" href="/">Composer</Link>
        <Link className="nav-link active" href="/manage">Manage</Link>
        <Link className="nav-link" href="/docs">Docs</Link>
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
                            onKeyPress={(e) => {
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

