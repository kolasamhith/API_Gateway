const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const Redis = require('ioredis');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');

const app = express();

const redisClient = new Redis({ host: process.env.REDIS_HOST || '127.0.0.1' });
const SECRET_KEY = 'my_super_secret_key';

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gatewayLogs')
    .then(() => console.log('Connected to MongoDB for logging'))
    .catch(err => console.error('MongoDB connection error:', err));

const logSchema = new mongoose.Schema({
    endpoint: String,
    user: String,
    time: { type: Date, default: Date.now },
    status: Number,
    ip: String
});
const Log = mongoose.model('Log', logSchema);

app.use(helmet()); 
app.use(express.json({ limit: '10kb' })); 
app.use(mongoSanitize()); 

const apiLimiter = rateLimit({
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    }),
    windowMs: 1000, 
    max: 10, 
    message: 'Too many requests, please try again later.'
});
app.use(apiLimiter);

const requestLogger = (req, res, next) => {
    res.on('finish', () => {
        const logEntry = new Log({
            endpoint: req.originalUrl,
            user: req.user ? req.user.username : 'anonymous',
            status: res.statusCode,
            ip: req.ip
        });
        logEntry.save();
    });
    next();
};

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).send('Access Denied: No Token Provided!');

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).send('Access Denied: Invalid Token!');
        req.user = user;
        next();
    });
};

const requireRole = (role) => {
    return (req, res, next) => {
        if (!req.user || req.user.role !== role) {
            return res.status(403).send('Access Denied: Insufficient Permissions!');
        }
        next();
    };
};

app.post('/auth/login', (req, res) => {
    const { username, role } = req.body;
    if (!username || !role) return res.status(400).send('Username and role required');
    
    const token = jwt.sign({ username, role }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
});

app.use('/orders', authenticateToken, requestLogger, createProxyMiddleware({ 
    target: process.env.ORDER_URL || 'http://localhost:8081/orders',
    changeOrigin: true 
}));

app.use('/products', authenticateToken, requireRole('admin'), requestLogger, createProxyMiddleware({ 
    target: process.env.PRODUCT_URL || 'http://localhost:8082/products',
    changeOrigin: true 
}));

app.listen(3000, () => {
    console.log('Secure API Gateway running on port 3000');
});