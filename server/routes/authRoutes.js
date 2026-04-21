const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  toggleWishlist
} = require('../controllers/authController');

const auth = require('../middleware/auth');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');

// ==========================
// Multer Memory Storage (IMPORTANT)
// ==========================
const storage = multer.memoryStorage();

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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter
});

// ==========================
// Routes
// ==========================
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', auth, getUserProfile);
router.get('/me', auth, getUserProfile);
router.put('/profile', auth, updateUserProfile);

// ==========================
// Avatar Upload (CLOUDINARY FIXED)
// ==========================
router.put('/profile/avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'Please upload an image' });
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'campuscart/avatars' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    const User = require('../models/User');

    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: result.secure_url }, // ✅ STORE CLOUDINARY URL
      { new: true }
    ).select('-password');

    res.json(updated);

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// Wishlist
router.post('/wishlist/:productId', auth, toggleWishlist);

module.exports = router;