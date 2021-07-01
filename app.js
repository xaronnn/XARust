'use strict';
/*var cp = require('child_process');
var req = async module => {
    try {
        require.resolve(module);
    } catch (e) {
        console.log(`Could not resolve "${module}"\nInstalling`);
        cp.execSync(`npm install --prefix "${__dirname}" ${module}`);
        await setImmediate(() => {});
        console.log(`"${module}" has been installed`);
    }
    console.log(`Requiring "${module}"`);
    try {
        return require(module);
    } catch (e) {
        console.log(`Could not include "${module}". Restart the script`);
        process.exit(1);
    }
};
req('child_process')*/
require('./core/Init');