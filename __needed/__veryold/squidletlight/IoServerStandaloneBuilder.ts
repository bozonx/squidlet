import * as path from 'path';
import Platforms from '../../system/interfaces/Platforms';
import Os from '../../shared/helpers/Os';
import hostDefaultConfig from '../../hostEnvBuilder/configs/hostDefaultConfig';
import HostEnvSet from '../../hostEnvBuilder/interfaces/HostEnvSet';
import {rollupBuild, prepareIoClassesString, prepareEnvSetString} from '../../squidletLight/helpers';
import {loadMachineConfigInPlatformDir, REPO_ROOT, resolvePlatformDir, SYSTEM_DIR} from '../../shared/helpers/helpers';
import MachineConfig from '../../hostEnvBuilder/interfaces/MachineConfig';
import LogLevel from '../../system/interfaces/LogLevel';
import {AppType} from '../../system/interfaces/AppType';


export const IO_SERVER_FILE_NAME = 'IoServer';


export class IoServerStandaloneBuilder {
  private readonly tmpDir: string;
  private readonly outputPath: string;
  private readonly platform: Platforms;
  private readonly machine: string;
  //private readonly tmpDir: string;
  private readonly minimize: boolean;
  private readonly logLevel?: LogLevel;
  private readonly os: Os = new Os();


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
    //this.tmpDir = path.join(this.workDir, HOST_TMP_DIR);

    // TODO: почему не используется logLevel???
  }


  async build() {
    await this.os.mkdirP(this.tmpDir);
    await this.os.rimraf(`${this.tmpDir}/*`);

    const indexFilePath = path.join(this.tmpDir, 'index.ts');
    const indexFileStr: string = this.makeIndexFile();
    const iosFilePath: string = path.join(this.tmpDir, 'ios.ts');
    const iosFileStr: string = await this.prepareIoClassesString();
    const envSetPath: string = path.join(this.tmpDir, 'envSet.ts');
    const envSetStr: string = await this.prepareEnvSetString();

    await this.os.writeFile(indexFilePath, indexFileStr);
    await this.os.writeFile(iosFilePath, iosFileStr);
    await this.os.writeFile(envSetPath, envSetStr);

    // TODO: use outputPath

    await rollupBuild(this.outputPath, this.tmpDir, this.minimize);
  }


  private makeIndexFile(): string {
    const ioServerPath = path.relative(
      this.tmpDir,
      path.join(SYSTEM_DIR, 'ioServer', IO_SERVER_FILE_NAME)
    );
    const ioSetPath = path.relative(
      this.tmpDir,
      path.join(REPO_ROOT, 'squidletLight', 'IoSetBuiltin')
    );
    const ConsoleLoggerPath = path.relative(
      this.tmpDir,
      path.join(REPO_ROOT, 'shared', 'ConsoleLogger')
    );

    return `import envSet from './envSet';\n`
      + `import * as ios from './ios';\n`
      + `import IoServer from '${ioServerPath}';\n`
      + `import IoSetBuiltin from '${ioSetPath}';\n`
      + `import ConsoleLogger from '${ConsoleLoggerPath}';\n`
      + '\n\n'
      + `const consoleLogger = new ConsoleLogger(${this.logLevel})`
      + '\n\n'
      + `async function start() {\n`
      + `  const ioSet: any = new IoSetBuiltin(envSet, ios);\n`
      + `\n`
      + `  await ioSet.init();\n`
      + `\n`
      + `  const shutdownRequestCb = () => console.warn("WARNING: Restart isn't allowed in io-server standalone mode");\n`
      + `  const app: IoServer = new IoServer(ioSet, shutdownRequestCb, consoleLogger.debug, consoleLogger.info, consoleLogger.error);\n`
      + '\n'
      + `  await app.start();\n`
      + '}\n'
      + '\n'
      + 'start().catch(console.error);\n';
  }

  private prepareIoClassesString(): string {
    const platformDir = resolvePlatformDir(this.platform);
    const machineConfig: MachineConfig = loadMachineConfigInPlatformDir(this.os, platformDir, this.machine);

    return prepareIoClassesString(machineConfig.ios, platformDir, this.tmpDir);
  }

  private prepareEnvSetString(): string {
    // TODO: review
    const appType: AppType = 'ioServer';

    const envSet: HostEnvSet = {
      configs: {
        config: {
          appType,
          id: 'io-server',
          platform: this.platform,
          machine: this.machine,
          ...hostDefaultConfig,
          ioServer: {
            ...hostDefaultConfig.ioServer,
            host: '0.0.0.0',
          },
        },
        driversList: [],
        servicesList: [],
        devicesDefinitions: [],
        driversDefinitions: {},
        servicesDefinitions: {},
        iosDefinitions: {},
      },
      entities: {
        devices: {},
        drivers: {},
        services: {},
      }
    };

    return prepareEnvSetString(envSet);
  }

}
