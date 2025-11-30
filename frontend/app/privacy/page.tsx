"use client"

const sections = [
  {
    title: 'What We Collect',
    items: [
      'Account email, password hash, and optional display name.',
      'OAuth tokens and sender metadata required to connect Microsoft 365 / Outlook mailboxes.',
      'Audit metadata about API usage (timestamps, IP, message ids) strictly for abuse prevention.',
      'Support correspondence if you email hi@w9.nu.',
    ],
  },
  {
    title: 'How We Use Data',
    items: [
      'Authenticate you to the composer, management, and API endpoints.',
      'Send/receive SMTP, IMAP, and POP3 traffic on your behalf.',
      'Render transactional emails and inline assets for the W9 Labs network (W9 Tools + W9 Reminders).',
      'Generate operational statistics that help us plan capacity. We never sell analytics.',
    ],
  },
  {
    title: 'Third Parties',
    body:
      'We only talk to services required to deliver email: Microsoft (Graph / SMTP / IMAP / POP3), Cloudflare Turnstile for bot protection, and your selected delivery targets. No ad networks, no trackers.',
  },
  {
    title: 'Data Sharing & Disclosure',
    body:
      'We do not sell, rent, or share your data with advertisers, data brokers, or any third parties beyond what is strictly necessary to provide the service. Your email account data and OAuth tokens are: (1) used to authenticate with Microsoft 365 / Outlook services (Graph API, SMTP, IMAP, POP3) for sending and receiving email on your behalf, (2) processed by Cloudflare Turnstile for bot protection (only verification tokens, not personal data), and (3) transmitted to delivery targets you specify when sending emails. We do not transfer your data to any other services, partners, or entities. All data processing occurs on servers you control, and mail logs are stored locally only. We never share your data with advertisers or analytics companies.',
  },
  {
    title: 'Retention & Deletion',
    body:
      'You control your data. Delete an account inside /profile to revoke API tokens, remove aliases/accounts, and wipe cached events. Mail logs rotate within 30 days. Backups live inside the same region and are encrypted at rest.',
  },
  {
    title: 'Security',
    body:
      'All secrets are stored on disk using OS-level encryption. Admin access requires hardware keys. We publish security advisories on https://w9.se if an incident ever touches customer data.',
  },
  {
    title: 'Contact',
    body:
      'Email hi@w9.nu for privacy questions or to request data exports. W9 Mail is operated by W9 Labs, a non-profit collective in the EU/EEA.',
  },
]

export default function PrivacyPage() {
  return (
    <main className="app">
      <header className="header">
        <h1>Privacy Notice</h1>
        <p>W9 Mail is built in the open. This page explains what we store and how we protect it.</p>
      </header>
      {sections.map((section) => (
        <section className="box" key={section.title}>
          <h2 className="section-title">{section.title}</h2>
          {section.items ? (
            <ul className="list">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p>{section.body}</p>
          )}
        </section>
      ))}
    </main>
  )
}

