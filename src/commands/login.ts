import environmentService from "../services/EnvironmentService";
import authenticationService from "../services/AuthenticationService";

export const login = async () => {

    await environmentService.load();

    authenticationService.fetchIdToken();
}