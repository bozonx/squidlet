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

void addFeedbackMessageToPackage(uint8_t &feedbackNum, uint8_t argsData[], uint8_t &argsDataLength) {


//  Serial.print(packagesCount);
//  Serial.println(" - packagesCount");
//  Serial.print(feedbackStackLength);
//  Serial.println(" - feedbackStackLength");

//  Serial.print(feedbackNum);
//  Serial.println(" - feedbackNum");
//  Serial.print(argsData[0]);
//  Serial.println(" - argsData[0]");
//  Serial.print(argsData[1]);
//  Serial.println(" - argsData[1]");
//  Serial.print(argsDataLength);
//  Serial.println(" - argsDataLength");

  // TODO: добавлять в конец текущего пакета если есть место
  // TODO: нужно же формировать несколько сообщений в 1 пакет и только если длина сообщений превышает длину пакета то создавать новый пакет

  // put message into packet
  // save full length of packet
  lengthsOfPackagesInStack[packagesCount] = argsDataLength + 2;
  packageStack[packagesCount][0] = argsDataLength + 1;
  packageStack[packagesCount][1] = feedbackNum;

  for (int i = 0; i < argsDataLength; i++) {
    packageStack[packagesCount][i + 2] = argsData[i];
  }

//  Serial.println(lengthsOfPackagesInStack[packagesCount]);
//  Serial.println(packageStack[packagesCount][0]);
//  Serial.println(packageStack[packagesCount][1]);
//  Serial.println(packageStack[packagesCount][2]);
//  Serial.println(packageStack[packagesCount][3]);
//  Serial.println("--");

  // current package is full go to the next one next time
  packagesCount++;
}


uint8_t handlePackageLengthAsk() {
  if (packagesCount == 0) {
    // there aren't any packages to be read, make new packages
    for (int i = 0; i < feedbackStackLength; i++) {
      uint8_t feedbackNum = 0;
      uint8_t argsData[MAX_ARGS_LENGTH_BYTES] = {0};
      uint8_t argsDataLength = 0;
      int doReadMessages = 1;

      while (doReadMessages) {
        uint8_t hasMoreMessages = 0;
        
        feedbackStack[i](feedbackNum, argsData, argsDataLength, hasMoreMessages);
        addFeedbackMessageToPackage(feedbackNum, argsData, argsDataLength);

        doReadMessages = hasMoreMessages;
      }
      // clear the callback
      feedbackStack[i] = 0;
    }
    // flush all the callbacks. Means all of them has been read.
    feedbackStackLength = 0;
  }

//  Serial.print(packagesCount);
//  Serial.println(" - packagesCount");
//  Serial.print(lengthsOfPackagesInStack[0]);
//  Serial.println(" - lengthsOfPackagesInStack[0]");

  // return the length of the first package
  return lengthsOfPackagesInStack[0];
}

void handlePackageAsk(uint8_t package[], int lengthShouldBeRead) {
  if (packagesCount == 0) {
    return;
  }

  // TODO: проверить lengthShouldBeRead
  // TODO: проверить readPackagesLength

  for (int i = 0; i < lengthsOfPackagesInStack[readPackagesLength]; i++) {
    package[i] = packageStack[readPackagesLength][i];
  }

  // mark package than is has been read
  readPackagesLength++;

  // TODO: проверить
  if (readPackagesLength >= packagesCount) {
    // all done, clear
    packagesCount = 0;
    readPackagesLength = 0;
  }

//    slave.writeRegisterToBuffer(0, 525);
//    slave.writeRegisterToBuffer(1, 1280);

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
