import {DecodedJwt} from "../../models";
import axios from "axios";
import jwt from "jsonwebtoken";

interface Token {
    token: string;
}

export const loginWithPassword = async (baseUrl: string, email: string, password: string): Promise<DecodedJwt> => {
    try {
        const response = await axios.post<Token>(
            baseUrl + "/auth/login",
            {"email": email, "type": "bcrypt", "key": password}
        );
        console.log("Token", response.data.token);
        const decoded = jwt.decode(response.data.token) as DecodedJwt;
        console.log("Token scope: ", decoded.scope);
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