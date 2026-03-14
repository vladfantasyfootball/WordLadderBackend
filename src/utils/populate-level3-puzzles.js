import { LevelThreePuzzlesModel } from '../models/levelThreePuzzles.js';
import { englishWords } from '../controllers/conciseEnglishWords.js';
import { getRandomWord } from './populateValidEnglishWordsCollection.js';

const MIN_WORD_LENGTH = 3;
const MAX_WORD_LENGTH = 6;

// Start word is always 4 letters; end word is 5 or 6 letters
// Intermediate steps can also be 4-6 letters
const MIN_PUZZLE_WORD_LENGTH = 4;
const MAX_PUZZLE_WORD_LENGTH = 6;

/**
 * Returns all valid words reachable from `word` in one step.
 * Level 3 allows four move types:
 *   1. Single-letter substitution  (HEAT → HEAD)
 *   2. Single-letter insertion      (HEAT → HEART, CHEAT)
 *   3. Single-letter deletion       (HEAT → HAT, EAT)
 *   4. Anagram / rearrangement      (HEAT → HATE, HAET)
 * All resulting words must be 4-6 letters and in the dictionary.
 */
const getNeighbors = (word) => {
    const neighbors = [];
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    // 1. Substitutions — same length
    for (let pos = 0; pos < word.length; pos++) {
        for (const letter of alphabet) {
            if (letter === word[pos]) continue;
            const newWord = word.slice(0, pos) + letter + word.slice(pos + 1);
            if (englishWords.has(newWord)) neighbors.push(newWord);
        }
    }

    // 2. Insertions — length + 1 (only if result stays within 4-5 letters)
    if (word.length < MAX_PUZZLE_WORD_LENGTH) {
        for (let pos = 0; pos <= word.length; pos++) {
            for (const letter of alphabet) {
                const newWord = word.slice(0, pos) + letter + word.slice(pos);
                if (englishWords.has(newWord)) neighbors.push(newWord);
            }
        }
    }

    // 3. Deletions — length - 1 (only if result stays within 4-5 letters)
    if (word.length > MIN_PUZZLE_WORD_LENGTH) {
        for (let pos = 0; pos < word.length; pos++) {
            const newWord = word.slice(0, pos) + word.slice(pos + 1);
            if (englishWords.has(newWord)) neighbors.push(newWord);
        }
    }

    // 4. Anagrams — same length, same letters rearranged
    const sorted = word.split('').sort().join('');
    for (const candidate of englishWords) {
        if (candidate === word) continue;
        if (candidate.length !== word.length) continue;
        if (candidate.split('').sort().join('') === sorted) {
            neighbors.push(candidate);
        }
    }

    return neighbors;
};

/**
 * Bidirectional BFS solver supporting substitutions, insertions, deletions, and anagrams.
 * Returns { possible, path, steps } where path is the full word sequence.
 */
const findWordLadderLevel3 = (startWord, endWord, maxDepth = 20) => {
    startWord = startWord.toUpperCase().trim();
    endWord = endWord.toUpperCase().trim();

    if (startWord === endWord) {
        return { possible: true, path: [startWord], steps: 0 };
    }

    const forwardQueue = [startWord];
    const backwardQueue = [endWord];
    const forwardVisited = new Set([startWord]);
    const backwardVisited = new Set([endWord]);
    const forwardParents = new Map();
    const backwardParents = new Map();

    let depth = 0;

    while ((forwardQueue.length > 0 || backwardQueue.length > 0) && depth < maxDepth) {
        depth++;

        // Expand the smaller frontier
        const expandForward = forwardQueue.length <= backwardQueue.length;
        const currentQueue = expandForward ? forwardQueue : backwardQueue;
        const currentVisited = expandForward ? forwardVisited : backwardVisited;
        const currentParents = expandForward ? forwardParents : backwardParents;
        const otherVisited = expandForward ? backwardVisited : forwardVisited;
        const otherParents = expandForward ? backwardParents : forwardParents;

        const levelSize = currentQueue.length;

        for (let i = 0; i < levelSize; i++) {
            const currentWord = currentQueue.shift();
            const neighbors = getNeighbors(currentWord);

            for (const newWord of neighbors) {
                if (currentVisited.has(newWord)) continue;

                if (otherVisited.has(newWord)) {
                    // Meeting point found — reconstruct full path
                    let forwardPath, backwardPath;

                    if (expandForward) {
                        forwardPath = reconstructPath(forwardParents, startWord, currentWord);
                        forwardPath.push(newWord);
                        backwardPath = reconstructPath(backwardParents, endWord, newWord);
                        backwardPath.reverse();
                        backwardPath.shift();
                    } else {
                        forwardPath = reconstructPath(forwardParents, startWord, newWord);
                        backwardPath = reconstructPath(backwardParents, endWord, currentWord);
                        backwardPath.push(newWord);
                        backwardPath.reverse();
                        backwardPath.shift();
                    }

                    const fullPath = forwardPath.concat(backwardPath);
                    if (fullPath.length - 1 <= maxDepth) {
                        return { possible: true, path: fullPath, steps: fullPath.length - 1 };
                    }
                }

                currentVisited.add(newWord);
                currentParents.set(newWord, currentWord);
                currentQueue.push(newWord);
            }
        }

        if (depth >= maxDepth) break;
    }

    return { possible: false, path: null, steps: 0 };
};

const reconstructPath = (parents, startWord, endWord) => {
    const path = [];
    let current = endWord;

    while (current !== startWord) {
        path.unshift(current);
        current = parents.get(current);
        if (!current) break;
    }
    path.unshift(startWord);

    return path;
};

/**
 * Generates `targetCount` Level 3 puzzles.
 * Requirements:
 *   - Start word is always 4 letters, end word is 5 or 6 letters
 *   - Shortest solution must be >= 7 steps
 *   - All words (including intermediates) must be 4-6 letters
 */
const generateRandomPuzzlesLevel3 = (targetCount = 10, startingId = 1) => {
    const puzzles = [];
    const used = new Set();
    let currentId = startingId;
    let attempts = 0;

    while (puzzles.length < targetCount) {
        attempts++;

        // Start word is always 4 letters; end word is randomly 5 or 6 letters
        const startLength = 4;
        const endLength = Math.random() < 0.5 ? 5 : 6;

        const start = getRandomWord({ minLength: startLength, maxLength: startLength });
        const end = getRandomWord({ minLength: endLength, maxLength: endLength });

        if (end.endsWith('S')) continue;

        const key = `${start}-${end}`;
        if (used.has(key)) continue;

        console.log(`[${puzzles.length + 1}/${targetCount}] Attempt ${attempts}: trying ${start} (${start.length}) → ${end} (${end.length})`);

        const result = findWordLadderLevel3(start, end);

        if (result.possible && result.steps >= 5) {
            const fourLetterCount = result.path.filter(w => w.length === 4).length;
            const fiveLetterCount = result.path.filter(w => w.length === 5).length;
            const hasEnoughVariety = fourLetterCount >= 2 && fiveLetterCount >= 2;

            if (hasEnoughVariety) {
                puzzles.push({
                    id: currentId++,
                    startingWord: start,
                    endingWord: end,
                    shortestSolution: result.path,
                });
                used.add(key);
                used.add(`${end}-${start}`);
                console.log(`  ✅ Accepted! Steps: ${result.steps}, 4-letter: ${fourLetterCount}, 5-letter: ${fiveLetterCount}, path: ${result.path.join(' → ')}`);
            } else {
                console.log(`  ✗ Rejected — not enough word variety (4-letter: ${fourLetterCount}, 5-letter: ${fiveLetterCount})`);
            }
        } else if (result.possible) {
            console.log(`  ✗ Rejected — too short (${result.steps} steps)`);
        } else {
            console.log(`  ✗ Rejected — no path found`);
        }
    }

    console.log(`\nGenerated ${puzzles.length} puzzles in ${attempts} attempts`);
    return puzzles;
};

export const addNewPuzzlesToCollection3 = async (puzzleCount = 25) => {
    try {
        console.log('Starting Level 3 puzzle generation...');

        const lastPuzzle = await LevelThreePuzzlesModel.findOne().sort({ id: -1 });
        const startingId = lastPuzzle ? lastPuzzle.id + 1 : 1;

        const puzzles = generateRandomPuzzlesLevel3(puzzleCount, startingId);
        console.log(`Generated ${puzzles.length} puzzles starting from ID ${startingId}`);

        const result = await LevelThreePuzzlesModel.insertMany(puzzles);
        console.log(`Successfully added ${result.length} new puzzles to database`);

        return {
            success: true,
            count: result.length,
            startingId,
            message: `Successfully added ${result.length} Level 3 puzzles starting from ID ${startingId}`
        };
    } catch (error) {
        console.error('Error adding Level 3 puzzles:', error);
        return {
            success: false,
            error: error.message,
            message: 'Failed to add Level 3 puzzles to database'
        };
    }
};

export {
    findWordLadderLevel3,
    generateRandomPuzzlesLevel3,
    getNeighbors,
};
