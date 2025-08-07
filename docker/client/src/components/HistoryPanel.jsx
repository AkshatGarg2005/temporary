// Path: frontend/thermosense-client/src/components/HistoryPanel.jsx

import { useState } from "react";

export default function HistoryPanel({ history, onClose, onClear, onDelete }) {
  const [expandedItem, setExpandedItem] = useState(null);

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getAlertIcon = (level) => {
    switch (level) {
      case "danger":
        return "⚠️";
      case "warning":
        return "⚡";
      default:
        return "✅";
    }
  };

  const getAlertColor = (level) => {
    switch (level) {
      case "danger":
        return "#f85032";
      case "warning":
        return "#fa709a";
      default:
        return "#4facfe";
    }
  };

  const exportHistory = () => {
    const dataStr = JSON.stringify(history, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `thermosense-history-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: '20px',
        width: '90%',
        maxWidth: '1000px',
        maxHeight: '85vh',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        animation: 'slideUp 0.3s ease-out'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid var(--card-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--card-bg)'
        }}>
          <div>
            <h2 style={{
              margin: 0,
              fontSize: '1.5rem',
              fontWeight: '700',
              color: 'var(--text-primary)'
            }}>
              📊 History Log
            </h2>
            <p style={{
              margin: '4px 0 0 0',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)'
            }}>
              {history.length} recordings • Last 50 entries saved
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={exportHistory}
              style={{
                padding: '8px 16px',
                background: 'rgba(102, 126, 234, 0.1)',
                border: '1px solid rgba(102, 126, 234, 0.3)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.background = 'rgba(102, 126, 234, 0.2)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'rgba(102, 126, 234, 0.1)';
              }}
            >
              📥 Export JSON
            </button>
            <button
              onClick={onClear}
              style={{
                padding: '8px 16px',
                background: 'rgba(248, 80, 50, 0.1)',
                border: '1px solid rgba(248, 80, 50, 0.3)',
                borderRadius: '8px',
                color: '#f85032',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.background = 'rgba(248, 80, 50, 0.2)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'rgba(248, 80, 50, 0.1)';
              }}
            >
              🗑️ Clear All
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '1.25rem',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'var(--card-bg)';
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{
          padding: '24px',
          overflowY: 'auto',
          maxHeight: 'calc(85vh - 100px)'
        }}>
          {history.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: 'var(--text-secondary)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.5 }}>📭</div>
              <p style={{ fontSize: '1.125rem', marginBottom: '8px' }}>No history yet</p>
              <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>
                Data will be recorded every 30 seconds when the dashboard updates
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {history.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '12px',
                    padding: '16px',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.3)';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = 'var(--card-border)';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  {/* Summary Row */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      {/* Alert Level */}
                      <div style={{
                        padding: '4px 12px',
                        borderRadius: '20px',
                        background: `${getAlertColor(item.advisory?.alert_level)}20`,
                        border: `1px solid ${getAlertColor(item.advisory?.alert_level)}40`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <span>{getAlertIcon(item.advisory?.alert_level)}</span>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          color: getAlertColor(item.advisory?.alert_level),
                          textTransform: 'uppercase'
                        }}>
                          {item.advisory?.alert_level || 'Unknown'}
                        </span>
                      </div>

                      {/* Timestamp */}
                      <span style={{
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)'
                      }}>
                        {formatDate(item.timestamp)}
                      </span>

                      {/* Key Metrics */}
                      <div style={{
                        display: 'flex',
                        gap: '20px',
                        fontSize: '0.875rem',
                        color: 'var(--text-muted)'
                      }}>
                        {item.stats.battery_temp != null && (
                          <span>🌡️ {item.stats.battery_temp.toFixed(1)}°C</span>
                        )}
                        {item.stats.cpu_temp != null && !item.stats.battery_temp && (
                          <span>💻 {item.stats.cpu_temp.toFixed(1)}°C</span>
                        )}
                        <span>⚙️ {item.stats.cpu_load.toFixed(1)}%</span>
                        <span>🔋 {item.stats.battery_percent?.toFixed(0) || 'N/A'}%</span>
                        {item.stats.charging && <span>⚡ Charging</span>}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontSize: '0.875rem',
                        color: 'var(--text-muted)',
                        transform: expandedItem === item.id ? 'rotate(180deg)' : 'rotate(0)',
                        transition: 'transform 0.3s ease'
                      }}>
                        ▼
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(item.id);
                        }}
                        style={{
                          padding: '4px 8px',
                          background: 'rgba(248, 80, 50, 0.1)',
                          border: '1px solid rgba(248, 80, 50, 0.2)',
                          borderRadius: '6px',
                          color: '#f85032',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => {
                          e.target.style.background = 'rgba(248, 80, 50, 0.2)';
                        }}
                        onMouseOut={(e) => {
                          e.target.style.background = 'rgba(248, 80, 50, 0.1)';
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedItem === item.id && (
                    <div style={{
                      marginTop: '16px',
                      paddingTop: '16px',
                      borderTop: '1px solid var(--card-border)'
                    }}>
                      {/* Advisory Details */}
                      {item.advisory && (
                        <div style={{ marginBottom: '16px' }}>
                          <h4 style={{
                            margin: '0 0 8px 0',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: 'var(--text-secondary)',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                          }}>
                            Advisory
                          </h4>
                          <p style={{
                            margin: '4px 0',
                            fontSize: '0.875rem',
                            color: 'var(--text-primary)',
                            lineHeight: 1.5
                          }}>
                            {item.advisory.natural_language_tip}
                          </p>
                          {item.advisory.optional_action && (
                            <p style={{
                              margin: '8px 0',
                              padding: '8px 12px',
                              background: 'rgba(102, 126, 234, 0.1)',
                              borderRadius: '8px',
                              fontSize: '0.875rem',
                              color: 'var(--text-secondary)'
                            }}>
                              👉 {item.advisory.optional_action}
                            </p>
                          )}
                          <p style={{
                            margin: '8px 0 0 0',
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            fontFamily: 'monospace'
                          }}>
                            Impact Score: {item.advisory.predicted_health_impact.toFixed(5)}
                          </p>
                        </div>
                      )}

                      {/* System Stats Grid */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: '12px'
                      }}>
                        {item.stats.battery_percent != null && (
                          <div style={{
                            padding: '8px',
                            background: 'rgba(255, 255, 255, 0.02)',
                            borderRadius: '8px'
                          }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Battery</div>
                            <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                              {item.stats.battery_percent}%
                            </div>
                          </div>
                        )}
                        {item.stats.battery_temp != null && (
                          <div style={{
                            padding: '8px',
                            background: 'rgba(255, 255, 255, 0.02)',
                            borderRadius: '8px'
                          }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Battery Temp</div>
                            <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                              {item.stats.battery_temp.toFixed(1)}°C
                            </div>
                          </div>
                        )}
                        {item.stats.cpu_temp != null && (
                          <div style={{
                            padding: '8px',
                            background: 'rgba(255, 255, 255, 0.02)',
                            borderRadius: '8px'
                          }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CPU Temp</div>
                            <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                              {item.stats.cpu_temp.toFixed(1)}°C
                            </div>
                          </div>
                        )}
                        <div style={{
                          padding: '8px',
                          background: 'rgba(255, 255, 255, 0.02)',
                          borderRadius: '8px'
                        }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CPU Load</div>
                          <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                            {item.stats.cpu_load.toFixed(1)}%
                          </div>
                        </div>
                        <div style={{
                          padding: '8px',
                          background: 'rgba(255, 255, 255, 0.02)',
                          borderRadius: '8px'
                        }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Memory</div>
                          <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                            {item.stats.mem_percent.toFixed(1)}%
                          </div>
                        </div>
                        {item.weather && (
                          <div style={{
                            padding: '8px',
                            background: 'rgba(255, 255, 255, 0.02)',
                            borderRadius: '8px'
                          }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ambient</div>
                            <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                              {item.weather.temp.toFixed(1)}°C
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Weather Info */}
                      {item.weather && (
                        <div style={{
                          marginTop: '12px',
                          padding: '8px',
                          background: 'rgba(79, 172, 254, 0.05)',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          color: 'var(--text-secondary)'
                        }}>
                          ☁️ {item.weather.main} in {item.weather.name}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}