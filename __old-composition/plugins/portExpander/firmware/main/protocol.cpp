#include <Arduino.h>
#include "protocol.h"
#include "global.cpp"


// Function callbacks by function number
void (*functioncCallbacks [FUNCTIONS_NUM]) (uint8_t data[], int dataLength) = {};
// Function callbacks by function number
void (*feedbackStack [FEEDBACK_STACK_LENGTH]) (uint8_t &feedbackNum, uint8_t argsData[], uint8_t &argsDataLength, uint8_t &hasMoreMessages) = {};
// length of queue of feedback callback which wait to be read
int feedbackStackLength = 0;
// stack of packages
uint8_t packageStack[FEEDBACK_PACKAGES_STACK_LENGTH][MAX_PACKAGE_LENGTH_BYTES];

// TODO: лучше наверное хранить длину пакета вначале и потом делать slice

// lengths of packages in the stack
uint8_t lengthsOfPackagesInStack[FEEDBACK_PACKAGES_STACK_LENGTH];
// count of available packages
int packagesCount = 0;
// length of packages in the stack which has been read
int readPackagesLength = 0;


void registerFeedbackCallback(ReturnCb callback) {
  if (feedbackStackLength > FEEDBACK_STACK_LENGTH) {
    return;
  }
  
  feedbackStack[feedbackStackLength] = callback;

  feedbackStackLength++;
}

void registerFunc(uint8_t funcNum, FuncCb callback) {
  if (funcNum > FUNCTIONS_NUM) {
    return;
  }

  functioncCallbacks[funcNum] = callback;
}

// Add a message to the last package or create a new package
void addFeedbackMessage(uint8_t feedbackNum, uint8_t argsData[], uint8_t argsDataLength) {
  // length of data + function num + args
  int messageLength = argsDataLength + 2;
  int currentPackageLength = lengthsOfPackagesInStack[packagesCount - 1];
  
  // initiate the first package
  if (packagesCount == 0) {
    packagesCount = 1;
  }

  if (currentPackageLength + messageLength > AVAILABLE_PACKAGE_LENGTH_BYTES) {
    // current package is full go to the next one
    packagesCount++;
    lengthsOfPackagesInStack[packagesCount - 1] = 0;
  }
  // put message into packet

  // save full length of packet
  lengthsOfPackagesInStack[packagesCount - 1] = currentPackageLength + messageLength;
  // set data length including function num and args
  packageStack[packagesCount - 1][currentPackageLength] = argsDataLength + 1;
  // set function num
  packageStack[packagesCount - 1][currentPackageLength + 1] = feedbackNum;
  // copy args data
  for (int i = 0; i < argsDataLength; i++) {
    packageStack[packagesCount - 1][currentPackageLength + 2 + i] = argsData[i];
  }
}

void readFeedbackStack() {
  // there aren't any packages to be read, make new packages
  for (int i = 0; i < feedbackStackLength; i++) {
    uint8_t feedbackNum = 0;
    uint8_t argsData[MAX_ARGS_LENGTH_BYTES] = {0};
    uint8_t argsDataLength = 0;
    int doReadMessages = 1;

    while (doReadMessages) {
      uint8_t hasMoreMessages = 0;
      
      feedbackStack[i](feedbackNum, argsData, argsDataLength, hasMoreMessages);
      addFeedbackMessage(feedbackNum, argsData, argsDataLength);

      doReadMessages = hasMoreMessages;
    }
    // clear the callback
    feedbackStack[i] = 0;
  }
  // flush all the callbacks. Means all of them has been read.
  feedbackStackLength = 0;
}


uint8_t handlePackageLengthAsk() {
  if (packagesCount == 0) {
    // read feedback stack and make packages
    readFeedbackStack();
  }
  // return the length of the first package
  return lengthsOfPackagesInStack[0];
}

void handlePackageAsk(uint8_t package[], int lengthShouldBeRead) {
  // if no available packages - do noting
  if (packagesCount == 0) {
    return;
  }

  int packageLength = lengthsOfPackagesInStack[readPackagesLength];

  // TODO: проверить lengthShouldBeRead
  // TODO: проверить readPackagesLength

  // copy package
  for (int i = 0; i < packageLength; i++) {
    package[i] = packageStack[readPackagesLength][i];
  }

  // mark package than is has been read
  readPackagesLength++;

  if (readPackagesLength >= packagesCount) {
    // all done, clear
    packagesCount = 0;
    readPackagesLength = 0;
    lengthsOfPackagesInStack[0] = 0;
  }

//  package[0] = 3;
//  package[1] = 13;
//  package[2] = 11;
//  package[3] = 1;
}

// Split messages in package, the first byte is size of args and the seconf is function name.
// Call function at any message in the package.
void handleIncomeData(uint8_t *package8Bit, int sizeOfPackage8Bit) {
  for (int i = 0; i < sizeOfPackage8Bit; i++) {
    // if is odd byte then stop cycle
    if (i + 1 >= sizeOfPackage8Bit) {
      break;
    }

    uint8_t sizeOfArgs = package8Bit[i];
    uint8_t funcNum = package8Bit[i + 1];
    // if the end of data of package
    if (funcNum == 0) {
      break;
    }
    
    int dataFirstByte = i + 2;
    uint8_t argsData[sizeOfArgs] = {0};
    // shift of function num
    i++;
    // read args data of there are any
    for (int l = 0; l < sizeOfArgs; l++) {
      argsData[l] = package8Bit[dataFirstByte + l];
      // shift the main interator
      i++;
    }

    // TODO: how to check if function exists ???

    // call function
    functioncCallbacks[funcNum](argsData, sizeOfArgs);
  }
}
