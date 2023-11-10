export default class RouteResolver {
    private readonly myHostId;
    private routes;
    private closestHostIds;
    constructor(myHostId: string);
    init(): void;
    destroy(): void;
    /**
     * Get closest hostId on route to host "to" from cache
     * @param to
     */
    resolveClosestHostId(to: string): string | undefined;
    /**
     * Save completed route of income message
     * @param completedRoute
     */
    saveRoute(completedRoute: string[]): void;
    resolvePeerId(closestHostId: string): string | undefined;
    activatePeer(peerId: string, hostId: string): void;
    deactivatePeer(peerId: string): void;
}
