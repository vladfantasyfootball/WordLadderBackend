import {englishWords} from './mydictionary.js';
import { postEnglishWord } from './englishWordsController.js';

export const processLineByLine = async () => {
  console.log(englishWords.length)
  for(let i = 0; i < englishWords.length; i++){
    if(englishWords[i].length > 3 && englishWords[i].length < 6){
        postEnglishWord(englishWords[i])
    }
  }
}