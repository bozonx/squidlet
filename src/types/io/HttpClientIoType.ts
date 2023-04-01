import {HttpRequest, HttpResponse} from '../../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/interfaces/__old/Http.js';
import IoItem from '../../../../__old/system/interfaces/IoItem';


export const Methods = [
  'fetch',
];


export interface HttpClientIoType extends IoItem {
  fetch(request: HttpRequest): Promise<HttpResponse>;
}
