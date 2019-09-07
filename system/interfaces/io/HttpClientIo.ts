import {HttpRequest, HttpResponse} from '../Http';


export const Methods = [
  'fetch',
];


export interface HttpClientIo {
  fetch(request: HttpRequest): Promise<HttpResponse>;
}
