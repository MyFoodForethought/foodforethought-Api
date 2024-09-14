require("dotenv").config();
const express = require('express');
const MongoStore = require('connect-mongo');
const session = require('express-session');
const passport = require('passport');
const { authRouter } = require('../Routes/route');
const { connectDB } = require('../config/db');
const {dropUserCollection} = require('../models/user')
require('../config/passport');
const oauthRouter = require('../Routes/oauth');

const app = express();

// Middleware
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(require("cors")());

// CORS headers
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next();
});

// Session setup
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI
    }),
    cookie: { secure: false } // Set secure: true if using HTTPS
}));

// Passport setup
app.use(passport.initialize());
app.use(passport.session());

// Mount routes
app.use('/api', authRouter);  // Mount authRouter under /api
app.use('/oauth', oauthRouter); // Use OAuth routes

// Root route
app.get('/', (req, res) => {
    res.send('OAuth authentication successful. You can now use the application.');
});

// Start the server
const PORT = process.env.PORT || 3000;
async function startServer() {
    try {
        await connectDB();  // Connect to MongoDB
        // await dropUserCollection() // Uncomment if you need to drop the user collection
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to connect to the database', error);
        process.exit(1);  // Exit if DB connection fails
    }
}

startServer();
