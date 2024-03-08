import { LevelOnePuzzlesModel } from "../models/levelOnePuzzles.js";
import dotenv from 'dotenv'
dotenv.config();

// const dateConst = process.env.DATE_CONST;
const dateConst = Date.now();

const constReleaseDate = new Date(dateConst);

export const postLevelOnePuzzle = async (puzzleBody) => {
    const levelOnePuzzle = new LevelOnePuzzlesModel(puzzleBody);
    try {
        await levelOnePuzzle.save();
        return levelOnePuzzle;
    } catch (error) {
        console.log(error);
        return null;
    }
}

export const getLevelOnePuzzle = async () => {
    const currentDate = Date.now()
    const diffTime = Math.abs(currentDate - constReleaseDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    try {
        const levelOnePuzzle = await LevelOnePuzzlesModel.findOne({id: diffDays});
        if(levelOnePuzzle){
            return levelOnePuzzle;
        } else {
            return null;
        }
    } catch (error) {
        console.log(error);
        return null;
    }
}