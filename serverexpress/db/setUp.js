import { connectDB, client } from "./db.js";

const db = await connectDB();

const command = "callMod";
//const command = "create"

db.command({
  [command]: "users",
  validator: {
    $jsonSchema: {
      required: ["_id", "name", "email", "password", "directoryId"],
      properties: {
        _id: {
          bsonType: "objectId",
        },
        name: {
          bsonType: "string",
          minLength: 3,
          description: "Name must be at least 3 characters long",
        },
        email: {
          bsonType: "string",
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}$",
          description: "Email must be a valid email address",
        },
        password: {
          bsonType: "string",
          minLength: 6,
          description: "Password must be at least 6 characters long",
        },
        directoryId: {
          bsonType: "objectId",
        },
      },
      additionalProperties: false,
    },
  },
  validationLevel: "strict",
  validationAction: "error",
});

db.command({
  [command]: "directories",
  validator: {
    $jsonSchema: {
      required: ["_id", "parentDir", "name", "userId"],
      properties: {
        _id: {
          bsonType: "objectId",
        },
        name: {
          bsonType: "string",
        },
        parentDir: {
          bsonType: ["objectId", "null"],
        },
        userId: {
          bsonType: "objectId",
        },
      },
      additionalProperties: false,
    },
  },
  validationLevel: "strict",
  validationAction: "error",
});

db.command({
  [command]: "files",
  validator: {
    $jsonSchema: {
      required: ["_id", "name", "extension", "directoryId"],
      properties: {
        _id: {
          bsonType: "objectId",
        },
        name: {
          bsonType: "string",
        },
        extension: {
          bsonType: "string",
        },
        directoryId: {
          bsonType: "objectId",
        },
      },
      additionalProperties: false,
    },
  },
  validationLevel: "strict",
  validationAction: "error",
});

client.close();

//callMod
