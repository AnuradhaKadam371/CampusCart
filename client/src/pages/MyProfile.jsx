import React, { useContext, useState } from 'react';
import { Container, Card, Form, Button, Alert, Row, Col, Image, Badge } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import './MyProfile.css';
import { getImageUrl } from '../utils/imageUrl';
import api from '../utils/api';

const MyProfile = () => {

    const { user, updateProfile, loadUser } = useContext(AuthContext);

    const [editing, setEditing] = useState(false);

    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        department: user?.department || '',
        year: user?.year || ''
    });

    const [message, setMessage] = useState({ type: '', text: '' });
    const [uploading, setUploading] = useState(false);

    const onChange = (e) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleUpdate = async () => {

        try {

            await updateProfile(formData);

            setMessage({
                type: 'success',
                text: 'Profile updated successfully!'
            });

            setEditing(false);

            setTimeout(() => {
                setMessage({ type: '', text: '' });
            }, 3000);

        } catch (err) {

            setMessage({
                type: 'danger',
                text: err.response?.data?.msg || 'Update failed'
            });

        }
    };

    const uploadAvatar = async (file) => {
        if (!file) return;
        setUploading(true);
        try {
            const data = new FormData();
            data.append('avatar', file);
            await api.put('/auth/profile/avatar', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            await loadUser(); // refresh profile (including avatar)
            setMessage({ type: 'success', text: 'Profile photo updated!' });
        } catch (err) {
            setMessage({
                type: 'danger',
                text: err.response?.data?.msg || 'Failed to upload profile photo'
            });
        } finally {
            setUploading(false);
        }
    };

    if (!user) return null;

    return (

        <Container className="my-profile-page py-5">

            <Card className="shadow-sm p-4">

                <div className="text-center mb-4">
                    {user?.avatar ? (
                        <Image
                            src={getImageUrl(user.avatar, { placeholderSize: 200 })}
                            roundedCircle
                            style={{ width: 92, height: 92, objectFit: 'cover' }}
                            alt="profile"
                        />
                    ) : (
                        <div className="profile-avatar">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <h3 className="mt-3">{user.name}</h3>
                    {(user.ratingCount || user.ratingAvg) && (
                        <div className="mt-2">
                            <Badge bg="light" text="dark">
                                ⭐ {Number(user.ratingAvg || 0).toFixed(1)} ({user.ratingCount || 0} reviews)
                            </Badge>
                        </div>
                    )}
                    <div className="mt-2 d-flex justify-content-center">
                        <Form.Group>
                            <Form.Label
                                htmlFor="avatar-upload"
                                className="btn btn-outline-primary btn-sm mb-0"
                            >
                                {uploading ? 'Uploading…' : 'Change Photo'}
                            </Form.Label>
                            <Form.Control
                                id="avatar-upload"
                                type="file"
                                accept="image/*"
                                disabled={uploading}
                                onChange={(e) => uploadAvatar(e.target.files?.[0])}
                                style={{ display: 'none' }}
                            />
                        </Form.Group>
                    </div>
                </div>

                {message.text && (
                    <Alert variant={message.type}>{message.text}</Alert>
                )}

                <Form>

                    <Row>

                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={onChange}
                                    readOnly={!editing}
                                />
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Email</Form.Label>
                                <Form.Control
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={onChange}
                                    readOnly={!editing}
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
                                    value={formData.phone}
                                    onChange={onChange}
                                    readOnly={!editing}
                                />
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Department</Form.Label>
                                <Form.Select
                                    name="department"
                                    value={formData.department}
                                    onChange={onChange}
                                    disabled={!editing}
                                >
                                    <option value="">Select Department</option>
                                    <option value="Computer Engineering">Computer Engineering</option>
                                    <option value="Information Technology">Information Technology</option>
                                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                                    <option value="Civil Engineering">Civil Engineering</option>
                                    <option value="Electronics Engineering">Electronics Engineering</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>

                    </Row>

                    <Row>

                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Year</Form.Label>
                                <Form.Select
                                    name="year"
                                    value={formData.year}
                                    onChange={onChange}
                                    disabled={!editing}
                                >
                                    <option value="">Select Year</option>
                                    <option value="First Year">First Year</option>
                                    <option value="Second Year">Second Year</option>
                                    <option value="Third Year">Third Year</option>
                                    <option value="Final Year">Final Year</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>

                    </Row>

                    {!editing ? (

                        <div className="d-flex justify-content-center mt-3">
                            <Button
                                type="button"
                                variant="primary"
                                onClick={() => setEditing(true)}
                            >
                                Update Profile
                            </Button>
                        </div>

                    ) : (

                        <div className="d-flex justify-content-center gap-3 mt-3">

                            <Button
                                type="button"
                                variant="success"
                                onClick={handleUpdate}
                            >
                                Save Changes
                            </Button>

                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setEditing(false)}
                            >
                                Cancel
                            </Button>

                        </div>

                    )}

                </Form>

            </Card>

        </Container>
    );
};

export default MyProfile;