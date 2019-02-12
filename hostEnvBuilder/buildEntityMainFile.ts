import * as path from 'path';

import compileTs from '../helpers/buildJs/compileTs';
import compileJs from '../helpers/buildJs/compileJs';
import minimize from '../helpers/buildJs/minimize';


export default async function buildEntityMainFile(tmpDir: string, mainSrcFile: string, mainJsDstFile: string) {
  const modernJsDir = path.join(tmpDir, 'modern');
  const legacyJsDir = path.join(tmpDir, 'legacy');
  const minJsDir = path.join(tmpDir, 'min');

  // TODO: resolve dependencies

  // ts to modern js
  await compileTs(path.dirname(mainSrcFile), modernJsDir);
  // modern js to ES5
  await compileJs(modernJsDir, legacyJsDir, false);
  // minimize
  await minimize(legacyJsDir, minJsDir);

  // TODO: скопировать с учетом переименования главного файла
}
