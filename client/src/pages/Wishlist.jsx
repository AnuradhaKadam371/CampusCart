import React, { useContext } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getImageUrl } from '../utils/imageUrl';
import api from '../utils/api'; // ✅ IMPORTANT
import './Wishlist.css';

const Wishlist = () => {
    const { user, loadUser } = useContext(AuthContext); // ✅ UPDATED
    const wishlist = user?.wishlist || [];

    return (
        <Container className="py-5 wishlist-page">
            <h2 className="fw-bold mb-4">My Wishlist</h2>

            {wishlist.length === 0 ? (
                <div className="empty-wishlist text-center py-5">
                    <i className="fa-regular fa-heart fa-4x text-muted mb-3"></i>
                    <h5 className="text-muted">Your wishlist is empty</h5>
                    <p className="text-muted mb-4">
                        Save items you like by clicking the heart on product cards.
                    </p>
                    <Button as={Link} to="/home" variant="primary" className="rounded-pill px-4">
                        Browse Marketplace
                    </Button>
                </div>
            ) : (
                <Row xs={1} md={2} lg={4} className="g-4">
                    {wishlist.map((product) => (
                        <Col key={product._id}>
                            <Card className="wishlist-card h-100 border-0 shadow-sm">

                                {/* IMAGE */}
                                <div className="card-img-wrap">
                                    <Card.Img
                                        variant="top"
                                        src={getImageUrl(product.images?.[0], { placeholderSize: 600 })}
                                        style={{ height: '200px', objectFit: 'cover' }}
                                    />
                                </div>

                                {/* BODY */}
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-start gap-2">
                                        <h6
                                            className="fw-bold text-truncate mb-0"
                                            title={product.title}
                                        >
                                            {product.title}
                                        </h6>
                                        <div className="text-primary fw-bold">
                                            ₹{product.price}
                                        </div>
                                    </div>

                                    <div className="text-muted small mt-1">
                                        {product.category}
                                    </div>

                                    <p
                                        className="text-muted small mb-2 text-truncate"
                                        title={product.description}
                                    >
                                        {product.description}
                                    </p>

                                    {/* 🔥 BUTTONS */}
                                    <div className="d-flex gap-2 mt-2">

                                        {/* 👁️ View */}
                                        <Button
                                            as={Link}
                                            to={`/product/${product._id}`}
                                            variant="outline-primary"
                                            size="sm"
                                            className="w-50"
                                        >
                                            View
                                        </Button>

                                        {/* ❌ Remove */}
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            className="w-50"
                                            onClick={async (e) => {
                                                e.preventDefault();
                                                e.stopPropagation();

                                                try {
                                                    await api.post(`/auth/wishlist/${product._id}`);
                                                    loadUser(); // ✅ updates instantly
                                                } catch (err) {
                                                    console.error(err);
                                                }
                                            }}
                                        >
                                            Remove
                                        </Button>

                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}
        </Container>
    );
};

export default Wishlist;