import * as path from 'path';

import compileTs from '../buildToJs/compileTs';
import compileJs from '../buildToJs/compileJs';
import modulesTree from '../buildToJs/modulesTree';
import minimize from '../buildToJs/minimize';
import Io from '../hostEnvBuilder/Io';
import {LEGACY_DIR, MODERN_DIR, TREE_DIR} from './constants';


const systemSrc = path.resolve(__dirname, '../host');


export default class BuildSystem {
  private readonly io: Io;


  constructor(io: Io) {
    this.io = io;
  }

  async build(buildDir: string, tmpDir: string) {
    const modernDst = path.join(tmpDir, MODERN_DIR);
    const legacyDst = path.join(tmpDir, LEGACY_DIR);
    const treeDst = path.join(tmpDir, TREE_DIR);

    // TODO: check version and update only if version is different

    // ts to modern js
    await this.io.rimraf(`${modernDst}/**/*`);
    await compileTs(systemSrc, modernDst);
    // modern js to ES5
    await this.io.rimraf(`${legacyDst}/**/*`);
    await compileJs(modernDst, legacyDst, false);
    // Get only used files
    await this.io.rimraf(`${treeDst}/**/*`);
    await modulesTree(legacyDst, treeDst);
    // minimize
    await this.io.rimraf(`${buildDir}/**/*`);
    await minimize(treeDst, buildDir);
  }

}
