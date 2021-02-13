import { client } from './helpers';
import os from 'os';

export async function issuePickerCompletionAsync(...args):Promise<void> {
  try {
    const issueSuggestions = await client.issueSearch.getIssuePickerSuggestions({ query: args[1]?.args?.join(' ') ?? '' });
    console.log(issueSuggestions.sections.flatMap(x => x.issues).map(x => String(`${x.key}|*|${x.summary}`)).join(os.EOL));
    return;
  } catch (e) {
    console.error(e);
  }
}
