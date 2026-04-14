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
                "lastAttempted": null,
                "totalScore": 0,
                "highScore": 0,
                "totalAttempted": 0,
                "totalSolved": 0,
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
                "lastAttempted": null,
                "totalScore": 0,
                "highScore": 0,
                "totalAttempted": 0,
                "totalSolved": 0,
            },
            "three": {
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
                "lastAttempted": null,
                "totalScore": 0,
                "highScore": 0,
                "totalAttempted": 0,
                "totalSolved": 0,
            }
        }
    },
    purchases: {
        type: Object,
        required: true,
        default: {
            "premium": false,
        }
    },
    notifications: {
        type: Object,
        required: true,
        default: {
            enabled: false,
            expoPushToken: null,
            hasBeenAskedForNotifications: false
        }
    },
    review: {
        type: Object,
        required: false,
        default: {
            lastPromptedAt: 0
        }
    },
    leaderboardName: {
        type: String,
        default: null,
    }
});

export const WordLadderUsersModel = mongoose.model("WordLadderUsers", WordLadderUsersSchema, "WordLadderUsers");
