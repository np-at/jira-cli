/*global requirejs,console,define,fs*/

import readline from 'readline';

import sslRequest from './ssl_request';

import config from './config';

export default (() => {

  const getUserCompletions = function getUserCompletions(line, word, options, cb) {
    const userOptions = options && options.user ? options.user : {},
      enabled = userOptions.enabled !== undefined ? userOptions.enabled : false,
      forMention = userOptions ? userOptions.forMention : false,
      isUserComplete = word && forMention ? word.indexOf('[~') === 0 : true,
      queryWord = forMention && isUserComplete ? word.slice(2) : word;

    if (!enabled || !isUserComplete || !queryWord) {
      return cb([]);
    }

    const result = !queryWord ? null : sslRequest.get(config.auth.url + 'rest/api/2/user/search?username=' + queryWord).end((err, res) => {
      if (!res.ok) {
        return console.log(res.body.errorMessages.join('\n'));
      }

      let hits = res.body.filter(function(user) {
        return user.name.indexOf(queryWord) === 0;
      });
      hits = hits.map(function(user) {
        return user.name;
      });
      const exact = hits.filter(function(user) {
        return user === queryWord;
      });
      hits = exact.length === 1 ? exact : hits;

      if (forMention) {
        hits = hits.map(function(user) {
          return '[~' + user + ']';
        });
      }

      cb(hits, word);
    });
  };

  const getCompletions = function getCompletions(line, word, options, cb) {
    getUserCompletions(line, word, options, function userCompletionHits(userHits, line) {
      cb(null, [userHits, line]);
    });
  };

  const getCompleter = function getCompleter(options) {
    const completer = function completer(line, cb) {
      const words = line ? line.split(/\s+/) : [],
        word = words.length > 0 ? words[words.length - 1] : '';

      if (!word) {
        cb([[], line]);
      }

      getCompletions(line, word, options, cb);
    };

    return completer;
  };

  return function(question, cb, options) {
    options = options || options;
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      completer: getCompleter(options)
    });
    rl.question(question, function(answer) {
      rl.close();
      cb(answer);
    });
  };
})();
