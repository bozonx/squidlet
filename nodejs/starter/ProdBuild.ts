import * as path from 'path';
import _template = require('lodash/template');

import systemConfig from '../../system/config/systemConfig';
import BuildSystem from '../../shared/envSetBuild/BuildSystem';
import BuildIo from '../../shared/envSetBuild/BuildIo';
import {SQUIDLET_PACKAGE_JSON_PATH} from '../../shared/helpers';
import Os from '../../shared/Os';
import Props from './Props';


const PACKAGE_JSON_TEMPLATE_PATH = path.resolve(__dirname, './package.json.template');


export default class ProdBuild {
  private readonly os: Os;
  private readonly props: Props;


  constructor(os: Os, props: Props, ) {
    this.os = os;
    this.props = props;
  }


  /**
   * Build system only at first time.
   * It builds to workDir/envset/system
   */
  async buildInitialSystem(prodSystemDirPath: string) {
    // TODO: проверять версию system - если не совпадает то перебилдить, если совпадает то нет.
    //       если стоит force - то билдить

    // TODO: сохранять версию system

    // else if it exists - do nothing
    if (!this.props.force && await this.os.exists(prodSystemDirPath)) return;

    // Build system to workDir/envset/system

    const systemBuildDir = path.join(this.props.envSetDir, systemConfig.envSetDirs.system);
    const systemTmpDir = path.join(this.props.tmpDir, systemConfig.envSetDirs.system);
    const buildSystem: BuildSystem = new BuildSystem(this.os);

    console.info(`===> Building system`);
    await buildSystem.build(systemBuildDir, systemTmpDir);
  }

  /**
   * Build io files to workDir/io
   */
  async buildIos() {
    console.info(`===> Building io`);

    const buildDir = path.join(this.props.envSetDir, systemConfig.envSetDirs.ios);
    const tmpDir = path.join(this.props.tmpDir, systemConfig.envSetDirs.ios);
    const buildIo: BuildIo = new BuildIo(
      this.os,
      this.props.platform,
      this.props.machine,
      buildDir,
      tmpDir
    );

    await buildIo.build();
  }

  async buildPackageJson(dependencies: {[index: string]: any} = {}) {
    const packageJson: string = await this.generatePackageJson(dependencies);

    await this.os.writeFile(path.join(this.props.workDir, 'package.json'), packageJson);
  }

  private async generatePackageJson(dependencies: {[index: string]: any}): Promise<string> {
    const templateContent: string = await this.os.getFileContent(PACKAGE_JSON_TEMPLATE_PATH);
    const squildletPackageJson: {version: string} = require(SQUIDLET_PACKAGE_JSON_PATH);

    return _template(templateContent)({
      version: squildletPackageJson.version,
      dependencies: JSON.stringify(dependencies),
    });
  }

}
