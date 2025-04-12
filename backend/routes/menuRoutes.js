import express from 'express';
import Dish from '../models/Dish.js'; // Your Mongoose model for dishes
const router = express.Router();

// POST request to add a new dish to the menu
router.post('/', async (req, res) => {
  const { name, price, number } = req.body;

  if (!name || !price || !number) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Create a new dish document
    const newDish = new Dish({
      name,
      price,
      number
    });

    // Save to the database
    await newDish.save();

    // Return success response
    res.status(201).json({ message: 'Dish added successfully', dish: newDish });
  } catch (error) {
    console.error('Error adding dish:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET request to fetch all dishes
router.get('/', async (req, res) => {
  try {
    const dishes = await Dish.find(); // Fetch all dishes from MongoDB
    res.json(dishes); // Respond with JSON data
  } catch (error) {
    console.error('Error fetching dishes:', error);
    res.status(500).json({ error: 'Server error' });
  }
});




export default router;