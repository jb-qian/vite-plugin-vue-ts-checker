const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const { npmPath, moduleName, registry } = require('./const');

function stringToArray(str) {
    try {
        return JSON.parse(str);
    } catch (error) {
        return [];
    }
}

function getLocalVersion() {
    const package = path.join(npmPath, `node_modules/${moduleName}/package.json`);
    if (!fs.pathExistsSync(package)) {
        return;
    }
    const data = fs.readJSONSync(package);
    return data.version;
}

function getOriginVersion() {
    const data = execSync(`npm view ${moduleName} versions --json --registry ${registry}`, { shell: true });
    const array = stringToArray(data);
    const versions = Array.isArray(array) ? array.filter(Boolean) : [];
    const originVersion = versions[versions.length - 1];
    return originVersion;
}

module.exports = {
    getLocalVersion,
    getOriginVersion,
}
