import { LevelTwoPuzzlesModel } from "../models/levelTwoPuzzles.js";
import dotenv from 'dotenv'
dotenv.config();
const dateConst = process.env.DATE_CONST;
// const dateConst = Date.now();

// Remove quotes if present
const cleanDateConst = dateConst ? dateConst.replace(/"/g, '') : null;
const constReleaseDate = new Date(cleanDateConst);

export const postLevelTwoPuzzle = async (puzzleBody) => {
    const levelTwoPuzzle = new LevelTwoPuzzlesModel(puzzleBody);
    try {
        await levelTwoPuzzle.save();
        return levelTwoPuzzle;
    } catch (error) {
        console.error('Error saving level two puzzle:', error);
        return null;
    }
}

export const getLevelTwoPuzzle = async () => {
    // Calculate puzzle day number based on UTC calendar days
    const today = new Date();
    const releaseDate = new Date(cleanDateConst);
    
    // Get UTC midnight for both dates
    const todayUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    const releaseDateUTC = Date.UTC(releaseDate.getUTCFullYear(), releaseDate.getUTCMonth(), releaseDate.getUTCDate());
    
    // Calculate difference in calendar days
    const diffDays = Math.floor((todayUTC - releaseDateUTC) / (1000 * 60 * 60 * 24)) + 1;
    
    try {
        const levelTwoPuzzle = await LevelTwoPuzzlesModel.findOne({id: diffDays});
        if(levelTwoPuzzle){
            return levelTwoPuzzle;
        } else {
            console.error(`No puzzle found with id: ${diffDays}`);
            return null;
        }
    } catch (error) {
        console.error('Error getting level two puzzle:', error);
        return null;
    }
}