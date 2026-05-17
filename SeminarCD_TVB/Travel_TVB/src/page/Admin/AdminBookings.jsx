import React, { useEffect, useMemo, useState } from 'react';
import { FiDownload, FiSearch } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import config from '../../config/strapi';

const formatVND = (n) =>
  new Intl.NumberFormat('vi-VN').format(Number(n) || 0) + ' ₫';
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

const downloadFile = (filename, content) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const AdminBookings = () => {
  const { token } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const r = await fetch(
          `${config.STRAPI_URL}${config.API_ENDPOINTS.ADMIN_BOOKINGS_ALL}?limit=500`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!r.ok) throw new Error(`Status ${r.status}`);
        const j = await r.json();
        if (!cancelled) setBookings(j.data || []);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return bookings.filter((b) => {
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      if (!s) return true;
      return (
        String(b.id).includes(s) ||
        (b.tour_name || '').toLowerCase().includes(s) ||
        (b.contact_name || '').toLowerCase().includes(s) ||
        (b.contact_email || '').toLowerCase().includes(s) ||
        (b.payment_ref || '').toLowerCase().includes(s)
      );
    });
  }, [bookings, search, statusFilter]);

  const handleExport = () => {
    const rows = filtered.map((b) => ({
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
    downloadFile(`bookings-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows));
  };

  return (
    <div data-testid="admin-bookings">
      <div className="admin-page-header">
        <div>
          <h1>Bookings</h1>
          <p>Full booking history across every tour, status and locale.</p>
        </div>
        <button onClick={handleExport} className="admin-btn" disabled={filtered.length === 0} data-testid="bookings-export">
          <FiDownload style={{ verticalAlign: 'middle', marginRight: 6 }} />
          Export {filtered.length} row{filtered.length === 1 ? '' : 's'} (CSV)
        </button>
      </div>

      <div className="admin-card">
        <div className="admin-card-header" style={{ gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 12, flex: 1, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
              <FiSearch style={{ position: 'absolute', left: 12, top: 11, color: '#94a3b8' }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search id, tour, name, email, payment ref…"
                data-testid="bookings-search"
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  fontSize: 14,
                }}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              data-testid="bookings-status-filter"
              style={{
                padding: '8px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                fontSize: 14,
              }}
            >
              <option value="all">All statuses</option>
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Failed">Failed</option>
            </select>
          </div>
        </div>
        {error && <div className="admin-error" data-testid="bookings-error">{error}</div>}
        {loading ? (
          <div className="admin-empty" data-testid="bookings-loading">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty">No bookings match the current filters.</div>
        ) : (
          <table className="admin-table" data-testid="bookings-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tour</th>
                <th>Travel</th>
                <th>Pax</th>
                <th>Total</th>
                <th>Status</th>
                <th>Contact</th>
                <th>Email</th>
                <th>Booked</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id}>
                  <td>#{b.id}</td>
                  <td title={b.tour_name}>{(b.tour_name || '').slice(0, 35)}</td>
                  <td>{formatDate(b.travel_date)}</td>
                  <td>{b.adult_count}+{b.child_count}</td>
                  <td>{formatVND(b.total_price)}</td>
                  <td><span className={`status-badge ${b.status}`}>{b.status}</span></td>
                  <td>{b.contact_name}</td>
                  <td>{b.contact_email}</td>
                  <td>{formatDate(b.booking_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminBookings;
