/*global requirejs,console,define,fs*/
import sslRequest from "../ssl_request";

import Table from "cli-table";

import moment from "moment";

import config from "../config";

export default (() => {
  const worklog = {
    add: function(issue, timeSpent, comment, startedAt) {
      const url = 'rest/api/latest/issue/' + issue + '/worklog';
      const formattedStart = moment(startedAt).format('YYYY-MM-DD[T]HH:mm:ss.SSSZZ');
      sslRequest.post(config.auth.url + url).send({
        comment: comment,
        timeSpent: timeSpent,
        started: formattedStart
      }).end((err, res) => {
        if (!res.ok) {
          return console.log((res.body.errorMessages || [res.error]).join('\n'));
        }

        return console.log('Worklog to issue [' + issue + '] was added!.');
      });
    },
    show: function(issue) {
      const url = 'rest/api/latest/issue/' + issue + '/worklog';
      sslRequest.get(config.auth.url + url).end((err, res) => {
        if (!res.ok) {
          return console.log(res.body.errorMessages.join('\n'));
        }

        if (res.body.total === 0) {
          console.log('No work yet logged');
          return;
        }

        const tbl = new Table({
            head: ['Date', 'Author', 'Time Spent', 'Comment']
          }),
          worklogs = res.body.worklogs;

        for (let i = 0; i < worklogs.length; i++) {
          const startDate = worklogs[i].created,
            author = worklogs[i].author.displayName,
            timeSpent = worklogs[i].timeSpent;
          let comment = worklogs[i].comment || '';

          if (comment.length > 50) {
            comment = comment.substr(0, 47) + '...';
          }

          tbl.push([startDate, //TODO format date
            author, timeSpent, comment]);
        }

        console.log(tbl.toString());
      });
    }
  };
  return worklog;
})();
