import tw, { CompletableP, CompletableProto } from './TWCCompletion';
import { SearchResult } from 'jira-connector/types/api';
import commander from 'commander';

// const program = new commander.Command();
const prog = new commander.Command();
// const s = tw(prog);
const s = new CompletableP(prog);
s
  .command('ls')
  .description('List my issues')
  .option('-p, --project <name>', 'Filter by project', String)
  .option('-t, --type <type>', 'Filter by type', String)
  .option('-v, --verbose', 'verbose output')
  .action(async options => {
    // const defaultCreate = await getDefaultCreate();
    // return;
    let err: Error, results: SearchResult;
    console.log(...options);
  });
s.complete({line: 'l', cursor: 1}, (a, b) => {
  console.log(a); console.log(b);
});
console.debug('results', s);
