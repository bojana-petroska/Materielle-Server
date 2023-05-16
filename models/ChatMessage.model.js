const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const chatMessageSchema = new Schema({
    role: String,
    content: String,
})

module.exports = model("ChatMessage", chatMessageSchema)