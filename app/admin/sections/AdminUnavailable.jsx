export default function AdminUnavailable({ title, message }) {
  return <section className="adm-card" style={{ padding: 24 }} aria-label={title}>
    <h2>{title}</h2>
    <p role="status">{message}</p>
    <button className="adm-btn adm-btn-outline" type="button" disabled>Unavailable</button>
  </section>;
}
