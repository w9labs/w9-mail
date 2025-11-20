import Link from 'next/link'

export default function DocsPage() {
  return (
    <main className="app">
      <header className="header">
        <h1>W9 Mail / API Sheet</h1>
        <p>Monochrome reference for the HTTP surface.</p>
      </header>

      <nav className="nav">
        <Link className="nav-link" href="/">Composer</Link>
        <Link className="nav-link" href="/manage">Manage</Link>
        <Link className="nav-link active" href="/docs">Docs</Link>
      </nav>

      <section className="box">
        <h2 className="section-title">Base URL</h2>
        <code>http://localhost:8080/api</code>
        <p>Replace host with your deployed domain (e.g., https://w9.nu/api).</p>
      </section>

      <section className="box">
        <h2 className="section-title">Endpoints</h2>

        <article>
          <h3>GET /api/accounts</h3>
          <p>List all sender profiles.</p>
          <pre>{`RESPONSE:
[
  {
    "id": "uuid",
    "email": "ops@domain.com",
    "displayName": "Ops Bot",
    "isActive": true
  }
]
          `}</pre>
        </article>

        <article>
          <h3>POST /api/accounts</h3>
          <p>Create a new sender (stores password for SMTP authentication).</p>
          <pre>{`REQUEST:
{
  "email": "string",
  "displayName": "string",
  "password": "string",
  "isActive": boolean
}
          `}</pre>
        </article>

        <article>
          <h3>PATCH /api/accounts/:id</h3>
          <p>Toggle activation and/or rotate password.</p>
          <pre>{`REQUEST:
{
  "isActive": boolean?,
  "password": "string?"
}
          `}</pre>
        </article>

        <article>
          <h3>POST /api/send</h3>
          <pre>{`REQUEST:
{
  "from": "sender@domain.com",
  "to": "to@domain.com",
  "subject": "string",
  "body": "string",
  "cc": "optional",
  "bcc": "optional"
}
          `}</pre>
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
    </main>
  )
}

