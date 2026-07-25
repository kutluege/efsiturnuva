// Sends the admin (owner) key to the creator's email address.
//
// The app is a static Vite site with no backend, so email goes out through
// EmailJS (https://www.emailjs.com — free tier is enough). Configure three
// env vars (see .env.example); without them we fall back to opening the
// user's own mail client with a pre-filled message via mailto:.

const cfg = {
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID,
  templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY
}

export const isEmailConfigured = Boolean(cfg.serviceId && cfg.templateId && cfg.publicKey)

export async function sendAdminKeyEmail({ toEmail, leagueName, leagueId, adminKey }) {
  if (!isEmailConfigured) return false
  const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: cfg.serviceId,
      template_id: cfg.templateId,
      user_id: cfg.publicKey,
      template_params: {
        to_email: toEmail,
        league_name: leagueName,
        league_id: leagueId,
        admin_key: adminKey,
        join_url: `${window.location.origin}${window.location.pathname}?join=${leagueId}`
      }
    })
  })
  return res.ok
}

export function openAdminKeyMailto({ toEmail, leagueName, leagueId, adminKey }) {
  const subject = encodeURIComponent(`${leagueName} — Yönetici ID`)
  const body = encodeURIComponent(
    `Merhaba,\n\n${leagueName} ligi için yönetim bilgilerin:\n\n` +
    `Lig Kodu: ${leagueId}\nYönetici ID: ${adminKey}\n\n` +
    `Başka bir cihazdan yönetici olarak devam etmek için lig koduyla birlikte bu Yönetici ID gerekir.\n` +
    `Canlı izleme bağlantısı: ${window.location.origin}${window.location.pathname}?join=${leagueId}\n\nİyi maçlar!`
  )
  window.open(`mailto:${encodeURIComponent(toEmail)}?subject=${subject}&body=${body}`)
}
