import DeviceBase, {DEFAULT_STATUS} from 'system/base/DeviceBase';
import {GetDriverDep} from 'system/base/EntityBase';
import {omitObj} from 'system/lib/objects';
import {Dictionary} from 'system/interfaces/Types';

import {BinaryClick, BinaryClickProps} from '../../drivers/BinaryClick/BinaryClick';



interface Props extends BinaryClickProps {
  publish: 'down' | 'up' | 'both';
}


export default class ClickSensor extends DeviceBase<Props> {
  private get binaryClick(): BinaryClick {
    return this.depsInstances.binaryClick;
  }


  protected didInit = async () => {
    this.depsInstances.binaryClick = await this.context.getSubDriver(
      'BinaryClick',
      omitObj(this.props, 'publish')
    );

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


  protected statusGetter = async (): Promise<Dictionary> => {
    return { [DEFAULT_STATUS]: this.binaryClick.isDown() };
  }

  // protected transformPublishValue = (value: boolean): number => {
  //   return Number(value);
  // }


  private onSilentStatusChange = this.wrapErrors(async () => {
    if (!this.statusState) return;

    // TODO: почему тут silent write был ????

    await this.statusState.write({[DEFAULT_STATUS]: true});
  });

  private onDown = this.wrapErrors(async () => {
    if (!this.statusState) return;

    //this.status.publish(true);
    await this.setStatus(true);
  });

  private onUp = this.wrapErrors(async () => {
    if (!this.statusState) return;

    //this.status.publish(false);
    await this.setStatus(false);
  });

  private onClickStateChange = this.wrapErrors(async (level: boolean) => {
    await this.setStatus(level);
  });

}
