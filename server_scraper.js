const express = require('express');
const path = require('path');
const app = express();

// Tell Express to serve everything in the 'public' folder (your HTML, CSS, and jobs.json)
app.use(express.static('__dirname'));

app.listen(3000, () => {
    console.log('Search engine is live at http://localhost:3000');
});