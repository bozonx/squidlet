import * as path from 'path';

import MachineConfig from '../hostEnvBuilder/interfaces/MachineConfig';
import Platforms from '../hostEnvBuilder/interfaces/Platforms';
import Os, {SpawnCmdResult} from './Os';
import NodejsMachines from '../nodejs/interfaces/NodejsMachines';


export const REPO_ROOT = path.resolve(__dirname, '../');
export const SYSTEM_DIR = path.join(REPO_ROOT, 'system');
export const SQUIDLET_PACKAGE_JSON_PATH = path.join(REPO_ROOT, 'package.json');


/**
 * Make io name from io path without extension.
 * E.g "/path/to/file.ts" -> "file"
 */
export function getFileNameOfPath(pathToIo: string): string {
  const parsed = path.parse(pathToIo);

  if (!parsed.name) throw new Error(`Can't parse io name of path "${pathToIo}"`);

  return parsed.name;
}

export function resolvePlatformDir(platform: Platforms): string {
  return path.resolve(__dirname, `../${platform}`);
}

export function loadMachineConfigInPlatformDir(os: Os, platformDir: string, machine: string): MachineConfig {
  const machineConfigPath = path.join(platformDir, `machine-${machine}`);

  return os.require(machineConfigPath).default;
}

export async function getOsMachine(os: Os): Promise<NodejsMachines> {
  const spawnResult: SpawnCmdResult = await os.spawnCmd('hostnamectl');

  if (spawnResult.status !== 0) {
    throw new Error(`Can't execute a "hostnamectl" command: ${spawnResult.stderr.join('\n')}`);
  }

  const {osName, arch} = parseHostNameCtlResult(spawnResult.stdout.join('\n'));

  return resolveMachineByOsAndArch(osName, arch);
}

export function parseHostNameCtlResult(stdout: string): {osName: string, arch: string} {
  const osMatch = stdout.match(/Operating System:\s*(.+)$/m);
  const architectureMatch = stdout.match(/Architecture:\s*([\w\d\-]+)/);

  if (!osMatch) {
    throw new Error(`Can't resolve an operating system of the machine`);
  }
  else if (!architectureMatch) {
    throw new Error(`Can't resolve an architecture of the machine`);
  }

  return {
    osName: osMatch[1].trim(),
    arch: architectureMatch[1],
  };
}

export function resolveMachineByOsAndArch(osName: string, arch: string): NodejsMachines {
  if (arch.match(/x86/)) {
    // no matter which OS and 32 or 64 bits
    return 'x86';
  }
  else if (arch === 'arm') {
    // TODO: use cpuinfo to resolve Revision or other method
    if (osName.match(/Raspbian/)) {
      return 'rpi';
    }
    else {
      return 'arm';
    }
  }

  throw new Error(`Unsupported architecture "${arch}"`);
}

/**
 * Make list of io names from list of io paths.
 * E.g ['/path/to/file1.ts', '/path/file2'] -> ['file1', 'file2']
 */
export function makeListOfNamesFromPaths(paths: string[]): string[] {
  return paths.map((item) => getFileNameOfPath(item));
}

// /**
//  * Run command and don't print stdout if it returns code 0
//  */
// export async function runCmd(os: Os, cmd: string, cwd: string) {
//   // TODO: use uid, gid
//   const result: SpawnCmdResult = await os.spawnCmd(cmd, cwd);
//
//   if (result.status) {
//     console.error(`ERROR: npm ends with code ${result.status}`);
//     console.error(result.stdout);
//     console.error(result.stderr);
//   }
// }

// TODO: !!! test bellow

/**
 * If work dir is passed then it will be made an absolute according CWD.
 * If isn't set then SQUIDLET_ROOT env variable will be used - $SQUIDLET_ROOT/<subDir>.
 * Otherwise "build/<subDir>" dir or this repository will be used.
 */
export function resolveWorkDir(subDir: string, argWorkDir?: string): string {
  const envRoot: string | undefined = process.env['SQUIDLET_ROOT'];

  if (argWorkDir) {
    // if it set as an argument - make it absolute
    return path.resolve(process.cwd(), argWorkDir);
  }
  else if (envRoot) {
    // else use under a $SQUIDLET_ROOT
    return path.join(envRoot, subDir);
  }

  return path.join(REPO_ROOT, 'build', subDir);
}

/**
 * Call cb on SIGTERM and SIGINT signals
 */
export function listenScriptEnd(cb: () => Promise<void>) {
  const cbWrapper = () => {
    return cb()
      .then(() => process.exit(0))
      .catch((err) => {
        console.error(err);

        process.exit(2);
      });
  };

  process.on('SIGTERM', () => {
    console.info('SIGTERM signal has been caught');

    return cbWrapper();
  });
  process.on('SIGINT', () => {
    console.info('SIGINT signal has been caught');

    return cbWrapper();
  });

  // TODO: решить какой испоьзовать на rpi
  process.on('SIGUSR1', () => {
    console.info('SIGUSR1 signal has been caught');
  });
  process.on('SIGUSR2', () => {
    console.info('SIGUSR2 signal has been caught');
  });
  process.on('SIGPIPE', () => {
    console.info('SIGPIPE signal has been caught');
  });
  process.on('SIGCHLD', () => {
    console.info('SIGCHLD signal has been caught');
  });
  process.on('SIGWINCH', () => {
    console.info('SIGWINCH signal has been caught');
  });
  // process.on('SIGKILL', () => {
  //   console.info('SIGKILL signal has been caught');
  // });
  process.on('SIGSEGV', () => {
    console.info('SIGSEGV signal has been caught');
  });
  process.on('SIGHUP', () => {
    console.info('SIGHUP signal has been caught');
  });
  process.on('SIGCONT', () => {
    console.info('SIGCONT signal has been caught');
  });
}

// export function loadMachineConfig(platform: Platforms, machine: string): MachineConfig {
//   const platformDir: string = resolvePlatformDir(platform);
//   const machineConfigPath = path.join(platformDir, `machine-${machine}`);
//
//   return require(machineConfigPath).default;
// }
