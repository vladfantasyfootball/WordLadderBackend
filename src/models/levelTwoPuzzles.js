import mongoose from "mongoose";

export const LevelTwoPuzzlesSchema = new mongoose.Schema({
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

export const LevelTwoPuzzlesModel = mongoose.model("LevelTwoPuzzles", LevelTwoPuzzlesSchema, "LevelTwoPuzzles");