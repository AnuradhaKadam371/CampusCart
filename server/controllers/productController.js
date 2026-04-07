const Product = require('../models/Product');
const path = require('path');
const fs = require('fs');

exports.getProducts = async (req, res) => {
    try {
        const { search, category } = req.query;
        let query = {};

        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }

        if (category && category !== 'All') {
            query.category = category;
        }

        const products = await Product.find(query)
            .populate('sellerId', 'name email phone avatar ratingAvg ratingCount')
            .sort({ createdAt: -1 });

        res.json(products);

    } catch (err) {

        console.error(err.message);
        res.status(500).send('Server Error');

    }
};

exports.getProductById = async (req, res) => {

    try {

        const product = await Product.findById(req.params.id)
            .populate('sellerId', 'name email phone avatar ratingAvg ratingCount');

        if (!product) {
            return res.status(404).json({ msg: 'Product not found' });
        }

        res.json(product);

    } catch (err) {

        console.error(err.message);

        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Product not found' });
        }

        res.status(500).send('Server Error');

    }

};

exports.createProduct = async (req, res) => {

    try {

        const {
            title,
            description,
            price,
            category,
            pickupLocation,
            contactPreference
        } = req.body;

        if (!title || !description || !price || !category) {
            return res.status(400).json({
                msg: 'Please provide all required fields'
            });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                msg: 'Please upload at least one image'
            });
        }

        const uploadsDir = path.join(__dirname, '../uploads');

        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const images = req.files.map(file =>
    file.filename   // ✅ ONLY filename
     );

        const newProduct = new Product({
            title,
            description,
            price,
            category,
            pickupLocation,
            contactPreference,
            images,
            sellerId: req.user.id
        });

        const product = await newProduct.save();

        res.json(product);

    } catch (err) {

        console.error('Error in createProduct:', err.message);

        if (req.files) {

            req.files.forEach(file => {

                if (fs.existsSync(file.path)) {

                    try {
                        fs.unlinkSync(file.path);
                    } catch (fileErr) {
                        console.error(fileErr.message);
                    }

                }

            });

        }

        res.status(500).json({
            msg: 'Server Error',
            error: err.message
        });

    }

};

exports.updateProduct = async (req, res) => {

    try {

        const {
            title,
            description,
            price,
            category,
            pickupLocation,
            contactPreference
        } = req.body;

        const update = {};
        if (title !== undefined) update.title = title;
        if (description !== undefined) update.description = description;
        if (price !== undefined) update.price = price;
        if (category !== undefined) update.category = category;
        if (pickupLocation !== undefined) update.pickupLocation = pickupLocation;
        if (contactPreference !== undefined) update.contactPreference = contactPreference;

        if (req.files && req.files.length > 0) {

            // Keep storage consistent with createProduct (filenames only)
            update.images = req.files.map(file => file.filename);

        }

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ msg: 'Product not found' });
        }

        if (product.sellerId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        const updated = await Product.findByIdAndUpdate(
            req.params.id,
            update,
            { new: true }
        );

        res.json(updated);

    } catch (err) {

        console.error(err);
        res.status(500).send('Server Error');

    }

};

exports.deleteProduct = async (req, res) => {

    try {

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ msg: 'Product not found' });
        }

        if (product.sellerId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        if (product.images && product.images.length > 0) {

            product.images.forEach(img => {

                // Images are stored as filenames
                const imagePath = path.join(__dirname, '..', 'uploads', img);

                if (fs.existsSync(imagePath)) {

                    try {
                        fs.unlinkSync(imagePath);
                    } catch (fileErr) {
                        console.error(fileErr.message);
                    }

                }

            });

        }

        await product.deleteOne();

        res.json({ msg: 'Product removed' });

    } catch (err) {

        console.error('Error in deleteProduct:', err.message);

        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Product not found' });
        }

        res.status(500).json({
            msg: 'Server Error',
            error: err.message
        });

    }

};

exports.getMyProducts = async (req, res) => {

    try {

        const products = await Product.find({
            sellerId: req.user.id
        }).sort({ createdAt: -1 });

        res.json(products);

    } catch (err) {

        console.error(err.message);
        res.status(500).send('Server Error');

    }

};