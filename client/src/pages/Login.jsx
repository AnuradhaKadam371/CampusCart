import React, { useState, useContext, useEffect } from 'react';
import { Form, Button, Container, Alert, Card } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Login = () => {

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, user, isAuthenticated } = useContext(AuthContext);

    const navigate = useNavigate();
    const location = useLocation();

    const returnTo = location.state?.from?.pathname || '/home';

    const { email, password } = formData;

    const onChange = e =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login({ email, password });
        } catch (err) {
            const msg = err.response?.data?.msg || err.message || 'Login failed';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated && user) {
            if (user.isAdmin) {
                navigate('/admin', { replace: true });
            } else {
                navigate(returnTo, { replace: true });
            }
        }
    }, [isAuthenticated, user, navigate, returnTo]);

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#f5f7fb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative"
            }}
        >
            {/* 🔙 Back Button */}
            <Button
                variant="light"
                onClick={() => navigate(-1)}
                style={{
                    position: "absolute",
                    top: "20px",
                    left: "20px",
                    borderRadius: "10px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
                }}
            >
                ← Back
            </Button>

            <Container style={{ maxWidth: "420px" }}>

                {/* Logo Icon
                <div className="text-center mb-3">
                    <div
                        style={{
                            width: "60px",
                            height: "60px",
                            margin: "auto",
                            borderRadius: "15px",
                          //  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                           // color: "white",
                            fontSize: "24px",
                            boxShadow: "0 10px 20px rgba(37,99,235,0.3)"
                        }}
                    >
                        <i class="fa-solid fa-building-columns"></i>
                    </div>
                </div> */}

                {/* Heading */}
                <div className="text-center mb-4">
                    <h2 className="fw-bold">Welcome back to CampusCart</h2>
                    <p className="text-muted">Sign in to your student account</p>
                </div>

                <Card
                    className="shadow-sm p-4"
                    style={{
                        borderRadius: "20px",
                        border: "none"
                    }}
                >
                    {error && <Alert variant="danger">{error}</Alert>}

                    <Form onSubmit={onSubmit}>

                        {/* Email */}
                        <Form.Group className="mb-3">
                            <Form.Label>University Email</Form.Label>
                            <Form.Control
                                type="email"
                                name="email"
                                value={email}
                                onChange={onChange}
                                placeholder="name@university.edu"
                                style={inputStyle}
                                required
                            />
                        </Form.Group>

                        {/* Password */}
                        <Form.Group className="mb-2">
                            <div className="d-flex justify-content-between">
                                <Form.Label>Password</Form.Label>
                                <small className="text-primary" style={{ cursor: "pointer" }}>
                                    Forgot Password?
                                </small>
                            </div>

                            <div style={{ position: "relative" }}>
                                <Form.Control
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={password}
                                    onChange={onChange}
                                    placeholder="••••••••"
                                    style={inputStyle}
                                    required
                                />

                                {/* 👁️ Toggle */}
                                <span
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: "absolute",
                                        right: "12px",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        cursor: "pointer"
                                    }}
                                >
                                    {showPassword ? "🙈" : "👁️"}
                                </span>
                            </div>
                        </Form.Group>

                        

                        {/* Button */}
                        <Button
                            type="submit"
                            className="w-100"
                            disabled={loading}
                            style={{
                                background: "linear-gradient(90deg, #2563eb, #1d4ed8)",
                                border: "none",
                                padding: "12px",
                                borderRadius: "10px",
                                fontWeight: "600"
                            }}
                        >
                            {loading ? 'Signing in…' : 'Sign In →'}
                        </Button>

                    </Form>

                    {/* Divider */}
                    <hr className="my-4" />

                    {/* Extra Button */}
                    <Button
                        variant="light"
                        className="w-100"
                        style={{
                            borderRadius: "10px",
                            padding: "10px"
                        }}
                    >
                        Continue with Student ID
                    </Button>
                </Card>

                {/* Bottom link */}
                <div className="text-center mt-3">
                    <small>
                        Don't have an account? <Link to="/register">Sign Up</Link>
                    </small>
                </div>

            </Container>
        </div>
    );
};

const inputStyle = {
    borderRadius: "10px",
    padding: "10px",
    backgroundColor: "#f9fafb",
    border: "1px solid #e5e7eb"
};

export default Login;