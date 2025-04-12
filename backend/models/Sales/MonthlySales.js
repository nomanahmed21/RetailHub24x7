// models/MonthlySales.js
import mongoose from 'mongoose';

const MonthlySalesSchema = new mongoose.Schema({
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  totalSales: { type: Number, required: true },
});

const MonthlySales = mongoose.model('MonthlySales', MonthlySalesSchema);

export default MonthlySales;

