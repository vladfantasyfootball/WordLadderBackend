import {englishWords} from "./mydictionary.js"

export const checkEnglishWord = async (word) => {
    try {
        return englishWords.has(word.toUpperCase());
    } catch (error) {
        console.log(error);
        return null;
    }
}