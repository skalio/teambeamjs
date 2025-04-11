import {Profile} from "../../models";
import axios from "axios";
import {skalioIdClient} from "./skalioIdClient";

export const fetchProfile = (): Promise<Profile> => {
    try {
        return skalioIdClient.get<Profile>(`/profile`)
            .then((response) => response.data);
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