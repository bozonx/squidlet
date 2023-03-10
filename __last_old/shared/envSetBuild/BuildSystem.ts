import * as path from 'path';

import compileTs from '../buildToJs/compileTs';
import compileJs from '../buildToJs/compileJs';
import modulesTree from '../buildToJs/modulesTree';
import minimize from '../buildToJs/minimize';
import Os from '../helpers/Os';
import {LEGACY_DIR, MODERN_DIR, TREE_DIR} from '../constants';
import {SYSTEM_DIR} from '../helpers/helpers';


const systemSrc = path.resolve(SYSTEM_DIR);


export default class BuildSystem {
  private readonly os: Os;


  constructor(os: Os) {
    this.os = os;
  }

  async build(buildDir: string, tmpDir: string) {
    const modernDst = path.join(tmpDir, MODERN_DIR);
    const legacyDst = path.join(tmpDir, LEGACY_DIR);
    const treeDst = path.join(tmpDir, TREE_DIR);

    // TODO: save version

    // ts to modern js
    await this.os.rimraf(`${modernDst}/**/*`);
    await compileTs(systemSrc, modernDst);
    // modern js to ES5
    await this.os.rimraf(`${legacyDst}/**/*`);
    await compileJs(modernDst, legacyDst, false);
    // Get only used files
    await this.os.rimraf(`${treeDst}/**/*`);
    await modulesTree(legacyDst, treeDst);
    // minimize
    await this.os.rimraf(`${buildDir}/**/*`);
    await minimize(treeDst, buildDir);
  }

}
