import helmet from 'helmet';
export function securityHeaders(environment: 'production' | 'development') {
  const production = environment === 'production';
  return helmet({
    strictTransportSecurity: production ? { maxAge: 31536000, includeSubDomains: true } : false,
    contentSecurityPolicy: {
      directives: { upgradeInsecureRequests: production ? [] : null },
    },
  });
}
