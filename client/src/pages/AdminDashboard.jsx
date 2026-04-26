import React, { useEffect, useState, useContext } from 'react';
import { Alert, Table, Button } from 'react-bootstrap';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import axios from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getImageUrl } from '../utils/imageUrl';
import './AdminDashboard.css';

/* ─── Constants ─────────────────────────────────────────── */
const DEPARTMENTS = [
  'Computer Science Engineering',
  'CSE (AIML)',
  'CSBS',
  'Electronics',
  'Electrical',
  'Mechanical',
  'MBA',
  'MCA',
];

const PRODUCT_CATEGORIES = ['Books', 'Electronics', 'Hostel', 'Stationery', 'Lab', 'Sports', 'Others'];
const ORDER_STATUSES = ['pending', 'accepted', 'completed', 'rejected'];

const PIE_COLORS = ['#FFCA28', '#66BB6A', '#42A5F5', '#EF5350'];
const BAR_COLORS = ['#7C8CF8', '#A78BFA', '#67CBA0', '#FCA5A5', '#FCD34D', '#86EFAC', '#FDA4AF', '#93C5FD'];

const navItems = [
  { key: 'overview',  label: 'Overview',  icon: 'fa-chart-pie' },
  { key: 'users',     label: 'Users',     icon: 'fa-users' },
  { key: 'products',  label: 'Products',  icon: 'fa-box-open' },
  { key: 'orders',    label: 'Orders',    icon: 'fa-receipt' },
];

/* ─── Helpers ────────────────────────────────────────────── */
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function FilterPanel({ title, icon, options, selected, onSelect }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="filter-panel">
      <button className="filter-panel-header" onClick={() => setOpen(o => !o)}>
        <span className="filter-panel-title">
          <i className={`fa-solid ${icon}`} /> {title}
        </span>
        <i className={`fa-solid fa-chevron-down filter-toggle-icon ${open ? 'open' : ''}`} />
      </button>
      {open && (
        <div className="filter-panel-body">
          <span
            className={`filter-chip ${selected === null ? 'active' : ''}`}
            onClick={() => onSelect(null)}
          >
            All
          </span>
          {options.map(opt => (
            <span
              key={opt}
              className={`filter-chip ${selected === opt ? 'active' : ''}`}
              onClick={() => onSelect(opt === selected ? null : opt)}
            >
              {opt}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────── */
const AdminDashboard = () => {
  const { logout, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [users, setUsers]       = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders]     = useState([]);
  const [stats, setStats]       = useState({ totalUsers: 0, totalProducts: 0, totalOrders: 0 });
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(true);
  const [activeView, setActiveView] = useState('overview');

  // Filter states
  const [deptFilter, setDeptFilter]     = useState(null);
  const [catFilter, setCatFilter]       = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);

  /* ── fetch ── */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, productsRes, ordersRes, statsRes] = await Promise.all([
          axios.get('/admin/users'),
          axios.get('/admin/products'),
          axios.get('/admin/orders'),
          axios.get('/admin/stats'),
        ]);
        setUsers(usersRes.data);
        setProducts(productsRes.data);
        setOrders(ordersRes.data);
        setStats(statsRes.data || {});
      } catch (err) {
        console.error(err);
        setError('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  /* ── actions ── */
  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user? Their products will also be removed.')) return;
    try {
      await axios.delete(`/admin/users/${id}`);
      setUsers(u => u.filter(x => x._id !== id));
      setProducts(p => p.filter(x => !x.sellerId || x.sellerId._id !== id));
    } catch (err) {
      console.error(err);
      setError('Failed to delete user');
    }
  };

  const handleToggleBlock = async (id) => {
    try {
      await axios.put(`/admin/users/${id}/block-toggle`);
      const res = await axios.get('/admin/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to update block status');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await axios.delete(`/admin/products/${id}`);
      const deleted = products.find(p => p._id === id);
      setProducts(p => p.filter(x => x._id !== id));
      if (deleted?.sellerId) {
        setUsers(u => u.map(x =>
          x._id === deleted.sellerId._id
            ? { ...x, productCount: Math.max(0, (x.productCount || 0) - 1) }
            : x
        ));
      }
    } catch (err) {
      console.error(err);
      setError('Failed to delete product');
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  /* ── derived data for charts ── */
  const pieData = (() => {
    const counts = { pending: 0, accepted: 0, completed: 0, rejected: 0 };
    orders.forEach(o => { if (counts[o.status] !== undefined) counts[o.status]++; });
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => ({ name: capitalize(k), value: v }));
  })();

  // Bar chart: always show all 7 known categories, count products for each
  const barData = PRODUCT_CATEGORIES.map(cat => ({
    name: cat,
    Products: products.filter(p => p.category === cat).length,
  }));

  /* ── filtered lists ── */
  const filteredUsers = deptFilter
    ? users.filter(u => u.department === deptFilter)
    : users;

  const filteredProducts = catFilter
    ? products.filter(p => p.category === catFilter)
    : products;

  const filteredOrders = statusFilter
    ? orders.filter(o => o.status === statusFilter)
    : orders;

  /* ── loading ── */
  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner-ring" />
        <span style={{ color: '#6366f1', fontWeight: 700, fontSize: '1rem' }}>Loading Dashboard…</span>
      </div>
    );
  }

  const titleMap = {
    overview: 'Dashboard Overview',
    users:    'User Management',
    products: 'Product Management',
    orders:   'Order Management',
  };

  return (
    <div className="admin-shell">

      {/* ══════════ LEFT SIDEBAR ══════════ */}
      <aside className="admin-sidebar">

        {/* Logo – mirrors Navbar brand */}
        <div className="admin-logo">
          <span className="admin-logo-brand">
            <i className="fa-solid fa-building-columns" />
            CampusCart
          </span>
          <span className="admin-logo-sub">Admin Panel</span>
        </div>

        {/* Nav */}
        <nav className="admin-nav">
          {navItems.map(item => (
            <button
              key={item.key}
              className={`admin-nav-item ${activeView === item.key ? 'active' : ''}`}
              onClick={() => setActiveView(item.key)}
            >
              <span className="nav-icon"><i className={`fa-solid ${item.icon}`} /></span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="admin-sidebar-footer">
          <button className="admin-logout-btn" onClick={handleLogout}>
            <span className="nav-icon"><i className="fa-solid fa-right-from-bracket" /></span>
            <span className="nav-label">Logout</span>
          </button>
        </div>
      </aside>

      {/* ══════════ RIGHT CONTENT ══════════ */}
      <main className="admin-content">

        {/* Page Header */}
        <div className="admin-content-header">
          <div className="admin-content-title">{titleMap[activeView]}</div>
          <div className="admin-content-sub">
            Welcome back, <strong>{user?.name || 'Admin'}</strong> · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>

        {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

        {/* ── OVERVIEW ── */}
        {activeView === 'overview' && (
          <>
            {/* Stat Cards */}
            <div className="stat-cards-grid">
              <div className="stat-card stat-card-users">
                <div className="stat-card-icon"><i className="fa-solid fa-users" /></div>
                <div className="stat-card-info">
                  <div className="stat-label">Total Users</div>
                  <div className="stat-value">{stats.totalUsers ?? users.length}</div>
                </div>
              </div>
              <div className="stat-card stat-card-products">
                <div className="stat-card-icon"><i className="fa-solid fa-box-open" /></div>
                <div className="stat-card-info">
                  <div className="stat-label">Total Products</div>
                  <div className="stat-value">{stats.totalProducts ?? products.length}</div>
                </div>
              </div>
              <div className="stat-card stat-card-orders">
                <div className="stat-card-icon"><i className="fa-solid fa-receipt" /></div>
                <div className="stat-card-info">
                  <div className="stat-label">Total Orders</div>
                  <div className="stat-value">{stats.totalOrders ?? orders.length}</div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="charts-grid">
              {/* Pie – order status */}
              <div className="chart-card">
                <div className="chart-title">
                  <i className="fa-solid fa-chart-pie" /> Order Status
                </div>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Legend
                        iconType="circle"
                        iconSize={10}
                        wrapperStyle={{ fontSize: '0.82rem', fontWeight: 600 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-state"><i className="fa-solid fa-chart-pie" />No order data yet</div>
                )}
              </div>

              {/* Bar – products by category */}
              <div className="chart-card">
                <div className="chart-title">
                  <i className="fa-solid fa-chart-bar" /> Products by Category
                </div>
                {barData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={barData} barSize={32} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} />
                      <YAxis tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="Products" radius={[8, 8, 0, 0]}>
                        {barData.map((_, i) => (
                          <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-state"><i className="fa-solid fa-chart-bar" />No product data yet</div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ── USERS ── */}
        {activeView === 'users' && (
          <>
            <FilterPanel
              title="Filter by Department"
              icon="fa-building-columns"
              options={DEPARTMENTS}
              selected={deptFilter}
              onSelect={setDeptFilter}
            />
            <div className="admin-table-card">
              {filteredUsers.length === 0 ? (
                <div className="empty-state">
                  <i className="fa-solid fa-users" />
                  No users found{deptFilter ? ` in ${deptFilter}` : ''}.
                </div>
              ) : (
                <Table responsive className="mb-0">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Department</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Items</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u, idx) => (
                      <tr key={u._id}>
                        <td>{idx + 1}</td>
                        <td><strong>{u.name}</strong></td>
                        <td>{u.email}</td>
                        <td>{u.phone || '–'}</td>
                        <td>{u.department || '–'}</td>
                        <td>
                          <span className={`status-badge ${u.isAdmin ? 'admin' : 'user'}`}>
                            {u.isAdmin ? 'Admin' : 'User'}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${u.isBlocked ? 'blocked' : 'active'}`}>
                            {u.isBlocked ? 'Blocked' : 'Active'}
                          </span>
                        </td>
                        <td>{u.productCount || 0}</td>
                        <td>{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                        <td>
                          {!u.isAdmin && (
                            <div className="d-flex gap-2 flex-wrap">
                              <Button
                                size="sm"
                                variant={u.isBlocked ? 'success' : 'warning'}
                                onClick={() => handleToggleBlock(u._id)}
                                style={{ fontSize: '0.78rem', borderRadius: 8, padding: '4px 12px' }}
                              >
                                {u.isBlocked ? 'Unblock' : 'Block'}
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleDeleteUser(u._id)}
                                style={{ fontSize: '0.78rem', borderRadius: 8, padding: '4px 12px' }}
                              >
                                Delete
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </div>
          </>
        )}

        {/* ── PRODUCTS ── */}
        {activeView === 'products' && (
          <>
            <FilterPanel
              title="Filter by Category"
              icon="fa-tag"
              options={PRODUCT_CATEGORIES}
              selected={catFilter}
              onSelect={setCatFilter}
            />
            <div className="admin-table-card">
              {filteredProducts.length === 0 ? (
                <div className="empty-state">
                  <i className="fa-solid fa-box-open" />
                  No products found{catFilter ? ` in "${catFilter}"` : ''}.
                </div>
              ) : (
                <Table responsive className="mb-0">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Image</th>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Seller</th>
                      <th>Email</th>
                      <th>Listed On</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((p, idx) => (
                      <tr key={p._id}>
                        <td>{idx + 1}</td>
                        <td>
                          <img
                            src={getImageUrl(p.images?.[0], { placeholderSize: 80 })}
                            alt={p.title}
                            style={{ width: 60, height: 60, objectFit: 'contain', background: '#f8f9fa', borderRadius: 8 }}
                          />
                        </td>
                        <td><strong>{p.title}</strong></td>
                        <td>
                          <span className="status-badge user">{p.category}</span>
                        </td>
                        <td style={{ color: '#6366f1', fontWeight: 700 }}>₹{p.price}</td>
                        <td>{p.sellerId?.name || '–'}</td>
                        <td>{p.sellerId?.email || '–'}</td>
                        <td>{new Date(p.createdAt).toLocaleDateString('en-IN')}</td>
                        <td>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDeleteProduct(p._id)}
                            style={{ fontSize: '0.78rem', borderRadius: 8, padding: '4px 12px' }}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </div>
          </>
        )}

        {/* ── ORDERS ── */}
        {activeView === 'orders' && (
          <>
            <FilterPanel
              title="Filter by Status"
              icon="fa-filter"
              options={ORDER_STATUSES}
              selected={statusFilter}
              onSelect={setStatusFilter}
            />
            <div className="admin-table-card">
              {filteredOrders.length === 0 ? (
                <div className="empty-state">
                  <i className="fa-solid fa-receipt" />
                  No orders found{statusFilter ? ` with status "${statusFilter}"` : ''}.
                </div>
              ) : (
                <Table responsive className="mb-0">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Product</th>
                      <th>Buyer</th>
                      <th>Seller</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Pickup</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((o, idx) => (
                      <tr key={o._id}>
                        <td>{idx + 1}</td>
                        <td><strong>{o.productTitle}</strong></td>
                        <td>
                          {o.buyerId?.name || '–'}
                          <br />
                          <small style={{ color: '#94a3b8' }}>{o.buyerId?.email}</small>
                        </td>
                        <td>
                          {o.sellerId?.name || '–'}
                          <br />
                          <small style={{ color: '#94a3b8' }}>{o.sellerId?.email}</small>
                        </td>
                        <td style={{ color: '#6366f1', fontWeight: 700 }}>₹{o.amount}</td>
                        <td>
                          <span className={`status-badge ${o.status}`}>
                            {capitalize(o.status)}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.82rem' }}>
                          {o.pickupDate
                            ? `${new Date(o.pickupDate).toLocaleDateString('en-IN')} ${o.pickupTime || ''} · ${o.pickupLocation || '–'}`
                            : '–'}
                        </td>
                        <td>{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </div>
          </>
        )}

      </main>
    </div>
  );
};

export default AdminDashboard;