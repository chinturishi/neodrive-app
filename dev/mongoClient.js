import { MongoClient } from "mongodb";

const uri = "mongodb://localhost:27017";

const client = new MongoClient(uri);

await client.connect();

const db = client.db();
console.log(db.namespace);

// const db = client.db("expense_db");

// const collection = db.collection("expenses");

// const result = await collection.find({}).toArray();

// console.log(result);
