const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const hashSum = require('hash-sum');

const {makeModulesTree, stripExtension, makeNormalModuleName} = require('../../../../system/lib');


const fsPromises = fs.promises;
const HASH_POS = 0;
const SRC_NAME_POS = 1;
const DST_NAME_POS = 2;
const DEP_NAME_POS = 3;

type LocalModuleDefinition = [string, string, string];
type DependencyDefinition = [string, string, string, string];


class PrepareToFlash {
  private readonly srcDir: string;
  private readonly depsSrcDir: string;
  private readonly dstDir: string;
  private readonly relativeIndexFile: string;
  private readonly moduleRoot: string;
  private localModules: LocalModuleDefinition[] = [];
  private depsModules: DependencyDefinition[] = [];


  constructor(
    srcDir: string,
    depsSrcDir: string,
    dstDir: string,
    relativeIndexFile: string,
    moduleRoot: string
  ) {
    this.srcDir = srcDir;
    this.depsSrcDir = depsSrcDir;
    this.dstDir = dstDir;
    this.relativeIndexFile = relativeIndexFile;
    this.moduleRoot = moduleRoot;
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


  private async collectLocalModules(): Promise<LocalModuleDefinition[]> {
    const modulesFileNames = makeModulesTree(this.srcDir, this.relativeIndexFile);
    const result: LocalModuleDefinition[] = [];

    for (let fullFileName of modulesFileNames) {
      const relativeFilePath = path.relative(this.srcDir, fullFileName);
      const rootFileName = path.join(this.moduleRoot, relativeFilePath);
      const moduleName = stripExtension(rootFileName, 'js');
      const moduleNameHash = hashSum(moduleName);
      const dstFileName = path.join(this.dstDir, moduleNameHash);
      const definition: LocalModuleDefinition = [
        moduleNameHash,
        fullFileName,
        dstFileName,
      ];

      result.push(definition);
    }

    return result;
  }

  private async collectDepsModules(): Promise<DependencyDefinition[]> {
    const fileInDir: string[] = await fsPromises.readdir(this.depsSrcDir);
    const result: DependencyDefinition[] = [];

    for (let moduleRelName of fileInDir) {
      const normalName = stripExtension(makeNormalModuleName(moduleRelName), 'js');
      const moduleNameHash = hashSum(normalName);
      const srcFileName = path.join(this.depsSrcDir, moduleRelName);
      const dstFileName = path.join(this.dstDir, moduleNameHash);
      const definition: DependencyDefinition = [
        moduleNameHash,
        srcFileName,
        dstFileName,
        normalName,
      ];

      result.push(definition);
    }

    return result;
  }

  private async copyLocalToFlashDir() {
    for (let localModule of this.localModules) {
      await fsPromises.copyFile(localModule[SRC_NAME_POS], localModule[DST_NAME_POS]);
    }
  }

  private async copyDepsToFlashDir() {
    for (let localModule of this.depsModules) {
      await fsPromises.copyFile(localModule[SRC_NAME_POS], localModule[DST_NAME_POS]);
    }
  }

  private getHashOfRelativeModule(srcFileFullPath: string, requiredModuleRelPath: string): string {
    const baseDir = path.dirname(srcFileFullPath);
    const depFullPath = path.resolve(baseDir, `${requiredModuleRelPath}.js`);
    const foundItem: LocalModuleDefinition = _.find(
      this.localModules,
      (item: LocalModuleDefinition) => item[SRC_NAME_POS] === depFullPath
    );

    if (!foundItem) {
      throw new Error(`Can't find local module "${requiredModuleRelPath}"`);
    }

    return foundItem[HASH_POS];
  }

  private getHashOfDependency(requiredModuleNam: string): string {
    const foundItem: DependencyDefinition = _.find(
      this.depsModules,
      (item: DependencyDefinition) => item[DEP_NAME_POS] === requiredModuleNam
    );

    if (!foundItem) {
      throw new Error(`Can't find dependency module "${requiredModuleNam}"`);
    }

    return foundItem[HASH_POS];
  }

  /**
   * Replace all the paths in require() functions in specified file
   */
  private replaceRequirePaths(moduleContent: string, srcFileFullPath: string): string {
    // it's need because file is minified
    const prepareToReplace = moduleContent.replace(/;/g, ';\n');

    const replaced = prepareToReplace.replace(
      /require\(['"]([^\n]+)['"]\)/g,
      (fullMatch: string, savedPart: string) => {
        let depHashName: string;

        if (savedPart.match(/^\./)) {
          // local module
          depHashName = this.getHashOfRelativeModule(srcFileFullPath, savedPart);
        }
        else {
          // third party dependency
          depHashName = this.getHashOfDependency(savedPart);
        }

        return fullMatch.replace(savedPart, depHashName);
      }
    );

    // remove line breaks which has been set previously
    return replaced.replace(/;\n/g, ';');
  }

  /**
   * Replaces all the paths in require() functions to 8-bytes file names on flash
   */
  private async renameLocalModulesRequires() {
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


export default async function (
  srcDir: string,
  depsSrcDir: string,
  dstDir: string,
  relativeIndexFile: string,
  moduleRoot: string
) {
  const prepareToFlash = new PrepareToFlash(srcDir, depsSrcDir, dstDir, relativeIndexFile, moduleRoot);

  await prepareToFlash.start();
}
