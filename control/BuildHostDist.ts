import * as path from 'path';

import compileTs from '../buildToJs/compileTs';
import compileJs from '../buildToJs/compileJs';
import modulesTree from '../buildToJs/modulesTree';
import minimize from '../buildToJs/minimize';
import Io from '../hostEnvBuilder/Io';


const hostSrc = path.resolve(__dirname, '../host');


export default class BuildHostDist {
  private readonly io: Io;


  constructor(io: Io) {
    this.io = io;
  }

  async build(buildDir: string, tmpDir: string) {
    const modernDst = path.join(tmpDir, 'modern');
    const legacyDst = path.join(tmpDir, 'legacy');
    const treeDst = path.join(tmpDir, 'tree');

    // TODO: check version and update only if version is different

    // ts to modern js
    await this.io.rimraf(`${modernDst}/**/*`);
    await compileTs(hostSrc, modernDst);
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
