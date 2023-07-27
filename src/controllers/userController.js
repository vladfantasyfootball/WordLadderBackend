import { WordLadderUsersModel } from "../models/user.js";
import dotenv from 'dotenv'
dotenv.config();
const dateConst = process.env.DATE_CONST;

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
            let newUser = {...user.toJSON()};
            if(user?.wordLadder?.one?.lastSolved !== diffDays - 1){
                newUser.wordLadder.one.currentStreak = 0;
            } else if(user?.wordLadder?.two?.lastSolved !== diffDays - 1){
                newUser.wordLadder.two.currentStreak = 0;
            }
            return newUser;
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