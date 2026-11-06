const target = String(process.argv[2] ?? 'this build').trim() || 'this build';
const message = `[android-only] ${target} is disabled in this fork; only Android phone builds are enabled.`;

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ ok: false, error: message }));
} else {
  console.error(message);
}

process.exit(1);
