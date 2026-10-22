#!/usr/bin/env node
/**
 * Manage CMS users in .env (git-ignored). Passwords are saved only as scrypt hashes.
 *
 *   npm run cms:user -- add lily@hellorobo.co      # asks for the password (also resets it)
 *   npm run cms:user -- remove lily@hellorobo.co
 *   npm run cms:user -- list
 *
 * Also creates CMS_SESSION_SECRET the first time. For production, copy CMS_USERS and
 * CMS_SESSION_SECRET from .env into the host's environment variables.
 */
import { randomBytes, scryptSync } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';

const ENV_FILE = new URL('../.env', import.meta.url);
const [command, emailArg] = process.argv.slice(2);

function readEnv() {
  return existsSync(ENV_FILE) ? readFileSync(ENV_FILE, 'utf8') : '';
}

function getVar(text, name) {
  const m = text.match(new RegExp(`^${name}='?(.*?)'?$`, 'm'));
  return m ? m[1] : undefined;
}

function setVar(text, name, value) {
  const line = `${name}='${value}'`;
  const re = new RegExp(`^${name}=.*$`, 'm');
  if (re.test(text)) return text.replace(re, () => line);
  return `${text}${text && !text.endsWith('\n') ? '\n' : ''}${line}\n`;
}

function hashPassword(password) {
  const salt = randomBytes(16);
  return `scrypt:${salt.toString('base64')}:${scryptSync(password, salt, 64).toString('base64')}`;
}

async function askPassword() {
  if (!process.stdin.isTTY) {
    // Piped in: printf '%s' 'secret' | npm run cms:user -- add someone@hellorobo.co
    let data = '';
    for await (const chunk of process.stdin) data += chunk;
    return data.replace(/\r?\n$/, '');
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  const question = 'Password: ';
  rl._writeToOutput = (s) => rl.output.write(s.startsWith(question) ? question : '');
  const answer = await new Promise((resolve) => rl.question(question, resolve));
  rl.close();
  process.stdout.write('\n');
  return answer;
}

let env = readEnv();
if (!getVar(env, 'CMS_SESSION_SECRET')) {
  env = setVar(env, 'CMS_SESSION_SECRET', randomBytes(32).toString('base64url'));
}
let users = JSON.parse(getVar(env, 'CMS_USERS') || '[]');

if (command === 'add') {
  const email = emailArg?.trim().toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+$/.test(email)) throw new Error('Usage: npm run cms:user -- add <email>');
  const password = await askPassword();
  if (password.length < 8) throw new Error('Use a password of at least 8 characters.');
  const existed = users.some((u) => u.email === email);
  users = users.filter((u) => u.email !== email).concat({ email, hash: hashPassword(password) });
  console.log(existed ? `Password reset for ${email}` : `Added ${email}`);
} else if (command === 'remove') {
  const email = emailArg?.trim().toLowerCase();
  const before = users.length;
  users = users.filter((u) => u.email !== email);
  console.log(users.length < before ? `Removed ${email}` : `No user ${email}`);
} else if (command === 'list') {
  console.log(users.length ? users.map((u) => u.email).join('\n') : 'No CMS users yet.');
} else {
  console.log('Usage: npm run cms:user -- add|remove <email>  |  npm run cms:user -- list');
  process.exit(1);
}

writeFileSync(ENV_FILE, setVar(env, 'CMS_USERS', JSON.stringify(users)));
