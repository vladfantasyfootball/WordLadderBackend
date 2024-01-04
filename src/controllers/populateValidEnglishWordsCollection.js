import { postEnglishWord } from './englishWordsController.js';
import englishDictionary from './mydictionary.json' assert {type: 'json'};

// export const processLineByLine = async () => {
//   console.log(englishDictionary.length)
//   for(let i = 0; i < englishDictionary.length; i++){
//     if(englishDictionary[i].length > 3 && englishDictionary[i].length < 6){
//         postEnglishWord(englishDictionary[i])
//     }
//   }
// }