const _ = require('lodash');
const yaml = require('js-yaml');

// TODO: get from yargs
//const envConfig = yaml.load(fs.readFileSync('buildConfig.yaml'));


function validateBuildConfig(buildConfig) {
  if (!_.isPlainObject(buildConfig)) {
    throw new Error(`BuildConfig ${buildConfigYaml} has to be an object`);
  }
  else if (!buildConfig.moduleRoots) {
    throw new Error(`There isn't "moduleRoots" param in buildConfig ${buildConfigYaml}`);
  }
  else if (!_.isArray(buildConfig.moduleRoots)) {
    throw new Error(`Parameter "moduleRoots" in buildConfig ${buildConfigYaml} has to be an array`);
  }
  else if (!buildConfig.dependencies) {
    throw new Error(`Parameter "dependencies" in buildConfig ${buildConfigYaml} has to be an array`);
  }
}


export default async function (buildConfigYaml) {
  const buildConfig = yaml.load(fs.readFileSync(buildConfigYaml));

  validateBuildConfig();


}
