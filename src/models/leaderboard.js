import mongoose from "mongoose";

const leaderboardSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
    },
    totalScore: {
        type: Number,
        required: true,
        default: 0,
    },
    averageScore: {
        type: Number,
        default: null,
    },
    currentStreak: {
        type: Number,
        required: true,
        default: 0,
    },
    longestStreak: {
        type: Number,
        required: true,
        default: 0,
    },
    totalSolved: {
        type: Number,
        required: true,
        default: 0,
    },
    lastUpdated: {
        type: Date,
        default: Date.now,
    },
    dailyScore: {
        puzzleId: { type: Number, default: null },
        score:    { type: Number, default: null },
        completedAt: { type: Date, default: null },
    },
});

leaderboardSchema.index({ totalScore: -1 });
leaderboardSchema.index({ averageScore: -1 });
leaderboardSchema.index({ currentStreak: -1 });
leaderboardSchema.index({ longestStreak: -1 });
leaderboardSchema.index({ totalSolved: -1 });
leaderboardSchema.index({ 'dailyScore.puzzleId': 1, 'dailyScore.score': -1 });

export const LeaderboardOneModel = mongoose.model("LeaderboardOne", leaderboardSchema, "LeaderboardOne");
export const LeaderboardTwoModel = mongoose.model("LeaderboardTwo", leaderboardSchema, "LeaderboardTwo");
export const LeaderboardThreeModel = mongoose.model("LeaderboardThree", leaderboardSchema, "LeaderboardThree");
