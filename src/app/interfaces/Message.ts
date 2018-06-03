import Destination from './Destination';


export default interface Message {
  category: string;
  topic: string;
  // TODO: не обязательно для локальных сообщений
  from: Destination;
  // TODO: не обязательно для локальных сообщений
  to: Destination;
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
