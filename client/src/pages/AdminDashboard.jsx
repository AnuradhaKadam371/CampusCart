import React, { useEffect, useState, useContext } from 'react';
import { Container, Table, Alert, Card, Button, Navbar, Nav, Row, Col, Badge } from 'react-bootstrap';
import axios from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getImageUrl } from '../utils/imageUrl';

const AdminDashboard = () => {
    const { logout, user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [users, setUsers] = useState([]);
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState({ totalUsers: 0, totalProducts: 0, totalOrders: 0, openReports: 0 });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState('overview'); // overview | users | products | orders

    useEffect(() => {
        const fetchData = async () => {
            try {
                const usersRes = await axios.get('/admin/users');
                const productsRes = await axios.get('/admin/products');
                const ordersRes = await axios.get('/admin/orders');
                const statsRes = await axios.get('/admin/stats');
                setUsers(usersRes.data);
                setProducts(productsRes.data);
                setOrders(ordersRes.data);
                setStats(statsRes.data || {});
                setLoading(false);
            } catch (err) {
                console.error(err);
                setError('Failed to fetch data');
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleDeleteUser = async (id) => {
        if (window.confirm('Are you sure you want to delete this user? This will also delete all their listed products.')) {
            try {
                await axios.delete(`/admin/users/${id}`);
                setUsers(users.filter(user => user._id !== id));
                setProducts(products.filter(product => !product.sellerId || product.sellerId._id !== id));
            } catch (err) {
                console.error(err);
                setError('Failed to delete user');
            }
        }
    };

    const handleToggleBlock = async (id) => {
        try {
            await axios.put(`/admin/users/${id}/block-toggle`);
            const refreshed = await axios.get('/admin/users');
            setUsers(refreshed.data);
        } catch (err) {
            console.error(err);
            setError('Failed to update user block status');
        }
    };

    const handleDeleteProduct = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await axios.delete(`/admin/products/${id}`);
                const deletedProduct = products.find(p => p._id === id);
                setProducts(products.filter(product => product._id !== id));

                if (deletedProduct && deletedProduct.sellerId) {
                    setUsers(users.map(user =>
                        user._id === deletedProduct.sellerId._id
                            ? { ...user, productCount: Math.max(0, (user.productCount || 0) - 1) }
                            : user
                    ));
                }
            } catch (err) {
                console.error(err);
                setError('Failed to delete product');
            }
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (loading) {
        return (
            <Container className="mt-5 text-center">
                <h2>Loading Dashboard...</h2>
            </Container>
        );
    }

    const titleMap = {
        overview: 'Admin Overview',
        users: 'User Management',
        products: 'Product Management',
        orders: 'Order Management'
    };
    const dashboardTitle = titleMap[activeView] || 'Admin Dashboard';

    return (
        <>
            {/* Admin Navbar */}
            <Navbar bg="dark" variant="dark" expand="lg" className="mb-4 px-4">
                <Navbar.Brand style={{ fontSize: '1.5rem' }}>Admin Panel</Navbar.Brand>
                <Nav className="me-auto" style={{ fontSize: '1.1rem' }}>
                    <Nav.Link onClick={() => setActiveView('overview')} className="d-flex align-items-center">
                        <i className="fa-solid fa-chart-line me-1"></i> Overview
                    </Nav.Link>
                    <Nav.Link onClick={() => setActiveView('users')} className="d-flex align-items-center">
                        <i className="fa-solid fa-users me-1"></i> Users
                    </Nav.Link>
                    <Nav.Link onClick={() => setActiveView('products')} className="d-flex align-items-center">
                        <i className="fa-solid fa-box-open me-1"></i> Products
                    </Nav.Link>
                    <Nav.Link onClick={() => setActiveView('orders')} className="d-flex align-items-center">
                        <i className="fa-solid fa-receipt me-1"></i> Orders
                    </Nav.Link>
                </Nav>
                <Nav className="d-flex align-items-center">
                    <span className="text-light me-3" style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                        {user?.name || 'Profile'}
                    </span>
                    <Button
                        variant="primary"
                        size="md"
                        onClick={handleLogout}
                        className="d-flex align-items-center"
                    >
                        <i className="fa-solid fa-right-from-bracket me-1"></i> Logout
                    </Button>
                </Nav>
            </Navbar>

            <Container className="mt-3">
                <h1 className="mb-4 fw-bold">{dashboardTitle}</h1>
                {error && <Alert variant="danger">{error}</Alert>}

                {activeView === 'overview' && (
                    <Row className="g-3 mb-4">
                        <Col md={3}>
                            <Card className="shadow-sm">
                                <Card.Body>
                                    <div className="text-muted small">Total Users</div>
                                    <h3 className="mb-0">{stats.totalUsers || 0}</h3>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={3}>
                            <Card className="shadow-sm">
                                <Card.Body>
                                    <div className="text-muted small">Total Products</div>
                                    <h3 className="mb-0">{stats.totalProducts || 0}</h3>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={3}>
                            <Card className="shadow-sm">
                                <Card.Body>
                                    <div className="text-muted small">Total Orders</div>
                                    <h3 className="mb-0">{stats.totalOrders || 0}</h3>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={3}>
                            <Card className="shadow-sm">
                                <Card.Body>
                                    <div className="text-muted small">Open Reports</div>
                                    <h3 className="mb-0">{stats.openReports || 0}</h3>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                )}

                {activeView !== 'overview' && (
                <Card className="shadow-sm">
                    <Card.Body>
                        {activeView === 'users' && (
                            <Table striped bordered hover responsive>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        <th>Total Items</th>
                                        <th>Joined At</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(user => (
                                        <tr key={user._id}>
                                            <td>{user._id}</td>
                                            <td>{user.name}</td>
                                            <td>{user.email}</td>
                                            <td>{user.phone}</td>
                                            <td>
                                                {user.isAdmin ? (
                                                    <span className="badge bg-danger">Admin</span>
                                                ) : (
                                                    <span className="badge bg-primary">User</span>
                                                )}
                                            </td>
                                            <td>
                                                {user.isBlocked ? (
                                                    <span className="badge bg-danger">Blocked</span>
                                                ) : (
                                                    <span className="badge bg-success">Active</span>
                                                )}
                                            </td>
                                            <td>{user.productCount || 0}</td>
                                            <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                {!user.isAdmin && (
                                                    <div className="d-flex gap-2 flex-wrap">
                                                        <Button
                                                            variant={user.isBlocked ? "success" : "warning"}
                                                            size="sm"
                                                            onClick={() => handleToggleBlock(user._id)}
                                                        >
                                                            {user.isBlocked ? 'Unblock' : 'Block'}
                                                        </Button>
                                                        <Button
                                                            variant="danger"
                                                            size="sm"
                                                            onClick={() => handleDeleteUser(user._id)}
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

                        {activeView === 'products' && (
                            <Table striped bordered hover responsive>
                                <thead>
                                    <tr>
                                        <th>Image</th>
                                        <th>Title</th>
                                        <th>Category</th>
                                        <th>Price</th>
                                        <th>Seller</th>
                                        <th>Seller Email</th>
                                        <th>Created At</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map(product => (
                                        <tr key={product._id}>
                                            <td>
                                                <img
                                                    src={getImageUrl(product.images?.[0], { placeholderSize: 100 })}
                                                    alt={product.title}
                                                    style={{ width: 70, height: 70, objectFit: 'contain', background: '#f8f9fa', borderRadius: 6 }}
                                                />
                                            </td>
                                            <td>{product.title}</td>
                                            <td>{product.category}</td>
                                            <td>₹{product.price}</td>
                                            <td>{product.sellerId ? product.sellerId.name : 'Unknown'}</td>
                                            <td>{product.sellerId ? product.sellerId.email : 'Unknown'}</td>
                                            <td>{new Date(product.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() => handleDeleteProduct(product._id)}
                                                >
                                                    Delete
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        )}

                        {activeView === 'orders' && (
                            <Table striped bordered hover responsive>
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Buyer</th>
                                        <th>Seller</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                        <th>Pickup</th>
                                        <th>Created At</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map(order => (
                                        <tr key={order._id}>
                                            <td>{order.productTitle}</td>
                                            <td>{order.buyerId?.name} ({order.buyerId?.email})</td>
                                            <td>{order.sellerId?.name} ({order.sellerId?.email})</td>
                                            <td>₹{order.amount}</td>
                                            <td>
                                                <Badge bg={
                                                    order.status === 'pending' ? 'warning' :
                                                    order.status === 'accepted' ? 'success' :
                                                    order.status === 'rejected' ? 'danger' : 'dark'
                                                }>
                                                    {String(order.status).toUpperCase()}
                                                </Badge>
                                            </td>
                                            <td>
                                                {order.pickupDate
                                                    ? `${new Date(order.pickupDate).toLocaleDateString()} ${order.pickupTime || ''} (${order.pickupLocation || '-'})`
                                                    : '-'}
                                            </td>
                                            <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        )}

                    </Card.Body>
                </Card>
                )}
            </Container>
        </>
    );
};

export default AdminDashboard;