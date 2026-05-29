/**
 * remove-mock-group-users.js
 *
 * Deletes all users whose `id` starts with "MOCK_TEST_USER_":
 *   - Removes from WordLadderUsers collection
 *   - Removes from LeaderboardOne collection
 *   - Removes their IDs from LeaderboardGroup members array
 *
 * Run:  node --experimental-vm-modules src/utils/remove-mock-group-users.js
 */

import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { WordLadderUsersModel } from '../models/user.js';
import { LeaderboardOneModel } from '../models/leaderboard.js';
import { LeaderboardGroupModel } from '../models/leaderboardGroup.js';

const GROUP_ID = '6a18f515312c19427a5e6f65';
const MOCK_PREFIX = 'MOCK_TEST_USER_';

const run = async () => {
    const mongoString = process.env.DATABASE_URL;
    await mongoose.connect(mongoString, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('✅ Connected');

    // Find all mock user IDs
    const mockUsers = await WordLadderUsersModel.find(
        { id: { $regex: `^${MOCK_PREFIX}` } },
        { id: 1 }
    );
    const mockIds = mockUsers.map(u => u.id);
    console.log(`Found ${mockIds.length} mock users`);

    if (mockIds.length === 0) {
        console.log('Nothing to clean up.');
        await mongoose.connection.close();
        return;
    }

    const [usersRes, lbRes] = await Promise.all([
        WordLadderUsersModel.deleteMany({ id: { $in: mockIds } }),
        LeaderboardOneModel.deleteMany({ userId: { $in: mockIds } }),
    ]);
    console.log(`  ✓ Deleted ${usersRes.deletedCount} WordLadderUsers`);
    console.log(`  ✓ Deleted ${lbRes.deletedCount} LeaderboardOne entries`);

    const groupRes = await LeaderboardGroupModel.findByIdAndUpdate(
        GROUP_ID,
        { $pull: { members: { $in: mockIds } } }
    );
    console.log(`  ✓ Removed ${mockIds.length} members from group ${GROUP_ID}`);

    console.log('\n✅ Cleanup complete.\n');

    await mongoose.connection.close();
};

run().catch(e => { console.error(e); process.exit(1); });
