import * as path from 'path';

import compileTs from '../../shared/buildToJs/compileTs';
import compileJs from '../../shared/buildToJs/compileJs';
import minimize from '../../shared/buildToJs/minimize';
import {ManifestsTypePluralName} from '../../host/interfaces/ManifestTypes';


export default async function buildEntity(
  pluralType: ManifestsTypePluralName,
  entityName: string,
  tmpDir: string,
  entitySrcDir: string,
  entityDstDir: string
) {
  const modernJsDir = path.join(tmpDir, 'modern', pluralType, entityName);
  const legacyJsDir = path.join(tmpDir, 'legacy', pluralType, entityName);
  //const minJsDir = path.join(tmpDir, 'min', pluralType, entityName);

  // ts to modern js
  await compileTs(entitySrcDir, modernJsDir);
  // modern js to ES5
  await compileJs(modernJsDir, legacyJsDir, false);

  // minimize
  await minimize(legacyJsDir, entityDstDir);
}
