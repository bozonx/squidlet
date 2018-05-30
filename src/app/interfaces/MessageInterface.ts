import DestinationInterface from './DestinationInterface';


export default interface Message {
  topic: string;
  category: string;
  from: DestinationInterface;
  to: DestinationInterface;
  request?: {
    id: string,
    isRequest?: boolean,
    isResponse?: boolean,
  };
  error?: {
    message: string,
    code: number,
  };
  payload: any;
}
