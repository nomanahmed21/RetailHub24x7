import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import connectDB from './db.js';
import './utils/cron.js';
import Dish from './models/Dish.js';  // Assuming this is the correct path to your Dish model
import Sale from './models/Sales/Sales.js'; // Adjust the path as needed

import DailySales from './models/Sales/DailySales.js';  // Daily sales model
import MonthlySales from './models/Sales/MonthlySales.js';  // Monthly sales model
// Configure Multer for image uploads


// Ensure 'public/uploads' folder exists
const uploadDir = 'public/uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Save images in 'public/uploads'
  },
  filename: (req, file, cb) => {
    const dishNumber = req.body.number; // Get dish number from request
    if (!dishNumber) {
      return cb(new Error("Dish number is required before uploading an image."), null);
    }

    const fileExt = path.extname(file.originalname); // Get file extension
    let fileName = `${dishNumber}${fileExt}`;
    let filePath = path.join(uploadDir, fileName);

    // Check if the file already exists and modify the name if necessary
    let counter = 1;
    while (fs.existsSync(filePath)) {
      fileName = `${dishNumber}_${counter}${fileExt}`;
      filePath = path.join(uploadDir, fileName);
      counter++;
    }

    cb(null, fileName); // Save image with unique name if conflict exists
  },
});

const upload = multer({ storage });

export default upload;



const app = express();
const PORT = 5000;

// Middleware
app.use(express.json());  // Parse JSON requests
app.use(express.static('frontend')); 
app.use("/uploads", express.static("public/uploads"));
 // Serve static files from the 'frontend' directory

// MongoDB Connection
connectDB();

// Routes

// Get all dishes in the menu
app.get('/api/menu', async (req, res) => {
  try {
    const menu = await Dish.find(); // Fetch all dishes
    res.json(menu);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch menu" });
  }
});

app.get("/api/categories", async (req, res) => {
  try {
    const categories = await Dish.distinct("category"); // Fetch unique categories
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// Add a new dish to the menu
app.post('/add-dish', upload.single('image'), async (req, res) => {
  const { number, name, price, category } = req.body;

  if (!number || !name || !price || !category || !req.file) {
    return res.status(400).json({ message: "All fields, including an image, are required." });
  }

  const imageUrl = `/uploads/${req.file.filename}`; // Path to image

  console.log("🔹 Image saved at:", imageUrl); // Debugging log
  console.log("🔹 Request body:", req.body); // Debugging log

  try {
    const newDish = new Dish({
      number,
      name,
      price,
      category,
      imageUrl, // Ensure this is being assigned
    });

    await newDish.save();
    console.log("✅ Dish saved:", newDish); // Debugging log

    res.status(201).json(newDish);
  } catch (error) {
    console.error("❌ Error saving dish:", error); // Debugging log
    res.status(500).json({ message: "Failed to add dish", error: error.stack });
  }
});


app.delete('/api/menu/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const dish = await Dish.findByIdAndDelete(id);
    if (!dish) {
      return res.status(404).json({ message: 'Dish not found' });
    }

    // Define upload directory
    const uploadDir = path.join('public', 'uploads');

    // Find and delete image file (assuming dish number is used as filename)
    const files = fs.readdirSync(uploadDir);
    files.forEach((file) => {
      if (file.startsWith(dish.number)) {  // Check if file starts with dish number
        const filePath = path.join(uploadDir, file);
        fs.unlinkSync(filePath); // Delete file
        console.log(`Deleted image: ${filePath}`);
      }
    });

    res.status(200).json({ message: 'Dish and image deleted successfully' });

  } catch (error) {
    res.status(500).json({ message: 'Failed to delete dish', error: error.stack });
  }
});



// Get all sales data (using DailySales and MonthlySales models)
app.get('/get-sales', async (req, res) => {
  try {
    // Aggregate the daily sales if there are multiple entries for the same day
    const dailySales = await DailySales.find({}, { date: 1, totalSales: 1 });

    // Aggregating sales by date
    const aggregatedDailySales = dailySales.reduce((acc, sale) => {
      const dateKey = sale.date; // Using the date as the key (DD/MM/YYYY)
      if (!acc[dateKey]) {
        acc[dateKey] = { date: dateKey, totalSales: 0 };
      }
      acc[dateKey].totalSales += sale.totalSales; // Aggregate sales for the same day
      return acc;
    }, {});

    const dailySalesArray = Object.values(aggregatedDailySales); 

    // Fetch monthly sales data
    const monthlySales = await MonthlySales.find({}, { month: 1, year: 1, totalSales: 1 });

    // Send the aggregated daily sales and monthly sales as the response
    res.status(200).json({
      dailySales: dailySalesArray, // Return aggregated daily sales
      monthlySales,                // Return monthly sales data
    });
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
});





app.post('/add-sale', async (req, res) => {
  try {
    const { orderId, billNumber, saleDetails, totalAmount, date } = req.body;

    console.log('Received Sale Data:', req.body);  // Log the incoming sale data

    const sale = new Sale({
      orderId,
      billNumber,
      saleDetails,
      totalAmount,
      date,
    });

    await sale.save();
    console.log('Sale saved successfully:', sale);  // Log sale after saving
    res.status(200).json({ message: 'Sale added successfully', sale });
  } catch (error) {
    console.error('Error adding sale:', error); // Log detailed error message
    res.status(500).json({ error: 'Failed to add sale', details: error.message });
  }
});



app.get('/generate-bill-number', async (req, res) => {
  try {
    // Find the last sale to get the latest bill number
    const lastSale = await Sale.findOne().sort({ billNumber: -1 }); // Sort by descending bill number
    const lastBillNumber = lastSale ? lastSale.billNumber : 0; // If no record, start from 0
    const nextBillNumber = lastBillNumber + 1; // Increment the last bill number
    res.json({ billNumber: nextBillNumber }); // Send the next bill number
  } catch (error) {
    console.error('Error fetching bill number:', error);
    res.status(500).json({ error: 'Failed to fetch bill number'});
  }
});




// POST endpoint to save daily sale
app.post('/add-daily-sales', async (req, res) => {
  const { date, totalSales } = req.body;

  try {
    // Find the daily sales entry for that date
    const existingSale = await DailySales.findOne({ date });

    if (existingSale) {
      // If an entry exists for that date, update the total sales
      existingSale.totalSales += totalSales;
      await existingSale.save();
      res.status(200).json({ message: 'Daily sales updated successfully', existingSale });
    } else {
      // If no entry exists, create a new one for that date
      const newSale = new DailySales({ date, totalSales });
      await newSale.save();
      res.status(201).json({ message: 'Daily sales added successfully', newSale });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to add daily sales', message: error.message });
  }
});








// POST endpoint to add monthly sales
app.post('/add-monthly-sales', async (req, res) => {
  const { month, year, totalSales } = req.body;

  try {
    const existingMonthlySale = await MonthlySales.findOne({ month, year });

    if (existingMonthlySale) {
      // Update the monthly sales total
      existingMonthlySale.totalSales += totalSales;
      await existingMonthlySale.save();
      res.status(200).json({ message: 'Monthly sales updated successfully', existingMonthlySale });
    } else {
      // Create new monthly sales if not exist
      const newMonthSale = new MonthlySales({
        month,
        year,
        totalSales,
      });
      await newMonthSale.save();
      res.status(201).json({ message: 'Monthly sales added successfully', newMonthSale });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to add monthly sales', message: error.message });
  }
});

// POST to clear sales history (with password authentication)
app.post('/clear-sales', async (req, res) => {
  const { password } = req.body;
  const adminPassword = 'yourpassword';

  if (password !== adminPassword) {
    return res.status(401).json({ error: 'Incorrect password' });
  }

  try {
    await DailySales.deleteMany({});
    await MonthlySales.deleteMany({});
    res.json({ message: 'Sales history cleared successfully!' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear sales history.' });
  }
});
app.delete('/clear-daily-sales', async (req, res) => {
  const password = req.body.password;
  if (password === 'd123') {
    try {
      await DailySales.deleteMany({}); // Clear all daily sales
      res.status(200).json({ message: 'Daily sales cleared successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to clear daily sales' });
    }
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

// Endpoint to clear monthly sales
app.delete('/clear-monthly-sales', async (req, res) => {
  const password = req.body.password;
  if (password === 'm123') {
    try {
      await MonthlySales.deleteMany({}); // Clear all monthly sales
      res.status(200).json({ message: 'Monthly sales cleared successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to clear monthly sales' });
    }
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});
app.get('/get-bill', async (req, res) => {
  const { orderId, billNumber } = req.query;

  // Check if either orderId or billNumber is provided
  if (!orderId && !billNumber) {
      return res.status(400).send({ message: 'Order ID or Bill Number is required.' });
  }

  try {
      // Query MongoDB to find the bill by orderId or billNumber
      let query = {};
      if (orderId) query.orderId = orderId;
      if (billNumber) query.billNumber = billNumber;

      const bill = await Sale.findOne(query); // Assuming 'Sale' is the model name

      if (!bill) {
          return res.status(404).send({ message: 'Bill not found.' });
      }

      return res.status(200).send({ success: true, bill });
  } catch (error) {
      console.error('Error fetching bill:', error);
      return res.status(500).send({ message: 'Server error while fetching the bill.' });
  }
});

// Serve the frontend (index.html)
app.get('*', (req, res) => {
  res.sendFile(path.resolve('frontend', 'index.html'));  // Serve the index.html file
});

// Start Server
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
