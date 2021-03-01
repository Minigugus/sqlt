import typescript from 'rollup-plugin-typescript2';

export default [
  {
    input: {
      'index.cjs': 'src/index.ts',
      'sqlite3': 'src/sqlite3.ts',
      'postgres': 'src/postgres.ts',
      // 'index-test': 'src/index.test.ts'
    },
    output: {
      exports: 'named',
      format: 'cjs',
      dir: 'dist'
    },
    plugins: [
      typescript()
    ]
  },
  {
    input: {
      'index.esm': 'src/index.ts',
      'sqlite3': 'src/sqlite3.ts',
      'postgres': 'src/postgres.ts',
      // 'index-test': 'src/index.test.ts'
    },
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
