export const env = {
  feistelSecret: required("FEISTEL_SECRET"),
  feistelRounds: required("FEISTEL_ROUNDS"),
  domainBits: required("DOMAIN_BITS"),
  codeBase: required("CODE_BASE"),
  codeLength: required("CODE_LENGTH"),
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
