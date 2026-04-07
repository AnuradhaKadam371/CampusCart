import React, { useState, useContext } from 'react';
import { Form, Button, Container, Alert, Row, Col, Card } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        department: '',
        year: '',
        password: '',
        confirmPassword: ''
    });

    const [error, setError] = useState('');
    const { register } = useContext(AuthContext);
    const navigate = useNavigate();

    const { name, email, phone, department, year, password, confirmPassword } = formData;

    const onChange = e =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            await register({ name, email, phone, department, year, password });
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.msg || 'Registration Failed');
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#f5f7fb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
            }}
        >
            <Container>

                {/* Heading */}
                <div className="text-center mb-4">
                    <h1 className="fw-bold">Create your CampusCart account</h1>
                    <p className="text-muted">Join your university marketplace</p>
                </div>

                <Card
                    className="shadow-sm p-4"
                    style={{
                        maxWidth: "750px",
                        margin: "auto",
                        borderRadius: "20px",
                        border: "none"
                    }}
                >
                    {error && <Alert variant="danger">{error}</Alert>}

                    <Form onSubmit={onSubmit}>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Full Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="name"
                                        value={name}
                                        onChange={onChange}
                                        placeholder="Alex Rivers"
                                        style={inputStyle}
                                        required
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>University Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        name="email"
                                        value={email}
                                        onChange={onChange}
                                        placeholder="alex.rivers@university.edu"
                                        style={inputStyle}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Phone</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="phone"
                                        value={phone}
                                        onChange={onChange}
                                        placeholder="9876543210"
                                        style={inputStyle}
                                        required
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Department</Form.Label>
                                    <Form.Select
                                        name="department"
                                        value={department}
                                        onChange={onChange}
                                        style={inputStyle}
                                        required
                                    >
                                        <option value="">Select Department</option>
                                        <option>Computer Engineering</option>
                                        <option>Information Technology</option>
                                        <option>Mechanical Engineering</option>
                                        <option>Civil Engineering</option>
                                        <option>Electronics Engineering</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Graduation Year</Form.Label>
                                    <Form.Select
                                        name="year"
                                        value={year}
                                        onChange={onChange}
                                        style={inputStyle}
                                        required
                                    >
                                        <option value="">Select year</option>
                                        <option>First Year</option>
                                        <option>Second Year</option>
                                        <option>Third Year</option>
                                        <option>Final Year</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        name="password"
                                        value={password}
                                        onChange={onChange}
                                        placeholder="••••••••"
                                        style={inputStyle}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>Confirm Password</Form.Label>
                            <Form.Control
                                type="password"
                                name="confirmPassword"
                                value={confirmPassword}
                                onChange={onChange}
                                placeholder="••••••••"
                                style={inputStyle}
                                required
                            />
                        </Form.Group>

                        {/* Button */}
                        <Button
                            type="submit"
                            className="w-100"
                            style={{
                                background: "linear-gradient(90deg, #2563eb, #1d4ed8)",
                                border: "none",
                                padding: "12px",
                                borderRadius: "10px",
                                fontWeight: "600"
                            }}
                        >
                            Create Account →
                        </Button>

                    </Form>

                    <div className="text-center mt-3">
                        <small>
                            Already have an account? <Link to="/login">Sign In</Link>
                        </small>
                    </div>
                </Card>
            </Container>
        </div>
    );
};

/* 🔥 Common input style */
const inputStyle = {
    borderRadius: "10px",
    padding: "10px",
    backgroundColor: "#f9fafb",
    border: "1px solid #e5e7eb"
};

export default Register;