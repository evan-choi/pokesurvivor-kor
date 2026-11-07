import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

test('Windows LAN CIDR validation and firewall rule scope', { skip: process.platform !== 'win32' }, () => {
  execFileSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File',
    fileURLToPath(new URL('./windows-lan.test.ps1', import.meta.url))], { stdio: 'pipe' });
});
