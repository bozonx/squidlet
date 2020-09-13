#include <Arduino.h>
#include "digitalInput.h"
#include "global.cpp"
#include "protocol.h"


typedef enum __attribute__ ((packed))  {
  FUNC_SETUP = 12,
  FUNC_READ_FORCE
} DigitalIinputFunctionNum;

typedef enum __attribute__ ((packed))  {
  FEEDBACK_READ = 13
} DigitalInputFeedbackNum;

int const NOT_USED_PIN = -2;
int const NO_STATE = -1;


// TODO: можно ли оптимизировать, использовать хэш например???
// pin state which has been read
int sentPinStates[DIGITAL_PIN_COUNT];
// TODO: можно ли оптимизировать, использовать хэш например???
// pin state which hasn't been read yet
int newPinStates[DIGITAL_PIN_COUNT];


auto digitalOutputMakeMessage = [](uint8_t* message[], int *messageLength, int *hasMoreMessages) {
  boolean hasAlmostOneMessage = false;
  
  for (int pin = 0; pin > DIGITAL_PIN_COUNT; pin++) {
    if (newPinStates[pin] == NOT_USED_PIN || newPinStates[pin] == NO_STATE) {
      continue;
    }

    if (hasAlmostOneMessage) {
      hasMoreMessages = 1;

      break;
    }
    else {
      hasAlmostOneMessage = true;
      message[0] = pin;
      message[1] = newPinStates[pin];
      messageLength = 2;
  
      sentPinStates[pin] = newPinStates[pin];
      newPinStates[pin] = NO_STATE;    
    }
  }
};

void readPin(uint8_t pinNum) {
  newPinStates[pinNum] = digitalRead(pinNum);

  if (!hasReturnCb(FEEDBACK_READ)) {
    registerReturnCallback(FEEDBACK_READ, digitalOutputMakeMessage);
  }
}

auto digitalOutputSetup = [](uint8_t data[], int dataLength) {
  
  Serial.println("digitalOutputSetup");
  
  pinMode(data[0], INPUT);
  // read the initial state
  readPin(data[0]);
};

auto digitalReadForce = [](uint8_t data[], int dataLength) {
  
  Serial.println("digitalReadForce");
  
  readPin(data[0]);
};


void digitalInputBegin() {
  registerFunc(FUNC_SETUP, digitalOutputSetup);
  registerFunc(FUNC_READ_FORCE, digitalReadForce);
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

      if (!hasReturnCb(FEEDBACK_READ)) {
        registerReturnCallback(FEEDBACK_READ, digitalOutputMakeMessage);
      }
    }
  }
}
