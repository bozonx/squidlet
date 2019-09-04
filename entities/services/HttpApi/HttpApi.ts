import {GetDriverDep} from 'system/base/EntityBase';
import ServiceBase from 'system/base/ServiceBase';
import {HttpServerProps} from 'system/interfaces/io/HttpServerIo';
import {Route} from 'system/lib/HttpRouterLogic';

import {HttpDriverResponse} from '../../drivers/HttpServer/HttpServerLogic';
import {HttpServerRouter} from '../../drivers/HttpServerRouter/HttpServerRouter';


const allowedApiMethodsToCall = [
  'callDeviceAction',
  'getDeviceStatus',
  'getDeviceConfig',
  // TODO: use setDeviceConfigParam
  //'setDeviceConfig',
  'getState',
  'getHostInfo',
  // TODO: add get host config
  // TODO: add set host config param
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

    // TODO: parse args - split by "," and parseValue

    const result = await (this.context.system.api as any)[methodName](...route.params.args);

    return {
      body: {
        result
      },
    };
  }

}
