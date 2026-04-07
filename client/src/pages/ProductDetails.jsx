
import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Button, Card, Toast, Carousel, Spinner, Badge, Image } from 'react-bootstrap';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { getImageUrl } from '../utils/imageUrl';
import './ProductDetails.css';
import './BuyProduct.css';

const ProductDetails = () => {
  const { id } = useParams();
  const { isAuthenticated, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requestStatus, setRequestStatus] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [loadingRequest, setLoadingRequest] = useState(false);
  const [sellerRating, setSellerRating] = useState(null);

  // ================= FETCH PRODUCT =================
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        setProduct(res.data);

        if (res.data?.sellerId?._id) {
          setSellerRating({
            ratingAvg: res.data.sellerId.ratingAvg || 0,
            ratingCount: res.data.sellerId.ratingCount || 0,
          });
        }

        // ✅ FIXED API URL (IMPORTANT)
        if (isAuthenticated) {
          try {
            const orderRes = await api.get(`/orders/request-status/${id}`);
            if (orderRes.data) {
              setRequestStatus(orderRes.data.status);
            }
          } catch (err) {
            console.log("No previous request"); // no error spam
          }
        }

        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, isAuthenticated]);

  // ================= SEND REQUEST =================
  const sendPurchaseRequest = async () => {
    if (!isAuthenticated) {
      setToastMessage('❌ Please login first');
      setShowToast(true);
      return;
    }

    setLoadingRequest(true);

    try {
      const res = await api.post('/orders/create', {
        productId: product._id,
      });

      if (res.status === 201) {
        setRequestStatus('pending');
        setToastMessage('✅ Purchase request sent successfully!');
        setShowToast(true);
      }
    } catch (err) {
      console.error(err);
      setToastMessage(err.response?.data?.msg || '❌ Failed to send request');
      setShowToast(true);
    } finally {
      setLoadingRequest(false);
    }
  };

  // ================= LOADING =================
  if (loading) {
    return (
      <Container className="mt-4 text-center">
        <Spinner animation="border" /> Loading product...
      </Container>
    );
  }

  if (!product) {
    return (
      <Container className="mt-4">
        <p>Product not found</p>
      </Container>
    );
  }

  const isSold = product.status === 'sold';
  const isOwnProduct = user?._id === product.sellerId?._id;

  return (
    <Container className="mt-4 product-details-page">
      <Row>
        <Col md={6}>
          <div className="buy-image-wrap rounded-3">
            {product.images && product.images.length > 1 ? (
              <Carousel className="w-100" indicators controls>
                {product.images.map((img, idx) => (
                  <Carousel.Item key={idx}>
                    <div className="d-flex justify-content-center align-items-center w-100">
                      <Image
                        fluid
                        className="buy-product-img"
                        src={getImageUrl(img)}
                        alt={`${product.title} ${idx}`}
                      />
                    </div>
                  </Carousel.Item>
                ))}
              </Carousel>
            ) : (
              <div className="d-flex justify-content-center align-items-center w-100">
                <Image
                  fluid
                  className="buy-product-img"
                  src={getImageUrl(product.images?.[0])}
                  alt={product.title}
                />
              </div>
            )}
          </div>
        </Col>

        <Col md={6}>
          <h2>{product.title}</h2>
          <h4>₹{product.price}</h4>
          <p>{product.description}</p>

          <p><b>Category:</b> {product.category}</p>

          {/* seller rating shown in seller information card */}

          {product.pickupLocation && (
            <p><b>Pickup Location:</b> {product.pickupLocation}</p>
          )}

          {product.sellerId && (
            <Card className="mt-3 shadow-sm">
              <Card.Body className="d-flex align-items-start gap-3">
                <div>
                  {product.sellerId.avatar ? (
                    <Image
                      src={getImageUrl(product.sellerId.avatar, { placeholderSize: 60 })}
                      roundedCircle
                      style={{ width: 52, height: 52, objectFit: "cover" }}
                      alt="seller-avatar"
                    />
                  ) : (
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: "50%",
                        background: "#e9ecef",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                      }}
                    >
                      {product.sellerId.name?.charAt(0)?.toUpperCase() || "S"}
                    </div>
                  )}
                </div>
                <div className="flex-grow-1">
                  <div className="fw-bold">{product.sellerId.name}</div>
                  <div className="text-muted small">{product.sellerId.email}</div>
                  {sellerRating && (
                    <div className="mt-1">
                      <Badge bg="light" text="dark">
                        ⭐ {Number(sellerRating.ratingAvg || 0).toFixed(1)} ({sellerRating.ratingCount || 0} reviews)
                      </Badge>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          )}

          <div className="d-flex align-items-center gap-2 mb-3 " style={{ flexWrap: "nowrap",marginTop: "10px"}}>
            <Button
              variant="outline-primary"
              className="px-3"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(window.location.href);
                  setToastMessage("✅ Product link copied!");
                  setShowToast(true);
                } catch (_) {
                  setToastMessage("❌ Failed to copy link");
                  setShowToast(true);
                }
              }}
            >
              Copy Link
            </Button>

            <Button
              variant="outline-success"
              className="px-3"
              as="a"
              target="_blank"
              rel="noreferrer"
              href={`https://wa.me/?text=${encodeURIComponent(
                `Check out this product on CampusCart: ${product.title}\n${window.location.href}`
              )}`}
            >
              Share on WhatsApp
            </Button>
          </div>

          <div className="pd-actions mt-3">
            {isSold ? (
              <Button variant="secondary" size="lg" disabled>
                SOLD
              </Button>
            ) : requestStatus === 'pending' ? (
              <Button variant="warning" size="lg" disabled>
                Request Pending ⏳
              </Button>
            ) : (
              isAuthenticated &&
              !isOwnProduct && (
                <Button
                  variant="success"
                  size="lg"
                  onClick={sendPurchaseRequest}
                  disabled={loadingRequest}
                >
                  {loadingRequest ? 'Sending...' : 'Send Purchase Request'}
                </Button>
              )
            )}

            {isAuthenticated && !isOwnProduct && (
              <Button
                variant="primary"
                size="lg"
                className="ms-2"
                onClick={() =>
                  navigate(
                    `/chat?productId=${product._id}&otherUserId=${product.sellerId?._id}&title=${encodeURIComponent(
                      product.title
                    )}&role=${encodeURIComponent("Buyer")}`
                  )
                }
              >
                Chat with Seller
              </Button>
            )}

            <Button
              as={Link}
              to="/home"
              variant="outline-secondary"
              size="lg"
              className="ms-2"
            >
              Back
            </Button>
          </div>
        </Col>
      </Row>

      {/* ================= TOAST ================= */}
      <Toast
        show={showToast}
        onClose={() => setShowToast(false)}
        delay={4000}
        autohide
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 9999,
        }}
      >
        <Toast.Body
          className={toastMessage.includes('❌') ? 'text-danger' : 'text-success'}
        >
          {toastMessage}
        </Toast.Body>
      </Toast>
    </Container>
  );
};

export default ProductDetails;

