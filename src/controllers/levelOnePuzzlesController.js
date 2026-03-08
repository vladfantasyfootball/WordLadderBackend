import { LevelOnePuzzlesModel } from "../models/levelOnePuzzles.js";
import dotenv from 'dotenv'
dotenv.config();

const dateConst = process.env.DATE_CONST;
// const dateConst = Date.now();

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
    // Calculate puzzle day number based on UTC calendar days
    const today = new Date();
    const releaseDate = new Date(constReleaseDate);
    
    // Get UTC midnight for both dates
    const todayUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    const releaseDateUTC = Date.UTC(releaseDate.getUTCFullYear(), releaseDate.getUTCMonth(), releaseDate.getUTCDate());
    
    // Calculate difference in calendar days
    const diffDays = Math.floor((todayUTC - releaseDateUTC) / (1000 * 60 * 60 * 24)) + 1;
    console.log(diffDays)
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