// src/services/configService.ts

import fs from 'fs';
import path from 'path';

// Define the structure of the configuration
interface Config {
    discoveryUrl: string;
    email: string;
    password: string;
    totpSecret: string;
}

class ConfigService {
    private configPath: string;
    private config: Config | null = null;

    constructor() {
        // Get the user's home directory
        const homeDir = process.env.HOME || process.env.USERPROFILE; // Cross-platform compatibility
        this.configPath = path.join(homeDir || '', '.teambeam.conf.json');
        this.loadConfig();
    }

    // Initialize a new configuration file
    public initializeConfig(defaultConfig: Config): void {
        if (fs.existsSync(this.configPath)) {
            console.error('Configuration file already exists:', this.configPath);
            return;
        }

        try {
            fs.writeFileSync(this.configPath, JSON.stringify(defaultConfig, null, 2));
            console.log('Configuration file created successfully:', this.configPath);
            this.loadConfig(); // Load the newly created config
        } catch (error) {
            // Type assertion to handle the error as an instance of Error
            if (error instanceof Error) {
                console.error('Error creating configuration file:', error.message);
            } else {
                console.error('Error creating configuration file:', error);
            }
        }
    }

    // Getter for discoveryUrl
    public getDiscoveryUrl(): string {
        if (!this.config) {
            throw new Error("No Discovery URL");
        }
        return this.config.discoveryUrl;
    }

    // Getter for email
    public getEmail(): string | null {
        return this.config ? this.config.email : null;
    }

    // Getter for password
    public getPassword(): string | null {
        return this.config ? this.config.password : null;
    }

    // Getter for totpSecret
    public getTotpSecret(): string | null {
        return this.config ? this.config.totpSecret : null;
    }

    // Load the configuration file
    private loadConfig(): void {
        try {
            const data = fs.readFileSync(this.configPath, 'utf-8');
            this.config = JSON.parse(data);
        } catch (error) {
            // Type assertion to handle the error as an instance of Error
            if (error instanceof Error) {
                console.error('Error loading configuration file:', error.message);
            } else {
                console.error('Error loading configuration file:', error);
            }
            this.config = null; // Reset config if loading fails
        }
    }
}

export default new ConfigService(); // Export an instance of ConfigService