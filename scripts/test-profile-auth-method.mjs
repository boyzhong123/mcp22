import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const helperPath = new URL('../src/app/dev-en/_lib/profile-auth-method.ts', import.meta.url);
const helperSource = readFileSync(helperPath, 'utf8');
const compiled = ts.transpileModule(helperSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const helperModule = { exports: {} };

vm.runInNewContext(
  `(function (exports, module) { ${compiled}\n})(module.exports, module);`,
  { module: helperModule, exports: helperModule.exports },
);

const { authMethodLabel, isEmailAuthMethod } = helperModule.exports;
const t = (_en, zh) => zh;

assert.equal(isEmailAuthMethod('email'), true);
assert.equal(isEmailAuthMethod('google'), false);
assert.equal(isEmailAuthMethod(undefined), false);
assert.equal(authMethodLabel('email', t), '邮箱登录');
assert.equal(authMethodLabel('google', t), '第三方登录');
assert.equal(authMethodLabel(undefined, t), '第三方登录');

const mockAuthSource = readFileSync(
  new URL('../src/app/dev-en/_lib/mock-auth.tsx', import.meta.url),
  'utf8',
);
assert.match(mockAuthSource, /method:\s*real\.user\.method\s*\?\?\s*''/);

const profileSource = readFileSync(
  new URL('../src/app/dev-en/dashboard/profile/page.tsx', import.meta.url),
  'utf8',
);
assert.match(profileSource, /isEmailAuthMethod\(user\?\.method\)\s*&&\s*<ChangePasswordCard\s*\/>/);

console.log('profile auth method checks passed');
