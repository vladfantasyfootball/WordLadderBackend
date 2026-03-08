import express from 'express';
import { getLevelOnePuzzle } from '../src/controllers/levelOnePuzzlesController.js';
import { getLevelTwoPuzzle } from '../src/controllers/levelTwoPuzzlesController.js';
import { postUser, getUser, updateUser } from '../src/controllers/userController.js';
import { verifyToken } from '../src/middleware/auth.js';
import { validateUserUpdate } from '../src/validation/userValidation.js';
import { sendDailyPuzzleNotifications } from '../src/services/notificationService.js';

export const router = express.Router()
 
//Post Method
router.post('/post', verifyToken, async (req, res) => {
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
router.post('/getUser', verifyToken, async (req, res) => {
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
router.post('/updateUser', verifyToken, validateUserUpdate, async (req, res) => {
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
router.get('/getPuzzles', verifyToken, async (req, res) => {
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

// Test endpoint to manually trigger notifications (for testing)
router.post('/testNotifications', verifyToken, async (req, res) => {
    try {
        console.log('Manual notification test triggered');
        await sendDailyPuzzleNotifications();
        res.status(200).send({ message: "Notifications sent successfully" });
    }
    catch(e) {
        console.log(e);
        res.status(500).send("Error sending notifications")
    }
})
