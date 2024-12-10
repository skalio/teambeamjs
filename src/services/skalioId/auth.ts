import {DecodedJwt} from "../../models";
import axios, {AxiosRequestConfig} from "axios";

interface Token {
    token: string;
}

export const loginOperation = async (
    baseUrl: string,
    email: string,
    authenticatorType: string,
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
        console.log("Token", response.data.token);
        const decoded = new DecodedJwt(response.data.token);
        console.log("Token scope: ", decoded.getScope());
        return decoded;
    } catch (error) {
        // Handle error
        if (axios.isAxiosError(error)) {
            console.error('Error fetching user:', error.message);
        } else {
            console.error('Unexpected error:', error);
        }
        throw error; // Re-throw the error for further handling
    }
}
