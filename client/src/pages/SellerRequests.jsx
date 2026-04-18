import React, { useEffect, useState } from "react";
import axios from "axios";
import "./requests.css";
import { useNavigate } from "react-router-dom";
import { getImageUrl } from "../utils/imageUrl";

const SellerRequests = () => {

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();


  // ✅ FETCH REQUESTS
  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        console.log("No token found");
        setLoading(false);
        return;
      }

      const res = await axios.get(
        "https://campuscart-436h.onrender.com/api/orders/seller-requests",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Seller Requests:", res.data);

      setRequests(res.data);
      setLoading(false);

    } catch (err) {
      console.error("Fetch Requests Error:", err.response?.data || err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // ✅ ACCEPT
  const acceptRequest = (id) => {
    navigate(`/accept-request/${id}`);
  };

  const chatWithBuyer = (order) => {
    navigate(
      `/chat?productId=${order.productId}&otherUserId=${order.buyerId?._id}&title=${encodeURIComponent(
        order.productTitle || "Chat"
      )}`
    );
  };

  // ✅ REJECT (FIXED: UI update without full reload)
  const rejectRequest = async (id) => {
    try {
      const token = localStorage.getItem("token");

      await axios.put(
        `https://campuscart-436h.onrender.com/api/orders/reject/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Request rejected");

      // 🔥 IMPORTANT FIX: Remove from UI instantly
      setRequests((prev) => prev.filter((order) => order._id !== id));

    } catch (err) {
      console.error("Reject Error:", err.response?.data || err);
    }
  };

  return (
    <div className="requests-container">

      <h2 className="requests-title">Incoming Requests</h2>

      {/* ✅ Loading State */}
      {loading && <p>Loading requests...</p>}

      {/* ✅ Empty State */}
      {!loading && requests.length === 0 && (
        <p>No requests yet</p>
      )}

      {/* ✅ LIST */}
      {requests.map((order) => (

        <div key={order._id} className="request-card">

          {/* ✅ IMAGE FIX (fallback added) */}
         <img
          src={getImageUrl(order.productImage || order.images?.[0])}
          alt={order.productTitle}
          className="request-image"
        />

          <div className="request-info">

            <h3>{order.productTitle}</h3>

            <p><b>Price:</b> ₹{order.amount || "N/A"}</p>

            <p><b>Category:</b> {order.category || "N/A"}</p>

            <p><b>Description:</b> {order.description || "No description"}</p>

            <p className="d-flex align-items-center gap-2 mb-1">
              <img
                src={getImageUrl(order.buyerId?.avatar, { placeholderSize: 40 })}
                alt="buyer-avatar"
                style={{ width: 26, height: 26, borderRadius: "50%", objectFit: "cover" }}
              />
              <span><b>Buyer:</b> {order.buyerId?.name || "Unknown"}</span>
            </p>

            <p><b>Email:</b> {order.buyerId?.email || "N/A"}</p>

            <p><b>Status:</b> {order.status}</p>

            {/* ✅ ACTION BUTTONS */}
            {order.status === "pending" && (
              <div className="btn-group">

                <button
                  className="btn btn-accept"
                  onClick={() => acceptRequest(order._id)}
                >
                  Accept
                </button>

                <button
                  className="btn btn-reject"
                  onClick={() => rejectRequest(order._id)}
                >
                  Reject
                </button>

                <button
                  className="btn"
                  style={{ background: "#0d6efd", color: "#fff" }}
                  onClick={() => chatWithBuyer(order)}
                >
                  Chat with Buyer
                </button>

              </div>
            )}

          </div>

        </div>

      ))}

    </div>
  );
};

export default SellerRequests;