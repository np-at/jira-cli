import { client } from './helpers';
import os from 'os';
import CacheObject from './cache';

export async function issuePickerCompletionAsync(...args): Promise<void> {
  try {
    const searcharg = args[1]?.args ?? [''];
    const searchTerm = searcharg.length > 0 ? searcharg.join(' ') : '';
    const fe = new CacheObject().fuzzyIndexSearch;
    if (fe !== null) {
      const results = fe.search(searchTerm);
      if (results) {
        console.log(results.flatMap(x => x.item).map(x => String(`${x.key}|*|${x.fields['summary']}`)).join(os.EOL));
        return;
      }
    }
    const issueSuggestions = await client.issueSearch.getIssuePickerSuggestions({ query: args[1]?.args?.join(' ') ?? '' });
    console.log(issueSuggestions.sections.flatMap(x => x.issues).map(x => String(`${x.key}|*|${x.summary}`)).join(os.EOL));
    return;


  } catch (e) {
    console.error(e);
  }
}
