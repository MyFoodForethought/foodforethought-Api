require("dotenv").config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const bodyParser = require('body-parser');
const { authRouter } = require('../Routes/route');
const { connectDB } = require('../config/db'); // Correctly import the updated connectDB function
const { dropUserCollection } = require('../models/user');
require('../config/passport');
const oauthRouter = require('../Routes/oauth'); // Import OAuth routes

const app = express();

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.raw());
app.use(require("cors")());

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    next();
});

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set secure: true if using HTTPS
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(authRouter);
app.use('/oauth', oauthRouter); // Use OAuth routes

app.get('/', (req, res) => {
    res.send('OAuth authentication successful. You can now use the application.');
});

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await connectDB(); // Ensure the database is connected before starting the server
        // await dropUserCollection() // Uncomment if you need to drop the user collection
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to connect to the database', error);
        process.exit(1); // Exit if the DB connection fails
    }
}

startServer();
