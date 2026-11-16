// Friendly banner at the top of each dashboard.
export function greeting(name) {
  const h = new Date().getHours()
  const part = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
  return `${part}${name ? `, ${name}` : ''}`
}

export default function Hero({ title, text, action }) {
  return (
    <section className="relative overflow-hidden rounded-ui bg-linear-to-br from-primary to-primary/70 p-6 text-primary-fg shadow-soft sm:p-8">
      <span className="pointer-events-none absolute -right-10 -top-12 h-48 w-48 rounded-full bg-primary-fg/10" />
      <span className="pointer-events-none absolute -bottom-16 right-24 h-40 w-40 rounded-full bg-primary-fg/10" />
      <span className="pointer-events-none absolute bottom-6 right-6 hidden h-16 w-16 rounded-full bg-primary-fg/15 sm:block" />
      <div className="relative max-w-lg space-y-2">
        <h1 className="text-title font-semibold">{title}</h1>
        {text && <p className="opacity-90">{text}</p>}
        {action && <div className="pt-2">{action}</div>}
      </div>
    </section>
  )
}
