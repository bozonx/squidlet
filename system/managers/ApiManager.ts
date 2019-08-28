import Context from '../Context';
import IndexedEvents from '../lib/IndexedEvents';
import RemoteCall from '../lib/remoteCall/RemoteCall';
import RemoteCallMessage from '../interfaces/RemoteCallMessage';
import {makeUniqId} from '../lib/uniqId';


export type RcOutcomeHandler = (sessionId: string, message: RemoteCallMessage) => void;


/**
 * RemoteCall Api for acting remotely via ws or mqtt or others services.
 */
export default class ApiManager {
  private readonly context: Context;
  private readonly rcOutcomeEvents = new IndexedEvents<RcOutcomeHandler>();
  private remoteCalls: {[index: string]: RemoteCall} = {};


  constructor(context: Context) {
    this.context = context;
  }

  async destroy() {
    this.rcOutcomeEvents.removeAll();

    for (let sessionId of Object.keys(this.remoteCalls)) {
      await this.remoteCalls[sessionId].destroy();
    }

    delete this.remoteCalls;
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

    // TODO: не правильно поидее - это заглушка если уже был вызван общий дестрой
    if (!this.remoteCalls || !this.remoteCalls[sessionId]) return ;

    await this.remoteCalls[sessionId].destroy();
    delete this.remoteCalls[sessionId];
  }


  private callApi = async (methodName: string, args: any[]): Promise<any> => {
    return (this.context.system.api as any)[methodName](...args);
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
