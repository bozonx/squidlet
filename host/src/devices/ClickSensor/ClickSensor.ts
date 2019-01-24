import DeviceBase, {DeviceBaseProps} from '../../baseDevice/DeviceBase';
import {Data} from '../../baseDevice/DeviceDataManagerBase';
import {DEFAULT_STATUS} from '../../baseDevice/Status';
import {GetDriverDep} from '../../app/entities/EntityBase';
import {BinaryInputDriver, BinaryInputDriverProps} from '../../drivers/Binary/BinaryInput.driver';
import IndexedEvents from '../../helpers/IndexedEvents';


type Handler = () => void;

interface Props extends DeviceBaseProps, BinaryInputDriverProps {
}


export default class ClickSensor extends DeviceBase<Props> {
  private readonly downEvents = new IndexedEvents<Handler>();
  private readonly upEvents = new IndexedEvents<Handler>();
  private isDown: boolean = false;
  private get binaryInput(): BinaryInputDriver {
    return this.depsInstances.binaryInput as any;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.binaryInput = await getDriverDep('BinaryInput.driver')
      .getInstance(this.props);
  }

  protected didInit = async () => {
    // listen driver's change
    this.binaryInput.addListener(this.onInputChange);
  }

  // TODO: проверить как установиться первичное значение

  // protected statusGetter = async (): Promise<Data> => {
  //   return { [DEFAULT_STATUS]: await this.binaryInput.read() };
  // }

  protected transformPublishValue = (value: boolean): number => {
    return Number(value);
  }


  onDown(cb: Handler): void {
    this.downEvents.addListener(cb);
  }

  onUp(): void {
    this.upEvents.addListener(cb);
  }


  private onInputChange = async (level: boolean) => {
    if (level) {
      if (this.isDown) return;

      await this.startDownLogic();
    }
    else {
      if (!this.isDown) return;

      this.startUpLogic();
    }

    // TODO: когда придет 1 - поднимаем событие onDown
    //       устанавливаем isDown и в течение него не принимаем события и не поднимаем onKeyDown

    // TODO: ждем когда придет 0 - (проверяем с debounce)
    //       поднимаем событие onUp



  }

  private async startDownLogic() {
    this.isDown = true;
    await this.setStatus(true);


  }

  private async startUpLogic() {

  }

}
