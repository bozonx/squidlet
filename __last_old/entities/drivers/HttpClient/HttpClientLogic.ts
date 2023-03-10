import {HttpClientIo} from 'system/interfaces/io/HttpClientIo';
import {prepareBody, resolveBodyType} from 'system/lib/httpBody';
import {omitUndefined} from 'system/lib/objects';
import {HttpContentType, HttpRequest, HttpResponse} from 'system/interfaces/Http';
import {HttpDriverRequest} from '../HttpServer/HttpServerLogic';



// TODO: save cookies

export interface HttpClientProps {
  // TODO: add auth, httpAgent, proxy
}


export default class HttpClientLogic {
  private readonly logDebug: (msg: string) => void;
  private readonly httpClientIo: HttpClientIo;
  private readonly props: HttpClientProps;


  constructor(httpClientIo: HttpClientIo, props: HttpClientProps, logDebug: (msg: string) => void, ) {
    this.httpClientIo = httpClientIo;
    this.props = props;
    this.logDebug = logDebug;
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

    this.logDebug(`HttpClientLogic: request ${JSON.stringify(request)}`);

    return await this.httpClientIo.fetch(preparedRequest);
  }

}
