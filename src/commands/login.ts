import environmentService from "../services/EnvironmentService";
import {AuthenticationService} from "../services/AuthenticationService";
import serviceLocator from "../services/ServiceLocator";
import * as symbols from "../services/symbols";

export const login = async () => {
    const authenticationService: AuthenticationService = serviceLocator.get<AuthenticationService>(symbols.authenticationService);

    await environmentService.load();

    authenticationService.fetchIdToken();
}