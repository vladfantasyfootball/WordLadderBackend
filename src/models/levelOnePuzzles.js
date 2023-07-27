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
    }
});

export const LevelOnePuzzlesModel = mongoose.model("LevelOnePuzzles", LevelOnePuzzlesSchema, "LevelOnePuzzles");