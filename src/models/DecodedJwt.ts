import jwt, {JwtPayload} from "jsonwebtoken";

export class DecodedJwt {
    readonly token: string;
    private readonly payload: JwtPayload;

    // constructor(iss: string, aud: string, sub: string, exp: number, iat: number | null, scope: string, customClaims: any) {
    constructor(token: string) {
        this.token = token;

        const payload = jwt.decode(token);
        if (!payload) {
            throw new Error("Invalid token");
        }
        this.payload = payload as JwtPayload;
    }

    public getSubject(): string {
        return <string>this.payload.sub;
    }

    public isValid(): boolean {
        const currentTime = Math.floor(Date.now() / 1000);
        // @ts-ignore
        return currentTime <= this.payload.exp;
    }

    public getScope(): string {
        return this.payload['scope'];
    }

    public isMfaToken(): boolean {
        return "mfa" === this.getScope();
    }

    public isIdToken(): boolean {
        return "idtoken" == this.getScope();
    }

    public isAccessToken(): boolean {
        return "access" == this.getScope();
    }

    public getAuthenticators(): string[] {
        return this.payload["http://skalio.com/authenticators"] ?
            this.payload["http://skalio.com/authenticators"] : [];
    }
}