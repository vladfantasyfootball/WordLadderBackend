import express from 'express';
import { getLevelOnePuzzle } from '../src/controllers/levelOnePuzzlesController.js';
import { getLevelTwoPuzzle } from '../src/controllers/levelTwoPuzzlesController.js';
import { postUser, getUser, updateUser } from '../src/controllers/userController.js';
import { checkEnglishWord } from '../src/controllers/englishWordsController.js';

export const router = express.Router()
 
//Post Method
router.post('/post', async (req, res) => {
    try {
        let user = await postUser(req.body);
        if(user){
            res.status(200).send(user);
        }
        else {
            res.status(500).send("Error saving user")
        }
    }
    catch {
        res.status(500).send("Error saving user")
    }
})

//Get by ID Method
router.post('/getUser', async (req, res) => {
    try {
        let user = await getUser(req.body);
        if(user){
            res.status(200).send(user);
        }
        else {
            res.status(500).send("Error retrieving user")
        }
    }
    catch(e) {
        console.log(e);
        res.status(500).send("Error retrieving user")
    }
})

//Update by ID Method
router.post('/updateUser', async (req, res) => {
    try {
        let user = await updateUser(req.body.id, req.body.userUpdate);
        if(user){
            res.status(200).send(user);
        }
        else {
            res.status(500).send("Error updating user")
        }
    }
    catch(e) {
        console.log(e);
        res.status(500).send("Error updating user")
    }
})

//Get level one puzzle by ID Method
router.get('/getPuzzles', async (req, res) => {
    try {
        let levelOnePuzzle = await getLevelOnePuzzle();
        let levelTwoPuzzle = await getLevelTwoPuzzle();

        if(levelOnePuzzle && levelTwoPuzzle){
            res.status(200).send({"one": levelOnePuzzle, "two": levelTwoPuzzle});
        }
        else {
            res.status(500).send("Error retrieving puzzles")
        }
    }
    catch(e) {
        console.log(e);
        res.status(500).send("Error retrieving puzzles")
    }
})

router.get('/checkValidEnglishWord', async (req, res) => {
    try {
        let valid = await checkEnglishWord(req.query.word)
        if(valid) {
            res.status(200).send(true);
        } else {
            res.status(200).send(false);
        }
    }
    catch(e) {
        console.log(e);
        res.status(500).send("Error checking word validity")
    }
})
