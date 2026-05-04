export const env = {
  get feistelSecret() { return optional("FEISTEL_SECRET"); },
  get feistelRounds() { return optional("FEISTEL_ROUNDS"); },
  get domainBits() { return optional("DOMAIN_BITS"); },
  get codeBase() { return required("CODE_BASE"); },
  get codeLength() { return required("CODE_LENGTH"); },
  get databaseUrl() { return optional("DATABASE_URL"); },
  get analyticsQueueUrl() { return required("ANALYTICS_QUEUE_URL"); },
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
