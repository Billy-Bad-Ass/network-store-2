import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import nextConfig from '../next.config.mjs';

/**
 * The license page moved, and receipts did not.
 *
 * It lived at `/licence` until the British spelling was corrected. Every
 * receipt issued before that links to the old path, and a receipt is read
 * months later — usually at the moment somebody wants a refund, which is the
 * very thing that page explains. So the redirect is not tidiness: without it
 * the terms a customer agreed to at checkout 404.
 *
 * Tested against next.config.mjs rather than a running server because that is
 * the file somebody tidying up would delete the rule from.
 */

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('the page lives at /license, spelled the American way', () => {
  assert.ok(existsSync(join(root, 'app', 'license', 'page.tsx')), 'app/license/page.tsx is missing');
  assert.ok(!existsSync(join(root, 'app', 'licence')), 'app/licence still exists — two pages, one of them stale');
});

test('the old /licence link still lands on it, permanently', async () => {
  const redirects = await nextConfig.redirects();
  const rule = redirects.find((r) => r.source === '/licence');

  assert.ok(rule, 'nothing redirects /licence — every receipt issued so far points there');
  assert.equal(rule.destination, '/license');
  assert.equal(rule.permanent, true);
});

test('the header and footer point at the new path', () => {
  for (const file of ['app/components/Header.tsx', 'app/components/Footer.tsx']) {
    const source = readFileSync(join(root, file), 'utf8');
    assert.ok(source.includes('href="/license"'), `${file} does not link to /license`);
    assert.ok(!source.includes('href="/licence"'), `${file} still links to the old path`);
  }
});
