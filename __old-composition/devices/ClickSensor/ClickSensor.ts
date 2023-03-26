import DeviceBase from '__old/system/base/DeviceBase';
import {omitObj} from '../squidlet-lib/src/objects';
import {Dictionary} from '../squidlet-lib/src/interfaces/Types';
import {DEFAULT_DEVICE_STATUS} from '__old/system/constants';

import {BinaryClick, BinaryClickProps} from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/entities/drivers/BinaryClick/BinaryClick.js';



interface Props extends BinaryClickProps {
  /**
   * Which state will be published.
   * * pushed - publish only high level when button is pushed
   * * risen - publish only low level when button is risen
   * * both - publish both of states
   */
  publish: 'pushed' | 'risen' | 'both';
}


export default class ClickSensor extends DeviceBase<Props> {
  private get binaryClick(): BinaryClick {
    return this.depsInstances.binaryClick;
  }


  protected async didInit() {
    this.depsInstances.binaryClick = await this.context.getSubDriver(
      'BinaryClick',
      omitObj(this.props, 'publish')
    );

    // TODO: pushed and risen не будут работать пока не будет решена проблема
    //  чтобы публиковать не изменившийся стейт

    if (this.props.publish === 'pushed') {
      // rise 1 on key up
      this.binaryClick.onDown(this.handleDown);
    }
    else if (this.props.publish === 'risen') {
      // rise 0 on key up
      this.binaryClick.onUp(this.handleUp);
    }
    else if (this.props.publish === 'both') {
      this.binaryClick.onChange(this.handleChange);
    }
  }


  protected statusGetter = async (): Promise<Dictionary> => {
    return { [DEFAULT_DEVICE_STATUS]: this.binaryClick.isDown() };
  }


  private handleDown = this.wrapErrors(async () => {
    if (!this.statusState) return;

    await this.setStatus(true);
  });

  private handleUp = this.wrapErrors(async () => {
    if (!this.statusState) return;

    await this.setStatus(false);
  });

  private handleChange = this.wrapErrors(async (level: boolean) => {
    await this.setStatus(level);
  });

}
