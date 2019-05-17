import * as yaml from 'js-yaml';
import * as path from 'path';
import * as fs from 'fs';

import WsClientLogic, {WsClientLogicProps} from '../entities/drivers/WsClient/WsClientLogic';
import {collectPropsDefaults} from '../hostEnvBuilder/helpers';
import WebSocketClient from './nodeJsLikeIo/WebSocketClient';
import {BackdoorMessage} from '../entities/services/Backdoor/Backdoor';


// TODO: может не нужно ????


const backdoorManifestPath = path.resolve(__dirname, '../entities/services/Backdoor/manifest.yaml');
const wsClientIo = new WebSocketClient();


export default class BackdoorIoClient {
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

  addListener(cb: (msg: BackdoorMessage) => void) {
    // TODO: add
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
