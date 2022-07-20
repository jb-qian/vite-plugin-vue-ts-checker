const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

const { npmPath } = require('./const');

function stringToArray(str) {
    try {
        return JSON.parse(str);
    } catch (error) {
        return [];
    }
}

function getLocalVolarTypescriptVersion() {
    const package = path.join(npmPath, 'node_modules/@volar/vue-typescript/package.json');
    if (!fs.pathExistsSync(package)) {
        return;
    }
    const data = fs.readJSONSync(package);
    return data.version;
}

function getOriginVolarTypescriptVersion() {
    const data = execSync('npm view @volar/vue-typescript versions --json --registry https://registry.npmjs.org', { shell: true });
    const array = stringToArray(data);
    const versions = Array.isArray(array) ? array.filter(Boolean) : [];
    const originVersion = versions[versions.length - 1];
    return originVersion;
}

module.exports = {
    getLocalVolarTypescriptVersion,
    getOriginVolarTypescriptVersion,
}
