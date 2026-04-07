import React, { useState, useEffect, useContext } from 'react';
import {
    Container,
    Row,
    Col,
    Card,
    Badge,
    Form,
    Button,
    Nav,
    Carousel
} from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import './Home.css';
import { getImageUrl } from '../utils/imageUrl';
import slide1 from "../assets/slider1.png";
import slide2 from "../assets/slider2.png";
import slide3 from "../assets/slider3.png";

const images = [slide1, slide2, slide3];
const PRODUCTS_INITIAL = 4;

const categories = [
    { name: 'All', icon: 'fa-th-large' },
    { name: 'Books', icon: 'fa-book' },
    { name: 'Electronics', icon: 'fa-microchip' },
    { name: 'Hostel', icon: 'fa-house' },
    { name: 'Clothing', icon: 'fa-shirt' },
    { name: 'Lab', icon: 'fa-flask' },
    { name: 'Sports', icon: 'fa-futbol' },
    { name: 'Others', icon: 'fa-ellipsis' }
];

const Home = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user, loadUser } = useContext(AuthContext);

    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All');
    const [productsExpanded, setProductsExpanded] = useState(false);

    const displayedProducts = productsExpanded
        ? products
        : products.slice(0, PRODUCTS_INITIAL);

    const hasMoreProducts = products.length > PRODUCTS_INITIAL;

    const wishlistIds = (user?.wishlist || []).map(p =>
        (typeof p === 'object' && p._id) ? p._id : p
    );

    const toggleWishlist = async (e, productId) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAuthenticated) return;

        try {
            await api.post(`/auth/wishlist/${productId}`);
            loadUser();
        } catch (err) {
            console.error(err);
        }
    };

    // ================== FETCH PRODUCTS ==================
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                let query = `/products?`;
                if (search) query += `search=${search}&`;
                if (category !== 'All') query += `category=${category}`;
                const res = await api.get(query);
                setProducts(res.data);
            } catch (err) {
                console.error(err);
            }
        };

        const delayDebounceFn = setTimeout(fetchProducts, 300); // debounce 300ms
        return () => clearTimeout(delayDebounceFn);
    }, [search, category]);

// Use shared helper for consistent image URLs across the app.
    return (
        <>
            {/* ================= CATEGORY NAVBAR ================= */}
            <div className="category-bar">
                <Container>
                    <Nav
                        className="justify-content-center py-2 gap-2 flex-wrap category-nav"
                        variant="pills"
                    >
                        {categories.map((cat) => (
                            <Nav.Item key={cat.name}>
                                <Nav.Link
                                    active={category === cat.name}
                                    onClick={() => setCategory(cat.name)}
                                    className="category-pill"
                                >
                                    <i className={`fa-solid ${cat.icon} category-icon`}></i>
                                    <span>{cat.name}</span>
                                </Nav.Link>
                            </Nav.Item>
                        ))}
                    </Nav>
                </Container>
            </div>

            {/* ================= IMAGE SLIDER ================= */}
            <Container className="mt-4">
                <Carousel className="home-slider" interval={2500}>
                    {images.map((src, index) => (
                        <Carousel.Item key={index}>
                            <img
                                className="d-block w-100 slider-img"
                                src={src}
                                alt={`slide${index + 1}`}
                            />
                        </Carousel.Item>
                    ))}
                </Carousel>
            </Container>

            {/* ================= SEARCH BAR ================= */}
            <Container className="mt-4">
                <Form>
                    <Form.Control
                        type="text"
                        placeholder="Search products..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </Form>
            </Container>

            {/* ================= PRODUCT LIST ================= */}
            <div className="home-products-section">
                <Container className="mb-5 mt-4">
                    <h2 className="home-products-title">New listings</h2>

                    <Row xs={1} md={2} lg={4} className="g-4">
                        {products.length > 0 ? (
                            displayedProducts.map((product) => {
                                const inWishlist = wishlistIds.includes(product._id);

                                return (
                                    <Col key={product._id}>
                                        <Card
                                            as={Link}
                                            to={`/product/${product._id}`}
                                            className="product-card text-decoration-none h-100 text-dark border-0 shadow-sm"
                                        >
                                            <div className="product-card-img-wrap">
                                                <Card.Img
                                                    variant="top"
                                                    src={getImageUrl(product.images?.[0])}
                                                    style={{ height: '220px', objectFit: 'cover' }}
                                                />
                                                <Badge
                                                    bg="light"
                                                    text="dark"
                                                    className="position-absolute top-0 end-0 m-3 shadow-sm"
                                                    style={{ backdropFilter: 'blur(4px)', opacity: 0.9 }}
                                                >
                                                    {product.category}
                                                </Badge>
                                                {isAuthenticated && (
                                                    <button
                                                        type="button"
                                                        className="wishlist-heart-btn"
                                                        onClick={(e) => toggleWishlist(e, product._id)}
                                                        aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                                                    >
                                                        <i className={inWishlist ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}></i>
                                                    </button>
                                                )}
                                            </div>
                                            <Card.Body>
                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                    <h5 className="text-primary fw-bold mb-0">₹{product.price}</h5>
                                                    <small
                                                        className="text-muted"
                                                        style={{ fontSize: '0.8rem' }}
                                                    >
                                                        {new Date(product.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </small>
                                                </div>
                                                <Card.Title className="fw-bold text-truncate" title={product.title}>
                                                    {product.title}
                                                </Card.Title>
                                                <Card.Text className="text-muted small text-truncate">
                                                    {product.description}
                                                </Card.Text>
                                                {isAuthenticated && (
                                                    <Button
                                                        variant="success"
                                                        size="sm"
                                                        className="product-buy-now-btn mt-2"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            navigate(`/buy/${product._id}`);
                                                        }}
                                                    >
                                                        Buy now
                                                    </Button>
                                                )}
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                );
                            })
                        ) : (
                            <Col xs={12} className="text-center py-5 mt-5 empty-state">
                                <h4 className="text-muted">No items found</h4>
                                <p className="text-muted mb-4">Try adjusting your search or category.</p>
                                <Link to="/add-product" className="btn btn-primary px-4 rounded-pill">Sell an Item</Link>
                            </Col>
                        )}
                    </Row>
                </Container>
                {hasMoreProducts && (
                    <div className="show-more-section">
                        <Button
                            variant="outline-primary"
                            size="lg"
                            className="show-more-btn"
                            onClick={() => setProductsExpanded(!productsExpanded)}
                        >
                            {productsExpanded ? 'Show less' : 'Show more'}
                        </Button>
                    </div>
                )}
            </div>
        </>
    );
};

export default Home;