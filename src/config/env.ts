export const env = {
  feistelSecret: optional("FEISTEL_SECRET"),
  feistelRounds: optional("FEISTEL_ROUNDS"),
  domainBits: optional("DOMAIN_BITS"),
  codeBase: required("CODE_BASE"),
  codeLength: required("CODE_LENGTH"),
  databaseUrl: optional("DATABASE_URL"),
};

function required(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }

  return value;
}

function optional(name: string): string | undefined {
  return process.env[name];
}
