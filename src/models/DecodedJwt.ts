export class DecodedJwt {
    iss: string;
    aud: string;
    sub: string;
    exp: number;
    iat: number | null;
    scope: string;
    private customClaims: { [key: string]: any };

    constructor(iss: string, aud: string, sub: string, exp: number, iat: number | null, scope: string, customClaims: any) {
        this.iss = iss;
        this.aud = aud;
        this.sub = sub;
        this.exp = exp;
        this.iat = iat;
        this.scope = scope;
        this.customClaims = customClaims;
    }

    public isValid(): boolean {
        const currentTime = Math.floor(Date.now() / 1000);
        return currentTime <= this.exp;
    }

    public isMfaToken(): boolean {
        return "mfa" == this.scope;
    }

    public isIdToken(): boolean {
        return "idtoken" == this.scope;
    }

    public isAccessToken(): boolean {
        return "access" == this.scope;
    }

    public getAuthenticators(): string[] {
        return this.customClaims["http://skalio.com/authenticators"] ? this.customClaims["http://skalio.com/authenticators"].auth : [];
    }
}