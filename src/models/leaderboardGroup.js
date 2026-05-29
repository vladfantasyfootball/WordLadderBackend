import mongoose from "mongoose";

const leaderboardGroupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 30,
    },
    createdBy: {
        type: String,
        required: true,
    },
    members: {
        type: [String],
        default: [],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Multikey index — one index entry per member per group, enables fast $in queries
leaderboardGroupSchema.index({ members: 1 });

export const LeaderboardGroupModel = mongoose.model(
    "LeaderboardGroup",
    leaderboardGroupSchema,
    "LeaderboardGroups"
);
