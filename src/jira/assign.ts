/*global console*/
import sslRequest from '../ssl_request';

import utils from '../utilities/utils';

import config from '../config';
import { client } from '../helpers/helpers';


export const assignJ = async (ticket, assignee) => {
  const assigneeUserId = await client.users.getAccountIdsForUsers({username: assignee }); // . getUser({username: assignee })
  await client.issues.assignIssue({issueIdOrKey: ticket });
};

export default function assign() {
  const assign = {
    query: null,
    table: null,
    to(ticket, assignee) {
      this.query = 'rest/api/2/issue/' + ticket + '/assignee';
      sslRequest
        .put(config.auth.url + this.query)
        .send({ 'name': assignee })
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Basic ' + config.auth.token)
        .end((err, res) => {
          if (!res.ok) {
            const errorMessages = utils.extractErrorMessages(res).join('\n');
            return console.log(errorMessages);
          }
          return console.log('Issue [' + ticket + '] assigned to ' + assignee + '.');
        });
    },
    me: function(ticket) {
      this.to(ticket, config.auth.user);
    }
  };
  return assign;
}
