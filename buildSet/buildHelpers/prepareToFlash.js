const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const hashSum = require('hash-sum');

const {makeModulesTree, stripExtension} = require('./helpers');


const fsPromises = fs.promises;
const FULL_FILE_NAME_POS = 0;
const DST_FILE_NAME_POS = 1;


class PrepareToFlash {
  constructor(srcDir, dstDir, relativeIndexFile, moduleRoot) {
    this.srcDir = srcDir;
    this.dstDir = dstDir;
    this.relativeIndexFile = relativeIndexFile;
    this.moduleRoot = moduleRoot;
    this.modules = {};
  }

  async start() {
    const modulesFileNames = makeModulesTree(this.srcDir, this.relativeIndexFile);
    this.modules = this.makeModulesNames(modulesFileNames);

    try {
      await fsPromises.mkdir(this.dstDir);
    }
    catch (e) {
      // do nothing
    }

    await this.copyToFlashDir();
    await this.renameLocalModulesRequires();
  }


  makeModulesNames(modulesFileNames) {

    // TODO: поидее можно просто список сделать

    const result = {};

    for (let fullFileName of modulesFileNames) {
      const relativeFilePath = path.relative(this.srcDir, fullFileName);
      const rootFileName = path.join(this.moduleRoot, relativeFilePath);
      const moduleName = stripExtension(rootFileName, 'js');
      const moduleNameHash = hashSum(moduleName);
      const dstFileName = path.join(this.dstDir, moduleNameHash);

      result[moduleNameHash] = [
        fullFileName,
        dstFileName,
      ];
    }

    return result;
  }

  async copyToFlashDir() {
    for (let moduleNameHash of Object.keys(this.modules)) {
      await fsPromises.copyFile(
        this.modules[moduleNameHash][FULL_FILE_NAME_POS],
        this.modules[moduleNameHash][DST_FILE_NAME_POS]
      );
    }
  }

  getHashOrRelativeModule(srcFileFullPath, requiredModuleRelPath) {
    const baseDir = path.dirname(srcFileFullPath);
    const depFullPath = path.resolve(baseDir, `${requiredModuleRelPath}.js`);
    let depHashName;
    const foundItem = _.find(this.modules, (item, index) => {
      if (item[FULL_FILE_NAME_POS] === depFullPath) {
        depHashName = index;

        return true;
      }
    });

    if (!depHashName) {
      throw new Error(`Can't find local module "${requiredModuleRelPath}" in "${foundItem[FULL_FILE_NAME_POS]}"`);
    }

    return depHashName;
  }

  getHashOfDependency() {

  }

  replaceRequirePaths(moduleContent, srcFileFullPath) {

    // TODO: remove it
    const prepareToReplace = moduleContent.replace(/;/g, ';\n');

    return prepareToReplace.replace(/require\(['"]([^\n]+)['"]\)/g, (fullMatch, savedPart) => {
      let depHashName;

      // skip not local modules
      if (savedPart.match(/^\./)) {
        // local module
        depHashName = this.getHashOrRelativeModule(srcFileFullPath, savedPart);
      }
      else {
        // third party dependency
        depHashName = this.getHashOfDependency();
      }

      return fullMatch.replace(savedPart, depHashName);
    });
  }

  async renameLocalModulesRequires() {
    for (let moduleNameHash of Object.keys(this.modules)) {
      const moduleContent = await fsPromises.readFile(
        this.modules[moduleNameHash][DST_FILE_NAME_POS],
        {encoding: 'utf8'}
      );
      const replacedContent = this.replaceRequirePaths(
        moduleContent,
        this.modules[moduleNameHash][FULL_FILE_NAME_POS]
      );

      await fsPromises.writeFile(
        this.modules[moduleNameHash][DST_FILE_NAME_POS],
        replacedContent,
        {encoding: 'utf8'}
      );
    }
  }

}



module.exports = async function (srcDir, dstDir, relativeIndexFile, moduleRoot) {
  const prepareToFlash = new PrepareToFlash(srcDir, dstDir, relativeIndexFile, moduleRoot);

  await prepareToFlash.start();
};
