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
                background: "linear-gradient(-45deg, #E3F2FD, #EDE7F6, #E0F7FA, #F8FAFC)",
                backgroundSize: "400% 400%",
                animation: "gradientBG 10s ease infinite",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative"
            }}
        >
            <style>{`
                @keyframes gradientBG {
                    0%   { background-position: 0% 50%; }
                    50%  { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .glass-card {
                    background: rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(16px);
                    -webkit-backdrop-filter: blur(16px);
                    border: 1px solid rgba(255, 255, 255, 0.5);
                    border-radius: 24px;
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                }
                .glass-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.08) !important;
                }
                .floating-blob {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(40px);
                    z-index: 0;
                    opacity: 0.6;
                    animation: float 8s infinite ease-in-out alternate;
                }
                @keyframes float {
                    0% { transform: translateY(0px) scale(1); }
                    100% { transform: translateY(30px) scale(1.1); }
                }
                .interactive-input:focus {
                    border-color: #2563eb !important;
                    box-shadow: 0 0 0 4px rgba(37,99,235,0.1) !important;
                    background-color: #fff !important;
                }
                .sign-in-btn {
                    transition: all 0.2s ease;
                }
                .sign-in-btn:hover {
                    transform: scale(1.02);
                    box-shadow: 0 8px 15px rgba(37,99,235,0.3);
                }
            `}</style>
            
            {/* Background Blobs */}
            <div className="floating-blob" style={{ width: "300px", height: "300px", background: "#bfdbfe", top: "10%", left: "15%", animationDelay: "0s" }}></div>
            <div className="floating-blob" style={{ width: "250px", height: "250px", background: "#f3e8ff", bottom: "15%", right: "10%", animationDelay: "2s" }}></div>
            <div className="floating-blob" style={{ width: "150px", height: "150px", background: "#cffafe", top: "40%", left: "60%", animationDelay: "4s" }}></div>

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

            <Container style={{ maxWidth: "460px", zIndex: 1, position: "relative" }}>

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
                    <div className="mb-3">
                        <i className="fa-solid fa-building-columns" style={{ fontSize: "2.5rem", color: "#2563eb", textShadow: "0 4px 10px rgba(37,99,235,0.2)" }}></i>
                    </div>
                    <h2 className="fw-bold" style={{ fontSize: "1.8rem", color: "#1e293b" }}>Welcome to CampusCart</h2>
                    <p className="text-muted" style={{ fontSize: "1.1rem" }}>Sign in to your student account</p>
                </div>

                <Card
                    className="shadow p-4 p-sm-5 glass-card"
                    style={{ border: "none" }}
                >
                    {error && <Alert variant="danger">{error}</Alert>}

                    <Form onSubmit={onSubmit}>

                        {/* Email */}
                        <Form.Group className="mb-3">
                            <Form.Label>Your Email</Form.Label>
                            <Form.Control
                                type="email"
                                name="email"
                                value={email}
                                onChange={onChange}
                                placeholder="name@gmail.com"
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
                                    className="interactive-input"
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
                                    {showPassword ? <i class="fa-solid fa-eye-slash"></i> : "👁️"}
                                </span>
                            </div>
                        </Form.Group>

                        

                        {/* Button */}
                        <Button
                            type="submit"
                            className="w-100 mt-2 sign-in-btn"
                            disabled={loading}
                            style={{
                                background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                                border: "none",
                                padding: "14px",
                                borderRadius: "12px",
                                fontSize: "1.1rem",
                                fontWeight: "600"
                            }}
                        >
                            {loading ? 'Checking Credentials…' : 'Sign In →'}
                        </Button>

                    </Form>
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
    borderRadius: "12px",
    padding: "14px 16px",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    border: "1px solid rgba(0, 0, 0, 0.05)",
    transition: "all 0.2s ease"
};

export default Login;