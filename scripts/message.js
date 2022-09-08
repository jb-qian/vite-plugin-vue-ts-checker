const chalk = require('chalk');
const { moduleName } = require('./const');

function installing(spinner, version) {
    spinner.text = `Installing ${moduleName}@${version}...`;
}

function findNewVersion(spinner, version) {
    spinner.text = `Find a new version and start the installation @${version}`;
}

function installSuccess(spinner, version) {
    spinner.succeed(`Install ${moduleName}@${version} success`);
}

function updateSuccess(spinner, version) {
    spinner.succeed(`Update ${moduleName}@${version} success`);
}

function isLasest(spinner, version) {
    spinner.succeed(`${moduleName[0].toUpperCase() + moduleName.slice(1)} version is the latest @${version}`);
}

function updateError(spinner) {
    spinner.fail(chalk.red(`Failed to check ${moduleName} version`));
}

module.exports = {
    installing,
    installSuccess,
    isLasest,
    updateSuccess,
    updateError,
    findNewVersion,
}
