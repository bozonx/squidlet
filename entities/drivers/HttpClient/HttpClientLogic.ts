import {HttpClientIo} from 'system/interfaces/io/HttpClientIo';
import {HttpRequest, HttpResponse} from 'system/interfaces/io/HttpServerIo';
import {HttpContentType, prepareBody, resolveBodyType} from 'system/lib/httpBody';
import {omitUndefined} from 'system/lib/objects';
import {HttpDriverRequest} from '../HttpServer/HttpServerLogic';


// TODO: save cookies

export interface HttpClientProps {
  // TODO: add auth, httpAgent, proxy
}


export default class HttpClientLogic {
  private readonly httpClientIo: HttpClientIo;
  private readonly props: HttpClientProps;


  constructor(httpClientIo: HttpClientIo, props: HttpClientProps) {
    this.httpClientIo = httpClientIo;
    this.props = props;
  }

  async destroy() {
  }


  async fetch(request: HttpDriverRequest): Promise<HttpResponse> {
    const contentType: HttpContentType | undefined = (request.headers && request.headers['content-type'])
      || resolveBodyType(request.body);

    const preparedRequest: HttpRequest = {
      ...request,
      headers: omitUndefined({
        ...request.headers,
        'content-type': contentType,
      }),
      body: prepareBody(contentType, request.body),
    };

    return await this.httpClientIo.fetch(preparedRequest);
  }

}
