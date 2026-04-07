import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Spinner,
  Alert,
  Badge,
  Form,
} from "react-bootstrap";
import { AuthContext } from "../context/AuthContext";
import api from "../utils/api";
import { Link, useNavigate } from "react-router-dom";
import { getImageUrl } from "../utils/imageUrl";
import "./MyProducts.css";

const StatusBadge = ({ status }) => {
  const variant =
    status === "pending"
      ? "warning"
      : status === "accepted"
        ? "success"
        : status === "rejected"
          ? "danger"
          : status === "completed"
            ? "dark"
            : "secondary";

  const label =
    status === "pending"
      ? "PENDING"
      : status === "accepted"
        ? "ACCEPTED"
        : status === "rejected"
          ? "REJECTED"
          : status === "completed"
            ? "COMPLETED"
            : status;

  return (
    <Badge bg={variant} className="ms-2">
      {label}
    </Badge>
  );
};

const MyProductsDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const myId = useMemo(() => user?._id || user?.id, [user]);

  const [products, setProducts] = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);

  const [panel, setPanel] = useState("main"); // main | buyer | seller
  const [listingsSubTab, setListingsSubTab] = useState("available"); // available | sold
  const [buyerInnerTab, setBuyerInnerTab] = useState("requests"); // requests | purchases
  const [buyerTab, setBuyerTab] = useState("pending"); // pending | accepted | rejected
  const [sellerSubTab, setSellerSubTab] = useState("incoming"); // incoming | upcoming | completed
  const [buyerSubview, setBuyerSubview] = useState("hub"); // hub | requests (status filters)

  const [message, setMessage] = useState({ type: "", text: "" });

  // Buyer state
  const [buyerPending, setBuyerPending] = useState([]);
  const [buyerAccepted, setBuyerAccepted] = useState([]);
  const [buyerRejected, setBuyerRejected] = useState([]);
  const [buyerCompleted, setBuyerCompleted] = useState([]);

  // Seller state
  const [sellerIncoming, setSellerIncoming] = useState([]); // pending
  const [sellerUpcomingShipping, setSellerUpcomingShipping] = useState([]); // accepted
  const [sellerCompleted, setSellerCompleted] = useState([]); // completed

  // Reviews: orderId -> review|null
  const [reviewsByOrder, setReviewsByOrder] = useState({});
  const [reviewDrafts, setReviewDrafts] = useState({}); // orderId -> { rating, comment }

  // Listing delete
  const [deletingId, setDeletingId] = useState(null);

  // Action busy flags (basic UX: disable during execution)
  const [busyWithdraw, setBusyWithdraw] = useState(null);
  const [busyReject, setBusyReject] = useState(null);
  const [busySellerComplete, setBusySellerComplete] = useState(null);
  const [busyReviewOrderId, setBusyReviewOrderId] = useState(null);

  const fetchListings = async () => {
    try {
      setLoadingListings(true);
      const res = await api.get("/products/myproducts");
      setProducts(res.data || []);
    } catch (err) {
      setMessage({ type: "danger", text: "Failed to load your listings." });
    } finally {
      setLoadingListings(false);
    }
  };

  const fetchBuyer = async () => {
    const [pendingRes, acceptedRes, rejectedRes, completedRes] = await Promise.all([
      api.get("/orders/my-requests"),
      api.get("/orders/my-orders"),
      api.get("/orders/rejected-orders"),
      api.get("/orders/completed-orders"),
    ]);

    setBuyerPending(pendingRes.data || []);
    setBuyerAccepted(acceptedRes.data || []);
    setBuyerRejected(rejectedRes.data || []);
    setBuyerCompleted(completedRes.data || []);
  };

  const fetchSeller = async () => {
    const [incomingRes, shippingRes, completedRes] = await Promise.all([
      api.get("/orders/seller-requests"),
      api.get("/orders/seller-upcoming-shipping"),
      api.get("/orders/seller-completed-orders"),
    ]);

    setSellerIncoming(incomingRes.data || []);
    setSellerUpcomingShipping(shippingRes.data || []);
    setSellerCompleted(completedRes.data || []);
  };

  useEffect(() => {
    fetchListings();
  }, []);

  useEffect(() => {
    if (!myId) return;
    fetchBuyer();
    fetchSeller();
  }, [myId]);

  // Fetch existing reviews for buyer's completed orders
  useEffect(() => {
    if (!buyerCompleted.length) {
      setReviewsByOrder({});
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const results = await Promise.all(
          buyerCompleted.map((o) => api.get(`/reviews/by-order/${o._id}`))
        );
        if (cancelled) return;
        const map = {};
        results.forEach((r, idx) => {
          map[buyerCompleted[idx]._id] = r.data?.review || null;
        });
        setReviewsByOrder(map);
      } catch (err) {
        // Non-critical; allow rating UI anyway.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [buyerCompleted]);

  const refreshBuyer = async () => {
    await fetchBuyer();
  };

  const refreshSeller = async () => {
    await fetchSeller();
  };

  const deleteProduct = async (id) => {
    const product = products.find((p) => p._id === id);
    if (!window.confirm(`Are you sure you want to delete "${product?.title}"?`)) return;

    try {
      setDeletingId(id);
      await api.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => p._id !== id));
      setMessage({ type: "success", text: "Item deleted successfully!" });
    } catch (err) {
      setMessage({ type: "danger", text: err.response?.data?.msg || "Failed to delete item" });
    } finally {
      setDeletingId(null);
    }
  };

  const withdrawRequest = async (id) => {
    try {
      setBusyWithdraw(id);
      await api.delete(`/orders/withdraw/${id}`);
      await refreshBuyer();
      setMessage({ type: "success", text: "Request withdrawn successfully." });
    } catch (err) {
      setMessage({ type: "danger", text: err.response?.data?.msg || "Failed to withdraw request" });
    } finally {
      setBusyWithdraw(null);
    }
  };

  const rejectRequest = async (id) => {
    try {
      setBusyReject(id);
      await api.put(`/orders/reject/${id}`, {});
      await refreshSeller();
      setMessage({ type: "success", text: "Request rejected." });
    } catch (err) {
      setMessage({ type: "danger", text: err.response?.data?.msg || "Failed to reject request" });
    } finally {
      setBusyReject(null);
    }
  };

  const acceptRequest = (id) => {
    navigate(`/accept-request/${id}`);
  };

  const markSellerCompleted = async (orderId) => {
    try {
      setBusySellerComplete(orderId);
      await api.put(`/orders/seller-complete/${orderId}`, {});
      await refreshSeller();
      await refreshBuyer();
      setMessage({ type: "success", text: "Order marked as completed." });
    } catch (err) {
      setMessage({ type: "danger", text: err.response?.data?.msg || "Failed to mark completed" });
    } finally {
      setBusySellerComplete(null);
    }
  };

  const openChatWith = ({ productId, otherUserId, title, role }) => {
    const params = new URLSearchParams({
      productId: String(productId),
      otherUserId: String(otherUserId),
    });
    params.set("title", title || "Chat");
    if (role) params.set("role", role);
    navigate(`/chat?${params.toString()}`);
  };

  const openChatWithSeller = (order) => {
    const sellerId = order.sellerId?._id || order.sellerId;
    if (!sellerId) return;
    openChatWith({
      productId: order.productId,
      otherUserId: sellerId,
      title: order.productTitle,
      role: "Buyer",
    });
  };

  const openChatWithBuyer = (order) => {
    const buyerId = order.buyerId?._id || order.buyerId;
    if (!buyerId) return;
    openChatWith({
      productId: order.productId,
      otherUserId: buyerId,
      title: order.productTitle,
      role: "Seller",
    });
  };

  const submitReview = async (order) => {
    const draft = reviewDrafts[order._id] || {};
    const rating = Number(draft.rating);
    const comment = draft.comment || "";

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      setMessage({ type: "danger", text: "Please select a rating between 1 and 5." });
      return;
    }

    try {
      setBusyReviewOrderId(order._id);
      await api.post("/reviews", { orderId: order._id, rating, comment });
      setReviewsByOrder((prev) => ({ ...prev, [order._id]: { rating, comment } }));
      setMessage({ type: "success", text: "Review submitted successfully." });
      // refresh seller rating summary can be fetched later via product/seller reload
    } catch (err) {
      setMessage({ type: "danger", text: err.response?.data?.msg || "Failed to submit review" });
    } finally {
      setBusyReviewOrderId(null);
    }
  };

  const renderOrderCard = ({ order, variant, canWithdraw, canReject, canAccept, canChat, canMarkCompleted }) => {
    const imageSrc = getImageUrl(order.productImage || order.images?.[0], { placeholderSize: 600 });
    const status = order.status;
    const peer =
      variant === "buyer"
        ? order.sellerId
        : variant === "seller"
          ? order.buyerId
          : null;

    const peerAvatar = peer?.avatar;
    const peerName = peer?.name;
    return (
      <Card className="shadow-sm h-100 mp-card">
        <Card.Img
          variant="top"
          src={imageSrc}
          style={{ height: 190, objectFit: "contain", background: "#f8f9fa" }}
        />
        <Card.Body>
          <div className="d-flex align-items-start justify-content-between gap-3">
            <div>
              <Card.Title className="mb-1">{order.productTitle}</Card.Title>
              <StatusBadge status={status} />
            </div>
            <div className="text-end">
              <div className="text-primary fw-bold">₹{order.amount}</div>
              <div className="text-muted small">{order.category}</div>
            </div>
          </div>

          {peer && (
            <div className="mt-2 d-flex align-items-center gap-2 small text-muted">
              {peerAvatar ? (
                <img
                  src={getImageUrl(peerAvatar, { placeholderSize: 80 })}
                  alt="peer-avatar"
                  style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }}
                />
              ) : (
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "#e9ecef",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                  }}
                >
                  {(peerName || "?").charAt(0).toUpperCase()}
                </div>
              )}
              <span>
                <b>{variant === "buyer" ? "Seller" : "Buyer"}:</b> {peerName}
              </span>
            </div>
          )}

          <div className="mt-2 small text-muted">
            {order.description || "No description"}
          </div>

          {order.pickupDate && (
            <div className="mt-2 small">
              <b>Pickup:</b> {new Date(order.pickupDate).toLocaleDateString()} at {order.pickupTime}
              <br />
              <b>Location:</b> {order.pickupLocation}
            </div>
          )}

          {canWithdraw && (
            <div className="mt-3">
              <Button
                size="sm"
                variant="outline-danger"
                disabled={busyWithdraw === order._id}
                onClick={() => withdrawRequest(order._id)}
              >
                Withdraw
              </Button>
            </div>
          )}

          {canReject && (
            <div className="mt-3 d-flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant="danger"
                onClick={() => rejectRequest(order._id)}
                disabled={busyReject === order._id}
              >
                Reject
              </Button>
            </div>
          )}

          {canAccept && (
            <div className="mt-2">
              <Button size="sm" variant="success" onClick={() => acceptRequest(order._id)}>
                Accept
              </Button>
            </div>
          )}

          {canMarkCompleted && (
            <div className="mt-3">
              <Button
                size="sm"
                variant="outline-success"
                onClick={() => markSellerCompleted(order._id)}
                disabled={busySellerComplete === order._id}
              >
                Mark as Completed
              </Button>
            </div>
          )}

          {canChat && (
            <div className="mt-3">
              <Button size="sm" variant="primary" onClick={() => (variant === "buyer" ? openChatWithSeller(order) : openChatWithBuyer(order))}>
                Chat
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>
    );
  };

  if (loadingListings && !products.length) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "50vh" }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  const goMain = () => {
    setPanel("main");
  };

  const enterBuyer = () => {
    setPanel("buyer");
    setBuyerInnerTab("requests");
    setBuyerSubview("requests");
    setBuyerTab("pending");
  };

  const enterSeller = () => {
    setPanel("seller");
    setSellerSubTab("incoming");
  };

  return (
    <Container className="py-5 profile-page">
      {message.text && (
        <Alert variant={message.type} dismissible onClose={() => setMessage({ type: "", text: "" })}>
          {message.text}
        </Alert>
      )}

      {/* ================= MAIN TABS (listings hub) ================= */}
      {panel === "main" && (
        <div className="mp-main-tabs mb-4">
          <button
            type="button"
            className="mp-tab mp-tab-animate"
            data-active={true}
            onClick={() => setPanel("main")}
          >
            My Listings
            <Badge bg="secondary" className="ms-1">{products.length}</Badge>
          </button>
          <button type="button" className="mp-tab mp-tab-animate" onClick={enterBuyer}>
            Buyer
          </button>
          <button type="button" className="mp-tab mp-tab-animate" onClick={enterSeller}>
            Seller
          </button>
        </div>
      )}

      {/* ================= MY LISTINGS ================= */}
      {panel === "main" && (
        <>
          {/* Listings Sub-Tabs: Available / Sold */}
          <div className="mp-listings-subtabs mb-3">
            <button
              type="button"
              className={`mp-listings-subtab ${listingsSubTab === "available" ? "active" : ""}`}
              onClick={() => setListingsSubTab("available")}
            >
              Available Products
              <Badge bg="success" className="ms-2">
                {products.filter((p) => p.status !== "sold").length}
              </Badge>
            </button>
            <button
              type="button"
              className={`mp-listings-subtab ${listingsSubTab === "sold" ? "active" : ""}`}
              onClick={() => setListingsSubTab("sold")}
            >
              Sold Products
              <Badge bg="secondary" className="ms-2">
                {products.filter((p) => p.status === "sold").length}
              </Badge>
            </button>
          </div>

          <Row xs={1} md={2} lg={3} className="g-4">
            {products
              .filter((p) =>
                listingsSubTab === "available"
                  ? p.status !== "sold"
                  : p.status === "sold"
              )
              .length === 0 ? (
              <Col>
                <Alert variant="light">
                  {listingsSubTab === "available"
                    ? "No available listings."
                    : "No sold items yet."}
                </Alert>
              </Col>
            ) : (
              products
                .filter((p) =>
                  listingsSubTab === "available"
                    ? p.status !== "sold"
                    : p.status === "sold"
                )
                .map((product) => (
                  <Col key={product._id}>
                    <Card className="h-100 shadow-sm position-relative profile-product-card mp-card">
                      {product.status === "sold" && <div className="profile-sold-badge">SOLD</div>}
                      <Card.Img
                        variant="top"
                        src={getImageUrl(product.images?.[0], { placeholderSize: 600 })}
                        style={{ height: 200, objectFit: "contain", background: "#f8f9fa" }}
                      />
                      <Card.Body>
                        <Badge bg="light" text="dark">{product.category}</Badge>
                        <Card.Title className="mt-2 mb-1">{product.title}</Card.Title>
                        <div className="text-primary fw-bold">₹{product.price}</div>
                        <div className="small text-muted mt-2" title={product.description}>
                          {product.description}
                        </div>
                        {product.status !== "sold" && (
                        <div className="d-flex gap-2 mt-3">
                          <Link to={`/edit-product/${product._id}`} className="w-100">
                            <Button variant="outline-primary" size="sm" className="w-100">Edit</Button>
                          </Link>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="w-100"
                            disabled={deletingId === product._id}
                            onClick={() => deleteProduct(product._id)}
                          >
                            {deletingId === product._id ? "Deleting…" : "Delete"}
                          </Button>
                        </div>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                ))
            )}
          </Row>
        </>
      )}

      {/* ================= BUYER ================= */}
      {panel === "buyer" && (
        <>
          <div className="mp-section-header">
            <i className="fa-solid fa-bag-shopping me-2"></i>
            Buyer Section
          </div>
          {buyerSubview === "hub" && (
            <div className="mp-subnav mb-3">
              <button type="button" className="mp-back-btn" onClick={goMain} aria-label="Back">
                <i className="fa-solid fa-arrow-left" />
              </button>
              <div className="mp-main-tabs flex-grow-1">
                <button
                  type="button"
                  className="mp-tab mp-tab-animate"
                  data-active={buyerInnerTab === "requests"}
                  onClick={() => {
                    setBuyerInnerTab("requests");
                    setBuyerSubview("requests");
                  }}
                >
                  My Requests
                </button>
                <button
                  type="button"
                  className="mp-tab mp-tab-animate"
                  data-active={buyerInnerTab === "purchases"}
                  onClick={() => {
                    setBuyerInnerTab("purchases");
                    setBuyerSubview("hub");
                  }}
                >
                  My Purchases
                </button>
              </div>
            </div>
          )}

          {buyerSubview === "requests" && (
            <div className="mp-subnav mb-3">
              <button
                type="button"
                className="mp-back-btn"
                onClick={() => setBuyerSubview("hub")}
                aria-label="Back"
              >
                <i className="fa-solid fa-arrow-left" />
              </button>
              <div className="mp-main-tabs flex-grow-1">
                <button
                  type="button"
                  className="mp-tab mp-tab-animate"
                  data-active={buyerTab === "pending"}
                  onClick={() => setBuyerTab("pending")}
                >
                  Pending <Badge bg="secondary" className="ms-1">{buyerPending.length}</Badge>
                </button>
                <button
                  type="button"
                  className="mp-tab mp-tab-animate"
                  data-active={buyerTab === "accepted"}
                  onClick={() => setBuyerTab("accepted")}
                >
                  Accepted <Badge bg="secondary" className="ms-1">{buyerAccepted.length}</Badge>
                </button>
                <button
                  type="button"
                  className="mp-tab mp-tab-animate"
                  data-active={buyerTab === "rejected"}
                  onClick={() => setBuyerTab("rejected")}
                >
                  Rejected <Badge bg="secondary" className="ms-1">{buyerRejected.length}</Badge>
                </button>
              </div>
            </div>
          )}

          {buyerSubview === "requests" && (
            <Row className="g-4 mb-4">
              {buyerTab === "pending" && buyerPending.length === 0 && (
                <Col>
                  <Alert variant="light">No pending requests.</Alert>
                </Col>
              )}
              {buyerTab === "pending" &&
                buyerPending.map((o) => (
                  <Col key={o._id} md={6} lg={4}>
                    {renderOrderCard({ order: o, variant: "buyer", canWithdraw: true, canChat: true })}
                  </Col>
                ))}

              {buyerTab === "accepted" && buyerAccepted.length === 0 && (
                <Col>
                  <Alert variant="light">No accepted requests.</Alert>
                </Col>
              )}
              {buyerTab === "accepted" &&
                buyerAccepted.map((o) => (
                  <Col key={o._id} md={6} lg={4}>
                    {renderOrderCard({ order: o, variant: "buyer", canChat: true })}
                  </Col>
                ))}

              {buyerTab === "rejected" && buyerRejected.length === 0 && (
                <Col>
                  <Alert variant="light">No rejected requests.</Alert>
                </Col>
              )}
              {buyerTab === "rejected" &&
                buyerRejected.map((o) => (
                  <Col key={o._id} md={6} lg={4}>
                    {renderOrderCard({ order: o, variant: "buyer", canChat: true })}
                  </Col>
                ))}
            </Row>
          )}

          {buyerSubview === "hub" && buyerInnerTab === "purchases" && (
            <div>
              {buyerCompleted.length === 0 ? (
                <Alert variant="light">No completed purchases yet.</Alert>
              ) : (
                <Row className="g-4">
                  {buyerCompleted.map((order) => {
                    const review = reviewsByOrder[order._id];
                    const draft = reviewDrafts[order._id] || { rating: 0, comment: "" };

                    return (
                      <Col key={order._id} md={6} lg={4}>
                        <Card className="shadow-sm h-100 mp-card">
                          <Card.Img
                            variant="top"
                            src={getImageUrl(order.productImage || order.images?.[0], { placeholderSize: 600 })}
                            style={{ height: 190, objectFit: "contain", background: "#f8f9fa" }}
                          />
                          <Card.Body>
                            <div className="d-flex justify-content-between gap-3 align-items-start">
                              <div>
                                <Card.Title className="mb-1">{order.productTitle}</Card.Title>
                                <Badge bg="dark">COMPLETED</Badge>
                              </div>
                              <div className="text-primary fw-bold">₹{order.amount}</div>
                            </div>

                            <div className="small text-muted mt-2">
                              <b>Category:</b> {order.category} <br />
                              <b>Description:</b> {order.description || "No description"}
                            </div>

                            {review ? (
                              <Alert variant="success" className="mt-3 mb-0">
                                Thanks! You rated {review.rating} star(s).
                              </Alert>
                            ) : (
                              <div className="mt-3">
                                <div className="mb-2 fw-bold">Rate seller</div>
                                <div className="d-flex gap-1 mb-2">
                                  {[1, 2, 3, 4, 5].map((n) => (
                                    <Button
                                      key={n}
                                      size="sm"
                                      variant={draft.rating >= n ? "warning" : "outline-warning"}
                                      onClick={() =>
                                        setReviewDrafts((prev) => ({
                                          ...prev,
                                          [order._id]: { ...draft, rating: n },
                                        }))
                                      }
                                    >
                                      {n}★
                                    </Button>
                                  ))}
                                </div>
                                <Form.Control
                                  as="textarea"
                                  rows={2}
                                  placeholder="Optional comment"
                                  value={draft.comment}
                                  onChange={(e) =>
                                    setReviewDrafts((prev) => ({
                                      ...prev,
                                      [order._id]: { ...draft, comment: e.target.value },
                                    }))
                                  }
                                />
                                <div className="mt-2">
                                  <Button
                                    size="sm"
                                    variant="primary"
                                    disabled={busyReviewOrderId === order._id}
                                    onClick={() => submitReview(order)}
                                  >
                                    {busyReviewOrderId === order._id ? "Submitting…" : "Submit Review"}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </Card.Body>
                        </Card>
                      </Col>
                    );
                  })}
                </Row>
              )}
            </div>
          )}
        </>
      )}

      {/* ================= SELLER ================= */}
      {panel === "seller" && (
        <>
          <div className="mp-section-header">
            <i className="fa-solid fa-store me-2"></i>
            Seller Section
          </div>
          <div className="mp-subnav mb-3">
            <button type="button" className="mp-back-btn" onClick={goMain} aria-label="Back">
              <i className="fa-solid fa-arrow-left" />
            </button>
            <div className="mp-main-tabs flex-grow-1">
              <button
                type="button"
                className="mp-tab mp-tab-animate"
                data-active={sellerSubTab === "incoming"}
                onClick={() => setSellerSubTab("incoming")}
              >
                Incoming Requests
              </button>
              <button
                type="button"
                className="mp-tab mp-tab-animate"
                data-active={sellerSubTab === "upcoming"}
                onClick={() => setSellerSubTab("upcoming")}
              >
                Upcoming Shipping
              </button>
              <button
                type="button"
                className="mp-tab mp-tab-animate"
                data-active={sellerSubTab === "completed"}
                onClick={() => setSellerSubTab("completed")}
              >
                Completed Orders
              </button>
            </div>
          </div>

          {sellerSubTab === "incoming" && (
            <>
              {sellerIncoming.length === 0 ? (
                <Alert variant="light">No incoming requests.</Alert>
              ) : (
                <Row className="g-4 mb-4">
                  {sellerIncoming.map((o) => (
                    <Col key={o._id} md={6} lg={4}>
                      {renderOrderCard({
                        order: o,
                        variant: "seller",
                        canReject: true,
                        canAccept: true,
                        canChat: true,
                      })}
                    </Col>
                  ))}
                </Row>
              )}
            </>
          )}

          {sellerSubTab === "upcoming" && (
            <>
              {sellerUpcomingShipping.length === 0 ? (
                <Alert variant="light">No upcoming shipping orders.</Alert>
              ) : (
                <Row className="g-4 mb-4">
                  {sellerUpcomingShipping.map((o) => (
                    <Col key={o._id} md={6} lg={4}>
                      {renderOrderCard({
                        order: o,
                        variant: "seller",
                        canMarkCompleted: true,
                        canChat: true,
                      })}
                    </Col>
                  ))}
                </Row>
              )}
            </>
          )}

          {sellerSubTab === "completed" && (
            <>
              {sellerCompleted.length === 0 ? (
                <Alert variant="light">No completed orders.</Alert>
              ) : (
                <Row className="g-4">
                  {sellerCompleted.map((o) => (
                    <Col key={o._id} md={6} lg={4}>
                      {renderOrderCard({
                        order: o,
                        variant: "seller",
                        canChat: true,
                      })}
                    </Col>
                  ))}
                </Row>
              )}
            </>
          )}
        </>
      )}
    </Container>
  );
};

export default MyProductsDashboard;

