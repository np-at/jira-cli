import { client } from './helpers';
import os from 'os';
import CacheObject from './cache';

export async function issuePickerCompletionAsync(...args): Promise<void> {
  try {
    const searcharg = args[1]?.args ?? null;
    if (searcharg) {

      let searchTerm = searcharg.length > 0 ? searcharg.join(' ') : '';
      searchTerm = searchTerm.trim() === '' ? '*' : searchTerm;
      const fe = new CacheObject().fuzzyIndexSearch;
      if (fe !== null) {
        const results = fe.search(searchTerm);
        if (results?.length > 0) {
          console.log(results.map(x => String(`${x.item.key}|*|${x.item.fields.summary}`)).join(os.EOL));
          return;
        }
      }
    }
    // fallback to using Jira api issue picker suggestions (good, just much slower and returns a more limited set)
    const issueSuggestions = await client.issueSearch.getIssuePickerSuggestions({ query: args[1]?.args?.join(' ') ?? '' });
    console.log(issueSuggestions.sections.flatMap(x => x.issues).map(x => String(`${x.key}|*|${x.summary}`)).join(os.EOL));
    return;


  } catch (e) {
    console.error(e);
  }
}
