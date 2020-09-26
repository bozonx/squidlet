import {ChangeHandler} from '../../interfaces/io/DigitalInputIo';
import DebounceCall from '../../lib/debounceCall/DebounceCall';
import IndexedEventEmitter from '../../lib/IndexedEventEmitter';
import {Edge, InputResistorMode} from '../../interfaces/gpioTypes';
import Timeout = NodeJS.Timeout;


interface InputPinProps {
  resistor: InputResistorMode;
  debounce?: number;
  edge?: Edge;
}

const READ_RESULT_PREFIX = 'result';


export default class DigitalExpanderInputLogic {
  private readonly logError: (msg: Error | string) => void;
  private readonly pollOnce: () => Promise<void>;
  private readonly waitResultTimeoutSec: number;
  // change events of input pins
  private readonly events = new IndexedEventEmitter<ChangeHandler>();
  private readonly debounce = new DebounceCall();
  private state: {[index: string]: boolean} = {};
  private pinProps: {[index: string]: InputPinProps} = {};
  private pollPromise?: Promise<void>;
  // timeouts for the time when pin is waiting for poll result after debounce
  private waitingPollResultTimeouts: {[index: string]: Timeout} = {};


  constructor(
    logError: (msg: Error | string) => void,
    pollOnce: () => Promise<void>,
    waitResultTimeoutSec: number
  ) {
    this.logError = logError;
    this.pollOnce = pollOnce;
    this.waitResultTimeoutSec = waitResultTimeoutSec;
  }

  destroy() {
    this.events.destroy();
    this.debounce.destroy();

    delete this.state;
    delete this.pinProps;
  }


  /**
   * To use debounce at microcontroller side set debounce to 0.
   * @param pin
   * @param resistor
   * @param debounce
   * @param edge
   */
  setupPin(
    pin: number,
    resistor: InputResistorMode,
    debounce?: number,
    edge?: Edge
  ) {
    this.pinProps[pin] = {
      resistor,
      debounce,
      edge,
    };
  }

  getState(): {[index: string]: boolean} {
    return this.state;
  }

  /**
   * Listen to changes of pin after debounce was processed.
   */
  onChange(pin: number, handler: ChangeHandler): number {
    return this.events.addListener(pin, handler);
  }

  removeListener(handlerIndex: number) {
    this.events.removeListener(handlerIndex);
  }

  /**
   * It just clears debounce and handlers of pin
   */
  clearPin(pin: number) {

    // TODO: надо удалить таймаут ожидания результата

    // TODO: review
    if (this.waitingPollResult) delete this.waitingPollResult[pin];

    this.events.removeAllListeners(pin);
    this.debounce.clear(pin);
  }

  cancel() {

    // TODO: надо удалить таймаут ожидания результата

    // TODO: review
    this.debounce.clearAll();
  }

  /**
   * Handle driver's income message
   * State which is income after poling request.
   * More than one pin can be changed.
   */
  handleIncomeState = (pin: number, newState: {[index: string]: boolean}) => {
    // handle logic of all the changed pins
    for (let pin of Object.keys(newState)) {
      // if pin is in debounce time then do nothing
      if (this.debounce.isInvoking(pin)) {
        continue;
      }
      // if pin is waiting poll result after debounce
      else if (this.waitingPollResultTimeouts[pin]) {
        this.events.emit(`${READ_RESULT_PREFIX}${pin}`, newState[pin]);
      }

      // Don't handle not changed pins.
      // It means they not changed but was delivered on poll.
      if (newState[pin] === this.state[pin]) continue;

      this.startDebounce(parseInt(pin), newState[pin]);
    }
  }


  /**
   * Start a new debounce for pin which has been changed and isn't in debounce progress.
   */
  private startDebounce(pin: number, newValue: boolean) {
    if (!this.pinProps[pin]) {
      throw new Error(`Pin "${pin}" hasn't been set up.`);
    }

    const debounceMs: number = this.pinProps[pin].debounce || 0;
    // make debounced call if it was set
    if (debounceMs > 0) {
      // wait for debounce and after than read current level
      this.debounce.invoke(() => {
        // debounce don't handle cb's promise
        this.handleEndOfDebounce(pin)
          .catch(this.logError);
      }, debounceMs, pin)
        .catch(this.logError);

      return;
    }
    // else emit right now if there isn't any debounce
    this.afterDebounce(pin, newValue);
  }

  /**
   * While debounce is in progress all other requests are ignored.
   * When debounce is finished then the confirmations is started.
   */
  private async handleEndOfDebounce(pin: number) {
    this.doPoll()
      .catch(this.logError);

    const finalState: boolean = await this.waitForFinalState(pin);

    this.afterDebounce(pin, finalState);
  }

  private async doPoll() {

    // TODO: review может спокойно запускать новый poll - может там очередь отрабатывает

    // If poll is in progress then just wait for poll is finished
    if (this.pollPromise) {
      await this.pollPromise;
    }
    // It there isn't any poll then make a new one
    else {
      try {
        this.pollPromise = this.pollOnce();

        await this.pollPromise;
      }
      catch (e) {
        delete this.pollPromise;

        throw e;
      }

      delete this.pollPromise;
    }
  }

  private waitForFinalState(pin: number): Promise<boolean> {
    // it will be called immediately at the current tick.
    return new Promise<boolean>((resolve, reject) => {
      const handlerIndex: number = this.events.addListener(
        `${READ_RESULT_PREFIX}${pin}`,
        (level: boolean) => {
          this.events.removeListener(handlerIndex);
          clearTimeout(this.waitingPollResultTimeouts[pin]);

          delete this.waitingPollResultTimeouts[pin];

          resolve(level);
        }
      );

      this.waitingPollResultTimeouts[pin] = setTimeout(() => {
        this.events.removeListener(handlerIndex);

        delete this.waitingPollResultTimeouts[pin];

        reject(new Error(`Wait pin "${pin}" result timeout`));
      }, this.waitResultTimeoutSec * 1000);
    });
  }

  private afterDebounce(pin: number, finalState: boolean) {

    // TODO: handle edge

    // set a new value
    this.updateState(pin, newValue);


    // rise a new event even value hasn't been actually changed since first check
    this.events.emit(pin, newValue);

  }


}


// /**
//  * Is debounce in propgress of poll in propress
//  * @param pin
//  */
// isInProgress(pin: number) {
//   return this.debounce.isInvoking(pin) || this.isPollInProgress();
// }

// private setFinalState(pin: number) {
//   // means that poll has been canceled
//   if (!this.polledPinsBuffer) return;
//
//   // old state
//   const stateBeforePoll: number = this.getState();
//
//   // set all the values which has been received via last poll
//   for (let pinStr of Object.keys(this.polledPinsBuffer)) {
//     if (getBitFromByte(stateBeforePoll, pin) === this.polledPinsBuffer[pinStr]) continue;
//
//     // set a new value
//     this.updateState(Number(pinStr), this.polledPinsBuffer[pinStr]);
//     // rise a new event even value hasn't been actually changed since first check
//     this.events.emit(Number(pinStr), this.polledPinsBuffer[pinStr]);
//   }
//
//   delete this.pollPromise;
//   delete this.polledPinsBuffer;
// }
