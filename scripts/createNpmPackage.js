const { execSync } = require('child_process');
const { npmPath } = require('./const');

function createNpmPackage(version) {
    return execSync(`cd ${npmPath} && npm init -y`, { shell: true });
}

module.exports = createNpmPackage;
