import Digital, {Edge, PinMode, WatchHandler} from '../../../host/src/app/interfaces/dev/Digital';


declare function getPinMode(pin: number): PinMode | undefined;
declare function digitalRead(pin: number): boolean;
declare function digitalWrite(pin: number, value: boolean): void;
declare function pinMode(pin: number, mode: string, automatic?: boolean): void;
declare function setWatch(handler: (result: { state: boolean }) => void, pin: number, options: any): number;
declare function clearWatch(id: number): void;
declare function clearWatch(): void;


// TODO: проверить что возвращает getPinMode если ещё пин не скорфигурирован
// TODO: проверить чтобы возвращался boolean
// TODO: проверить чтобы принимался boolean
// TODO: нужен ли automatic параметр в espruino ?
// TODO: нужено ли возвращать time и last time в setWatch?
// TODO: в digitalWrite - можно делать pulse если передать несколько значений
// TODO: какое будет значение по умолчанию для output пинов ??? поидее нужно сразу выставлять 0 или 1


export default class DigitalDev implements Digital {
  async setup(pin: number, mode: PinMode): Promise<void> {
    pinMode(pin, mode);
  }

  getPinMode(pin: number): PinMode | undefined {
    return getPinMode(pin);
  }

  async read(pin: number): Promise<boolean> {
    return digitalRead(pin);
  }

  async write(pin: number, value: boolean): Promise<void> {
    digitalWrite(pin, value);
  }

  setWatch(pin: number, handler: WatchHandler, debounce?: number, edge?: Edge): number {

    // TODO: на пинах которые не поддерживают прерывания - делать полинг

    const handlerWrapper = ({ state }: { state: boolean }) => {
      handler(state);
    };

    return setWatch(handlerWrapper, pin, {
      repeat: true,
      debounce,
      edge,
    });
  }

  clearWatch(id: number): void {
    // if no id param - all the watches will be cleared
    if (typeof id === 'undefined') {
      throw new Error(`You have to specify a watch id`);
    }

    clearWatch(id);
  }

  clearAllWatches() {
    clearWatch();
  }

}
