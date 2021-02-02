import config from './config';

import request from 'superagent';

import ca from './ca';

export default (() => {
  const _buildRequest = function (verb) {
    if (config.use_self_signed_certificate) {
      return argument => request[verb](argument)
        .ca(ca)
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Basic ' + config.auth.token);
    } else {
      return argument => request[verb](argument)
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Basic ' + config.auth.token);
    }
  };

  return {
    get: _buildRequest('get'),
    post: _buildRequest('post'),
    put: _buildRequest('put'),
    delete: _buildRequest('delete')
  };
})();
