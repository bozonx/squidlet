import * as path from 'path';
import * as fs from 'fs';

import HttpClient from '../nodejs/ios/HttpClient';
import HttpClientLogic from '../entities/drivers/HttpClient/HttpClientLogic';
import {ENCODE} from '../system/constants';
import * as yaml from 'js-yaml';
import {collectPropsDefaults} from '../system/lib/helpers';


const httpApiManifestPath = path.resolve(__dirname, '../entities/services/HttpApi/manifest.yaml');
const httpClientIo = new HttpClient();


export default class HttpApiClient {
  private readonly client: HttpClientLogic;
  private readonly host: string;
  private readonly port: number;
  private readonly baseUrl: string;


  constructor(host: string = 'localhost', port?: number) {
    this.client = new HttpClientLogic(
      httpClientIo,
      {}
    );

    this.host = host;
    this.port = (port) ? port : this.loadDefaultPort();
    this.baseUrl = `http://${host}:${port}/api`;
  }


  async callMethod(pathToMethod: string, ...args: any[]): Promise<any> {
    return;
  }


  private loadDefaultPort(): number {
    const yamlContent: string = fs.readFileSync(httpApiManifestPath, ENCODE);
    const serviceManifest = yaml.safeLoad(yamlContent);
    const serviceProps = collectPropsDefaults(serviceManifest.props);

    return serviceProps.port;
  }

}
