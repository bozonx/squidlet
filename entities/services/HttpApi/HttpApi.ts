import {GetDriverDep} from 'system/base/EntityBase';
import ServiceBase from 'system/base/ServiceBase';
import {HttpServerProps} from 'system/interfaces/io/HttpServerIo';
import {HttpServer} from '../../drivers/HttpServer/HttpServer';
import {HttpDriverRequest, HttpDriverResponse} from '../../drivers/HttpServer/HttpServerLogic';
import {HttpServerRouter} from '../../drivers/HttpServerRouter/HttpServerRouter';


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


// TODO: use router HttpServerRouter

export default class HttpApi extends ServiceBase<HttpServerProps> {
  private get router(): HttpServerRouter {
    return this.depsInstances.router;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.router = await getDriverDep('HttpServerRouter')
      .getInstance(this.props);

    // listen income api requests
    this.router.onRequest(this.handleIncomeRequest);
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
