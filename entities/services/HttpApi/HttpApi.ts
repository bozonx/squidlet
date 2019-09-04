import {GetDriverDep} from 'system/base/EntityBase';
import ServiceBase from 'system/base/ServiceBase';
import {HttpServerProps} from 'system/interfaces/io/HttpServerIo';
import {ParsedRoute} from 'system/lib/HttpRouterLogic';

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


export default class HttpApi extends ServiceBase<HttpServerProps> {
  private get router(): HttpServerRouter {
    return this.depsInstances.router;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.router = await getDriverDep('HttpServerRouter')
      .getInstance(this.props);

    this.router.addRoute('get', 'api/:methodName', this.handleRouteRequest);
  }


  private handleRouteRequest = async (
    parsedRoute: ParsedRoute,
    request: HttpDriverRequest
  ): Promise<HttpDriverResponse> => {
    // TODO: проверить разрешенно ли запускать api

    const result = (this.context.system.api as any)[methodName](...args);

    const body = {
      result,
    };

    return { body };
  };

}
