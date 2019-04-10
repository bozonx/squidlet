import PreHostConfig from '../hostEnvBuilder/interfaces/PreHostConfig';

export default class UpdateHost {
  private readonly preHostConfig: PreHostConfig;

  constructor(preHostConfig: PreHostConfig) {
    this.preHostConfig = preHostConfig;
  }

  async update() {
    // TODO: make EnvSet instance

    console.log(1111111111, this.preHostConfig)
  }

}

// gulp.task('build-cluster', async () => {
//   const resolvedConfigPath: string = resolveParamRequired('CONFIG', 'config');
//   const absConfigPath = path.resolve(process.cwd(), resolvedConfigPath);
//   const relativeBuildDir: string | undefined = process.env.BUILD_DIR || <string>yargs.argv['build-dir'];
//   const buildDir: string | undefined = relativeBuildDir && path.resolve(process.cwd(), relativeBuildDir);
//   const clusterConfig: GroupConfig = yaml.load(fs.readFileSync(absConfigPath, {encoding : 'utf8'}));
//
//   // Build each host
//
//   for (let hostId of Object.keys(clusterConfig.hosts)) {
//     const hostConfig: PreHostConfig = makeHostConfig(hostId, clusterConfig);
//     const hostBuildDir: string = path.join(buildDir, hostId);
//
//     shelljs.mkdir('-p', hostBuildDir);
//     rimraf.sync(`${hostBuildDir}/**/*`);
//
//     console.info(`===> generating configs and entities of host "${hostId}"`);
//
//     const envBuilder: EnvBuilder = new EnvBuilder(hostConfig, hostBuildDir);
//
//     await envBuilder.collect();
//     await envBuilder.writeConfigs();
//     await envBuilder.writeEntities();
//   }
// });
