# Firebase Admin SDK Setup

## Getting Service Account Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `wordladder-e0341`
3. Click the gear icon ⚙️ > Project Settings
4. Go to "Service Accounts" tab
5. Click "Generate New Private Key"
6. Download the JSON file

## Extracting Environment Variables

From the downloaded JSON file, you'll need to extract these values and add them to your `.env` file:

```env
# Firebase Admin SDK
FIREBASE_PROJECT_ID=wordladder-e0341
FIREBASE_PRIVATE_KEY_ID=<from JSON: private_key_id>
FIREBASE_PRIVATE_KEY="<from JSON: private_key>"
FIREBASE_CLIENT_EMAIL=<from JSON: client_email>
FIREBASE_CLIENT_ID=<from JSON: client_id>
FIREBASE_CERT_URL=<from JSON: client_x509_cert_url>
```

**Important Notes:**
- The `private_key` in the JSON contains `\n` characters for line breaks - keep these as-is
- Wrap the private_key value in quotes in your .env file
- Never commit the service account JSON file or .env to git
- Make sure `.env` is in your `.gitignore`

## Example .env file structure:

```env
DATABASE_URL=mongodb+srv://...
DATE_CONST=1736208000000
FIREBASE_PROJECT_ID=wordladder-e0341
FIREBASE_PRIVATE_KEY_ID=abc123...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIB...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@wordladder-e0341.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=123456789...
FIREBASE_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40wordladder-e0341.iam.gserviceaccount.com
```

## Testing

After setting up the environment variables:

1. Run `npm install` to install firebase-admin
2. Restart your server
3. Test an API call from your mobile app - it should now require authentication
4. Check server logs for any authentication errors

## Security Checklist

- [x] Firebase Admin SDK installed
- [x] Authentication middleware created
- [x] All routes protected with verifyToken
- [x] User ID verification (users can't access other users' data)
- [ ] Service account credentials added to .env
- [ ] .env added to .gitignore (verify!)
- [ ] Environment variables added to Railway/production
