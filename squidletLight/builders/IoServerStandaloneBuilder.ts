import * as path from 'path';
import Platforms from '../../system/interfaces/Platforms';
import {HOST_TMP_DIR, IO_SERVER_FILE_NAME} from '../../shared/constants';
import Os from '../../shared/Os';
import hostDefaultConfig from '../../hostEnvBuilder/configs/hostDefaultConfig';
import HostEnvSet from '../../hostEnvBuilder/interfaces/HostEnvSet';
import {rollupBuild, prepareIoClassesString, prepareEnvSetString} from '../helpers';
import {loadMachineConfigInPlatformDir, REPO_ROOT, resolvePlatformDir, SYSTEM_DIR} from '../../shared/helpers';
import MachineConfig from '../../hostEnvBuilder/interfaces/MachineConfig';


export class IoServerStandaloneBuilder {
  private readonly workDir: string;
  private readonly platform: Platforms;
  private readonly machine: string;
  private readonly tmpDir: string;
  private readonly minimize: boolean;
  private readonly os: Os = new Os();


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
  }


  async build() {
    // TODO: удаляет все вместе с родительской директорией, но лучше чтобы только содержимое
    await this.os.rimraf(this.workDir);
    await this.os.mkdirP(this.tmpDir);

    const indexFilePath = path.join(this.tmpDir, 'index.ts');
    const indexFileStr: string = this.makeIndexFile();
    const iosFilePath: string = path.join(this.tmpDir, 'ios.ts');
    const iosFileStr: string = await this.prepareIoClassesString();
    const envSetPath: string = path.join(this.tmpDir, 'envSet.ts');
    const envSetStr: string = await this.prepareEnvSetString();

    await this.os.writeFile(indexFilePath, indexFileStr);
    await this.os.writeFile(iosFilePath, iosFileStr);
    await this.os.writeFile(envSetPath, envSetStr);

    await rollupBuild(this.workDir, this.tmpDir, this.minimize);
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

    return `import envSet from './envSet';\n`
      + `import * as ios from './ios';\n`
      + `import IoServer from '${ioServerPath}';\n`
      + `import IoSetBuiltin from '${ioSetPath}';\n`
      + '\n\n'
      + `async function start() {\n`
      + `  const ioSet: any = new IoSetBuiltin(envSet, ios);\n`
      + `\n`
      + `  await ioSet.init();\n`
      + `\n`
      + `  const shutdownRequestCb = () => console.warn("WARNING: Restart isn't allowed in io-server standalone mode");\n`
      + `  const app: IoServer = new IoServer(ioSet, shutdownRequestCb, console.log, console.info, console.error);\n`
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
    const envSet: HostEnvSet = {
      configs: {
        config: {
          id: 'io-server',
          platform: this.platform,
          machine: this.machine,
          ...hostDefaultConfig,
          ioServer: {
            ...hostDefaultConfig.ioServer,
            host: '0.0.0.0',
          },
        },
        systemDrivers: [],
        regularDrivers: [],
        systemServices: [],
        regularServices: [],
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
