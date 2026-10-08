import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

// The exported collection is the editable source of truth, not generated code.
const collection = JSON.parse(
  readFileSync(
    new URL('../../docs/postman_collection.json', import.meta.url),
    'utf8',
  ),
);
assert.equal(
  collection.info.schema,
  'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
);
assert(collection.item.length >= 1);
for (const item of collection.item) {
  assert(item.name && item.request.method && item.request.url);
  assert(item.event.some((event) => event.listen === 'test'));
}
console.log(
  `Postman collection: ${collection.item.length} requests validated.`,
);
