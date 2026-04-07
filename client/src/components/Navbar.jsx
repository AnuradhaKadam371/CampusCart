import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Navbar, Nav, Container, Button, Form, Image, Badge } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import './Navbar.css'; // Hover + active styles
import { getImageUrl } from '../utils/imageUrl';
import { createSocket } from '../utils/socket';

const Navigation = () => {
    const { isAuthenticated, logout, user } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [unreadTotal, setUnreadTotal] = useState(0);

    const myId = useMemo(() => user?._id || user?.id, [user]);

    const onLogout = () => {
        logout();
        navigate('/login');
    };

    const showSearch = location.pathname === '/home';

    // Check if a path is active
    const isActive = (path) => location.pathname === path;

    const getUnreadTotal = () => {
        try {
            let total = 0;
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (!k || !k.startsWith('chat:unread:')) continue;
                const v = parseInt(localStorage.getItem(k) || '0', 10);
                if (Number.isFinite(v) && v > 0) total += v;
            }
            return total;
        } catch (_) {
            return 0;
        }
    };

    useEffect(() => {
        if (!isAuthenticated || !myId) return;

        const socket = createSocket();

        const handleTotalRefresh = () => {
            setUnreadTotal(getUnreadTotal());
        };

        // Initial
        handleTotalRefresh();

        const onNewMessage = (msg) => {
            if (!msg || !msg.productId || !msg.senderId || !msg.receiverId) return;

            const otherId =
                String(msg.senderId) === String(myId)
                    ? String(msg.receiverId)
                    : String(msg.senderId);

            const convKey = `${String(msg.productId)}:${otherId}`;
            const activeKey = localStorage.getItem('chat:activeKey');

            if (activeKey && String(activeKey) === String(convKey)) {
                return; // chat is open for this conversation
            }

            const unreadKey = `chat:unread:${convKey}`;
            const current = parseInt(localStorage.getItem(unreadKey) || '0', 10);
            const next = (Number.isFinite(current) ? current : 0) + 1;
            localStorage.setItem(unreadKey, String(next));

            handleTotalRefresh();
            window.dispatchEvent(new Event('chatUnreadUpdated'));
        };

        socket.on('new_message', onNewMessage);
        window.addEventListener('chatUnreadUpdated', handleTotalRefresh);

        return () => {
            socket.off('new_message', onNewMessage);
            socket.disconnect();
            window.removeEventListener('chatUnreadUpdated', handleTotalRefresh);
        };
    }, [isAuthenticated, myId]);

    // Marketplace should be blue unless another nav item is active
    const marketplaceActive =
        location.pathname === '/home';

    return (
        <Navbar bg="white" expand="lg" className="shadow-sm sticky-top">
            <Container>
                {/* ================= BRAND ================= */}
                <Navbar.Brand
                    as={Link}
                    to="/home"
                    className="custom-brand"
                    >
                    <i className="fa-solid fa-building-columns me-2"></i>
                    CampusCart
                </Navbar.Brand>


                <Navbar.Toggle />
                <Navbar.Collapse>
                    {/* ================= SEARCH ================= */}
                    {showSearch && (
                        <Form className="d-flex mx-lg-4 flex-grow-1">
                            <Form.Control
                                type="search"
                                placeholder="Search items..."
                            />
                        </Form>
                    )}

                    <Nav className="ms-auto align-items-center gap-3">
                        {/* ================= MARKETPLACE ================= */}
                        <Nav.Link
                            as={Link}
                            to="/home"
                            className={`text-center nav-item ${marketplaceActive ? 'active-nav' : ''}`}
                        >
                            <div className={`nav-icon ${marketplaceActive ? 'active-nav' : ''}`}>
                                <i className="fa-solid fa-cart-shopping"></i>
                            </div>
                            <small>Marketplace</small>
                        </Nav.Link>

                        {/* ================= SELL ================= */}
                        {isAuthenticated && (
                            <Nav.Link
                                as={Link}
                                to="/add-product"
                                className={`text-center nav-item ${isActive('/add-product') ? 'active-nav' : ''}`}
                            >
                                <div className="nav-icon">
                                    <i className="fa-solid fa-plus"></i>
                                </div>
                                <small>Sell</small>
                            </Nav.Link>
                        )}

                        {/* ================= WISHLIST ================= */}
                        {isAuthenticated && (
                            <Nav.Link
                                as={Link}
                                to="/wishlist"
                                className={`text-center nav-item ${isActive('/wishlist') ? 'active-nav' : ''}`}
                            >
                                <div className="nav-icon">
                                    <i className="fa-regular fa-heart"></i>
                                </div>
                                <small>Wishlist</small>
                            </Nav.Link>
                        )}

                        {/* ================= DASHBOARD ================= */}
                        {isAuthenticated && (
                            <Nav.Link
                                as={Link}
                                to="/my-products"
                                className={`text-center nav-item ${isActive('/my-products') ? 'active-nav' : ''}`}
                            >
                                <div className="nav-icon">
                                    <i className="fa-solid fa-house"></i>
                                </div>
                                <small>My Products</small>
                            </Nav.Link>
                        )}

                        {isAuthenticated && (
                            <Nav.Link
                                as={Link}
                                to="/messages"
                                className={`text-center nav-item ${isActive('/messages') ? 'active-nav' : ''}`}
                            >
                                <div className="nav-icon position-relative">
                                    <i className="fa-solid fa-message"></i>
                                    {unreadTotal > 0 && (
                                        <Badge
                                            bg="danger"
                                            pill
                                            className="position-absolute top-0 start-100 translate-middle"
                                            style={{ fontSize: 11 }}
                                        >
                                            {unreadTotal}
                                        </Badge>
                                    )}
                                </div>
                                <small>Messages</small>
                            </Nav.Link>
                        )}

                        {/* ================= PROFILE ================= */}
                        {isAuthenticated && (
                            <Nav.Link
                                as={Link}
                                to="/myprofile"
                                className={`text-center nav-item ${isActive('/myprofile') ? 'active-nav' : ''}`}
                            >
                                <div className="nav-icon">
                                    {user?.avatar ? (
                                        <Image
                                            src={getImageUrl(user.avatar, { placeholderSize: 80 })}
                                            roundedCircle
                                            style={{ width: 26, height: 26, objectFit: 'cover' }}
                                            alt="profile"
                                        />
                                    ) : (
                                        <i className="fa-regular fa-circle-user"></i>
                                    )}
                                </div>
                                <small>Profile</small>
                            </Nav.Link>
                        )}

                        {/* ================= ADMIN ================= */}
                        {user?.isAdmin && (
                            <Nav.Link
                                as={Link}
                                to="/admin"
                                className={`fw-bold nav-item ${isActive('/admin') ? 'active-nav text-danger' : 'text-danger'}`}
                            >
                                Admin
                            </Nav.Link>
                        )}

                        {/* ================= AUTH LINKS ================= */}
                        {!isAuthenticated ? (
                            <>
                                <Nav.Link
                                    as={Link}
                                    to="/login"
                                    className={`nav-item ${isActive('/login') ? 'active-nav' : ''}`}
                                >
                                    Login
                                </Nav.Link>

                                <Button
                                    as={Link}
                                    to="/register"
                                    variant="primary"
                                    size="sm"
                                >
                                    Get Started
                                </Button>
                            </>
                        ) : (
                            <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={onLogout}
                            >
                                Logout
                            </Button>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default Navigation;
