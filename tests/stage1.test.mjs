import assert from 'node:assert';

// --- Extracted logic from WebExplorer.tsx (lines 19-68) ---

const VIRTUAL_FILES = {
  '/': ['mnt', 'data'],
  '/mnt': ['shell'],
  '/mnt/shell': ['readme.txt', 'contact.txt', 'terms.txt'],
  '/data': [],
  '/data/secrets': ['credentials.txt'],
};

function normalizePath(path) {
  if (!path) return '/';
  const absolutePath = path.startsWith('/') ? path : '/' + path;
  const segments = absolutePath.split('/').filter(s => s !== '' && s !== '.');
  const result = [];
  for (const segment of segments) {
    if (segment === '..') {
      if (result.length > 0) result.pop();
    } else {
      result.push(segment);
    }
  }
  return '/' + result.join('/');
}

function buildDisplayPath(currentPath, targetPath) {
  const relativePath = targetPath.startsWith('/') ? targetPath.slice(1) : targetPath;
  if (relativePath === '') return currentPath;
  return currentPath + '/' + relativePath;
}

function resolvePath(currentPath, targetPath) {
  return normalizePath(buildDisplayPath(currentPath, targetPath));
}

// Simulate cd: returns { newPath, error }
function simulateCd(currentPath, targetPath) {
  if (!targetPath || targetPath === '~') {
    return { newPath: '/mnt/shell', error: null };
  }
  const displayPath = buildDisplayPath(currentPath, targetPath);
  const resolvedPath = normalizePath(displayPath);
  if (VIRTUAL_FILES[resolvedPath] !== undefined) {
    return { newPath: displayPath, error: null };
  }
  return { newPath: null, error: `cd: ${displayPath}: No such file or directory` };
}

// Simulate ls: returns { output, isError }
function simulateLs(currentPath, targetArg) {
  const arg = targetArg || '.';
  const displayPath = buildDisplayPath(currentPath, arg);
  const resolvedPath = normalizePath(displayPath);
  const files = VIRTUAL_FILES[resolvedPath];
  if (files !== undefined) {
    return { output: files.length === 0 ? '' : files.join('  '), isError: false };
  }
  return { output: `ls: cannot access '${arg}': No such file or directory`, isError: true };
}

// --- Test harness ---

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  \u2713 ${name}`);
  } catch (e) {
    failed++;
    console.log(`  \u2717 ${name}`);
    console.log(`    ${e.message}`);
  }
}

// ========== normalizePath ==========
console.log('\nnormalizePath');

test('resolves . segments', () => {
  assert.strictEqual(normalizePath('/a/./b'), '/a/b');
});

test('resolves .. segments', () => {
  assert.strictEqual(normalizePath('/a/b/../c'), '/a/c');
});

test("can't go above root (/a/../../..)", () => {
  assert.strictEqual(normalizePath('/a/../../..'), '/');
});

test('empty input returns /', () => {
  assert.strictEqual(normalizePath(''), '/');
});

test('key traversal: /mnt/shell/../../data/secrets -> /data/secrets', () => {
  assert.strictEqual(normalizePath('/mnt/shell/../../data/secrets'), '/data/secrets');
});

test('multiple slashes collapsed', () => {
  assert.strictEqual(normalizePath('///a///b///'), '/a/b');
});

test('trailing slash ignored', () => {
  assert.strictEqual(normalizePath('/a/b/'), '/a/b');
});

test('just / returns /', () => {
  assert.strictEqual(normalizePath('/'), '/');
});

test('deep traversal past root: /../../../etc/passwd -> /etc/passwd', () => {
  assert.strictEqual(normalizePath('/../../../etc/passwd'), '/etc/passwd');
});

// ========== buildDisplayPath ==========
console.log('\nbuildDisplayPath');

test('absolute target becomes relative (prefixed)', () => {
  assert.strictEqual(buildDisplayPath('/mnt/shell', '/data/secrets'), '/mnt/shell/data/secrets');
});

test('.. preserved in output', () => {
  assert.strictEqual(buildDisplayPath('/mnt/shell', '../../data/secrets'), '/mnt/shell/../../data/secrets');
});

test('empty target returns current path', () => {
  assert.strictEqual(buildDisplayPath('/mnt/shell', ''), '/mnt/shell');
});

// ========== cd simulation (success cases) ==========
console.log('\ncd simulation (success)');

test('cd ../../data/secrets from /mnt/shell -> success, pwd preserved', () => {
  const r = simulateCd('/mnt/shell', '../../data/secrets');
  assert.strictEqual(r.error, null);
  assert.strictEqual(r.newPath, '/mnt/shell/../../data/secrets');
});

test('cd ../../data from /mnt/shell -> success', () => {
  const r = simulateCd('/mnt/shell', '../../data');
  assert.strictEqual(r.error, null);
  assert.strictEqual(r.newPath, '/mnt/shell/../../data');
});

test('cd ~ resets to /mnt/shell', () => {
  const r = simulateCd('/data/secrets', '~');
  assert.strictEqual(r.newPath, '/mnt/shell');
  assert.strictEqual(r.error, null);
});

test('cd with no arg resets to /mnt/shell', () => {
  const r = simulateCd('/data/secrets', undefined);
  assert.strictEqual(r.newPath, '/mnt/shell');
  assert.strictEqual(r.error, null);
});

test('cd .. from /mnt/shell -> success (resolves to /mnt)', () => {
  const r = simulateCd('/mnt/shell', '..');
  assert.strictEqual(r.error, null);
  assert.strictEqual(normalizePath(r.newPath), '/mnt');
});

test('multi-step: cd .. -> cd .. -> cd data -> cd secrets reaches /data/secrets', () => {
  let path = '/mnt/shell';

  let r = simulateCd(path, '..');
  assert.strictEqual(r.error, null);
  path = r.newPath;
  assert.strictEqual(normalizePath(path), '/mnt');

  r = simulateCd(path, '..');
  assert.strictEqual(r.error, null);
  path = r.newPath;
  assert.strictEqual(normalizePath(path), '/');

  r = simulateCd(path, 'data');
  assert.strictEqual(r.error, null);
  path = r.newPath;
  assert.strictEqual(normalizePath(path), '/data');

  r = simulateCd(path, 'secrets');
  assert.strictEqual(r.error, null);
  path = r.newPath;
  assert.strictEqual(normalizePath(path), '/data/secrets');
});

// ========== cd simulation (failure cases) ==========
console.log('\ncd simulation (failure)');

test('cd /data/secrets -> error (treated as relative)', () => {
  const r = simulateCd('/mnt/shell', '/data/secrets');
  assert.notStrictEqual(r.error, null);
  assert.ok(r.error.includes('/mnt/shell/data/secrets'), `Error should mention /mnt/shell/data/secrets, got: ${r.error}`);
});

test('cd /data -> error (treated as relative)', () => {
  const r = simulateCd('/mnt/shell', '/data');
  assert.notStrictEqual(r.error, null);
});

test('cd nonexistent -> error', () => {
  const r = simulateCd('/mnt/shell', 'nonexistent');
  assert.notStrictEqual(r.error, null);
});

test('error message uses display path not resolved path', () => {
  const r = simulateCd('/mnt/shell', '/data/secrets');
  assert.ok(r.error.includes('/mnt/shell/data/secrets'));
});

// ========== ls simulation ==========
console.log('\nls simulation');

test('ls at /data/secrets shows credentials.txt', () => {
  const path = '/mnt/shell/../../data/secrets';
  const r = simulateLs(path, '.');
  assert.strictEqual(r.isError, false);
  assert.strictEqual(r.output, 'credentials.txt');
});

test('ls ../../data/secrets from /mnt/shell shows credentials.txt', () => {
  const r = simulateLs('/mnt/shell', '../../data/secrets');
  assert.strictEqual(r.isError, false);
  assert.strictEqual(r.output, 'credentials.txt');
});

test('ls at /data shows empty (secrets not discoverable)', () => {
  const r = simulateLs('/mnt/shell/../../data', '.');
  assert.strictEqual(r.isError, false);
  assert.strictEqual(r.output, '');
});

test('ls ../../data from /mnt/shell shows empty', () => {
  const r = simulateLs('/mnt/shell', '../../data');
  assert.strictEqual(r.isError, false);
  assert.strictEqual(r.output, '');
});

// ========== Exploit path validation ==========
console.log('\nexploit path validation');

test('VIRTUAL_FILES[/data/secrets] contains credentials.txt', () => {
  assert.ok(VIRTUAL_FILES['/data/secrets'].includes('credentials.txt'));
});

test('VIRTUAL_FILES[/data] is empty array', () => {
  assert.deepStrictEqual(VIRTUAL_FILES['/data'], []);
});

test('cat passes raw filename to API (no path resolution)', () => {
  // cat ../../data/secrets/credentials.txt should NOT be resolved
  // It should be sent as-is to the API endpoint
  const catTarget = '../../data/secrets/credentials.txt';
  // Verify that resolvePath would change this (proving cat must bypass it)
  const resolved = resolvePath('/mnt/shell', catTarget);
  assert.strictEqual(resolved, '/data/secrets/credentials.txt');
  // The raw target differs from the resolved path - cat sends raw
  assert.notStrictEqual(catTarget, resolved);
});

// --- cat strips leading slash (all paths relative to /mnt/shell) ---

function stripLeadingSlash(path) {
  return path.startsWith('/') ? path.slice(1) : path;
}

test('cat strips leading / from absolute path', () => {
  assert.strictEqual(stripLeadingSlash('/data/secrets/credentials.txt'), 'data/secrets/credentials.txt');
});

test('cat preserves relative path (no leading /)', () => {
  assert.strictEqual(stripLeadingSlash('../../data/secrets/credentials.txt'), '../../data/secrets/credentials.txt');
});

test('absolute path after stripping / no longer bypasses WEB_ROOT', () => {
  // /data/secrets/credentials.txt → data/secrets/credentials.txt
  // On backend: os.path.join("/app/public", "data/secrets/credentials.txt")
  //           → /app/public/data/secrets/credentials.txt (file doesn't exist)
  const stripped = stripLeadingSlash('/data/secrets/credentials.txt');
  assert.ok(!stripped.startsWith('/'), 'Path must be relative after stripping');
});

test('relative traversal path is unchanged by strip', () => {
  const exploit = '../../data/secrets/credentials.txt';
  assert.strictEqual(stripLeadingSlash(exploit), exploit);
});

// ========== Summary ==========
console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
