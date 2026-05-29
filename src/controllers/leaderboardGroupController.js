import { LeaderboardGroupModel } from '../models/leaderboardGroup.js';
import { WordLadderUsersModel } from '../models/user.js';
import { LeaderboardOneModel, LeaderboardTwoModel, LeaderboardThreeModel } from '../models/leaderboard.js';

const MAX_MEMBERS = 500;

function getLeaderboardModel(level) {
    if (level === 'one') return LeaderboardOneModel;
    if (level === 'two') return LeaderboardTwoModel;
    if (level === 'three') return LeaderboardThreeModel;
    throw new Error(`Invalid level: ${level}`);
}

export async function createGroup(userId, name) {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 30) {
        return { error: 'Name must be 1–30 characters.' };
    }
    const group = await LeaderboardGroupModel.create({
        name: trimmed,
        createdBy: userId,
        members: [userId],
    });
    await WordLadderUsersModel.findOneAndUpdate(
        { id: userId },
        { $addToSet: { leaderboardGroupIds: group._id.toString() } }
    );
    return { group };
}

export async function joinGroup(userId, groupId) {
    const group = await LeaderboardGroupModel.findById(groupId);
    if (!group) return { error: 'Group not found.' };
    if (group.members.includes(userId)) return { group }; // already a member — idempotent
    if (group.members.length >= MAX_MEMBERS) return { error: 'This group is full (500 members max).' };

    group.members.push(userId);
    await group.save();
    await WordLadderUsersModel.findOneAndUpdate(
        { id: userId },
        { $addToSet: { leaderboardGroupIds: groupId } }
    );
    return { group };
}

export async function leaveGroup(userId, groupId) {
    const group = await LeaderboardGroupModel.findById(groupId);
    if (!group) return { error: 'Group not found.' };

    await LeaderboardGroupModel.findByIdAndUpdate(groupId, { $pull: { members: userId } });
    await WordLadderUsersModel.findOneAndUpdate(
        { id: userId },
        { $pull: { leaderboardGroupIds: groupId } }
    );

    // Delete the group if it is now empty
    const updated = await LeaderboardGroupModel.findById(groupId);
    if (updated && updated.members.length === 0) {
        await LeaderboardGroupModel.findByIdAndDelete(groupId);
    }

    return { success: true };
}

export async function renameGroup(userId, groupId, name) {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 30) return { error: 'Name must be 1–30 characters.' };

    const group = await LeaderboardGroupModel.findById(groupId);
    if (!group) return { error: 'Group not found.' };
    if (group.createdBy !== userId) return { error: 'Only the group creator can rename this group.' };

    group.name = trimmed;
    await group.save();
    return { group };
}

export async function getUserGroups(userId) {
    const groups = await LeaderboardGroupModel.find({ members: userId }).lean();
    return groups;
}

export async function getGroupLeaderboard(groupId, level, category, requestingUserId) {
    const group = await LeaderboardGroupModel.findById(groupId).lean();
    if (!group) return null;

    // Verify the requesting user is a member
    if (!group.members.includes(requestingUserId)) return null;

    const model = getLeaderboardModel(level);

    const baseFilter = category === 'averageScore'
        ? { userId: { $in: group.members }, averageScore: { $ne: null } }
        : { userId: { $in: group.members } };

    const entries = await model.find(baseFilter).sort({ [category]: -1 }).lean();

    // Batch-fetch display names
    const userIds = entries.map(e => e.userId);
    const users = await WordLadderUsersModel.find(
        { id: { $in: userIds } },
        { id: 1, leaderboardName: 1, _id: 0 }
    ).lean();
    const nameMap = {};
    users.forEach(u => { nameMap[u.id] = u.leaderboardName || null; });

    const entriesWithNames = entries.map(e => ({
        ...e,
        displayName: nameMap[e.userId] || 'Anonymous',
    }));

    const userRank = entriesWithNames.findIndex(e => e.userId === requestingUserId);
    const rank = userRank === -1 ? null : userRank + 1;
    const total = entries.length;
    const percentileAhead = rank && total > 1
        ? Math.round(((total - rank) / (total - 1)) * 100)
        : rank ? 100 : null;

    const userEntry = entries.find(e => e.userId === requestingUserId);
    const userScore = userEntry ? userEntry[category] : null;
    const userDisplayName = nameMap[requestingUserId] || null;

    return {
        top10: entriesWithNames,  // all group members sorted
        total,
        userRank: rank,
        percentileAhead,
        userScore,
        userDisplayName,
        groupName: group.name,
        memberCount: group.members.length,
    };
}

/**
 * Called from deleteUser — removes the user from all groups they belong to
 * and cleans up any groups that become empty as a result.
 */
export async function cleanupUserFromGroups(userId) {
    await LeaderboardGroupModel.updateMany(
        { members: userId },
        { $pull: { members: userId } }
    );
    await LeaderboardGroupModel.deleteMany({ members: { $size: 0 } });
}
