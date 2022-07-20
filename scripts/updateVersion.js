const fs = require('fs-extra');
const { execSync } = require('child_process');
const { npmPath } = require('./const');

function installVolarVersion(version) {
    return execSync(`cd ${npmPath} && npm i -D @volar/vue-typescript@${version}`, { shell: true });
}

module.exports = {
    installVolarVersion,
}
