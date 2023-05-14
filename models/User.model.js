const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required.'],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Password is required.']
    },
    username: {
      type: String,
      required: true
    },
    userType: {
        type: String,
        enum: ["Curious individual", "Professional"],
    },
    company: {
        type: String
    },
    interest: {
        type: String,
        enum: ["Exterior", "Interior", "Both"]
    },
    occupation: {
      type: String
    },
    imageUrl: {
      type: String
    },
    agreeToTerms: {
      type: Boolean,
      default: false
    },
    wishList: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Material'
    }],
  },
  {
    // this second object adds extra properties: `createdAt` and `updatedAt`    
    timestamps: true
  }
);

module.exports = model("User", userSchema);;



