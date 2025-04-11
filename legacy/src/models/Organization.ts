export interface Organization {
    uid: string;
    name: string;
    locale: string;
    timeZone: string;
    globalSignature: string;
    legalNoticeUrl: string;
    privacyPolicyUrl: string;
    hostname: string;
    mfaRequired: boolean;
}