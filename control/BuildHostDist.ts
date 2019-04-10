import * as path from 'path';

import compileTs from '../helpers/buildJs/compileTs';
import compileJs from '../helpers/buildJs/compileJs';
import modulesTree from '../helpers/buildJs/modulesTree';
import minimize from '../helpers/buildJs/minimize';
import Io from '../hostEnvBuilder/Io';


export default class BuildHostDist {
  private readonly io: Io;


  constructor(io: Io) {
    this.io = io;
  }

  async build() {

    // TODO: use specified paths

    const HOST_SRC_DIR = path.resolve(__dirname, 'host');
    const BUILD_DIR = path.resolve(__dirname, 'build/host');
    const MODERN_DST_DIR = path.join(BUILD_DIR, 'modern');
    const LEGACY_DST_DIR = path.join(BUILD_DIR, 'legacy');
    const DEV_DST_DIR = path.join(BUILD_DIR, 'dev');
    const MIN_DST_DIR = path.join(BUILD_DIR, 'min');

    // ts to modern js
    await this.io.rimraf(`${MODERN_DST_DIR}/**/*`);
    await compileTs(HOST_SRC_DIR, MODERN_DST_DIR);
    // modern js to ES5
    await this.io.rimraf(`${LEGACY_DST_DIR}/**/*`);
    await compileJs(MODERN_DST_DIR, LEGACY_DST_DIR, false);
    // Get only used files
    await this.io.rimraf(`${DEV_DST_DIR}/**/*`);
    await modulesTree(LEGACY_DST_DIR, DEV_DST_DIR);
    // minimize
    await this.io.rimraf(`${MIN_DST_DIR}/**/*`);
    await minimize(DEV_DST_DIR, MIN_DST_DIR);
  }

}
