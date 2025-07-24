// Path: frontend/thermosense-client/src/components/StatCard.jsx

export default function StatCard({ 
  title, 
  value, 
  sub, 
  unit, 
  icon, 
  colour, 
  gradient,
  className = "",
  style = {} 
}) {
  const getGradientClass = () => {
    switch (gradient) {
      case 'safe':
        return 'gradient-safe';
      case 'warning':
        return 'gradient-warning';
      case 'danger':
        return 'gradient-danger';
      default:
        return '';
    }
  };

  const cardStyle = {
    ...style,
    borderColor: colour || "transparent"
  };

  if (gradient) {
    cardStyle.background = `linear-gradient(135deg, 
      ${gradient === 'safe' ? 'rgba(79, 172, 254, 0.05), rgba(0, 242, 254, 0.05)' :
        gradient === 'warning' ? 'rgba(250, 112, 154, 0.05), rgba(254, 225, 64, 0.05)' :
        gradient === 'danger' ? 'rgba(248, 80, 50, 0.05), rgba(231, 56, 39, 0.05)' :
        'var(--card-bg)'}
    )`;
  }

  return (
    <div className={`card ${className}`} style={cardStyle}>
      <div style={{ position: 'relative' }}>
        {icon && (
          <div style={{
            position: 'absolute',
            right: 0,
            top: -10,
            fontSize: '2rem',
            opacity: 0.2,
            transform: 'rotate(-15deg)',
            filter: 'blur(1px)'
          }}>
            {icon}
          </div>
        )}
        <h3>{title}</h3>
        <p className="big">
          {value}
          {unit && <span style={{ fontSize: '0.6em', opacity: 0.7 }}>{unit}</span>}
        </p>
        <p className="sub">{sub}</p>
      </div>
    </div>
  );
}