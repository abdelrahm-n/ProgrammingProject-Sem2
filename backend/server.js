const express = require('express');
const app = express();
const PORT = 3000;

//hello world
app.get('/', (req, res) => {
    res.send('Hello World');
});
//naar andere input
app.get('/backend', (req, res) => {
    res.send('Welcome to the backend!');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});