import {HttpRequest, HttpResponse} from '../Http';
import IoItem from '../IoItem';


export const Methods = [
  'fetch',
];


export interface HttpClientIo extends IoItem {
  fetch(request: HttpRequest): Promise<HttpResponse>;
}
