import Os, {SpawnCmdResult} from '../Os';
import {isKindOfNumber} from '../../system/lib/common';


// TODO: test

/**
 * It returns uid.
 * @param os
 * @param argUser - user name or uid
 */
async function resolveUid(os: Os, argUser?: string | number): Promise<number | undefined> {
  if (!argUser) {
    return;
  }
  else if (isKindOfNumber(argUser)) {
    return parseInt(argUser as any);
  }

  return getIdResult(os, 'u', argUser);
}

/**
 * It return gid.
 * @param os
 * @param argGroup - group name or gid
 */
async function resolveGid(os: Os, argGroup?: string | number): Promise<number | undefined> {
  if (!argGroup) {
    return;
  }
  else if (isKindOfNumber(argGroup)) {
    return parseInt(argGroup as any);
  }

  return getIdResult(os, 'g', argGroup);
}

async function getIdResult(os: Os, userOrGroup: 'u' | 'g', name: string | number): Promise<number> {
  const cmd = `id -${userOrGroup} ${name}`;
  const result: SpawnCmdResult = await os.spawnCmd(cmd);

  if (result.status) {
    throw new Error(`Can't resolve id "${cmd}": status ${result.status} ${result.stderr.join(', ')}`);
  }

  return parseInt( result.stdout.join('').trim() );
}
