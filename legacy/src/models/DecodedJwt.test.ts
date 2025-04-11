// src/models/DecodedJwt.test.ts

import {DecodedJwt} from './DecodedJwt';

describe('DecodedJwt', () => {
    it('should decode a valid MFA token', () => {
        const token = 'eyJraWQiOiJwY3JndXBtbGhzdTZ5Y2MtIiwiYWxnIjoiRVMyNTYiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwOi8vc2thbGlvLmNvbSIsImF1ZCI6Imh0dHA6Ly9za2FsaW8uY29tL2lkIiwic3ViIjoiX2NfanMxOGNqMTVkNXQxayIsImV4cCI6MTczMzgyNzI2MywibG9jYWxlIjoiZGUtREUiLCJzY29wZSI6Im1mYSIsImh0dHA6Ly9za2FsaW8uY29tL2F1dGhlbnRpY2F0b3JzIjpbInRvdHAiLCJyZWNvdmVyeSJdfQ.PlObDQ4wHQHTjZ2csnlB87ccIbRqrqWv-a0pybPjyBQsZ9FusCCtNcYzJagwbL6IZyFgSYWsuoiWZ0O1HObVZw'; // Replace with a valid JWT for testing
        const decodedJwt = new DecodedJwt(token);

        expect(decodedJwt.getSubject()).toBe('_c_js18cj15d5t1k');
        expect(decodedJwt.getScope()).toBe('mfa');
        expect(decodedJwt.isMfaToken()).toBe(true);
        expect(decodedJwt.isAccessToken()).toBe(false);
        expect(decodedJwt.isIdToken()).toBe(false);
        expect(decodedJwt.getAuthenticators()).toContain('totp');
    });

    it('should throw an error for an invalid JWT', () => {
        const invalidToken = 'invalid.jwt.token'; // An invalid JWT for testing

        expect(() => {
            new DecodedJwt(invalidToken);
        }).toThrowError('Invalid token');
    });
});