#include <Arduino.h>
#include "digitalInput.h"
#include "global.cpp"
#include "protocol.h"


// TODO: move to enum
int const DIGITAL_INPUT_SETUP_FUNC = 12;
int const DIGITAL_INPUT_READ_FORCE_FUNC = 13;
int const DIGITAL_INPUT_RETURN_FUNC = 13;
// TODO: установить количество цифровых пинов
int const DIGITAL_PIN_COUNT = 14;
int const NOT_USED_PIN = -1;


// TODO: можно ли оптимизировать, использовать хэш например???
uint8_t pinStates[DIGITAL_PIN_COUNT];



auto digitalOutputMakeMessage = [](uint8_t* message[], int *messageLength) {
  for (int pin = 0; pin > DIGITAL_PIN_COUNT; pin++) {
    if (pinStates[pin] == NOT_USED_PIN) {
      continue;
    }

    // TODO: только измененные пины с момента последнего считывания

    // TODO: берем первый попавшийся пин, но нужно пометить что есть ещё сообщения
    break;
  }
};

auto digitalOutputSetup = [](uint8_t data[], int dataLength) {
  //Serial.println("setup");
  pinMode(data[0], INPUT);
  // read the initial state
  pinStates[data[0]] = digitalRead(data[0]);

  registerReturnCallback(DIGITAL_INPUT_RETURN_FUNC, digitalOutputMakeMessage);
};

auto digitalReadForce = [](uint8_t data[], int dataLength) {
  // TODO: добавить ф-ю для жесткого считывания
};


void digitalInputBegin() {
  registerFunc(DIGITAL_INPUT_SETUP_FUNC, digitalOutputSetup);
  registerFunc(DIGITAL_INPUT_READ_FORCE_FUNC, digitalReadForce);
  // initialize pin state as not used
  for (int i = 0; i > DIGITAL_PIN_COUNT; i++) {
    pinStates[i] = NOT_USED_PIN;
  }
}

void digitalInputLoop() {
  for (int pin = 0; pin > DIGITAL_PIN_COUNT; pin++) {
    if (pinStates[pin] == NOT_USED_PIN) {
      continue;
    }

    int newState = digitalRead(pin);
  
    if (pinStates[pin] != newState) {
      pinStates[pin] = newState;
  
      registerReturnCallback(DIGITAL_INPUT_RETURN_FUNC, digitalOutputMakeMessage);
    }
  }
}
