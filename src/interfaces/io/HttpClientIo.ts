import {HttpRequest, HttpResponse} from '../__old/Http';
import IoItem from '../../../../squidlet/__old/system/interfaces/IoItem';


export const Methods = [
  'fetch',
];


export interface HttpClientIo extends IoItem {
  fetch(request: HttpRequest): Promise<HttpResponse>;
}
