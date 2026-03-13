export { default } from 'next-auth/middleware';

// Protect the application routes by default, but exclude Next internals,
// API routes, auth pages, and static PWA assets so they can be accessed publicly.
export const config = {
    matcher: [
        // Protect everything except: _next/*, api/*, login, register, and static assets
        // Also exclude manifest.json and icon-*.png for PWA support
        '/((?!_next|api|login|register|favicon.ico|manifest.json|icon-.*\\.png).*)',
    ],
};
