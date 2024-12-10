export interface Email {
    address: string;
    primary: boolean;
    verified: boolean;
    removeAt: Date | null;
}