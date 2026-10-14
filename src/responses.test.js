import test from 'node:test';
import assert from 'node:assert/strict';
import { responses, endOfScript, getNextResponse, getVisibleText } from './responses.js';

test('replies follow the exact configured order', () => {
  responses.forEach((response, index) => {
    assert.equal(getNextResponse(index), response);
  });
  assert.equal(getNextResponse(0), responses[0]);
});

test('exhausted scripts have an explicit fallback', () => {
  assert.equal(getNextResponse(responses.length), endOfScript);
  assert.equal(getNextResponse(responses.length + 1), endOfScript);
});

test('typing reveals characters progressively and stops at the full text', () => {
  assert.equal(getVisibleText('answer 1', 0), '');
  assert.equal(getVisibleText('answer 1', 100, 30), 'ans');
  assert.equal(getVisibleText('answer 1', 10000), 'answer 1');
  assert.equal(getVisibleText('answer 1', -100), '');
  assert.equal(getVisibleText('\u{1F44B} hello', 100, 10), '\u{1F44B}');
});