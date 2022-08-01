const fs = require('fs-extra');
const compareVersions = require('compare-versions');
const createNpmPackage = require('./createNpmPackage');
const { npmPath, typescriptPath, moduleName } = require('./const');

// 简单写一个获取参数
const params = process.argv.slice(2).reduce((prev, current) => {
    const [key, value] = current.split('=');
    prev[key.replace(/^-+/, '')] = value ?? true;
    return prev;
}, {});

const {
    getLocalVersion,
    getOriginVersion,
} = require('./getVersion');

const {
    installVersion,
} = require('./updateVersion');

const resetEscapeSequence = '\u001b[0m';

console.log('');
console.log(`🔗\u001B[33m Checking ${moduleName} version ...${resetEscapeSequence}`);

const localVersion = getLocalVersion();
const originVersion = params.version || getOriginVersion();

function installSuccess() {
    console.log('');
    console.log(`✨\u001b[32m Installed ${moduleName}@${originVersion}${resetEscapeSequence}`);
}

function updateSuccess() {
    console.log('');
    console.log(`✨\u001b[32m Update version success ${moduleName}@${originVersion}${resetEscapeSequence}`);
}

function updateError() {
    console.log('');
    console.log(`🐛\u001b[91m Checking ${moduleName} version error${resetEscapeSequence}`);
}

function install() {
    console.log('');
    console.log(`🤖\u001b[36m Installing ${moduleName}@${originVersion} ...${resetEscapeSequence}`);
    try {
        fs.removeSync(npmPath);
    } catch (error) {}
    fs.mkdirSync(npmPath);
    createNpmPackage();
    installVersion(originVersion);
    try {
        // 删掉 后来安装依赖的 ts 目录，使用项目下的 ts
        fs.removeSync(typescriptPath);
    } catch (error) {}
}

if (!localVersion) {
    if (originVersion) {
        install();
        installSuccess();
    } else {
        updateError();
    }
} else {
    const code = compareVersions(originVersion || localVersion, localVersion);
    if (code === 1 || code === -1) { // 有不同的版本，可能是更新的，也可能是回退
        console.log('');
        console.log(`🔎\u001b[36m Find a new version ${moduleName}@${originVersion}${resetEscapeSequence}`);
        install();
        updateSuccess();
    } else { // 已经是最新版本
        console.log('');
        console.log(`✨\u001b[32m ${moduleName} version is the latest v${localVersion}${resetEscapeSequence}`);
    }
}
