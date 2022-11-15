const path = require('path');

const npmPath = path.join(__dirname, '../vue-ts-checker-npm-modules');

const typescriptPath = path.join(npmPath, 'node_modules/typescript');

const moduleName = 'vue-tsc';

module.exports = {
    npmPath,
    typescriptPath,
    moduleName,
}
