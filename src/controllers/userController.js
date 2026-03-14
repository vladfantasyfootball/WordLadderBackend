import { WordLadderUsersModel } from "../models/user.js";
import dotenv from 'dotenv'
dotenv.config();
const dateConst = process.env.DATE_CONST;
// const dateConst = Date.now();

// Remove quotes if present (same fix as puzzle controllers)
const cleanDateConst = dateConst ? dateConst.replace(/"/g, '') : null;
const constReleaseDate = new Date(cleanDateConst);


export const postUser = async (userBody) => {
    const user = new WordLadderUsersModel(userBody);
    try {
        await user.save();
        return user;
    } catch (error) {
        console.error('Error saving user:', error);
        return null;
    }
}

export const getUser = async (userBody) => {
    try {
        // Calculate puzzle day number.
        // Subtract 7 hours so the day rolls over at UTC 07:00 = 11 PM PT / 2 AM ET.
        const now = new Date();
        const today = new Date(now.getTime() - 7 * 60 * 60 * 1000);
        const releaseDate = new Date(constReleaseDate);
        
        // Get UTC midnight for both dates
        const todayUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
        const releaseDateUTC = Date.UTC(releaseDate.getUTCFullYear(), releaseDate.getUTCMonth(), releaseDate.getUTCDate());
        
        // Calculate difference in calendar days
        const diffDays = Math.floor((todayUTC - releaseDateUTC) / (1000 * 60 * 60 * 24)) + 1;
        const user = await WordLadderUsersModel.findOne({id: userBody.id});
        if(user){
            const newUser = JSON.parse(JSON.stringify(user.toJSON()))
            if(user?.wordLadder?.one?.currentWordLadder?.currentPuzzle !== diffDays){
                newUser.wordLadder.one.currentWordLadder.currentPuzzle = diffDays;
                newUser.wordLadder.one.currentWordLadder.currentAttempt = [];
                newUser.wordLadder.one.currentWordLadder.completed = false;
                newUser.wordLadder.one.timeStarted = null;
                newUser.wordLadder.one.timeFinished = null;
            }
            if (user?.wordLadder?.two?.currentWordLadder?.currentPuzzle !== diffDays){
                newUser.wordLadder.two.currentWordLadder.currentPuzzle = diffDays;
                newUser.wordLadder.two.currentWordLadder.currentAttempt = [];
                newUser.wordLadder.two.currentWordLadder.completed = false;
                newUser.wordLadder.two.timeStarted = null;
                newUser.wordLadder.two.timeFinished = null;
            }
            if (user?.wordLadder?.three?.currentWordLadder?.currentPuzzle !== diffDays){
                newUser.wordLadder.three = newUser.wordLadder.three || {
                    currentWordLadder: { currentPuzzle: null, currentAttempt: [], completed: false },
                    timeStarted: null, timeFinished: null,
                    currentStreak: 0, longestStreak: 0,
                    lastSolved: null, lastAttempted: null,
                    totalScore: 0, highScore: 0,
                    totalAttempted: 0, totalSolved: 0,
                };
                newUser.wordLadder.three.currentWordLadder.currentPuzzle = diffDays;
                newUser.wordLadder.three.currentWordLadder.currentAttempt = [];
                newUser.wordLadder.three.currentWordLadder.completed = false;
                newUser.wordLadder.three.timeStarted = null;
                newUser.wordLadder.three.timeFinished = null;
            }
            
            if(user?.wordLadder?.one?.lastSolved !== diffDays - 1 && user?.wordLadder?.one?.lastSolved !== diffDays){
                newUser.wordLadder.one.currentStreak = 0;
            }
            if(user?.wordLadder?.two?.lastSolved !== diffDays - 1 && user?.wordLadder?.two?.lastSolved !== diffDays){
                newUser.wordLadder.two.currentStreak = 0;
            }
            if(newUser.wordLadder.three && user?.wordLadder?.three?.lastSolved !== diffDays - 1 && user?.wordLadder?.three?.lastSolved !== diffDays){
                newUser.wordLadder.three.currentStreak = 0;
            } 

            // Get shifted date as YYYY-MM-DD — matches puzzle day boundary (UTC 07:00 = 11 PM PT)
            const currentUTCDate = today.toISOString().split('T')[0];
            
            if(user?.ad?.adWatched && user?.ad?.dateWatched !== currentUTCDate) {
                newUser.ad.adWatched = false;
                newUser.ad.dateWatched = null;
            }
            updateUser(user.id, newUser)
            return newUser
        } else {
            const newUser = await postUser(userBody);
            if (!newUser) return null;
            // Set the correct puzzle day immediately so the frontend never sees currentPuzzle: null
            const newUserObj = JSON.parse(JSON.stringify(newUser.toJSON()));
            newUserObj.wordLadder.one.currentWordLadder.currentPuzzle = diffDays;
            newUserObj.wordLadder.two.currentWordLadder.currentPuzzle = diffDays;
            newUserObj.wordLadder.three.currentWordLadder.currentPuzzle = diffDays;
            updateUser(newUser.id, newUserObj);
            return newUserObj;
        }
    } catch (error) {
        console.error('Error getting user:', error);
        return null;
    }
}

export const updateUser = async (userId, userUpdate) => {
    try{
        // Explicitly exclude fields that must never be changed via this endpoint
        const { purchases, _id, __v, ...safeUpdate } = userUpdate;
        const user = await WordLadderUsersModel.findOneAndUpdate({id: userId}, { $set: safeUpdate }, {new: true})
        return user
    } catch (error) {
        console.log(error);
        return null;
    }
}