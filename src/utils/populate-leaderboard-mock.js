/**
 * Populates mock leaderboard data across all three collections.
 *
 * User 05RJ2bFJ2AOP3W0BUEDngpJ1NeE3 is placed at:
 *   LeaderboardOne  — top 10 (rank ~5 of 50)
 *   LeaderboardTwo  — ~80th percentile (rank ~10 of 50, ahead of ~80%)
 *   LeaderboardThree — ~20th percentile (rank ~40 of 50, ahead of ~20%)
 *
 * Usage: node src/utils/populate-leaderboard-mock.js
 */

import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { LeaderboardOneModel, LeaderboardTwoModel, LeaderboardThreeModel } from '../models/leaderboard.js';

const MY_USER_ID = '05RJ2bFJ2AOP3W0BUEDngpJ1NeE3';
const TOTAL_USERS = 50;

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeEntry(userId, rank, total, overrides = {}) {
    // Interpolate base stats from rank (1 = best)
    const t = (rank - 1) / (total - 1); // 0 = rank 1 (top), 1 = rank last (bottom)

    const totalSolved  = Math.round((1 - t) * 80 + t * 1)  + randInt(-3, 3);
    const totalScore   = Math.round((1 - t) * 5000 + t * 50) + randInt(-50, 50);
    const longestStreak = Math.round((1 - t) * 60 + t * 1)  + randInt(-2, 2);
    const currentStreak = Math.min(longestStreak, Math.round((1 - t) * 30 + t * 0) + randInt(0, 5));
    const safeSolved   = Math.max(1, totalSolved);
    const averageScore = safeSolved >= 7 ? Math.round((totalScore / safeSolved) * 10) / 10 : null;

    return {
        userId,
        totalScore:    Math.max(0, totalScore),
        averageScore,
        currentStreak: Math.max(0, currentStreak),
        longestStreak: Math.max(0, longestStreak),
        totalSolved:   Math.max(0, totalSolved),
        lastUpdated:   new Date(),
        ...overrides,
    };
}

function generateOtherIds(count) {
    const ids = [];
    for (let i = 0; i < count; i++) {
        ids.push(`mock_user_${String(i + 1).padStart(3, '0')}`);
    }
    return ids;
}

function buildCollection(myRank, total) {
    const otherIds = generateOtherIds(total - 1);
    const entries = [];

    // Insert the other users around the target rank
    let otherRank = 1;
    for (let rank = 1; rank <= total; rank++) {
        if (rank === myRank) {
            entries.push({ userId: MY_USER_ID, rank });
        } else {
            entries.push({ userId: otherIds[otherRank - 1], rank });
            otherRank++;
        }
    }

    return entries.map(({ userId, rank }) => makeEntry(userId, rank, total));
}

async function run() {
    try {
        await mongoose.connect(process.env.DATABASE_URL);
        console.log('✅ Connected to MongoDB');

        // Rank 5 of 50  → "ahead of" (50-5)/(50-1) ≈ 92% → comfortably top 10
        // Rank 10 of 50 → "ahead of" (50-10)/(50-1) ≈ 82% → ~80th percentile
        // Rank 40 of 50 → "ahead of" (50-40)/(50-1) ≈ 20% → ~20th percentile
        const configs = [
            { model: LeaderboardOneModel,   name: 'LeaderboardOne',   myRank: 5  },
            { model: LeaderboardTwoModel,   name: 'LeaderboardTwo',   myRank: 10 },
            { model: LeaderboardThreeModel, name: 'LeaderboardThree', myRank: 40 },
        ];

        for (const { model, name, myRank } of configs) {
            await model.deleteMany({});
            const entries = buildCollection(myRank, TOTAL_USERS);
            await model.insertMany(entries);

            const myEntry = entries.find(e => e.userId === MY_USER_ID);
            const total = entries.length;
            const countAbove = entries.filter(e => e.totalScore > myEntry.totalScore).length;
            const percentile = Math.round(((total - (countAbove + 1)) / (total - 1)) * 100);

            console.log(`\n📊 ${name}:`);
            console.log(`   Inserted ${total} entries`);
            console.log(`   Your rank: ~${myRank} / ${total}`);
            console.log(`   Your total score: ${myEntry.totalScore}`);
            console.log(`   You are ahead of ~${percentile}% of players`);
        }

        console.log('\n✅ Mock leaderboard data populated successfully');
    } catch (err) {
        console.error('Script failed:', err);
    } finally {
        await mongoose.connection.close();
        console.log('Connection closed');
        process.exit(0);
    }
}

run();
