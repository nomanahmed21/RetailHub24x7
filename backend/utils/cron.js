// utils/cron.js
import cron from 'node-cron';
import DailySales from '../models/Sales/DailySales.js';
import MonthlySales from '../models/Sales/MonthlySales.js';

// Schedule to run at midnight every day
cron.schedule('0 0 * * *', async () => {
  const today = new Date();
  const month = today.getMonth() + 1; // Get current month (1-based)
  const year = today.getFullYear();

  try {
    // Get daily sales for the current month
    const dailySales = await DailySales.find({
      date: { $gte: new Date(year, month - 1, 1), $lt: new Date(year, month, 1) }, // Filtering sales for the current month
    });

    const totalSales = dailySales.reduce((total, sale) => total + sale.totalSales, 0); // Sum the daily sales

    // Update the monthly sales or create a new record
    const existingMonthlySale = await MonthlySales.findOne({ month, year });

    if (existingMonthlySale) {
      existingMonthlySale.totalSales += totalSales;
      await existingMonthlySale.save();
    } else {
      const newMonthlySale = new MonthlySales({
        month,
        year,
        totalSales,
      });
      await newMonthlySale.save();
    }
  } catch (error) {
    console.error('Error updating monthly sales:', error.message);
  }
});
