import { useState, useEffect } from 'react';
import './Admin.css';

function adminFetch(url, options = {}) {
  const token = localStorage.getItem('yoda_admin_token');
  const csrfToken = localStorage.getItem('yoda_csrf_token');
  const method = (options.method || 'GET').toUpperCase();
  const headers = { ...(options.headers || {}) };

  if (token) {
    headers.Authorization = 'Bearer ' + token;
  }

  const isStateChanging = method === 'POST' || method === 'PUT' || method === 'DELETE';
  const requiresCsrf = isStateChanging && url !== '/api/admin/login';

  if (requiresCsrf) {
    if (!csrfToken) return Promise.reject(new Error('Missing CSRF token'));
    headers['X-CSRF-Token'] = csrfToken;
  }

  return fetch(url, { ...options, headers });
}

export default function Admin() {
  const [password, setPassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(() => Boolean(localStorage.getItem('yoda_admin_token')));
  const [error, setError] = useState('');
  const [page, setPage] = useState('dashboard');

  // ─── Data ───
  const [dashboard, setDashboard] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [discounts, setDiscounts] = useState([]);

  // ─── Product modal ───
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', oldPrice: '', category: '', stock: '', sku: '', status: 'Active', image: '/assets/template.png' });
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');

  // ─── Category modal ───
  const [catModal, setCatModal] = useState(false);
  const [catEditId, setCatEditId] = useState(null);
  const [catName, setCatName] = useState('');

  // ─── Discount modal ───
  const [discModal, setDiscModal] = useState(false);
  const [discForm, setDiscForm] = useState({ code: '', discount: '' });

  useEffect(() => {
    if (loggedIn) {
      adminFetch('/api/dashboard').then(r => r.json()).then(setDashboard).catch(() => {});
      loadProducts();
      loadCategories();
      adminFetch('/api/orders').then(r => r.json()).then(d => setOrders(d.orders)).catch(() => {});
      adminFetch('/api/discounts').then(r => r.json()).then(d => setDiscounts(d.discounts)).catch(() => {});
    }
  }, [loggedIn]);

  const loadProducts = () =>
    adminFetch('/api/products').then(r => r.json()).then(d => setProducts(d.products));
  const loadCategories = () =>
    adminFetch('/api/categories').then(r => r.json()).then(d => setCategories(d.categories));

  function openAdd() {
    setForm({ name: '', description: '', price: '', oldPrice: '', category: '', stock: '', sku: '', status: 'Active', image: '/assets/template.png' });
    setEditId(null);
    setShowModal(true);
  }
  function openEdit(p) {
    setForm({
      name: p.name, description: p.description, price: String(p.price), oldPrice: String(p.oldPrice || ''),
      category: p.category, stock: String(p.stock), sku: p.sku, status: p.status, image: p.image,
    });
    setEditId(p.id);
    setShowModal(true);
  }
  function saveProduct() {
    const body = {
      name: form.name, description: form.description, price: parseFloat(form.price),
      oldPrice: parseFloat(form.oldPrice) || 0, category: form.category, stock: parseInt(form.stock) || 0,
      sku: form.sku, status: form.status, image: '/assets/template.png',
    };
    const url = editId ? `/api/products/${editId}` : '/api/products';
    const method = editId ? 'PUT' : 'POST';
    adminFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(() => { setShowModal(false); loadProducts(); });
  }
  function deleteProduct(id) {
    if (!confirm('Delete this product?')) return;
    adminFetch(`/api/products/${id}`, { method: 'DELETE' }).then(() => loadProducts());
  }

  function saveCategory() {
    if (!catName.trim()) return;
    const url = catEditId ? `/api/categories/${catEditId}` : '/api/categories';
    const method = catEditId ? 'PUT' : 'POST';
    adminFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: catName }) })
      .then(() => { setCatModal(false); loadCategories(); });
  }

  function openDiscountAdd() {
    setDiscForm({ code: '', discount: '' });
    setDiscModal(true);
  }
  function saveDiscount() {
    if (!discForm.code.trim()) return;
    adminFetch('/api/discounts', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: discForm.code, discount: parseFloat(discForm.discount) || 0 }),
    }).then(() => {
      setDiscModal(false);
      adminFetch('/api/discounts').then(r => r.json()).then(d => setDiscounts(d.discounts));
    });
  }
  function deleteDiscount(id) {
    if (!confirm('Delete this discount?')) return;
    adminFetch(`/api/discounts/${id}`, { method: 'DELETE' }).then(() =>
      adminFetch('/api/discounts').then(r => r.json()).then(d => setDiscounts(d.discounts))
    );
  }

  const filtered = products.filter(p => {
    const match = p.name.toLowerCase().includes(search.toLowerCase());
    const cat = !filterCat || p.category === filterCat;
    return match && cat;
  });

  if (!loggedIn) {
    return (
      <div className="admin-page">
        <div className="xp-panel" style={{ maxWidth: '400px' }}>
          <h2 className="xp-title">Admin</h2>
          <input className="xp-input" type="password" placeholder="password" style={{ marginBottom: '16px' }}
            value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} />
          {error && <p style={{ color: '#ff6b6b', fontSize: '9px', marginBottom: '12px', textAlign: 'center' }}>{error}</p>}
          <button className="start-btn" style={{ fontSize: '12px', padding: '12px 24px', width: '100%' }}
            onClick={() => {
              adminFetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) })
                .then(r => r.json()).then(data => {
                  if (data.ok && data.token) {
                    localStorage.setItem('yoda_admin_token', data.token);
                    localStorage.setItem('yoda_csrf_token', data.csrfToken || '');
                    setLoggedIn(true);
                  } else setError('Wrong password');
                }).catch(() => setError('Server error'));
            }}>Enter</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="sidebar-title">YODA Admin</div>
          {[
            { key: 'dashboard', label: '📊 Dashboard' },
            { key: 'products', label: '📦 Products' },
            { key: 'categories', label: '📁 Categories' },
            { key: 'orders', label: '📋 Orders' },
            { key: 'inventory', label: '📊 Inventory' },
            { key: 'analytics', label: '📈 Analytics' },
            { key: 'settings', label: '⚙️ Settings' },
            { key: 'banners', label: '🖼️ Banners' },
            { key: 'content', label: '✏️ Content' },
            { key: 'discounts', label: '🏷️ Discounts' },
          ].map(l => (
            <a key={l.key} className={`sidebar-link${page === l.key ? ' active' : ''}`}
              onClick={() => setPage(l.key)}>{l.label}</a>
          ))}
        </aside>
        <main className="admin-content">
          {page === 'dashboard' && <DashboardView data={dashboard} />}
          {page === 'products' && (
            <ProductsView
              products={filtered} categories={categories}
              search={search} setSearch={setSearch}
              filterCat={filterCat} setFilterCat={setFilterCat}
              onAdd={openAdd} onEdit={openEdit} onDelete={deleteProduct}
            />
          )}
          {page === 'categories' && (
            <CategoriesView
              categories={categories}
              onAdd={() => { setCatEditId(null); setCatName(''); setCatModal(true); }}
              onEdit={(c) => { setCatEditId(c.id); setCatName(c.name); setCatModal(true); }}
              onDelete={(id) => {
                if (!confirm('Delete this category?')) return;
                adminFetch(`/api/categories/${id}`, { method: 'DELETE' }).then(() => loadCategories());
              }}
            />
          )}
          {page === 'orders' && (
            <OrdersView
              orders={orders}
              onStatusChange={(id, status) => {
                adminFetch(`/api/orders/${id}/status`, {
                  method: 'PUT', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status }),
                }).then(() => adminFetch('/api/orders').then(r => r.json()).then(d => setOrders(d.orders)));
              }}
            />
          )}
          {page === 'inventory' && (
            <InventoryView products={products} onStockChange={(id, stock) => {
              adminFetch(`/api/products/${id}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stock }),
              }).then(() => loadProducts());
            }} />
          )}
          {page === 'analytics' && <AnalyticsView />}
          {page === 'settings' && <SettingsView />}
          {page === 'banners' && <BannersView />}
          {page === 'content' && <ContentView />}
          {page === 'discounts' && (
            <DiscountsView
              discounts={discounts}
              onAdd={openDiscountAdd}
              onDelete={deleteDiscount}
              onToggle={(id) => {
                adminFetch(`/api/discounts/${id}/toggle`, { method: 'PUT' })
                  .then(() => adminFetch('/api/discounts').then(r => r.json()).then(d => setDiscounts(d.discounts)));
              }}
            />
          )}
        </main>

        {/* Product Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-panel" onClick={e => e.stopPropagation()}>
              <h3 className="modal-title">{editId ? 'Edit Product' : 'Add Product'}</h3>
              {[
                { label: 'Name', key: 'name' },
                { label: 'Description', key: 'description' },
                { label: 'Price', key: 'price' },
                { label: 'Old Price', key: 'oldPrice' },
                { label: 'SKU / Article', key: 'sku' },
                { label: 'Stock', key: 'stock' },
              ].map(f => (
                <div key={f.key} className="modal-field">
                  <label>{f.label}</label>
                  {f.key === 'description' ? (
                    <textarea className="xp-input" rows={3} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
                  ) : (
                    <input className="xp-input" value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
                  )}
                </div>
              ))}
              <div className="modal-field">
                <label>Category</label>
                <select className="xp-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  <option value="">—</option>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div className="modal-field">
                <label>Status</label>
                <select className="xp-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="Active">Active</option><option value="Hidden">Hidden</option>
                </select>
              </div>
              <div className="modal-actions">
                <button className="start-btn" style={{ fontSize: '10px', padding: '10px 20px' }} onClick={saveProduct}>Save</button>
                <button className="start-btn" style={{ fontSize: '10px', padding: '10px 20px', background: '#333', boxShadow: 'none' }} onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Category Modal */}
        {catModal && (
          <div className="modal-overlay" onClick={() => setCatModal(false)}>
            <div className="modal-panel" style={{ maxWidth: '380px' }} onClick={e => e.stopPropagation()}>
              <h3 className="modal-title">{catEditId ? 'Edit Category' : 'Add Category'}</h3>
              <div className="modal-field">
                <label>Name</label>
                <input className="xp-input" value={catName} onChange={e => setCatName(e.target.value)} autoFocus />
              </div>
              <div className="modal-actions">
                <button className="start-btn" style={{ fontSize: '10px', padding: '10px 20px' }} onClick={saveCategory}>Save</button>
                <button className="start-btn" style={{ fontSize: '10px', padding: '10px 20px', background: '#333', boxShadow: 'none' }} onClick={() => setCatModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Discount Modal */}
        {discModal && (
          <div className="modal-overlay" onClick={() => setDiscModal(false)}>
            <div className="modal-panel" style={{ maxWidth: '380px' }} onClick={e => e.stopPropagation()}>
              <h3 className="modal-title">Add Discount</h3>
              <div className="modal-field">
                <label>Code</label>
                <input className="xp-input" value={discForm.code} onChange={e => setDiscForm({ ...discForm, code: e.target.value.toUpperCase() })} autoFocus />
              </div>
              <div className="modal-field">
                <label>Discount %</label>
                <input className="xp-input" type="number" value={discForm.discount} onChange={e => setDiscForm({ ...discForm, discount: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button className="start-btn" style={{ fontSize: '10px', padding: '10px 20px' }} onClick={saveDiscount}>Save</button>
                <button className="start-btn" style={{ fontSize: '10px', padding: '10px 20px', background: '#333', boxShadow: 'none' }} onClick={() => setDiscModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Dashboard ───
function DashboardView({ data }) {
  const cards = [
    { icon: '💰', value: data ? `$${data.totalRevenue.toFixed(0)}` : '...', label: 'Revenue' },
    { icon: '📦', value: data ? data.totalOrders : '...', label: 'Total Orders' },
    { icon: '🆕', value: data ? data.newOrders : '...', label: 'New Orders' },
    { icon: '⚠️', value: data ? data.lowStock : '...', label: 'Low Stock', warn: true },
  ];
  return (
    <><h2 className="xp-title" style={{ textAlign: 'left', fontSize: '22px' }}>Dashboard</h2>
      <div className="dashboard-grid">
        {cards.map((c, i) => (
          <div key={i} className={`dash-card${c.warn ? ' warn' : ''}`}>
            <div className="dash-icon">{c.icon}</div>
            <div className="dash-info"><div className="dash-value">{c.value}</div><div className="dash-label">{c.label}</div></div>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── Products ───
function ProductsView({ products, categories, search, setSearch, filterCat, setFilterCat, onAdd, onEdit, onDelete }) {
  return (
    <><h2 className="xp-title" style={{ textAlign: 'left', fontSize: '22px' }}>Products</h2>
      <div className="toolbar">
        <button className="start-btn" style={{ fontSize: '10px', padding: '10px 18px' }} onClick={onAdd}>+ Add Product</button>
        <input className="xp-input" style={{ width: '200px', fontSize: '9px', padding: '8px 12px' }} placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="xp-input" style={{ width: '140px', fontSize: '9px', padding: '8px 12px' }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
      </div>
      <table className="admin-table">
        <thead><tr><th>ID</th><th>Photo</th><th>Name</th><th>Price</th><th>Old Price</th><th>Stock</th><th>Category</th><th>SKU</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>{products.map(p => (
          <tr key={p.id}>
            <td className="dim">{p.id}</td><td><span className="prod-icon">📱</span></td>
            <td>{p.name}</td><td className="green">${p.price.toFixed(2)}</td>
            <td className="old">{p.oldPrice ? `$${p.oldPrice.toFixed(2)}` : '—'}</td>
            <td>{p.stock}</td><td className="dim">{p.category}</td><td className="dim">{p.sku}</td>
            <td><span className={`status-${p.status.toLowerCase()}`}>{p.status}</span></td>
            <td><button className="act-btn edit" onClick={() => onEdit(p)}>Edit</button><button className="act-btn del" onClick={() => onDelete(p.id)}>Del</button></td>
          </tr>
        ))}</tbody>
      </table>
    </>
  );
}

// ─── Categories ───
function CategoriesView({ categories, onAdd, onEdit, onDelete }) {
  return (
    <><h2 className="xp-title" style={{ textAlign: 'left', fontSize: '22px' }}>Categories</h2>
      <div className="toolbar">
        <button className="start-btn" style={{ fontSize: '10px', padding: '10px 18px' }} onClick={onAdd}>+ Add Category</button>
      </div>
      <table className="admin-table">
        <thead><tr><th style={{ width: '40px' }}>#</th><th>Name</th><th style={{ width: '140px' }}>Actions</th></tr></thead>
        <tbody>{categories.map((c, i) => (
          <tr key={c.id}>
            <td className="dim">{i + 1}</td>
            <td>{c.name}</td>
            <td><button className="act-btn edit" onClick={() => onEdit(c)}>Edit</button><button className="act-btn del" onClick={() => onDelete(c.id)}>Del</button></td>
          </tr>
        ))}</tbody>
      </table>
    </>
  );
}

// ─── Orders ───
const ORDER_STATUSES = ['New', 'Paid', 'Shipped', 'Delivered', 'Cancelled'];

function OrdersView({ orders, onStatusChange }) {
  const [expanded, setExpanded] = useState(null);

  return (
    <><h2 className="xp-title" style={{ textAlign: 'left', fontSize: '22px' }}>Orders ({orders.length})</h2>
      <table className="admin-table">
        <thead><tr>
          <th>Order #</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Address</th><th>Status</th><th>Date</th>
        </tr></thead>
        <tbody>{orders.map(o => (
          <tr key={o.id}>
            <td className="dim">{o.id}</td>
            <td>{o.customer}</td>
            <td style={{ fontSize: '7px', maxWidth: '120px', whiteSpace: 'normal', wordBreak: 'break-word' }}>{o.items}</td>
            <td className="green">${o.total.toFixed(2)}</td>
            <td className="dim">{o.payment}</td>
            <td className="dim" style={{ fontSize: '6px', maxWidth: '120px', whiteSpace: 'normal', wordBreak: 'break-word' }}>{o.address}</td>
            <td>
              <select
                className={`status-select status-${o.status.toLowerCase()}`}
                value={o.status}
                onChange={e => onStatusChange(o.id, e.target.value)}
              >
                {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </td>
            <td className="dim">{o.date}</td>
          </tr>
        ))}</tbody>
      </table>
    </>
  );
}

// ─── Discounts ───
function DiscountsView({ discounts, onAdd, onDelete, onToggle }) {
  return (
    <><h2 className="xp-title" style={{ textAlign: 'left', fontSize: '22px' }}>Discounts ({discounts.length})</h2>
      <div className="toolbar">
        <button className="start-btn" style={{ fontSize: '10px', padding: '10px 18px' }} onClick={onAdd}>+ Add Discount</button>
      </div>
      <table className="admin-table">
        <thead><tr><th>Code</th><th>Discount %</th><th>Active</th><th style={{ width: '140px' }}>Actions</th></tr></thead>
        <tbody>{discounts.map(d => (
          <tr key={d.id}>
            <td style={{ color: '#ffcc00', fontWeight: 'bold' }}>{d.code}</td>
            <td className="green">{d.discount}%</td>
            <td>{d.active ? <span className="status-active">Active</span> : <span className="status-hidden">Inactive</span>}</td>
            <td>
              <button className="act-btn edit" onClick={() => onToggle(d.id)}>
                {d.active ? 'Disable' : 'Enable'}
              </button>
              <button className="act-btn del" onClick={() => onDelete(d.id)}>Del</button>
            </td>
          </tr>
        ))}</tbody>
      </table>
    </>
  );
}


// ─── Inventory ───
function InventoryView({ products, onStockChange }) {
  const [editingId, setEditingId] = useState(null);
  const [newStock, setNewStock] = useState('');

  const lowStock = products.filter(p => p.stock > 0 && p.stock <= 5);

  function saveStock(id) {
    const val = parseInt(newStock);
    if (isNaN(val) || val < 0) return;
    onStockChange(id, val);
    setEditingId(null);
  }

  return (
    <>
      <h2 className="xp-title" style={{ textAlign: 'left', fontSize: '22px' }}>Inventory</h2>

      {lowStock.length > 0 && (
        <div style={{
          background: 'rgba(255,150,50,0.1)', border: '1px solid rgba(255,150,50,0.3)',
          borderRadius: '6px', padding: '12px 16px', marginBottom: '20px',
          fontSize: '9px', color: '#ff9632'
        }}>
          ⚠️ {lowStock.length} product{lowStock.length > 1 ? 's' : ''} low on stock: {lowStock.map(p => p.name).join(', ')}
        </div>
      )}

      <table className="admin-table">
        <thead><tr>
          <th>Product</th><th>SKU</th><th>Current Stock</th><th style={{ width: '160px' }}>Update</th>
        </tr></thead>
        <tbody>{products.map(p => (
          <tr key={p.id} style={p.stock <= 5 && p.stock > 0 ? { background: 'rgba(255,150,50,0.04)' } : {}}>
            <td>{p.name} {p.stock <= 0 && <span style={{ color: '#ff6b6b' }}>(out of stock)</span>}</td>
            <td className="dim">{p.sku}</td>
            <td style={{
              fontWeight: 'bold',
              color: p.stock <= 0 ? '#ff6b6b' : p.stock <= 5 ? '#ff9632' : '#39b54a'
            }}>{p.stock}</td>
            <td>
              {editingId === p.id ? (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input className="xp-input" type="number" style={{ width: '80px', fontSize: '10px', padding: '6px 10px' }}
                    value={newStock} onChange={e => setNewStock(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveStock(p.id)} autoFocus />
                  <button className="act-btn edit" onClick={() => saveStock(p.id)}>Save</button>
                  <button className="act-btn" onClick={() => setEditingId(null)} style={{ color: '#aaa', borderColor: '#444' }}>X</button>
                </div>
              ) : (
                <button className="act-btn edit" onClick={() => { setEditingId(p.id); setNewStock(String(p.stock)); }}>
                  Change
                </button>
              )}
            </td>
          </tr>
        ))}</tbody>
      </table>
    </>
  );
}

// ─── Banners ───
function BannersView() {
  const [banner, setBanner] = useState({ title: '', subtitle: '', buttonText: '', buttonLink: '', active: true });
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminFetch('/api/banner').then(r => r.json()).then(d => { setBanner(d.banner); setLoaded(true); }).catch(() => {});
  }, []);

  function save() {
    setSaving(true);
    adminFetch('/api/banner', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(banner),
    }).then(() => { setSaving(false); alert('Banner saved!'); });
  }

  if (!loaded) return null;

  return (
    <>
      <h2 className="xp-title" style={{ textAlign: 'left', fontSize: '22px' }}>Banner</h2>
      <div className="modal-panel" style={{ maxWidth: '500px', marginTop: '16px' }}>
        {[
          { label: 'Title', key: 'title' },
          { label: 'Subtitle', key: 'subtitle' },
          { label: 'Button Text', key: 'buttonText' },
          { label: 'Button Link (e.g. /catalog)', key: 'buttonLink' },
        ].map(f => (
          <div className="modal-field" key={f.key}>
            <label>{f.label}</label>
            <input className="xp-input" value={banner[f.key]} onChange={e => setBanner({ ...banner, [f.key]: e.target.value })} />
          </div>
        ))}
        <div className="modal-field">
          <label>Active</label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', color: '#ddd' }}>
            <input type="checkbox" checked={banner.active} onChange={e => setBanner({ ...banner, active: e.target.checked })} />
            Show banner on homepage
          </label>
        </div>
        <div className="modal-actions">
          <button className="start-btn" style={{ fontSize: '10px', padding: '10px 20px' }} onClick={save} disabled={saving}>
            {saving ? 'Saving...' : 'Save Banner'}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Content ───
function ContentView() {
  const [texts, setTexts] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminFetch('/api/site-texts').then(r => r.json()).then(d => { setTexts(d.texts); setLoaded(true); }).catch(() => {});
  }, []);

  function save() {
    setSaving(true);
    adminFetch('/api/site-texts', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(texts),
    }).then(() => { setSaving(false); alert('Content saved!'); });
  }

  if (!loaded) return null;

  const fields = [
    { label: 'About Title', key: 'aboutTitle' },
    { label: 'About Text', key: 'aboutText', area: true },
    { label: 'Contact Title', key: 'contactTitle' },
    { label: 'Contact Text', key: 'contactText', area: true },
    { label: 'FAQ Title', key: 'faqTitle' },
    { label: 'FAQ Text', key: 'faqText', area: true },
    { label: 'Footer Text', key: 'footerText' },
  ];

  return (
    <>
      <h2 className="xp-title" style={{ textAlign: 'left', fontSize: '22px' }}>Site Content</h2>
      <div className="modal-panel" style={{ maxWidth: '550px', marginTop: '16px' }}>
        {fields.map(f => (
          <div className="modal-field" key={f.key}>
            <label>{f.label}</label>
            {f.area ? (
              <textarea className="xp-input" rows={4} value={texts[f.key] || ''} onChange={e => setTexts({ ...texts, [f.key]: e.target.value })} />
            ) : (
              <input className="xp-input" value={texts[f.key] || ''} onChange={e => setTexts({ ...texts, [f.key]: e.target.value })} />
            )}
          </div>
        ))}
        <div className="modal-actions">
          <button className="start-btn" style={{ fontSize: '10px', padding: '10px 20px' }} onClick={save} disabled={saving}>
            {saving ? 'Saving...' : 'Save Content'}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Analytics ───
function AnalyticsView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch('/api/analytics').then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <p className="dim" style={{ fontSize: '10px' }}>Loading analytics...</p>;
  if (!data) return <p className="dim" style={{ fontSize: '10px' }}>No data yet.</p>;

  return (
    <>
      <h2 className="xp-title" style={{ textAlign: 'left', fontSize: '22px' }}>Analytics</h2>

      {/* Summary cards */}
      <div className="dashboard-grid" style={{ marginBottom: '24px' }}>
        <div className="dash-card">
          <div className="dash-icon">💰</div>
          <div className="dash-info">
            <div className="dash-value" style={{ fontSize: '16px' }}>${data.totalRevenue.toFixed(0)}</div>
            <div className="dash-label">Total Revenue</div>
          </div>
        </div>
        <div className="dash-card">
          <div className="dash-icon">📦</div>
          <div className="dash-info">
            <div className="dash-value" style={{ fontSize: '16px' }}>{data.totalOrders}</div>
            <div className="dash-label">Total Orders</div>
          </div>
        </div>
        <div className="dash-card">
          <div className="dash-icon">📊</div>
          <div className="dash-info">
            <div className="dash-value" style={{ fontSize: '16px' }}>${data.avgOrder.toFixed(2)}</div>
            <div className="dash-label">Avg Order</div>
          </div>
        </div>
        <div className="dash-card">
          <div className="dash-icon">🏆</div>
          <div className="dash-info">
            <div className="dash-value" style={{ fontSize: '13px' }}>{data.topProduct}</div>
            <div className="dash-label">Top Product ({data.topProductSales} sold)</div>
          </div>
        </div>
      </div>

      {/* Revenue by status */}
      <h3 className="xp-title" style={{ textAlign: 'left', fontSize: '14px', marginBottom: '12px' }}>Revenue by Status</h3>
      <table className="admin-table" style={{ marginBottom: '24px' }}>
        <thead><tr><th>Status</th><th>Revenue</th></tr></thead>
        <tbody>
          <tr><td>🕐 Pending (New)</td><td className="green">${data.revenueByStatus.pending.toFixed(2)}</td></tr>
          <tr><td>✅ Completed (Paid/Shipped/Delivered)</td><td className="green">${data.revenueByStatus.completed.toFixed(2)}</td></tr>
          <tr><td>❌ Cancelled</td><td style={{ color: '#ff6b6b' }}>${data.revenueByStatus.cancelled.toFixed(2)}</td></tr>
        </tbody>
      </table>

      {/* Popular products */}
      <h3 className="xp-title" style={{ textAlign: 'left', fontSize: '14px', marginBottom: '12px' }}>Popular Products</h3>
      <table className="admin-table" style={{ marginBottom: '24px' }}>
        <thead><tr><th>#</th><th>Product</th><th>Sold</th></tr></thead>
        <tbody>{data.popularProducts.map((p, i) => (
          <tr key={p.name}>
            <td className="dim">#{i + 1}</td>
            <td>{p.name}</td>
            <td className="green">{p.sold}</td>
          </tr>
        ))}</tbody>
      </table>

      {/* Monthly sales */}
      <h3 className="xp-title" style={{ textAlign: 'left', fontSize: '14px', marginBottom: '12px' }}>Monthly Sales</h3>
      <table className="admin-table">
        <thead><tr><th>Month</th><th>Revenue</th></tr></thead>
        <tbody>{data.monthlySales.map(m => (
          <tr key={m.month}>
            <td>{m.month}</td>
            <td className="green">${m.revenue.toFixed(2)}</td>
          </tr>
        ))}</tbody>
      </table>
    </>
  );
}

// ─── Settings ───
function SettingsView() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminFetch('/api/settings').then(r => r.json()).then(d => { setSettings(d.settings); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  function update(key, value) {
    setSettings({ ...settings, [key]: value });
  }

  function save() {
    setSaving(true);
    adminFetch('/api/settings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings),
    }).then(() => { setSaving(false); alert('Settings saved!'); }).catch(() => setSaving(false));
  }

  function addShipping() {
    const methods = [...(settings.shippingMethods || [])];
    methods.push({ name: '', price: 0, days: '' });
    setSettings({ ...settings, shippingMethods: methods });
  }

  function updateShipping(i, key, value) {
    const methods = [...settings.shippingMethods];
    methods[i] = { ...methods[i], [key]: key === 'price' ? parseFloat(value) || 0 : value };
    setSettings({ ...settings, shippingMethods: methods });
  }

  function removeShipping(i) {
    setSettings({ ...settings, shippingMethods: settings.shippingMethods.filter((_, idx) => idx !== i) });
  }

  if (loading) return <p className="dim" style={{ fontSize: '10px' }}>Loading settings...</p>;
  if (!settings) return <p className="dim" style={{ fontSize: '10px' }}>No settings.</p>;

  return (
    <>
      <h2 className="xp-title" style={{ textAlign: 'left', fontSize: '22px' }}>Settings</h2>

      <div className="modal-panel" style={{ maxWidth: '600px', marginTop: '16px' }}>
        {/* Currency */}
        <div className="modal-field">
          <label>Currency</label>
          <select className="xp-input" value={settings.currency} onChange={e => { update('currency', e.target.value); update('currencySymbol', e.target.value === 'EUR' ? '€' : e.target.value === 'GBP' ? '£' : '$'); }}>
            <option value="USD">USD ($)</option><option value="EUR">EUR (€)</option><option value="GBP">GBP (£)</option>
          </select>
        </div>

        {/* Payment Methods */}
        <div className="modal-field">
          <label>Payment Methods (comma separated)</label>
          <input className="xp-input" value={(settings.paymentMethods || []).join(', ')} onChange={e => update('paymentMethods', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
        </div>

        {/* SEO */}
        <div className="modal-field">
          <label>SEO Title</label>
          <input className="xp-input" value={settings.seoTitle || ''} onChange={e => update('seoTitle', e.target.value)} />
        </div>
        <div className="modal-field">
          <label>SEO Description</label>
          <textarea className="xp-input" rows={2} value={settings.seoDescription || ''} onChange={e => update('seoDescription', e.target.value)} />
        </div>
        <div className="modal-field">
          <label>SEO Keywords</label>
          <input className="xp-input" value={settings.seoKeywords || ''} onChange={e => update('seoKeywords', e.target.value)} />
        </div>

        <div className="modal-actions" style={{ justifyContent: 'space-between' }}>
          <button className="start-btn" style={{ fontSize: '10px', padding: '10px 20px' }} onClick={save} disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </>
  );
}
