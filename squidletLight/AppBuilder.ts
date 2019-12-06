import * as path from 'path';
import * as _ from 'lodash';

import EnvBuilder from '../hostEnvBuilder/EnvBuilder';
import Os from '../shared/helpers/Os';
import {REPO_ROOT} from '../shared/helpers/helpers';
import Platforms from '../system/interfaces/Platforms';
import HostEnvSet from '../hostEnvBuilder/interfaces/HostEnvSet';
import HostEntitySet from '../hostEnvBuilder/interfaces/HostEntitySet';
import {EntityTypePlural} from '../system/interfaces/EntityTypes';
import {makeExportString, rollupBuild, prepareIoClassesString, prepareEnvSetString} from './helpers';
import LogLevel from '../system/interfaces/LogLevel';
import {ENV_BUILD_TMP_DIR} from '../shared/constants';

const squidletPackageJson = require('../package.json');


const DEVICES_MAIN_FILES = 'devicesMainFiles';
const DRIVERS_MAIN_FILES = 'driversMainFiles';
const SERViCES_MAIN_FILES = 'servicesMainFiles';
const INDEX_FILE_TPL_FILE_NAME = 'index.template.ts';
const PACKAGE_JSON_TPL_FILE_NAME = 'package.template.json';


export default class AppBuilder {
  private readonly tmpDir: string;
  // TODO: почему не dir ????
  private readonly outputPath: string;
  private readonly platform: Platforms;
  private readonly machine: string;
  private readonly minimize: boolean;
  private readonly logLevel?: LogLevel;
  private readonly os: Os = new Os();
  private readonly envBuilder: EnvBuilder;


  constructor(
    tmpDir: string,
    outputPath: string,
    platform: Platforms,
    machine: string,
    hostConfigPath: string,
    minimize: boolean = true,
    logLevel?: LogLevel
  ) {
    this.tmpDir = tmpDir;
    this.outputPath = outputPath;
    this.platform = platform;
    this.machine = machine;
    this.minimize = minimize;
    this.logLevel = logLevel;

    const envBuilderTmpDir = path.join(this.tmpDir, ENV_BUILD_TMP_DIR);

    this.envBuilder = new EnvBuilder(
      hostConfigPath,
      tmpDir,
      envBuilderTmpDir,
      this.platform,
      this.machine,
    );
  }


  async build() {
    await this.os.mkdirP(this.tmpDir);
    await this.os.rimraf(`${this.tmpDir}/*`);

    console.info(`===> collect env set`);
    await this.envBuilder.collect();

    const indexFileStr: string = await this.makeIndexFile();
    const packageJsonStr: string = await this.makePackageJson();
    const iosFileStr: string = await this.prepareIoClassesString();
    const envSetStr: string = await prepareEnvSetString(this.envBuilder.generateProdEnvSet());
    const devicesFileStr: string = await this.makeEntitiesMainFilesString('devices');
    const driversFileStr: string = await this.makeEntitiesMainFilesString('drivers');
    const servicesFileStr: string = await this.makeEntitiesMainFilesString('services');

    await this.os.writeFile(path.join(this.tmpDir, 'index.ts'), indexFileStr);
    await this.os.writeFile(path.join(this.tmpDir, 'ios.ts'), iosFileStr);
    await this.os.writeFile(path.join(this.tmpDir, 'envSet.ts'), envSetStr);
    await this.os.writeFile(path.join(this.tmpDir, `${DEVICES_MAIN_FILES}.ts`), devicesFileStr);
    await this.os.writeFile(path.join(this.tmpDir, `${DRIVERS_MAIN_FILES}.ts`), driversFileStr);
    await this.os.writeFile(path.join(this.tmpDir, `${SERViCES_MAIN_FILES}.ts`), servicesFileStr);
    // make bundle
    await rollupBuild(this.outputPath, this.tmpDir, this.minimize);
    // make package.json
    // TODO: нужно указать outputDir
    await this.os.writeFile(path.join(this.outputPath, 'package.json'), packageJsonStr);
  }


  private prepareIoClassesString(): string {
    const platformDir = this.envBuilder.configManager.machinePlatformDir;
    const machineIosList = this.envBuilder.configManager.machineConfig.ios;

    return prepareIoClassesString(machineIosList, platformDir, this.tmpDir);
  }

  private makeEntitiesMainFilesString(pluralName: EntityTypePlural): string {
    const envSet: HostEnvSet = this.envBuilder.generateDevelopEnvSet();
    const entities: {[index: string]: HostEntitySet} = envSet.entities[pluralName];
    let exportsStr = '';

    for (let entityName of Object.keys(entities)) {
      const srcAbsDir: string = entities[entityName].srcDir;
      const relFileName: string = path.relative(
        this.tmpDir,
        path.join(srcAbsDir, entities[entityName].manifest.main)
      );

      exportsStr += makeExportString(entities[entityName].manifest.name, relFileName);
    }

    if (!exportsStr) return 'export default {};\n';

    return exportsStr;
  }

  private async makeIndexFile(): Promise<string> {
    const fileContentPath = path.join(__dirname, '../', INDEX_FILE_TPL_FILE_NAME);
    const fileContent: string = await this.os.getFileContent(fileContentPath);
    const relativeRepoRoot = path.relative( this.tmpDir, REPO_ROOT );

    return _.template(fileContent)({ REPO_ROOT: relativeRepoRoot });
  }

  protected async makePackageJson(): Promise<string> {
    const fileContentPath = path.join(__dirname, '../', PACKAGE_JSON_TPL_FILE_NAME);
    const fileContent: string = await this.os.getFileContent(fileContentPath);

    return _.template(fileContent)({ VERSION: squidletPackageJson.version });
  }

}

// private makeIndexFile(): string {
//   const appSwitcherPath = path.relative(
//     this.tmpDir,
//     path.join(SYSTEM_DIR, APP_STARTER_FILE_NAME)
//   );
//   const ioSetPath = path.relative(
//     this.tmpDir,
//     path.join(REPO_ROOT, 'squidletLight', 'IoSetBuiltin')
//   );
//   const ConsoleLoggerPath = path.relative(
//     this.tmpDir,
//     path.join(REPO_ROOT, 'shared', 'ConsoleLogger')
//   );
//
//   return `import envSet from './envSet';\n`
//     + `import * as ios from './ios';\n`
//     + `import * as ${DEVICES_MAIN_FILES} from './${DEVICES_MAIN_FILES}';\n`
//     + `import * as ${DRIVERS_MAIN_FILES} from './${DRIVERS_MAIN_FILES}';\n`
//     + `import * as ${SERViCES_MAIN_FILES} from './${SERViCES_MAIN_FILES}';\n`
//     + `import AppSwitcher from '${appSwitcherPath}';\n`
//     + `import IoSetBuiltin from '${ioSetPath}';\n`
//     + `import ConsoleLogger from '${ConsoleLoggerPath}';\n`
//     + '\n\n'
//     // TODO: брать из переменной окружения ????
//     + `const consoleLogger = new ConsoleLogger(${this.logLevel})`
//     + '\n\n'
//     + `async function start() {\n`
//     + `  const ioSet: any = new IoSetBuiltin(envSet, ios, ${DEVICES_MAIN_FILES}, ${DRIVERS_MAIN_FILES}, ${SERViCES_MAIN_FILES});\n`
//     + `\n`
//     + `  await ioSet.init();\n`
//     + `\n`
//     // TODO: make real restart
//     + `  const restartHandler = () => ioSet.getIo('Sys').restart().catch(console.error);\n`
//     + `  const app: AppSwitcher = new AppSwitcher(ioSet, restartHandler, consoleLogger);\n`
//     + '\n'
//     + `  await app.start();\n`
//     + '}\n'
//     + '\n'
//     + 'start().catch(console.error);\n';
// }
