import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Response } from 'supertest';

const outputDirectory = resolve('../docs/test-evidence');
const outputFile = resolve(outputDirectory, 'api-results.json');
export const evidence: unknown[] = [];

export function resetEvidence() {
  mkdirSync(outputDirectory, { recursive: true });
  writeFileSync(outputFile, '[]\n');
}

export function record(
  name: string,
  method: string,
  url: string,
  response: Response,
  payload: unknown = {},
) {
  evidence.push({
    name,
    method,
    url,
    request: payload,
    status: response.status,
    response: response.body,
  });
}

export function saveEvidence(databaseVersion: string) {
  // Global setup resets once per run; sequential files append without overwriting.
  const previous: unknown[] = JSON.parse(readFileSync(outputFile, 'utf8'));
  if (previous.length === 0) {
    previous.push({ databaseVersion, testedAt: new Date().toISOString() });
  }
  writeFileSync(
    outputFile,
    JSON.stringify([...previous, ...evidence], null, 2),
  );
}
