// Path: frontend/thermosense-client/src/components/DualAxisChart.js

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--card-bg)',
        backdropFilter: 'blur(10px)',
        border: '1px solid var(--card-border)',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: 'var(--shadow-soft)',
      }}>
        <p style={{ 
          color: 'var(--text-secondary)', 
          margin: '0 0 12px 0',
          fontSize: '0.875rem',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          {label}
        </p>
        {payload.map((entry, index) => (
          <p key={index} style={{ 
            margin: '8px 0', 
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: entry.color,
              display: 'inline-block',
              boxShadow: `0 0 10px ${entry.color}40`
            }}></span>
            <span style={{ color: 'var(--text-muted)' }}>{entry.name}:</span>
            <span style={{ 
              color: 'var(--text-primary)', 
              fontWeight: '600',
              marginLeft: 'auto'
            }}>
              {entry.value.toFixed(1)}°C
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DualAxisChart({ data }) {
  return (
    <div className="chart-wrapper">
      <h3 style={{
        margin: '0 0 24px 0',
        fontSize: '1.125rem',
        fontWeight: '600',
        color: 'var(--text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        opacity: 0.8
      }}>
        Temperature Monitoring
      </h3>
      <ResponsiveContainer width="100%" height={350}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="batteryGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f093fb" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#f093fb" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="ambientGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4facfe" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#4facfe" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="var(--card-border)"
            vertical={false}
          />
          
          <XAxis 
            dataKey="name" 
            stroke="var(--text-muted)"
            style={{ fontSize: '0.875rem' }}
            axisLine={{ stroke: 'var(--card-border)' }}
            tick={{ fill: 'var(--text-muted)' }}
          />
          
          <YAxis
            yAxisId="left"
            stroke="var(--text-muted)"
            style={{ fontSize: '0.875rem' }}
            axisLine={{ stroke: 'var(--card-border)' }}
            tick={{ fill: 'var(--text-muted)' }}
            label={{ 
              value: "Temperature (°C)", 
              angle: -90, 
              position: "insideLeft",
              style: { fill: 'var(--text-muted)', fontSize: '0.875rem' }
            }}
          />
          
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="var(--text-muted)"
            style={{ fontSize: '0.875rem' }}
            axisLine={{ stroke: 'var(--card-border)' }}
            tick={{ fill: 'var(--text-muted)' }}
            label={{ 
              value: "Ambient (°C)", 
              angle: -90, 
              position: "insideRight",
              style: { fill: 'var(--text-muted)', fontSize: '0.875rem' }
            }}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Legend 
            wrapperStyle={{
              paddingTop: '24px',
              fontSize: '0.875rem',
            }}
            iconType="circle"
            formatter={(value) => (
              <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                {value === 'battery' ? '🌡️ Battery Temperature' : '☁️ Ambient Temperature'}
              </span>
            )}
          />
          
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="battery"
            stroke="#f093fb"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#batteryGradient)"
            dot={{ 
              r: 8, 
              fill: '#f093fb',
              strokeWidth: 3,
              stroke: 'var(--bg-primary)'
            }}
            activeDot={{ 
              r: 10, 
              stroke: '#f093fb',
              strokeWidth: 2,
              fill: 'var(--text-primary)'
            }}
          />
          
          <Area
            yAxisId="right"
            type="monotone"
            dataKey="ambient"
            stroke="#4facfe"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#ambientGradient)"
            dot={{ 
              r: 8, 
              fill: '#4facfe',
              strokeWidth: 3,
              stroke: 'var(--bg-primary)'
            }}
            activeDot={{ 
              r: 10, 
              stroke: '#4facfe',
              strokeWidth: 2,
              fill: 'var(--text-primary)'
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}