#ifndef helpers_h
#define helpers_h

uint8_t getBitFromByte(uint8_t souceByte, uint8_t bitNum);
int getOctetNum(double bitNum);
int getBitNumInOctet(double bitNum);
void updateBitInByte(int &souceByte, uint8_t bitNum, uint8_t value);
void convertUint8ToUint16(uint8_t *sourceArr8Bit, int sourceLength, uint16_t *resultArr16Bit);
void convert16BitArrTo8Bit(uint16_t arr16[], int sizeofArr16, uint8_t *resultArr8Bit);

#endif
