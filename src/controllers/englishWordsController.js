import { ValiidEnglishWordsModel } from "../models/englishWords.js";

export const postEnglishWord = async (word) => {
    const englishWord = new ValiidEnglishWordsModel({word});
    try {
        await englishWord.save();
    } catch (error) {
        console.log(error);
    }
}

export const checkEnglishWord = async (word) => {
    try {
        const validEnglishWord = ValiidEnglishWordsModel.findOne({word: word.toUpperCase()})
        if(validEnglishWord){
            return validEnglishWord;
        } else {
            return null;
        }
    } catch (error) {
        console.log(error);
        return null;
    }
}