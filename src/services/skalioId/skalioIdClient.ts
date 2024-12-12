import axios from "axios";
import serviceLocator from "../ServiceLocator";
import * as symbols from "../symbols"
import {AccessService} from "../AccessService";


export const skalioIdClient = axios.create({
    // baseURL: environmentService.getBaseUrl() + "/api/id/v3",
    baseURL: "https://id.teambeam.dev/api/id/v3",
    headers: {
        "User-Agent": "teambeamjs/2.0",
    }
});

skalioIdClient.interceptors.request.use(async (config) => {
    const token = await serviceLocator.get<AccessService>(symbols.accessService)
        .getAccessToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
