interface LineInfo {
  line: { partialRight: string; partialLeft: string; index: any; value: any };
  words: { partialRight: string[]; partialLeft: string[]; index: number; value: any };
  word: { partialRight: string; partialLeft: string; index: number; value: any };
}

const lineInfo = (params: { line: string; cursor?: number; }): LineInfo => {
  // Localize line info
  const input = params.line;
  const cursor = params.cursor;

  // Break down the line
  const partialLeftLine = input.substr(0, cursor);
  const partialRightLine = input.substr(cursor);

  // Collect words info
  const wordDelimiter = /\s+/g;
  const words = input.split(wordDelimiter);
  const partialLeftWords = partialLeftLine.split(wordDelimiter);
  const partialRightWords = partialRightLine.split(wordDelimiter);
  const wordsIndex = partialLeftWords.length - 1;

  // Collect word info
  const partialLeftWord = partialLeftWords[partialLeftWords.length - 1] || '';
  const partialRightWord = partialRightWords[0] || '';

  // Return info
  return {
    line: {
      value: input,
      index: cursor,
      partialLeft: partialLeftLine,
      partialRight: partialRightLine,
    },
    words: {
      value: words,
      index: wordsIndex,
      partialLeft: partialLeftWords,
      partialRight: partialRightWords
    },
    word: {
      value: words[wordsIndex] || '',
      index: partialLeftWord.length,
      partialLeft: partialLeftWord,
      partialRight: partialRightWord
    }
  };
};
export default lineInfo;
