import * as path from 'path';
import * as _ from 'lodash';

import EnvBuilder from '../../hostEnvBuilder/EnvBuilder';
import {HOST_TMP_DIR} from '../../shared/constants';
import Os from '../../shared/Os';
import {REPO_ROOT} from '../../shared/helpers';
import Platforms from '../../system/interfaces/Platforms';
import HostEnvSet from '../../hostEnvBuilder/interfaces/HostEnvSet';
import HostEntitySet from '../../hostEnvBuilder/interfaces/HostEntitySet';
import {EntityTypePlural} from '../../system/interfaces/EntityTypes';
import {makeExportString, rollupBuild, prepareIoClassesString, prepareEnvSetString} from '../helpers';
import LogLevel from '../../system/interfaces/LogLevel';


const DEVICES_MAIN_FILES = 'devicesMainFiles';
const DRIVERS_MAIN_FILES = 'driversMainFiles';
const SERViCES_MAIN_FILES = 'servicesMainFiles';
const INDEX_FILE_TPL_FILE_NAME = 'index.template.ts';


export default class AppBuilder {
  private readonly tmpDir: string;
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

    const envBuilderTmpDir = path.join(this.tmpDir, HOST_TMP_DIR);

    this.envBuilder = new EnvBuilder(
      hostConfigPath,
      tmpDir,
      envBuilderTmpDir,
      this.platform,
      this.machine,
    );
  }


  async build() {
    // TODO: удаляет все вместе с родительской директорией, но лучше чтобы только содержимое
    await this.os.mkdirP(this.tmpDir);

    console.info(`===> collect env set`);
    await this.envBuilder.collect();

    const indexFilePath = path.join(this.tmpDir, 'index.ts');
    const indexFileStr: string = await this.makeIndexFile();
    const iosFilePath: string = path.join(this.tmpDir, 'ios.ts');
    const iosFileStr: string = await this.prepareIoClassesString();
    const envSetPath: string = path.join(this.tmpDir, 'envSet.ts');
    const envSetStr: string = await prepareEnvSetString(this.envBuilder.generateProdEnvSet());
    const devicesFilePath: string = path.join(this.tmpDir, `${DEVICES_MAIN_FILES}.ts`);
    const devicesFileStr: string = await this.makeEntitiesMainFilesString('devices');
    const driversFilePath: string = path.join(this.tmpDir, `${DRIVERS_MAIN_FILES}.ts`);
    const driversFileStr: string = await this.makeEntitiesMainFilesString('drivers');
    const servicesFilePath: string = path.join(this.tmpDir, `${SERViCES_MAIN_FILES}.ts`);
    const servicesFileStr: string = await this.makeEntitiesMainFilesString('services');

    await this.os.writeFile(indexFilePath, indexFileStr);
    await this.os.writeFile(iosFilePath, iosFileStr);
    await this.os.writeFile(envSetPath, envSetStr);
    await this.os.writeFile(devicesFilePath, devicesFileStr);
    await this.os.writeFile(driversFilePath, driversFileStr);
    await this.os.writeFile(servicesFilePath, servicesFileStr);
    // make bundle
    await rollupBuild(this.outputPath, this.tmpDir, this.minimize);
  }


  private async makeIndexFile(): Promise<string> {
    const fileContentPath = path.join(__dirname, '../', INDEX_FILE_TPL_FILE_NAME);
    const fileContent: string = await this.os.getFileContent(fileContentPath);
    const relativeRepoRoot = path.relative( this.tmpDir, REPO_ROOT );

    return _.template(fileContent)({ REPO_ROOT: relativeRepoRoot });
  }

  prepareIoClassesString(): string {
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
