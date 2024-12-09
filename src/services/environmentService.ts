// src/services/environmentService.ts

import {Environment} from '../types';
import {fetchEnvironment} from "./skalioId";
import ConfigService from "./configService";

class EnvironmentService {
    private environment: Environment;

    constructor() {
        this.environment = {
            baseUrl: "",
            issuer: "",
            productName: "TeamBeam"
        };
    }

    public getIssuer() {
        return this.environment.issuer;
    }

    public getProductName() {
        return this.environment.productName;
    }

    public getBaseUrl() {
        return this.environment.baseUrl;
    }

    // Fetch the environment
    public async load() {
        try {
            console.debug("Loading environment...");
            this.environment = await fetchEnvironment(ConfigService.getDiscoveryUrl());
            console.info("Environment loaded!");
        } catch (error) {
            console.error('Error fetching environment:', error instanceof Error ? error.message : error);
        }
    }

}

export default new EnvironmentService();