export function classMethodsStub(handleGet: (prop: string) => any) {
  const handler: ProxyHandler<Record<any, any>> = {
    get(target: any, prop: string) {
      return handleGet(prop)
    },
  }

  return new Proxy({}, handler)
}
