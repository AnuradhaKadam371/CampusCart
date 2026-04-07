import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Card, Form, Button, Alert, Spinner } from "react-bootstrap";
import api from "../utils/api";
import "./AcceptRequest.css";

const AcceptRequest = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [pickupDate, setPickupDate] = useState("");
  const [pickupHour, setPickupHour] = useState("12");
  const [pickupMinute, setPickupMinute] = useState("00");
  const [pickupAmPm, setPickupAmPm] = useState("AM");

  const pickupTime = `${pickupHour}:${pickupMinute} ${pickupAmPm}`;
  const [pickupLocation, setPickupLocation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Splash states
  const [confirmed, setConfirmed] = useState(false);
  const [showContinueBtn, setShowContinueBtn] = useState(false);

  // Fetch order details to auto-fill pickup location
  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const res = await api.get(`/orders/single/${orderId}`);
        const order = res.data;
        if (order?.productPickupLocation) {
          setPickupLocation(order.productPickupLocation);
        }
      } catch (err) {
        console.error("Could not load order details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrderDetails();
  }, [orderId]);

  // After confirmation, show splash for 4.5s then reveal button
  useEffect(() => {
    if (!confirmed) return;
    const timer = setTimeout(() => {
      setShowContinueBtn(true);
    }, 4500);
    return () => clearTimeout(timer);
  }, [confirmed]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await api.put(`/orders/accept/${orderId}`, {
        pickupDate,
        pickupTime,
        pickupLocation,
      });

      // Show splash screen
      setConfirmed(true);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.msg || "Failed to accept request");
    } finally {
      setSubmitting(false);
    }
  };

  // ============ SPLASH SCREEN ============
  if (confirmed) {
    return (
      <div className="accept-splash-overlay">
        <div className="accept-splash-content">
          <div className="accept-splash-check">
            <svg viewBox="0 0 52 52" className="accept-splash-checkmark">
              <circle className="accept-splash-circle" cx="26" cy="26" r="25" fill="none" />
              <path className="accept-splash-tick" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
            </svg>
          </div>
          <h2 className="accept-splash-title">Order Confirmed ✅</h2>
          <p className="accept-splash-subtitle">
            Pickup details have been sent to the buyer via email.
          </p>

          {showContinueBtn ? (
            <Button
              variant="primary"
              size="lg"
              className="accept-splash-btn"
              onClick={() => navigate("/home")}
            >
              Continue Shopping
            </Button>
          ) : (
            <div className="accept-splash-loader">
              <div className="accept-splash-dot" />
              <div className="accept-splash-dot" />
              <div className="accept-splash-dot" />
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============ LOADING ============
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "50vh" }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  // ============ FORM ============
  return (
    <Container className="py-5" style={{ maxWidth: 720 }}>
      <Card className="shadow-sm accept-card">
        <Card.Body className="p-4">
          <h3 className="mb-1 fw-bold">Schedule Pickup</h3>
          <p className="text-muted mb-4">
            Add pickup date, time, and location. The buyer will receive an email with these details.
          </p>

          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">📅 Pickup Date</Form.Label>
              <Form.Control
                type="date"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                required
                min={new Date().toISOString().split("T")[0]}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">🕐 Pickup Time</Form.Label>
              <div className="accept-time-picker">
                <Form.Select
                  value={pickupHour}
                  onChange={(e) => setPickupHour(e.target.value)}
                  className="accept-time-select"
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const h = String(i + 1).padStart(2, "0");
                    return <option key={h} value={h}>{h}</option>;
                  })}
                </Form.Select>
                <span className="accept-time-colon">:</span>
                <Form.Select
                  value={pickupMinute}
                  onChange={(e) => setPickupMinute(e.target.value)}
                  className="accept-time-select"
                >
                  {["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </Form.Select>
                <div className="accept-ampm-toggle">
                  <button
                    type="button"
                    className={`accept-ampm-btn ${pickupAmPm === "AM" ? "active" : ""}`}
                    onClick={() => setPickupAmPm("AM")}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    className={`accept-ampm-btn ${pickupAmPm === "PM" ? "active" : ""}`}
                    onClick={() => setPickupAmPm("PM")}
                  >
                    PM
                  </button>
                </div>
              </div>
              <Form.Text className="text-muted">
                Select a convenient time for the pickup
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold">📍 Pickup Location</Form.Label>
              <Form.Control
                type="text"
                placeholder="Library Gate / Hostel / etc"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                required
              />
              <Form.Text className="text-muted">
                Auto-filled from product listing. Edit if needed.
              </Form.Text>
            </Form.Group>

            <div className="d-flex gap-2">
              <Button type="submit" variant="success" disabled={submitting} className="px-4">
                {submitting ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Confirming...
                  </>
                ) : (
                  "Confirm Details"
                )}
              </Button>
              <Button type="button" variant="outline-secondary" onClick={() => navigate(-1)}>
                Cancel
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AcceptRequest;