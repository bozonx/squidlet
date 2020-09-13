#ifndef protocol_h
#define protocol_h

typedef void (*FuncCb)(uint8_t data[], int dataLength);
typedef void (*ReturnCb)(uint8_t* message[], int *messageLength, int *hasMoreMessages);

uint8_t handlePackageLengthAsk();
void handlePackageAsk(uint8_t *package, int lengthShouldBeRead);
boolean hasReturnCb(uint8_t funcNum);
void registerFunc(uint8_t funcNum, FuncCb callback);
void registerReturnCallback(uint8_t funcNum, ReturnCb callback);

void handleIncomeData(uint16_t *package16Bit, int sizeOfPackage16Bit);

//uint16_t prepareOutcomeData(uint16_t address, uint16_t length);

#endif
