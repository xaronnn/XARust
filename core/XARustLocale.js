'use strict';
class XARustLocale {
    #version = "0.2";
    constructor(locale = 'en') {
        try {
            global.chalk = require('chalk');
            global.moment = require('moment');
            global.i18n = require('i18n');
            global.path = require('path');
            global.fs = require('fs');

            this.log('[CORE][LOCALE] Locale reading', 'info');
            i18n.configure({
                locales: this.fetchLocales(),
                directory: path.join(__dirname+"/../", 'locales'),
                register: global,
                defaultLocale: 'en',
                retryInDefaultLocale: false,
                autoReload: true,
                syncFiles: true,
                extension: '.json',
                api: {
                    '__': 'translate',
                    '__n': 'translateN'
                },
                logDebugFn: function (msg) {
                    chalk.magentaBright("["+moment().format('YYYY-MM-DD HH:mm:ss')+"][DEBUG][CORE][LOCALE] "+msg)
                },
                logWarnFn: function (msg) {
                    chalk.red("["+moment().format('YYYY-MM-DD HH:mm:ss')+"][WARN][CORE][LOCALE] "+msg)
                },
                logErrorFn: function (msg) {
                    chalk.red("["+moment().format('YYYY-MM-DD HH:mm:ss')+"][ERROR][CORE][LOCALE] "+msg)
                },
                missingKeyFn: function (locale, value) {
                    return value
                },
                mustacheConfig: {
                    tags: ['{{', '}}'],
                    disable: false
                }
            });
            i18n.setLocale(locale);
            this.i18n = i18n;
            this.log('[CORE][LOCALE] Locale loaded', 'success');
            return this.i18n;
        } catch (e) {
            if(e.code == 'MODULE_NOT_FOUND') {
                this.log("[CORE][LOCALE] "+e.message.split("\n")[0].trim(), 'crash');
            } else {
                console.log(e);
            }
        }
    }
    lang(key, value = null) {
        if(value) {
            return this.i18n.__(key, value)
        } else {
            return this.i18n.__(key)
        }
    }
    fetchLocales() {
        return fs.readdirSync(path.join(__dirname+"/../", 'locales')).filter(f => f.endsWith('.json')).map(f => f.split('.json')[0].toLowerCase());
    }
    log(message, type = null) {
        if(!message || !type) return;
        switch(type) {
            case 'error':
                console.log(chalk.red("["+moment().format('YYYY-MM-DD HH:mm:ss')+"]["+type.toUpperCase()+"]"+message));
            break;
            case 'crash':
                console.log(chalk.red("["+moment().format('YYYY-MM-DD HH:mm:ss')+"]["+type.toUpperCase()+"]"+message));
            break;
            case 'fail':
                console.log(chalk.red("["+moment().format('YYYY-MM-DD HH:mm:ss')+"]["+type.toUpperCase()+"]"+message));
            break;
            case 'success':
                console.log(chalk.green("["+moment().format('YYYY-MM-DD HH:mm:ss')+"]["+type.toUpperCase()+"]"+message));
            break;
            case 'info':
                console.log(chalk.cyan("["+moment().format('YYYY-MM-DD HH:mm:ss')+"]["+type.toUpperCase()+"]"+message));
            break;
            case 'debug':
                console.log(chalk.magentaBright("["+moment().format('YYYY-MM-DD HH:mm:ss')+"]["+type.toUpperCase()+"]"+message));
            break;
            default:
                console.log(chalk.magentaBright("["+moment().format('YYYY-MM-DD HH:mm:ss')+"][UNKNOWN]"+message));
        }
    }
}

module.exports = XARustLocale;