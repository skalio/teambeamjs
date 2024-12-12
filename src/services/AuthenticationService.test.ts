import {TOTP} from "otpauth";

describe("AccessService", () => {
    it("Should calculate a TOTP key", () => {
        const secret = "WA7TRP7J3K4JSCIYG5POIYFZ22IEO4GP";

        let totp = new TOTP({secret: secret});

        const key = totp.generate();
        console.log("Key: ", key);
    })
})