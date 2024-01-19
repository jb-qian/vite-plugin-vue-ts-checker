const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const { getNpmPath, moduleName } = require('./const');

function stringToArray(str) {
    try {
        return JSON.parse(str);
    } catch (error) {
        return [];
    }
}

function getLocalVersion(version) {
    return new Promise((resolve) => {
        const package = path.join(getNpmPath(version), `node_modules/${moduleName}/package.json`);
        if (!fs.pathExistsSync(package)) {
            resolve(undefined);
            return;
        }
        return fs.readJSON(package).then((data) => resolve(data.version));
    });
}

function getOriginVersion(lockVersion) {
    return new Promise((resolve, reject) => {
        if (lockVersion) {
            return resolve(lockVersion);
        }
        exec(`npm view ${moduleName} versions --json`, { shell: true }, (err, data) => {
            if (err) {
                reject(err);
            } else {
                const array = stringToArray(data);
                const versions = Array.isArray(array) ? array.filter(Boolean) : [];
                const originVersion = versions[versions.length - 1];
                resolve(originVersion);
            }
        });
    });
}

module.exports = {
    getLocalVersion,
    getOriginVersion,
}
