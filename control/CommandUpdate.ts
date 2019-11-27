import * as path from 'path';

import Os from '../shared/Os';
import squidletLightBuilder from '../squidletLight/squidletLightBuilder';
import WsApiClient from '../shared/WsApiClient';
import hostDefaultConfig from '../hostEnvBuilder/configs/hostDefaultConfig';
import {consoleError} from '../system/lib/helpers';
import HostInfo from '../system/interfaces/HostInfo';
import Platforms from '../system/interfaces/Platforms';


export default class CommandUpdate {
  private readonly hostConfigPath: string;
  private readonly args: {[index: string]: any};
  private readonly os: Os = new Os();


  constructor(positionArgs: string[], args: {[index: string]: any}) {
    this.hostConfigPath = positionArgs[0];
    this.args = args;
  }


  async start() {
    const apiClient = await this.makeClient(this.args.host, this.args.port);
    const infoResult: HostInfo =  await apiClient.callMethod('info');

    await this.buildBundle(infoResult.platform, infoResult.machine);

    // TODO: make hash sum
    // TODO: read bundle

    await apiClient.close();
  }


  private async buildBundle(platform: Platforms, machine: string) {
    await squidletLightBuilder(
      undefined,
      platform,
      machine,
      this.args.minimize !== 'false',
      this.args.ioServer === 'true',
      undefined,
      this.hostConfigPath
    );
  }

  private async makeClient(host?: string, port?: string): Promise<WsApiClient> {
    const client: WsApiClient = new WsApiClient(
      hostDefaultConfig.config.rcResponseTimoutSec,
      console.log,
      console.info,
      consoleError,
      host,
      (port) ? parseInt(port) : undefined
    );

    await client.init();

    return client;
  }

}
