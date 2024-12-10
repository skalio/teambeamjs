import {Email} from "./Email";
import {Organization} from "./Organization";

export interface Profile {
    name: string;
    locale: string;
    timeZone: string;
    uid: string;
    hasAvatar: boolean;
    createdAt: Date;
    lastLoginAt: Date;
    emails: Email[];
    membership: Membership | null;
}

export interface Membership {
    organization: Organization;
    roles: string[];
}