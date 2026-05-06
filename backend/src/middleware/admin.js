const admin = (req, res, next) => {
    // For now, admin is any user with id = 1 (first registered user)
    // Later replace with a proper role column
    if (req.user.id !== 1) {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};

module.exports = admin;