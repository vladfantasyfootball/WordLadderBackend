/**
 * add-mock-group-users.js
 *
 * Adds 55 mock users to:
 *   - WordLadderUsers collection (with varying currentStreak for level "one")
 *   - LeaderboardOne collection
 *   - LeaderboardGroup "6a18f515312c19427a5e6f65" (members array)
 *
 * Mock users are tagged with a prefix "MOCK_" on their id so the
 * cleanup script can find and delete them easily.
 *
 * Run:  node --experimental-vm-modules src/utils/add-mock-group-users.js
 */

import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { WordLadderUsersModel } from '../models/user.js';
import { LeaderboardOneModel } from '../models/leaderboard.js';
import { LeaderboardGroupModel } from '../models/leaderboardGroup.js';

const GROUP_ID = '6a18f515312c19427a5e6f65';
const MOCK_PREFIX = 'MOCK_TEST_USER_';

const LEADERBOARD_NAMES = [
    'WordWizard', 'LadderKing', 'VowelVictor', 'LetterLord', 'QuizQueen',
    'SpellBound', 'AlphaAce', 'GridGuru', 'PuzzlePro', 'TileTracer',
    'WordSurfer', 'LexiLancer', 'ScrabbleStar', 'GlyphGuru', 'VerbalViking',
    'LadderLegend', 'CipherSage', 'WordSmythe', 'AnagramAce', 'PhoneticFox',
    'RhymeRaider', 'SyllableSteve', 'DictionDave', 'MorphMaster', 'ClassicCarla',
    'NounNinja', 'VerbVanguard', 'AdjectiveAlex', 'PrefixPete', 'SuffixSam',
    'RootWordRob', 'EtymElla', 'ConsonantCal', 'VowelValerie', 'PalinPaul',
    'AnagramAnna', 'HaikuHank', 'SonnetSue', 'EpicEvan', 'LimerickLou',
    'OdeOliver', 'BalladeBarb', 'TerzaTerry', 'VillanelleViv', 'GhazalGrace',
    'TankaTodd', 'SenryuSophia', 'HokeyHope', 'RebuRex', 'AcrosticAmy',
    'CipherChloe', 'RiddleRick', 'LogicLara', 'PuzzlePenny', 'TeaserTom',
];

// Spread streaks across various values — some above 50, some below
const generateStreak = (index) => {
    const values = [
        72, 65, 61, 58, 57, 54, 53, 52, 51, 50,   // top 10 — near or above user's 50
        49, 48, 47, 46, 45, 43, 41, 39, 37, 35,
        33, 31, 29, 27, 25, 24, 23, 22, 21, 20,
        19, 18, 17, 16, 15, 14, 13, 12, 11, 10,
        9,  8,  7,  6,  5,  4,  3,  2,  1,  1,
        88, 77, 66, 55, 44,
    ];
    return values[index] ?? Math.max(1, 55 - index);
};

const run = async () => {
    const mongoString = process.env.DATABASE_URL;
    await mongoose.connect(mongoString, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('✅ Connected');

    const group = await LeaderboardGroupModel.findById(GROUP_ID);
    if (!group) {
        console.error(`❌ Group ${GROUP_ID} not found`);
        process.exit(1);
    }

    const mockIds = [];

    for (let i = 0; i < 55; i++) {
        const userId = `${MOCK_PREFIX}${i.toString().padStart(3, '0')}`;
        const streak = generateStreak(i);
        const totalScore = streak * 180 + Math.floor(Math.random() * 500);
        const name = LEADERBOARD_NAMES[i];

        // Upsert user
        await WordLadderUsersModel.findOneAndUpdate(
            { id: userId },
            {
                $set: {
                    id: userId,
                    leaderboardName: name,
                    soundEffectsEnabled: true,
                    leaderboardGroupIds: [GROUP_ID],
                    ad: { adWatched: false, dateWatched: null },
                    purchases: { premium: false },
                    notifications: { enabled: false, expoPushToken: null, hasBeenAskedForNotifications: false },
                    review: { lastPromptedAt: 0 },
                    wordLadder: {
                        one: {
                            currentWordLadder: { currentPuzzle: 1, currentAttempt: [], completed: true },
                            timeStarted: null, timeFinished: null,
                            currentStreak: streak,
                            longestStreak: streak,
                            lastSolved: 1,
                            lastAttempted: 1,
                            totalScore,
                            highScore: totalScore,
                            totalAttempted: streak,
                            totalSolved: streak,
                        },
                        two: {
                            currentWordLadder: { currentPuzzle: 1, currentAttempt: [], completed: false },
                            timeStarted: null, timeFinished: null,
                            currentStreak: 0, longestStreak: 0,
                            lastSolved: null, lastAttempted: null,
                            totalScore: 0, highScore: 0,
                            totalAttempted: 0, totalSolved: 0,
                        },
                        three: {
                            currentWordLadder: { currentPuzzle: 1, currentAttempt: [], completed: false },
                            timeStarted: null, timeFinished: null,
                            currentStreak: 0, longestStreak: 0,
                            lastSolved: null, lastAttempted: null,
                            totalScore: 0, highScore: 0,
                            totalAttempted: 0, totalSolved: 0,
                        },
                    },
                },
            },
            { upsert: true }
        );

        // Upsert leaderboard entry
        await LeaderboardOneModel.findOneAndUpdate(
            { userId },
            {
                $set: {
                    userId,
                    currentStreak: streak,
                    longestStreak: streak,
                    totalScore,
                    averageScore: parseFloat((totalScore / streak).toFixed(1)),
                    totalSolved: streak,
                    lastUpdated: new Date(),
                },
            },
            { upsert: true }
        );

        mockIds.push(userId);
        console.log(`  ✓ ${name.padEnd(20)} streak=${streak}`);
    }

    // Add all mock user IDs to the group's members array (avoid duplicates)
    await LeaderboardGroupModel.findByIdAndUpdate(
        GROUP_ID,
        { $addToSet: { members: { $each: mockIds } } }
    );

    console.log(`\n✅ Added ${mockIds.length} mock users to group "${group.name}" (${GROUP_ID})`);
    console.log('   Run remove-mock-group-users.js to clean up.\n');

    await mongoose.connection.close();
};

run().catch(e => { console.error(e); process.exit(1); });
