import React, { useState, useEffect, useContext } from "react";
import {
  Container,
  Row,
  Col,
  Image,
  Card,
  Badge,
  Spinner,
  Alert,
  Button
} from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/api";
import { AuthContext } from "../context/AuthContext";
import { getImageUrl } from "../utils/imageUrl";
import "./BuyProduct.css";

const BuyProduct = () => {

  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [requestError, setRequestError] = useState("");
  const [requestSent, setRequestSent] = useState(false);



  // ================= FETCH PRODUCT =================
  const fetchProduct = async () => {
    try {

      const res = await api.get(`/products/${id}`);
      setProduct(res.data);

    } catch (err) {

      console.error(err);
      setError("Product not found");

    } finally {

      setLoading(false);

    }
  };



  // ================= CHECK REQUEST STATUS =================
  const checkRequestStatus = async () => {
    try {

      const res = await api.get(`/orders/request-status/${id}`);

      if (res.data && res.data.status === "pending") {
        setRequestSent(true);
      }

    } catch (err) {

      console.log("No previous request");

    }
  };



  useEffect(() => {

    fetchProduct();
    checkRequestStatus();

  }, [id]);



  // ================= SEND PURCHASE REQUEST =================
  const handleConfirmOrder = async () => {

  if (!product) return;

  setRequestError("");
  setConfirming(true);

  try {

    const res = await api.post("/orders/create", {
      productId: product._id
    });

    if (res.data) {
      setRequestSent(true);
    }

  } catch (err) {

    console.error(err);

    setRequestError(
      err.response?.data?.msg || "Failed to send request"
    );

  } finally {

    setConfirming(false);

  }

};



  // ================= LOADING =================
  if (loading)
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );



  // ================= PRODUCT NOT FOUND =================
  if (!product || error)
    return (
      <Container className="py-5">
        <Alert variant="danger">{error || "Product not found"}</Alert>

        <Button
          variant="outline-primary"
          onClick={() => navigate("/home")}
        >
          Back to Home
        </Button>
      </Container>
    );



  // ================= PRODUCT SOLD =================
  if (product.status === "sold")
    return (
      <Container className="py-5 buy-page">
        <Alert variant="warning">
          This item has already been sold.
        </Alert>

        <Button
          variant="primary"
          onClick={() => navigate("/home")}
        >
          Browse more items
        </Button>
      </Container>
    );



  const userId = user?.id || user?._id;

  const sellerIdStr = product.sellerId?._id
    ? String(product.sellerId._id)
    : product.sellerId
    ? String(product.sellerId)
    : null;

  const isOwnProduct =
    !!userId &&
    !!sellerIdStr &&
    sellerIdStr === String(userId);



  // ================= UI =================
  return (

    <div className="buy-page">

      <Container className="py-5">

        <h2 className="buy-page-title">
          Confirm Purchase Request
        </h2>

          {requestError && (
            <Alert variant="danger">
              {requestError}
            </Alert>
          )}


        {error && (
          <Alert
            variant="danger"
            dismissible
            onClose={() => setError("")}
          >
            {error}
          </Alert>
        )}



        {requestSent && (
          <Alert variant="info">
            Your request has been sent to the seller.
            <br />
            Status: <strong>Pending approval from seller</strong>
          </Alert>
        )}



        <Card className="buy-summary-card">

          <Row className="g-0">

            <Col md={5}>
              <div className="buy-image-wrap">
                <Image
                  src={getImageUrl(product.images?.[0], { placeholderSize: 800 })}
                  alt={product.title}
                  fluid
                  className="buy-product-img"
                />
              </div>
            </Col>



            <Col md={7}>

              <Card.Body className="buy-details">

                <Badge bg="primary" className="mb-2">
                  {product.category}
                </Badge>



                <h1 className="buy-product-title">
                  {product.title}
                </h1>



                <p className="buy-price">
                  ₹{product.price}
                </p>



                <p className="buy-desc">
                  {product.description}
                </p>



                <p className="buy-location">
                  📍 <strong>Pickup Location:</strong>{" "}
                  {product.pickupLocation}
                </p>



                <Card className="seller-card">

                  <Card.Body>

                    <h6 className="mb-2">
                      Seller
                    </h6>

                    <p className="mb-0">
                      <strong>
                        {product.sellerId?.name}
                      </strong>
                    </p>

                    <small className="text-muted">
                      {product.sellerId?.email}
                    </small>

                  </Card.Body>

                </Card>



                {!isOwnProduct && !requestSent && (

                  <div className="d-flex gap-3 mt-3">

                    <Button
                      variant="success"
                      size="lg"
                      className="confirm-order-btn"
                      onClick={handleConfirmOrder}
                      disabled={confirming}
                    >

                      {confirming ? (
                        <>
                          <Spinner
                            animation="border"
                            size="sm"
                            className="me-2"
                          />
                          Sending Request...
                        </>
                      ) : (
                        <>Send Purchase Request</>
                      )}

                    </Button>



                    <Button
                      variant="outline-secondary"
                      size="lg"
                      onClick={() => navigate(-2)}
                    >
                      Cancel
                    </Button>

                  </div>

                )}



                {requestSent && (
                  <Button
                    variant="secondary"
                    className="mt-3"
                    onClick={() => navigate("/home")}
                  >
                    Back to Home
                  </Button>
                )}

              </Card.Body>

            </Col>

          </Row>

        </Card>

      </Container>

    </div>

  );

};

export default BuyProduct;