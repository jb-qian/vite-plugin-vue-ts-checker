const path = require('path');

const npmPath = path.join(__dirname, '../vue-ts-checker-npm-modules');

const moduleName = 'vue-tsc';

const registry = 'https://registry.npmjs.org';

module.exports = {
    npmPath,
    moduleName,
    registry,
}
