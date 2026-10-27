// Only emit fixed messages. PostgreSQL errors can contain connection credentials.
export function databaseErrorMessage(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined;
  const prefix = 'Cannot connect to PostgreSQL.';
  if (code === 'ENOTFOUND' || code === 'EAI_AGAIN') {
    return (
      prefix +
      ' Database hostname could not be resolved. Check the host; for Supabase on IPv4 networks, use the Session pooler connection string.'
    );
  }
  if (code === 'ENETUNREACH' || code === 'EHOSTUNREACH') {
    return (
      prefix +
      ' Database network is unreachable. Supabase Direct requires IPv6 unless IPv4 is enabled; try Session pooler.'
    );
  }
  if (code === '28P01') return prefix + ' Database username or password is incorrect.';
  if (code === '3D000') return prefix + ' Database name does not exist.';
  if (code === 'ECONNREFUSED')
    return prefix + ' Connection refused. Check the database status, host and port.';
  if (code === 'ETIMEDOUT')
    return prefix + ' Connection timed out. Check network access and database status.';
  if (typeof code === 'string' && /CERT|TLS|SSL/.test(code)) {
    return (
      prefix +
      ' TLS certificate validation failed. Check the provider TLS configuration; do not disable certificate verification.'
    );
  }
  return prefix + ' Check DATABASE_URL and database availability.';
}
