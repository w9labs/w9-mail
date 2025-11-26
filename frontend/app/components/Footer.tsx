import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-columns">
        <div>
          <div className="footer-title">Developed by W9 Labs</div>
          <p className="footer-copy">
            W9 Mail keeps SMTP/IMAP/POP3 automation accessible for small teams. Infrastructure is open-source, community audited, and
            maintained by W9 Labs. Reach us at <a href="mailto:hi@w9.nu">hi@w9.nu</a>.
          </p>
        </div>
        <div>
          <div className="footer-title">Network</div>
          <ul className="footer-links">
            <li>
              <a href="https://w9.se" target="_blank" rel="noreferrer">
                W9 Tools · Links & drops
              </a>
            </li>
            <li>
              <a href="https://w9.nu" target="_blank" rel="noreferrer">
                W9 Mail · Transactional rail
              </a>
            </li>
            <li>
              <a href="https://reminder.w9.nu" target="_blank" rel="noreferrer">
                W9 Daily Reminders · Calendar digest
              </a>
            </li>
          </ul>
        </div>
        <div>
          <div className="footer-title">Legal</div>
          <ul className="footer-links">
            <li>
              <Link href="/terms">Terms of Service</Link>
            </li>
            <li>
              <Link href="/privacy">Privacy Notice</Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">© {new Date().getFullYear()} W9 Labs · Open infrastructure for independent teams.</div>
    </footer>
  )
}

