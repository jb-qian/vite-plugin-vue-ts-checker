const fs = require('fs-extra');
const compareVersions = require('compare-versions');
const createNpmPackage = require('./createNpmPackage');
const { npmPath } = require('./const');

// 简单写一个获取参数
const params = process.argv.slice(2).reduce((prev, current) => {
    const [key, value] = current.split('=');
    prev[key.replace(/^-+/, '')] = value ?? true;
    return prev;
}, {});

const {
    getLocalVolarTypescriptVersion,
    getOriginVolarTypescriptVersion,
} = require('./getVersion');

const {
    installVolarVersion,
} = require('./updateVersion');

const resetEscapeSequence = '\u001b[0m';

console.log('');
console.log(`🔗\u001B[33m Checking volar version...${resetEscapeSequence}`);

const localVolarTypescriptVersion = getLocalVolarTypescriptVersion();
const originVolarTypescriptVersion = params.version || getOriginVolarTypescriptVersion();

function installSuccess() {
    console.log('');
    console.log(`✨\u001b[32m Installed @volar/vue-typescript@${originVolarTypescriptVersion}${resetEscapeSequence}`);
}

function updateSuccess() {
    console.log('');
    console.log(`✨\u001b[32m Update version success @volar/vue-typescript@${originVolarTypescriptVersion}${resetEscapeSequence}`);
}

function updateError() {
    console.log('');
    console.log(`🐛\u001b[91m Checking volar version error${resetEscapeSequence}`);
}

function install() {
    console.log('');
    console.log(`🤖\u001b[36m Installing @volar/vue-typescript@${originVolarTypescriptVersion}${resetEscapeSequence}`);
    try {
        fs.removeSync(npmPath);
    } catch (error) {}
    fs.mkdirSync(npmPath);
    createNpmPackage();
    installVolarVersion(originVolarTypescriptVersion);
}

if (!localVolarTypescriptVersion) {
    if (originVolarTypescriptVersion) {
        install();
        installSuccess();
    } else {
        updateError();
    }
} else {
    const code = compareVersions(originVolarTypescriptVersion || localVolarTypescriptVersion, localVolarTypescriptVersion);
    if (code === 1 || code === -1) { // 有不同的版本，可能是更新的，也可能是回退
        console.log('');
        console.log(`🔎\u001b[36m Find a new version @${originVolarTypescriptVersion}${resetEscapeSequence}`);
        install();
        updateSuccess();
    } else { // 已经是最新版本
        console.log('');
        console.log(`✨\u001b[32m Volar is the latest version @${localVolarTypescriptVersion}${resetEscapeSequence}`);
    }
}
