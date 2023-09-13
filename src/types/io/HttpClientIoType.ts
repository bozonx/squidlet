import {HttpRequest, HttpResponse} from 'squidlet-lib'


export interface HttpClientIoType {
  fetch(request: HttpRequest): Promise<HttpResponse>
}
