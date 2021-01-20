import {JsonTypes} from '../../../interfaces/Types'


export interface ApiRequest {
  host: string
  action: string
  args: (JsonTypes | Uint8Array)[]
}
