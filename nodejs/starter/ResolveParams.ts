import {resolveParam, resolveParamRequired} from './buildHelpers';


export interface Params {
  configPath: string;
  workDir: string | undefined;
}


export default class ResolveParams {
  configPath: string = '';
  hostName?: string;
  workDir?: string;

  constructor() {

  }

  resolve() {
    // TODO: конфиг - позиционный параметр
    // TODO: конфиг - группы или хоста???
    const configPath: string = resolveParamRequired('CONFIG', 'config');
    const workDir: string | undefined = resolveParam('WORK_DIR', 'work-dir');

    return {
      configPath,
      workDir,
    };
  }

}
