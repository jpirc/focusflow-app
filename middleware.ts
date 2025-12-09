export { default } from 'next-auth/middleware';

// Protect the application routes by default, but exclude Next internals,
// API routes, and the auth pages so users can sign in / register.
export const config = {
    matcher: [
        // Protect everything except: _next/*, api/*, login, register, and static assets
        '/((?!_next|api|login|register|favicon.ico).*)',
    ],
};
