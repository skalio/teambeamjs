// src/services/EnvironmentService.ts

import ConfigService from "./ConfigService";
import {fetchEnvironment} from "./skalioId/environment";
import {Environment} from "../models";

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