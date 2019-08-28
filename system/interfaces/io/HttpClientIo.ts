import {HttpRequest} from './HttpServerIo';


export const Methods = [

];


export interface HttpClientIo {
  send(request: HttpRequest): Promise<HttpRequest>;
}
