import Joi from 'joi';

// Schema for word ladder level data
const wordLadderLevelSchema = Joi.object({
    currentWordLadder: Joi.object({
        currentPuzzle: Joi.number().allow(null).optional(),
        currentAttempt: Joi.array().items(Joi.string()).required(),
        completed: Joi.boolean().required()
    }).required(),
    timeStarted: Joi.number().allow(null).optional(),
    timeFinished: Joi.number().allow(null).optional(),
    currentStreak: Joi.number().min(0).required(),
    longestStreak: Joi.number().min(0).required(),
    lastSolved: Joi.number().allow(null).optional(),
    totalScore: Joi.number().min(0).required(),
    highScore: Joi.number().min(0).required()
});

// Schema for ad data
const adSchema = Joi.object({
    adWatched: Joi.boolean().required(),
    dateWatched: Joi.string().allow(null).optional()
});

// Main user update schema
export const userUpdateSchema = Joi.object({
    id: Joi.string().required(),
    wordLadder: Joi.object({
        one: wordLadderLevelSchema.required(),
        two: wordLadderLevelSchema.required(),
        three: wordLadderLevelSchema.optional()
    }).required(),
    ad: adSchema.optional()
}).unknown(false); // Don't allow unknown fields

// Validation middleware
export const validateUserUpdate = (req, res, next) => {
    const { error } = userUpdateSchema.validate(req.body.userUpdate, { 
        abortEarly: false, // Show all errors, not just first
        stripUnknown: true // Remove unknown fields
    });

    if (error) {
        const errorMessages = error.details.map(detail => detail.message);
        return res.status(400).json({ 
            error: 'Invalid user data',
            details: errorMessages 
        });
    }

    next();
};
