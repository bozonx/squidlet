import {HttpRequest, HttpResponse} from './HttpServerIo';


export const Methods = [
  'fetch',
];


export interface HttpClientIo {
  fetch(request: HttpRequest): Promise<HttpResponse>;
}
