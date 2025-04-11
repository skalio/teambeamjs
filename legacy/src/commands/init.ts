// src/commands/init.ts

import configService from '../services/ConfigService';
import {read} from "read";


// Function to initialize the configuration
export const initConfig = async () => {
    const defaultConfig = {
        discoveryUrl: await read({
            prompt: "Enter discovery url: ",
        }),
        email: await read({prompt: "Enter email address: "}),
        password: await read({
            prompt: "Enter password: ",
            silent: true,
            replace: '*'
        }),
        totpSecret: await read({prompt: "Enter totp secret: "}),
    };

    const confirmation = await read({prompt: "Save (y/N)? "});
    if (confirmation.toLocaleLowerCase() === "y") {
        configService.initializeConfig(defaultConfig);
    } else {
        console.log('Configuration not saved.');
    }
};