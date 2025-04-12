import express from 'express';

const router = express.Router();

let cart = [];

// Get cart items
router.get('/', (req, res) => {
  res.json(cart);
});

// Add item to cart
router.post('/', (req, res) => {
  const { id, name, price, quantity } = req.body;
  const existingItem = cart.find(item => item.id === id);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({ id, name, price, quantity });
  }

  res.status(201).json(cart);
});

// Remove item from cart
router.delete('/:id', (req, res) => {
  const id = req.params.id;
  cart = cart.filter(item => item.id !== id);
  res.json(cart);
});

// Clear cart
router.delete('/', (req, res) => {
  cart = [];
  res.status(200).json({ message: 'Cart cleared' });
});

export default router;
