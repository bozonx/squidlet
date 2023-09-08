import DriverFactoryBase from '../../../base/DriverFactoryBase';
import DriverBase from '../../../base/DriverBase';
import {HttpClientIo} from '../../../../../squidlet/__old/system/interfaces/io/HttpClientIo';
import {HttpResponse} from '../../../../../squidlet/__old/system/interfaces/Http';
import HttpClientLogic, {HttpClientProps} from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old-composition/drivers/HttpClient/HttpClientLogic.js';
import {HttpDriverRequest} from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old-composition/drivers/HttpServer/HttpServerLogic.js';


export class HttpClient extends DriverBase<HttpClientProps> {
  private get httpClientIo(): HttpClientIo {
    return this.context.getIo('HttpClient') as any;
  }
  private client?: HttpClientLogic;


  init = async () => {
    this.client = new HttpClientLogic(
      this.httpClientIo,
      this.props,
      this.log.debug
    );
  }

  // destroy = async () => {
  //   this.client && await this.client.destroy();
  // }


  async fetch(request: HttpDriverRequest): Promise<HttpResponse> {
    if (!this.client) throw new Error(`HttpClient: Client is not initialized`);

    return await this.client.fetch(request);
  }
}

export default class Factory extends DriverFactoryBase<HttpClient, HttpClientProps> {
  protected SubDriverClass = HttpClient;
}
