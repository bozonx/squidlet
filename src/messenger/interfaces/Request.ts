import Message from './Message';


export default interface Request extends Message {
  payload?: any;
  // request or response unique id
  requestId: string;
  isRequest: true;
}
