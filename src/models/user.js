import mongoose from "mongoose";

export const WordLadderUsersSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
    },
    ad: {
        type: Object,
        required: true,
        default: {
            adWatched: false,
            dateWatched: null
        }
    },
    wordLadder: {
        type: Object,
        required: true,
        default: {
            "one": {
                "currentWordLadder": {
                    "currentPuzzle": null,
                    "currentAttempt": [],
                    "completed": false
                },
                "timeStarted": null,
                "timeFinished": null,
                "currentStreak": 0,
                "longestStreak": 0,
                "lastSolved": null,
                "totalScore": 0,
                "highScore": 0,
            },
            "two": {
                "currentWordLadder": {
                    "currentPuzzle": null,
                    "currentAttempt": [],
                    "completed": false
                },
                "timeStarted": null,
                "timeFinished": null,
                "currentStreak": 0,
                "longestStreak": 0,
                "lastSolved": null,
                "totalScore": 0,
                "highScore": 0,
            }
        }
    },
    purchases: {
        type: Object,
        required: true,
        default: {
            "level2": false,
            "noAdds": false,
        }
    }
});

export const WordLadderUsersModel = mongoose.model("WordLadderUsers", WordLadderUsersSchema, "WordLadderUsers");
