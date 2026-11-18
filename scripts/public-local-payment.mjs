import { realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Only built output is changed. The local-development page and provider stay intact.
const redirect = `<!doctype html>
<html lang="es-CO"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Continúa con la prueba gratuita | Cripton</title>
<meta name="description" content="Inicia tu prueba gratis de 15 días, sin tarjeta. Para continuar después, elige un plan de pago." />
<meta name="robots" content="noindex, nofollow" />
<meta name="referrer" content="no-referrer" />
<meta http-equiv="refresh" content="0;url=/registro?plan=professional" />
</head><body><main><h1>Prueba gratis 15 días</h1>
<p>Sin tarjeta. Para continuar después, elige un plan de pago.</p>
<p><a href="/registro?plan=professional">Iniciar mi prueba gratis de 15 días</a></p>
</main></body></html>
`;

/** @returns {import('astro').AstroIntegration} */
export function publicLocalPayment() {
  return {
    name: 'cripton-public-local-payment',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        const output = await realpath(fileURLToPath(dir));
        const target = path.join(output, 'pago', 'demo', 'index.html');
        if (await realpath(target) !== target) throw Error('Unsafe local payment output');
        await writeFile(target, redirect, 'utf8');
      },
    },
  };
}
