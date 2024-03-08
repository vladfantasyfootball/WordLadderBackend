import { LevelTwoPuzzlesModel } from "../models/levelTwoPuzzles.js";
import dotenv from 'dotenv'
dotenv.config();
// const dateConst = process.env.DATE_CONST;
const dateConst = Date.now();

const constReleaseDate = new Date(dateConst);

export const postLevelTwoPuzzle = async (puzzleBody) => {
    const levelTwoPuzzle = new LevelTwoPuzzlesModel(puzzleBody);
    try {
        await levelTwoPuzzle.save();
        return levelTwoPuzzle;
    } catch (error) {
        console.log(error);
        return null;
    }
}

export const getLevelTwoPuzzle = async () => {
    const currentDate = Date.now()
    const diffTime = Math.abs(currentDate - constReleaseDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    try {
        const levelTwoPuzzle = await LevelTwoPuzzlesModel.findOne({id: diffDays});
        if(levelTwoPuzzle){
            return levelTwoPuzzle;
        } else {
            return null;
        }
    } catch (error) {
        console.log(error);
        return null;
    }
}