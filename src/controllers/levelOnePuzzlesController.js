import { LevelOnePuzzlesModel } from "../models/levelOnePuzzles.js";
import dotenv from 'dotenv'
dotenv.config();

const dateConst = process.env.DATE_CONST;
// const dateConst = Date.now();

// Remove quotes if present
const cleanDateConst = dateConst ? dateConst.replace(/"/g, '') : null;
const constReleaseDate = new Date(cleanDateConst);

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
    // Calculate puzzle day number.
    // Subtract 7 hours so the day rolls over at UTC 07:00 = 11 PM PT / 2 AM ET.
    const now = new Date();
    const today = new Date(now.getTime() - 7 * 60 * 60 * 1000);
    const releaseDate = new Date(cleanDateConst);
    
    // Get UTC midnight for both dates
    const todayUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    const releaseDateUTC = Date.UTC(releaseDate.getUTCFullYear(), releaseDate.getUTCMonth(), releaseDate.getUTCDate());
    
    // Calculate difference in calendar days
    const diffDays = Math.floor((todayUTC - releaseDateUTC) / (1000 * 60 * 60 * 24)) + 1;
    
    try {
        const levelOnePuzzle = await LevelOnePuzzlesModel.findOne({id: diffDays});
        if(levelOnePuzzle){
            return levelOnePuzzle;
        } else {
            console.error(`No puzzle found with id: ${diffDays}`);
            return null;
        }
    } catch (error) {
        console.error('Error getting level one puzzle:', error);
        return null;
    }
}