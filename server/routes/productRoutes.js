const express = require('express');
const router = express.Router();

const {
    getProducts,
    getProductById,
    createProduct,
    deleteProduct,
    getMyProducts,
    updateProduct,
    generateDescription
} = require('../controllers/productController');

const auth = require('../middleware/auth');
const multer = require('multer');

// ✅ Memory storage — required for piping directly to Cloudinary (no disk writes)
const storage = multer.memoryStorage();

// Accept all common image MIME types (webp included)
const fileFilter = (req, file, cb) => {
    const allowed = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/avif'
    ];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
    }
};

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
    fileFilter
});

// ---------------- ROUTES ----------------

// Get all products (public)
router.get('/', getProducts);

// Get my products (auth)
router.get('/myproducts', auth, getMyProducts);

// AI Description Generator
router.post('/generate-description', generateDescription);

// Get single product (public)
router.get('/:id', getProductById);

// Create product with up to 5 images (auth + upload)
router.post('/', auth, upload.array('images', 5), createProduct);

// Update product (auth + optional new images)
router.put('/:id', auth, upload.array('images', 5), updateProduct);

// Delete product (auth)
router.delete('/:id', auth, deleteProduct);

module.exports = router;