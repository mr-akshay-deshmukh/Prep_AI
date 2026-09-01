import * as esbuild from 'esbuild';

async function build() {
    await esbuild.build({
        entryPoints: ['server.ts'],
        bundle: true,
        platform: 'node',
        target: 'node20',
        outfile: 'dist/server.cjs',
        format: 'cjs',
        external: ['express', 'cors', 'dotenv', 'vite']
    });
}

build().catch(() => process.exit(1));
