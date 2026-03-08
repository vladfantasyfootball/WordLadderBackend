import { Expo } from 'expo-server-sdk';
import cron from 'node-cron';
import { WordLadderUsersModel } from '../models/user.js';

// Create a new Expo SDK client
const expo = new Expo();

/**
 * Gets the current puzzle day based on the release date
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

    const now = new Date();
    const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

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

        // Filter users who haven't played today's puzzle yet
        const usersToNotify = users.filter(user => {
            const levelOneLastSolved = user.wordLadder?.one?.lastSolved;
            const levelTwoLastSolved = user.wordLadder?.two?.lastSolved;
            
            // Check if user hasn't solved either level's puzzle today
            const hasntPlayedLevelOne = !levelOneLastSolved || levelOneLastSolved < currentDay;
            const hasntPlayedLevelTwo = !levelTwoLastSolved || levelTwoLastSolved < currentDay;
            
            return hasntPlayedLevelOne || hasntPlayedLevelTwo;
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
 * Schedules the daily notification job
 * Runs every day at 4 PM UTC (8 AM PT / 11 AM ET)
 */
export function scheduleDailyNotifications() {
    // Run every day at 4:00 PM UTC (8 AM Pacific / 11 AM Eastern)
    // Cron format: minute hour day month weekday
    // '0 16 * * *' = At 16:00 (4 PM) every day
    
    cron.schedule('0 16 * * *', async () => {
        console.log('Daily notification cron job triggered');
        await sendDailyPuzzleNotifications();
    }, {
        scheduled: true,
        timezone: "UTC"
    });

    console.log('Daily puzzle notification scheduler initialized (4 PM UTC / 8 AM PT / 11 AM ET)');
    
    // Optionally run once at startup for testing
    // Uncomment the line below to test immediately when server starts
    // sendDailyPuzzleNotifications();
}
