import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Form, Button, Spinner, Alert, Row, Col, Image } from 'react-bootstrap';
import api from '../utils/api';
import { getImageUrl } from '../utils/imageUrl';

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    price: '',
    category: '',
    description: '',
    pickupLocation: ''
  });

  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [preview, setPreview] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        const p = res.data;

        setForm({
          title: p.title || '',
          price: p.price || '',
          category: p.category || '',
          description: p.description || '',
          pickupLocation: p.pickupLocation || ''
        });
        setExistingImages(Array.isArray(p.images) ? p.images : []);

      } catch (err) {
        setError('Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    setNewImages(files);
    setPreview(files.map((f) => URL.createObjectURL(f)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const data = new FormData();
      data.append('title', form.title);
      data.append('description', form.description);
      data.append('price', form.price);
      data.append('category', form.category);
      data.append('pickupLocation', form.pickupLocation);
      newImages.forEach((img) => data.append('images', img));

      await api.put(`/products/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      navigate('/my-products');
    } catch (err) {
      setError('Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-5"><Spinner /></div>;
  }

  return (
    <Container className="py-4" style={{ maxWidth: 800 }}>
      <h4 className="mb-3">Edit Product</h4>

      {error && <Alert variant="danger">{error}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Current Photos</Form.Label>
          {existingImages.length === 0 ? (
            <div className="text-muted">No images available.</div>
          ) : (
            <Row className="g-2">
              {existingImages.map((img, idx) => (
                <Col key={idx} xs={4} sm={3}>
                  <Image
                    src={getImageUrl(img, { placeholderSize: 200 })}
                    alt={`product-${idx}`}
                    thumbnail
                    style={{ width: '100%', height: 90, objectFit: 'cover' }}
                  />
                </Col>
              ))}
            </Row>
          )}
          <div className="text-muted mt-2 small">
            Uploading new photos will replace the listing photos.
          </div>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Replace Photos (optional)</Form.Label>
          <Form.Control type="file" accept="image/*" multiple onChange={handleFileChange} />
          {preview.length > 0 && (
            <Row className="g-2 mt-2">
              {preview.map((url, idx) => (
                <Col key={idx} xs={4} sm={3}>
                  <Image
                    src={url}
                    alt={`preview-${idx}`}
                    thumbnail
                    style={{ width: '100%', height: 90, objectFit: 'cover' }}
                  />
                </Col>
              ))}
            </Row>
          )}
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Title</Form.Label>
          <Form.Control
            name="title"
            value={form.title}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Price</Form.Label>
          <Form.Control
            type="number"
            name="price"
            value={form.price}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Category</Form.Label>
          <Form.Select
            name="category"
            value={form.category}
            onChange={handleChange}
            required
          >
            <option value="Books">Books</option>
            <option value="Notes">Notes</option>
            <option value="Calculator">Calculator</option>
            <option value="Projects">Projects</option>
            <option value="Hardware">Hardware</option>
            <option value="Other">Other</option>
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Description</Form.Label>
          <Form.Control
            as="textarea"
            rows={4}
            name="description"
            value={form.description}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Pickup Location</Form.Label>
          <Form.Control
            name="pickupLocation"
            value={form.pickupLocation}
            onChange={handleChange}
            placeholder="Eg. Hostel A / Library"
            required
          />
        </Form.Group>

        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Update'}
        </Button>

      </Form>
    </Container>
  );
};

export default EditProduct;