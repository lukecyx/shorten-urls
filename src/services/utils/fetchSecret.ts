import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";

export async function fetchSecret(secretId: string) {
  const client = new SecretsManagerClient({});
  const secret = await client.send(
    new GetSecretValueCommand({
      SecretId: secretId,
    }),
  );

  if (!secret.SecretString) {
    throw new Error(`Failed to fetch secret with id: ${secretId}`);
  }

  return secret.SecretString;
}
