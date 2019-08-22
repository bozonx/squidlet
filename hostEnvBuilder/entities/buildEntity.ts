import * as path from 'path';

import compileTs from '../../shared/buildToJs/compileTs';
import compileJs from '../../shared/buildToJs/compileJs';
import minimize from '../../shared/buildToJs/minimize';
import {EntityType} from '../../system/interfaces/EntityTypes';
import {convertEntityTypeToPlural} from '../../system/lib/helpers';


export default async function buildEntity(
  entityType: EntityType,
  entityName: string,
  tmpDir: string,
  entitySrcDir: string,
  entityDstDir: string
) {
  const modernJsDir = path.join(tmpDir, 'modern', convertEntityTypeToPlural(entityType), entityName);
  const legacyJsDir = path.join(tmpDir, 'legacy', convertEntityTypeToPlural(entityType), entityName);
  //const minJsDir = path.join(tmpDir, 'min', pluralType, entityName);

  // ts to modern js
  await compileTs(entitySrcDir, modernJsDir);
  // modern js to ES5
  await compileJs(modernJsDir, legacyJsDir, false);

  // minimize
  await minimize(legacyJsDir, entityDstDir);
}
