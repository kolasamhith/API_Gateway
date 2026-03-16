const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const Redis = require('ioredis');
const jwt = require('jsonwebtoken');

const app = express();
const redisClient = new Redis();
const SECRET_KEY = 'my_super_secret_key';

const apiLimiter = rateLimit({
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    }),
    windowMs: 60 * 1000,
    max: 5,
    message: 'Too many requests, please try again later.'
});

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

app.get('/login', (req, res) => {
    const mockUser = { username: 'testuser' };
    const token = jwt.sign(mockUser, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token: token });
});

app.use(apiLimiter);

app.use('/users', authenticateToken, createProxyMiddleware({ 
    target: 'http://localhost:8081/users',
    changeOrigin: true 
}));

app.use('/products', authenticateToken, createProxyMiddleware({ 
    target: 'http://localhost:8082/products',
    changeOrigin: true 
}));

app.listen(3000, () => {
    console.log('API Gateway running on port 3000');
});