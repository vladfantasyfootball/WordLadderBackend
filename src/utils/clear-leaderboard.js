/**
 * Clears all three leaderboard collections.
 *
 * Usage: node src/utils/clear-leaderboard.js
 */

// import dotenv from 'dotenv';
// dotenv.config();
// import mongoose from 'mongoose';
// import { LeaderboardOneModel, LeaderboardTwoModel, LeaderboardThreeModel } from '../models/leaderboard.js';

// async function clearAll() {
//     await mongoose.connect(process.env.DATABASE_URL);
//     console.log('Connected to MongoDB');

//     const [one, two, three] = await Promise.all([
//         LeaderboardOneModel.deleteMany({}),
//         LeaderboardTwoModel.deleteMany({}),
//         LeaderboardThreeModel.deleteMany({}),
//     ]);

//     console.log(`LeaderboardOne:   ${one.deletedCount} documents deleted`);
//     console.log(`LeaderboardTwo:   ${two.deletedCount} documents deleted`);
//     console.log(`LeaderboardThree: ${three.deletedCount} documents deleted`);

//     await mongoose.disconnect();
//     console.log('Done');
// }

// clearAll().catch((err) => { console.error(err); process.exit(1); });
