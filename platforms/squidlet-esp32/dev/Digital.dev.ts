import Digital from '../../../host/src/app/interfaces/dev/Digital';

// TODO: проверить чтобы возвращался boolean
// TODO: проверить чтобы принимался boolean

export default class DigitalDev implements Digital {
  setup(pin: number): Promise<void> {

  }

  read(pin: number): Promise<boolean> {

  }

  write(pin: number, value: boolean): Promise<void> {

  }

  watch(pin: number, handler: WatchHandler): void {

  }
}
