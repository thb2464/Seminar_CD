import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { FiDownload, FiRefreshCw } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import config from '../../config/strapi';

const STATUS_COLORS = {
  Pending: '#f59e0b',
  Paid: '#10b981',
  Cancelled: '#ef4444',
  Failed: '#ec4899',
};

const formatVND = (n) => new Intl.NumberFormat('vi-VN').format(Number(n) || 0) + ' ₫';
const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-GB') : '—');

const toCsv = (rows) => {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const esc = (v) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(','), ...rows.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\n');
};

const download = (filename, content, mime = 'text/csv;charset=utf-8') => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const AdminDashboard = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, r] = await Promise.all([
        fetch(`${config.STRAPI_URL}${config.API_ENDPOINTS.ADMIN_BOOKINGS_STATS}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${config.STRAPI_URL}${config.API_ENDPOINTS.ADMIN_BOOKINGS_ALL}?limit=200`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      if (!s.ok) throw new Error(`Stats: ${s.status}`);
      if (!r.ok) throw new Error(`Bookings: ${r.status}`);
      const sJ = await s.json();
      const rJ = await r.json();
      setStats(sJ.data);
      setRecent(rJ.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchAll();
  }, [token]);

  const recent5 = useMemo(() => recent.slice(0, 5), [recent]);

  const monthlyData = useMemo(() => {
    if (!stats?.monthly) return [];
    return stats.monthly.map((m) => ({
      month: m.month,
      Bookings: m.count,
      Revenue: Math.round((m.revenue || 0) / 1_000_000), // millions ₫
    }));
  }, [stats]);

  const statusPie = useMemo(() => {
    if (!stats?.byStatus) return [];
    return stats.byStatus.map((s) => ({ name: s.status, value: s.count }));
  }, [stats]);

  const handleExportAll = () => {
    const rows = recent.map((b) => ({
      id: b.id,
      tour: b.tour_name,
      travel_date: b.travel_date,
      adult_count: b.adult_count,
      child_count: b.child_count,
      total_price: b.total_price,
      status: b.status,
      payment_ref: b.payment_ref || '',
      contact_name: b.contact_name,
      contact_email: b.contact_email,
      contact_phone: b.contact_phone,
      booking_date: b.booking_date,
    }));
    download(`bookings-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows));
  };

  const handleExportUpcoming = () => {
    download(
      `upcoming-tours-${new Date().toISOString().slice(0, 10)}.csv`,
      toCsv(stats?.upcoming || []),
    );
  };

  if (loading) return <div className="admin-card" data-testid="dashboard-loading">Loading…</div>;
  if (error) return <div className="admin-error" data-testid="dashboard-error">Failed to load: {error}</div>;
  if (!stats) return null;

  return (
    <div data-testid="admin-dashboard">
      <div className="admin-page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Live booking & revenue overview from the booking-service.</p>
        </div>
        <button onClick={fetchAll} className="admin-btn secondary" data-testid="dashboard-refresh">
          <FiRefreshCw style={{ verticalAlign: 'middle', marginRight: 6 }} />
          Refresh
        </button>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card accent-blue" data-testid="stat-total-bookings">
          <div className="stat-label">Total Bookings</div>
          <div className="stat-value">{stats.totals.totalBookings}</div>
          <div className="stat-hint">Across all time</div>
        </div>
        <div className="admin-stat-card accent-green" data-testid="stat-revenue">
          <div className="stat-label">Revenue (Paid)</div>
          <div className="stat-value">{formatVND(stats.totals.totalRevenue)}</div>
          <div className="stat-hint">{stats.totals.paid} paid booking{stats.totals.paid === 1 ? '' : 's'}</div>
        </div>
        <div className="admin-stat-card accent-amber" data-testid="stat-pending">
          <div className="stat-label">Pending</div>
          <div className="stat-value">{stats.totals.pending}</div>
          <div className="stat-hint">Awaiting payment</div>
        </div>
        <div className="admin-stat-card accent-red" data-testid="stat-cancelled">
          <div className="stat-label">Cancelled</div>
          <div className="stat-value">{stats.totals.cancelled}</div>
          <div className="stat-hint">Past 12 months</div>
        </div>
      </div>

      <div className="admin-row-2">
        <div className="admin-card" data-testid="chart-monthly">
          <div className="admin-card-header">
            <h3>Monthly Activity (last 12 months)</h3>
          </div>
          {monthlyData.length === 0 ? (
            <div className="admin-empty">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip
                  formatter={(value, name) => (name === 'Revenue' ? `${value}M ₫` : value)}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Bookings" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="admin-card" data-testid="chart-status">
          <div className="admin-card-header">
            <h3>By Status</h3>
          </div>
          {statusPie.length === 0 ? (
            <div className="admin-empty">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusPie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90}>
                  {statusPie.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="admin-card" data-testid="recent-bookings">
        <div className="admin-card-header">
          <h3>Recent Bookings</h3>
          <button onClick={handleExportAll} className="admin-btn" data-testid="export-bookings-csv">
            <FiDownload style={{ verticalAlign: 'middle', marginRight: 6 }} />
            Export CSV
          </button>
        </div>
        {recent5.length === 0 ? (
          <div className="admin-empty">No bookings yet</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tour</th>
                <th>Travel date</th>
                <th>Pax</th>
                <th>Total</th>
                <th>Status</th>
                <th>Contact</th>
                <th>Booked</th>
              </tr>
            </thead>
            <tbody>
              {recent5.map((b) => (
                <tr key={b.id}>
                  <td>#{b.id}</td>
                  <td title={b.tour_name}>{b.tour_name?.slice(0, 40) || '—'}</td>
                  <td>{formatDate(b.travel_date)}</td>
                  <td>
                    {b.adult_count}+{b.child_count}
                  </td>
                  <td>{formatVND(b.total_price)}</td>
                  <td>
                    <span className={`status-badge ${b.status}`}>{b.status}</span>
                  </td>
                  <td>{b.contact_name}</td>
                  <td>{formatDate(b.booking_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="admin-card" data-testid="upcoming-tours">
        <div className="admin-card-header">
          <h3>Upcoming Tours (next departures)</h3>
          <button onClick={handleExportUpcoming} className="admin-btn secondary" data-testid="export-upcoming-csv">
            <FiDownload style={{ verticalAlign: 'middle', marginRight: 6 }} />
            Export CSV
          </button>
        </div>
        {!stats.upcoming?.length ? (
          <div className="admin-empty">No upcoming tours scheduled</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Tour</th>
                <th>Travel date</th>
                <th>Pax booked</th>
              </tr>
            </thead>
            <tbody>
              {stats.upcoming.map((u, i) => (
                <tr key={i}>
                  <td>{u.tour_name}</td>
                  <td>{formatDate(u.travel_date)}</td>
                  <td>{u.pax}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
