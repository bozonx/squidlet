const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const hashSum = require('hash-sum');

const {makeModulesTree, stripExtension, makeNormalModuleName} = require('./helpers');


const fsPromises = fs.promises;
const HASH_POS = 0;
const SRC_NAME_POS = 1;
const DST_NAME_POS = 2;
const DEP_NAME_POS = 3;


class PrepareToFlash {
  constructor(srcDir, depsSrcDir, dstDir, relativeIndexFile, moduleRoot) {
    this.srcDir = srcDir;
    this.depsSrcDir = depsSrcDir;
    this.dstDir = dstDir;
    this.relativeIndexFile = relativeIndexFile;
    this.moduleRoot = moduleRoot;
    this.localModules = [];
    this.depsModules = [];
  }

  async start() {
    this.localModules = await this.collectLocalModules();
    this.depsModules = await this.collectDepsModules();

    try {
      await fsPromises.mkdir(this.dstDir);
    }
    catch (e) {
      // do nothing
    }

    await this.copyDepsToFlashDir();
    await this.copyLocalToFlashDir();
    await this.renameLocalModulesRequires();
  }


  async collectLocalModules() {
    const modulesFileNames = makeModulesTree(this.srcDir, this.relativeIndexFile);
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

  async collectDepsModules() {
    const fileInDir = await fsPromises.readdir(this.depsSrcDir);
    const result = [];

    for (let moduleRelName of fileInDir) {
      const normalName = stripExtension(makeNormalModuleName(moduleRelName), 'js');
      const moduleNameHash = hashSum(normalName);
      const srcFileName = path.join(this.depsSrcDir, moduleRelName);
      const dstFileName = path.join(this.dstDir, moduleNameHash);

      result.push([
        moduleNameHash,
        srcFileName,
        dstFileName,
        normalName,
      ]);
    }

    return result;
  }

  async copyLocalToFlashDir() {
    for (let localModule of this.localModules) {
      await fsPromises.copyFile(
        localModule[SRC_NAME_POS],
        localModule[DST_NAME_POS]
      );
    }
  }

  async copyDepsToFlashDir() {
    for (let localModule of this.depsModules) {
      await fsPromises.copyFile(
        localModule[SRC_NAME_POS],
        localModule[DST_NAME_POS]
      );
    }
  }

  getHashOfRelativeModule(srcFileFullPath, requiredModuleRelPath) {
    const baseDir = path.dirname(srcFileFullPath);
    const depFullPath = path.resolve(baseDir, `${requiredModuleRelPath}.js`);
    const foundItem = _.find(this.localModules, (item) => item[SRC_NAME_POS] === depFullPath);

    if (!foundItem) {
      throw new Error(`Can't find local module "${requiredModuleRelPath}"`);
    }

    return foundItem[HASH_POS];
  }

  getHashOfDependency(requiredModuleNam) {
    const foundItem = _.find(this.depsModules, (item) => item[DEP_NAME_POS] === requiredModuleNam);

    if (!foundItem) {
      throw new Error(`Can't find dependency module "${requiredModuleNam}"`);
    }

    return foundItem[HASH_POS];
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
        depHashName = this.getHashOfDependency(savedPart);
      }

      return fullMatch.replace(savedPart, depHashName);
    });
  }

  async renameLocalModulesRequires() {
    for (let localModule of this.localModules) {
      const moduleContent = await fsPromises.readFile(
        localModule[DST_NAME_POS],
        {encoding: 'utf8'}
      );
      const replacedContent = this.replaceRequirePaths(
        moduleContent,
        localModule[SRC_NAME_POS]
      );

      await fsPromises.writeFile(
        localModule[DST_NAME_POS],
        replacedContent,
        {encoding: 'utf8'}
      );
    }
  }

}



module.exports = async function (srcDir, depsSrcDir, dstDir, relativeIndexFile, moduleRoot) {
  const prepareToFlash = new PrepareToFlash(srcDir, depsSrcDir, dstDir, relativeIndexFile, moduleRoot);

  await prepareToFlash.start();
};
