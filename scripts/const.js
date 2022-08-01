const path = require('path');

const npmPath = path.join(__dirname, '../vue-ts-checker-npm-modules');

const typescriptPath = path.join(__dirname, '../vue-ts-checker-npm-modules/node_modules/typescript');

const moduleName = 'vue-tsc';

const registry = 'https://registry.npmjs.org';

module.exports = {
    npmPath,
    typescriptPath,
    moduleName,
    registry,
}
