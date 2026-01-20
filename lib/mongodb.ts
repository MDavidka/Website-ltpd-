import { MongoClient } from "mongodb"

if (!process.env.MONGO_URI) {
  throw new Error("MONGO_URI environment variable is not defined")
}

const uri = process.env.MONGO_URI
const options = {
  compressors: [] as string[],
}

let client: MongoClient
let clientPromise: Promise<MongoClient>

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options)
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise
} else {
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

export default clientPromise
