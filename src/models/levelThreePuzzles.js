import mongoose from "mongoose";

export const LevelThreePuzzlesSchema = new mongoose.Schema({
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

export const LevelThreePuzzlesModel = mongoose.model("LevelThreePuzzles", LevelThreePuzzlesSchema, "LevelThreePuzzles");
