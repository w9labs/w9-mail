export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-columns">
        <div>
          <div className="footer-title">Other Projects</div>
          <ul className="footer-links">
            <li>
              <a href="https://w9.se" target="_blank" rel="noreferrer">
                W9 Tools · Drop console
              </a>
            </li>
            <li>
              <a href="https://w9.nu" target="_blank" rel="noreferrer">
                W9 Mail · Delivery rail
              </a>
            </li>
          </ul>
        </div>
        <div>
          <div className="footer-title">W9 Systems AB</div>
          <p className="footer-copy">
            Monochrome infrastructure for regulated senders. Reach us at{' '}
            <a href="mailto:hello@w9.nu">hello@w9.nu</a>.
          </p>
        </div>
      </div>
    </footer>
  )
}

