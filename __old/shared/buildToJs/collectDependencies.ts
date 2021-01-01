import * as fs from 'fs';
import * as path from 'path';
import * as shelljs from 'shelljs';
import * as _ from 'lodash';
import * as yaml from 'js-yaml';
import {ENCODE} from '../../../../squidlet-lib/src/constants';

// TODO: !!!!
//const {makeSafeModuleName} = require('../../host/helpers');


interface BuildConfig {
  moduleRoots: string[];
  dependencies?: string[];
}


/**
 * collect third party dependencies
 */
class Collect {
  private readonly buildConfigYaml: string;
  private readonly dstDir: string;
  private readonly buildConfig: BuildConfig;


  constructor(buildConfigYaml: string, dstDir: string) {
    this.buildConfigYaml = buildConfigYaml;
    this.dstDir = dstDir;
    this.buildConfig = yaml.load(fs.readFileSync(buildConfigYaml, ENCODE));

    //this.validateBuildConfig();
  }

  async collect() {
    shelljs.mkdir('-p', this.dstDir);

    if (!this.buildConfig.dependencies) return;

    for (let moduleOrFileName of this.buildConfig.dependencies) {
      const resolvedMainFile = await this.resolveModuleMainFile(moduleOrFileName);

      await this.buildMainFile(moduleOrFileName, resolvedMainFile);
    }

    await this.makeDepsBundle();
  }

  // private validateBuildConfig() {
  //   if (!_.isPlainObject(this.buildConfig)) {
  //     throw new Error(`BuildConfig ${this.buildConfigYaml} has to be an object`);
  //   }
  //   else if (!this.buildConfig.moduleRoots) {
  //     throw new Error(`There isn't "moduleRoots" param in buildConfig ${this.buildConfigYaml}`);
  //   }
  //   else if (!_.isArray(this.buildConfig.moduleRoots)) {
  //     throw new Error(`Parameter "moduleRoots" in buildConfig ${this.buildConfigYaml} has to be an array`);
  //   }
  //   else if (this.buildConfig.dependencies && !_.isArray(this.buildConfig.dependencies)) {
  //     throw new Error(`Parameter "dependencies" in buildConfig ${this.buildConfigYaml} has to be an array`);
  //   }
  // }

  private async resolveModuleMainFile(moduleOrFileName: string): Promise<string> {
    if (!_.isString(moduleOrFileName)) {
      throw new Error(`Module or file name of dependency has to be a string. Build config "${this.buildConfigYaml}"`);
    }

    const regex = new RegExp(`\\${path.sep}`);

    if (moduleOrFileName.match(regex)) {
      // it's a file
      return this.resolveFile(moduleOrFileName);
    }

    // else it's a module

    // TODO: read package.json and find main

    throw new Error('Only files are supported as a dependency at the moment');
  }

  private resolveFile(fileName: string): string {
    let fullName = fileName;

    if (!fileName.match(/\.js$/)) {
      fullName = `${fileName}.js`;
    }

    for (let root of this.buildConfig.moduleRoots) {
      const modulesDirPath = path.resolve(path.dirname(this.buildConfigYaml), root);
      const modulePath = path.join(modulesDirPath, fullName);

      if (fs.existsSync(modulePath)) {
        return modulePath;
      }
    }

    throw new Error(`File "${fullName}" does not exist`);
  }

  private async buildMainFile(moduleName: string, resolvedMainFile: string) {
    return new Promise((resolve, reject) => {
      console.log(`--> Building dependency ${moduleName} - ${resolvedMainFile}`);

      const safeModuleName = `${makeSafeModuleName(moduleName)}.js`;

      try {

        // TODO: !!! use real building

        shelljs.cp('-f', resolvedMainFile, path.join(this.dstDir, safeModuleName));

        resolve();
      }
      catch (err) {
        reject(err);
      }
    });
  }

  private async makeDepsBundle() {
    // TODO: place modules to Module.cache
  }

}


export default async function (buildConfigYaml: string, dstDir: string) {
  const collect = new Collect(buildConfigYaml, dstDir);

  await collect.collect();
}
