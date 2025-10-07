// middlewares/debugMiddleware.js
const debugMulter = (req, res, next) => {
    console.log('=== DEBUG MULTER ===');
    console.log('Headers:', req.headers);
    console.log('Files:', req.files);
    console.log('Body:', req.body);
    console.log('=== FIM DEBUG ===');
    next();
};

module.exports = debugMulter;