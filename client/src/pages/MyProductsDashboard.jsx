import React, { useContext, useEffect, useMemo, useState } from "react";
import { Container, Row, Col, Card, Button, Spinner, Alert, Badge, Form } from "react-bootstrap";
import { AuthContext } from "../context/AuthContext";
import api from "../utils/api";
import { Link, useNavigate } from "react-router-dom";
import { getImageUrl } from "../utils/imageUrl";
import "./MyProductsDashboard.css";

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

  const [buyerTab, setBuyerTab] = useState("pending"); // pending | accepted | rejected
  const [expandedGroup, setExpandedGroup] = useState("listings"); // listings | buyer | seller
  const [activeSection, setActiveSection] = useState({ group: "listings", sub: "available" });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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

  const setSection = (group, sub) => {
    setExpandedGroup(group);
    setActiveSection({ group, sub });
    if (group === "buyer" && sub === "requests") setBuyerTab("pending");
    setMobileSidebarOpen(false);
  };

  return (
    <Container className="py-4 mpd-page">
      {message.text && (
        <Alert variant={message.type} dismissible onClose={() => setMessage({ type: "", text: "" })}>
          {message.text}
        </Alert>
      )}

      <div className="mpd-topbar d-lg-none">
        <Button variant="outline-primary" size="sm" className="mpd-menu-btn" onClick={() => setMobileSidebarOpen((v) => !v)}>
          <i className="fa-solid fa-bars me-1" />
          <span className="d-none d-sm-inline">Menu</span>
        </Button>
        <div className="mpd-topbar-title">My Dashboard</div>
      </div>

      <div
        className={`mpd-layout ${mobileSidebarOpen ? "sidebar-open" : ""}`}
        onClick={(e) => {
          // Close on backdrop click (the ::before pseudo-el is behind sidebar)
          if (mobileSidebarOpen && e.target === e.currentTarget) setMobileSidebarOpen(false);
        }}
      >
        <aside className="mpd-sidebar">
          {/* Close button — only visible on mobile */}
          <div className="d-flex justify-content-between align-items-center mb-3 d-lg-none">
            <div className="fw-bold" style={{ fontSize: "1rem", color: "#1e293b" }}>Dashboard</div>
            <Button variant="light" size="sm" style={{ borderRadius: 10 }} onClick={() => setMobileSidebarOpen(false)}>
              <i className="fa-solid fa-xmark" />
            </Button>
          </div>
          <div className="mpd-sidebar-header d-none d-lg-flex">
            <div className="mpd-sidebar-title">Dashboard</div>
            <div className="text-muted small">My Products</div>
          </div>

          <div className="mpd-nav">
            <button type="button" className={`mpd-group ${expandedGroup === "listings" ? "expanded" : ""}`} onClick={() => setExpandedGroup("listings")}>
              <span className="mpd-group-label">
                <i className="fa-solid fa-box-open me-2" />
                My Listings
              </span>
              <i className={`fa-solid fa-chevron-${expandedGroup === "listings" ? "down" : "right"}`} />
            </button>
            {expandedGroup === "listings" && (
              <div className="mpd-subnav">
                <button type="button" className={`mpd-item ${activeSection.group === "listings" && activeSection.sub === "available" ? "active" : ""}`} onClick={() => setSection("listings", "available")}>
                  <span>Available Products</span>
                  <Badge bg="success">{products.filter((p) => p.status !== "sold").length}</Badge>
                </button>
                <button type="button" className={`mpd-item ${activeSection.group === "listings" && activeSection.sub === "sold" ? "active" : ""}`} onClick={() => setSection("listings", "sold")}>
                  <span>Sold Products</span>
                  <Badge bg="secondary">{products.filter((p) => p.status === "sold").length}</Badge>
                </button>
              </div>
            )}

            <button type="button" className={`mpd-group ${expandedGroup === "buyer" ? "expanded" : ""}`} onClick={() => setExpandedGroup("buyer")}>
              <span className="mpd-group-label">
                <i className="fa-solid fa-bag-shopping me-2" />
                Buyer
              </span>
              <i className={`fa-solid fa-chevron-${expandedGroup === "buyer" ? "down" : "right"}`} />
            </button>
            {expandedGroup === "buyer" && (
              <div className="mpd-subnav">
                <button type="button" className={`mpd-item ${activeSection.group === "buyer" && activeSection.sub === "requests" ? "active" : ""}`} onClick={() => setSection("buyer", "requests")}>
                  <span>My Requests</span>
                  <Badge bg="secondary">{buyerPending.length + buyerAccepted.length + buyerRejected.length}</Badge>
                </button>
                <button type="button" className={`mpd-item ${activeSection.group === "buyer" && activeSection.sub === "purchases" ? "active" : ""}`} onClick={() => setSection("buyer", "purchases")}>
                  <span>Purchased Products</span>
                  <Badge bg="secondary">{buyerCompleted.length}</Badge>
                </button>
              </div>
            )}

            <button type="button" className={`mpd-group ${expandedGroup === "seller" ? "expanded" : ""}`} onClick={() => setExpandedGroup("seller")}>
              <span className="mpd-group-label">
                <i className="fa-solid fa-store me-2" />
                Seller
              </span>
              <i className={`fa-solid fa-chevron-${expandedGroup === "seller" ? "down" : "right"}`} />
            </button>
            {expandedGroup === "seller" && (
              <div className="mpd-subnav">
                <button type="button" className={`mpd-item ${activeSection.group === "seller" && activeSection.sub === "incoming" ? "active" : ""}`} onClick={() => setSection("seller", "incoming")}>
                  <span>Incoming Requests</span>
                  <Badge bg="secondary">{sellerIncoming.length}</Badge>
                </button>
                <button type="button" className={`mpd-item ${activeSection.group === "seller" && activeSection.sub === "upcoming" ? "active" : ""}`} onClick={() => setSection("seller", "upcoming")}>
                  <span>Upcoming Shipping</span>
                  <Badge bg="secondary">{sellerUpcomingShipping.length}</Badge>
                </button>
                <button type="button" className={`mpd-item ${activeSection.group === "seller" && activeSection.sub === "completed" ? "active" : ""}`} onClick={() => setSection("seller", "completed")}>
                  <span>Completed Orders</span>
                  <Badge bg="secondary">{sellerCompleted.length}</Badge>
                </button>
              </div>
            )}
          </div>
        </aside>

        <main className="mpd-content">
          <div className="mpd-content-header">
            <div className="mpd-h1">{activeSection.group === "listings" ? "My Listings" : activeSection.group === "buyer" ? "Buyer" : "Seller"}</div>
            <div className="mpd-h2 text-muted">
              {activeSection.group === "listings"
                ? activeSection.sub === "available"
                  ? "Available Products"
                  : "Sold Products"
                : activeSection.group === "buyer"
                  ? activeSection.sub === "requests"
                    ? "My Requests"
                    : "Purchased Products"
                  : activeSection.sub === "incoming"
                    ? "Incoming Requests"
                    : activeSection.sub === "upcoming"
                      ? "Upcoming Shipping"
                      : "Completed Orders"}
            </div>
          </div>

          {activeSection.group === "listings" && (
            <Row xs={1} md={2} lg={3} className="g-4">
              {products.filter((p) => (activeSection.sub === "available" ? p.status !== "sold" : p.status === "sold")).length === 0 ? (
                <Col>
                  <Alert variant="light">{activeSection.sub === "available" ? "No available listings." : "No sold items yet."}</Alert>
                </Col>
              ) : (
                products
                  .filter((p) => (activeSection.sub === "available" ? p.status !== "sold" : p.status === "sold"))
                  .map((product) => (
                    <Col key={product._id}>
                      <Card className="h-100 shadow-sm position-relative mpd-card">
                        {product.status === "sold" && <div className="mpd-sold-badge">SOLD</div>}
                        <Card.Img variant="top" src={getImageUrl(product.images?.[0], { placeholderSize: 600 })} className="mpd-card-img" alt="" />
                        <Card.Body>
                          <Badge bg="light" text="dark">{product.category}</Badge>
                          <Card.Title className="mt-2 mb-1">{product.title}</Card.Title>
                          <div className="text-primary fw-bold">₹{product.price}</div>
                          <div className="small text-muted mt-2" title={product.description}>{product.description}</div>
                          {product.status !== "sold" && (
                            <div className="d-flex gap-2 mt-3 flex-wrap">
                              <Link to={`/edit-product/${product._id}`} className="flex-grow-1">
                                <Button variant="outline-primary" size="sm" className="w-100">Edit</Button>
                              </Link>
                              <Button variant="outline-danger" size="sm" className="flex-grow-1" disabled={deletingId === product._id} onClick={() => deleteProduct(product._id)}>
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
          )}

          {activeSection.group === "buyer" && activeSection.sub === "requests" && (
            <>
              <div className="mpd-inline-tabs mb-3">
                <button type="button" className={`mpd-inline-tab ${buyerTab === "pending" ? "active" : ""}`} onClick={() => setBuyerTab("pending")}>
                  Pending <Badge bg="secondary" className="ms-1">{buyerPending.length}</Badge>
                </button>
                <button type="button" className={`mpd-inline-tab ${buyerTab === "accepted" ? "active" : ""}`} onClick={() => setBuyerTab("accepted")}>
                  Accepted <Badge bg="secondary" className="ms-1">{buyerAccepted.length}</Badge>
                </button>
                <button type="button" className={`mpd-inline-tab ${buyerTab === "rejected" ? "active" : ""}`} onClick={() => setBuyerTab("rejected")}>
                  Rejected <Badge bg="secondary" className="ms-1">{buyerRejected.length}</Badge>
                </button>
              </div>

              <Row className="g-4 mb-4">
                {buyerTab === "pending" && buyerPending.length === 0 && (
                  <Col>
                    <Alert variant="light">No pending requests.</Alert>
                  </Col>
                )}
                {buyerTab === "pending" && buyerPending.map((o) => (
                  <Col key={o._id} md={6} lg={4}>
                    {renderOrderCard({ order: o, variant: "buyer", canWithdraw: true, canChat: true })}
                  </Col>
                ))}

                {buyerTab === "accepted" && buyerAccepted.length === 0 && (
                  <Col>
                    <Alert variant="light">No accepted requests.</Alert>
                  </Col>
                )}
                {buyerTab === "accepted" && buyerAccepted.map((o) => (
                  <Col key={o._id} md={6} lg={4}>
                    {renderOrderCard({ order: o, variant: "buyer", canChat: true })}
                  </Col>
                ))}

                {buyerTab === "rejected" && buyerRejected.length === 0 && (
                  <Col>
                    <Alert variant="light">No rejected requests.</Alert>
                  </Col>
                )}
                {buyerTab === "rejected" && buyerRejected.map((o) => (
                  <Col key={o._id} md={6} lg={4}>
                    {renderOrderCard({ order: o, variant: "buyer", canChat: true })}
                  </Col>
                ))}
              </Row>
            </>
          )}

          {activeSection.group === "buyer" && activeSection.sub === "purchases" && (
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
                        <Card className="shadow-sm h-100 mpd-card">
                          <Card.Img variant="top" src={getImageUrl(order.productImage || order.images?.[0], { placeholderSize: 600 })} className="mpd-card-img" alt="" />
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
                                <div className="d-flex gap-1 mb-2 flex-wrap">
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
                                  <Button size="sm" variant="primary" disabled={busyReviewOrderId === order._id} onClick={() => submitReview(order)}>
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

          {activeSection.group === "seller" && (
            <>
              {activeSection.sub === "incoming" && (
                <>
                  {sellerIncoming.length === 0 ? (
                    <Alert variant="light">No incoming requests.</Alert>
                  ) : (
                    <Row className="g-4 mb-4">
                      {sellerIncoming.map((o) => (
                        <Col key={o._id} md={6} lg={4}>
                          {renderOrderCard({ order: o, variant: "seller", canReject: true, canAccept: true, canChat: true })}
                        </Col>
                      ))}
                    </Row>
                  )}
                </>
              )}

              {activeSection.sub === "upcoming" && (
                <>
                  {sellerUpcomingShipping.length === 0 ? (
                    <Alert variant="light">No upcoming shipping orders.</Alert>
                  ) : (
                    <Row className="g-4 mb-4">
                      {sellerUpcomingShipping.map((o) => (
                        <Col key={o._id} md={6} lg={4}>
                          {renderOrderCard({ order: o, variant: "seller", canMarkCompleted: true, canChat: true })}
                        </Col>
                      ))}
                    </Row>
                  )}
                </>
              )}

              {activeSection.sub === "completed" && (
                <>
                  {sellerCompleted.length === 0 ? (
                    <Alert variant="light">No completed orders.</Alert>
                  ) : (
                    <Row className="g-4">
                      {sellerCompleted.map((o) => (
                        <Col key={o._id} md={6} lg={4}>
                          {renderOrderCard({ order: o, variant: "seller", canChat: true })}
                        </Col>
                      ))}
                    </Row>
                  )}
                </>
              )}
            </>
          )}
        </main>
      </div>
    </Container>
  );
};

export default MyProductsDashboard;

