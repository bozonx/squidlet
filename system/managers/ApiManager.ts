import Context from '../Context';
import IndexedEvents from '../lib/IndexedEvents';
import RemoteCall from '../lib/remoteCall/RemoteCall';
import RemoteCallMessage from '../interfaces/RemoteCallMessage';
import {makeUniqId} from '../lib/uniqId';
import {METHOD_DELIMITER} from '../constants';
import StandardApi from '../StandardApi';


export type RcOutcomeHandler = (sessionId: string, message: RemoteCallMessage) => void;


/**
 * RemoteCall StandardApi for acting remotely via ws or mqtt or others services.
 */
export default class ApiManager {
  private readonly context: Context;
  // TODO: зачем это нужно если можно навешиваться на каждый remoteCall???
  //  на внутренние событие по каждой сессии
  private readonly rcOutcomeEvents = new IndexedEvents<RcOutcomeHandler>();
  // separate instance of RemoteCall for each session. It needs to destroy whole instance on session end.
  private remoteCalls: {[index: string]: RemoteCall} = {};
  private endPoints: {[index: string]: {[index: string]: any}} = {};
  private readonly standardApi: StandardApi;


  constructor(context: Context) {
    this.context = context;
    this.standardApi = new StandardApi(this.context);
  }

  async destroy() {
    this.rcOutcomeEvents.destroy();

    for (let sessionId of Object.keys(this.remoteCalls)) {
      await this.remoteCalls[sessionId].destroy();
    }

    delete this.remoteCalls;
    delete this.endPoints;
  }


  /**
   * Call it when you received income data of remoteCall channel
   */
  incomeRemoteCall(sessionId: string, message: RemoteCallMessage): Promise<void> {
    if (!this.remoteCalls[sessionId]) {
      this.makeNewSession(sessionId);
    }

    return this.remoteCalls[sessionId].incomeMessage(message);
  }

  /**
   * Listen it to send remoteCall message to other side
   */
  onOutcomeRemoteCall(cb: RcOutcomeHandler) {
    this.rcOutcomeEvents.addListener(cb);
  }

  /**
   * Call this method if session has just been closed
   */
  async remoteCallSessionClosed(sessionId: string) {
    await this.remoteCalls[sessionId].destroy();
    delete this.remoteCalls[sessionId];
  }

  callApi = async (methodName: string, args: any[]): Promise<any> => {
    this.context.log.debug(`ApiManager: called api method: ${methodName}(${args.join(', ')})`);

    if (!methodName) throw new Error(`No methodName`);

    const methodNameSplat: string[] = methodName.split(METHOD_DELIMITER);

    if (methodNameSplat.length === 1) {
      // call standard api
      return (this.standardApi as any)[methodName](...args);
    }
    else {
      const nameSpace: string = methodNameSplat[0];
      const endPointMethod: string = methodNameSplat[1];

      // call endpoint's api
      if (!this.endPoints[nameSpace]) throw new Error(`Endpoint ${nameSpace} not found`);

      return this.endPoints[nameSpace][endPointMethod](...args);
    }
  }

  registerEndpoint(endPointName: string, representObject: {[index: string]: any}) {
    this.endPoints[endPointName] = representObject;
  }


  private makeNewSession(sessionId: string) {
    this.remoteCalls[sessionId] = new RemoteCall(
      async (message: RemoteCallMessage) => this.rcOutcomeEvents.emit(sessionId, message),
      this.callApi,
      this.context.config.config.rcResponseTimoutSec,
      this.context.log.error,
      makeUniqId
    );
  }

}
