import { csrfProtection } from '../csrf.middleware';

// Locks D-5: double-submit-cookie CSRF guard.
const mockRes = () => {
    const res: any = {};
    res.statusCode = 200;
    res.status = (c: number) => { res.statusCode = c; return res; };
    res.json = (b: any) => { res.body = b; return res; };
    return res;
};

const run = (req: any) => {
    const res = mockRes();
    let nexted = false;
    csrfProtection(req as any, res as any, () => { nexted = true; });
    return { res, nexted };
};

describe('csrfProtection (D-5)', () => {
    it('lets safe methods (GET) through without a token', () => {
        const { nexted } = run({ method: 'GET', path: '/api/hr/employees', headers: {}, cookies: {} });
        expect(nexted).toBe(true);
    });

    it('exempts the login bootstrap endpoint', () => {
        const { nexted } = run({ method: 'POST', path: '/api/auth/login', originalUrl: '/api/auth/login', headers: {}, cookies: {} });
        expect(nexted).toBe(true);
    });

    it('rejects a cookie-auth POST with NO csrf header (403)', () => {
        const { res, nexted } = run({ method: 'POST', path: '/api/hr/master/tag', originalUrl: '/api/hr/master/tag', headers: {}, cookies: { csrf_token: 'abc' } });
        expect(nexted).toBe(false);
        expect(res.statusCode).toBe(403);
    });

    it('rejects when header does not match cookie (403)', () => {
        const { res, nexted } = run({ method: 'POST', path: '/api/hr/master/tag', originalUrl: '/api/hr/master/tag', headers: { 'x-csrf-token': 'WRONG' }, cookies: { csrf_token: 'abc' } });
        expect(nexted).toBe(false);
        expect(res.statusCode).toBe(403);
    });

    it('allows when header matches cookie (double-submit)', () => {
        const { nexted } = run({ method: 'POST', path: '/api/hr/master/tag', originalUrl: '/api/hr/master/tag', headers: { 'x-csrf-token': 'abc' }, cookies: { csrf_token: 'abc' } });
        expect(nexted).toBe(true);
    });

    it('exempts Bearer-authenticated requests (not forgeable cross-site)', () => {
        const { nexted } = run({ method: 'POST', path: '/api/hr/master/tag', originalUrl: '/api/hr/master/tag', headers: { authorization: 'Bearer xyz' }, cookies: {} });
        expect(nexted).toBe(true);
    });
});
