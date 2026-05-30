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

// Serve static files (e.g. OG preview image) from /public
app.use(express.static('public'));

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

// ── Landing page ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
    const ua = req.headers['user-agent'] || '';
    const isAndroid = /android/i.test(ua);
    const storeUrl = isAndroid
        ? 'https://play.google.com/store/apps/details?id=com.vlad.wordLadderAndroid'
        : 'https://apps.apple.com/us/app/word-ladder-puzzle/id6759207300';
    const storeName = isAndroid ? 'Get it on Google Play' : 'Download on the App Store';

    res.setHeader('Content-Type', 'text/html');
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Word Ladder Puzzle</title>

  <meta name="description" content="A free daily word puzzle game. Transform one word into another, one step at a time. Play Word Ladder Puzzle on iOS and Android." />

  <meta property="og:title"       content="Word Ladder Puzzle" />
  <meta property="og:description" content="A free daily word puzzle game. Transform one word into another, one step at a time." />
  <meta property="og:image"       content="https://wordladderpuzzlegame.com/preview.png" />
  <meta property="og:url"         content="https://wordladderpuzzlegame.com" />
  <meta property="og:type"        content="website" />

  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:title"       content="Word Ladder Puzzle" />
  <meta name="twitter:description" content="A free daily word puzzle game. Transform one word into another, one step at a time." />
  <meta name="twitter:image"       content="https://wordladderpuzzlegame.com/preview.png" />

  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(160deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px 24px;
      text-align: center;
      color: #fff;
    }
    .icon { font-size: 72px; margin-bottom: 16px; }
    h1 {
      font-size: 36px;
      font-weight: 900;
      letter-spacing: -0.5px;
      margin-bottom: 12px;
    }
    .tagline {
      font-size: 18px;
      color: #FFD60A;
      font-weight: 600;
      margin-bottom: 20px;
    }
    .desc {
      font-size: 15px;
      color: #b0b8d1;
      max-width: 320px;
      line-height: 1.7;
      margin-bottom: 36px;
    }
    .features {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 40px;
      max-width: 300px;
      width: 100%;
    }
    .feature {
      background: rgba(255,255,255,0.07);
      border-radius: 12px;
      padding: 12px 16px;
      font-size: 14px;
      color: #dde3f0;
      display: flex;
      align-items: center;
      gap: 10px;
      text-align: left;
    }
    .feature span { font-size: 20px; }
    .btn {
      display: inline-block;
      padding: 16px 0;
      width: 280px;
      border-radius: 50px;
      font-size: 16px;
      font-weight: 800;
      text-decoration: none;
      background: #FFD60A;
      color: #1a1a2e;
      box-shadow: 0 6px 24px rgba(255,214,10,0.35);
      margin-bottom: 16px;
    }
    .secondary {
      font-size: 13px;
      color: #6b7a99;
      margin-top: 8px;
    }
    .secondary a { color: #6b7a99; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="icon">🪜</div>
  <h1>Word Ladder Puzzle</h1>
  <p class="tagline">A new puzzle every day</p>
  <p class="desc">
    Transform one word into another, one letter at a time.
    Every step must be a valid word — how efficiently can you climb the ladder?
  </p>
  <div class="features">
    <div class="feature"><span>📅</span> Free daily puzzle for everyone</div>
    <div class="feature"><span>🏆</span> Global &amp; friend leaderboards</div>
    <div class="feature"><span>🔥</span> Streak tracking &amp; rank progression</div>
    <div class="feature"><span>⚡</span> Three difficulty levels</div>
  </div>
  <a class="btn" href="${storeUrl}">${storeName}</a>
  <p class="secondary">Available free on iOS &amp; Android</p>
</body>
</html>`);
});

// ── Smart share redirect ──────────────────────────────────────────────────────
// When the app is installed, iOS/Android intercepts this URL and opens the app
// directly (via Universal Links / App Links) before the browser ever loads.
// When the app is NOT installed, the browser hits this route. We serve an HTML
// page with OG meta tags (so messaging apps show a rich preview card) that
// auto-redirects to the correct store after a short delay.
app.get('/share', (req, res) => {
    const ua = req.headers['user-agent'] || '';
    const isAndroid = /android/i.test(ua);
    const storeUrl = isAndroid
        ? 'https://play.google.com/store/apps/details?id=com.vlad.wordLadderAndroid'
        : 'https://apps.apple.com/us/app/word-ladder-puzzle/id6759207300';

    res.setHeader('Content-Type', 'text/html');
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Join Word Ladder Puzzle</title>

  <meta property="og:title"       content="Join Word Ladder Puzzle" />
  <meta property="og:description" content="A daily word puzzle game. Can you climb the ladder?" />
  <meta property="og:image"       content="https://wordladderpuzzlegame.com/preview.png" />
  <meta property="og:url"         content="https://wordladderpuzzlegame.com/share" />
  <meta property="og:type"        content="website" />

  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:title"       content="Join Word Ladder Puzzle" />
  <meta name="twitter:description" content="A daily word puzzle game. Can you climb the ladder?" />
  <meta name="twitter:image"       content="https://wordladderpuzzlegame.com/preview.png" />

  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f5f0e8;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
      text-align: center;
      color: #111;
    }
    h1 { font-size: 26px; font-weight: 800; margin-bottom: 10px; }
    p  { font-size: 15px; color: #555; max-width: 280px; line-height: 1.5; margin-bottom: 32px; }
    .btn {
      display: inline-block;
      padding: 15px 0;
      width: 260px;
      border-radius: 50px;
      font-size: 16px;
      font-weight: 700;
      text-decoration: none;
      background: #FFD60A;
      color: #333;
      box-shadow: 0 4px 16px rgba(0,0,0,0.1);
    }
    .note { margin-top: 20px; font-size: 13px; color: #aaa; }
  </style>
</head>
<body>
  <h1>Word Ladder Puzzle</h1>
  <p>A daily word puzzle game. Climb from one word to another, one letter at a time.</p>
  <a class="btn" href="${storeUrl}">Get the App</a>
  <script>
    // Try to open the app via its custom URL scheme.
    // If the app is installed but Universal/App Links were bypassed (e.g. in-app browser),
    // this will open it. If the app is not installed, it fails silently and the
    // setTimeout below immediately redirects to the correct store.
    window.location = 'wordladder://share';
    setTimeout(function() { window.location.replace("${storeUrl}"); }, 300);
  </script>
</body>
</html>`);
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
                    paths: ['/share', '/join/*']
                }
            ]
        }
    });
});
// ── Leaderboard group invite redirect ──────────────────────────────────────────────
// When the app is installed, iOS intercepts this Universal Link before the
// browser loads and opens the app directly with the group ID in the URL.
// When the app is not installed, the browser lands here and we redirect to
// the App Store so the user can install, then tap the link again to join.
app.get('/join/:groupId', (req, res) => {
    const { groupId } = req.params;
    const ua = req.headers['user-agent'] || '';
    const isAndroid = /android/i.test(ua);
    const storeUrl = isAndroid
        ? 'https://play.google.com/store/apps/details?id=com.vlad.wordLadderAndroid'
        : 'https://apps.apple.com/us/app/word-ladder-puzzle/id6759207300';

    res.setHeader('Content-Type', 'text/html');
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Join Leaderboard Group – Word Ladder</title>
  <meta property="og:title"       content="Join my Word Ladder leaderboard!" />
  <meta property="og:description" content="You've been invited to a private Word Ladder leaderboard group. Download the app to compete!" />
  <meta property="og:image"       content="https://wordladderpuzzlegame.com/preview.png" />
  <meta property="og:url"         content="https://wordladderpuzzlegame.com/join/${groupId}" />
  <meta property="og:type"        content="website" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f5f0e8;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
      text-align: center;
      color: #111;
    }
    h1 { font-size: 26px; font-weight: 800; margin-bottom: 10px; }
    p  { font-size: 15px; color: #555; max-width: 300px; line-height: 1.5; margin-bottom: 32px; }
    .btn {
      display: inline-block;
      padding: 15px 0;
      width: 260px;
      border-radius: 50px;
      font-size: 16px;
      font-weight: 700;
      text-decoration: none;
      background: #FFD60A;
      color: #333;
      box-shadow: 0 4px 16px rgba(0,0,0,0.1);
    }
    .note { margin-top: 20px; font-size: 13px; color: #aaa; }
  </style>
</head>
<body>
  <h1>You've been invited! 🏆</h1>
  <p>Open the Word Ladder app to join this leaderboard group and compete with friends.</p>
  <a class="btn" href="${storeUrl}">Get the App</a>
  <p class="note">Already installed? Go back and tap the link again to join.</p>
  <script>
    window.location = 'wordladder://join/${groupId}';
    setTimeout(function() { window.location.replace("${storeUrl}"); }, 400);
  </script>
</body>
</html>`);
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

app.get('/delete-account', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Word Ladder – Support & Account Deletion</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 680px; margin: 48px auto; padding: 0 24px; color: #222; line-height: 1.6; }
    h1 { color: #2e7d32; }
    h2 { margin-top: 40px; border-bottom: 1px solid #ddd; padding-bottom: 8px; }
    ol, ul { padding-left: 24px; }
    .badge { display: inline-block; background: #e8f5e9; color: #2e7d32; border-radius: 4px; padding: 2px 10px; font-size: 0.85em; font-weight: 600; }
    footer { margin-top: 60px; font-size: 0.85em; color: #888; }
    a { color: #2e7d32; }
  </style>
</head>
<body>
  <h1>🪜 Word Ladder</h1>
  <p><strong>Developer:</strong> MuskratProductions</p>
  <h2>How to Delete Your Account</h2>
  <p>You can permanently delete your Word Ladder account and all associated data directly from within the app:</p>
  <ol>
    <li>Open the <strong>Word Ladder</strong> app and sign in.</li>
    <li>Tap the <strong>Profile</strong> icon in the navigation bar.</li>
    <li>Scroll down and tap <strong>"Delete Account"</strong>.</li>
    <li>Confirm the deletion when prompted.</li>
  </ol>
  <p><span class="badge">Immediate &amp; Permanent</span>&nbsp;Deletion is processed immediately and cannot be undone.</p>
  <h2>What Gets Deleted</h2>
  <p>When you delete your account, the following data is <strong>permanently deleted with no retention period</strong>:</p>
  <ul>
    <li>Your authentication account and user ID</li>
    <li>All game progress (puzzles, scores, streaks) for all difficulty levels</li>
    <li>Your leaderboard name and all leaderboard entries</li>
    <li>Your push notification token and preferences</li>
    <li>Your premium purchase status record</li>
    <li>All other profile data stored on our servers</li>
  </ul>
  <h2>Contact</h2>
  <p>If you cannot access the app and need your account deleted, email us at <a href="mailto:vladfantasyfootball@gmail.com">vladfantasyfootball@gmail.com</a> with the subject <em>"Account Deletion Request"</em> and we will process it within 7 days.</p>
  <footer>
    <p>© 2026 MuskratProductions · Word Ladder</p>
    <p><a href="/privacy">Privacy Policy</a></p>
  </footer>
</body>
</html>`);
});

app.get('/privacy', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Word Ladder – Privacy Policy</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 680px; margin: 48px auto; padding: 0 24px; color: #222; line-height: 1.7; }
    h1 { color: #2e7d32; }
    h2 { margin-top: 40px; border-bottom: 1px solid #ddd; padding-bottom: 8px; }
    h3 { margin-top: 24px; color: #333; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 0.95em; }
    th, td { text-align: left; padding: 10px 12px; border: 1px solid #ddd; }
    th { background: #f5f5f5; }
    ul { padding-left: 24px; }
    a { color: #2e7d32; }
    footer { margin-top: 60px; font-size: 0.85em; color: #888; }
  </style>
</head>
<body>
  <h1>🪜 Word Ladder — Privacy Policy</h1>
  <p><strong>Developer:</strong> MuskratProductions<br /><strong>Contact:</strong> <a href="mailto:vladfantasyfootball@gmail.com">vladfantasyfootball@gmail.com</a><br /><strong>Effective date:</strong> April 19, 2026</p>
  <p>This Privacy Policy explains what information Word Ladder ("the app", "we", "our") collects, how it is used, and your rights regarding your data. By using the app you agree to this policy.</p>
  <h2>1. Information We Collect</h2>
  <h3>Account Information</h3>
  <p>When you sign in with Google (Android) or Apple (iOS), we receive a unique user ID from that provider. We do <strong>not</strong> receive or store your password. We may receive your name and email address from the provider depending on your privacy settings, but we do not store your email address in our database.</p>
  <h3>Data You Provide</h3>
  <ul><li><strong>Leaderboard display name</strong> — a name you choose to appear on public leaderboards (optional).</li></ul>
  <h3>Data Generated by Your Use of the App</h3>
  <table>
    <thead><tr><th>Data type</th><th>Purpose</th></tr></thead>
    <tbody>
      <tr><td>Game progress (scores, streaks, puzzle attempts, completion times)</td><td>Saving your progress and showing statistics</td></tr>
      <tr><td>Leaderboard ranking data</td><td>Displaying public leaderboards</td></tr>
      <tr><td>Premium purchase status</td><td>Unlocking paid features</td></tr>
      <tr><td>Ad interaction data (date last watched)</td><td>Tracking daily ad limits</td></tr>
      <tr><td>Notification preferences and push token</td><td>Sending daily puzzle reminders (only if you opt in)</td></tr>
      <tr><td>App review prompt tracking</td><td>Avoiding showing review requests too frequently</td></tr>
    </tbody>
  </table>
  <h3>Device and Advertising Identifiers</h3>
  <p>On Android, the app requests the <strong>Google Advertising ID</strong> to enable personalized advertising through Google AdMob. On iOS, the app presents Apple's App Tracking Transparency (ATT) prompt before accessing any advertising identifier. You may decline tracking at any time via your device settings.</p>
  <h2>2. How We Use Your Information</h2>
  <ul>
    <li>To create and maintain your account</li>
    <li>To save and sync your game progress across app sessions</li>
    <li>To display leaderboards and rank you against other players</li>
    <li>To verify and restore in-app purchases</li>
    <li>To send daily puzzle reminder notifications (only if you opt in)</li>
    <li>To display advertisements that help keep the app free</li>
    <li>To improve the app using aggregated, anonymized analytics</li>
  </ul>
  <p>We do <strong>not</strong> sell your personal data to third parties.</p>
  <h2>3. Third-Party Services</h2>
  <table>
    <thead><tr><th>Service</th><th>Purpose</th><th>Privacy Policy</th></tr></thead>
    <tbody>
      <tr><td>Firebase (Google)</td><td>Authentication &amp; database</td><td><a href="https://firebase.google.com/support/privacy" target="_blank">firebase.google.com/support/privacy</a></td></tr>
      <tr><td>Google AdMob</td><td>Advertising</td><td><a href="https://policies.google.com/privacy" target="_blank">policies.google.com/privacy</a></td></tr>
      <tr><td>RevenueCat</td><td>In-app purchase management</td><td><a href="https://www.revenuecat.com/privacy" target="_blank">revenuecat.com/privacy</a></td></tr>
      <tr><td>Expo</td><td>Push notification delivery</td><td><a href="https://expo.dev/privacy" target="_blank">expo.dev/privacy</a></td></tr>
      <tr><td>Google Sign-In</td><td>Authentication (Android)</td><td><a href="https://policies.google.com/privacy" target="_blank">policies.google.com/privacy</a></td></tr>
      <tr><td>Apple Sign-In</td><td>Authentication (iOS)</td><td><a href="https://www.apple.com/legal/privacy/" target="_blank">apple.com/legal/privacy</a></td></tr>
    </tbody>
  </table>
  <h2>4. Data Retention</h2>
  <p>Your data is retained for as long as your account exists. When you delete your account, all data stored on our servers is permanently deleted immediately with no retention period. Third-party services may retain anonymized or aggregated data in accordance with their own policies.</p>
  <h2>5. Children's Privacy</h2>
  <p>Word Ladder is a word puzzle game suitable for general audiences. We do not knowingly collect personal information from children under the age of 13. If you believe a child under 13 has provided us with data, please contact us at <a href="mailto:vladfantasyfootball@gmail.com">vladfantasyfootball@gmail.com</a> and we will delete it promptly.</p>
  <h2>6. Your Rights</h2>
  <ul>
    <li><strong>Access</strong> the data we hold about you — contact us by email.</li>
    <li><strong>Delete</strong> your account and all associated data — use the in-app "Delete Account" option in your Profile, or email us.</li>
    <li><strong>Opt out of push notifications</strong> — toggle off in your Profile or via device settings.</li>
    <li><strong>Opt out of ad tracking</strong> — decline the ATT prompt (iOS) or reset/opt out of the Advertising ID in Android settings.</li>
  </ul>
  <h2>7. Data Security</h2>
  <p>All data transmitted between the app and our servers is encrypted in transit using TLS/HTTPS. Our backend is hosted on Google Cloud Run. Authentication is handled by Firebase, which provides industry-standard security.</p>
  <h2>8. Changes to This Policy</h2>
  <p>We may update this Privacy Policy from time to time. The effective date at the top of this page will reflect the most recent revision. Continued use of the app after changes constitutes acceptance of the updated policy.</p>
  <h2>9. Contact</h2>
  <p>Questions or requests: <a href="mailto:vladfantasyfootball@gmail.com">vladfantasyfootball@gmail.com</a></p>
  <footer>
    <p>© 2026 MuskratProductions · Word Ladder</p>
    <p><a href="/delete-account">Account Deletion Instructions</a></p>
  </footer>
</body>
</html>`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server Started at ${PORT}`)
})

app.use('/api', router)
