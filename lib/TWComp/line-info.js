"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lineInfo = (params) => {
    const input = params.line;
    const cursor = params.cursor;
    const partialLeftLine = input.substr(0, cursor);
    const partialRightLine = input.substr(cursor);
    const wordDelimiter = /\s+/g;
    const words = input.split(wordDelimiter);
    const partialLeftWords = partialLeftLine.split(wordDelimiter);
    const partialRightWords = partialRightLine.split(wordDelimiter);
    const wordsIndex = partialLeftWords.length - 1;
    const partialLeftWord = partialLeftWords[partialLeftWords.length - 1] || '';
    const partialRightWord = partialRightWords[0] || '';
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
exports.default = lineInfo;
