import mongoose, { Schema, model, models } from "mongoose"

// মিডিয়া আইটেম স্কিমা
const MediaSchema = new Schema(
  {
    title: { type: String, required: true },
    location: { type: String, default: "Unknown Location" },
    year: { type: Number, default: () => new Date().getFullYear() },
    category: { type: String, default: "" }, // খালি থাকলে "All" এ দেখাবে
    type: { type: String, enum: ["photo", "video", "gif"], default: "photo" },
    src: { type: String, required: true },
    ratio: { type: Number, default: 0.75 },
    telegramFileId: { type: String, required: true, unique: true },
    telegramFilePath: { type: String, default: "" },
  },
  { timestamps: true }
)

// ক্যাটাগরি স্কিমা
const CategorySchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
  },
  { timestamps: true }
)

export const MediaModel = models.Media || model("Media", MediaSchema)
export const CategoryModel = models.Category || model("Category", CategorySchema)
