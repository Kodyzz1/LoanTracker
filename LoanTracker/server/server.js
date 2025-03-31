// server/server.js (Using ES Modules and MongoDB)

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb'; // Import the MongoClient

const app = express();
const PORT = process.env.PORT || 3001;
const mongoUri = process.env.MONGODB_URI; // Get URI from .env
const dbName = process.env.DB_NAME; // Get DB Name from .env

if (!mongoUri || !dbName) {
  console.error("Error: MONGODB_URI or DB_NAME not found in .env file.");
  process.exit(1); // Stop the server if config is missing
}

// Create a new MongoClient instance
const client = new MongoClient(mongoUri);
let db; // Variable to hold the database connection reference

// Function to connect to the database
async function connectDB() {
  try {
    await client.connect(); // Connect the client to the server
    db = client.db(dbName); // Get the database object
    console.log(`Successfully connected to database: ${db.databaseName}`);
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
    await client.close(); // Ensure client is closed on connection error
    process.exit(1); // Stop the server if DB connection fails
  }
}

// === Middleware ===
app.use(cors());
app.use(express.json());

// === Routes ===

// Health Check Route
app.get('/api/health', (_req, res) => {
  res.json({ status: 'Server is running!' });
});

// --- Payment Routes ---

// GET all payments
app.get('/api/payments', async (_req, res) => {
  if (!db) {
    return res.status(500).json({ message: 'Database not connected' });
  }
  try {
    const collection = db.collection('payments');
    // Find all documents, sort by serverTimestamp descending (newest first)
    const payments = await collection.find({}).sort({ serverTimestamp: -1 }).toArray();
    console.log('GET /api/payments - Returning count:', payments.length);
    res.json(payments);
  } catch (err) {
    console.error("Failed to fetch payments:", err);
    res.status(500).json({ message: 'Failed to fetch payments' });
  }
});

// POST a new payment
app.post('/api/payments', async (req, res) => {
  if (!db) {
    return res.status(500).json({ message: 'Database not connected' });
  }
  try {
    const newPayment = req.body;
    console.log('POST /api/payments - Received body:', newPayment);

    // Basic validation
    if (!newPayment || typeof newPayment.amount !== 'number' || typeof newPayment.date !== 'string') {
      return res.status(400).json({ message: 'Invalid payment data format.' });
    }

    // Prepare document for insertion (using server ID and timestamp)
    const documentToInsert = {
      // MongoDB will automatically add a unique '_id' field
      // We'll keep our numeric 'id' for now for frontend consistency
      id: Date.now(),
      date: newPayment.date,
      amount: newPayment.amount,
      serverTimestamp: new Date() // Store as native BSON Date
    };

    const collection = db.collection('payments');
    const result = await collection.insertOne(documentToInsert);

    if (!result.acknowledged) {
         throw new Error('Failed to insert payment into database.');
    }

    console.log('POST /api/payments - Inserted ID:', result.insertedId);
    // Send back the document we created (which includes our 'id' field)
    res.status(201).json(documentToInsert);

  } catch (err) {
    console.error("Failed to add payment:", err);
    res.status(500).json({ message: 'Failed to add payment' });
  }
});


// === Start Server ===
async function startServer() {
  await connectDB(); // Wait for DB connection first
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

// DELETE a specific payment by its numeric ID
app.delete('/api/payments/:id', async (req, res) => {
    if (!db) {
      return res.status(500).json({ message: 'Database not connected' });
    }
    try {
      // Get the ID from the URL parameter - it will be a string
      const idString = req.params.id;
      // Convert the ID to a number to match the type stored in the DB
      // (since we used Date.now() which is numeric)
      const idToDelete = Number(idString);
  
      // Validate if conversion worked (check for NaN - Not a Number)
      if (isNaN(idToDelete)) {
          return res.status(400).json({ message: 'Invalid payment ID format.' });
      }
  
      console.log(`DELETE /api/payments/${idToDelete} - Attempting delete`);
  
      const collection = db.collection('payments');
      // Find the document with the matching numeric 'id' field and delete it
      const result = await collection.deleteOne({ id: idToDelete });
  
      if (result.deletedCount === 1) {
        console.log(`DELETE /api/payments/${idToDelete} - Successfully deleted`);
        // Send success status - 204 No Content is common for successful DELETE
        res.status(204).send();
      } else {
        // If deletedCount is 0, the payment with that ID wasn't found
        console.log(`DELETE /api/payments/${idToDelete} - Payment not found`);
        res.status(404).json({ message: 'Payment not found' });
      }
    } catch (err) {
      console.error(`Failed to delete payment ${req.params.id}:`, err);
      res.status(500).json({ message: 'Failed to delete payment' });
    }
  });

startServer(); // Run the async function to connect DB and start Express

// Optional: Graceful shutdown (close DB connection when server stops)
// process.on('SIGINT', async () => {
//   console.log("Closing MongoDB connection...");
//   await client.close();
//   process.exit(0);
// });