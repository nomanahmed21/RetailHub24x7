import mongoose from 'mongoose';

const saleSchema = new mongoose.Schema({
  saleDetails: [
    {
      name: String,
      number: Number,
      price: Number,
      quantity: Number,
      total: Number,
    },
  ],
  totalAmount: Number,
  date: { type: Date, default: Date.now },
  orderId: { type: String, required: true }, // Unique order ID for the sale
  billNumber: { type: Number, required: true }, // Incremental bill number
});

const Sale = mongoose.model('Sale', saleSchema);

export default Sale;

