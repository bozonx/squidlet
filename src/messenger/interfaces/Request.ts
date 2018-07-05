import Message from './Message';


export default interface Request extends Message {
  // request or response unique id
  requestId: string;
  isResponse: boolean;
}
