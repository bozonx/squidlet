import DeviceBase from '__old/system/base/DeviceBase';
import {Serial, SerialProps} from '../../../../../squidlet-networking/src/drivers/Serial/Serial';


interface Props extends SerialProps {
}


export default class SerialListener extends DeviceBase<Props> {
  private get serial(): Serial {
    return this.depsInstances.serial as any;
  }


  protected async didInit() {
    this.depsInstances.serial = await this.context.getSubDriver('Serial', this.props);

    this.serial.onMessage((data: string | Uint8Array) => {

      this.setStatus(data);
    });
  }

}
