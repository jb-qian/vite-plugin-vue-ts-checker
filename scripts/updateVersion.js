const fs = require('fs-extra');
const { execSync } = require('child_process');
const { npmPath } = require('./const');

function installVolarVersion(version) {
    return execSync(`npm i @volar/vue-typescript@${version}`, { shell: true, cwd: npmPath });
}

module.exports = {
    installVolarVersion,
}
