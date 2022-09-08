const fs = require('fs-extra');
const { exec } = require('child_process');
const { npmPath, moduleName, registry } = require('./const');

function installVersion(version) {
    return new Promise((resolve, reject) => {
        exec(`npm i ${moduleName}@${version} --registry ${registry}`, { shell: true, cwd: npmPath }, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

module.exports = {
    installVersion,
}
