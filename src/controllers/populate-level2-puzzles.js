import { LevelTwoPuzzlesModel } from '../models/levelTwoPuzzles.js';
import {englishWords} from './mydictionary.js';
import { getRandomWord } from './populateValidEnglishWordsCollection.js';

// Helper function to get all valid anagrams of a word
const getAnagrams = (word) => {
    const sorted = word.split('').sort().join('');
    const anagrams = [];
    
    // Check all words in englishWords that have the same letters
    for (const candidate of englishWords) {
      if (candidate === word) continue; // Skip the same word
      if (candidate.length !== word.length) continue;
      
      const candidateSorted = candidate.split('').sort().join('');
      if (candidateSorted === sorted) {
        anagrams.push(candidate);
      }
    }
    
    return anagrams;
  };
  
  // Helper function to get all single-letter changes
  const getSingleLetterChanges = (word) => {
    const changes = [];
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    
    for (let pos = 0; pos < word.length; pos++) {
      for (const letter of alphabet) {
        if (letter === word[pos]) continue;
        
        const newWord = word.slice(0, pos) + letter + word.slice(pos + 1);
        if (englishWords.has(newWord)) {
          changes.push(newWord);
        }
      }
    }
    
    return changes;
  };
  
  const findWordLadderWithAnagrams = (startWord, endWord, maxDepth = 10) => {
    startWord = startWord.toUpperCase().trim();
    endWord = endWord.toUpperCase().trim();
    
    if (startWord.length !== endWord.length) {
      return { possible: false, path: null, steps: 0 };
    }
    
    if (startWord === endWord) {
      return { possible: true, path: [startWord], steps: 0 };
    }
    
    // Two-ended search
    const forwardQueue = [startWord];
    const backwardQueue = [endWord];
    const forwardVisited = new Set([startWord]);
    const backwardVisited = new Set([endWord]);
    const forwardParents = new Map();
    const backwardParents = new Map();
    
    let depth = 0;
    
    while ((forwardQueue.length > 0 || backwardQueue.length > 0) && depth < maxDepth) {
      depth++;
      
      // Always expand the smaller frontier
      const expandForward = forwardQueue.length <= backwardQueue.length;
      const currentQueue = expandForward ? forwardQueue : backwardQueue;
      const currentVisited = expandForward ? forwardVisited : backwardVisited;
      const currentParents = expandForward ? forwardParents : backwardParents;
      const otherVisited = expandForward ? backwardVisited : forwardVisited;
      const otherParents = expandForward ? backwardParents : forwardParents;
      
      const levelSize = currentQueue.length;
      
      for (let i = 0; i < levelSize; i++) {
        const currentWord = currentQueue.shift();
        
        // Get all possible next words (single-letter changes + anagrams)
        const nextWords = [
          ...getSingleLetterChanges(currentWord),
          ...getAnagrams(currentWord)
        ];
        
        for (const newWord of nextWords) {
          // Skip if we've already visited this word in the current direction
          if (currentVisited.has(newWord)) continue;
          
          // Check if we've met the other search
          if (otherVisited.has(newWord)) {
            // Found meeting point! Build the complete path
            let forwardPath, backwardPath;
            
            if (expandForward) {
              forwardPath = reconstructPath(forwardParents, startWord, currentWord);
              forwardPath.push(newWord);
              backwardPath = reconstructPath(backwardParents, endWord, newWord);
              backwardPath.reverse();
              backwardPath.shift();
              
              const fullPath = forwardPath.concat(backwardPath);
              
              if (fullPath.length - 1 <= maxDepth) {
                return { possible: true, path: fullPath, steps: fullPath.length - 1 };
              }
            } else {
              forwardPath = reconstructPath(forwardParents, startWord, newWord);
              backwardPath = reconstructPath(backwardParents, endWord, currentWord);
              backwardPath.push(newWord);
              backwardPath.reverse();
              backwardPath.shift();
              
              const fullPath = forwardPath.concat(backwardPath);
              
              if (fullPath.length - 1 <= maxDepth) {
                return { possible: true, path: fullPath, steps: fullPath.length - 1 };
              }
            }
          }
          
          // Add to current search
          currentVisited.add(newWord);
          currentParents.set(newWord, currentWord);
          currentQueue.push(newWord);
        }
      }
      
      if (depth >= maxDepth) {
        break;
      }
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

  export const addNewPuzzlesToCollection2 = async (puzzleCount = 10) => {
    try {
      console.log('Starting puzzle generation...');
      
      // Find the highest existing ID to continue from
      const lastPuzzle = await LevelTwoPuzzlesModel.findOne().sort({ id: -1 });
      const startingId = lastPuzzle ? lastPuzzle.id + 1 : 1;
      
      // Generate puzzles with custom starting ID
      const puzzles = generateRandomPuzzlesLevel2(puzzleCount, startingId);
      console.log(`Generated ${puzzles.length} puzzles starting from ID ${startingId}`);
      
      // Insert new puzzles
      const result = await LevelTwoPuzzlesModel.insertMany(puzzles);
      console.log(`Successfully added ${result.length} new puzzles to database`);
      
      return {
        success: true,
        count: result.length,
        startingId,
        message: `Successfully added ${result.length} puzzles starting from ID ${startingId}`
      };
      
    } catch (error) {
      console.error('Error adding puzzles:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to add puzzles to database'
      };
    }
   };
  
  // Updated generateRandomPuzzles for Level 2
  const generateRandomPuzzlesLevel2 = (targetCount = 365, startingId = 1) => {
    const puzzles = [];
    const used = new Set();
    let currentId = startingId;
    const wordList = Array.from(englishWords);
    
    while (puzzles.length < targetCount) {
        const start = getRandomWord(
            {minLength: 4, maxLength: 4}
          );
          const end = getRandomWord(        
            {minLength: 4, maxLength: 4}
          );
          console.log('trying:' , start, end)
      const key = `${start}-${end}`;
      
      if (start !== end && !used.has(key) && start.length === end.length) {
        const result = findWordLadderWithAnagrams(start, end);
        
        // For level 2, we want puzzles that benefit from anagrams (3-8 steps)
        if (result.possible && result.steps >= 5 && result.steps <= 10) {
          puzzles.push({
            id: currentId++,
            startingWord: start,
            endingWord: end,
            shortestSolution: result.path
          });
          used.add(key);
          used.add(`${end}-${start}`);
        }
      }
    }
    
    return puzzles;
  };
  
  export { 
    findWordLadderWithAnagrams, 
    generateRandomPuzzlesLevel2,
    getAnagrams,
    getSingleLetterChanges,
  };