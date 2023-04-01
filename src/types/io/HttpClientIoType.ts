import {HttpRequest, HttpResponse} from '../Http.js'


export interface HttpClientIoType {
  fetch(request: HttpRequest): Promise<HttpResponse>
}
