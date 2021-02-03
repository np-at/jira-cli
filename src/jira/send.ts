/*global requirejs,console,define,fs*/
import sslRequest from '../ssl_request';

import config from '../config';

import cheerio from 'cheerio';

import nodemailer from 'nodemailer';

import fs from 'fs';

import _ from 'underscore';

export default (() => {
  const report = {
    query: null,
    table: null,
    send: options => {
      sslRequest.post(config.auth.url + 'secure/ReleaseNote.jspa')
        .query({ projectId: options.projectId })
        .query({ version: options.version })
        .end((error, response) => {
          if (error) throw new Error(error);
          const $ = cheerio.load(response.body);
          const editcopy = $('textarea#editcopy').text();
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: config.auth.user,
              pass: options.password
            }
          });
          const templateContent = fs.readFileSync(options.template,  'utf8');
          const data = {
            release_version: options.name,
            link: config.auth.url + 'projects/' + options.project_prefix + '/versions/' + options.version,
            report: editcopy
          };
          _.templateSettings = {
            interpolate: /\{\{(.+?)\}\}/g
          };
          const getHTML = _.template(templateContent);
          const html_body = getHTML(data);

          const send_it = async () => {
            const info = await transporter.sendMail({
              from: config.auth.user,
              to: options.to,
              cc: options.cc,
              subject: options.subject,
              html: html_body
            });
            console.log('Message sent: %s', info.messageId);
          };

          send_it();
        });
    }
  };
  return report;
})();
