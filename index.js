import dotenv from 'dotenv'
dotenv.config();
import express from 'express';
import { router } from './routes/routes.js';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';

const mongoString = process.env.DATABASE_URL;
console.log(mongoString)
mongoose.connect(mongoString, { useNewUrlParser: true, useUnifiedTopology: true });
const database = mongoose.connection;

database.on('error', (error) => {
    console.log(error)
})

database.once('connected', () => {
    console.log('Database Connected');
})

const app = express();

// Rate limiting middleware
const limiter = rateLimit({
    windowMs: 2 * 60 * 1000, // 2 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

var allowCrossDomain = function(req, res, next) {
    // Allow requests from your mobile app and localhost for development
    const allowedOrigins = [
        'http://localhost:8081',
        'exp://localhost:8081',
        'capacitor://localhost',
        'ionic://localhost'
    ];
    
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin) || !origin) {
        res.header('Access-Control-Allow-Origin', origin || '*');
    }
    
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    next();
};

app.use(allowCrossDomain);

// Apply rate limiter to all API routes
app.use('/api', limiter);

app.use(express.json());

app.listen(3000, () => {
    console.log(`Server Started at ${3000}`)
})

app.use('/api', router)
