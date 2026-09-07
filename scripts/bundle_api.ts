import { build } from 'esbuild'

async function bundleApi() {
  await build({
    entryPoints: ['api/index.ts'],
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'esm',
    packages: 'external',
    outfile: 'api/index.js',
  })
  console.log('✓ Successfully bundled api/index.js for Vercel serverless functions')
}

bundleApi().catch((err) => {
  console.error('Failed to bundle API:', err)
  process.exit(1)
})
