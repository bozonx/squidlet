#ifndef protocol_h
#define protocol_h

typedef void (*FuncCb)(uint8_t data[], int dataLength);

void registerFunc(uint8_t funcNum, FuncCb callback);

void handleIncomeData(uint16_t *package16Bit, int sizeOfPackage16Bit);

//uint16_t prepareOutcomeData(uint16_t address, uint16_t length);

#endif
