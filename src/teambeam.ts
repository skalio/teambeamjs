// src/teambeam.ts

import readline from 'readline';
import configService from './services/configService';

// Create an interface for reading input from the command line
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

// Function to prompt the user for configuration values
const promptForConfig = (): Promise<any> => {
    return new Promise((resolve) => {
        const questions = [
            'Enter skalioIdBaseUrl: ',
            'Enter email: ',
            'Enter password: ',
            'Enter totpSecret: ',
        ];

        const answers: any = {};
        let index = 0;

        const askQuestion = () => {
            if (index < questions.length) {
                rl.question(questions[index], (answer) => {
                    answers[questions[index].trim()] = answer;
                    index++;
                    askQuestion();
                });
            } else {
                resolve(answers);
            }
        };

        askQuestion();
    });
};

// Function to initialize the configuration
const initConfig = async () => {
    const answers = await promptForConfig();
    
    // Confirm the values with the user
    console.log('\nPlease confirm the following values:');
    console.log(`skalioIdBaseUrl: ${answers['Enter skalioIdBaseUrl:']}`);
    console.log(`email: ${answers['Enter email:']}`);
    console.log(`password: ${answers['Enter password:']}`);
    console.log(`totpSecret: ${answers['Enter totpSecret:']}`);

    rl.question('\nDo you want to save this configuration? (yes/no): ', (confirmation) => {
        if (confirmation.toLowerCase() === 'yes') {
            const defaultConfig = {
                skalioIdBaseUrl: answers['Enter skalioIdBaseUrl:'],
                email: answers['Enter email:'],
                password: answers['Enter password:'],
                totpSecret: answers['Enter totpSecret:'],
            };

            configService.initializeConfig(defaultConfig);
        } else {
            console.log('Configuration not saved.');
        }
        rl.close();
    });
};

// Main function to handle command-line arguments
const main = () => {
    const args = process.argv.slice(2);
    if (args[0] === 'init') {
        initConfig();
    } else {
        console.log('Unknown command. Use "init" to initialize the configuration.');
        rl.close();
    }
};

main();