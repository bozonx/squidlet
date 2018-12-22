/**
 * Simple replacement of "System.js" module system.
 */

type ExportCb = (paramName: string, value: any) => void;
type ExportObj = {[index: string]: any};
type Context = {[index: string]: any};
type ModuleDef = {[index: string]: ExportObj};
type ExecuteResult = {execute: () => void, setters: any};


const registeredModules: ModuleDef = {};


(global as any).System = {
  register: (moduleName: string, deps: string[], cb: (exportCb: ExportCb, context: Context) => ExecuteResult) => {
    const exportObj: ExportObj = {};
    const exportCb: ExportCb = (paramName: string, value: any) => {
      exportObj[paramName] = value;
    };
    const context: Context = {id: moduleName};
    const callResult: ExecuteResult = cb(exportCb, context);

    for (let depIndex in deps) {
      const depName: string = deps[depIndex];

      callResult.setters[depIndex](registeredModules[depName]);
    }

    callResult.execute();

    registeredModules[moduleName] = exportObj;
  },

  import: (moduleName: string): any => {
    return registeredModules[moduleName];
  }
};
