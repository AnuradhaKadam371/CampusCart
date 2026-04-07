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
                    style={{
                        fontSize: '1.5rem',
                        fontWeight: '400',
                        marginLeft: '20px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <i className="fa-solid fa-arrow-left"></i> Back to Marketplace
                </Link>

                <div className="sell-header">
                    <h1 className="page-title">
                        <i className="fa-solid fa-tag"></i> Sell Your Item
                    </h1>
                    <p className="page-subtitle">
                        Create a listing for your college marketplace.
                    </p>
                </div>

                <div className="d-flex justify-content-center">

                    <div className="form-card" style={{ maxWidth: '600px', width: '100%' }}>

                        {error && (
                            <div className="alert alert-danger">{error}</div>
                        )}

                        <form onSubmit={onSubmit}>

                            {/* Images */}
                            <div className="form-section">

                                <h3 className="form-section-title">
                                    <i className="fa-solid fa-image"></i> Product Photos
                                </h3>

                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={onFileChange}
                                    required
                                />

                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                                    {preview.map((img, index) => (
                                        <img
                                            key={index}
                                            src={img}
                                            alt="preview"
                                            style={{
                                                width: '80px',
                                                height: '80px',
                                                objectFit: 'cover',
                                                borderRadius: '6px'
                                            }}
                                        />
                                    ))}
                                </div>

                            </div>

                            {/* Details */}
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
                                        <option value="Notes">Notes</option>
                                        <option value="Calculator">Calculator</option>
                                        <option value="Projects">Projects</option>
                                        <option value="Hardware">Hardware</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea
                                        name="description"
                                        value={description}
                                        onChange={onChange}
                                        rows="4"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Price</label>
                                    <input
                                        type="number"
                                        name="price"
                                        value={price}
                                        onChange={onChange}
                                        required
                                    />
                                </div>

                                {/* Pickup Location */}
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

                                <div className="action-buttons">
                                    <button type="submit" className="post-btn">
                                        <i className="fa-solid fa-paper-plane"></i> Post Item
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