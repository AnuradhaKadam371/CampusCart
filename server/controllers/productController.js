const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');
const axios = require('axios');

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

// ─── Helper: extract Cloudinary public_id ───────────────────────────────────
const extractPublicId = (url) => {
  try {
    const parts = url.split('/');
    const uploadIdx = parts.indexOf('upload');
    if (uploadIdx === -1) return null;

    const rest = parts.slice(uploadIdx + 1).join('/');
    return rest.replace(/\.[^/.]+$/, '').replace(/^v\d+\//, '');
  } catch {
    return null;
  }
};

// ─── Delete images ──────────────────────────────────────────────────────────
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
// CREATE PRODUCT
// ============================================================
exports.createProduct = async (req, res) => {
  try {
    const { title, description, price, category, pickupLocation } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ msg: 'Please upload at least one image' });
    }

    const imageUrls = await Promise.all(
      req.files.map((f) => uploadToCloudinary(f.buffer, f.mimetype))
    );

    const newProduct = new Product({
      title,
      description,
      price,
      category,
      pickupLocation,
      images: imageUrls,
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
// UPDATE PRODUCT
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
// DELETE PRODUCT
// ============================================================
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ msg: 'Product not found' });

    if (String(product.sellerId) !== String(req.user.id)) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

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

// ============================================================
// AI DESCRIPTION GENERATOR (FIXED)
// ============================================================
const HF_API_KEY = process.env.HUGGING_FACE_API_KEY;

const categoryMap = {
  book: 'Books',
  textbook: 'Books',
  novel: 'Books',
  phone: 'Electronics',
  laptop: 'Electronics',
  computer: 'Electronics',
  headphone: 'Electronics',
  speaker: 'Electronics',
  tablet: 'Electronics',
  camera: 'Electronics',
  earbuds: 'Electronics',
  charger: 'Electronics',
  shirt: 'Clothing',
  pants: 'Clothing',
  dress: 'Clothing',
  jacket: 'Clothing',
  shoe: 'Clothing',
  bed: 'Hostel',
  chair: 'Hostel',
  desk: 'Hostel',
  lamp: 'Hostel',
  ball: 'Sports',
  racket: 'Sports',
  bat: 'Sports',
  notebook: 'Stationery',
  pen: 'Lab',
  calculator: 'Lab'
};

const detectCategory = (text) => {
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
      return res.status(400).json({ msg: 'imageUrl is required' });
    }

    if (!HF_API_KEY) {
      return res.status(500).json({
        msg: 'AI service not configured',
        fallback: true
      });
    }

    const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    const response = await axios({
      method: 'POST',
      url: 'https://api-inference.huggingface.co/models/nlpconnect/vit-gpt2-image-captioning',
      data: imageBuffer,
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/octet-stream',
        Accept: 'application/json',
        'x-wait-for-model': 'true'
      },
      timeout: 45000
    });

    // ✅ FIXED: only ONE aiDescription (no duplicates)
    const aiDescription =
      response.data?.[0]?.generated_text ||
      response.data?.[0]?.caption ||
      'A product image';

    const suggestedCategory = detectCategory(aiDescription);

    res.json({
      description: aiDescription,
      category: suggestedCategory,
      confidence: 'high'
    });

  } catch (err) {
    console.error('generateDescription error:', err.response?.data || err.message);

    if (err.response?.status === 503) {
      return res.status(503).json({
        msg: 'AI model is loading, try again in a few seconds',
        fallback: true
      });
    }

    return res.status(500).json({
      msg: 'AI generation failed',
      error: err.response?.data || err.message,
      fallback: true
    });
  }
};