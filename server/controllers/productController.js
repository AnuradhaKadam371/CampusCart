const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');
const axios = require('axios');

// ─────────────────────────────────────────────
// Cloudinary upload helper
// ─────────────────────────────────────────────
const uploadToCloudinary = (buffer, mimetype) =>
  new Promise((resolve, reject) => {
    const resourceType = mimetype?.startsWith('video') ? 'video' : 'image';

    const stream = cloudinary.uploader.upload_stream(
      { folder: 'campuscart', resource_type: resourceType },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );

    stream.end(buffer);
  });

// ─────────────────────────────────────────────
// Extract Cloudinary ID
// ─────────────────────────────────────────────
const extractPublicId = (url) => {
  try {
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return null;

    return parts
      .slice(uploadIndex + 1)
      .join('/')
      .replace(/\.[^/.]+$/, '')
      .replace(/^v\d+\//, '');
  } catch {
    return null;
  }
};

// ─────────────────────────────────────────────
// Delete from Cloudinary
// ─────────────────────────────────────────────
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

    if (search) query.title = { $regex: search, $options: 'i' };
    if (category && category !== 'All') query.category = category;

    const products = await Product.find(query)
      .populate('sellerId', 'name email phone avatar ratingAvg ratingCount')
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (err) {
    console.error(err);
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

    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }

    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// ============================================================
// CREATE PRODUCT
// ============================================================
exports.createProduct = async (req, res) => {
  try {
    const { title, description, price, category, pickupLocation } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ msg: 'Upload at least one image' });
    }

    const imageUrls = await Promise.all(
      req.files.map((f) => uploadToCloudinary(f.buffer, f.mimetype))
    );

    const product = new Product({
      title,
      description,
      price,
      category,
      pickupLocation,
      images: imageUrls,
      sellerId: req.user.id
    });

    const saved = await product.save();
    res.json(saved);

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: err.message || 'Server Error' });
  }
};

// ============================================================
// UPDATE PRODUCT
// ============================================================
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) return res.status(404).json({ msg: 'Not found' });

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

    if (req.files?.length > 0) {
      await deleteFromCloudinary(product.images);

      update.images = await Promise.all(
        req.files.map((f) => uploadToCloudinary(f.buffer, f.mimetype))
      );
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, update, {
      new: true
    });

    res.json(updated);

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// ============================================================
// DELETE PRODUCT
// ============================================================
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) return res.status(404).json({ msg: 'Not found' });

    if (String(product.sellerId) !== String(req.user.id)) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await deleteFromCloudinary(product.images);
    await product.deleteOne();

    res.json({ msg: 'Deleted' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
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
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// ============================================================
// AI DESCRIPTION GENERATOR (STABLE VERSION - NO 500 CRASH)
// ============================================================

const HF_API_KEY = process.env.HUGGING_FACE_API_KEY;

const categoryMap = {
  book: 'Books',
  laptop: 'Electronics',
  phone: 'Electronics',
  shirt: 'Clothing',
  shoe: 'Clothing',
  bed: 'Hostel',
  chair: 'Hostel',
  racket: 'Sports',
  bat: 'Sports',
  notebook: 'Stationery',
  pen: 'Lab'
};

const detectCategory = (text = '') => {
  const lower = text.toLowerCase();
  for (const key in categoryMap) {
    if (lower.includes(key)) return categoryMap[key];
  }
  return 'Others';
};

exports.generateDescription = async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ msg: 'imageUrl required' });
    }

    // fallback safe parsing
    const base64 = imageUrl.includes('base64')
      ? imageUrl.replace(/^data:image\/\w+;base64,/, '')
      : null;

    if (!base64) {
      return res.status(400).json({ msg: 'Invalid image format' });
    }

    const imageBuffer = Buffer.from(base64, 'base64');

    let aiDescription = '';

    try {
      const response = await axios.post(
        'https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-base',
        imageBuffer,
        {
          headers: {
            Authorization: `Bearer ${HF_API_KEY}`,
            'Content-Type': 'application/octet-stream'
          },
          timeout: 30000
        }
      );

      aiDescription =
        response.data?.generated_text ||
        response.data?.[0]?.generated_text ||
        response.data?.caption ||
        'A product image';

    } catch (aiErr) {
      console.log('AI fallback triggered:', aiErr.message);
      aiDescription = 'A product image';
    }

    return res.json({
      description: aiDescription,
      category: detectCategory(aiDescription),
      confidence: 'low'
    });

  } catch (err) {
    console.error('generateDescription error:', err.message);

    return res.status(500).json({
      msg: 'Server handled error safely',
      fallback: true
    });
  }
};