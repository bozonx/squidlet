import NodejsMachines from '../../../../squidlet-networking/src/io/nodejs/interfaces/NodejsMachines';
import Os, {SpawnCmdResult} from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/shared/helpers/Os.js';


// TODO: test


export async function getOsMachine(os: Os): Promise<NodejsMachines> {
  const spawnResult: SpawnCmdResult = await os.spawnCmd('hostnamectl');

  if (spawnResult.status !== 0) {
    throw new Error(`Can't execute a "hostnamectl" command: ${spawnResult.stderr.join('\n')}`);
  }

  const {osName, arch} = parseHostNameCtlResult(spawnResult.stdout.join('\n'));

  return resolveMachineByOsAndArch(osName, arch);
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
