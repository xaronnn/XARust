'use strict';
try {
    const config = require('../config.json');
    const XARust = require('./XARust.js');
    new XARust(config, config.dev);
} catch(e) {
    console.log("Compile fail");
}