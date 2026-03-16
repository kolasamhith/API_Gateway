const express = require('express');

const app1 = express();
const app2 = express();

app1.get('/users', (req, res) => {
    res.send('Response from User Service on port 8081');
});

app2.get('/products', (req, res) => {
    res.send('Response from Product Service on port 8082');
});

app1.listen(8081, () => {
    console.log('User Service running on port 8081');
});

app2.listen(8082, () => {
    console.log('Product Service running on port 8082');
});