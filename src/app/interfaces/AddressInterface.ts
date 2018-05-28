export default interface Address {
  hostId: string;
  type: string;

  // TODO: может bus тоже должен быть string ????

  bus: number;
  address: string;
}
