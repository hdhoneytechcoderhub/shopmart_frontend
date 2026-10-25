import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

const axisProps = { tick: { fontSize: 11, fill: '#94a3b8' }, tickLine: false, axisLine: false };
const tooltipStyle = {
  contentStyle: { borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' },
};

export function ChartCard({ title, subtitle, action, children, height = 280 }) {
  return (
    <div className="card p-5">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-ink">{title}</h3>
          {subtitle && <p className="text-xs text-ink-muted">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>{children}</ResponsiveContainer>
      </div>
    </div>
  );
}

export function SalesChart({ data }) {
  return (
    <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
      <defs>
        <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.35} />
          <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
      <XAxis dataKey="month" {...axisProps} />
      <YAxis {...axisProps} />
      <Tooltip {...tooltipStyle} />
      <Area type="monotone" dataKey="sales" stroke="#4f46e5" strokeWidth={2.5} fill="url(#salesFill)" name="Sales (₹k)" />
    </AreaChart>
  );
}

export function OrdersChart({ data }) {
  return (
    <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
      <XAxis dataKey="month" {...axisProps} />
      <YAxis {...axisProps} />
      <Tooltip {...tooltipStyle} />
      <Line type="monotone" dataKey="orders" stroke="#f97316" strokeWidth={2.5} dot={{ r: 2 }} name="Orders" />
    </LineChart>
  );
}

export function RevenueChart({ data }) {
  return (
    <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
      <XAxis dataKey="month" {...axisProps} />
      <YAxis {...axisProps} />
      <Tooltip {...tooltipStyle} />
      <Bar dataKey="revenue" fill="#10b981" radius={[6, 6, 0, 0]} name="Revenue (₹k)" />
    </BarChart>
  );
}

export function TopProductsChart({ data }) {
  return (
    <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
      <XAxis type="number" {...axisProps} />
      <YAxis type="category" dataKey="name" width={110} {...axisProps} />
      <Tooltip {...tooltipStyle} />
      <Bar dataKey="units" fill="#4f46e5" radius={[0, 6, 6, 0]} name="Units sold" />
    </BarChart>
  );
}

export function CustomerGrowthChart({ data }) {
  return (
    <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
      <defs>
        <linearGradient id="customerFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.35} />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
      <XAxis dataKey="period" {...axisProps} />
      <YAxis {...axisProps} />
      <Tooltip {...tooltipStyle} />
      <Area type="monotone" dataKey="newCustomers" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#customerFill)" name="New customers" />
    </AreaChart>
  );
}

export function StatusPie({ data }) {
  return (
    <PieChart>
      <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
        {data.map((d, index) => <Cell key={d.name || index} fill={d.color} />)}
      </Pie>
      <Tooltip {...tooltipStyle} />
      <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
    </PieChart>
  );
}
