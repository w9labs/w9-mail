"use client"

const obligations = [
  'Use the service for legitimate transactional or operational email only. No spam or purchased lists.',
  'Protect your API keys and rotate them if you suspect compromise.',
  'Respect rate limits and Microsoft service terms when connecting tenant mailboxes.',
  'Immediately remove regulated data (PHI, PCI, etc.) unless you have your own compliance wrapper.',
]

const disclaimers = [
  'Service is provided “as is.” Downtime, provider outages, or upstream API changes can interrupt delivery.',
  'W9 Labs is not liable for lost business, incidental, or consequential damages.',
  'AI-generated copy or attachments supplied by other W9 products (e.g., W9 Daily Reminders) should be reviewed before forwarding.',
  'We can suspend or delete accounts that violate these terms or EU anti-spam directives.',
]

export default function TermsPage() {
  return (
    <main className="app">
      <header className="header">
        <h1>Terms of Service</h1>
        <p>W9 Mail is part of the W9 Labs network. Using it means you accept the responsibilities below.</p>
      </header>
      <section className="box">
        <h2 className="section-title">Scope</h2>
        <p>
          W9 Mail provides a self-hostable API + dashboard for Microsoft 365 / Outlook SMTP, IMAP, and POP3 automation. Accounts may be
          used together with other W9 Labs projects (W9 Tools, W9 Daily Reminders) or your own custom automations.
        </p>
      </section>
      <section className="box">
        <h2 className="section-title">User Responsibilities</h2>
        <ul className="list">
          {obligations.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      <section className="box">
        <h2 className="section-title">Security & Access</h2>
        <p>
          Admins can invite teammates, set per-sender privileges, and audit usage from /manage. Multi-factor auth and password rotation
          are mandatory for staff accounts. Abuse, phishing, or suspicious bursts will be throttled automatically.
        </p>
      </section>
      <section className="box">
        <h2 className="section-title">Integrations</h2>
        <p>
          When you enable cross-project features (e.g., letting W9 Daily Reminders send via your tenant), you authorize us to relay
          templated content and inline images through selected mailboxes. Disable a sender to revoke that permission instantly.
        </p>
      </section>
      <section className="box">
        <h2 className="section-title">Disclaimers</h2>
        <ul className="list">
          {disclaimers.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      <section className="box">
        <h2 className="section-title">Changes</h2>
        <p>
          Terms may evolve as Microsoft or EU law changes. We will highlight meaningful updates inside the dashboard changelog and on
          w9.se. Continued use after an update equals acceptance.
        </p>
      </section>
      <section className="box">
        <h2 className="section-title">Contact</h2>
        <p>
          Operated by W9 Labs (EU/EEA). Email <a href="mailto:hi@w9.nu">hi@w9.nu</a> for legal questions, data exports, or incident
          reports.
        </p>
      </section>
    </main>
  )
}

