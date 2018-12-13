const path = require('path');
const fs = require('fs');
const fsPromises = fs.promises;
const _ = require('lodash');
const yaml = require('js-yaml');

// TODO: get from yargs
//const envConfig = yaml.load(fs.readFileSync('buildConfig.yaml'));

class Collect {
  constructor(buildConfigYaml, dstDir) {
    this._buildConfigYaml = buildConfigYaml;
    this._dstDir = dstDir;
    this._buildConfig = yaml.load(fs.readFileSync(buildConfigYaml));

    this._validateBuildConfig();
  }

  async collect() {
    for (let moduleOrFileName of this._buildConfig.dependencies) {
      const resolvedMainFile = await this._resolveModuleMainFile(moduleOrFileName);

      await this._buildMainFile(resolvedMainFile);
    }
  }

  _validateBuildConfig() {
    if (!_.isPlainObject(this._buildConfig)) {
      throw new Error(`BuildConfig ${this._buildConfigYaml} has to be an object`);
    }
    else if (!this._buildConfig.moduleRoots) {
      throw new Error(`There isn't "moduleRoots" param in buildConfig ${this._buildConfigYaml}`);
    }
    else if (!_.isArray(this._buildConfig.moduleRoots)) {
      throw new Error(`Parameter "moduleRoots" in buildConfig ${this._buildConfigYaml} has to be an array`);
    }
    else if (!this._buildConfig.dependencies) {
      throw new Error(`Parameter "dependencies" in buildConfig ${this._buildConfigYaml} has to be an array`);
    }
  }

  async _resolveModuleMainFile(moduleOrFileName) {
    if (!_.isString(moduleOrFileName)) {
      throw new Error(`Module or file name of dependency has to be a string. Build config "${this._buildConfigYaml}"`);
    }

    const regex = new RegExp(`\\${path.sep}`);

    if (moduleOrFileName.match(regex)) {
      // it's a file
      return this._resolveFile(moduleOrFileName);
    }

    // else it's a module

    // TODO: read package.json and find main
  }

  _resolveFile(moduleOrFileName) {
    let fullName = moduleOrFileName;

    if (!moduleOrFileName.match(/\.js$/)) {
      fullName = `${moduleOrFileName}.js`;
    }

    if (!fs.existsSync(fullName)) {
      throw new Error(`File "${fullName}" does not exist`);
    }

    return fullName;
  }

  async _buildMainFile(resolvedMainFile) {
    return new Promise((resolve, reject) => {
      // TODO: !!!

    });
  }

}


export default async function (buildConfigYaml, dstDir) {
  const collect = new Collect(buildConfigYaml, dstDir);

  await collect.collect();
}
