'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface EmailAccount {
  id: string
  email: string
  displayName: string
  isActive: boolean
}

export default function Home() {
  const [accounts, setAccounts] = useState<EmailAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    body: ''
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
        setAccounts(data.filter((acc: EmailAccount) => acc.isActive))
      }
    } catch (error) {
      console.error('Failed to fetch accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setMessage(null)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api'
      const response = await fetch(`${apiUrl}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: formData.from,
          to: formData.to,
          subject: formData.subject,
          body: formData.body,
          cc: formData.cc || undefined,
          bcc: formData.bcc || undefined
        })
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Email sent successfully!' })
        setFormData({
          from: formData.from,
          to: '',
          cc: '',
          bcc: '',
          subject: '',
          body: ''
        })
      } else {
        const error = await response.json().catch(() => ({ message: 'Failed to send email' }))
        setMessage({ type: 'error', text: error.message || 'Failed to send email' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <main className="app">
        <div className="box">Loading...</div>
      </main>
    )
  }

  return (
    <main className="app">
      <header className="header">
        <h1>W9 Mail</h1>
        <p>Microsoft SMTP relay / Monochrome Utility Panel</p>
      </header>

      <nav className="nav">
        <Link className="nav-link active" href="/">Composer</Link>
        <Link className="nav-link" href="/manage">Manage</Link>
        <Link className="nav-link" href="/docs">Docs</Link>
      </nav>

      {message && <div className={`status ${message.type}`}>{message.text}</div>}

      <section className="box">
        <h2 className="section-title">Email Composer</h2>
        <form className="form" onSubmit={handleSubmit}>
          <div className="row">
            <label htmlFor="from">From (sender)</label>
            <select
              id="from"
              value={formData.from}
              onChange={(e) => setFormData({ ...formData, from: e.target.value })}
              required
            >
              <option value="">Select sender account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.email}>
                  {account.displayName} ({account.email})
                </option>
              ))}
            </select>
          </div>

          <div className="row">
            <label htmlFor="to">To (receiver)</label>
            <input
              type="text"
              id="to"
              value={formData.to}
              onChange={(e) => setFormData({ ...formData, to: e.target.value })}
              placeholder="recipient@example.com"
              required
            />
            <small>Separate multiple emails with commas</small>
          </div>

          <div className="row">
            <label htmlFor="cc">CC</label>
            <input
              type="text"
              id="cc"
              value={formData.cc}
              onChange={(e) => setFormData({ ...formData, cc: e.target.value })}
              placeholder="cc@example.com"
            />
          </div>

          <div className="row">
            <label htmlFor="bcc">BCC</label>
            <input
              type="text"
              id="bcc"
              value={formData.bcc}
              onChange={(e) => setFormData({ ...formData, bcc: e.target.value })}
              placeholder="bcc@example.com"
            />
          </div>

          <div className="row">
            <label htmlFor="subject">Title</label>
            <input
              type="text"
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Email subject"
              required
            />
          </div>

          <div className="row">
            <label htmlFor="body">Contents</label>
            <textarea
              id="body"
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              placeholder="Email content"
              required
            />
          </div>

          <button
            className="button"
            type="submit"
            disabled={sending || !formData.from || !formData.to || !formData.subject || !formData.body}
          >
            {sending ? 'Sending…' : 'Send Email'}
          </button>
        </form>
      </section>

      <section className="box">
        <h2 className="section-title">Console Notes</h2>
        <ul className="list">
          <li>Sender accounts are managed under /manage.</li>
          <li>Use commas to separate multiple recipients, CC, or BCC entries.</li>
          <li>SMTP relay authenticates with the stored password (consider app passwords).</li>
          <li>Keep the interface monochrome—flip colors by editing the `:root` tokens.</li>
        </ul>
      </section>
    </main>
  )
}
