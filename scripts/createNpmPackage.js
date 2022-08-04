const { exec } = require('child_process');
const { npmPath } = require('./const');

function createNpmPackage(version) {
    return new Promise((resolve, reject) => {
        exec(`cd ${npmPath} && npm init -y`, { shell: true }, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

module.exports = createNpmPackage;
