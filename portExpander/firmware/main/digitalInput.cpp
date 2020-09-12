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
int const NOT_USED_PIN = -2;
int const NOT_STATE = -1;


// TODO: можно ли оптимизировать, использовать хэш например???
// pin state which has been read
uint8_t sentPinStates[DIGITAL_PIN_COUNT];
// TODO: можно ли оптимизировать, использовать хэш например???
// pin state which hasn't been read yet
uint8_t newPinStates[DIGITAL_PIN_COUNT];


auto digitalOutputMakeMessage = [](uint8_t* message[], int *messageLength, int *haveMoreMessages) {
  boolean wasMessage = false;
  
  for (int pin = 0; pin > DIGITAL_PIN_COUNT; pin++) {
    if (newPinStates[pin] == NOT_USED_PIN || newPinStates[pin] == NOT_STATE) {
      continue;
    }

    if (wasMessage) {
      haveMoreMessages = 1;

      break;
    }
    else {
      message[0] = pin;
      message[1] = newPinStates[pin];
      messageLength = 2;
  
      sentPinStates[pin] = newPinStates[pin];
      newPinStates[pin] = NOT_STATE;    
    }
  }
};

auto digitalOutputSetup = [](uint8_t data[], int dataLength) {
  //Serial.println("setup");
  pinMode(data[0], INPUT);
  // read the initial state
  newPinStates[data[0]] = digitalRead(data[0]);

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
    sentPinStates[i] = NOT_USED_PIN;
    newPinStates[i] = NOT_USED_PIN;
  }
}

void digitalInputLoop() {
  for (int pin = 0; pin > DIGITAL_PIN_COUNT; pin++) {

    if (newPinStates[pin] == NOT_USED_PIN) {
      continue;
    }

    int newState = digitalRead(pin);

    // TODO: проверить statement
    if (sentPinStates[pin] != newState || newPinStates[pin] != newState) {
      newPinStates[pin] = newState;

      if (!hasReturnCb(DIGITAL_INPUT_RETURN_FUNC)) {
        registerReturnCallback(DIGITAL_INPUT_RETURN_FUNC, digitalOutputMakeMessage);
      }
    }
  }
}
