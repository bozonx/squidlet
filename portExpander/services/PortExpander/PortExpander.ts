import ServiceBase from 'system/base/ServiceBase';
import IoItem from 'system/interfaces/IoItem';
import {IoSetBase} from 'system/interfaces/IoSet';
import Connection from 'system/interfaces/Connection';
import Digital from './io/Digital';
import ExpanderFunctionCall from './ExpanderFunctionCall';


interface Props {
  // name of connection service to use
  connection: string;
}

type ExpanderIoItemClass = new (
  functionCall: ExpanderFunctionCall,
  logError: (msg: string) => void
) => void;

const ios: {[index: string]: ExpanderIoItemClass} = {
  Digital,
};


export default class PortExpander extends ServiceBase<Props> implements IoSetBase {
  private connection!: Connection;
  private functionCall!: ExpanderFunctionCall;
  private readonly usedIo: {[index: string]: any} = {};


  init = async () => {
    if (!this.context.service[this.props.connection]) {
      throw new Error(`Connection "${this.props.connection}" hasn't been setup`);
    }

    this.connection = this.context.service[this.props.connection];
    this.functionCall = new ExpanderFunctionCall(this.connection);
  }

  destroy = async () => {
  }


  getIo<T extends IoItem>(ioName: string): T {
    if (!this.usedIo[ioName]) {
      this.usedIo[ioName] = new ios[ioName](this.functionCall, this.log.error);
    }

    return this.usedIo[ioName];
  }

  getNames(): string[] {
    return Object.keys(ios);
  }

}
