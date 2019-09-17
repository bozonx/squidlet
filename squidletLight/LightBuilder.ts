import * as path from 'path';

import EnvBuilder from '../hostEnvBuilder/EnvBuilder';
import {APP_SWITCHER_FILE_NAME, HOST_TMP_DIR} from '../shared/constants';
import Os from '../shared/Os';
import {getFileNameOfPath, removeExtFromFileName, REPO_ROOT, SYSTEM_DIR} from '../shared/helpers';
import Platforms from '../system/interfaces/Platforms';
import HostEnvSet from '../hostEnvBuilder/interfaces/HostEnvSet';
import HostEntitySet from '../hostEnvBuilder/interfaces/HostEntitySet';
import {EntityTypePlural} from '../system/interfaces/EntityTypes';
import rollupToOneFile from '../shared/buildToJs/rollupToOneFile';


export default class LightBuilder {
  private readonly workDir: string;
  private readonly platform: Platforms;
  private readonly machine: string;
  private readonly tmpDir: string;
  private readonly minimize: boolean;
  private readonly os: Os = new Os();
  private readonly envBuilder: EnvBuilder;


  constructor(
    workDir: string,
    platform: Platforms,
    machine: string,
    hostConfigPath: string,
    minimize: boolean = true
  ) {
    this.workDir = workDir;
    this.platform = platform;
    this.machine = machine;
    this.tmpDir = path.join(this.workDir, HOST_TMP_DIR);
    this.minimize = minimize;

    this.envBuilder = new EnvBuilder(
      hostConfigPath,
      this.workDir,
      this.tmpDir,
      this.platform,
      this.machine,
    );
  }


  async build() {
    // TODO: удаляет все вместе с родительской директорией, но лучше чтобы только содержимое
    await this.os.rimraf(this.workDir);
    await this.os.mkdirP(this.tmpDir);

    console.info(`===> collect env set`);
    await this.envBuilder.collect();

    const indexFilePath = path.join(this.tmpDir, 'index.ts');
    const indexFileStr: string = await this.makeIndexFile();
    const iosFilePath: string = path.join(this.tmpDir, 'ios.ts');
    const iosFileStr: string = await this.prepareIoClassesString();
    const envSetPath: string = path.join(this.tmpDir, 'envSet.ts');
    const envSetStr: string = await this.prepareEnvSetString();
    const devicesFilePath: string = path.join(this.tmpDir, 'devicesMainFiles.ts');
    const devicesFileStr: string = await this.makeEntitiesMainFilesString('devices');
    const driversFilePath: string = path.join(this.tmpDir, 'driversMainFiles.ts');
    const driversFileStr: string = await this.makeEntitiesMainFilesString('drivers');
    const servicesFilePath: string = path.join(this.tmpDir, 'servicesMainFiles.ts');
    const servicesFileStr: string = await this.makeEntitiesMainFilesString('services');

    await this.os.writeFile(indexFilePath, indexFileStr);
    await this.os.writeFile(iosFilePath, iosFileStr);
    await this.os.writeFile(envSetPath, envSetStr);
    await this.os.writeFile(devicesFilePath, devicesFileStr);
    await this.os.writeFile(driversFilePath, driversFileStr);
    await this.os.writeFile(servicesFilePath, servicesFileStr);

    await this.rollup();
  }


  private async makeIndexFile(): Promise<string> {
    const appSwitcherPath = path.relative(
      this.tmpDir,
      path.join(SYSTEM_DIR, APP_SWITCHER_FILE_NAME)
    );
    const ioSetPath = path.relative(
      this.tmpDir,
      path.join(REPO_ROOT, 'squidletLight', 'IoSetBuiltin')
    );

    // TODO: use constants
    return `import envSet from './envSet';\n`
      + `import * as ios from './ios';\n`
      + `import * as devicesMainFiles from './devicesMainFiles';\n`
      + `import * as driversMainFiles from './driversMainFiles';\n`
      + `import * as servicesMainFiles from './servicesMainFiles';\n`
      + `import AppSwitcher from '${appSwitcherPath}';\n`
      + `import IoSetBuiltin from '${ioSetPath}';\n`
      + '\n\n'
      + `const ioSet: any = new IoSetBuiltin(envSet, ios, devicesMainFiles, driversMainFiles, servicesMainFiles);\n`
      // TODO: make real restart
      + `const restartHandler = () => ioSet.getIo('Sys').restart().catch(console.error);\n`
      + `const app: AppSwitcher = new AppSwitcher(ioSet, restartHandler);\n`
      + '\n'
      + `app.start().catch(console.error);\n`;
  }

  private prepareIoClassesString(): string {
    const platformDir = this.envBuilder.configManager.machinePlatformDir;
    // TODO: лучше брать только те что реально используются
    const machineIosList = this.envBuilder.configManager.machineConfig.ios;
    let exportsStr = '';

    for (let ioPath of machineIosList) {
      const ioName: string = getFileNameOfPath(ioPath);
      const ioRelPath: string = path.relative(
        this.tmpDir,
        path.resolve(platformDir, ioPath)
      );

      exportsStr += this.makeExportString(ioName, ioRelPath);
    }

    return exportsStr;
  }

  private prepareEnvSetString(): string {
    const envSetStr = JSON.stringify(this.envBuilder.generateProdEnvSet(), null,2);

    return `const envSet: any = ${envSetStr};\n\n`
      + `export default envSet;`;
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

      exportsStr += this.makeExportString(entities[entityName].manifest.name, relFileName);
    }

    return exportsStr;
  }

  private async rollup() {
    const indexFilePath = path.join(this.tmpDir, 'index.ts');
    const outputFilePath = path.join(this.workDir, 'index.js');

    await rollupToOneFile(
      'Squidlet',
      indexFilePath,
      outputFilePath,
      undefined,
      // TODO: better to build in
      [
        'ws',
        'mqtt-packet',
        'mqtt',
        'axios',
        // TODO: build in this
        'bcx-expression-evaluator',
      ],
      false,
      this.minimize,
    );
  }

  private makeExportString(defaultImportName: string, pathToFile: string): string {
    return `export {default as ${defaultImportName}} from '${removeExtFromFileName(pathToFile)}';\n`;
  }

}
