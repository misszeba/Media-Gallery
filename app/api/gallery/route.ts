import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db"
import { MediaModel, CategoryModel } from "@/lib/models"

export const dynamic = "force-dynamic" // সবসময় ফ্রেশ ডেটা দেবে (নো-ক্যাশিং)

export async function GET() {
  try {
    await connectToDatabase()
    
    // ডাটাবেস থেকে সব মিডিয়া এবং ক্যাটাগরি আনা হচ্ছে
    const media = await MediaModel.find().sort({ createdAt: -1 }).lean()
    const categoriesDoc = await CategoryModel.find().sort({ createdAt: 1 }).lean()
    
    const categories = categoriesDoc.map((c: any) => c.name)
    
    // যদি ক্যাটাগরি একদম ফাঁকা থাকে, তবে ডিফল্টগুলো পাঠিয়ে দেবে
    const defaultCategories = categories.length > 0 ? categories : ["Landscapes", "Architecture", "Portraits", "Street"]

    return NextResponse.json({
      categories: defaultCategories,
      media: media.map((item: any) => ({
        ...item,
        id: item._id.toString(),
        _id: item._id.toString(),
      }))
    })
  } catch (error) {
    console.error("Failed to fetch gallery data:", error)
    return NextResponse.json({ categories: [], media: [] }, { status: 500 })
  }
}
