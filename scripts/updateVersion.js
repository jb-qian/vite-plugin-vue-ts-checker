const { exec } = require('child_process');
const { npmPath, moduleName } = require('./const');

function installVersion(version) {
    return new Promise((resolve, reject) => {
        exec(`npm i ${moduleName}@${version}`, { shell: true, cwd: npmPath }, (err, data) => {
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
