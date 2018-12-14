module.exports = {
  makeSafeModuleName: (fileName) => {
    return fileName.replace(/\//g, '|')
  },

  makeNormalModuleName: (fileName) => {
    return fileName.replace(/\|/g, '/')
  },

  makeModuleCached: (moduleName, moduleContent) => {
    let preparedContent = moduleContent || '';

    preparedContent = preparedContent.replace(/\"/g, '\\"');
    preparedContent = preparedContent.replace(/\n/g, '\\n');

    return `Modules.addCached("${moduleName}", "${preparedContent}");\n`;
  },

  // TODO: дублируется - наверное лучше взять из starterMc/helper.ts
  makeModuleName: (filePath, rootToRemove, newRoot) => {
    let result = filePath;
    const removedRoot = filePath.split(rootToRemove);

    if (removedRoot.length > 0) {
      // success
      result = removedRoot[1];
    }

    // remove extension
    result = result.replace(/\.js$/, '');

    return `${newRoot}${result}`;
  }

};
