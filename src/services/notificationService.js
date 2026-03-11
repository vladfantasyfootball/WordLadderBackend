import { Expo } from 'expo-server-sdk';
import cron from 'node-cron';
import { WordLadderUsersModel } from '../models/user.js';

// Create a new Expo SDK client
const expo = new Expo();

/**
 * Gets the current puzzle day based on the release date.
 * Uses the same 7-hour UTC offset as userController / puzzle controllers so that
 * the day number matches what is stored in user.wordLadder.*.lastSolved.
 * @returns {number} The current puzzle day
 */
function getCurrentPuzzleDay() {
    const releaseDateString = process.env.DATE_CONST || "2026-03-08T00:00:00Z";
    const releaseDate = new Date(releaseDateString);
    const releaseDateUTC = Date.UTC(
        releaseDate.getUTCFullYear(),
        releaseDate.getUTCMonth(),
        releaseDate.getUTCDate()
    );

    // Subtract 7 hours so the day rolls over at UTC 07:00 (1 AM CT),
    // matching the logic in userController and puzzle controllers.
    const now = new Date();
    const today = new Date(now.getTime() - 7 * 60 * 60 * 1000);
    const todayUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());

    const elapsed = todayUTC - releaseDateUTC;
    const dayNumber = Math.floor(elapsed / (1000 * 60 * 60 * 24)) + 1;

    return dayNumber;
}

/**
 * Sends push notifications to users who haven't played today's puzzle
 */
export async function sendDailyPuzzleNotifications() {
    try {
        console.log('Starting daily puzzle notification job...');
        const currentDay = getCurrentPuzzleDay();
        
        // Find all users who have notifications enabled
        const users = await WordLadderUsersModel.find({
            'notifications.enabled': true,
            'notifications.expoPushToken': { $exists: true, $ne: null }
        });

        console.log(`Found ${users.length} users with notifications enabled`);

        // Filter users who haven't attempted today's puzzle yet.
        // lastAttempted is set the first time a user opens a puzzle for a given day,
        // making it a reliable signal that is independent of completion state.
        const usersToNotify = users.filter(user => {
            const levelOneLastAttempted = user.wordLadder?.one?.lastAttempted;
            const levelTwoLastAttempted = user.wordLadder?.two?.lastAttempted;

            const hasntAttemptedLevelOne = !levelOneLastAttempted || levelOneLastAttempted < currentDay;
            const hasntAttemptedLevelTwo = !levelTwoLastAttempted || levelTwoLastAttempted < currentDay;

            return hasntAttemptedLevelOne || hasntAttemptedLevelTwo;
        });

        console.log(`${usersToNotify.length} users haven't played today's puzzle`);

        if (usersToNotify.length === 0) {
            console.log('No users to notify');
            return;
        }

        // Prepare push notification messages
        const messages = [];
        for (const user of usersToNotify) {
            const pushToken = user.notifications.expoPushToken;
            
            // Check that the push token is valid
            if (!Expo.isExpoPushToken(pushToken)) {
                console.error(`Invalid push token for user ${user.id}: ${pushToken}`);
                continue;
            }

            messages.push({
                to: pushToken,
                sound: 'default',
                title: '🎮 New Word Ladder Puzzle!',
                body: 'A fresh puzzle is waiting for you. Can you solve it?',
                data: { 
                    type: 'daily_puzzle',
                    day: currentDay 
                },
                priority: 'high',
            });
        }

        // Send notifications in chunks (Expo recommends batches of 100)
        const chunks = expo.chunkPushNotifications(messages);
        const tickets = [];

        for (const chunk of chunks) {
            try {
                const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                tickets.push(...ticketChunk);
                console.log(`Sent ${chunk.length} notifications`);
            } catch (error) {
                console.error('Error sending notification chunk:', error);
            }
        }

        // Check for ticket errors
        for (let i = 0; i < tickets.length; i++) {
            const ticket = tickets[i];
            if (ticket.status === 'error') {
                console.error(`Notification error for user: ${ticket.message}`);
                if (ticket.details && ticket.details.error) {
                    console.error(`Error details: ${ticket.details.error}`);
                }
            }
        }

        console.log('Daily puzzle notification job completed successfully');
    } catch (error) {
        console.error('Error in daily puzzle notification job:', error);
    }
}

/**
 * Schedules the daily notification job.
 * Runs every day at 16:00 UTC = 10 AM CST (UTC-6) / 11 AM CDT (UTC-5).
 * To reliably hit 10 AM CT year-round despite DST, the timezone is set to
 * "America/Chicago" and the cron fires at 10:00 local time.
 * Only runs in production (Railway) environment.
 */
export function scheduleDailyNotifications() {
    // Only run cron job in production environment (Railway)
    if (process.env.NODE_ENV !== 'production' && !process.env.RAILWAY_ENVIRONMENT) {
        console.log('Skipping notification scheduler - not in production environment');
        return;
    }

    // Run every day at 10:00 AM CT (handles CST/CDT automatically via timezone)
    // Cron format: minute hour day month weekday
    cron.schedule('0 10 * * *', async () => {
        console.log('Daily notification cron job triggered');
        await sendDailyPuzzleNotifications();
    }, {
        scheduled: true,
        timezone: "America/Chicago"
    });

    console.log('Daily puzzle notification scheduler initialized (10:00 AM CT)');
}
