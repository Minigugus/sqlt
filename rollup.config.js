import typescript from 'rollup-plugin-typescript2';

const input = {
  'index': 'src/index.ts',
  'drivers': 'src/drivers/index.ts',
  'null': 'src/drivers/null.ts',
  'sqlite3': 'src/drivers/sqlite3.ts',
  'postgres': 'src/drivers/postgres.ts',
}

const config = [
  {
    input,
    output: {
      chunkFileNames: '[name].mjs',
      entryFileNames: '[name].mjs',
      format: 'esm',
      dir: 'dist'
    },
    plugins: [
      typescript()
    ]
  }
];

if (process.env.MODE === 'production')
  config.unshift({
    input,
    output: {
      exports: 'named',
      format: 'cjs',
      dir: 'dist'
    },
    plugins: [
      typescript()
    ]
  });

export default config;
