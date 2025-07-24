export default function StatCard({ title, value, sub, colour }) {
  return (
    <div className="card" style={{ borderColor: colour || "transparent" }}>
      <h3>{title}</h3>
      <p className="big">{value}</p>
      <p className="sub">{sub}</p>
    </div>
  );
}
