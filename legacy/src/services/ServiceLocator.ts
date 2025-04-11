// ServiceLocator.ts
class ServiceLocator {
    private services: Map<symbol, any> = new Map();

    // Private constructor to prevent direct instantiation
    constructor() {
    }

    // Register a service with a specific key
    public register<T>(key: symbol, service: T): void {
        console.debug("Registered service", service);
        this.services.set(key, service);
    }

    // Retrieve a service by its key
    public get<T>(key: symbol): T {
        const service = this.services.get(key) as T;
        if (!service) {
            throw new Error(`Service not found!`);
        }
        return service;
    }
}

const serviceLocator = new ServiceLocator();
export default serviceLocator;