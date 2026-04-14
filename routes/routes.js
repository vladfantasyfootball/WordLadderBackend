import express from 'express';
import { getLevelOnePuzzle, getPreviousLevelOnePuzzle } from '../src/controllers/levelOnePuzzlesController.js';
import { getLevelTwoPuzzle, getPreviousLevelTwoPuzzle } from '../src/controllers/levelTwoPuzzlesController.js';
import { getLevelThreePuzzle, getPreviousLevelThreePuzzle } from '../src/controllers/levelThreePuzzlesController.js';
import { postUser, getUser, updateUser, deleteUser, setLeaderboardName } from '../src/controllers/userController.js';
import { verifyPurchase } from '../src/controllers/purchasesController.js';
import { verifyToken } from '../src/middleware/auth.js';
import { validateUserUpdate } from '../src/validation/userValidation.js';
import { sendDailyPuzzleNotifications } from '../src/services/notificationService.js';
import { upsertLeaderboardEntry, getLeaderboard } from '../src/controllers/leaderboardController.js';

export const router = express.Router()
 
//Post Method
router.post('/post', verifyToken, async (req, res) => {
    try {
        let user = await postUser(req.body);
        if(user){
            res.status(200).send(user);
        }
        else {
            res.status(500).send("Error saving user")
        }
    }
    catch {
        res.status(500).send("Error saving user")
    }
})

//Get by ID Method
router.post('/getUser', verifyToken, async (req, res) => {
    try {
        let user = await getUser(req.body);
        if(user){
            res.status(200).send(user);
        }
        else {
            res.status(500).send("Error retrieving user")
        }
    }
    catch(e) {
        console.log(e);
        res.status(500).send("Error retrieving user")
    }
})

//Update by ID Method
router.post('/updateUser', verifyToken, validateUserUpdate, async (req, res) => {
    try {
        let user = await updateUser(req.body.id, req.body.userUpdate);
        if(user){
            res.status(200).send(user);
            // Fire-and-forget leaderboard sync for each level
            const wl = req.body.userUpdate.wordLadder;
            const levelsToSync = ['one', 'two', 'three'];
            for (const level of levelsToSync) {
                const levelData = wl?.[level];
                if (levelData && levelData.currentWordLadder?.completed) {
                    upsertLeaderboardEntry(req.body.id, level, {
                        totalScore:    levelData.totalScore    ?? 0,
                        totalSolved:   levelData.totalSolved   ?? 0,
                        currentStreak: levelData.currentStreak ?? 0,
                        longestStreak: levelData.longestStreak ?? 0,
                    }).catch(err => console.error(`Leaderboard upsert failed for level ${level}:`, err));
                }
            }
        }
        else {
            res.status(500).send("Error updating user")
        }
    }
    catch(e) {
        console.log(e);
        res.status(500).send("Error updating user")
    }
})

//Get level one puzzle by ID Method
router.get('/getPuzzles', verifyToken, async (req, res) => {
    try {
        let levelOnePuzzle = await getLevelOnePuzzle();
        let levelTwoPuzzle = await getLevelTwoPuzzle();
        let levelThreePuzzle = await getLevelThreePuzzle();

        if(levelOnePuzzle && levelTwoPuzzle){
            res.status(200).send({"one": levelOnePuzzle, "two": levelTwoPuzzle, "three": levelThreePuzzle || null});
        }
        else {
            res.status(500).send("Error retrieving puzzles")
        }
    }
    catch(e) {
        console.log(e);
        res.status(500).send("Error retrieving puzzles")
    }
})

// Get previous day's puzzles (for "Yesterday's Solution" feature)
router.get('/getPreviousPuzzles', verifyToken, async (req, res) => {
    try {
        const [one, two, three] = await Promise.all([
            getPreviousLevelOnePuzzle(),
            getPreviousLevelTwoPuzzle(),
            getPreviousLevelThreePuzzle(),
        ]);
        if (!one) {
            return res.status(404).send("No previous puzzle available yet");
        }
        res.status(200).send({ one, two: two || null, three: three || null });
    } catch(e) {
        console.error(e);
        res.status(500).send("Error retrieving previous puzzles");
    }
})

//Delete Account Method
router.delete('/deleteUser', verifyToken, async (req, res) => {
    try {
        const success = await deleteUser(req.user.uid);
        if (success) {
            res.status(200).send({ message: 'Account deleted successfully' });
        } else {
            res.status(500).send('Error deleting account');
        }
    } catch {
        res.status(500).send('Error deleting account');
    }
})

// Trigger daily notifications — called by Cloud Scheduler (not by app clients)
// Secured by a shared secret in the X-Scheduler-Secret header
router.post('/trigger-notifications', async (req, res) => {
    const secret = process.env.SCHEDULER_SECRET;
    if (!secret || req.headers['x-scheduler-secret'] !== secret) {
        return res.status(401).send('Unauthorized');
    }
    try {
        console.log('Cloud Scheduler triggered daily notifications');
        await sendDailyPuzzleNotifications();
        res.status(200).send({ message: 'Notifications sent successfully' });
    } catch (e) {
        console.error(e);
        res.status(500).send('Error sending notifications');
    }
})

// Verify purchase with RevenueCat and unlock premium
router.post('/purchases/verify', verifyToken, async (req, res) => {
    await verifyPurchase(req, res);
})

// Set or update a user's leaderboard display name
router.put('/leaderboardName', verifyToken, async (req, res) => {
    try {
        const userId = req.user.uid;
        const { name } = req.body;
        if (!name || typeof name !== 'string') {
            return res.status(400).send('Name is required');
        }
        const result = await setLeaderboardName(userId, name);
        if (result.error) return res.status(400).send(result.error);
        res.status(200).send(result.user);
    } catch (e) {
        console.error(e);
        res.status(500).send('Error saving leaderboard name');
    }
})

// Get leaderboard for a level + category
// Query params: level (one|two|three), category (totalScore|averageScore|currentStreak|longestStreak|totalSolved)
// Body: { userId }
router.post('/leaderboard', verifyToken, async (req, res) => {
    try {
        const { level, category } = req.query;
        const { userId } = req.body;

        const validLevels = ['one', 'two', 'three'];
        const validCategories = ['totalScore', 'averageScore', 'currentStreak', 'longestStreak', 'totalSolved'];

        if (!validLevels.includes(level) || !validCategories.includes(category)) {
            return res.status(400).send("Invalid level or category");
        }

        const data = await getLeaderboard(level, category, userId);
        res.status(200).send(data);
    }
    catch(e) {
        console.log(e);
        res.status(500).send("Error retrieving leaderboard");
    }
})
