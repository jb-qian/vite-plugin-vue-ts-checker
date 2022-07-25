const fs = require('fs-extra');
const { execSync } = require('child_process');
const { npmPath, moduleName, registry } = require('./const');

function installVersion(version) {
    return execSync(`npm i ${moduleName}@${version} --registry ${registry}`, { shell: true, cwd: npmPath });
}

module.exports = {
    installVersion,
}
