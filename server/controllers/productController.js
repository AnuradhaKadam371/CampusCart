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
// AI DESCRIPTION GENERATOR
// ============================================================
// NOTE: The old api-inference.huggingface.co endpoint has been deprecated.
// Using the new router.huggingface.co with Together provider + Kimi-K2.6 VLM.
const HF_VLM_URL = 'https://router.huggingface.co/together/v1/chat/completions';
const HF_VLM_MODEL = 'moonshotai/Kimi-K2.6';
const HF_API_KEY = process.env.HUGGING_FACE_API_KEY;

const categoryMap = {
  'book': 'Books',
  'textbook': 'Books',
  'novel': 'Books',
  'phone': 'Electronics',
  'laptop': 'Electronics',
  'computer': 'Electronics',
  'headphone': 'Electronics',
  'speaker': 'Electronics',
  'tablet': 'Electronics',
  'camera': 'Electronics',
  'earphone': 'Electronics',
  'earbuds': 'Electronics',
  'charger': 'Electronics',
  'keyboard': 'Electronics',
  'mouse': 'Electronics',
  'monitor': 'Electronics',
  'shirt': 'Clothing',
  'pants': 'Clothing',
  'dress': 'Clothing',
  'jacket': 'Clothing',
  'shoe': 'Clothing',
  'uniform': 'Clothing',
  'hoodie': 'Clothing',
  'bed': 'Hostel',
  'chair': 'Hostel',
  'desk': 'Hostel',
  'lamp': 'Hostel',
  'table': 'Hostel',
  'bedsheet': 'Hostel',
  'pillow': 'Hostel',
  'mattress': 'Hostel',
  'ball': 'Sports',
  'racket': 'Sports',
  'bat': 'Sports',
  'yoga': 'Sports',
  'cricket': 'Sports',
  'football': 'Sports',
  'badminton': 'Sports',
  'notebook': 'Stationery',
  'pen': 'Lab',
  'microscope': 'Lab',
  'calculator': 'Lab',
  'compass': 'Lab',
};

const detectCategory = (description) => {
  const lower = description.toLowerCase();
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
        msg: 'AI service not configured. Please add HUGGING_FACE_API_KEY to environment.',
        fallback: true
      });
    }

    // Call the VLM via OpenAI-compatible chat completions API
    // The base64 data URL is passed directly as an image_url in the message
    const response = await axios.post(
      HF_VLM_URL,
      {
        model: HF_VLM_MODEL,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'You are a helpful assistant for a campus marketplace called CampusCart. Describe this product image in 1-2 concise sentences suitable for a product listing. Focus on the item type, color, condition, and key features. Be direct and practical — no flowery language. Do not include any reasoning or thinking.'
              },
              {
                type: 'image_url',
                image_url: { url: imageUrl }
              }
            ]
          }
        ],
        max_tokens: 300
      },
      { 
        headers: { 
          'Authorization': `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    );

    const choice = response.data?.choices?.[0]?.message;
    const aiDescription = (choice?.content || '').trim() || 'A product image';
    const suggestedCategory = detectCategory(aiDescription);

    res.json({
      description: aiDescription,
      category: suggestedCategory,
      confidence: 'high'
    });

  } catch (err) {
    console.error('generateDescription error:', err.response?.data || err.message);
    
    // Check if model is loading (common with free HF API)
    if (err.response?.status === 503) {
      return res.status(503).json({ 
        msg: 'AI model is loading, please try again in ~20 seconds.',
        error: 'Model loading',
        fallback: true
      });
    }

    // Graceful fallback
    res.status(500).json({ 
      msg: 'AI generation failed',
      error: err.response?.data?.error?.message || err.response?.data?.error || err.message,
      fallback: true
    });
  }
};