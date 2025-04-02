// server/server.js (Using ES Modules, MongoDB, JWT Auth + Middleware)

// === Imports ===
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import authenticateToken from './middleware/authenticateToken.js'; // Import the middleware

// === Configuration & Setup ===
const app = express();
const PORT = process.env.PORT || 3001;
const mongoUri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;
const jwtSecret = process.env.JWT_SECRET;

if (!mongoUri || !dbName || !jwtSecret) {
  console.error("Error: MONGODB_URI, DB_NAME, or JWT_SECRET not found in .env file.");
  process.exit(1);
}

// === Database Connection ===
const client = new MongoClient(mongoUri);
let db; // Database connection reference

async function connectDB() {
  try {
    await client.connect();
    db = client.db(dbName);
    console.log(`Successfully connected to database: ${db.databaseName}`);
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
    await client.close();
    process.exit(1);
  }
}

// === Global Middleware ===
app.use(cors());
app.use(express.json());

// === Routes ===

// --- Health Check Route --- (Does not require authentication)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'Server is running!' });
});

// --- Authentication Routes --- (Do not require authentication)
app.post('/api/auth/register', async (req, res) => {
  // ... (Registration logic as before) ...
  if (!db) { return res.status(500).json({ message: 'Database not connected' }); }
  try {
    const { username, password } = req.body;
    if (!username || !password) { return res.status(400).json({ message: 'Username and password are required.' }); }
    if (password.length < 6) { return res.status(400).json({ message: 'Password must be at least 6 characters long.' }); }
    const usersCollection = db.collection('users');
    const existingUser = await usersCollection.findOne({ username: username });
    if (existingUser) { return res.status(409).json({ message: 'Username already taken.' }); }
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const newUser = { username: username, passwordHash: passwordHash, createdAt: new Date() };
    const result = await usersCollection.insertOne(newUser);
    if (!result.acknowledged || !result.insertedId) { throw new Error('Failed to insert user into database.'); }
    console.log(`User registered: ${username}, ID: ${result.insertedId}`);
    res.status(201).json({ message: 'User registered successfully!' });
  } catch (err) { console.error("Registration error:", err); res.status(500).json({ message: 'Server error during registration.' }); }
});

app.post('/api/auth/login', async (req, res) => {
  // ... (Login logic as before) ...
   if (!db) { return res.status(500).json({ message: 'Database not connected' }); }
  try {
    const { username, password } = req.body;
    if (!username || !password) { return res.status(400).json({ message: 'Username and password are required.' }); }
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ username: username });
    if (!user) { return res.status(401).json({ message: 'Invalid credentials.' }); }
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) { return res.status(401).json({ message: 'Invalid credentials.' }); }
    const payload = { userId: user._id, username: user.username };
    const token = jwt.sign(payload, jwtSecret, { expiresIn: '1h' });
    res.json({ message: 'Login successful!', token: token, username: user.username });
  } catch (err) { console.error("Login error:", err); res.status(500).json({ message: 'Server error during login.' }); }
});


// --- Apply Authentication Middleware to Payment Routes ---
// Any request starting with /api/payments AFTER this line will require a valid token
app.use('/api/payments', authenticateToken); // <<< Apply middleware here


// === Payment Routes (Protected) ===

// GET all payments
app.get('/api/payments', async (req, res) => {
  // req.user is now available here from the middleware
  console.log(`User ${req.user.username} requesting payments.`);
  if (!db) { return res.status(500).json({ message: 'Database not connected' }); }
  try {
    const collection = db.collection('payments');
    // TODO: Later, potentially filter payments based on req.user.userId if needed
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
  console.log(`User ${req.user.username} adding payment.`);
  if (!db) { return res.status(500).json({ message: 'Database not connected' }); }
  try {
    const newPayment = req.body;
    console.log('POST /api/payments - Received body:', newPayment);
    if (!newPayment || typeof newPayment.amount !== 'number' || typeof newPayment.date !== 'string') {
      return res.status(400).json({ message: 'Invalid payment data format.' });
    }
    const documentToInsert = {
      id: Date.now(), date: newPayment.date, amount: newPayment.amount, serverTimestamp: new Date(),
      // TODO: Associate payment with user (e.g., add createdBy: req.user.userId)
    };
    const collection = db.collection('payments');
    const result = await collection.insertOne(documentToInsert);
    if (!result.acknowledged) { throw new Error('Failed to insert payment into database.'); }
    console.log('POST /api/payments - Inserted ID:', result.insertedId);
    res.status(201).json(documentToInsert);
  } catch (err) {
    console.error("Failed to add payment:", err);
    res.status(500).json({ message: 'Failed to add payment' });
  }
});

// PUT (update) a specific payment by its numeric ID
app.put('/api/payments/:id', async (req, res) => {
  console.log(`User ${req.user.username} updating payment ${req.params.id}.`);
  if (!db) { return res.status(500).json({ message: 'Database not connected' }); }
  try {
    const idString = req.params.id;
    const idToUpdate = Number(idString);
    if (isNaN(idToUpdate)) { return res.status(400).json({ message: 'Invalid payment ID format.' }); }
    const updatedData = req.body;
    console.log(`PUT /api/payments/${idToUpdate} - Received body:`, updatedData);
    if (!updatedData || typeof updatedData.amount !== 'number' || typeof updatedData.date !== 'string') {
      return res.status(400).json({ message: 'Invalid updated payment data format (requires date and amount).' });
    }
    const updateDocument = { $set: { date: updatedData.date, amount: updatedData.amount } };
    const collection = db.collection('payments');
    // TODO: Add check later to ensure user is allowed to update this payment (req.user.userId === payment.createdBy?)
    const result = await collection.updateOne({ id: idToUpdate }, updateDocument);
    if (result.matchedCount === 0) { console.log(`PUT /api/payments/${idToUpdate} - Payment not found`); return res.status(404).json({ message: 'Payment not found' }); }
    if (result.modifiedCount >= 0) {
      console.log(`PUT /api/payments/${idToUpdate} - Processed update (Modified: ${result.modifiedCount})`);
      const updatedPayment = await collection.findOne({ id: idToUpdate });
      res.status(200).json(updatedPayment);
    } else { throw new Error('Update result unexpected.'); }
  } catch (err) {
    console.error(`Failed to update payment ${req.params.id}:`, err);
    res.status(500).json({ message: 'Failed to update payment' });
  }
});

// DELETE a specific payment by its numeric ID
app.delete('/api/payments/:id', async (req, res) => {
  console.log(`User ${req.user.username} deleting payment ${req.params.id}.`);
  if (!db) { return res.status(500).json({ message: 'Database not connected' }); }
  try {
    const idString = req.params.id;
    const idToDelete = Number(idString);
    if (isNaN(idToDelete)) { return res.status(400).json({ message: 'Invalid payment ID format.' }); }
    console.log(`DELETE /api/payments/${idToDelete} - Attempting delete`);
    const collection = db.collection('payments');
     // TODO: Add check later to ensure user is allowed to delete this payment (req.user.userId === payment.createdBy?)
    const result = await collection.deleteOne({ id: idToDelete });
    if (result.deletedCount === 1) {
      console.log(`DELETE /api/payments/${idToDelete} - Successfully deleted`);
      res.status(204).send();
    } else {
      console.log(`DELETE /api/payments/${idToDelete} - Payment not found`);
      res.status(404).json({ message: 'Payment not found' });
    }
  } catch (err) {
    console.error(`Failed to delete payment ${req.params.id}:`, err);
    res.status(500).json({ message: 'Failed to delete payment' });
  }
});

// === Start Server ===
async function startServer() {
  await connectDB(); // Wait for DB connection first
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer(); // Run the async function to connect DB and start Express