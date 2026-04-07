const express = require('express');
const router = express.Router();

const {
    getProducts,
    getProductById,
    createProduct,
    deleteProduct,
    getMyProducts,
    updateProduct          // ✅ added
} = require('../controllers/productController');

const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Multer Config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if (
        file.mimetype === 'image/jpeg' ||
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg'
    ) {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5
    },
    fileFilter: fileFilter
});

router.get('/', getProducts);
router.get('/myproducts', auth, getMyProducts);
router.get('/:id', getProductById);

router.post('/', auth,upload.array("images", 5), createProduct);

// ✅ update product (edit)
router.put('/:id', auth, upload.array("images", 5), updateProduct);

// delete product
router.delete('/:id', auth, deleteProduct);

module.exports = router;