const path = require('path');

const moduleName = 'vue-tsc';

const cwd = process.cwd();
const packageName = cwd.split('/').pop();

const getNpmPath = (version) => path.join(__dirname, `../vue-ts-checker-npm-modules/${packageName}/${version}`);

const getTypescriptPath = (version) => path.join(getNpmPath(version), 'node_modules/typescript');

module.exports = {
    moduleName,
    getNpmPath,
    getTypescriptPath,
}
