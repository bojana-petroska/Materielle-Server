const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const materialSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: [
        "Kitchen", 
        "Bathroom", 
        "Wall", 
        "Ceiling", 
        "Flooring", 
        "Roofing", 
        "Insulation", 
        "Other"
    ],
    required: true,
  },
  imageUrl: {
    type: String,
    required: true
  },
  manufacturer: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  sustainabilityFromLeed: {
    type: String,
    enum: [
      "Renewable Materials",
      "Recyclable Materials",
      "Low-Impact Materials",
      "Certified Sustainable Materials",
      "Not Sustainable",
    ],
    default: "Not Sustainable",
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User"
  }
}, { timestamps: true });


module.exports = model("Material", materialSchema);;
