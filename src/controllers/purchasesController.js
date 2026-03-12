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
        console.log(`[verifyPurchase] called for uid=${firebaseUid}`);
        console.log(`[verifyPurchase] REVENUECAT_SECRET_KEY present=${!!REVENUECAT_SECRET_KEY}`);

        const rcResponse = await fetch(
            `https://api.revenuecat.com/v1/subscribers/${firebaseUid}`,
            {
                headers: {
                    'Authorization': `Bearer ${REVENUECAT_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        console.log(`[verifyPurchase] RevenueCat response status=${rcResponse.status}`);

        if (!rcResponse.ok) {
            const body = await rcResponse.text();
            console.error(`[verifyPurchase] RevenueCat API error: status=${rcResponse.status} body=${body}`);
            return res.status(502).json({ error: 'Failed to verify purchase with payment provider' });
        }

        const rcData = await rcResponse.json();
        const entitlements = rcData?.subscriber?.entitlements ?? {};
        console.log(`[verifyPurchase] entitlements keys=${Object.keys(entitlements).join(',') || 'none'}`);

        const entitlement = entitlements[REVENUECAT_ENTITLEMENT_ID];
        console.log(`[verifyPurchase] '${REVENUECAT_ENTITLEMENT_ID}' entitlement=${JSON.stringify(entitlement)}`);

        // Non-consumable/lifetime purchases have expires_date === null
        const isPremium = !!entitlement && entitlement.expires_date === null;
        console.log(`[verifyPurchase] isPremium=${isPremium}`);

        if (!isPremium) {
            return res.status(402).json({ error: 'No active premium entitlement found' });
        }

        const updatedUser = await WordLadderUsersModel.findOneAndUpdate(
            { id: firebaseUid },
            { $set: { 'purchases.premium': true } },
            { new: true }
        );

        if (!updatedUser) {
            console.error(`[verifyPurchase] user not found in DB for uid=${firebaseUid}`);
            return res.status(404).json({ error: 'User not found' });
        }

        console.log(`[verifyPurchase] successfully unlocked premium for uid=${firebaseUid}`);
        res.status(200).json(updatedUser);
    } catch (error) {
        console.error('[verifyPurchase] unexpected error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
