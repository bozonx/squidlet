import * as path from 'path';

import compileTs from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/shared/buildToJs/compileTs.js';
import compileJs from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/shared/buildToJs/compileJs.js';
import minimize from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/shared/buildToJs/minimize.js';
import {EntityType} from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/interfaces/EntityTypes.js';
import {convertEntityTypeToPlural} from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/lib/helpers.js';


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
