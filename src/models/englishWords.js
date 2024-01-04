import mongoose from "mongoose";

export const ValidEnglishWordsSchema = new mongoose.Schema({
    word: String
});

export const ValiidEnglishWordsModel = mongoose.model("ValidEnglishWords", ValidEnglishWordsSchema, "ValidEnglishWords");