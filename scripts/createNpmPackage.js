const { exec } = require('child_process');
const { getNpmPath } = require('./const');

function createNpmPackage(version) {
    return new Promise((resolve, reject) => {
        exec(`cd ${getNpmPath(version)} && npm init -y`, { shell: true }, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

module.exports = createNpmPackage;
