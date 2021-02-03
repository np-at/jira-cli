import settings from './settings';

import {readFileSync} from 'fs';

export default (): Buffer => {
  return readFileSync(settings.getCertificateFilePath());
};
