import sslRequest from '../ssl_request';

import config from '../config';

export default (() => {
  const fix = {
    query: null,
    to: function (ticket, version) {
      this.query = 'rest/api/2/issue/' + ticket;
      sslRequest.put(config.auth.url + this.query).send({
        'update': {
          'fixVersions': [{
            'set': [{
              'name': version
            }]
          }]
        }
      }).end((err, res) => {
        if (!res.ok) {
          return console.log((res.body.errorMessages || [res.error]).join('\n'));
        }

        return console.log('FixVersion [' + ticket + '] set to ' + version + '.');
      });
    },
    append: function (ticket, version) {
      this.query = 'rest/api/2/issue/' + ticket;
      sslRequest.put(config.auth.url + this.query).send({
        'update': {
          'fixVersions': [{
            'add': {
              'name': version
            }
          }]
        }
      }).end((err, res) => {
        if (!res.ok) {
          return console.log((res.body.errorMessages || [res.error]).join('\n'));
        }

        return console.log('Appended FixVersion ' + version + ' to [' + ticket + '].');
      });
    }
  };
  return fix;
})();
