import System from '../../system/System';
import RemoteCall from '../../system/helpers/remoteCall/RemoteCall';
import RemoteCallMessage, {REMOTE_CALL_MESSAGE_TYPES} from '../../system/interfaces/RemoteCallMessage';
import {isPlainObject} from '../../system/helpers/lodashLike';
import IoItem from '../../system/interfaces/IoItem';
import {pathJoin} from '../../system/helpers/nodeLike';
import BackdoorClient from '../../shared/BackdoorClient';


export default class RemoteIoCollection {
  readonly ioCollection: {[index: string]: IoItem} = {};

  private readonly remoteCall: RemoteCall;
  private readonly client: BackdoorClient;


  constructor(
    responseTimoutSec: number,
    logError: (message: string) => void,
    generateUniqId: () => string,
    host?: string,
    port?: number
  ) {
    this.client = new BackdoorClient(host, port);
    this.remoteCall = new RemoteCall(
      this.sendMessage,
      undefined,
      responseTimoutSec,
      logError,
      generateUniqId
    );
  }


  async connect() {
    // TODO: do connection
    // TODO: ask for io list
  }

  /**
   * Replace init method to generate local proxy methods and instantiate RemoteCall
   */
  async init(system: System): Promise<void> {
    // TODO: use backdoor client
    // TODO: fill this.ioCollection
    // TODO: не указывать методы init and configure

    //this._client = new WsClient(this.system.host.id, this.wsClientProps);

    this._system = system;
    this._remoteCall = new RemoteCall(
      this.send,
      // client don't have any local methods
      {},
      this.system.host.config.config.ioSetResponseTimoutSec,
      this.system.log.error,
      this.system.host.generateUniqId
    );

    await this.initAllIo();
  }


  // private listen() {
  //   // this.client.onError((err: string) => this.system.log.error(err));
  //   // this.client.onIncomeMessage(this.resolveIncomeMessage);
  // }

  //
  // getInstance<T extends IoItem>(ioName: string): T {
  //   this.makeFakeIoIfNeed(ioName);
  //
  //   return this.ioCollection[ioName] as T;
  // }

  async destroy() {
    await super.destroy();
    await this.remoteCall.destroy();
  }



  /**
   * Call this method when you has received a message
   */
  protected resolveIncomeMessage = async (message: {[index: string]: any}) => {
    if (!isPlainObject(message)) {
      return this.system.log.error(`Io set: received message is not an object`);
    }
    else if (!message.type || !REMOTE_CALL_MESSAGE_TYPES.includes(message.type)) {
      return this.system.log.error(`Io set: incorrect type of message ${JSON.stringify(message)}`);
    }

    await this.remoteCall.incomeMessage(message);
  }


  private makeFakeIoIfNeed(ioName: string) {
    if (this.ioCollection[ioName]) return;

    const ioDefinitionPath = pathJoin(
      // this.system.systemConfig.rootDirs.envSet,
      // this.system.systemConfig.envSetDirs.system,
      '../',
      'interfaces',
      'io',
      `${ioName}Io`
    );
    let ioMethods: string[];

    try {
      ioMethods = require(ioDefinitionPath).Methods;
    }
    catch (err) {
      throw new Error(`Can't find methods of io "${ioName}"`);
    }

    for (let methodName of ioMethods) {
      this.ioCollection[ioName][methodName] = this.makeMethod(ioName, methodName);
    }
  }

  private makeMethod(ioName: string, methodName: string): (...args: any[]) => Promise<any> {
    return (...args: any[]): Promise<any> => {
      return this.remoteCall.callMethod(ioName, methodName, ...args);
    };
  }

  private sendMessage(message: RemoteCallMessage): Promise<void> {
    // TODO: do it
  }

}
