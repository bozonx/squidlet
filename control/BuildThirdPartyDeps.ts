import * as path from 'path';
import * as rimraf from '../lowjs/tasks';
import * as shelljs from 'shelljs';
import Io from '../hostEnvBuilder/Io';


const MODULES_DIR = 'node_modules';
const mainNodeModulesDir = path.resolve(__dirname, '../node_modules');


export default class BuildThirdPartyDeps {
  private readonly io: Io;


  constructor(io: Io) {
    this.io = io;
  }


  async build(hostBuildDir: string) {
    const nodeModules: string = path.join(hostBuildDir, MODULES_DIR);
    const babelDir = path.join(nodeModules, '@babel');
    const babelRuntimeHelpersDir = path.join(babelDir, 'runtime/helpers');
    const babelHelpers = [
      'interopRequireDefault',
      'toConsumableArray',
      'classCallCheck',
      'createClass',
      'possibleConstructorReturn',
      'getPrototypeOf',
      'inherits',
    ];

    await this.io.rimraf(`${babelDir}/**/*`);
    shelljs.mkdir('-p', babelRuntimeHelpersDir);

    for (let fileName of babelHelpers) {
      const srcBabelDir = path.resolve(mainNodeModulesDir, '@babel/runtime/helpers', `${fileName}.js`);

      shelljs.cp(srcBabelDir , babelRuntimeHelpersDir);
    }
  }

}
