// ServiceLocator.ts
class ServiceLocator {
    private static services: Map<symbol, any> = new Map();

    // Register a service with a specific key
    public static register<T>(key: symbol, service: T): void {
        this.services.set(key, service);
    }

    // Retrieve a service by its key
    public static get<T>(key: symbol): T {
        const service = this.services.get(key);
        if (!service) {
            throw new Error(`Service not found: ${key.toString()}`);
        }
        return service;
    }
}