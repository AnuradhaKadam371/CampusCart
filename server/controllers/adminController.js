const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Report = require('../models/Report');

exports.getDashboardStats = async (req, res) => {
    try {
        const [totalUsers, totalProducts, totalOrders, openReports] = await Promise.all([
            User.countDocuments({ isAdmin: false }),
            Product.countDocuments({}),
            Order.countDocuments({}),
            Report.countDocuments({ status: "open" })
        ]);

        res.json({ totalUsers, totalProducts, totalOrders, openReports });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.aggregate([
            {
                $match: { isAdmin:false }
            },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: 'sellerId',
                    as: 'products'
                }
            },
            {
                $addFields: {
                    productCount: { $size: "$products" }
                }
            },
            {
                $project: {
                    products: 0,
                    password: 0
                }
            }
        ]);

        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getAllProducts = async (req, res) => {
    try {
        const products = await Product.find({}).populate('sellerId', 'name email');
        res.json(products);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({})
            .populate('buyerId', 'name email')
            .populate('sellerId', 'name email')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.blockUnblockUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });
        if (user.isAdmin) return res.status(400).json({ msg: 'Cannot block admin user' });

        user.isBlocked = !user.isBlocked;
        await user.save();

        res.json({ msg: user.isBlocked ? 'User blocked' : 'User unblocked', isBlocked: user.isBlocked });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Delete user's products first
        await Product.deleteMany({ sellerId: user._id });
        
        // Delete user
        await User.findByIdAndDelete(req.params.id);

        res.json({ msg: 'User and their products removed' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.status(500).send('Server Error');
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ msg: 'Product not found' });
        }

        await Product.findByIdAndDelete(req.params.id);

        res.json({ msg: 'Product removed' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Product not found' });
        }
        res.status(500).send('Server Error');
    }
};

exports.getReports = async (req, res) => {
    try {
        const reports = await Report.find({})
            .populate('reporterId', 'name email')
            .populate('targetUserId', 'name email isBlocked')
            .populate('targetProductId', 'title category')
            .populate('actionBy', 'name email')
            .sort({ createdAt: -1 });

        res.json(reports);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.updateReportStatus = async (req, res) => {
    try {
        const { status, actionTaken } = req.body;
        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ msg: 'Report not found' });

        if (status) report.status = status;
        if (actionTaken !== undefined) report.actionTaken = actionTaken;
        report.actionBy = req.user.id;
        await report.save();

        res.json({ msg: 'Report updated', report });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
