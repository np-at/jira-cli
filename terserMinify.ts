import { minify } from 'terser';
import * as Path from 'path';
import fs from 'fs';

const dirPath = Path.join(__dirname, 'tsc_output');
const outPath = Path.join(__dirname, 'lib');

function processDir(folder: string) {
  const dir = fs.readdirSync(folder);

  dir.forEach((file, i, arr) => {

    if (!file)
      return;
    const resolvedPath = Path.join(folder, file);
    if (fs.statSync(resolvedPath).isDirectory()) {
      processDir(resolvedPath);
      return;
    }
    const buff = fs.readFileSync(resolvedPath);
    minify(buff.toString('utf-8'), {
      compress: true,
      mangle: true,
      module: true
    }).then(({ code }) => {
      const outputPath = Path.join(outPath, Path.relative(dirPath, folder));
      if (!fs.existsSync(outputPath))
        fs.mkdirSync(outputPath);
      fs.writeFileSync(Path.join(outputPath, file), code);
      // console.log(code);
    }).catch(
      err => {
        console.error(err);
      }
    );
  });
}

processDir(dirPath);
