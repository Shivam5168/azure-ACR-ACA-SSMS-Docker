// routes/cart.js
const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../config/db');


// Route to add a product to the cart
router.post('/add', async (req, res) => {
  const { product_id, quantity } = req.body;

  if (!product_id || !quantity) {
    return res.status(400).send('Product ID and quantity are required');
  }

  try {
    const pool = await poolPromise;
    const query = `
      IF EXISTS (SELECT 1 FROM cart WHERE product_id = @product_id)
      BEGIN
        UPDATE cart SET quantity = quantity + @quantity WHERE product_id = @product_id;
      END
      ELSE
      BEGIN
        INSERT INTO cart (product_id, quantity) VALUES (@product_id, @quantity);
      END
    `;
    await pool.request()
      .input('product_id', sql.Int, product_id)
      .input('quantity', sql.Int, quantity)
      .query(query);

    res.status(201).json({
      message: 'Product added to cart successfully',
    });
  } catch (err) {
    console.error('Error adding product to cart:', err.stack);
    res.status(500).send('Error adding product to cart');
  }
});

// Route to get all products in the cart by product ID
router.get('/getById/:product_id', async (req, res) => {
  const { product_id } = req.params;

  if (!product_id) {
    return res.status(400).send('Product ID is required');
  }

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('product_id', sql.Int, product_id)
      .query(`
        SELECT p.*, c.quantity 
        FROM cart c
        JOIN product p ON c.product_id = p.id
        WHERE c.product_id = @product_id
      `);

    if (result.recordset.length === 0) {
      res.status(404).send('No product found in the cart for the given product ID');
    } else {
      res.json(result.recordset[0]); // Sending only the first result (if multiple rows are not expected)
    }
  } catch (err) {
    console.error('Error fetching cart items:', err.stack);
    res.status(500).send('Error fetching cart items');
  }
});

// Route to get all items in the cart
router.get('/getAllItem', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT p.*, c.quantity 
      FROM cart c
      JOIN product p ON c.product_id = p.id
    `);

    if (result.recordset.length === 0) {
      res.status(404).send('Cart is empty, no products found');
    } else {
      res.json(result.recordset); // Send all products and quantities
    }
  } catch (err) {
    console.error('Error fetching cart items:', err.stack);
    res.status(500).send('Error fetching cart items');
  }
});

// Route to delete a product from the cart
router.delete('/cart/delete/:product_id', async (req, res) => {
  const { product_id } = req.params;

  if (!product_id) {
    return res.status(400).send('Product ID is required');
  }

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('product_id', sql.Int, product_id)
      .query('DELETE FROM cart WHERE product_id = @product_id');

    if (result.rowsAffected[0] === 0) {
      res.status(404).send('Product not found in the cart');
    } else {
      res.status(200).json({ message: 'Product removed from cart successfully' });
    }
  } catch (err) {
    console.error('Error deleting product from cart:', err.stack);
    res.status(500).send('Error deleting product from cart');
  }
});

// Route to update the quantity of a product in the cart
router.patch('/cart/quantity/:product_id', async (req, res) => {
  const { product_id } = req.params;
  const { quantity } = req.body;

  if (typeof quantity !== 'number' || quantity <= 0) {
    return res.status(400).send('Quantity must be a positive number');
  }

  try {
    const pool = await poolPromise;
    const query = `
      IF EXISTS (SELECT 1 FROM cart WHERE product_id = @product_id)
      BEGIN
        UPDATE cart SET quantity = @quantity WHERE product_id = @product_id;
      END
      ELSE
      BEGIN
        INSERT INTO cart (product_id, quantity) VALUES (@product_id, @quantity);
      END
    `;
    await pool.request()
      .input('product_id', sql.Int, product_id)
      .input('quantity', sql.Int, quantity)
      .query(query);

    res.status(200).json({
      message: 'Cart updated successfully',
    });
  } catch (err) {
    console.error('Error updating quantity in cart:', err.stack);
    res.status(500).send('Error updating quantity in cart');
  }
});

// Route to get the total number of items in the cart
// Route to get the total number of items in the cart and the total price
router.get('/totalQuantity', async (req, res) => {
  try {
    const pool = await poolPromise;
    
    // Query to calculate the total number of items and the total price
    const result = await pool.request().query(`
      SELECT 
        SUM(c.quantity) AS total_items,
        SUM(c.quantity * p.item_price) AS total_price
      FROM cart c
      JOIN product p ON c.product_id = p.id
    `);

    // Check if the result is empty (cart is empty)
    if (result.recordset.length === 0 || result.recordset[0].total_items === null) {
      return res.status(404).send('Cart is empty');
    }

    // Return the total number of items and total price
    res.status(200).json({
      total_items: result.recordset[0].total_items,
      total_price: result.recordset[0].total_price,
    });
  } catch (err) {
    console.error('Error fetching total items and price:', err.stack);
    res.status(500).send('Error fetching total items and price');
  }
});

router.get('/summary', async (req, res) => {
  try {
    const pool = await poolPromise;
    
    // Query to get all items in the cart
    const itemsResult = await pool.request().query(`
      SELECT p.*, c.quantity 
      FROM cart c
      JOIN product p ON c.product_id = p.id
    `);

    // Query to calculate the total number of items and the total price
    const totalResult = await pool.request().query(`
      SELECT 
        SUM(c.quantity) AS total_items,
        SUM(c.quantity * p.item_price) AS total_price
      FROM cart c
      JOIN product p ON c.product_id = p.id
    `);

    // Check if the cart is empty
    if (itemsResult.recordset.length === 0) {
      return res.status(404).send('Cart is empty, no products found');
    }

    // Check if the result for totals is empty
    if (totalResult.recordset.length === 0 || totalResult.recordset[0].total_items === null) {
      return res.status(404).send('Cart is empty');
    }

    // Combine the results and send the response
    res.status(200).json({
      items: itemsResult.recordset,
      total_items: totalResult.recordset[0].total_items,
      total_price: totalResult.recordset[0].total_price,
    });
  } catch (err) {
    console.error('Error fetching cart summary:', err.stack);
    res.status(500).send('Error fetching cart summary');
  }
});




module.exports = router;
