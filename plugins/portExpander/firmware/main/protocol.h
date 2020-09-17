#ifndef protocol_h
#define protocol_h

typedef void (*FuncCb)(uint8_t data[], int dataLength);
typedef void (*ReturnCb)(uint8_t &feedbackNum, uint8_t argsData[], uint8_t &argsDataLength, uint8_t &hasMoreMessages);

void addFeedbackMessage(uint8_t feedbackNum, uint8_t argsData[], uint8_t argsDataLength);
void registerFeedbackCallback(ReturnCb callback);
void registerFunc(uint8_t funcNum, FuncCb callback);
uint8_t handlePackageLengthAsk();
void handlePackageAsk(uint8_t *package, int lengthShouldBeRead);
void handleIncomeData(uint8_t *package8Bit, int sizeOfPackage8Bit);

#endif
