import {GetDriverDep} from 'system/base/EntityBase';
import ServiceBase from 'system/base/ServiceBase';
import {HttpServerProps} from 'system/interfaces/io/HttpServerIo';
import {Route} from 'system/lib/HttpRouterLogic';
import {JsonTypes, Primitives} from 'system/interfaces/Types';
import {parseArgs} from 'system/lib/helpers';

import {HttpDriverResponse} from '../../drivers/HttpServer/HttpServerLogic';
import {HttpServerRouter} from '../../drivers/HttpServerRouter/HttpServerRouter';


const allowedApiMethodsToCall = [
  'info',
  'action',
  'getDeviceStatus',
  'getDeviceConfig',
  'getState',
  //'getSessionStore',
  'republishWholeState',
  'switchToIoServer',
  'reboot',
];


export default class HttpApi extends ServiceBase<HttpServerProps> {
  private get router(): HttpServerRouter {
    return this.depsInstances.router;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.router = await getDriverDep('HttpServerRouter')
      .getInstance(this.props);

    this.router.addRoute('get', '/api/:apiMethodName/:args', this.handleRoute);
    this.router.addRoute('get', '/api/:apiMethodName', this.handleRoute);
  }


  private handleRoute = async (route: Route): Promise<HttpDriverResponse> => {
    const apiMethodName: Primitives | undefined = route.params.apiMethodName;

    if (typeof apiMethodName !== 'string') {
      return {
        status: 400,
        body: `Unexpected type of method "${apiMethodName}"`,
      };
    }
    if (!allowedApiMethodsToCall.includes(apiMethodName)) {
      return {
        status: 404,
        body: `Api method "${apiMethodName}" not found`,
      };
    }

    const args: JsonTypes[] = parseArgs(route.params.args);
    let result: any;

    try {
      result = await this.context.system.apiManager.callApi(apiMethodName, args);
    }
    catch (err) {
      return {
        status: 500,
        body: {
          error: String(err),
        },
      };
    }

    return {
      body: {
        result,
        success: true,
      },
    };
  }

}
