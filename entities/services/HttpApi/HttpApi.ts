import {GetDriverDep} from 'system/base/EntityBase';
import ServiceBase from 'system/base/ServiceBase';
import {HttpServerProps} from 'system/interfaces/io/HttpServerIo';
import {Route} from 'system/lib/HttpRouterLogic';
import {JsonTypes, Primitives} from 'system/interfaces/Types';
import {parseArgs} from 'system/lib/helpers';

import {HttpDriverResponse} from '../../drivers/HttpServer/HttpServerLogic';
import {HttpServerRouter} from '../../drivers/HttpServerRouter/HttpServerRouter';


export interface HttpApiBody {
  result?: JsonTypes;
  error?: string;
}


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
    let body: HttpApiBody;

    if (typeof apiMethodName !== 'string') {
      body = { error: `Unexpected type of method "${apiMethodName}"` };

      return {
        status: 400,
        body,
      };
    }
    if (!allowedApiMethodsToCall.includes(apiMethodName)) {
      body = { error: `Api method "${apiMethodName}" not found` };

      return {
        status: 404,
        body,
      };
    }

    return await this.callApiMethod(route, apiMethodName);
  }

  private async callApiMethod(route: Route, apiMethodName: string): Promise<HttpDriverResponse> {
    const args: JsonTypes[] = parseArgs(route.params.args);
    let body: HttpApiBody;
    let result: any;

    try {
      result = await this.context.system.apiManager.callApi(apiMethodName, args);
    }
    catch (err) {
      body = { error: String(err) };

      return {
        status: 500,
        body,
      };
    }

    body = { result };

    return { body };
  }

}
