const User = require('../models/User');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

exports.registerUser = async (req, res) => {
const { name, email, password, phone, department, year } = req.body;
    if (!name || !email || !password || !phone || !department || !year) {
    return res.status(400).json({
        msg: 'Please provide all required fields'
    });
}

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ msg: 'Please provide a valid email address' });
    }

    if (password.length < 6) {
        return res.status(400).json({ msg: 'Password must be at least 6 characters long' });
    }

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

            user = new User({
            name,
            email,
            password,
            phone,
            department,
            year
            });

        await user.save();

        // ✅ FIX: include isAdmin in token
        const payload = {
            user: {
                id: user.id,
                isAdmin: user.isAdmin
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '5d' },
            (err, token) => {
                if (err) throw err;

                res.json({
                    token,
                    user: {
                            id: user.id,
                            name: user.name,
                            email: user.email,
                            phone: user.phone,
                            department: user.department,
                            year: user.year,
                            isAdmin: user.isAdmin
                        }
                });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};



exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ msg: "Email and password are required" });
    }

    try {
        // Admin login: admin@gmail.com + admin@123
        if (email === 'admin@gmail.com' && password === 'admin@123') {
            let user = await User.findOne({ email: 'admin@gmail.com' });
            if (!user) {
                user = new User({
                    name: 'Admin',
                    email: 'admin@gmail.com',
                    password: 'admin@123',
                    phone: '0000000000',
                    department: 'Computer Engineering',
                    year: 'Final Year',
                    isAdmin: true
                });
                await user.save();
            } else {
                if (!user.isAdmin) {
                    user.isAdmin = true;
                    await user.save();
                }
            }
            const payload = { user: { id: user.id, isAdmin: true } };
            jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5d' }, (err, token) => {
                if (err) return res.status(500).send("Token generation failed");
                return res.json({
                    token,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        phone: user.phone,
                        isAdmin: true
                    }
                });
            });
            return;
        }

        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: "Invalid Credentials" });
        }

        if (user.isBlocked) {
            return res.status(403).json({ msg: "Your account is blocked. Contact admin." });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(400).json({ msg: "Invalid Credentials" });
        }

        // ✅ FIX: include isAdmin in token
        const payload = {
            user: {
                id: user.id,
                isAdmin: user.isAdmin
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: "5d" },
            (err, token) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send("Token generation failed");
                }

                return res.json({
                    token,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        phone: user.phone,
                        isAdmin: user.isAdmin
                    }
                });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
};



exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select('-password')
            .populate('wishlist');

        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};


exports.updateUserProfile = async (req, res) => {
    try {
        const { name, email, phone,department,year } = req.body;

        const fields = {};
        if (name !== undefined) fields.name = name;
        if (email !== undefined) fields.email = email;
        if (phone !== undefined) fields.phone = phone;
        if(department!== undefined) fields.department=department;
        if(year!==undefined) fields.year=year;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: fields },
            { new: true, runValidators: true }
        ).select('-password');

        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};


exports.toggleWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const productId = req.params.productId;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ msg: 'Invalid product id' });
        }

        const user = await User.findById(userId);

        const has = user.wishlist.some(id => id.toString() === productId);

        if (has) {
            user.wishlist.pull(productId);
        } else {
            user.wishlist.addToSet(productId);
        }

        await user.save();

        const updated = await User.findById(userId)
            .select('-password')
            .populate('wishlist');

        res.json(updated.wishlist);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};