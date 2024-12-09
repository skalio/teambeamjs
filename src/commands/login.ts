import environmentService from "../services/environmentService";
import {loginWithPassword} from "../services/skalioId/auth";
import {read} from 'read';

export const login = async () => {

    await environmentService.load();

    const email = await read({prompt: "Enter your email address: "});
    const key = await read({
        prompt: "Enter your password: ",
        silent: true,
        replace: '*'
    });

    const jwt = await loginWithPassword(environmentService.getBaseUrl(), email, key);
}