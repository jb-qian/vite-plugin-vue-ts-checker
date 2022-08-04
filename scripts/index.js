const fs = require('fs-extra');
const compareVersions = require('compare-versions');
const ora = require('ora');
const chalk = require('chalk');

const createNpmPackage = require('./createNpmPackage');
const { npmPath, typescriptPath, moduleName } = require('./const');
const {
    installing,
    installSuccess,
    updateSuccess,
    isLasest,
    updateError,
    findNewVersion,
} = require('./message');

// 简单写一个获取参数
const params = process.argv.slice(2).reduce((prev, current) => {
    const [key, value] = current.split('=');
    prev[key.replace(/^-+/, '')] = value ?? true;
    return prev;
}, {});

console.log('');
const spinner = ora(`Checking ${moduleName} version...`).start();

const {
    getLocalVersion,
    getOriginVersion,
} = require('./getVersion');

const {
    installVersion,
} = require('./updateVersion');

Promise.all([
    getLocalVersion(),
    getOriginVersion(params.version),
]).then(([localVersion, originVersion]) => {
    spinner.clear();
    // 没有远程版本，直接跳出
    if (!originVersion) {
        return updateError(spinner);
    }
    // 没有本地版本，直接安装最新版本（也可能是参数传入的版本）
    if (!localVersion) {
        // 安装新版本
        installing(spinner, originVersion);
        return install(originVersion).then(() => {
            spinner.clear();
            return installSuccess(spinner, originVersion);
        });
    }
    // 检查版本更新
    const code = compareVersions(originVersion, localVersion);
    if (code === 1 || code === -1) { // 有不同的版本，可能是更新的，也可能是回退
        // 找到新版本，开始更新
        findNewVersion(spinner, originVersion);
        return install(originVersion).then(() => {
            spinner.clear();
            return updateSuccess(spinner, originVersion);
        });
    } else { // 已经是最新版本
        isLasest(spinner, originVersion);
    }
}).catch(err => {
    throw new Error(chalk.red(err));
});

function install(version) {
    return fs.remove(npmPath).finally(() => {
        return fs.mkdir(npmPath);
    }).then(() => {
        return createNpmPackage();
    }).then(() => {
        return installVersion(version);
    }).then(() => {
        // 删掉 后来安装依赖的 ts 目录，使用项目下的 ts
        return fs.remove(typescriptPath);
    });
}
