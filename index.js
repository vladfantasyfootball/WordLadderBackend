import dotenv from 'dotenv'
dotenv.config();
import express from 'express';
import { router } from './routes/routes.js';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';

const mongoString = process.env.DATABASE_URL;
mongoose.connect(mongoString, { useNewUrlParser: true, useUnifiedTopology: true });
const database = mongoose.connection;

database.on('error', (error) => {
    console.log(error)
})

database.once('connected', () => {
    console.log('Database Connected');
})

const app = express();

// Trust proxy — required behind Cloud Run / load balancer
app.set('trust proxy', 1);

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
app.use(helmet());
app.use(mongoSanitize());

// Apply rate limiter to all API routes
app.use('/api', limiter);

app.use(express.json());

// ── Smart share redirect ──────────────────────────────────────────────────────
// When the app is installed, iOS/Android intercepts this URL and opens the app
// directly (via Universal Links / App Links) before the browser ever loads.
// When the app is NOT installed, the browser hits this route and is redirected
// to the correct store for the user's platform.
app.get('/share', (req, res) => {
    const ua = req.headers['user-agent'] || '';
    if (/android/i.test(ua)) {
        return res.redirect('https://play.google.com/store/apps/details?id=com.vlad.wordLadderAndroid');
    }
    // iOS / default — update to App Store URL once app is live
    return res.redirect('https://testflight.apple.com/join/JxNSA5rZ');
});

// ── iOS Universal Links verification ─────────────────────────────────────────
// Apple fetches this file to confirm the domain is allowed to open the app.
// Serves for both the custom domain and the legacy Cloud Run URL.
app.get('/.well-known/apple-app-site-association', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json({
        applinks: {
            apps: [],
            details: [
                {
                    appID: 'CZ654D22GF.com.vlad.wordLadder',
                    paths: ['/share']
                }
            ]
        }
    });
});

// ── Android App Links verification ───────────────────────────────────────────
// Android fetches this file to confirm the domain is allowed to open the app.
app.get('/.well-known/assetlinks.json', (req, res) => {
    res.json([
        {
            relation: ['delegate_permission/common.handle_all_urls'],
            target: {
                namespace: 'android_app',
                package_name: 'com.vlad.wordLadderAndroid',
                sha256_cert_fingerprints: [
                    'CF:66:92:F8:36:FA:71:88:74:43:CC:7E:0F:3D:6E:22:A9:54:0D:84:3B:E3:AA:6F:F5:EE:7F:10:F4:AA:A8:2B'
                ]
            }
        }
    ]);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server Started at ${PORT}`)
})

app.use('/api', router)
