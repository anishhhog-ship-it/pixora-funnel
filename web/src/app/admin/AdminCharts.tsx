'use client';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';

export function AdminGrowthChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} dy={10} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
        <Line type="monotone" dataKey="newCustomers" stroke="#3B82F6" strokeWidth={3} dot={false} />
        <Line type="monotone" dataKey="activeBusinesses" stroke="#10B981" strokeWidth={3} dot={false} />
        <Line type="monotone" dataKey="qrScans" stroke="#A855F7" strokeWidth={3} dot={false} />
        <Line type="monotone" dataKey="reviews" stroke="#F97316" strokeWidth={3} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function AdminAccountStatusChart({ data, total }: { data: any[], total: number }) {
  return (
    <div className="flex flex-col items-center">
      <div className="h-[180px] w-[180px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-slate-900">{total}</span>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Accounts</span>
        </div>
      </div>
      <div className="w-full mt-4 space-y-2.5">
        {data.map((item: any) => (
          <div key={item.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
              <span className="font-semibold text-slate-700">{item.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-900">{item.value}</span>
              <span className="text-slate-400 text-xs w-8 text-right">({total > 0 ? Math.round((item.value/total)*100) : 0}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
