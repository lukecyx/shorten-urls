export function generateSnowflakeId(nodeId: number = 1): bigint {
  const timestamp = BigInt(Date.now());
  const sequenceSpace = 4096;
  const sequence = BigInt(Math.floor(Math.random() * sequenceSpace));
  // |      timestamp (ms)      | nodeId (10 bits) | sequence (12 bits) |
  // |<------ variable ------->|<---- 22 bits --->|
  //
  return (timestamp << 22n) | (BigInt(nodeId) << 12n) | sequence;
}
