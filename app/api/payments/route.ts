import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { getInitialData, type AppData } from "@/lib/types"

const DB_NAME = "netflix_tracker"
const COLLECTION_NAME = "payments"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection(COLLECTION_NAME)
    
    const doc = await collection.findOne({ _id: "main" })
    
    if (!doc) {
      const defaultData = getInitialData()
      await collection.insertOne({ _id: "main" as unknown as string, ...defaultData })
      return NextResponse.json(defaultData)
    }
    
    const data: AppData = {
      payments: doc.payments || getInitialData().payments,
      totalAmount: doc.totalAmount ?? 0,
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error("MongoDB GET error:", error)
    return NextResponse.json(getInitialData())
  }
}

export async function POST(request: Request) {
  try {
    const body: AppData = await request.json()
    
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection(COLLECTION_NAME)
    
    await collection.updateOne(
      { _id: "main" },
      { 
        $set: { 
          payments: body.payments, 
          totalAmount: body.totalAmount,
        } 
      },
      { upsert: true }
    )
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("MongoDB POST error:", error)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }
}
