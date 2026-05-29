import { LeaderboardOneModel, LeaderboardTwoModel, LeaderboardThreeModel } from '../models/leaderboard.js';
import { WordLadderUsersModel } from '../models/user.js';

const AVG_SCORE_MIN_SOLVED = 7;

function getModel(level) {
    if (level === 'one') return LeaderboardOneModel;
    if (level === 'two') return LeaderboardTwoModel;
    if (level === 'three') return LeaderboardThreeModel;
    throw new Error(`Invalid level: ${level}`);
}

/**
 * Upsert a user's leaderboard entry for a given level.
 * Called on every puzzle completion.
 */
export async function upsertLeaderboardEntry(userId, level, stats) {
    const { totalScore, totalSolved, currentStreak, longestStreak } = stats;
    const model = getModel(level);

    const averageScore = totalSolved >= AVG_SCORE_MIN_SOLVED
        ? Math.round((totalScore / totalSolved) * 10) / 10
        : null;

    await model.findOneAndUpdate(
        { userId },
        {
            $set: {
                userId,
                totalScore,
                averageScore,
                currentStreak,
                longestStreak,
                totalSolved,
                lastUpdated: new Date(),
            },
        },
        { upsert: true, new: true }
    );
}

/**
 * Returns the top-10 entries and the requesting user's rank/percentile
 * for a given level and category.
 *
 * category: 'totalScore' | 'averageScore' | 'currentStreak' | 'longestStreak' | 'totalSolved'
 */
export async function getLeaderboard(level, category, userId) {
    const model = getModel(level);

    const sortField = { [category]: -1 };

    // For averageScore, only include users who have met the threshold
    const baseFilter = category === 'averageScore'
        ? { averageScore: { $ne: null } }
        : {};

    const [top10, total, userEntry] = await Promise.all([
        model.find(baseFilter).sort(sortField).limit(5).lean(),
        model.countDocuments(baseFilter),
        model.findOne({ userId, ...baseFilter }).lean(),
    ]);

    if (!userEntry || total === 0) {
        return { top10, total, userRank: null, percentileAhead: null };
    }

    const userScore = userEntry[category];

    // Count how many users score strictly higher than this user
    const countAbove = await model.countDocuments({
        ...baseFilter,
        [category]: { $gt: userScore },
    });

    const userRank = countAbove + 1;
    // "ahead of X%" — always framed positively
    const percentileAhead = total > 1
        ? Math.round(((total - userRank) / (total - 1)) * 100)
        : 100;

    // Batch-fetch display names for the top entries
    const topUserIds = top10.map(e => e.userId);
    const allIds = userEntry ? [...new Set([...topUserIds, userId])] : topUserIds;
    const users = await WordLadderUsersModel.find(
        { id: { $in: allIds } },
        { id: 1, leaderboardName: 1, _id: 0 }
    ).lean();
    const nameMap = {};
    users.forEach(u => { nameMap[u.id] = u.leaderboardName || null; });

    const top10WithNames = top10.map(e => ({ ...e, displayName: nameMap[e.userId] || 'Anonymous' }));
    const userDisplayName = nameMap[userId] || null;

    return { top10: top10WithNames, total, userRank, percentileAhead, userScore, userDisplayName };
}

// ── Daily leaderboard helpers ─────────────────────────────────────────────────

function getTodaysPuzzleId() {
    const dateConst = process.env.DATE_CONST;
    const cleanDateConst = dateConst ? dateConst.replace(/"/g, '') : null;
    const now = new Date();
    const today = new Date(now.getTime() - 7 * 60 * 60 * 1000);
    const releaseDate = new Date(cleanDateConst);
    const todayUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    const releaseDateUTC = Date.UTC(releaseDate.getUTCFullYear(), releaseDate.getUTCMonth(), releaseDate.getUTCDate());
    return Math.floor((todayUTC - releaseDateUTC) / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Saves today's round score to the leaderboard document.
 * No-ops if puzzleId doesn't match today's puzzle (stale submit guard).
 */
export async function upsertDailyScore(userId, level, puzzleId, score) {
    const todaysPuzzleId = getTodaysPuzzleId();
    if (puzzleId !== todaysPuzzleId) return;
    const model = getModel(level);
    await model.findOneAndUpdate(
        { userId },
        { $set: { dailyScore: { puzzleId, score, completedAt: new Date() } } },
        { upsert: true }
    );
}

/**
 * Returns top-5 daily scores for today's puzzle and the requesting user's rank.
 * Pass groupMemberIds to scope to a private group.
 */
export async function getDailyLeaderboard(level, userId, groupMemberIds = null) {
    const model = getModel(level);
    const todaysPuzzleId = getTodaysPuzzleId();

    const filter = {
        'dailyScore.puzzleId': todaysPuzzleId,
        ...(groupMemberIds ? { userId: { $in: groupMemberIds } } : {}),
    };

    const query = model.find(filter).sort({ 'dailyScore.score': -1 });
    if (!groupMemberIds) query.limit(5);

    const [top5, total, userEntry] = await Promise.all([
        query.lean(),
        model.countDocuments(filter),
        model.findOne({ userId, 'dailyScore.puzzleId': todaysPuzzleId }).lean(),
    ]);

    const topUserIds = top5.map(e => e.userId);
    const allIds = userEntry ? [...new Set([...topUserIds, userId])] : topUserIds;
    const users = await WordLadderUsersModel.find(
        { id: { $in: allIds } },
        { id: 1, leaderboardName: 1, _id: 0 }
    ).lean();
    const nameMap = {};
    users.forEach(u => { nameMap[u.id] = u.leaderboardName || null; });

    const top5WithNames = top5.map(e => ({
        ...e,
        [level === 'one' || level === 'two' || level === 'three' ? 'dailyScore' : 'dailyScore']: e.dailyScore,
        displayName: nameMap[e.userId] || 'Anonymous',
    }));

    if (!userEntry || total === 0) {
        return { top10: top5WithNames, total, userRank: null, percentileAhead: null, userScore: null, userDisplayName: nameMap[userId] || null };
    }

    const userScore = userEntry.dailyScore.score;
    const countAbove = await model.countDocuments({
        ...filter,
        'dailyScore.score': { $gt: userScore },
    });
    const userRank = countAbove + 1;
    const percentileAhead = total > 1
        ? Math.round(((total - userRank) / (total - 1)) * 100)
        : 100;
    const userDisplayName = nameMap[userId] || null;

    return { top10: top5WithNames, total, userRank, percentileAhead, userScore, userDisplayName };
}
