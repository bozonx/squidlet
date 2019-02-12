import * as path from 'path';

import compileTs from '../helpers/buildJs/compileTs';
import compileJs from '../helpers/buildJs/compileJs';
import minimize from '../helpers/buildJs/minimize';
import {ManifestsTypePluralName} from '../host/interfaces/ManifestTypes';


export default async function buildEntityMainFile(
  pluralType: ManifestsTypePluralName,
  entityName: string,
  tmpDir: string,
  mainSrcFile: string,
  mainJsDstFile: string
) {
  const modernJsDir = path.join(tmpDir, 'modern', pluralType, entityName);
  const legacyJsDir = path.join(tmpDir, 'legacy', pluralType, entityName);
  const minJsDir = path.join(tmpDir, 'min', pluralType, entityName);

  // ts to modern js
  await compileTs(path.dirname(mainSrcFile), modernJsDir);
  // modern js to ES5
  await compileJs(modernJsDir, legacyJsDir, false);

  // TODO: resolve local dependencies

  // minimize
  await minimize(legacyJsDir, minJsDir);

  // TODO: скопировать с учетом переименования главного файла
}
