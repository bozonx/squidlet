import * as path from 'path';

import Os from '../shared/helpers/Os';
import WsApiClient from '../shared/helpers/WsApiClient';
import hostDefaultConfig from '../hostEnvBuilder/configs/hostDefaultConfig';
import {consoleError} from '../system/lib/helpers';
import HostInfo from '../system/interfaces/HostInfo';
import Platforms from '../system/interfaces/Platforms';
import {BUNDLE_FILE_NAME, BUNDLE_SUM_FILE_NAME} from '../entities/services/Updater/Updater';
import AppBuilder, {DEFAULT_WORK_DIR} from '../squidletLight/AppBuilder';


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

    const workDir: string = DEFAULT_WORK_DIR;
    const bundleContent = await this.os.getFileContent(path.join(workDir, BUNDLE_FILE_NAME));
    const sumContent = await this.os.getFileContent(path.join(workDir, BUNDLE_SUM_FILE_NAME));
    // upload bundle and check sum
    await apiClient.callMethod('updater.updateBundle', bundleContent, sumContent);
    // restart the host
    await apiClient.callMethod('exit', 0);

    await apiClient.close();
  }


  private async buildBundle(platform: Platforms, machine: string) {
    const builder = new AppBuilder(
      platform,
      machine,
      this.hostConfigPath,
      undefined,
      this.args.minimize !== 'false',
      undefined,
      this.args.ioServer === 'true',
    );

    await builder.build();
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
