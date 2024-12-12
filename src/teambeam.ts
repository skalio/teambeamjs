// src/teambeam.ts

import {initConfig} from './commands/init';
import {login} from "./commands/login";
import {showProfile} from "./commands/profile";
import type {ITokenStorage} from "./services/ITokenStorage";
import {FileSystemTokenStorage} from "./services/FileSystemTokenStorage";
import serviceLocator from "./services/ServiceLocator";
import * as symbols from "./services/symbols";
import {AccessService} from "./services/AccessService";
import {AuthenticationService} from "./services/AuthenticationService";

// Main function to handle command-line arguments
const main = () => {

    // register services for CLI usage
    serviceLocator.register<ITokenStorage>(symbols.tokenStorage, new FileSystemTokenStorage());
    serviceLocator.register<AccessService>(symbols.accessService, new AccessService());
    serviceLocator.register<AuthenticationService>(symbols.authenticationService, new AuthenticationService());

    const args = process.argv.slice(2);
    const command = args.shift();

    switch (command) {
        case "init":
            initConfig();
            break;
        case "login":
            login();
            break;
        case "showProfile":
            showProfile();
            break
        default:
            console.log('Unknown command. Use "init" to initialize the configuration.');
    }
};

main();