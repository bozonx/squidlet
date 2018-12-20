const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const hashSum = require('hash-sum');

const {makeModulesTree, stripExtension} = require('./helpers');


const fsPromises = fs.promises;
const HASH_POS = 0;
const FULL_FILE_NAME_POS = 1;
const DST_FILE_NAME_POS = 2;


class PrepareToFlash {
  constructor(srcDir, dstDir, relativeIndexFile, moduleRoot) {
    this.srcDir = srcDir;
    this.dstDir = dstDir;
    this.relativeIndexFile = relativeIndexFile;
    this.moduleRoot = moduleRoot;
    this.localModules = [];
  }

  async start() {
    const modulesFileNames = makeModulesTree(this.srcDir, this.relativeIndexFile);

    this.localModules = this.makeLocalModulesNames(modulesFileNames);

    try {
      await fsPromises.mkdir(this.dstDir);
    }
    catch (e) {
      // do nothing
    }

    await this.copyLocalToFlashDir();
    await this.renameLocalModulesRequires();
  }


  makeLocalModulesNames(modulesFileNames) {
    const result = [];

    for (let fullFileName of modulesFileNames) {
      const relativeFilePath = path.relative(this.srcDir, fullFileName);
      const rootFileName = path.join(this.moduleRoot, relativeFilePath);
      const moduleName = stripExtension(rootFileName, 'js');
      const moduleNameHash = hashSum(moduleName);
      const dstFileName = path.join(this.dstDir, moduleNameHash);

      result.push([
        moduleNameHash,
        fullFileName,
        dstFileName,
      ]);
    }

    return result;
  }

  async copyLocalToFlashDir() {
    for (let localModule of this.localModules) {
      await fsPromises.copyFile(
        localModule[FULL_FILE_NAME_POS],
        localModule[DST_FILE_NAME_POS]
      );
    }
  }

  getHashOfRelativeModule(srcFileFullPath, requiredModuleRelPath) {
    const baseDir = path.dirname(srcFileFullPath);
    const depFullPath = path.resolve(baseDir, `${requiredModuleRelPath}.js`);
    const foundItem = _.find(this.localModules, (item) => item[FULL_FILE_NAME_POS] === depFullPath);

    if (!foundItem) {
      throw new Error(`Can't find local module "${requiredModuleRelPath}" in "${foundItem[FULL_FILE_NAME_POS]}"`);
    }

    return foundItem[HASH_POS];
  }

  getHashOfDependency() {
    // TODO:
  }

  replaceRequirePaths(moduleContent, srcFileFullPath) {

    // TODO: remove it
    const prepareToReplace = moduleContent.replace(/;/g, ';\n');

    return prepareToReplace.replace(/require\(['"]([^\n]+)['"]\)/g, (fullMatch, savedPart) => {
      let depHashName;

      // skip not local modules
      if (savedPart.match(/^\./)) {
        // local module
        depHashName = this.getHashOfRelativeModule(srcFileFullPath, savedPart);
      }
      else {
        // third party dependency
        depHashName = this.getHashOfDependency();
      }

      return fullMatch.replace(savedPart, depHashName);
    });
  }

  async renameLocalModulesRequires() {
    for (let localModule of this.localModules) {
      const moduleContent = await fsPromises.readFile(
        localModule[DST_FILE_NAME_POS],
        {encoding: 'utf8'}
      );
      const replacedContent = this.replaceRequirePaths(
        moduleContent,
        localModule[FULL_FILE_NAME_POS]
      );

      await fsPromises.writeFile(
        localModule[DST_FILE_NAME_POS],
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
