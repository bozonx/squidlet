#include <Arduino.h>
#include "funcDigitalInput.h"
#include "global.cpp"
#include "helpers.h"
#include "protocol.h"


#define STATE_BYTES_COUNT 3

typedef enum __attribute__ ((packed))  {
  FUNC_SETUP = 12,
  // forcelly add message to queue
  FUNC_READ_FORCE
} DigitalInputFunctionNum;

typedef enum __attribute__ ((packed))  {
  FEEDBACK_READ = 13
} DigitalInputFeedbackNum;

typedef enum __attribute__ ((packed))  {
  RESISTOR_NONE,
  RESISTOR_PULLUP
} DigitalIinputResistorMode;

int usedPin[STATE_BYTES_COUNT] = {0};
int savedState[STATE_BYTES_COUNT] = {0};
int freshState[STATE_BYTES_COUNT] = {0};
boolean hasRegisteredMessageCb = false;


void startListenPin(uint8_t pin) {
  int octetNum = getOctetNum(pin);
  int bitNumInOctet = getBitNumInOctet(pin);

  updateBitInByte(usedPin[octetNum], bitNumInOctet, 1);
}

void setPinFreshState(uint8_t pin, uint8_t newState) {
  int octetNum = getOctetNum(pin);
  int bitNumInOctet = getBitNumInOctet(pin);

  updateBitInByte(freshState[octetNum], bitNumInOctet, newState);
}

boolean isStateChanged() {
  for (int i = 0; i < STATE_BYTES_COUNT; i++) {
    if (freshState[i] != savedState[i]) {
      return true;
    }
  }

  return false;
}

boolean isPinUsed(uint8_t pin) {
  int octetNum = getOctetNum(pin);
  int bitNumInOctet = getBitNumInOctet(pin);

  return getBitFromByte(usedPin[octetNum], bitNumInOctet);
}

auto digitalOutputMakeMessage = [](uint8_t &feedbackNum, uint8_t argsData[], uint8_t &argsDataLength, uint8_t &hasMoreMessages) {
  hasRegisteredMessageCb = false;
  int feedbackRead = FEEDBACK_READ;
  feedbackNum = feedbackRead;
  argsDataLength = STATE_BYTES_COUNT;

  for (int i = 0; i < STATE_BYTES_COUNT; i++) {
    argsData[i] = freshState[i];
    // set saved state as current state
    savedState[i] = freshState[i];
  }
};

auto digitalInputSetup = [](uint8_t data[], int dataLength) {
  if (data[1] == RESISTOR_PULLUP) {
    pinMode(data[0], INPUT_PULLUP);
  }
  else {
    pinMode(data[0], INPUT);
  }

  startListenPin(data[0]);
};

auto digitalReadForce = [](uint8_t data[], int dataLength) {
  if (!hasRegisteredMessageCb) {
    registerFeedbackCallback(digitalOutputMakeMessage);
  }
};


/////////// PUBLIC
void digitalInputBegin() {
  registerFunc(FUNC_SETUP, digitalInputSetup);
  registerFunc(FUNC_READ_FORCE, digitalReadForce);
}

void digitalInputLoop() {
  for (uint8_t pin = 0; pin < STATE_BYTES_COUNT * 8; pin++) {
    if (!isPinUsed(pin)) {
      continue;
    }

    uint8_t newState = digitalRead(pin);

    setPinFreshState(pin, newState);

    if (isStateChanged() && !hasRegisteredMessageCb) {
      hasRegisteredMessageCb = true;

      registerFeedbackCallback(digitalOutputMakeMessage);
    }
  }
}
