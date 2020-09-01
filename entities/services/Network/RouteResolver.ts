
/*
* смотрим хост с кэше маршрутов
* если есть то отправляем по этому маршруту
* если не удалось или нет кэша маршрута то делаем резолв хоста
* отправляем широковещательный запрос и собираем обратный путь, 1й вернувшийся ответ записывается в кэш как маршрут, остальные игнорируются
 */

export default class RouteResolver {
  private readonly myHostId: string;
  // host ids like {peerId: hostId}
  private hostIds: {[index: string]: string} = {};


  constructor(myHostId: string) {
    this.myHostId = myHostId;
  }


  init() {
  }

  destroy() {
    delete this.hostIds;
  }


  resolveRoute(toHostId: string): string[] {
    // TODO: make it
    return [this.myHostId, toHostId];
  }

  resolveClosestHostId(route: string[]): string {
    // TODO: наверное отрезать пройденную часть маршрута
    // TODO: add
    return route[1];
  }

  saveRoute(route: string[]) {
    // TODO: add
  }

  resolvePeerId(closestHostId: string): string | undefined {
    for (let peerId of Object.keys(this.hostIds)) {
      if (this.hostIds[peerId] === closestHostId) return peerId;
    }

    return;
  }

  activatePeer(peerId: string, hostId: string) {
    this.hostIds[peerId] = hostId;
  }

  deactivatePeer(peerId: string) {
    delete this.hostIds[peerId];
  }

}
