import {GetDriverDep} from 'system/base/EntityBase';
import ServiceBase from 'system/base/ServiceBase';
import {HttpServerProps} from 'system/interfaces/io/HttpServerIo';
import {Route} from 'system/lib/HttpRouterLogic';
import {JsonTypes} from 'system/interfaces/Types';
import {parseArgs} from 'system/lib/helpers';

import {HttpDriverResponse} from '../../drivers/HttpServer/HttpServerLogic';
import {HttpServerRouter} from '../../drivers/HttpServerRouter/HttpServerRouter';


const allowedApiMethodsToCall = [
  'callDeviceAction',
  'getDeviceStatus',
  'getDeviceConfig',
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

    this.router.addRoute('get', 'api/:methodName/:args', this.handleRouteRequest);
  }


  private handleRouteRequest = async (route: Route): Promise<HttpDriverResponse> => {
    const methodName: string | number | undefined = route.params.methodName;

    if (typeof methodName !== 'string') {
      return {
        status: 400,
        body: `Unexpected type of method "${methodName}"`,
      };
    }
    if (!allowedApiMethodsToCall.includes(methodName)) {
      return {
        status: 400,
        body: `Method "${methodName}" isn't allowed in a HttpApi service`,
      };
    }

    const args: JsonTypes[] = parseArgs(route.params.args);
    const result = await (this.context.system.api as any)[methodName](...args);

    return {
      body: {
        result
      },
    };
  }

}
