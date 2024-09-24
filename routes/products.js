const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../config/db');


// Route to get all products
// Route to get all products and the total number of items in the cart
router.get('/', async (req, res) => {
  try {
    const pool = await poolPromise;

    // Query to get all products
    const productResult = await pool.request()
      .query('SELECT * FROM product');

    // Query to get the total number of items in the cart
    const totalItemsResult = await pool.request()
      .query('SELECT SUM(quantity) AS total_items FROM cart');

    // Get total items from the cart
    const totalItems = totalItemsResult.recordset[0]?.total_items || 0;

    // Send combined response
    res.json({
      products: productResult.recordset,
      total_items_in_cart: totalItems
    });
  } catch (err) {
    console.error('Error fetching products or total items:', err.stack);
    res.status(500).send('Error fetching products or total items');
  }
});


// Route to get a product by ID
// routes/product.js
// Route to get a product by ID and the total number of items in the cart
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await poolPromise;

    // Query to get the product by ID
    const productResult = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM product WHERE id = @id');

    // Query to get the total number of items in the cart
    const totalItemsResult = await pool.request()
      .query('SELECT SUM(quantity) AS total_items FROM cart');

    // Check if the product exists
    if (productResult.recordset.length === 0) {
      return res.status(404).send('Product not found');
    }

    // Get total items from the cart
    const totalItems = totalItemsResult.recordset[0]?.total_items || 0;

    // Send combined response
    res.json({
      product: productResult.recordset[0],
      total_items_in_cart: totalItems
    });
  } catch (err) {
    console.error('Error fetching product or total items:', err.stack);
    res.status(500).send('Error fetching product or total items');
  }
});





// Route to add a product
router.post('/add', async (req, res) => {
  const { item_name, item_price, item_description, item_rating, item_image } = req.body;

  // Log the received body for debugging
  console.log('Received body:', req.body);

  // Validate input fields
  if (!item_name || !item_price || !item_description || !item_rating || !item_image) {
    return res.status(400).send('All fields are required');
  }

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('item_name', sql.NVarChar, item_name)
      .input('item_price', sql.Decimal(10, 2), item_price) // Decimal with precision
      .input('item_description', sql.NVarChar, item_description)
      .input('item_rating', sql.Int, item_rating)
      .input('item_image', sql.NVarChar, item_image)
      .query(`
        INSERT INTO product (item_name, item_price, item_description, item_rating, item_image)
        VALUES (@item_name, @item_price, @item_description, @item_rating, @item_image);
        SELECT SCOPE_IDENTITY() AS productId;
      `);

    // Respond with the new product ID
    res.status(201).json({
      message: 'Product added successfully',
      productId: result.recordset[0].productId,
    });
  } catch (err) {
    console.error('Error adding product:', err.stack);
    res.status(500).send('Error adding product');
  }
});

module.exports = router;
