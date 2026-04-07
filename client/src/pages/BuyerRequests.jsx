import React, { useEffect, useState } from "react";
import api from "../utils/api";
import { getImageUrl } from "../utils/imageUrl";
import "./requests.css";
import { useNavigate } from "react-router-dom";

const BuyerRequests = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [acceptedOrders, setAcceptedOrders] = useState([]);
  const [rejectedOrders, setRejectedOrders] = useState([]);
  const navigate = useNavigate();

  // Fetch buyer's requests from backend
  const fetchRequests = async () => {
    try {
      // Pending requests
      const pendingRes = await api.get("/orders/my-requests");
      setPendingRequests(pendingRes.data);

      // Accepted orders
      const acceptedRes = await api.get("/orders/my-orders");
      setAcceptedOrders(acceptedRes.data);

      // Rejected orders
      const rejectedRes = await api.get("/orders/rejected-orders");
      setRejectedOrders(rejectedRes.data);
    } catch (error) {
      console.error("Error fetching buyer requests:", error.message);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const withdrawRequest = async (id) => {
    try {
      await api.delete(`/orders/withdraw/${id}`);
      await fetchRequests();
    } catch (error) {
      console.error("Error withdrawing request:", error.message);
    }
  };

  return (
    <div className="requests-container">
      {/* Pending Requests */}
      <h2 className="requests-title">My Requests</h2>
      <h4 className="mb-3">Pending</h4>
      {pendingRequests.length === 0 ? (
        <p>No pending requests.</p>
      ) : (
        pendingRequests.map((order) => (
          <div
            key={order._id}
            className="request-card"
          >
            <img
              src={getImageUrl(order.productImage || order.images?.[0], { placeholderSize: 150 })}
              alt={order.productTitle}
              className="request-image"
            />
            <div className="request-info">
              <h3 className="product-title">
                {order.productTitle}
                <span className="status-badge status-pending">PENDING</span>
              </h3>
              <div className="product-price">₹{order.amount}</div>
              <div className="request-meta"><b>Category:</b> {order.category || "N/A"}</div>
              <div className="request-meta"><b>Description:</b> {order.description || "No description"}</div>
              {order.sellerId?._id && (
                <div className="request-meta d-flex align-items-center gap-2">
                  <img
                    src={getImageUrl(order.sellerId.avatar, { placeholderSize: 40 })}
                    alt="seller-avatar"
                    style={{ width: 26, height: 26, borderRadius: "50%", objectFit: "cover" }}
                  />
                  <b>Seller:</b> {order.sellerId.name}
                </div>
              )}

              <div className="request-buttons">
                <button className="btn btn-withdraw" onClick={() => withdrawRequest(order._id)}>
                  Withdraw
                </button>
                {order.sellerId?._id && (
                  <button
                    className="btn"
                    style={{ background: "#0d6efd", color: "#fff" }}
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
          </div>
        ))
      )}

      {/* Accepted Orders */}
      <h4 style={{ marginTop: 30 }} className="mb-3">Accepted</h4>
      {acceptedOrders.length === 0 ? (
        <p>No accepted orders yet.</p>
      ) : (
        acceptedOrders.map((order) => (
          <div
            key={order._id}
            className="request-card"
          >
            <img
              src={getImageUrl(order.productImage || order.images?.[0], { placeholderSize: 150 })}
              alt={order.productTitle}
              className="request-image"
            />
            <div className="request-info">
              <h3 className="product-title">
                {order.productTitle}
                <span className="status-badge status-accepted">ACCEPTED</span>
              </h3>
              <div className="product-price">₹{order.amount}</div>
              <div className="request-meta"><b>Category:</b> {order.category || "N/A"}</div>
              <div className="request-meta"><b>Description:</b> {order.description || "No description"}</div>
              {order.sellerId?._id && (
                <div className="request-meta d-flex align-items-center gap-2">
                  <img
                    src={getImageUrl(order.sellerId.avatar, { placeholderSize: 40 })}
                    alt="seller-avatar"
                    style={{ width: 26, height: 26, borderRadius: "50%", objectFit: "cover" }}
                  />
                  <b>Seller:</b> {order.sellerId.name}
                </div>
              )}
              {order.pickupDate && (
                <div className="request-meta">
                  <b>Pickup:</b> {new Date(order.pickupDate).toLocaleDateString()} at {order.pickupTime} <br />
                  <b>Location:</b> {order.pickupLocation}
                </div>
              )}

              <div className="request-buttons">
                {order.sellerId?._id && (
                  <button
                    className="btn"
                    style={{ background: "#0d6efd", color: "#fff" }}
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
          </div>
        ))
      )}

      {/* Rejected Orders */}
      <h4 style={{ marginTop: 30 }} className="mb-3">Rejected</h4>
      {rejectedOrders.length === 0 ? (
        <p>No rejected requests.</p>
      ) : (
        rejectedOrders.map((order) => (
          <div key={order._id} className="request-card">
            <img
              src={getImageUrl(order.productImage || order.images?.[0], { placeholderSize: 150 })}
              alt={order.productTitle}
              className="request-image"
            />
            <div className="request-info">
              <h3 className="product-title">
                {order.productTitle}
                <span className="status-badge status-rejected">REJECTED</span>
              </h3>
              <div className="product-price">₹{order.amount}</div>
              <div className="request-meta"><b>Category:</b> {order.category || "N/A"}</div>
              <div className="request-meta"><b>Description:</b> {order.description || "No description"}</div>
              {order.sellerId?._id && (
                <div className="request-meta d-flex align-items-center gap-2">
                  <img
                    src={getImageUrl(order.sellerId.avatar, { placeholderSize: 40 })}
                    alt="seller-avatar"
                    style={{ width: 26, height: 26, borderRadius: "50%", objectFit: "cover" }}
                  />
                  <b>Seller:</b> {order.sellerId.name}
                </div>
              )}
              <div className="request-buttons">
                {order.sellerId?._id && (
                  <button
                    className="btn"
                    style={{ background: "#0d6efd", color: "#fff" }}
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
          </div>
        ))
      )}
    </div>
  );
};

export default BuyerRequests;