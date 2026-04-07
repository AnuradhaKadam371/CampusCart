import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import './AddProduct.css';

const AddProduct = () => {

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        category: 'Books',
        pickupLocation: ''
    });

    const [images, setImages] = useState([]);
    const [preview, setPreview] = useState([]);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const navigate = useNavigate();

    const { title, description, price, category, pickupLocation } = formData;

    const onChange = e =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const onFileChange = e => {
        const files = Array.from(e.target.files);
        setImages(files);
        const previewUrls = files.map(file => URL.createObjectURL(file));
        setPreview(previewUrls);
    };

    const onSubmit = async e => {
        e.preventDefault();
        setSubmitting(true);

        const data = new FormData();
        data.append('title', title);
        data.append('description', description);
        data.append('price', price);
        data.append('category', category);
        data.append('pickupLocation', pickupLocation);

        images.forEach(img => {
            data.append('images', img);
        });

        try {
            await api.post('/products', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            navigate('/home');
        } catch (err) {
            setError(err.response?.data?.msg || 'Error adding product');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="sell-page">

            <div className="sell-page-bg">
                <div className="bg-shape bg-shape-1"></div>
                <div className="bg-shape bg-shape-2"></div>
                <div className="bg-shape bg-shape-3"></div>
                <div className="bg-gradient-overlay"></div>
            </div>

            <div className="sell-page-container">

                <Link
                    to="/home"
                    className="sell-back-link"
                >
                    <i className="fa-solid fa-arrow-left"></i> Back to Marketplace
                </Link>

                <div className="sell-header">
                    <h1 className="page-title">
                        <i className="fa-solid fa-tag"></i> Sell Your Item
                    </h1>
                    <p className="page-subtitle">
                        List your product on the campus marketplace in minutes.
                    </p>
                </div>

                <div className="d-flex justify-content-center">

                    <div className="form-card" style={{ maxWidth: '640px', width: '100%' }}>

                        {error && (
                            <div className="alert alert-danger d-flex align-items-center gap-2">
                                <i className="fa-solid fa-circle-exclamation"></i>
                                {error}
                            </div>
                        )}

                        <form onSubmit={onSubmit}>

                            {/* ========== PHOTOS SECTION ========== */}
                            <div className="form-section">
                                <h3 className="form-section-title">
                                    <i className="fa-solid fa-image"></i> Product Photos
                                </h3>
                                <p className="form-section-desc">
                                    Upload clear photos of your item. Multiple images help buyers decide faster.
                                </p>

                                <label className="image-upload-box" htmlFor="product-images">
                                    <div className="upload-content">
                                        <div className="upload-icon-placeholder">
                                            <i className="fa-solid fa-cloud-arrow-up"></i>
                                        </div>
                                        <span className="upload-text-main">Click to upload photos</span>
                                        <span className="upload-text-sub">PNG, JPG or WEBP (max 5MB each)</span>
                                    </div>
                                    <input
                                        id="product-images"
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={onFileChange}
                                        required
                                        style={{ display: 'none' }}
                                    />
                                </label>

                                {preview.length > 0 && (
                                    <div className="preview-container">
                                        {preview.map((img, index) => (
                                            <img
                                                key={index}
                                                src={img}
                                                alt="preview"
                                                className="preview-img"
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* ========== DETAILS SECTION ========== */}
                            <div className="form-section">
                                <h3 className="form-section-title">
                                    <i className="fa-solid fa-pen"></i> Item Details
                                </h3>

                                <div className="form-group">
                                    <label>Product Name</label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={title}
                                        onChange={onChange}
                                        placeholder="What are you selling?"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Category</label>
                                    <select
                                        name="category"
                                        value={category}
                                        onChange={onChange}
                                    >
                                        <option value="Books">Books</option>
                                        <option value="Electronics">Electronics</option>
                                        <option value="Hostel">Hostel</option>
                                        <option value="Clothing">Clothing</option>
                                        <option value="Lab">Lab</option>
                                        <option value="Sports">Sports</option>
                                        <option value="Others">Others</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea
                                        name="description"
                                        value={description}
                                        onChange={onChange}
                                        rows="4"
                                        placeholder="Describe your item — condition, age, why you're selling..."
                                        required
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Price (₹)</label>
                                        <div className="price-input-wrapper">
                                            <span className="price-prefix">₹</span>
                                            <input
                                                type="number"
                                                name="price"
                                                value={price}
                                                onChange={onChange}
                                                placeholder="0"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Pickup Location</label>
                                        <input
                                            type="text"
                                            name="pickupLocation"
                                            value={pickupLocation}
                                            onChange={onChange}
                                            placeholder="Eg. Hostel A / Library"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="action-buttons">
                                    <button type="submit" className="post-btn" disabled={submitting}>
                                        {submitting ? (
                                            <>
                                                <i className="fa-solid fa-spinner fa-spin me-2"></i> Posting...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fa-solid fa-paper-plane"></i> Post Item
                                            </>
                                        )}
                                    </button>
                                </div>

                            </div>

                        </form>

                    </div>

                </div>
            </div>
        </div>
    );
};

export default AddProduct;