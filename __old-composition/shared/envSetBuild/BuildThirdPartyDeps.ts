import * as path from 'path';
import * as shelljs from 'shelljs';
import Os from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/shared/helpers/Os.js';


const MODULES_DIR = 'node_modules';
const mainNodeModulesDir = path.resolve(__dirname, '../node_modules');


export default class BuildThirdPartyDeps {
  private readonly os: Os;


  constructor(os: Os) {
    this.os = os;
  }


  async build(hostBuildDir: string) {

    // TODO: remake

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

    await this.os.rimraf(`${babelDir}/**/*`);
    shelljs.mkdir('-p', babelRuntimeHelpersDir);

    for (let fileName of babelHelpers) {
      const srcBabelDir = path.resolve(mainNodeModulesDir, '@babel/runtime/helpers', `${fileName}.js`);

      shelljs.cp(srcBabelDir , babelRuntimeHelpersDir);
    }
  }

}
