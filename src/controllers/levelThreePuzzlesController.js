import { LevelThreePuzzlesModel } from "../models/levelThreePuzzles.js";
import dotenv from 'dotenv'
dotenv.config();
const dateConst = process.env.DATE_CONST;

// Remove quotes if present (same fix as other puzzle controllers)
const cleanDateConst = dateConst ? dateConst.replace(/"/g, '') : null;
const constReleaseDate = new Date(cleanDateConst);

export const getLevelThreePuzzle = async () => {
    // Subtract 7 hours so the day rolls over at UTC 07:00 = 11 PM PT / 2 AM ET
    const now = new Date();
    const today = new Date(now.getTime() - 7 * 60 * 60 * 1000);
    const releaseDate = new Date(constReleaseDate);

    const todayUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    const releaseDateUTC = Date.UTC(releaseDate.getUTCFullYear(), releaseDate.getUTCMonth(), releaseDate.getUTCDate());

    const diffDays = Math.floor((todayUTC - releaseDateUTC) / (1000 * 60 * 60 * 24)) + 1;
    return await LevelThreePuzzlesModel.findOne({ id: diffDays });
}
