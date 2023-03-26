import * as path from 'path';
import * as _ from 'lodash';

import EnvBuilder from '../hostEnvBuilder/EnvBuilder';
import Os from '../../../../../../../mnt/disk2/workspace/squidlet/__old/shared/helpers/Os.js';
import {makeFileCheckSum, REPO_ROOT} from '../../../../../../../mnt/disk2/workspace/squidlet/__old/shared/helpers/helpers.js';
import Platforms from '../../../../../../../mnt/disk2/workspace/squidlet/__old/system/interfaces/Platforms.js';
import HostEnvSet from '../hostEnvBuilder/interfaces/HostEnvSet';
import HostEntitySet from '../hostEnvBuilder/interfaces/HostEntitySet';
import {EntityTypePlural} from '../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/interfaces/EntityTypes.js';
import {
  makeExportString,
  rollupBuild,
  prepareIoClassesString,
  prepareEnvSetString,
  resolveOutputDir
} from '../../../../../../../mnt/disk2/workspace/squidlet/__old/squidletLight/helpers.js';
import LogLevel from '../../../../../../../mnt/disk2/workspace/squidlet/__old/system/interfaces/LogLevel.js';
import {ENV_BUILD_TMP_DIR, REPO_BUILD_DIR} from '../../../../../../../mnt/disk2/workspace/squidlet/__old/shared/constants.js';
import {BUNDLE_FILE_NAME, BUNDLE_SUM_FILE_NAME} from '../entities/services/Updater/BundleUpdate';
import GroupConfigParser from '../../../../../../../mnt/disk2/workspace/squidlet/__old/shared/helpers/GroupConfigParser.js';

const squidletPackageJson = require('../../package.json');


const SQUIDLET_LIGHT_WORK_DIR = 'light';
const TMP_SUB_DIR = 'tmp';
const DEVICES_MAIN_FILES = 'devicesMainFiles';
const DRIVERS_MAIN_FILES = 'driversMainFiles';
const SERViCES_MAIN_FILES = 'servicesMainFiles';
const INDEX_FILE_TPL_FILE_NAME = 'index.template.ts';
const PACKAGE_JSON_TPL_FILE_NAME = 'package.template.json';


export const DEFAULT_WORK_DIR = path.join(REPO_ROOT, REPO_BUILD_DIR, SQUIDLET_LIGHT_WORK_DIR);


export default class AppBuilder {
  private readonly tmpDir: string;
  private readonly outputDir: string;
  private readonly platform: Platforms;
  private readonly machine: string;
  private readonly hostName?: string;
  private readonly minimize: boolean;
  private readonly logLevel?: LogLevel;
  private readonly os: Os = new Os();
  private readonly groupConfig: GroupConfigParser;
  private _envBuilder?: EnvBuilder;

  private get envBuilder(): EnvBuilder {
    return this._envBuilder as any;
  }


  constructor(
    platform: Platforms,
    machine: string,
    hostConfigPath: string,
    hostName?: string,
    argOutputDir?: string,
    minimize: boolean = true,
    logLevel?: LogLevel,
  ) {
    const workDir: string = DEFAULT_WORK_DIR;

    this.tmpDir = path.join(workDir, TMP_SUB_DIR);
    this.outputDir = resolveOutputDir(workDir, argOutputDir);
    this.platform = platform;
    this.machine = machine;
    this.hostName = hostName;
    this.minimize = minimize;
    this.logLevel = logLevel;
    this.groupConfig = new GroupConfigParser(this.os, hostConfigPath);
  }

  async init() {
    await this.groupConfig.init();

    const envBuilderTmpDir = path.join(this.tmpDir, ENV_BUILD_TMP_DIR);

    this._envBuilder = new EnvBuilder(
      this.groupConfig.getHostConfig(this.hostName),
      this.tmpDir,
      envBuilderTmpDir,
      this.platform,
      this.machine,
    );
  }


  build = async () => {
    await this.os.rimraf(`${this.outputDir}/*`);
    await this.os.rimraf(`${this.tmpDir}/*`);
    await this.os.mkdirP(this.outputDir);
    await this.os.mkdirP(this.tmpDir);

    console.info(`===> collect env set`);
    await this.envBuilder.collect();

    const bundlePath: string = path.join(this.outputDir, BUNDLE_FILE_NAME);
    const indexFileStr: string = await this.makeIndexFile();
    const packageJsonStr: string = await this.makePackageJson();
    const iosFileStr: string = await this.prepareIoClassesString();
    const envSetStr: string = await prepareEnvSetString(this.envBuilder.generateProdEnvSet());
    const devicesFileStr: string = await this.makeEntitiesMainFilesString('devices');
    const driversFileStr: string = await this.makeEntitiesMainFilesString('drivers');
    const servicesFileStr: string = await this.makeEntitiesMainFilesString('services');

    console.info(`===> Write ts files into tmp dir`);
    await this.os.writeFile(path.join(this.tmpDir, 'index.ts'), indexFileStr);
    await this.os.writeFile(path.join(this.tmpDir, 'ios.ts'), iosFileStr);
    await this.os.writeFile(path.join(this.tmpDir, 'envSet.ts'), envSetStr);
    await this.os.writeFile(path.join(this.tmpDir, `${DEVICES_MAIN_FILES}.ts`), devicesFileStr);
    await this.os.writeFile(path.join(this.tmpDir, `${DRIVERS_MAIN_FILES}.ts`), driversFileStr);
    await this.os.writeFile(path.join(this.tmpDir, `${SERViCES_MAIN_FILES}.ts`), servicesFileStr);

    console.info(`===> Make bundle`);
    await rollupBuild(bundlePath, this.tmpDir, this.minimize);

    console.info(`===> Make check sum`);
    await makeFileCheckSum(bundlePath, path.join(this.outputDir, BUNDLE_SUM_FILE_NAME));

    console.info(`===> Make package.json`);
    await this.os.writeFile(path.join(this.outputDir, 'package.json'), packageJsonStr);
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
    const fileContentPath = path.join(__dirname, INDEX_FILE_TPL_FILE_NAME);
    const fileContent: string = await this.os.getFileContent(fileContentPath);
    const relativeRepoRoot = path.relative( this.tmpDir, REPO_ROOT );

    return _.template(fileContent)({
      REPO_ROOT: relativeRepoRoot,
      LOG_LEVEL: `'${this.logLevel}'` || 'undefined',
    });
  }

  private async makePackageJson(): Promise<string> {
    const fileContentPath = path.join(__dirname, PACKAGE_JSON_TPL_FILE_NAME);
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
