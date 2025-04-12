import mongoose from "mongoose";

const dishSchema = new mongoose.Schema({
  number: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  imageUrl: { type: String, required: true }, // Storing image URL/path
});

const Dish = mongoose.model("Dish", dishSchema);

export default Dish;


