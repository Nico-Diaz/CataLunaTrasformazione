/**
 * Astro 7 procesa Markdown con `satteri`, que trae un binario nativo (.node).
 * En algunos Windows el Control de aplicaciones (Smart App Control / WDAC) bloquea
 * ese binario sin firmar. Este script instala la versión WebAssembly equivalente,
 * que satteri usa automáticamente como respaldo. En cualquier otro caso no hace nada.
 */
import { execFileSync, execSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const destino = join('node_modules', '@bruits', 'satteri-wasm32-wasi');

if (process.platform !== 'win32' || existsSync(join(destino, 'package.json'))) process.exit(0);

// satteri no exporta su package.json: se lee directo desde node_modules.
const satteriPkg = join('node_modules', 'satteri', 'package.json');
if (!existsSync(satteriPkg)) process.exit(0);

try {
  require(`@bruits/satteri-win32-${process.arch}-msvc`);
  process.exit(0); // el binario nativo carga: no hace falta respaldo
} catch {
  // bloqueado o ausente: seguimos con WASI
}

const { version } = JSON.parse(readFileSync(satteriPkg, 'utf8'));
const tmp = mkdtempSync(join(tmpdir(), 'satteri-wasi-'));

try {
  execSync(`npm pack @bruits/satteri-wasm32-wasi@${version} --silent`, {
    cwd: tmp,
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  const tgz = readdirSync(tmp).find((f) => f.endsWith('.tgz'));
  if (!tgz) throw new Error('npm pack no generó el paquete');
  mkdirSync(destino, { recursive: true });
  // Se extrae con rutas relativas: el tar de Git interpreta "C:" como un host remoto.
  copyFileSync(join(tmp, tgz), join(destino, 'pkg.tgz'));
  execFileSync('tar', ['-xzf', 'pkg.tgz', '--strip-components=1'], { cwd: destino, stdio: 'inherit' });
  rmSync(join(destino, 'pkg.tgz'));
  console.log(`[satteri] binario nativo bloqueado por Windows: se instaló el respaldo WASI ${version}.`);
} catch (err) {
  console.warn('[satteri] no se pudo instalar el respaldo WASI:', err instanceof Error ? err.message : err);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
