import React, { useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Card, Form, Button, Alert } from "react-bootstrap";

const AcceptRequest = () => {

  const { orderId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {

      await axios.put(
        `http://localhost:5000/api/orders/accept/${orderId}`,
        {
          pickupDate,
          pickupTime,
          pickupLocation
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      alert("Request Accepted Successfully");

      navigate("/seller-requests");

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.msg || "Failed to accept request");
    }
  };

  return (
    <Container className="py-5" style={{ maxWidth: 720 }}>
      <Card className="shadow-sm">
        <Card.Body className="p-4">
          <h3 className="mb-1">Schedule Pickup</h3>
          <p className="text-muted mb-4">
            Add pickup date, time, and location. The buyer will receive an email with these details.
          </p>

          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="date"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Time</Form.Label>
              <Form.Control
                type="text"
                placeholder="Example: 4:00 PM"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Location</Form.Label>
              <Form.Control
                type="text"
                placeholder="Library Gate / Hostel / etc"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                required
              />
            </Form.Group>

            <div className="d-flex gap-2">
              <Button type="submit" variant="success">
                Confirm Pickup
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