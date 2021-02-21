import sslRequest from '../ssl_request';

import config from '../config';
import { client } from '../helpers/helpers';

interface ADFNode {
  type: string,
  content?: ADFNode[],

}

interface ADFChildNode extends ADFNode {
  type: 'listItem' | 'media' | 'table_cell' | 'table_header' | 'table_row'
  marks?: { type: 'code' | 'em' | 'link' | 'strike' | 'strong' | 'subsup' | 'textColor' | 'underline' }[]
}

interface ADFTopLevelNode extends ADFNode {
  type: 'blockquote' | 'bulletList' | 'codeBlock' | 'heading' | 'mediaGroup' | 'mediaSingle' | 'orderedList' | 'panel' | 'paragraph' | 'rule' | 'table'
  content: Array<ADFInlineTextNode | ADFChildNode | ADFNode | ADFInlineNode>
}

interface ADFInlineNode {
  type: 'emoji' | 'hardBreak' | 'inlineCard' | 'mention' | 'text'
  attrs?: {
    id?: string,
    text?: string,
    userType?: string
  }
  text?: string
}

interface ADFInlineTextNode {
  type: 'text',
  text: string
}

interface AtlassianDocumentFormatRoot extends ADFNode {
  version: number,
  type: 'doc',
  content: ADFTopLevelNode[]
}


export const jiraComment = async (issue: string, comment: string): Promise<void> => {
  try {
    await client.issueComments.addComment({ issueIdOrKey: issue, body: comment });
  } catch (e) {
    console.error(e);
  }
};
export default comment;

function comment(): { query: null; show(issue): void; to: (issue, comment) => void; table: null } {
  const comment = {
    query: null,
    table: null,
    to: function(issue, comment) {
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
              let updated: Date | string = new Date(res.body.comments[i].updated);
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
}
