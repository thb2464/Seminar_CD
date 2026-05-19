import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FiEdit2, FiTrash2, FiPlus, FiX, FiSave, FiUpload, FiLoader } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import config from '../../config/strapi';

const REGIONS = ['MienBac', 'MienTrung', 'MienNam', 'TayNguyen', 'NhieuVung'];
const TRANSPORTS = ['XeKhach', 'MayBay', 'Tau', 'XeMay', 'KetHop'];
const LOCALES = ['vi', 'en', 'zh'];

const emptyForm = {
  slug: '',
  tourName: '',
  shortDescription: '',
  locale: 'vi',
  region: 'MienBac',
  location: '',
  departureLocation: '',
  price: '',
  originalPrice: '',
  childPrice: '',
  durationDays: '',
  durationNights: '',
  maxParticipants: '',
  transportType: 'XeKhach',
  featuredImageUrl: '',
  isFeatured: false,
};

const formatVND = (n) =>
  new Intl.NumberFormat('vi-VN').format(Number(n) || 0) + ' ₫';

const AdminTours = () => {
  const { token } = useAuth();
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Image upload state — drives the picker button next to the URL field.
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const handleImageFile = async (file) => {
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const body = new FormData();
      body.append('files', file);
      const res = await fetch(`${config.STRAPI_URL}/api/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error?.message || `Upload failed (${res.status})`);
      }
      const arr = await res.json();
      const url = Array.isArray(arr) && arr[0]?.url;
      if (!url) throw new Error('Upload succeeded but no URL was returned.');
      updateField('featuredImageUrl', url);
    } catch (e) {
      setUploadError(e.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Resolve a stored image path to a fully-qualified URL the browser can fetch
  // (the same three-armed logic the public Tours.jsx uses).
  const resolvePreviewSrc = (u) => {
    if (!u) return null;
    if (u.startsWith('http')) return u;
    if (u.startsWith('/uploads/')) return `${config.STRAPI_URL}${u}`;
    return u;
  };

  const fetchTours = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Pull from all 3 locales so the admin sees the full inventory.
      const responses = await Promise.all(
        LOCALES.map((l) =>
          fetch(
            `${config.STRAPI_URL}${config.API_ENDPOINTS.TOURS}?locale=${l}&pagination%5BpageSize%5D=100`,
          ).then((r) => (r.ok ? r.json() : { data: [] })),
        ),
      );
      const all = responses.flatMap((r) => r.data || []);
      // Show newest first
      all.sort((a, b) => (a.id > b.id ? -1 : 1));
      setTours(all);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTours();
  }, [fetchTours]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setShowForm(true);
  };

  const openEdit = (tour) => {
    setEditing(tour);
    setForm({
      slug: tour.slug || '',
      tourName: tour.tourName || '',
      shortDescription: tour.shortDescription || '',
      locale: tour.locale || 'vi',
      region: tour.region || 'MienBac',
      location: tour.location || '',
      departureLocation: tour.departureLocation || '',
      price: tour.price ?? '',
      originalPrice: tour.originalPrice ?? '',
      childPrice: tour.childPrice ?? '',
      durationDays: tour.durationDays ?? '',
      durationNights: tour.durationNights ?? '',
      maxParticipants: tour.maxParticipants ?? '',
      transportType: tour.transportType || 'XeKhach',
      featuredImageUrl: tour.featuredImageUrl || '',
      isFeatured: !!tour.isFeatured,
    });
    setFormError(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
  };

  const updateField = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const payload = {
        ...form,
        price: form.price === '' ? undefined : parseInt(form.price, 10),
        originalPrice: form.originalPrice === '' ? undefined : parseInt(form.originalPrice, 10),
        childPrice: form.childPrice === '' ? undefined : parseInt(form.childPrice, 10),
        durationDays: form.durationDays === '' ? undefined : parseInt(form.durationDays, 10),
        durationNights: form.durationNights === '' ? undefined : parseInt(form.durationNights, 10),
        maxParticipants:
          form.maxParticipants === '' ? undefined : parseInt(form.maxParticipants, 10),
        // Drop empty optionals so backend validators don't reject empty strings.
        location: form.location || undefined,
        departureLocation: form.departureLocation || undefined,
        shortDescription: form.shortDescription || undefined,
        featuredImageUrl: form.featuredImageUrl || undefined,
      };

      const url = editing
        ? `${config.STRAPI_URL}${config.API_ENDPOINTS.TOURS}/${editing.id}`
        : `${config.STRAPI_URL}${config.API_ENDPOINTS.TOURS}`;
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        const msg =
          (Array.isArray(j.message) ? j.message.join(', ') : j.message) ||
          `Save failed (${res.status})`;
        throw new Error(msg);
      }
      closeForm();
      await fetchTours();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (tour) => {
    if (!window.confirm(`Delete tour "${tour.tourName}" (${tour.locale})? This is a soft delete.`))
      return;
    try {
      const res = await fetch(
        `${config.STRAPI_URL}${config.API_ENDPOINTS.TOURS}/${tour.id}?locale=${tour.locale}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok && res.status !== 204) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || `Delete failed (${res.status})`);
      }
      await fetchTours();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div data-testid="admin-tours">
      <div className="admin-page-header">
        <div>
          <h1>Tours</h1>
          <p>Create, edit and remove tours across all locales (vi / en / zh).</p>
        </div>
        <button onClick={openCreate} className="admin-btn" data-testid="tour-new-btn">
          <FiPlus style={{ verticalAlign: 'middle', marginRight: 6 }} />
          New tour
        </button>
      </div>

      {error && <div className="admin-error" data-testid="tours-error">{error}</div>}

      {showForm && (
        <div className="admin-card" data-testid="tour-form-card">
          <div className="admin-card-header">
            <h3>{editing ? `Edit Tour #${editing.id} (${editing.locale})` : 'New Tour'}</h3>
            <button onClick={closeForm} className="admin-btn secondary" data-testid="tour-form-close">
              <FiX style={{ verticalAlign: 'middle', marginRight: 6 }} />
              Cancel
            </button>
          </div>
          {formError && <div className="admin-error" style={{ marginBottom: 12 }} data-testid="tour-form-error">{formError}</div>}
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="admin-form-group full">
              <label>Tour name</label>
              <input
                type="text"
                value={form.tourName}
                onChange={(e) => updateField('tourName', e.target.value)}
                required
                data-testid="form-tourName"
              />
            </div>
            <div className="admin-form-group">
              <label>Slug</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => updateField('slug', e.target.value)}
                placeholder="my-tour-slug"
                required
                data-testid="form-slug"
              />
            </div>
            <div className="admin-form-group">
              <label>Locale</label>
              <select value={form.locale} onChange={(e) => updateField('locale', e.target.value)} data-testid="form-locale">
                {LOCALES.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="admin-form-group full">
              <label>Short description</label>
              <textarea
                rows={2}
                value={form.shortDescription}
                onChange={(e) => updateField('shortDescription', e.target.value)}
                data-testid="form-shortDescription"
              />
            </div>
            <div className="admin-form-group">
              <label>Region</label>
              <select value={form.region} onChange={(e) => updateField('region', e.target.value)}>
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="admin-form-group">
              <label>Transport</label>
              <select value={form.transportType} onChange={(e) => updateField('transportType', e.target.value)}>
                {TRANSPORTS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="admin-form-group">
              <label>Location</label>
              <input type="text" value={form.location} onChange={(e) => updateField('location', e.target.value)} />
            </div>
            <div className="admin-form-group">
              <label>Departure</label>
              <input
                type="text"
                value={form.departureLocation}
                onChange={(e) => updateField('departureLocation', e.target.value)}
              />
            </div>
            <div className="admin-form-group">
              <label>Price (VND)</label>
              <input
                type="number"
                min="0"
                value={form.price}
                onChange={(e) => updateField('price', e.target.value)}
                data-testid="form-price"
              />
            </div>
            <div className="admin-form-group">
              <label>Original price (VND)</label>
              <input
                type="number"
                min="0"
                value={form.originalPrice}
                onChange={(e) => updateField('originalPrice', e.target.value)}
              />
            </div>
            <div className="admin-form-group">
              <label>Child price (VND)</label>
              <input
                type="number"
                min="0"
                value={form.childPrice}
                onChange={(e) => updateField('childPrice', e.target.value)}
              />
            </div>
            <div className="admin-form-group">
              <label>Max participants</label>
              <input
                type="number"
                min="1"
                value={form.maxParticipants}
                onChange={(e) => updateField('maxParticipants', e.target.value)}
                data-testid="form-maxParticipants"
              />
            </div>
            <div className="admin-form-group">
              <label>Duration (days)</label>
              <input
                type="number"
                min="0"
                value={form.durationDays}
                onChange={(e) => updateField('durationDays', e.target.value)}
              />
            </div>
            <div className="admin-form-group">
              <label>Duration (nights)</label>
              <input
                type="number"
                min="0"
                value={form.durationNights}
                onChange={(e) => updateField('durationNights', e.target.value)}
              />
            </div>
            <div className="admin-form-group full">
              <label>Featured image</label>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                {/* Live thumbnail preview */}
                {form.featuredImageUrl && (
                  <img
                    src={resolvePreviewSrc(form.featuredImageUrl)}
                    alt="preview"
                    data-testid="tour-image-preview"
                    style={{ width: 96, height: 72, objectFit: 'cover', borderRadius: 6, border: '1px solid #ccc', flexShrink: 0 }}
                  />
                )}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      value={form.featuredImageUrl}
                      onChange={(e) => updateField('featuredImageUrl', e.target.value)}
                      placeholder="/uploads/foo.jpg, https://..., or click Upload"
                      style={{ flex: 1 }}
                      data-testid="form-featuredImageUrl"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="admin-btn secondary"
                      disabled={uploading}
                      data-testid="tour-image-upload-btn"
                    >
                      {uploading ? (
                        <>
                          <FiLoader style={{ verticalAlign: 'middle', marginRight: 6 }} />
                          Uploading…
                        </>
                      ) : (
                        <>
                          <FiUpload style={{ verticalAlign: 'middle', marginRight: 6 }} />
                          Upload
                        </>
                      )}
                    </button>
                  </div>
                  {/* Hidden file input — driven by the Upload button above */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={(e) => handleImageFile(e.target.files?.[0])}
                    style={{ display: 'none' }}
                    data-testid="tour-image-file-input"
                  />
                  {uploadError && (
                    <span className="admin-error" data-testid="tour-image-upload-error" style={{ padding: '4px 8px', fontSize: 13 }}>
                      {uploadError}
                    </span>
                  )}
                  <small style={{ color: '#888' }}>
                    Pick a file to upload (Strapi handles resizing), or paste a URL/path manually.
                  </small>
                </div>
              </div>
            </div>
            <div className="admin-form-group full" style={{ flexDirection: 'row', alignItems: 'center' }}>
              <input
                type="checkbox"
                id="featured-chk"
                checked={form.isFeatured}
                onChange={(e) => updateField('isFeatured', e.target.checked)}
                style={{ width: 18, height: 18, marginRight: 8 }}
              />
              <label htmlFor="featured-chk" style={{ margin: 0 }}>Featured on homepage</label>
            </div>
            <div className="admin-form-actions">
              <button type="button" onClick={closeForm} className="admin-btn secondary" disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="admin-btn" disabled={submitting} data-testid="tour-form-submit">
                <FiSave style={{ verticalAlign: 'middle', marginRight: 6 }} />
                {submitting ? 'Saving…' : editing ? 'Save changes' : 'Create tour'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="admin-card">
        <div className="admin-card-header">
          <h3>All tours ({tours.length})</h3>
        </div>
        {loading ? (
          <div className="admin-empty" data-testid="tours-loading">Loading…</div>
        ) : tours.length === 0 ? (
          <div className="admin-empty">No tours yet. Click "New tour" to create the first one.</div>
        ) : (
          <table className="admin-table" data-testid="tours-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Locale</th>
                <th>Name</th>
                <th>Slug</th>
                <th>Region</th>
                <th>Price</th>
                <th>Max pax</th>
                <th>Featured</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tours.map((t) => (
                <tr key={`${t.id}-${t.locale}`} data-testid={`tour-row-${t.id}`}>
                  <td>#{t.id}</td>
                  <td><code>{t.locale}</code></td>
                  <td title={t.tourName}>{(t.tourName || '').slice(0, 40)}</td>
                  <td><code style={{ fontSize: 11 }}>{t.slug}</code></td>
                  <td>{t.region || '—'}</td>
                  <td>{formatVND(t.price)}</td>
                  <td>{t.maxParticipants || '—'}</td>
                  <td>{t.isFeatured ? '★' : '—'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => openEdit(t)}
                      className="admin-btn secondary"
                      style={{ padding: '4px 10px', marginRight: 6 }}
                      data-testid={`tour-edit-${t.id}`}
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      onClick={() => handleDelete(t)}
                      className="admin-btn danger"
                      style={{ padding: '4px 10px' }}
                      data-testid={`tour-delete-${t.id}`}
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminTours;
