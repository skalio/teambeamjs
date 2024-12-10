// src/teambeam.ts

import {initConfig} from './commands/init';
import {login} from "./commands/login";
import {showProfile} from "./commands/profile";

// Main function to handle command-line arguments
const main = () => {
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