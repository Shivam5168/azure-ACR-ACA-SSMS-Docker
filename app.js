const express = require('express');
require('dotenv').config();
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart'); // Renamed to avoid confusion

const app = express();
const port = 5000;

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Use routes
app.use('/products', productRoutes);
app.use('/cart', cartRoutes); // Use cart routes on /cart endpoint

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
