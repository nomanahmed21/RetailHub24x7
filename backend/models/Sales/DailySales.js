// models/DailySales.js
import mongoose from 'mongoose';

const DailySalesSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  totalSales: { type: Number, required: true },
});

const DailySales = mongoose.model('DailySales', DailySalesSchema);

export default DailySales;
