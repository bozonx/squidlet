import {GetDriverDep} from 'system/base/EntityBase';
import ServiceBase from 'system/base/ServiceBase';
import {HttpServerProps} from 'system/interfaces/io/HttpServerIo';
import {HttpServer} from '../../drivers/HttpServer/HttpServer';
import {HttpDriverRequest, HttpDriverResponse} from '../../drivers/HttpServer/HttpServerLogic';


const allowedApiMethodsToCall = [
  'callDeviceAction',
  'getDeviceStatus',
  'getDeviceConfig',
  'setDeviceConfig',
  'getState',
  'getHostInfo',
  'getSessionStore',
  'switchToIoServer',
  'publishWholeState',
  'reboot',
];


export default class HttpApi extends ServiceBase<HttpServerProps> {
  private get httpServer(): HttpServer {
    return this.depsInstances.httpServer;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.httpServer = await getDriverDep('HttpServer')
      .getInstance(this.props);

    // listen income api requests
    this.httpServer.onRequest(this.handleIncomeRequest);
  }


  private handleIncomeRequest = async (request: HttpDriverRequest): Promise<HttpDriverResponse> => {
    // TODO: проверить разрешенно ли запускать api

    const result = (this.context.system.api as any)[methodName](...args);

    const body = {
      result,
    };

    return { body };
  };

}
