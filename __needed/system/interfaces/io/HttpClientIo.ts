import {HttpRequest, HttpResponse} from '../../../../__idea2021/networking/interfaces/__old/Http.js';
import IoItem from '../../../../squidlet/__old/system/interfaces/IoItem';


export const Methods = [
  'fetch',
];


export interface HttpClientIo extends IoItem {
  fetch(request: HttpRequest): Promise<HttpResponse>;
}
