import React, { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  ShoppingCart, IndianRupee, Clock, Store, Tag, Users, AlertCircle,
  UserX, TrendingUp, TrendingDown, CheckCircle, Clock3, Building2,
} from 'lucide-react';
import {
  getKPI, getDailyRevenue, getOrderSummary, getTopItems, getRecentOrders,
  getOverviewStats, getBrandPerformance, getCityStats, getMonthlyRevenue, getPendingApprovals,
} from '../api/reports';

function Skeleton({ className }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

function KPICard({ title, value, sub, change, icon: Icon, iconBg, iconColor, prefix, suffix, loading, badge, badgeColor }) {
  const isPos = change >= 0;
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      {loading ? (
        <div className="space-y-3"><Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-32" /><Skeleton className="h-4 w-20" /></div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500 font-medium">{title}</p>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg || 'bg-orange-100'}`}>
              <Icon className={`w-5 h-5 ${iconColor || 'text-orange-500'}`} />
            </div>
          </div>
          <div className="flex items-end gap-2 flex-wrap">
            <p className="text-2xl font-bold text-gray-800">{prefix || ''}{typeof value === 'number' ? value.toLocaleString('en-IN') : value}{suffix || ''}</p>
            {badge && <span className={`text-xs px-2 py-0.5 rounded-full font-medium mb-0.5 ${badgeColor || 'bg-orange-100 text-orange-600'}`}>{badge}</span>}
          </div>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${isPos ? 'text-green-600' : 'text-red-500'}`}>
              {isPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(change)}% vs yesterday
            </div>
          )}
        </>
      )}
    </div>
  );
}

const STATUS_COLORS = { Delivered: 'bg-green-100 text-green-700', Pending: 'bg-orange-100 text-orange-700', Cancelled: 'bg-red-100 text-red-700' };
const PIE_COLORS = ['#22c55e', '#f97316', '#ef4444'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {p.name === 'Revenue' ? '₹' + Number(p.value).toLocaleString('en-IN') : p.value}</p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const [kpi, setKpi] = useState(null);
  const [overview, setOverview] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [orders, setOrders] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [brandPerf, setBrandPerf] = useState([]);
  const [cityStats, setCityStats] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState({
    kpi: true, overview: true, revenue: true, monthly: true,
    orders: true, top: true, recent: true, brand: true, city: true, pending: true,
  });

  function done(key) { setLoading(p => ({ ...p, [key]: false })); }

  useEffect(() => {
    getKPI().then(r => { setKpi(r.data); done('kpi'); }).catch(() => done('kpi'));
    getOverviewStats().then(r => { setOverview(r.data); done('overview'); }).catch(() => done('overview'));
    getDailyRevenue().then(r => { setRevenue(r.data); done('revenue'); }).catch(() => done('revenue'));
    getMonthlyRevenue().then(r => { setMonthly(r.data); done('monthly'); }).catch(() => done('monthly'));
    getOrderSummary().then(r => { setOrders(r.data); done('orders'); }).catch(() => done('orders'));
    getTopItems().then(r => { setTopItems(r.data); done('top'); }).catch(() => done('top'));
    getRecentOrders().then(r => { setRecentOrders(r.data); done('recent'); }).catch(() => done('recent'));
    getBrandPerformance().then(r => { setBrandPerf(r.data); done('brand'); }).catch(() => done('brand'));
    getCityStats().then(r => { setCityStats(r.data); done('city'); }).catch(() => done('city'));
    getPendingApprovals().then(r => { setPending(r.data); done('pending'); }).catch(() => done('pending'));
  }, []);

  const deliveredPct = orders.length
    ? Math.round((orders.find(o => o.status === 'Delivered')?.count || 0) / orders.reduce((s, o) => s + o.count, 0) * 100)
    : 0;

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-full">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Welcome back, Admin · {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {overview && overview.pendingApprovals > 0 && (
          <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-2">
            <AlertCircle className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-semibold text-orange-700">{overview.pendingApprovals} Pending Approvals</span>
          </div>
        )}
      </div>

      {/* Row 1 — Operations KPIs */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Today's Operations</p>
        <div className="grid grid-cols-4 gap-4">
          <KPICard title="Total Orders Today" value={kpi?.totalOrdersToday ?? 0} change={kpi?.ordersChange ?? 0} icon={ShoppingCart} iconBg="bg-blue-100" iconColor="text-blue-500" loading={loading.kpi} />
          <KPICard title="Total Revenue" value={kpi?.totalRevenueToday ?? 0} change={kpi?.revenueChange ?? 0} icon={IndianRupee} iconBg="bg-green-100" iconColor="text-green-500" prefix="₹" loading={loading.kpi} />
          <KPICard title="Avg Delivery Time" value={kpi?.avgDeliveryTime ?? 0} change={kpi?.deliveryChange ?? 0} icon={Clock} iconBg="bg-purple-100" iconColor="text-purple-500" suffix=" min" loading={loading.kpi} />
          <KPICard title="Active Restaurants" value={kpi?.activeRestaurants ?? 0} icon={Store} iconBg="bg-orange-100" iconColor="text-orange-500" loading={loading.kpi} />
        </div>
      </div>

      {/* Row 2 — Platform KPIs */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Platform Health</p>
        <div className="grid grid-cols-4 gap-4">
          <KPICard
            title="Total Brands" value={overview?.brands.total ?? 0}
            sub={`${overview?.brands.active ?? 0} active · ${overview?.brands.pending ?? 0} pending`}
            icon={Tag} iconBg="bg-indigo-100" iconColor="text-indigo-500"
            badge={overview?.brands.suspended > 0 ? `${overview.brands.suspended} suspended` : undefined}
            badgeColor="bg-red-100 text-red-600" loading={loading.overview}
          />
          <KPICard
            title="Total Restaurants" value={overview?.restaurants.total ?? 0}
            sub={`${overview?.restaurants.active ?? 0} active · ${overview?.restaurants.pending ?? 0} pending`}
            icon={Building2} iconBg="bg-cyan-100" iconColor="text-cyan-500" loading={loading.overview}
          />
          <KPICard
            title="Total Users" value={overview?.users.total ?? 0}
            sub={`${overview?.users.active ?? 0} active accounts`}
            icon={Users} iconBg="bg-teal-100" iconColor="text-teal-500" loading={loading.overview}
          />
          <KPICard
            title="Blocked Users" value={overview?.users.blocked ?? 0}
            sub="Accounts deactivated"
            icon={UserX} iconBg="bg-red-100" iconColor="text-red-500" loading={loading.overview}
          />
        </div>
      </div>

      {/* Row 3 — Revenue trend + Order status */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Revenue Trend (Last 30 Days)</h2>
          {loading.monthly ? <Skeleton className="h-56 w-full" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthly}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => '₹' + (v / 1000).toFixed(0) + 'k'} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#f97316" strokeWidth={2} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Order Status</h2>
          {loading.orders ? <Skeleton className="h-56 w-full" /> : (
            <div className="relative">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={orders} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="count" nameKey="status">
                    {orders.map((o, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip formatter={v => [v.toLocaleString(), 'Orders']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <p className="text-2xl font-bold text-gray-800">{deliveredPct}%</p>
                <p className="text-xs text-gray-400">Delivered</p>
              </div>
              <div className="space-y-1.5 mt-2">
                {orders.map((o, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                      <span className="text-gray-600">{o.status}</span>
                    </div>
                    <span className="font-semibold text-gray-700">{o.count?.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Row 4 — Brand Performance + City Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Brand Performance (30 Days)</h2>
          {loading.brand ? <Skeleton className="h-56 w-full" /> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={brandPerf} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => '₹' + (v / 1000).toFixed(0) + 'k'} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} />
                <Tooltip formatter={v => ['₹' + Number(v).toLocaleString('en-IN'), 'Revenue']} />
                <Bar dataKey="total_revenue" name="Revenue" fill="#f97316" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">City-wise Revenue (30 Days)</h2>
          {loading.city ? <Skeleton className="h-56 w-full" /> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={cityStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="city" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => '₹' + (v / 1000).toFixed(0) + 'k'} />
                <Tooltip formatter={v => ['₹' + Number(v).toLocaleString('en-IN'), 'Revenue']} />
                <Bar dataKey="total_revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Row 5 — Weekly Orders + Pending Approvals */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Weekly Orders (Last 7 Days)</h2>
          {loading.revenue ? <Skeleton className="h-44 w-full" /> : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={revenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="total_orders" name="Orders" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="col-span-2 bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Pending Approvals</h2>
            <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">{pending.length} items</span>
          </div>
          {loading.pending ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : pending.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <CheckCircle className="w-8 h-8 mb-2 text-green-400" />
              <p className="text-sm">All caught up! No pending approvals.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {pending.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-100 rounded-lg">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.type === 'brand' ? 'bg-indigo-100' : 'bg-cyan-100'}`}>
                    {item.type === 'brand' ? <Tag className="w-4 h-4 text-indigo-500" /> : <Building2 className="w-4 h-4 text-cyan-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.subtitle}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-orange-500 flex-shrink-0">
                    <Clock3 className="w-3 h-3" />
                    {new Date(item.created_at).toLocaleDateString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 6 — Recent Orders + Top Restaurants */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Recent Orders</h2>
          {loading.recent ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-100">
                  <th className="pb-2 font-semibold uppercase">Order ID</th>
                  <th className="pb-2 font-semibold uppercase">Restaurant</th>
                  <th className="pb-2 font-semibold uppercase">Status</th>
                  <th className="pb-2 font-semibold uppercase text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentOrders.map((o, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="py-2.5 text-gray-500 font-mono">{o.orderId}</td>
                    <td className="py-2.5 text-gray-700">{o.restaurant}</td>
                    <td className="py-2.5"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-700'}`}>{o.status}</span></td>
                    <td className="py-2.5 text-right font-medium text-gray-700">₹{o.amount.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Top Restaurants (30 Days)</h2>
          {loading.top ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <div className="space-y-4">
              {topItems.map(item => {
                const pct = topItems[0]?.revenue > 0 ? (item.revenue / topItems[0].revenue * 100) : 0;
                return (
                  <div key={item.rank}>
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${item.rank === 1 ? 'bg-yellow-100 text-yellow-600' : item.rank === 2 ? 'bg-gray-100 text-gray-500' : item.rank === 3 ? 'bg-orange-100 text-orange-600' : 'bg-gray-50 text-gray-400'}`}>{item.rank}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-medium text-gray-800 truncate">{item.name}</p>
                          <span className="text-xs font-semibold text-gray-700 ml-2">₹{item.revenue.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                            <div className="bg-orange-500 h-1.5 rounded-full transition-all" style={{ width: pct + '%' }} />
                          </div>
                          <span className="text-xs text-gray-400 flex-shrink-0">{item.orders} orders</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
