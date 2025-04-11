// src/services/skalioId/environment.ts

import axios from 'axios';
import {Environment} from '../../models';

export const fetchEnvironment = async (discoveryUrl: string): Promise<Environment> => {
    try {
        const discoveryResponse = await discover(discoveryUrl);

        const environment: Environment = {
            baseUrl: discoveryResponse.baseUri,
            issuer: discoveryResponse.issuer,
            productName: "TeamBeam"
        };
        return environment;

    } catch (error) {
        // Handle error
        if (axios.isAxiosError(error)) {
            console.error('Error fetching user:', error.message);
        } else {
            console.error('Unexpected error:', error);
        }
        throw error; // Re-throw the error for further handling
    }
}

// helper methods

interface DiscoveryResponse {
    issuer: string;
    baseUri: string;
    jwksUrl: string;
    tokenUrl: string;
}

const discover = async (discoveryUrl: string): Promise<DiscoveryResponse> => {
    try {
        const response = await axios.get<DiscoveryResponse>(discoveryUrl);

        return response.data;

    } catch (error) {
        // Handle error
        if (axios.isAxiosError(error)) {
            console.error('Error fetching user:', error.message);
        } else {
            console.error('Unexpected error:', error);
        }
        throw error; // Re-throw the error for further handling
    }
}

