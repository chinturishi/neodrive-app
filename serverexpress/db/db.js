import { MongoClient } from "mongodb";

const client = new MongoClient("mongodb://localhost:27017/neo_drive_app");

export async function connectDB() {
  await client.connect();
  const db = client.db();
  return db;
}

process.on("SIGINT", async () => {
  await client.close();
  process.exit(0);
});
