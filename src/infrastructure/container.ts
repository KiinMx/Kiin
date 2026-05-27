type Factory<T> = (...args: string[]) => T;

const registry = new Map<string, Factory<unknown>>();
const instances = new Map<string, unknown>();

export const container = {
  register<T>(key: string, factory: Factory<T>): void {
    registry.set(key, factory as Factory<unknown>);
  },

  resolve<T>(key: string, ...args: string[]): T {
    const singletonKey = args.length > 0 ? `${key}:${args.join(':')}` : key;

    const cached = instances.get(singletonKey);
    if (cached !== undefined) return cached as T;

    const factory = registry.get(key);
    if (!factory) throw new Error(`No registration found for key: "${key}"`);

    const instance = factory(...args);
    instances.set(singletonKey, instance);
    return instance as T;
  },

  reset(): void {
    instances.clear();
  },
};
