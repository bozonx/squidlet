import * as yaml from 'js-yaml';
import * as path from 'path';
import * as fs from 'fs';

import WsClientLogic, {WsClientLogicProps} from '../entities/drivers/WsClient/WsClientLogic';
import {collectPropsDefaults} from '../hostEnvBuilder/helpers';
import WebSocketClient from './nodeJsLikeIo/WebSocketClient';
import {BACKDOOR_ACTION, BACKDOOR_MSG_TYPE, BackdoorMessage} from '../entities/services/Backdoor/Backdoor';


type ListenerHandler = (action: number, payload: any) => void;

const backdoorManifestPath = path.resolve(__dirname, '../entities/services/Backdoor/manifest.yaml');
const wsClientIo = new WebSocketClient();


export default class BackdoorClient {
  private readonly client: WsClientLogic;

  constructor(host?: string, port?: number) {
    this.client = this.makeClientInstance(host, port);
  }

  destroy() {
    // TODO: remove all the handlers

    this.close();
  }


  close() {
    this.client.close(0, 'finish');
  }

  async send(action: number, payload?: any) {
    const msg: BackdoorMessage = {
      type: BACKDOOR_MSG_TYPE.send,
      action,
      payload,
    };
    // TODO: make message
    // TODO: add
  }

  async request(action: number, payload?: any): Promise<any> {

    // TODO: generate uniq id
    const requestId = 'a';

    const msg: BackdoorMessage = {
      type: BACKDOOR_MSG_TYPE.request,
      action,
      requestId,
      payload,
    };

    // TODO: add
  }

  addListener(cb: ListenerHandler) {

    // TODO: make listener id
    const listenerId = 0;

    const msg: BackdoorMessage = {
      type: BACKDOOR_MSG_TYPE.send,
      action: BACKDOOR_ACTION.addListener,
      payload: listenerId,
    };

    // TODO: add
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
      () => console.info(`Websocket connection has been closed`),
      console.info,
      console.error
    );
  }

}
