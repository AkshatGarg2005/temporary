export default function StatCard({ title, value, sub }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <p className="big">{value}</p>
      <p className="sub">{sub}</p>
    </div>
  );
}
