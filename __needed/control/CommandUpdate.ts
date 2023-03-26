import * as path from 'path';

import Os from '../../../../../../../mnt/disk2/workspace/squidlet/__old/shared/helpers/Os.js';
import WsApiClient from '../../../../../../../mnt/disk2/workspace/squidlet-networking/src/bridges/__old/WsApiClient.js';
import hostDefaultConfig from '../../../../../../../mnt/disk2/workspace/squidlet/__old/hostEnvBuilder/configs/hostDefaultConfig.js';
import {consoleError} from '../../../../../../../mnt/disk2/workspace/squidlet/__old/system/lib/helpers.js';
import HostInfo from '../../../../../../../mnt/disk2/workspace/squidlet/__old/system/interfaces/HostInfo.js';
import Platforms from '../../../../../../../mnt/disk2/workspace/squidlet/__old/system/interfaces/Platforms.js';
import AppBuilder, {DEFAULT_WORK_DIR} from '../../../../../../../mnt/disk2/workspace/squidlet/__old/squidletLight/AppBuilder.js';
import {
  BUNDLE_CHUNK_SIZE_BYTES,
  BUNDLE_FILE_NAME,
  BUNDLE_SUM_FILE_NAME
} from '../../../../../../../mnt/disk2/workspace/squidlet/__old/entities/services/Updater/BundleUpdate.js';


export default class CommandUpdate {
  private readonly hostConfigPath: string;
  private readonly args: {[index: string]: any};
  private readonly os: Os = new Os();


  constructor(positionArgs: string[], args: {[index: string]: any}) {
    this.hostConfigPath = positionArgs[0];
    this.args = args;
  }


  async start() {
    const apiClient: WsApiClient = await this.makeClient(this.args.host, this.args.port);
    const infoResult: HostInfo =  await apiClient.callMethod('info');

    await this.buildBundle(infoResult.platform, infoResult.machine);
    await this.makeBundleTransaction(apiClient);
    // restart the host
    await apiClient.callMethod('exit', 0);

    await apiClient.close();
  }

  private async makeBundleTransaction(apiClient: WsApiClient) {
    const workDir: string = DEFAULT_WORK_DIR;
    const bundleContent = await this.os.getFileContent(path.join(workDir, BUNDLE_FILE_NAME));
    const sumContent = await this.os.getFileContent(path.join(workDir, BUNDLE_SUM_FILE_NAME));
    // start transaction
    console.log(`Starting transaction`);
    const transactionId: number = await apiClient.callMethod(
      'updater.startBundleTransaction',
      bundleContent.length
    );
    // upload bundle and check sum
    console.log(
      `Sending bundle of ${Math.round(bundleContent.length / 1024)} ` +
      `divided to chunks by ${Math.round(BUNDLE_CHUNK_SIZE_BYTES / 1024)}kb`
    );
    await this.sendBundleChunks(apiClient, transactionId, bundleContent);
    console.log(`Ending transaction`);
    await apiClient.callMethod('updater.finishBundleTransaction', transactionId, sumContent);
  }

  private async sendBundleChunks(apiClient: WsApiClient, transactionId: number, bundleContent: string) {
    let sentLength: number = 0;

    for (let chunkNum = 0; sentLength < bundleContent.length; chunkNum++) {
      const chunk: string = bundleContent.slice(sentLength, sentLength + BUNDLE_CHUNK_SIZE_BYTES);

      sentLength += chunk.length;

      console.log(
        `... sending chunk ${chunkNum}. ${Math.round(sentLength / 1024)}kb` +
        ` of ${Math.round(bundleContent.length / 1024)}kb`
      );

      await apiClient.callMethod('updater.writeBundleChunk', transactionId, chunk, chunkNum);
    }
  }

  private async buildBundle(platform: Platforms, machine: string) {
    const builder = new AppBuilder(
      platform,
      machine,
      this.hostConfigPath,
      this.args.name,
      undefined,
      this.args.minimize !== 'false',
      this.args.logLevel,
    );

    await builder.init();
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
