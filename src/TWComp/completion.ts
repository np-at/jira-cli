// Load in dependencies
import deepClone from 'clone';
import lineInfo from './line-info';

// Define our completion constructor
function Completion(tree): void {
  // Save the tree as our node
  this.node = tree;
}
Completion.prototype = {
  // Helper functions for working with `info`
  shiftLeftWord: function (_info) {
    // Prevent mutation on the original `info`
    const info = deepClone(_info);

    // Move word from `remainingLef` onto `matchedLeft`
    const remainingLeftWords = info.words.remainingLeft;
    const leftmostWord = remainingLeftWords.shift();
    info.words.matchedLeft.push(leftmostWord);

    // Return updated info
    return info;
  },
  matchLeftWord: function (leftWord, words) {
    return words.filter(function findMatchingWords (word) {
      return leftWord === word.substr(0, leftWord.length);
    });
  },

  _guaranteeMatchedInfo: function (info) {
    // If there is no `remainingLeft` or `matchedLeft` words, add them
    if (!info.words.remainingLeft || !info.words.matchedLeft) {
      info = deepClone(info);

      if (!info.words.remainingLeft) {
        info.words.remainingLeft = info.words.partialLeft.slice(0);
      }
      if (!info.words.matchedLeft) {
        info.words.matchedLeft = [];
      }
    }

    return info;
  },

  // Define completion methods
  complete: function (params, cb) {
    // Collect info
    const info = lineInfo(params);
    return this.completeInfo(info, cb);
  },
  completeInfo: function (info, cb) {
    // Remove the newest matching word
    info = this._guaranteeMatchedInfo(info);
    info = this.shiftLeftWord(info);
    const matchedWord = info.words.matchedLeft[info.words.matchedLeft.length - 1];

    // If the matched word did not match the command, exit with no results
    // `npm pub|` matching ['git', 'checkout'] -> npm !== git
    const node = this.node;
    if (matchedWord !== node.name) {
      return cb(null, []);
    }

    return this.resolveInfo(info, cb);
  },
  resolveInfo: function (info, cb) {
    // If there are no words left, exit early with nothing
    // `npm|` -> ['npm'] matched -> []
    info = this._guaranteeMatchedInfo(info);
    const node = this.node;
    if (info.words.remainingLeft.length === 0) {
      return cb(null, []);
    }

    // The following is a recursive loop that creates child completion's until we arrive
    // at the last word in the left half of the command
    // `git che|c` -> ['git', 'che'] + ['c'] -> git.che (404) -> git.*.filter('che')
    // `git checkout |world` -> ['git', 'checkout'] + ['world'] -> git.checkout(params, cb) (`['world']`)

    // If there is 1 word remaining, determine what to do
    if (info.words.remainingLeft.length === 1) {
      // If there is completion logic, use it
      // ['git', 'checkout', 'hello'] on {name: git, commands: [{name: checkout, completion: getBranches}]}
      // -> ['hello.word' (branch)]
      if (node.completion) {
        return node.completion.call(this, info, cb);
        // If there are more commands, match them
        // ['git', 'che'] on {name: git, commands: [{name: checkout, completion: getBranches}]}
        // -> ['checkout']
      } else if (node.commands) {
        const cmds = node.commands.map(function getCommandName (commandNode) {
          return commandNode.name;
        });
        const partialLeftWord = info.word.partialLeft;
        const matchingCmds = this.matchLeftWord(partialLeftWord, cmds);
        matchingCmds.sort();
        return cb(null, matchingCmds);
        // Otherwise, this is a terminal command so callback with nothing
      } else {
        return cb(null, []);
      }
      // Otherwise, attempt to keep on recursing
    } else {
      // Match the newest left word
      const nextWord = info.words.remainingLeft[0];

      // If the next word is an option
      const optionNodes = node.options || [];
      const matchedOptionNode = optionNodes.filter(function matchoption (optionNode) {
        return optionNode.name === nextWord;
      })[0];
      if (matchedOptionNode) {
        // If there is a completion action, match it and use it
        if (matchedOptionNode.completion) {
          info = this.shiftLeftWord(info);
          return matchedOptionNode.completion.call(this, info, cb);
          // Otherwise, exit with no results
        } else {
          return cb(null, []);
        }
      }

      // Otherwise, if the next word is a command
      const commandNodes = node.commands || [];
      let matchedCommandNode;
      let i = 0;
      const len = commandNodes.length;
      for (; i < len; i++) {
        const commandNode = commandNodes[i];
        if (commandNode.name === nextWord) {
          matchedCommandNode = commandNode;
        }
      }
      if (matchedCommandNode) {
        // Recurse further
        const childCompletion = new Completion(matchedCommandNode);
        return childCompletion.completeInfo(info, cb);
      }

      // Otherwise, there are no more matches and exit with no results
      cb(null, []);
    }
  }
};

export default Completion;
