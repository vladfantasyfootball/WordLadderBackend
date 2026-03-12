import { WordLadderUsersModel } from '../models/user.js';

const REVENUECAT_SECRET_KEY = process.env.REVENUECAT_SECRET_KEY;
const REVENUECAT_ENTITLEMENT_ID = 'premium';

/**
 * Verifies a purchase with RevenueCat and sets purchases.premium = true on the user.
 * The user ID comes from the verified Firebase token — the client cannot influence whose
 * record gets updated. The premium flag is only set if RevenueCat confirms the entitlement
 * is active, so the client cannot self-grant premium by calling this endpoint alone.
 */
export const verifyPurchase = async (req, res) => {
    try {
        const firebaseUid = req.user.uid;

        const rcResponse = await fetch(
            `https://api.revenuecat.com/v1/subscribers/${firebaseUid}`,
            {
                headers: {
                    'Authorization': `Bearer ${REVENUECAT_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!rcResponse.ok) {
            console.error('RevenueCat API error:', rcResponse.status, await rcResponse.text());
            return res.status(502).json({ error: 'Failed to verify purchase with payment provider' });
        }

        const rcData = await rcResponse.json();
        const entitlements = rcData?.subscriber?.entitlements ?? {};
        const isPremium = REVENUECAT_ENTITLEMENT_ID in entitlements &&
            entitlements[REVENUECAT_ENTITLEMENT_ID].expires_date === null; // null = lifetime/non-expiring

        if (!isPremium) {
            return res.status(402).json({ error: 'No active premium entitlement found' });
        }

        const updatedUser = await WordLadderUsersModel.findOneAndUpdate(
            { id: firebaseUid },
            { $set: { 'purchases.premium': true } },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json(updatedUser);
    } catch (error) {
        console.error('verifyPurchase error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
