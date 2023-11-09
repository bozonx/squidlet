import axios from 'axios'
import type {AxiosResponse} from 'axios'
import type {HttpClientIoType} from '../../types/io/HttpClientIoType.js'
import type {HttpRequest, HttpResponse} from 'squidlet-lib'
import {IoBase} from '../../base/IoBase.js'
import type {IoIndex} from '../../types/types.js'
import type {IoContext} from '../../system/context/IoContext.js'


export const HttpClientIoIndex: IoIndex = (ctx: IoContext) => {
  return new HttpClientIo(ctx)
}

export class HttpClientIo extends IoBase implements HttpClientIoType {
  async fetch(request: HttpRequest): Promise<HttpResponse> {
    const result: AxiosResponse = await axios({
      method: request.method,
      headers: request.headers as Record<string, any>,
      url: request.url,
      // TODO: как должен передаваться body
      // TODO: если стоит бинарный content-type то передавать бинарно
      data: request.body,
    })

    return {
      // TODO: проверить чтобы были в kebab формате
      headers: result.headers as Record<string, any>,
      status: result.status,
      // TODO: что с body - наверное надо конвертнуть Buffer в Uint если строка то оставить
      // TODO: если стоит бинарный content-type то получать бинарно
      body: result.data,
    }
  }

}
