'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts'

const REDS = ['#ef4444', '#b91c1c', '#991b1b', '#7f1d1d', '#450a0a', '#dc2626', '#f87171', '#fca5a5']

export function SalesByCategoryChart({ data }: { data: { name: string; value: number }[] }) {
  if (!data || data.length === 0) {
    return <div className="h-[300px] flex items-center justify-center text-zinc-400 text-sm">Sin datos</div>
  }
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={3}>
            {data.map((_, i) => (
              <Cell key={i} fill={REDS[i % REDS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(val) => [`$${Number(val).toLocaleString('es-CL')}`, 'Ventas']}
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e4e4e7', borderRadius: 0 }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export function BestSellersChart({ data }: { data: { name: string; quantity: number }[] }) {
  if (!data || data.length === 0) {
    return <div className="h-[300px] flex items-center justify-center text-zinc-400 text-sm">Sin datos</div>
  }
  const truncated = data.map(d => ({ ...d, shortName: d.name.length > 20 ? d.name.slice(0, 20) + '...' : d.name }))
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={truncated} layout="vertical" margin={{ left: 10, right: 20 }}>
          <XAxis type="number" tick={{ fontSize: 11, fill: '#71717a' }} />
          <YAxis type="category" dataKey="shortName" tick={{ fontSize: 11, fill: '#18181b' }} width={140} />
          <Tooltip
            formatter={(val) => [`${Number(val)} unidades`, 'Vendidos']}
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e4e4e7', borderRadius: 0 }}
          />
          <Bar dataKey="quantity" fill="#ef4444" radius={0} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}