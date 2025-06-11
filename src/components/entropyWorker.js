self.addEventListener('message', (e) => {
    const { possibleWords, reducedWordList, greyLetters } = e.data;
  
    if (
      !Array.isArray(possibleWords) ||
      !Array.isArray(reducedWordList) ||
      !Array.isArray(greyLetters)
    ) {
      console.error('❌ Invalid data received in worker.');
      self.postMessage([]);
      return;
    }
  
    console.log('📦 Worker received:');
    console.log('- possibleWords:', possibleWords.slice(0, 3));
    console.log('- reducedWordList:', reducedWordList.slice(0, 3));
    console.log('- greyLetters:', greyLetters);
  
    const createColourMap = (guess, word) => {
        const guessArr = guess.split('');
        const wordArr = word.split('');
        return guessArr.map((letter, index) => {
          if (letter === wordArr[index]) return 2;
      
          let lettersInWord = wordArr.filter(char => char === letter).length;
          guessArr.slice(0, index).forEach(char => {
            if (char === letter) lettersInWord--;
          });
      
          guessArr.slice(index + 1).forEach((char, i) => {
            if (char === letter && wordArr[i + index + 1] === letter) lettersInWord--;
          });
      
          return lettersInWord > 0 ? 1 : 0;
        });
      };
      
  
    const generateAllColourMaps = () => {
      const maps = [];
      let array = [0, 0, 0, 0, 0];
      for (let a = 0; a < 3; a++) {
        array[0] = a;
        for (let b = 0; b < 3; b++) {
          array[1] = b;
          for (let c = 0; c < 3; c++) {
            array[2] = c;
            for (let d = 0; d < 3; d++) {
              array[3] = d;
              for (let e = 0; e < 3; e++) {
                array[4] = e;
                maps.push([...array]);
              }
            }
          }
        }
      }
      return maps;
    };
  
    const makeSuggestionList = (wordList, greyLetters, possibleWords) => {
      const allColourMaps = generateAllColourMaps();
  
      const wordsFiltered = wordList.filter(word => typeof word === 'string' && possibleWords.includes(word));
      const reducedPossible = possibleWords.filter(
        word => typeof word === 'string' && !word.split('').some(l => greyLetters.includes(l))
      );
  
      const workingList =
        wordsFiltered.length > 20 && reducedPossible.length >= 1
          ? reducedPossible
          : possibleWords;
  
      const reducedWorkingList = workingList.slice(0, 150); // 🚀 Limit for speed
  
      const entropyList = [];
  
      for (const word of reducedWorkingList) {
        if (typeof word !== 'string') continue;
  
        const freqMap = {};
  
        for (const actualWord of wordsFiltered) {
            const pattern = createColourMap(word, actualWord).join('');
            freqMap[pattern] = (freqMap[pattern] || 0) + 1;
          }
  
        const total = Object.values(freqMap).reduce((a, b) => a + b, 0);
        let entropy = 0;
  
        for (const count of Object.values(freqMap)) {
          const p = count / total;
          if (p > 0) entropy -= p * Math.log2(p); // inline entropy
        }
  
        const bonus = wordsFiltered.includes(word) ? 1 / wordsFiltered.length : 0;
        entropyList.push([word, entropy + bonus]);
      }
  
      return entropyList.sort((a, b) => b[1] - a[1]).slice(0, 10);
    };
  
    const suggestions = makeSuggestionList(reducedWordList, greyLetters, possibleWords);
    self.postMessage(suggestions);
  });
  