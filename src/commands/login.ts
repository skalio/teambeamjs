import environmentService from "../services/environmentService";
import {loginOperation} from "../services/skalioId/auth";
import {read} from 'read';

export const login = async () => {

    await environmentService.load();

    const email = await read({prompt: "Enter your email address: "});
    let key = await read({
        prompt: "Enter your password: ",
        silent: true,
        replace: '*'
    });

    let jwt = await loginOperation(
        environmentService.getBaseUrl(),
        email,
        "bcrypt",
        key,
        null
    );

    if (jwt.isMfaToken()) {
        console.log("Multi-factor authentication required! Choose one of the following authenticators:", jwt.getAuthenticators());

        // Create a completer function
        function completer(line: string): [string[], string] {
            // Filter suggestions based on the current input line
            const hits = jwt.getAuthenticators().filter((s) => s.startsWith(line));
            return [hits.length ? hits : jwt.getAuthenticators(), line]; // Return matches and the original line
        }

        const authenticatorType = await read({
            prompt: "Authenticator type :",
            completer: completer
        });
        key = await read({prompt: "Enter key :"});

        await loginOperation(
            environmentService.getBaseUrl(),
            email,
            authenticatorType,
            key,
            jwt.token
        );
    }
}