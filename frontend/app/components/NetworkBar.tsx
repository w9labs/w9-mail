import Link from 'next/link'

interface NetworkLink {
  id: 'tools' | 'mail' | 'reminders'
  label: string
  description: string
  href: string
  external?: boolean
}

const NETWORK_LINKS: NetworkLink[] = [
  {
    id: 'tools',
    label: 'W9 Tools',
    description: 'w9.se · Short links & drops',
    href: 'https://w9.se',
    external: true,
  },
  {
    id: 'mail',
    label: 'W9 Mail',
    description: 'w9.nu · Transactional email',
    href: '/',
  },
  {
    id: 'reminders',
    label: 'W9 Daily Reminders',
    description: 'reminder.w9.nu · Calendar digest',
    href: 'https://reminder.w9.nu',
    external: true,
  },
]

export default function NetworkBar() {
  return (
    <div className="network-bar">
      <div>
        <span className="network-label">W9 Labs Network</span>
        <span className="network-tagline">Open-source infrastructure for independent teams</span>
      </div>
      <nav className="network-links">
        {NETWORK_LINKS.map((link) =>
          link.external ? (
            <a key={link.id} href={link.href} target="_blank" rel="noreferrer" className={`network-link ${link.id === 'mail' ? 'active' : ''}`}>
              <span>{link.label}</span>
              <small>{link.description}</small>
            </a>
          ) : (
            <Link key={link.id} href={link.href} className={`network-link ${link.id === 'mail' ? 'active' : ''}`}>
              <span>{link.label}</span>
              <small>{link.description}</small>
            </Link>
          ),
        )}
      </nav>
    </div>
  )
}

