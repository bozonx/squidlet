import Destination from './Destination';


export default interface Message {
  // name of category of message
  category: string;
  // unique topic of message in category
  topic: string;
  // hostId of host which emits a message
  from: string;
  // destination hostId
  to: string;
  // count of routers which message transfer before it will be deleted
  ttl: number;
  // hosts between "from" and "to"
  route: Array<string>;
  // TODO: сделать плоским
  request?: {
    // TODO: наверное не обязательно для локальных сообщений
    id: string,
    isRequest?: boolean,
    isResponse?: boolean,
  };
  // TODO: сделать плоским
  error?: {
    message: string,
    code: number,
  };
  payload: any;
}
