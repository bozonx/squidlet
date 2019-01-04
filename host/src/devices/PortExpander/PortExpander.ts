import DeviceBase, {DeviceBaseProps} from '../../baseDevice/DeviceBase';
import {GetDriverDep} from '../../app/entities/EntityBase';
import {ExpanderDriverProps, PortExpanderDriver} from '../../drivers/PortExpander/PortExpander.driver';
import {PinMode} from '../../app/interfaces/dev/Digital';
import PublishParams from '../../app/interfaces/PublishParams';


interface Props extends DeviceBaseProps, ExpanderDriverProps {
}


export default class PortExpander extends DeviceBase<Props> {
  private get expander(): PortExpanderDriver {
    return this.depsInstances.expander as PortExpanderDriver;
  }

  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.expander = await getDriverDep('PortExpander.driver')
      .getInstance(this.props);
  }

  protected didInit = async () => {
    // listen driver's change
    this.expander.addListener(this.onExpanderChange);
  }

  protected actions = {
    setup: (pin: number, pinMode: PinMode, outputInitialValue?: boolean): Promise<void> => {
      return this.expander.setup(pin, pinMode, outputInitialValue);
    },

    getPinMode: (pin: number): Promise<'input' | 'output' | undefined> => {
      return this.expander.getPinMode(pin);
    },

    read: (pin: number): Promise<boolean> => {
      return this.expander.read(pin);
    },

    write: (pin: number, value: boolean): Promise<void> => {
      return this.expander.write(pin, value);
    },
  };

  getStatus = async (): Promise<boolean[]> => {
    return await this.expander.getValues();
  }

  setStatus = async (newValue: boolean[]): Promise<void> => {
    return this.expander.writeState(newValue);
  }

  protected transformPublishValue = (binArr: number[]): string => {
    return binArr.join('');
  }


  private onExpanderChange = async (err: Error | null, values?: boolean[]) => {

    // TODO: проверить обработку ошибок что error придет

    if (err) {
      return this.env.log.error(String(err));
    }

    const params: PublishParams = {
      //isSilent: true,
    };

    this.publish('status', values, params);
  }

}
