import React, { useEffect, useState } from "react";
import axios from "axios";
import "./requests.css";
import { getImageUrl } from "../utils/imageUrl";
import { useNavigate } from "react-router-dom";
import { Nav, Badge, Alert } from "react-bootstrap";

const MyRequests = () => {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const fetchOrders = async () => {
    try {
      const res = await axios.get(
        "https://campuscart-436h.onrender.com/api/orders/my-all-requests",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("Orders:", res.data);
      setOrders(res.data);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filtered = orders.filter((o) => {
    if (activeTab === "pending") return o.status === "pending";
    if (activeTab === "accepted") return o.status === "accepted";
    if (activeTab === "rejected") return o.status === "rejected";
    if (activeTab === "completed") return o.status === "completed";
    return false;
  });

  const counts = {
    pending: orders.filter((o) => o.status === "pending").length,
    accepted: orders.filter((o) => o.status === "accepted").length,
    rejected: orders.filter((o) => o.status === "rejected").length,
    completed: orders.filter((o) => o.status === "completed").length,
  };

  const withdrawRequest = async (id) => {
    try {
      await axios.delete(
        `https://campuscart-436h.onrender.com/api/orders/withdraw/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Request withdrawn");
      fetchOrders();
    } catch (err) {
      console.error("Withdraw error:", err);
    }
  };

  return (
    <div className="requests-container">
      <h2 className="requests-title">My Requests</h2>

      <Nav variant="tabs" className="mb-3">
        <Nav.Item>
          <Nav.Link active={activeTab === "pending"} onClick={() => setActiveTab("pending")}>
            Pending <Badge bg="secondary" className="ms-1">{counts.pending}</Badge>
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link active={activeTab === "accepted"} onClick={() => setActiveTab("accepted")}>
            Accepted <Badge bg="secondary" className="ms-1">{counts.accepted}</Badge>
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link active={activeTab === "rejected"} onClick={() => setActiveTab("rejected")}>
            Rejected <Badge bg="secondary" className="ms-1">{counts.rejected}</Badge>
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link active={activeTab === "completed"} onClick={() => setActiveTab("completed")}>
            Completed <Badge bg="secondary" className="ms-1">{counts.completed}</Badge>
          </Nav.Link>
        </Nav.Item>
      </Nav>

      {filtered.length === 0 ? (
        <Alert variant="light">
          {activeTab === "completed"
            ? "No completed requests yet."
            : activeTab === "pending"
              ? "No pending requests."
              : activeTab === "accepted"
                ? "No accepted requests."
                : "No rejected requests."}
        </Alert>
      ) : (
        filtered.map((order) => {

        return (
          <div key={order._id} className="request-card">
            <img
            src={getImageUrl(order.productImage || order.images?.[0])}
            alt={order.productTitle}
            className="request-image"
          />

            <div className="request-info">
              <h3>{order.productTitle}</h3>

              <p><b>Price:</b> ₹{order.amount}</p>
              <p><b>Category:</b> {order.category}</p>
              <p><b>Description:</b> {order.description}</p>

              {order.sellerId?._id && (
                <p className="d-flex align-items-center gap-2 mb-2">
                  <img
                    src={getImageUrl(order.sellerId.avatar, { placeholderSize: 40 })}
                    alt="seller-avatar"
                    style={{ width: 26, height: 26, borderRadius: "50%", objectFit: "cover" }}
                  />
                  <span><b>Seller:</b> {order.sellerId.name}</span>
                </p>
              )}
              <p className="mb-2">
                <b>Status:</b>{" "}
                <span
                  className={
                    order.status === "pending"
                      ? "status-badge status-pending"
                      : order.status === "accepted"
                        ? "status-badge status-accepted"
                        : order.status === "rejected"
                          ? "status-badge status-rejected"
                          : "status-badge"
                  }
                >
                  {String(order.status || "").toUpperCase()}
                </span>
              </p>

              {order.pickupDate && (
                <div className="request-meta">
                  <b>Pickup:</b> {new Date(order.pickupDate).toLocaleDateString()} at {order.pickupTime} <br />
                  <b>Location:</b> {order.pickupLocation}
                </div>
              )}

              {order.status === "pending" && (
                <button
                  className="btn btn-withdraw"
                  onClick={() => withdrawRequest(order._id)}
                >
                  Withdraw
                </button>
              )}

              {order.sellerId?._id && (
                <button
                  className="btn"
                  style={{ marginLeft: 10, background: "#0d6efd", color: "#fff" }}
                  onClick={() =>
                    navigate(
                      `/chat?productId=${order.productId}&otherUserId=${order.sellerId._id}&title=${encodeURIComponent(
                        order.productTitle
                      )}`
                    )
                  }
                >
                  Chat with Seller
                </button>
              )}
            </div>
          </div>
        );
      })
      )}
    </div>
  );
};

export default MyRequests;