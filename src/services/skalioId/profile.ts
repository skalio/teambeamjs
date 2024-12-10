import {Profile} from "../../models";
import axios, {AxiosRequestConfig} from "axios";

export const fetchProfile = async (
    baseUrl: string,
    accessToken: string
): Promise<Profile> => {
    try {
        // Create the Axios request configuration
        const config: AxiosRequestConfig = {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        };
        const response = await axios.get<Profile>(
            baseUrl + "/profile",
            config
        );

        return response.data;
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