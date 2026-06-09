const express = require('express');
const app = express();
const PORT = 3000;

//hello world
app.get('/', (req, res) => {
    res.send('Hello World, this is me');
});
//naar andere input
app.get('/backend', (req, res) => {
    res.send('Hello welkom bij dit ofzo to the backend!');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});