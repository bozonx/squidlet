import Io from '../../hostEnvBuilder/Io';
import ResolveParams from './ResolveParams';
import GroupConfigParser from '../../control/GroupConfigParser';
import ResolveDirs from './ResolveDirs';
import DevsSet from './DevsSet';


export default class Starter {
  private io: Io = new Io();
  private readonly params: ResolveParams;
  private groupConfig: GroupConfigParser = new GroupConfigParser(this.io, this.params.configPath);
  private dirs: ResolveDirs = new ResolveDirs();
  private devSet: DevsSet = new DevsSet();


  constructor(params: ResolveParams) {
    this.params = params;
  }

  async init() {
    console.info(`===> resolving config`);
    await this.groupConfig.init();

    this.dirs.resolve();

    //const hostConfig: PreHostConfig = this.groupConfig.getHostConfig(this.params.hostName);

    // if (!hostConfig.platform) {
    //   throw new Error(`Param "platform" is required on host config "${hostConfig.id}"`);
    // }
    // else if (!hostConfig.machine) {
    //   throw new Error(`Param "machine" is required on host config "${hostConfig.id}"`);
    // }

    console.info(`===> making platform's dev set`);
    this.devSet.collect();
  }

  async installModules() {
    console.info(`===> Install npm modules`);
    // TODO: делается npm i в папку с devs если нужно
  }

  async buildInitialSystem() {
    // TODO: если нету system - то билдится он и env set с конфигом по умолчанию
  }

  async startProdSystem() {

    // TODO: запускается System из workDir с этим devset
  }

}
