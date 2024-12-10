import {DecodedJwt} from "../../models";
import axios, {AxiosRequestConfig} from "axios";

interface Token {
    token: string;
}

export enum AuthenticatorType {
    bcrypt = "bcrypt",
    totp = "totp",
    recovery = "recovery",
}

export const resolveAuthenticatorType: { [key: string]: AuthenticatorType } = {
    "bcrypt": AuthenticatorType.bcrypt,
    "totp": AuthenticatorType.totp,
    "recovery": AuthenticatorType.recovery,
}

export const authenticate = async (
    baseUrl: string,
    email: string,
    authenticatorType: AuthenticatorType,
    key: string,
    token: string | null
): Promise<DecodedJwt> => {
    const payload = {
        "email": email,
        "type": authenticatorType,
        "key": key
    };
    // Create the Axios request configuration
    const config: AxiosRequestConfig = {
        headers: {}
    };
    // Conditionally set the Authorization header if the token is provided
    if (token) {
        // @ts-ignore
        config.headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await axios.post<Token>(
            baseUrl + "/auth/login",
            payload,
            config
        );
        const decoded = new DecodedJwt(response.data.token);
        return decoded;
    } catch (error) {
        // Handle error
        if (axios.isAxiosError(error)) {
            console.error('Error:', error.message);
        } else {
            console.error('Unexpected error:', error);
        }
        throw error; // Re-throw the error for further handling
    }
}

export const getAccessToken = async (
    baseUrl: string,
    idToken: string
): Promise<DecodedJwt> => {
    // Create the Axios request configuration
    const config: AxiosRequestConfig = {
        headers: {
            Authorization: `Bearer ${idToken}`
        }
    };

    try {
        const response = await axios.post<Token>(
            baseUrl + "/auth/access",
            null,
            config
        );
        const decoded = new DecodedJwt(response.data.token);
        return decoded;
    } catch (error) {
        // Handle error
        if (axios.isAxiosError(error)) {
            console.error('Error:', error.message);
        } else {
            console.error('Unexpected error:', error);
        }
        throw error; // Re-throw the error for further handling
    }
}
