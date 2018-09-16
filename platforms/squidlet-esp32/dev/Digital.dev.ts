import Digital, {PinMode, WatchHandler} from '../../../host/src/app/interfaces/dev/Digital';


declare function digitalRead(pin: number): boolean;
declare function digitalWrite(pin: number, value: boolean): void;
declare function pinMode(pin: number, mode: string, automatic?: boolean): void;


// TODO: проверить чтобы возвращался boolean
// TODO: проверить чтобы принимался boolean
// TODO: нужен ли automatic параметр в espruino ?


export default class DigitalDev implements Digital {
  async setup(pin: number, mode: PinMode): Promise<void> {
    pinMode(pin, mode);
  }

  async read(pin: number): Promise<boolean> {
    return digitalRead(pin);
  }

  async write(pin: number, value: boolean): Promise<void> {
    digitalWrite(pin, value);
  }

  watch(pin: number, handler: WatchHandler): void {

  }
}
