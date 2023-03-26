import * as yaml from 'js-yaml';
import * as fs from 'fs';

import WsClientLogic, {WsClientLogicProps} from '../../../../squidlet-networking/src/drivers/WsClientSessions/WsClientLogic';
import WebSocketClient from '../shared/nodeJsLikeIo/WebSocketClient';
import {BACKDOOR_ACTION, BackdoorMessage} from '../../entities/services/Backdoor/Backdoor';
import {decodeBackdoorMessage, makeMessage} from '../entities/services/Backdoor/helpers';
import {collectPropsDefaults} from '../../hostEnvBuilder/helpers';
import IndexedEvents from '../../system/helpers/IndexedEvents';


// TODO: можно сделать на основе BackdoorIoClient


// TODO: review
const backdoorManifestPath = '../entities/services/Backdoor/manifest.yaml';
const wsClientIo = new WebSocketClient();


export default class BackdoorEventsClient {
  private readonly incomeMessageEvents = new IndexedEvents<(message: BackdoorMessage) => void>();
  private readonly client: WsClientLogic;


  constructor(host?: string, port?: number) {
    this.client = this.makeClientInstance(host, port);
    // listen income data
    this.client.onMessage(this.handleIncomeMessage);
  }

  destroy() {
    // TODO: remove all the handlers

    this.close();
  }


  close() {
    this.client.close(0, 'finish');
  }

  /**
   * Emit remote event
   */
  async emit(category: string, topic?: string, data?: any): Promise<void> {
    const binMsg: Uint8Array = makeMessage(BACKDOOR_ACTION.emit, category, topic, data);

    await this.client.send(binMsg);
  }

  /**
   * Emit an event and wait for income message of specified category and topic
   */
  async request(category: string, topic?: string, data?: any): Promise<any> {
    await this.emit(category, topic, data);

    return new Promise<any>((resolve, reject) => {
      // TODO: make it !!!!!!
    });
  }

  /**
   * Ask backdoor to send back data which emits on specified event
   */
  addListener(category: string, topic?: string, cb: (data?: any) => void) {
    // TODO: make listener id

    // TODO: лучше сюда передать колбэш и его поднимать когда приходит сообщение

    const binMsg: Uint8Array = makeMessage(BACKDOOR_ACTION.addListener, category, topic);

    await this.client.send(binMsg);
  }

  async removeListener(category: string, topic?: string): Promise<void> {

    // TODO: лучше передавать индекс

    const binMsg: Uint8Array = makeMessage(BACKDOOR_ACTION.removeListener, category, topic);

    await this.client.send(binMsg);
  }

  /**
   * On every income message
   */
  onIncomeMessage(cb: (message: BackdoorMessage) => void) {

    // TODO: наверное не нужно если будет addListener слушать свои события

    this.incomeMessageEvents.addListener(cb);
  }


  private handleIncomeMessage = (data: string | Uint8Array) => {

    // TODO: review

    let message: BackdoorMessage;

    try {
      message = decodeBackdoorMessage(data as Uint8Array);
    }
    catch (err) {
      return console.error(`Can't decode message: ${err}`);
    }

    this.incomeMessageEvents.emit(message);
  }

  private onClientClose() {
    console.info(`Websocket connection has been closed`);
  }

  private makeClientInstance(specifiedHost?: string, specifiedPort?: number): WsClientLogic {
    const yamlContent: string = fs.readFileSync(backdoorManifestPath, 'utf8');
    const backdoorManifest = yaml.safeLoad(yamlContent);
    const backdoorProps = collectPropsDefaults(backdoorManifest.props);
    const host: string = specifiedHost || backdoorProps.host;
    const port: number= specifiedPort || backdoorProps.port;
    const url = `ws://${host}:${port}`;
    const props: WsClientLogicProps = {
      url,
      autoReconnect: false,
      reconnectTimeoutMs: 0,
      maxTries: 0,
    };

    return new WsClientLogic(
      wsClientIo,
      props,
      this.onClientClose,
      console.info,
      console.error
    );
  }

}
