const path = require('path');
const shelljs = require('shelljs');
const fs = require('fs');
const fsPromises = fs.promises;
const _ = require('lodash');
const yaml = require('js-yaml');


class Collect {
  constructor(buildConfigYaml, dstDir) {
    this._buildConfigYaml = buildConfigYaml;
    this._dstDir = dstDir;
    this._buildConfig = yaml.load(fs.readFileSync(buildConfigYaml));

    this._validateBuildConfig();
  }

  async collect() {
    shelljs.mkdir('-p', this._dstDir);

    for (let moduleOrFileName of this._buildConfig.dependencies) {
      const resolvedMainFile = await this._resolveModuleMainFile(moduleOrFileName);

      await this._buildMainFile(moduleOrFileName, resolvedMainFile);
    }

    await this._makeDepsBundle();
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

    for (let root of this._buildConfig.moduleRoots) {
      const modulesDirPath = path.resolve(path.dirname(this._buildConfigYaml), root);
      const modulePath = path.join(modulesDirPath, fullName);

      if (fs.existsSync(modulePath)) {
        return modulePath;
      }
    }

    throw new Error(`File "${fullName}" does not exist`);
  }

  async _buildMainFile(moduleName, resolvedMainFile) {
    return new Promise((resolve, reject) => {
      console.log(`--> Building dependency ${moduleName} - ${resolvedMainFile}`);

      const safeModuleName = moduleName.replace(/\//g, '|');

      try {

        // TODO: !!! use real building

        shelljs.cp('-f', resolvedMainFile, path.join(this._dstDir, safeModuleName));

        resolve();
      }
      catch (err) {
        reject(err);
      }
    });
  }

  async _makeDepsBundle() {
    // TODO: place modules to Module.cache
  }

}


module.exports = {
  collectDependencies: async function (buildConfigYaml, dstDir) {
    const collect = new Collect(buildConfigYaml, dstDir);

    await collect.collect();
  },

  async prependDepsToBundle(dstDir, mainBindlePath) {
    const filesInDir = await fsPromises.readdir(dstDir)
    let result = '';

    for (let fileName of filesInDir) {
      let preparedContent = await fsPromises.readFile(path.join(dstDir, fileName), { encoding: 'utf8' }) || '';
      const realModuleName = fileName.replace(/\|/g, '/');

      preparedContent = preparedContent.replace(/\"/g, '\\"');
      preparedContent = preparedContent.replace(/\n/g, '\\n');

      result += `Modules.addCached("${realModuleName}", "${preparedContent}");\n`;

    }

    const mainBundleContent = await fsPromises.readFile(mainBindlePath, { encoding: 'utf8' });
    const finalMainBundle = `${result}\n${mainBundleContent}`;

    await fsPromises.writeFile(mainBindlePath, finalMainBundle);
  },

};
