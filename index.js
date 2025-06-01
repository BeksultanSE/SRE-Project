const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const transactionRoutes = require('./routes/transactionRoutes');
const pageRoutes = require("./routes/pageRoutes");
const authRoutes = require("./routes/authRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const cookieParser = require("cookie-parser");
const path = require('path');
const rateLimit = require('express-rate-limit');

require("dotenv").config();

const MongoDbCollection_CONNECTION_URL = process.env.MongoDbCollection_CONNECTION_URL;
const PORT = process.env.PORT;
const API_URL = process.env.API_URL;

const app = express();

// Global Rate Limiter: 100 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false
});

// Apply global rate limiter to all routes
app.use(globalLimiter);
// Middleware to parse JSON bodies
app.use(bodyParser.json());
app.use(cookieParser());
// Middleware to serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection
mongoose.connect(MongoDbCollection_CONNECTION_URL)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Routes
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes)
app.use('/', pageRoutes);
app.use('/api/auth', authRoutes);

// Health Check Endpoint
app.get('/health', async (req, res) => {
  try {
    // Check MongoDB connection status
    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB not connected');
    }
    res.status(200).json({ status: 'OK', message: 'App and MongoDB are healthy' });
  } catch (error) {
    console.error('Health check failed:', error.message);
    res.status(500).json({ status: 'Error', message: error.message });
  }
});

// Error Handling
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', 'notFound.html'));
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on ${API_URL}`);
  });
}

module.exports = app;