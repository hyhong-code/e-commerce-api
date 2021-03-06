const mongoose = require("mongoose");
const Shop = require("../model/Shop");

const ShopItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Title is required for each item"],
    maxlength: [50, "Title must be no more than 50 characters"],
  },
  description: {
    type: String,
    maxlength: [500, "Description must be no more than 50 characters"],
  },
  category: {
    type: String,
    enum: ["clothing", "electronics", "home"],
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  averageItemStar: Number,
  photo: String,
  qtySold: {
    type: Number,
    validate: function (v) {
      return Number.isInteger(v);
    },
    message: "quantity must be of integer",
    required: [true, "Quantity is required"],
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  shop: {
    type: mongoose.Types.ObjectId,
    ref: "Shop",
    required: true,
  },
});

// Calculate average prices across all items of a shop
ShopItemSchema.statics.getAvgPrice = async function (shopId) {
  const result = await this.aggregate([
    { $match: { shop: shopId } },
    { $group: { _id: "$shop", averagePrice: { $avg: "$price" } } },
  ]);
  try {
    await Shop.findByIdAndUpdate(shopId, {
      averagePrice: parseInt(result[0].averagePrice * 10) / 10,
    });
  } catch (error) {
    console.error(error);
  }
};

ShopItemSchema.post("save", async function () {
  await this.constructor.getAvgPrice(this.shop);
});

ShopItemSchema.post("remove", async function () {
  await this.constructor.getAvgPrice(this.shop);
});

module.exports = mongoose.model("ShopItem", ShopItemSchema);
