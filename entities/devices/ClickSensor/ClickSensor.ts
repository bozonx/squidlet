import DeviceBase from 'system/baseDevice/DeviceBase';
import {Data} from 'system/baseDevice/DeviceDataManagerBase';
import {DEFAULT_STATUS} from 'system/baseDevice/StatusState';
import {GetDriverDep} from 'system/entities/EntityBase';
import {omit} from 'system/helpers/lodashLike';

import {BinaryClick, BinaryClickProps} from '../../drivers/BinaryClick/BinaryClick';



interface Props extends BinaryClickProps {
  publish: 'down' | 'up' | 'both';
}


export default class ClickSensor extends DeviceBase<Props> {
  private get binaryClick(): BinaryClick {
    return this.depsInstances.binaryClick;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.binaryClick = await getDriverDep('BinaryClick')
      .getInstance(omit(this.props, 'publish'));
  }

  protected didInit = async () => {
    if (this.props.publish === 'down') {
      // change status silently
      this.binaryClick.addStateListener(this.onSilentStatusChange);
      // rise 1 on key up
      this.binaryClick.addDownListener(this.onDown);
    }
    else if (this.props.publish === 'up') {
      // change status silently
      this.binaryClick.addStateListener(this.onSilentStatusChange);
      // rise 0 on key up
      this.binaryClick.addUpListener(this.onUp);
    }
    else if (this.props.publish === 'both') {
      this.binaryClick.addStateListener(this.onClickStateChange);
    }
  }

  protected statusGetter = async (): Promise<Data> => {
    return { [DEFAULT_STATUS]: this.binaryClick.isDown() };
  }

  // protected transformPublishValue = (value: boolean): number => {
  //   return Number(value);
  // }


  private onSilentStatusChange = this.wrapErrors(async () => {
    if (!this.status) return;

    await this.status.write({[DEFAULT_STATUS]: true}, true);
  });

  private onDown = this.wrapErrors(async () => {
    if (!this.status) return;

    //this.status.publish(true);
    await this.setStatus(true);
  });

  private onUp = this.wrapErrors(async () => {
    if (!this.status) return;

    //this.status.publish(false);
    await this.setStatus(false);
  });

  private onClickStateChange = this.wrapErrors(async (level: boolean) => {
    await this.setStatus(level);
  });

}
