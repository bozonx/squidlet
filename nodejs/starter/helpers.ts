import Os, {SpawnCmdResult} from '../../shared/Os';


export async function installNpmModules(os: Os, cwd: string, modules: string[] = []) {
  const cmd = `npm install ${modules.join(' ')}`;
  const result: SpawnCmdResult = await os.spawnCmd(cmd, cwd);

  if (result.status) {
    console.error(`ERROR: npm ends with code ${result.status}`);
    console.error(result.stdout);
    console.error(result.stderr);
  }
}
