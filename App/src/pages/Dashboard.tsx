import React from 'react';
import { useNavigate } from 'react-router-dom';

const kpis = [
  { label: 'Total Pipeline', value: '$26.4M', sub: '↑ 18% from last quarter', color: '#10b981' },
  { label: 'Already Won', value: '$7.71M', sub: '', color: '#22c55e' },
  { label: 'AI Forecast', value: '$20.4M', sub: '', color: '#8b5cf6' },
  { label: 'Seller Commit', value: '$18.1M', sub: '≈ 65% of target', color: '#f59e0b' },
];

const teamRows = [
  { team: 'John Mitchell', role: 'CRO', target: '$26.4M', ai: '$20.4M', commit: '$18.1M' },
  { team: 'Maria Thompson', role: 'VP Sales - Enterprise', target: '$18.5M', ai: '$7.8M', commit: '$7.0M' },
  { team: 'Robert Anderson', role: 'VP Sales - Mid-Market', target: '$6.5M', ai: '$3.2M', commit: '$2.8M' },
];

const chartConfig = { width: 800, height: 220, padding: 40 };

function makePath(points: number[], width: number, height: number, padding: number) {
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;
  const maxY = Math.max(...points);
  const stepX = innerW / (points.length - 1);
  return points
    .map((y, i) => {
      const x = padding + i * stepX;
      const yScaled = padding + (1 - y / maxY) * innerH;
      return `${i === 0 ? 'M' : 'L'} ${x} ${yScaled}`;
    })
    .join(' ');
}

const Legend = ({ color, label }: { color: string; label: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    <span style={{ width: 12, height: 4, background: color, borderRadius: 2 }} />
    <span style={{ color: '#6b7280', fontSize: 12 }}>{label}</span>
  </div>
);

const Card = ({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) => (
  <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 10, height: 10, background: color, borderRadius: 9999 }} />
      <span style={{ color: '#6b7280', fontSize: 12 }}>{label}</span>
    </div>
    <span style={{ fontSize: 24, fontWeight: 700 }}>{value}</span>
    {sub ? <span style={{ color: '#10b981', fontSize: 12 }}>{sub}</span> : null}
  </div>
);

const Table = () => (
  <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <button style={{ padding: '6px 10px' }}>Team View</button>
        <button style={{ padding: '6px 10px' }}>Analytics</button>
      </div>
      <button style={{ padding: '6px 10px', background: '#2563eb', color: '#fff', border: 0, borderRadius: 8 }}>Submit Forecast</button>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '10px 16px', color: '#6b7280', fontWeight: 600, borderBottom: '1px solid #e5e7eb' }}>
      <div>Team</div>
      <div>Target</div>
      <div>AI Forecast</div>
      <div>Seller Commit</div>
    </div>
    {teamRows.map((r, idx) => (
      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '12px 16px', borderBottom: '1px solid #f3f4f6' }}>
        <div>
          <div style={{ fontWeight: 600 }}>{r.team}</div>
          <div style={{ color: '#6b7280', fontSize: 12 }}>{r.role}</div>
        </div>
        <div>{r.target}</div>
        <div>{r.ai}</div>
        <div>{r.commit}</div>
      </div>
    ))}
  </div>
);

const ForecastChart = () => {
  const { width, height, padding } = chartConfig;
  const ai = makePath([1, 2, 5, 9, 12, 15, 18, 21, 23, 24, 25], width, height, padding);
  const commit = makePath([1, 1.5, 2.5, 4, 6, 8, 10, 12, 14, 15.5, 17], width, height, padding);
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 18, fontWeight: 600 }}>Forecast projection this quarter</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Legend color="#10b981" label="Closed" />
          <Legend color="#8b5cf6" label="AI Forecast" />
          <Legend color="#f59e0b" label="Seller Commit" />
        </div>
      </div>
      <svg width={width} height={height}>
        <rect x={padding} y={padding} width={width - padding * 2} height={height - padding * 2} fill="#fff" stroke="#e5e7eb" />
        <path d={ai} fill="none" stroke="#8b5cf6" strokeWidth={3} strokeDasharray="4 4" />
        <path d={commit} fill="none" stroke="#f59e0b" strokeWidth={3} />
      </svg>
    </div>
  );
};

const ChatMessage = ({ title, body }: { title?: string; body: string }) => (
  <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, display: 'grid', gap: 6 }}>
    {title ? <span style={{ fontWeight: 600 }}>{title}</span> : null}
    <span style={{ color: '#374151' }}>{body}</span>
  </div>
);

const ChatPanel = ({ onLogout }: { onLogout: () => void }) => (
  <aside style={{ width: 420, borderLeft: '1px solid #e5e7eb', background: '#fff', display: 'flex', flexDirection: 'column' }}>
    <div style={{ padding: 16, borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 8 }}>
      <input placeholder="Ask von anything" style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', outline: 'none' }} />
      <button style={{ padding: '8px 12px', background: '#2563eb', color: '#fff', border: 0, borderRadius: 8 }}>Ask</button>
      <button style={{ padding: '8px 12px', background: '#ef4444', color: '#fff', border: 0, borderRadius: 8 }} onClick={onLogout}>Logout</button>
    </div>
    <div style={{ padding: 16, display: 'grid', gap: 12, overflowY: 'auto' }}>
      <ChatMessage title="How much will I win this quarter?" body="Sure! I have built a forecast view for your team this quarter. There are 18 deals under progress." />
      <div style={{ display: 'flex', gap: 8 }}>
        <button style={{ padding: '8px 12px' }}>Give me a roll-up view</button>
      </div>
      <ChatMessage body="Here is a visual representation of your pipeline progress throughout the quarter." />
      <div style={{ display: 'flex', gap: 8 }}>
        <button style={{ padding: '8px 12px' }}>Show how my pipeline moved</button>
      </div>
      <ChatMessage body="Ask anything else about forecasts, team performance, or deal movement." />
      <div style={{ display: 'flex', gap: 8 }}>
        <button style={{ padding: '8px 12px' }}>Ask</button>
        <button style={{ padding: '8px 12px' }}>Build</button>
      </div>
    </div>
  </aside>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const token = sessionStorage.getItem('access_token');
  console.log('session access_token', token);

  function logout() {
    sessionStorage.clear();
    navigate('/');
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f9fafb' }}>
      {/* Left rail */}
      <aside style={{ width: 240, borderRight: '1px solid #e5e7eb', background: '#fff', padding: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 18 }}>Dashboards</div>
        <nav style={{ marginTop: 12, display: 'grid', gap: 8 }}>
          {['Team Review', 'Forecast Q3', 'Forecast Q2', 'Reports', 'Sales Performance'].map((t) => (
            <div key={t} style={{ padding: '8px 10px', borderRadius: 8, cursor: 'default', background: t === 'Forecast Q3' ? '#eef2ff' : 'transparent', color: t === 'Forecast Q3' ? '#4338ca' : '#111827' }}>{t}</div>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: 24, display: 'grid', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 24, fontWeight: 700 }}>Forecast Q3</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ padding: '8px 12px' }}>Share</button>
            <button style={{ padding: '8px 12px', background: '#2563eb', color: '#fff', border: 0, borderRadius: 8 }}>Export</button>
            <button style={{ padding: '8px 12px', background: '#ef4444', color: '#fff', border: 0, borderRadius: 8 }} onClick={logout}>Logout</button>
          </div>
        </div>

        {/* KPI cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {kpis.map((k) => (
            <Card key={k.label} label={k.label} value={k.value} sub={k.sub} color={k.color} />
          ))}
        </div>

        {/* Team table */}
        <Table />

        {/* Forecast chart */}
        <ForecastChart />
      </main>

      {/* Chat panel */}
      <ChatPanel onLogout={logout} />
    </div>
  );
}


