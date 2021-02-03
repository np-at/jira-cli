import fs from 'fs';
import inquirer from 'inquirer';
import config, { Auth } from './config';

const prompt = inquirer.createPromptModule();
export default {
  answers: {},
  ask: function(question: string, callback: (args) => void, password?: boolean): void {

    if (password) {
      prompt({ type: 'password', message: question })
        .then((answer) => {
          if ((answer as string).length > 0) {
            callback(answer);
          } else {
            this.ask(question, callback, true);
          }
        });
    } else {
      prompt({ message: question }).then(function(answer) {
        if ((answer as string).length > 0) {
          callback(answer);
        } else {
          this.ask(question, callback);
        }
      });
    }
  },
  setup(options): void {// Does your config file exist

    if (!config.isLoaded()) {
      // If not then create it
      this.ask('Jira URL: ', (answer) => {
        this.answers.url = answer;
        this.ask('Username: ', function(answer) {
          this.answers.user = answer;
          this.ask('Password: ', function(answer) {
            this.answers.pass = answer;
            process.stdin.destroy();
            this.saveConfig(options);
          }, true);
        });
      });
    }
  },
  clearConfig(): void {
    prompt({ message: 'Are you sure?', default: false, type: 'confirm' })
      .then(function(answer) {
        if (answer) {
          config.clear();
          console.log('Configuration deleted successfully!');
        }

        process.stdin.destroy();
      });
  },
  saveConfig: function(options): void {
    if (this.answers.url) {
      if (!/\/$/.test(this.answers.url)) {
        this.answers.url += '/';
      }
    }

    if (this.answers.user && this.answers.pass) {
      this.answers.token = this.answers.user + ':' + this.answers.pass;
      const auth: Auth = {
        url: this.answers.url,
        user: this.answers.user,
        token: Buffer.from(this.answers.token).toString('base64')
      };
      delete this.answers.pass;

      if (options.verbose) {
        console.log(options);
      }

      if (options.template && fs.existsSync(options.template)) {
        console.log('Using cli supplied default config file');
        config.loadInitialFromTemplate(options.template);
      }

      config.update('auth', auth);
      config.save();
      console.log('Information stored!');
    }
  }
};
