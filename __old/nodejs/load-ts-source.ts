
//import * as ts from 'typescript';
// async init(): Promise<void> {
//   const platformDir: string = resolvePlatformDir(this.platform);
//   const machineConfig: MachineConfig = loadMachineConfigInPlatformDir(platformDir, this.machine);
//   const evalModulePath: string = path.join(platformDir, this.machine, 'evalModule');
//   const machineEvalModule: any = require(evalModulePath);
//
//   for (let ioPath of machineConfig.ios) {
//     const ioName: string = getFileNameOfPath(ioPath);
//     const ioAbsPath = path.resolve(platformDir, ioPath);
//
//     const moduleContent: string = await this.os.getFileContent(ioAbsPath);
//     const compiledModuleContent: string = ts.transpile(moduleContent);
//     const ioItemClass: new () => IoItem = machineEvalModule(compiledModuleContent);
//
//     if (ioName === 'Storage') {
//       this.ioCollection[ioName] = this.storageWrapper.makeWrapper(new ioItemClass() as StorageIo);
//     }
//     else {
//       this.ioCollection[ioName] = new ioItemClass();
//     }
//   }
// }
