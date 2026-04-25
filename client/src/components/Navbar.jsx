import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Navbar, Nav, Container, Button, Form, Image, Badge } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import './Navbar.css'; // Hover + active styles
import { getImageUrl } from '../utils/imageUrl';

const Navigation = () => {
    const { isAuthenticated, logout, user } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();

    const myId = useMemo(() => user?._id || user?.id, [user]);

    const onLogout = () => {
        logout();
        navigate('/login');
    };

    const showSearch = location.pathname === '/home';

    // Check if a path is active
    const isActive = (path) => location.pathname === path;

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
                        <Form className="d-flex mx-lg-4 flex-grow-1" onSubmit={e => e.preventDefault()}>
                            <Form.Control
                                type="search"
                                placeholder="Search items..."
                                value={searchParams.get('q') || ''}
                                onChange={(e) => setSearchParams({ q: e.target.value })}
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
                                    className="nav-item fw-bold text-dark"
                                    style={{ padding: '6px 12px !important', textDecoration: 'none' }}
                                >
                                    Login
                                </Nav.Link>

                                <Nav.Link
                                    as={Link}
                                    to="/register"
                                    className="nav-item fw-bold text-dark"
                                    style={{ padding: '6px 12px !important', textDecoration: 'none' }}
                                >
                                    Sign Up
                                </Nav.Link>

                                <Nav.Link
                                    as={Link}
                                    to="/about"
                                    className="nav-item fw-bold text-dark"
                                    style={{ padding: '6px 12px !important', textDecoration: 'none' }}
                                >
                                    About Us
                                </Nav.Link>
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
