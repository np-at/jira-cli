import settings from './settings';

import {readFileSync} from 'fs';

export const ca = (): Buffer => {
  return readFileSync(settings.getCertificateFilePath());
};
