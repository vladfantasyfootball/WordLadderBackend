import mongoose from "mongoose";

export const LevelOnePuzzlesSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
    },
    startingWord: {
        type: String,
        required: true,
    },
    endingWord: {
        type: String,
        required: true
    },
    shortestSolution: {
        type: [String],
        required: true
    }
});

// Every puzzle fetch is findOne({ id: diffDays }) — this index makes it O(log n)
LevelOnePuzzlesSchema.index({ id: 1 }, { unique: true });

export const LevelOnePuzzlesModel = mongoose.model("LevelOnePuzzles", LevelOnePuzzlesSchema, "LevelOnePuzzles");