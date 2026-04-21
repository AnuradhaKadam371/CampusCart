const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');

// ─── Helper: upload a single file buffer to Cloudinary ──────────────────────
const uploadToCloudinary = (buffer, mimetype) =>
  new Promise((resolve, reject) => {
    const resourceType = mimetype && mimetype.startsWith('video') ? 'video' : 'image';
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'campuscart', resource_type: resourceType },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });

// ─── Helper: extract Cloudinary public_id from URL ──────────────────────────
const extractPublicId = (url) => {
  try {
    // URL format: https://res.cloudinary.com/{cloud}/image/upload/{version}/{folder}/{id}.{ext}
    const parts = url.split('/');
    const uploadIdx = parts.indexOf('upload');
    if (uploadIdx === -1) return null;
    // join everything after "upload/v...." skip version segment if present
    const rest = parts.slice(uploadIdx + 1).join('/');
    // remove extension
    return rest.replace(/\.[^/.]+$/, '').replace(/^v\d+\//, '');
  } catch {
    return null;
  }
};

// ─── DELETE images from Cloudinary ──────────────────────────────────────────
const deleteFromCloudinary = async (urls = []) => {
  const ids = urls.map(extractPublicId).filter(Boolean);
  await Promise.allSettled(ids.map((id) => cloudinary.uploader.destroy(id)));
};

// ============================================================
// GET ALL PRODUCTS
// ============================================================
exports.getProducts = async (req, res) => {
  try {
    const { search, category } = req.query;
    const query = { status: { $ne: 'sold' } };

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
    console.error('getProducts:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// ============================================================
// GET PRODUCT BY ID
// ============================================================
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('sellerId', 'name email phone avatar ratingAvg ratingCount');

    if (!product) return res.status(404).json({ msg: 'Product not found' });

    res.json(product);
  } catch (err) {
    console.error('getProductById:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// ============================================================
// CREATE PRODUCT  — uploads images to Cloudinary
// ============================================================
exports.createProduct = async (req, res) => {
  try {
    const { title, description, price, category, pickupLocation } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ msg: 'Please upload at least one image' });
    }

    // Upload all images in parallel
    const imageUrls = await Promise.all(
      req.files.map((f) => uploadToCloudinary(f.buffer, f.mimetype))
    );

    const newProduct = new Product({
      title,
      description,
      price,
      category,
      pickupLocation,
      images: imageUrls,   // ✅ Cloudinary HTTPS URLs stored in DB
      sellerId: req.user.id
    });

    const saved = await newProduct.save();
    res.json(saved);
  } catch (err) {
    console.error('createProduct:', err);
    res.status(500).json({ msg: err.message || 'Server Error' });
  }
};

// ============================================================
// UPDATE PRODUCT — replaces images on Cloudinary if new ones provided
// ============================================================
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ msg: 'Product not found' });

    if (String(product.sellerId) !== String(req.user.id)) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const update = {
      title: req.body.title ?? product.title,
      description: req.body.description ?? product.description,
      price: req.body.price ?? product.price,
      category: req.body.category ?? product.category,
      pickupLocation: req.body.pickupLocation ?? product.pickupLocation,
    };

    if (req.files && req.files.length > 0) {
      // Optionally delete old images from Cloudinary
      await deleteFromCloudinary(product.images);

      update.images = await Promise.all(
        req.files.map((f) => uploadToCloudinary(f.buffer, f.mimetype))
      );
    }

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    console.error('updateProduct:', err);
    res.status(500).json({ msg: err.message || 'Server Error' });
  }
};

// ============================================================
// DELETE PRODUCT — also removes images from Cloudinary
// ============================================================
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ msg: 'Product not found' });

    if (String(product.sellerId) !== String(req.user.id)) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // Clean up Cloudinary images
    await deleteFromCloudinary(product.images);

    await product.deleteOne();
    res.json({ msg: 'Product removed' });
  } catch (err) {
    console.error('deleteProduct:', err);
    res.status(500).json({ msg: err.message || 'Server Error' });
  }
};

// ============================================================
// MY PRODUCTS
// ============================================================
exports.getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ sellerId: req.user.id })
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (err) {
    console.error('getMyProducts:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
};