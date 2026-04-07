import React, { useContext, useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert, Badge, Nav } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import { Link } from 'react-router-dom';
import { getImageUrl } from '../utils/imageUrl';
import './MyProducts.css';

const MyProducts = () => {
    const { user } = useContext(AuthContext);

    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [sellerRequests, setSellerRequests] = useState([]);
    const [myRequests, setMyRequests] = useState([]);
    const [completedOrders, setCompletedOrders] = useState([]);
    const [myReviews, setMyReviews] = useState({}); // orderId -> true

    const [loading, setLoading] = useState(true);
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [deleting, setDeleting] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [activeTab, setActiveTab] = useState('listings');
    const [requestSubTab, setRequestSubTab] = useState('pending'); // My Requests sub-tab

    // ---------------- MY LISTINGS ----------------
    useEffect(() => {
        const fetchMyProducts = async () => {
            try {
                const res = await api.get('/products/myproducts');
                setProducts(res.data);
            } catch (err) {
                console.error(err);
                setMessage({ type: 'danger', text: 'Failed to load your listings' });
            } finally {
                setLoading(false);
            }
        };
        fetchMyProducts();
    }, []);

    // ---------------- MY PURCHASES (ACCEPTED) ----------------
    useEffect(() => {
        const fetchMyOrders = async () => {
            try {
                const res = await api.get('/orders/my-orders');
                setOrders(res.data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setOrdersLoading(false);
            }
        };
        fetchMyOrders();
    }, []);

    // ---------------- COMPLETED ORDERS ----------------
    useEffect(() => {
        const fetchCompletedOrders = async () => {
            try {
                const res = await api.get('/orders/completed-orders');
                setCompletedOrders(res.data || []);
            } catch (err) {
                console.error(err);
            }
        };
        fetchCompletedOrders();
    }, []);

    // ---------------- MY BUY REQUESTS ----------------
    useEffect(() => {
        const fetchMyRequests = async () => {
            try {
                const res = await api.get('/orders/my-all-requests');
                setMyRequests(res.data || []);
            } catch (err) {
                console.error(err);
            }
        };
        fetchMyRequests();
    }, []);

    // ---------------- SELLER REQUESTS ----------------
    useEffect(() => {
        const fetchSellerRequests = async () => {
            try {
                const res = await api.get('/orders/seller-requests');
                setSellerRequests(res.data || []);
            } catch (err) {
                console.error(err);
            }
        };
        fetchSellerRequests();
    }, []);

    // ---------------- ACCEPT REQUEST ----------------
    const acceptRequest = async (id) => {
        // Accept requires pickup info; route to schedule form
        window.location.href = `/accept-request/${id}`;
    };

    // ---------------- REJECT REQUEST ----------------
    const rejectRequest = async (id) => {
        try {
            await api.put(`/orders/reject/${id}`);
            const res = await api.get('/orders/seller-requests');
            setSellerRequests(res.data || []);
            setMessage({ type: 'success', text: 'Request rejected' });
        } catch (err) {
            console.error(err);
        }
    };

    // ---------------- WITHDRAW REQUEST (BUYER) ----------------
    const withdrawRequest = async (id) => {
        try {
            await api.delete(`/orders/withdraw/${id}`);
            const res = await api.get('/orders/my-all-requests');
            setMyRequests(res.data || []);
            setMessage({ type: 'success', text: 'Request withdrawn successfully' });
        } catch (err) {
            console.error(err);
        }
    };

    const markCompleted = async (orderId) => {
        try {
            const res = await api.put(`/orders/complete/${orderId}`);
            // refresh accepted + completed
            const acceptedRes = await api.get('/orders/my-orders');
            setOrders(acceptedRes.data || []);
            const completedRes = await api.get('/orders/completed-orders');
            setCompletedOrders(completedRes.data || []);
            setMessage({ type: 'success', text: res.data?.msg || 'Marked as completed' });
        } catch (err) {
            console.error(err);
            setMessage({ type: 'danger', text: err.response?.data?.msg || 'Failed to mark completed' });
        }
    };

    const submitReview = async (order) => {
        const ratingStr = window.prompt("Rate seller (1 to 5):");
        if (!ratingStr) return;
        const rating = Number(ratingStr);
        if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
            setMessage({ type: 'danger', text: 'Rating must be between 1 and 5' });
            return;
        }
        const comment = window.prompt("Optional comment (press Cancel to skip):") || "";

        try {
            await api.post('/reviews', { orderId: order._id, rating, comment });
            setMyReviews((prev) => ({ ...prev, [order._id]: true }));
            setMessage({ type: 'success', text: 'Thanks! Your review was submitted.' });
        } catch (err) {
            console.error(err);
            setMessage({ type: 'danger', text: err.response?.data?.msg || 'Failed to submit review' });
        }
    };

    // ---------------- DELETE PRODUCT ----------------
    const deleteProduct = async (id) => {
        const product = products.find(p => p._id === id);
        const confirmMessage = `Are you sure you want to delete "${product?.title}"?\n\nThis item will be permanently removed.`;
        if (window.confirm(confirmMessage)) {
            setDeleting(id);
            try {
                await api.delete(`/products/${id}`);
                setProducts(products.filter(p => p._id !== id));
                setMessage({ type: 'success', text: 'Item deleted successfully!' });
            } catch (err) {
                console.error(err);
                setMessage({
                    type: 'danger',
                    text: err.response?.data?.msg || 'Failed to delete item'
                });
            } finally {
                setDeleting(null);
            }
        }
    };

    if (loading && !products.length)
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
                <Spinner animation="border" variant="primary" />
            </div>
        );

    return (
        <Container className="py-5 profile-page">

            {message.text && (
                <Alert variant={message.type} dismissible onClose={() => setMessage({ type: '', text: '' })}>
                    {message.text}
                </Alert>
            )}

            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
                <h3 className="fw-bold mb-0">My Products</h3>
                <Link to="/add-product">
                    <Button variant="primary" size="sm">+ Add New Item</Button>
                </Link>
            </div>

            {/* ---------------- MAIN TABS ---------------- */}
            <Nav variant="tabs" className="profile-tabs mb-4">
                <Nav.Item>
                    <Nav.Link active={activeTab === 'listings'} onClick={() => setActiveTab('listings')}>
                        My Listings <Badge bg="secondary" className="ms-1">{products.length}</Badge>
                    </Nav.Link>
                </Nav.Item>

                <Nav.Item>
                    <Nav.Link active={activeTab === 'sellerRequests'} onClick={() => setActiveTab('sellerRequests')}>
                        Incoming Requests <Badge bg="secondary" className="ms-1">{sellerRequests.length}</Badge>
                    </Nav.Link>
                </Nav.Item>

                <Nav.Item>
                    <Nav.Link active={activeTab === 'myRequests'} onClick={() => setActiveTab('myRequests')}>
                        My Requests <Badge bg="secondary" className="ms-1">{myRequests.length}</Badge>
                    </Nav.Link>
                </Nav.Item>

                <Nav.Item>
                    <Nav.Link active={activeTab === 'purchases'} onClick={() => setActiveTab('purchases')}>
                        My Purchases <Badge bg="secondary" className="ms-1">{orders.length}</Badge>
                    </Nav.Link>
                </Nav.Item>
            </Nav>

            {/* ---------------- MY LISTINGS ---------------- */}
            {activeTab === 'listings' && (
                <Row xs={1} md={2} lg={3} className="g-4">
                    {products.map(product => (
                        <Col key={product._id}>
                            <Card className="h-100 shadow-sm position-relative profile-product-card">
                                {product.status === 'sold' && (
                                    <div className="profile-sold-badge">SOLD</div>
                                )}
                                <Card.Img
                                    variant="top"
                                    src={getImageUrl(product.images?.[0], { placeholderSize: 600 })}
                                    style={{ height: '200px', objectFit: 'cover' }}
                                />
                                <Card.Body>
                                    <Badge bg="light" text="dark">{product.category}</Badge>
                                    <Card.Title className="mt-2">{product.title}</Card.Title>
                                    <h5 className="text-primary">₹{product.price}</h5>
                                    <div className="d-flex gap-2 mt-3">
                                        <Link to={`/edit-product/${product._id}`} className="w-100">
                                            <Button variant="outline-primary" size="sm" className="w-100">
                                                Edit
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            className="w-100"
                                            disabled={deleting === product._id}
                                            onClick={() => deleteProduct(product._id)}
                                        >
                                            {deleting === product._id ? 'Deleting…' : 'Delete'}
                                        </Button>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            {/* ---------------- SELLER REQUESTS ---------------- */}
            {activeTab === 'sellerRequests' && (
                <Row className="g-4">
                    {sellerRequests.map(req => (
                        <Col key={req._id} md={4}>
                            <Card className="shadow-sm">
                                <Card.Img
                                    variant="top"
                                    src={getImageUrl(req.productImage || req.images?.[0], { placeholderSize: 600 })}
                                    style={{ height: 180, objectFit: 'cover' }}
                                />
                                <Card.Body>
                                    <Card.Title>{req.productTitle}</Card.Title>
                                    <div className="small text-muted mb-1"><b>Buyer:</b> {req.buyerId?.name} ({req.buyerId?.email})</div>
                                    <div className="small text-muted mb-1"><b>Category:</b> {req.category || 'N/A'}</div>
                                    <div className="small text-muted mb-1"><b>Price:</b> ₹{req.amount}</div>
                                    <div className="small text-muted mb-2"><b>Description:</b> {req.description || 'No description'}</div>
                                    <Badge bg="warning">Pending</Badge>
                                    <div className="mt-3 d-flex gap-2">
                                        <Button size="sm" variant="success" onClick={() => acceptRequest(req._id)}>Accept</Button>
                                        <Button size="sm" variant="danger" onClick={() => rejectRequest(req._id)}>Reject</Button>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            {/* ---------------- MY REQUESTS ---------------- */}
            {activeTab === 'myRequests' && (
                <div>
                    {/* Sub-tabs */}
                    <Nav variant="tabs" className="mb-3">
                        <Nav.Item>
                            <Nav.Link active={requestSubTab === 'pending'} onClick={() => setRequestSubTab('pending')}>
                                Pending <Badge bg="secondary">{myRequests.filter(r => r.status === 'pending').length}</Badge>
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link active={requestSubTab === 'accepted'} onClick={() => setRequestSubTab('accepted')}>
                                Accepted <Badge bg="secondary">{myRequests.filter(r => r.status === 'accepted').length}</Badge>
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link active={requestSubTab === 'rejected'} onClick={() => setRequestSubTab('rejected')}>
                                Rejected <Badge bg="secondary">{myRequests.filter(r => r.status === 'rejected').length}</Badge>
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link active={requestSubTab === 'completed'} onClick={() => setRequestSubTab('completed')}>
                                Completed <Badge bg="secondary">{myRequests.filter(r => r.status === 'completed').length}</Badge>
                            </Nav.Link>
                        </Nav.Item>
                    </Nav>

                    {/* Requests List */}
                    <Row className="g-4">
                        {myRequests.filter(r => r.status === requestSubTab).map(req => (
                            <Col key={req._id} md={4}>
                                <Card className="shadow-sm">
                                    <Card.Img
                                        variant="top"
                                        src={getImageUrl(req.productImage || req.images?.[0], { placeholderSize: 600 })}
                                        style={{ height: 180, objectFit: 'cover' }}
                                    />
                                    <Card.Body>
                                        <Card.Title>{req.productTitle}</Card.Title>
                                        <Badge bg={
                                            req.status === 'pending' ? 'warning' :
                                            req.status === 'accepted' ? 'success' :
                                            'danger'
                                        }>
                                            {req.status.toUpperCase()}
                                        </Badge>
                                        <div className="mt-2 small text-muted"><b>Category:</b> {req.category || 'N/A'}</div>
                                        <div className="small text-muted"><b>Price:</b> ₹{req.amount}</div>
                                        <div className="small text-muted"><b>Description:</b> {req.description || 'No description'}</div>

                                        {/* Withdraw button only for pending requests */}
                                        {req.status === 'pending' && (
                                            <div className="mt-2">
                                                <Button size="sm" variant="outline-danger" onClick={() => withdrawRequest(req._id)}>Withdraw</Button>
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </div>
            )}

            {/* ---------------- MY PURCHASES ---------------- */}
            {activeTab === 'purchases' && (
                <div>
                    <h5 className="fw-bold mb-3">Accepted (Pickup scheduled)</h5>
                    <Row xs={1} md={2} lg={3} className="g-4">
                        {orders.map(order => (
                            <Col key={order._id}>
                                <Card className="shadow-sm">
                                    <Card.Img
                                        variant="top"
                                        src={getImageUrl(order.productImage || order.images?.[0], { placeholderSize: 600 })}
                                        style={{ height: 180, objectFit: 'cover' }}
                                    />
                                    <Card.Body>
                                        <Badge bg="success">Accepted</Badge>
                                        <Card.Title className="mt-2">{order.productTitle}</Card.Title>
                                        <h5>₹{order.amount}</h5>
                                        {order.pickupDate && (
                                            <div className="small text-muted">
                                                <b>Pickup:</b> {new Date(order.pickupDate).toLocaleDateString()} at {order.pickupTime}<br />
                                                <b>Location:</b> {order.pickupLocation}
                                            </div>
                                        )}
                                        <div className="d-flex gap-2 mt-3">
                                            <Button size="sm" variant="outline-success" onClick={() => markCompleted(order._id)}>
                                                Mark Completed
                                            </Button>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>

                    <h5 className="fw-bold mt-4 mb-3">Completed</h5>
                    <Row xs={1} md={2} lg={3} className="g-4">
                        {completedOrders.map(order => (
                            <Col key={order._id}>
                                <Card className="shadow-sm">
                                    <Card.Img
                                        variant="top"
                                        src={getImageUrl(order.productImage || order.images?.[0], { placeholderSize: 600 })}
                                        style={{ height: 180, objectFit: 'cover' }}
                                    />
                                    <Card.Body>
                                        <Badge bg="dark">Completed</Badge>
                                        <Card.Title className="mt-2">{order.productTitle}</Card.Title>
                                        <h5>₹{order.amount}</h5>
                                        <div className="d-flex gap-2 mt-3">
                                            <Button
                                                size="sm"
                                                variant="primary"
                                                onClick={() => submitReview(order)}
                                                disabled={!!myReviews[order._id]}
                                            >
                                                {myReviews[order._id] ? 'Reviewed' : 'Rate Seller'}
                                            </Button>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </div>
            )}
        </Container>
    );
};

export default MyProducts;