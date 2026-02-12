import { WordLadderUsersModel } from "../models/user.js";
import dotenv from 'dotenv'
dotenv.config();
// const dateConst = process.env.DATE_CONST;
const dateConst = Date.now();
const constReleaseDate = new Date(dateConst);


export const postUser = async (userBody) => {
    const user = new WordLadderUsersModel(userBody);
    try {
        await user.save();
        return user;
    } catch (error) {
        console.log(error);
        return null;
    }
}

export const getUser = async (userBody) => {
    try {
        const currentDate = Date.now()
        const diffTime = Math.abs(currentDate - constReleaseDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const user = await WordLadderUsersModel.findOne({id: userBody.id});
        if(user){
            const newUser = JSON.parse(JSON.stringify(user.toJSON()))
            if(user?.wordLadder?.one?.currentWordLadder?.currentPuzzle !== diffDays){
                newUser.wordLadder.one.currentWordLadder.currentPuzzle = diffDays;
                newUser.wordLadder.one.currentWordLadder.currentAttempt = [];
                newUser.wordLadder.one.currentWordLadder.completed = false;
                newUser.wordLadder.one.timeStarted = null;
                newUser.wordLadder.one.timeFinished = null;
            } else if (user?.wordLadder?.two?.currentWordLadder?.currentPuzzle !== diffDays){
                newUser.wordLadder.two.currentWordLadder.currentPuzzle = diffDays;
                newUser.wordLadder.two.currentWordLadder.currentAttempt = [];
                newUser.wordLadder.two.currentWordLadder.completed = false;
                newUser.wordLadder.two.timeStarted = null;
                newUser.wordLadder.two.timeFinished = null;
            }
            
            if(user?.wordLadder?.one?.lastSolved !== diffDays - 1 && user?.wordLadder?.one?.lastSolved !== diffDays){
                newUser.wordLadder.one.currentStreak = 0;
            } else if(user?.wordLadder?.two?.lastSolved !== diffDays - 1 && user?.wordLadder?.two?.lastSolved !== diffDays){
                newUser.wordLadder.two.currentStreak = 0;
            } 

            if(user?.ad?.adWatched && user?.ad?.dateWatched !== new Date().toLocaleString().split(',')[0]) {
                newUser.ad.adWatched = false;
                newUser.ad.dateWatched = null;
            }
            updateUser(user.id, newUser)
            return newUser
        } else {
            return await postUser(userBody)
        }
    } catch (error) {
        console.log(error);
        return null;
    }
}

export const updateUser = async (userId, userUpdate) => {
    try{
        const user = await WordLadderUsersModel.findOneAndUpdate({id: userId}, userUpdate)
        return user
    } catch (error) {
        console.log(error);
        return null;
    }
}