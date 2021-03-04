// Isomorphic code for running the same test suite with `sql.js` in the browser and Node.JS
// (exports a promise since top-level-await is not ready yet)

export default typeof process === 'object'
  // Node.JS
  ? import('sql.js').then(({ default: initSqlJs }) => initSqlJs())
  // Browser
  : fetch('https://sql.js.org/dist/sql-wasm.js')
    .then(r => r.text())
    .then(src => {
      let initSqlJs, initSqlJsPromise, module;
      eval(src.replace(/(?:.|\n)+var initSqlJs = function/, 'initSqlJs = function'));
      return initSqlJs;
    })
    .then(initSqlJs => initSqlJs({
      locateFile: file => `https://sql.js.org/dist/${file}`
    }));
