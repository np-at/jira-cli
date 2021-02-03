/*global requirejs,console,define,fs*/
import sslRequest from '../ssl_request';

import config from '../config';

export default (() => {
  const comment = {
    query: null,
    table: null,
    to: function (issue, comment) {
      this.query = 'rest/api/latest/issue/' + issue + '/comment';
      sslRequest.post(config.auth.url + this.query).send({
        body: comment
      }).end((err, res) => {
        if (!res.ok) {
          return console.log((res.body.errorMessages || [res.error]).join('\n'));
        }

        return console.log('Comment to issue [' + issue + '] was posted!.');
      });
    },
    show(issue) {

      let i = 0;
      this.query = 'rest/api/latest/issue/' + issue + '/comment';
      sslRequest
        .get(config.auth.url + this.query)
        .end((err, res) => {
          if (!res.ok) {
            return console.log(res.body.errorMessages.join('\n'));
          }

          if (res.body.total > 0) {
            for (i = 0; i < res.body.total; i += 1) {
              let updated: Date|string = new Date(res.body.comments[i].updated);
              updated = ' (' + updated + ')';
              console.log('\n' + res.body.comments[i].author.displayName.cyan + updated);
              console.log(res.body.comments[i].body);
            }
          } else {
            return console.log('There are no comments on this issue.');
          }
        });
    }
  };
  return comment;
})();
