'use strict';

class XARust {
    #version = "0.2";
    constructor(config, dev = false) {
        try {
            global.discord = require('discord.js');
            global.webRcon = require('webrconjs');
            global.axios = require('axios');
            global.giveawayManager = require('discord-giveaways').GiveawaysManager;
            global.ms = require('ms');
            global.chalk = require('chalk');
            global.moment = require('moment');
            if(discord.Constants) {
                discord.Constants.DefaultOptions.ws.properties.$browser = 'Discord iOS';
                discord.Constants.DefaultOptions.ws.properties.$device = 'Discord iOS';
            }
            new XARustInit(config, dev);
        } catch (e) {
            if(e.code == 'MODULE_NOT_FOUND') {
                this.log("[CORE][INIT] "+e.message.split("\n")[0].trim(), 'crash');
            } else {
                console.log(e)
            }
        }
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
class XARustInit {
    constructor(config, dev) {
        if(!chalk || !moment) return;
        this.log("[CORE] Compiling XaRustCore..", "info")
        if(!dev) {
            this.log("[CORE] Totally "+Object.keys(config.bots).length+" bots found", "info")
        } else {
            this.log("/------------------------------------------------------------\\", "debug")
            this.log("/---------------------DEBUG MODE ENABLED---------------------\\", "debug")
            this.log("/------------------------------------------------------------\\", "debug")
        }
        let serverC = 0;
        config.bots.forEach((k) => {
            if(k.isEnabled && serverC <= 0) {
                this.log("[CORE]["+k.rconHost+"] Initializing core", "info")
                new XARustCore(k, config.guilds, config.steamApiKey, config.emojis, dev);
                if(dev) {
                    serverC++;
                }
            }
        });
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
class XARustCore {
    constructor(data, guilds, steamApiKey, emojis, dev) {
        if(!data || !data.isEnabled) return;
        const XARustLocale = require('./XARustLocale');
        this.i18n = new XARustLocale(data.language);
        if(!axios || !discord || !webRcon || !chalk || !guilds || !ms || !moment || !steamApiKey || !emojis || !giveawayManager || !data.channels || !data.channels.killFeed || !data.channels.typing || !data.channels.chat || !data.channels.coreLog || !data.channels.punishmentLog) {
            return this.log("[CORE]["+data.serverName+"] "+this.i18n.__('anErrorOccurredWhileLoad', {"core": "XaRustCore"}), "error")
        } else {
            this.log("[CORE]["+data.serverName+"] "+this.i18n.__('coreStarted'), "success")
        }
        this.steamApiKey = steamApiKey;
        this.data = data;
        if(dev) return this.dev();
        this.log("["+this.i18n.__("licensing")+"] "+this.i18n.__('attemptingToConnectLicensingServer'), "info")
        this.axios = axios;
        global.emojis = emojis;
        this.log('['+this.i18n.__('licensing')+'] '+this.i18n.__('licenseAccepted'), "success")
        global.steamAvatars = [];
        global.steamUsers =  [];
        global.rconReconnectTry = 1;
        this.guild = this.getGuild(guilds);
        this.embed = new discord.MessageEmbed();
        this.client = new discord.Client({ retryLimit: Infinity, autoReconnect: true, fetchAllMembers: true, partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });
        if(data.enableGiveaway) {
            this.client.giveaway = new giveawayManager(this.client, {
                storage: './giveaways.json',
                updateCountdownEvery: 10000,
                hasGuildMembersIntent: true,
                default: {
                    botsCanWin: false,
                    embedColor: '#FF0000',
                    embedColorEnd: '#000000',
                    reaction: '🎉'
                }
            });
        }
        //exemptPermissions: [], //'MANAGE_MESSAGES', 'ADMINISTRATOR'
        this.rcon = null;
        global.rconStatus = false;
        this.ready();
        this.message();
        this.reactionAdd();
        this.reactionRemove();
        this.login();
        /*setTimeout(() => {
            this.connectRcon();
        }, 15000)*/
        /*(async () => {
            console.log(await this.getSteamUsernameById('76561198242916802'));
        })();*/
    }
    dev() {
        /*this.log('deneme', 'success')
        this.log('deneme', 'error')
        this.log('deneme', 'info')
        this.log('deneme', 'debug')*/
        //this.initLocaleHandler();
    }
    log(message, type) {
        if(!message || !type) return;
        switch(type) {
            case 'error':
                console.log(chalk.red("["+moment().format('YYYY-MM-DD HH:mm:ss')+"]["+this.i18n.__('error').toUpperCase()+"]"+message));
            break;
            case 'crash':
                console.log(chalk.red("["+moment().format('YYYY-MM-DD HH:mm:ss')+"]["+this.i18n.__('crash').toUpperCase()+"]"+message));
            break;
            case 'fail':
                console.log(chalk.red("["+moment().format('YYYY-MM-DD HH:mm:ss')+"]["+this.i18n.__('fail').toUpperCase()+"]"+message));
            break;
            case 'success':
                console.log(chalk.green("["+moment().format('YYYY-MM-DD HH:mm:ss')+"]["+this.i18n.__('success').toUpperCase()+"]"+message));
            break;
            case 'info':
                console.log(chalk.cyan("["+moment().format('YYYY-MM-DD HH:mm:ss')+"]["+this.i18n.__('info').toUpperCase()+"]"+message));
            break;
            case 'debug':
                console.log(chalk.magentaBright("["+moment().format('YYYY-MM-DD HH:mm:ss')+"]["+this.i18n.__('debug').toUpperCase()+"]"+message));
            break;
        }
    }
    connectRcon(status = false) {
        /*if(status) {
            this.log("[RCON] Retrying to connect, try "+rconReconnectTry, "info");
        }*/
        try {
            this.client.user.setActivity('Connecting..');
            this.rcon = new webRcon(this.data.rconHost, this.data.rconPort);
            this.log("[RCON]["+this.data.rconHost+"] "+this.i18n.__('attemptingToConnectRcon')+(status ? ", "+this.i18n.__('try')+" "+rconReconnectTry+"" : ""), "info");
            (async () => {
                await this.coreLogSend('[RCON]['+this.i18n.__('info')+']['+this.data.rconHost+'] '+this.i18n.__('attemptingToConnectRcon')+(status ? ', '+this.i18n.__('try')+' '+rconReconnectTry : ''));
            })();
            this.rconReady();
            this.rcon.connect(this.data.rconPassword);
        } catch(err) {
            this.client.user.setActivity(this.i18n.__('connectionFailed'));
            this.log("[RCON]["+this.data.rconHost+"] "+this.i18n.__('connectionFailedRetryingInXseconds', {"time": 10}), "error");
            (async () => {
                await this.coreLogSend('[RCON]['+this.i18n.__('error')+']['+this.data.rconHost+'] '+this.i18n.__('connectionFailedRetryingInXseconds', {"time": 10}));
            })();
            setTimeout(() => {
                this.connectRcon(true);
            }, 10000)
        }
        if(status) {
            rconReconnectTry++;
        }
    }
    message() {
        this.client.on('message', async (message) => {
            if(message.author.bot) return;
            if(message.content.startsWith(this.data.botPrefix)) {
                this.commandExecutor(message);
            }
            if(this.data.channels.chat.enabled) {
                await this.chatLogSend(message);
            }
        })
    }
    async getSteamAvatarById(id) {
        if(!steamAvatars.includes(id)) {
            try {
                let res = await this.axios.get('http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key='+this.steamApiKey+'&steamids='+id);
                if(res) {
                    res = res.data.response;
                    if(res.players.length >= 1) {
                        steamAvatars.push(res.players[0].steamid);
                        steamAvatars[res.players[0].steamid] = res.players[0].avatarfull;
                        return res.players[0].avatarfull;
                    } else {
                        return 1337;
                    }
                } else {
                    return 1337;
                }
            } catch(err) {
                return 1337;
            }
        } else {
            return (steamAvatars[id].length >= 15 ? steamAvatars[id] : 1337);
        }
    }
    async getSteamUsernameById(id) {
        if(!steamUsers.includes(id)) {
            try {
                let res = await this.axios.get('http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key='+this.steamApiKey+'&steamids='+id);
                if(res) {
                    res = res.data.response;
                    if(res.players.length >= 1) {
                        steamUsers.push(res.players[0].steamid);
                        steamUsers[res.players[0].steamid] = res.players[0].personaname;
                        return res.players[0].personaname;
                        //return res.players[0].avatarfull;
                    } else {
                        return "___";
                    }
                } else {
                    return "___";
                }
            } catch(err) {
                return "___";
            }
        } else {
            return (steamUsers[id].length >= 1 ? steamUsers[id] : "___");
        }
    }
    rconServerInfo() {
        try {
            if(global.rconStatus) {
                this.rcon.run('serverinfo');
                setTimeout(() => {
                    if(global.rconStatus) {
                        this.rconServerInfo();
                    }
                }, 15000);
            } else {
                setTimeout(() => {
                    this.rconServerInfo();
                }, 3000)
            }
        } catch(err) {
            setTimeout(() => {
                this.rconServerInfo();
            }, 3000);
        }
    }
    startTyping() {
        if(this.data.channels.typing.enabled) {
            if(this.data.channels.typing.discordChannelId) {
                try {
                    const checkTypingChannel = this.client.channels.cache.find(channel => channel.id === this.data.channels.typing.discordChannelId);
                    if(checkTypingChannel) {
                        this.client.channels.cache.find(channel => channel.id === this.data.channels.typing.discordChannelId).startTyping().catch(() => { /* */ });
                        setTimeout(() => {
                            this.startTyping();
                        }, 30000);
                    }
                } catch(err) {
                    setTimeout(() => {
                        this.startTyping();
                    }, 30000);
                }
            }
        }
    }
    ready() {
        this.client.on('ready', async () => {
            const clientConfig = this.data;
            this.log('[DISCORD] '+this.i18n.__('discordBotReady', {"name": this.client.user.tag}), 'success');
            if(this.data.enableGiveaway) {
                this.log('[DISCORD]['+this.i18n.__('module')+'] '+this.i18n.__('moduleXenabled', {"name": "Giveaway"}), 'success')
            }
            this.connectRcon();
            this.startTyping();
        })
        this.client.on('error', async (error) => {
            await this.coreLogSend('[DISCORD]['+this.i18n.__('error')+'] '+this.i18n.__('discordAnErrorOccurredRetryingToConnect'))
            this.log('[DISCORD] '+this.i18n.__('discordAnErrorOccurredRetryingToConnect'), 'error')
        })
        this.client.on('shardError', async (error) => {
            await this.coreLogSend('[DISCORD]['+this.i18n.__('error')+'] '+this.i18n.__('discordWebsocketConnectionEncounteredAnError'))
            this.log('[DISCORD] '+this.i18n.__('discordWebsocketConnectionEncounteredAnError'), 'error');
        });
    }
    rconReady() {
        this.rcon.on('connect', async () => {
            global.rconStatus = true;
            await this.coreLogSend('[RCON]['+this.i18n.__('success')+']['+this.data.rconHost+'] '+this.i18n.__('connected'))
            this.log('[RCON]['+this.data.rconHost+'] '+this.i18n.__('connected'), 'success')
            rconReconnectTry = 1;
            this.rconServerInfo();
        })
        this.rcon.on('message', async (msg) => {
            if(!msg) return;
            
            msg = this.fixJSON(msg);
            //msg = (typeof msg != "object" ? JSON.parse(msg) : msg);
            //console.log(JSON.parse(msg.message));
            //msg = (typeof this.fixJSON(msg) != 'object' ? JSON.parse(this.fixJSON(msg)).message : JSON.parse(this.fixJSON(msg).message))
            //msg = JSON.parse(typeof msg != 'object' ? (msg.message ? msg.message : msg) : msg.message);
            let mainMessage = msg;
            if(typeof msg == "object") msg = msg.message;
            if(mainMessage.type == 'Generic') {
                if(this.strstr(msg.toString(), 'Hostname')) {
                    setTimeout(() => {
                        this.selectGameType(this.data.game, JSON.parse(msg));
                    }, 7500);
                }
            }
            if(this.guild) {
                if(this.data.channels.killFeed.enabled) {
                    if(typeof msg != "object") {
                        //console.log(msg);
                        if(this.strstr(msg, 'spawned')) {
                            const spawned = msg.match(/([0-9]{17,17})/g);
                            if(spawned && spawned.length == 1) {
                                console.log("someone spawned: "+spawned[0])
                            }
                        }
                        if(this.strstr(msg, 'killed')) {
                            const kill = msg.match(/([0-9]{17,17})/g);
                            if(kill && kill.length == 2) {
                                console.log(kill[0]+" was killed by "+kill[1])
                            }
                        }
                        if(this.strstr(msg, 'suicide')) {
                            let userId = msg.match(/([0-9]{17,17})/g);
                            let nickname = msg.match(/.+?(?=\[)/g)
                            if(userId && userId.length == 1 && nickname && nickname.length >= 1) {
                                await this.killFeed(userId, nickname, 'Was suicided')
                                console.log(nickname+"("+userId+") was suicided")
                            }
                        }
                        if(this.strstr(msg, 'joined')) {
                            const ipAddress = msg.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/);
                            const joined = msg.match(/([0-9]{17,17})/g);
                            console.log(msg);
                            if(ipAddress && joined && ipAddress.length == 1 && joined.length == 2) {
                                console.log(joined[0]+" joined the server ("+ipAddress[0]+")");
                            }
                        }
                        if(this.strstr(msg, 'disconnecting')) {
                            const ipAddress = msg.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/);
                            const disconnected = msg.match(/([0-9]{17,17})/g);
                            if(ipAddress && disconnected && ipAddress.length == 1 && disconnected.length == 1) {
                                console.log(disconnected[0]+" disconnected from the server ("+ipAddress[0]+")");
                            }
                        }
                        
                    }
                    //console.log(JSON.parse(msg))
                    if(mainMessage.type == 'Generic') {
                        //if(this.strstr(JSON.parse(msg), 'suicide')) {
                            //console.log("GGGGGGGGGGGGGGGGGGG")
                            //console.log(msg)
                        //}
                    }
                    //this.killFeed(msg.message);
                }
                if(this.data.channels.chat.enabled) {
                    if(mainMessage.type == 'Chat') {
                        (async () => {
                            //console.log(JSON.parse(msg))
                            //console.log(mainMessage)
                            //console.log("chat handled")
                            await this.chatLog(JSON.parse(msg));
                        })();
                    }
                }
            }
        })
        this.rcon.on('disconnect', async (err) => {
            global.rconStatus = false;
            await this.coreLogSend('[RCON]['+this.i18n.__('error')+']['+this.data.rconHost+'] '+this.rconErrorHandle(err)+', '+this.i18n.__('retryingInXseconds', {"time": 10}))
            this.log("[RCON]["+this.data.rconHost+"] "+this.rconErrorHandle(err)+", "+this.i18n.__('retryingInXseconds', {"time": 10}), "error")
            setTimeout(() => {
                this.connectRcon(true);
            }, 10000);
            //console.log("[RCON][Error] Disconnected from "+this.data.rconHost+":"+this.data.rconPort)
            //console.log('DISCONNECTED')
        })
        this.rcon.on('error', async (err) => {
            await this.coreLogSend('[RCON]['+this.i18n.__('error')+']['+this.data.rconHost+'] '+this.rconErrorHandle(err))
            this.log("[RCON]["+this.data.rconHost+"] "+this.rconErrorHandle(err), "error")
            //console.log(err)
            //console.log(clientConfig)
            //console.log("[RCON][Error] Connection refused to "+this.data.rconHost+":"+this.data.rconPort)
            //console.log('ERROR:', err)
        })
    }
    rconErrorHandle(err) {
        if(!err) return;
        switch(err.code) {
            case 'ETIMEDOUT':
                try {
                    this.client.user.setActivity(this.i18n.__('connectionTimedOutRetrying'));
                } catch(err) {}
                return this.i18n.__('connectionTimedOut');
            case 1006:
                try {
                    this.client.user.setActivity(this.i18n.__('connectionClosedRetrying'));
                } catch(err) {}
                return this.i18n.__('connectionClosed');
        }
    }
    asyncRun(func) {
        (async () => {
            func();
        })();
        return;
    }
    async coreLogSend(message) {
        if(this.data.channels.coreLog.discordChannelId) {
            if(this.guild) {
                let guild = this.client.guilds.cache.get(this.guild.guildId);
                if(guild) {
                    if(guild.available) {
                        let coreLogChannel = guild.channels.cache.get(this.data.channels.coreLog.discordChannelId)
                        if(coreLogChannel) {
                            await coreLogChannel.send(this.embed
                                .setColor("#2F3136")
                                .setDescription(message)
                            ).catch(() => { /* */ });
                            this.refreshEmbed();
                        } else {
                            this.log("[CORE] "+this.i18n.__('coreLogInvalidChannelError'), "error")
                        }
                    }
                }
            }
        }
    }
    async chatLogSend(message) {
        if(this.data.channels.chat.discordChannelId) {
            if(this.guild) {
                let guild = this.client.guilds.cache.get(this.guild.guildId);
                if(guild) {
                    if(guild.available) {
                        if(this.data.channels.chat.discordChannelId == message.channel.id) {
                            let chatLogChannel = guild.channels.cache.get(this.data.channels.chat.discordChannelId)
                            if(chatLogChannel) {
                                await message.delete();
                                await chatLogChannel.send(this.embed
                                    .setAuthor(message.author.tag, message.author.avatarURL({ dynamic: true, size: 1024 }))
                                    .setColor("#A13422")
                                    .setDescription(message.content+"\n"+new Date().toLocaleString())
                                ).catch(() => { /* */ });
                                this.refreshEmbed();
                                this.say(message.content);
                            }
                        }
                        
                    }
                }
            }
        }
    }
    commandExecutor(message) {
        const args = message.content.slice(this.data.botPrefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();
        return this.commands(message, command, args);
    }
    async fetchDiscordUser(discordId) {
        (async () => {
            try {
                return await this.client.users.fetch(discordId)
            } catch(error) {
                return undefined;
            }
        })
    }
    searchArrayKeyInArray = (array1, array2) => {
        for (let i = 0; i < array1.length; i++) {
                if(array2.indexOf(array1[i]) != -1) {
                    return true;
                }
        }
    }
    uniq = (a) => {
        return a.sort().filter(function(item, pos, ary) {
            return !pos || item != ary[pos - 1];
        });
    }
    commands(message, command, args) {
        (async () => {
            switch(command) {
                case 'xgg':
                    /*const ezbircir = [111, 222, 333];

                    const newArr = ezbircir.concat([111, 555, 666, 777])

                    console.log(newArr)
                    console.log("uniqq");
                    console.log(this.uniq(newArr))*/

                    await message.channel.send(this.embed
                        .setAuthor(message.author.tag, message.author.avatarURL({ dynamic: true, size: 1024 }))
                        .setColor('#2F3136')
                        .setDescription('testtest')
                    ).then(async (m) => {
                        this.refreshEmbed();
                        m.delete({timeout: 30000}).catch(() => { /* here is error */ });
                        await m.react('👍').then(async() => {
                            await m.react('👎');
                        });
                        let giveawayEmojiFilter = (reaction, user) => {
                            return reaction.emoji.name === '👍' || reaction.emoji.name === '👎'  && message.author.id === user.id;
                        }
                        m.awaitReactions(giveawayEmojiFilter, {max: 1, time: 30000, errors: ['time']})
                        .then(async (collected) => {
                            //console.log(collected.first())
                        }).catch(async () => {
                            await message.channel.send(this.embed
                                .setAuthor(message.author.tag, message.author.avatarURL({ dynamic: true, size: 1024 }))
                                .setColor('#2F3136')
                                .setDescription('No reaction gived, process timed out.')
                            ).then(async (m) => { await m.delete({timeout: 10000}) }).catch(() => { /* here is error */ })
                            this.refreshEmbed();
                        })
                    })

                break;
                case 'gstart':
                    await message.delete({timeout: 100});
                    let giveawayTempConfig = {
                        "postChannelId": null,
                        "reward": null,
                        "winnerCount": null,
                        "guaranteedWinners": [],
                        "drawTime": null
                    };
                    //[...message.mentions.users.keys()].length

                    //console.log([...message.mentions.users.keys()].length)

                    //const user = message.mentions.channels.first() || (args[0] ? await this.fetchDiscordUser(args[0]) : undefined) || message.author;


                    await message.channel.send(this.embed
                        .setAuthor(message.author.tag, message.author.avatarURL({ dynamic: true, size: 1024 }))
                        .setColor('#2F3136')
                        .setDescription(this.i18n.__('giveawayQuestionOne'))
                    ).then(async (m) => {
                        this.refreshEmbed();
                        let filter = (response) => {
                            return message.author.id === response.author.id;
                        }
                        m.delete({timeout: 30000}).catch(() => { /* here is error */ });
                        message.channel.awaitMessages(filter, {max: 1, time: 30000, errors: ['time']})
                        .then(async (collected) => {
                            let collectedChannel = collected.first().content.replace(/\D/g,'').trim() || collected.first().content;
                            await m.delete({timeout: 100}).catch(() => { /* here is error */ });
                            await collected.first().delete({timeout: 100}).catch(() => { /* here is error */ });
                            if(collectedChannel.length === 18) {
                                let giveawayChannelCheck = this.client.channels.cache.find(channel => channel.id == collectedChannel);
                                if(giveawayChannelCheck) {
                                    giveawayTempConfig['postChannelId'] = collectedChannel;
                                    await message.channel.send(this.embed
                                        .setAuthor(message.author.tag, message.author.avatarURL({ dynamic: true, size: 1024 }))
                                        .setColor('#2F3136')
                                        .setDescription(this.i18n.__('giveawayQuestionTwo'))
                                    ).then(async (m) => {
                                        this.refreshEmbed();
                                        m.delete({timeout: 30000}).catch(() => { /* here is error */ });
                                        message.channel.awaitMessages(filter, {max: 1, time: 30000, errors: ['time']})
                                        .then(async (collected) => {
                                            let collectedReward = collected.first().content;
                                            await m.delete({timeout: 100}).catch(() => { /* here is error */ });
                                            await collected.first().delete({timeout: 100}).catch(() => { /* here is error */ });
                                            if(collectedReward.length >= 1) {
                                                giveawayTempConfig['reward'] = collectedReward;
                                                await message.channel.send(this.embed
                                                    .setAuthor(message.author.tag, message.author.avatarURL({ dynamic: true, size: 1024 }))
                                                    .setColor('#2F3136')
                                                    .setDescription(this.i18n.__('giveawayQuestionThree'))
                                                ).then(async (m) => {
                                                    this.refreshEmbed();
                                                    m.delete({timeout: 30000}).catch(() => { /* here is error */ });
                                                    message.channel.awaitMessages(filter, {max: 1, time: 30000, errors: ['time']})
                                                    .then(async (collected) => {
                                                        let collectedWinnerCount = collected.first().content;
                                                        await m.delete({timeout: 100}).catch(() => { /* here is error */ });
                                                        await collected.first().delete({timeout: 100}).catch(() => { /* here is error */ });
                                                        if(collectedWinnerCount.length >= 1 && collectedWinnerCount >= 1) {
                                                            giveawayTempConfig['winnerCount'] = collectedWinnerCount;
                                                            await message.channel.send(this.embed
                                                                .setAuthor(message.author.tag, message.author.avatarURL({ dynamic: true, size: 1024 }))
                                                                .setColor('#2F3136')
                                                                .setDescription(this.i18n.__('giveawayQuestionFour'))
                                                            ).then(async (m) => {
                                                                this.refreshEmbed();
                                                                m.delete({timeout: 30000}).catch(() => { /* here is error */ });
                                                                message.channel.awaitMessages(filter, {max: 1, time: 30000, errors: ['time']})
                                                                .then(async (collected) => {
                                                                    let tempGuaranteedWinners = [...collected.first().mentions.users.keys()];
                                                                    await m.delete({timeout: 100}).catch(() => { /* here is error */ });
                                                                    await collected.first().delete({timeout: 100}).catch(() => { /* here is error */ });
                                                                    tempGuaranteedWinners = tempGuaranteedWinners.concat(collected.first().content.split(' ').map((k) => (k.length === 18 ? k : null)));
                                                                    tempGuaranteedWinners = this.uniq(tempGuaranteedWinners)
                                                                    tempGuaranteedWinners = tempGuaranteedWinners.filter((e) => {
                                                                        return !!e;
                                                                    });
                                                                    //if(tempGuaranteedWinners.length >= giveawayTempConfig['winnerCount']) {
                                                                    if(1==1) {
                                                                        giveawayTempConfig['guaranteedWinners'] = tempGuaranteedWinners;
                                                                        await message.channel.send(this.embed
                                                                            .setAuthor(message.author.tag, message.author.avatarURL({ dynamic: true, size: 1024 }))
                                                                            .setColor('#2F3136')
                                                                            .setDescription(this.i18n.__('giveawayQuestionFive'))
                                                                        ).then(async (m) => {
                                                                            this.refreshEmbed();
                                                                            m.delete({timeout: 30000}).catch(() => { /* here is error */ });
                                                                            message.channel.awaitMessages(filter, {max: 1, time: 30000, errors: ['time']})
                                                                            .then(async (collected) => {
                                                                                let collectedDrawTime = collected.first().content;
                                                                                await m.delete({timeout: 100}).catch(() => { /* here is error */ });
                                                                                await collected.first().delete({timeout: 100}).catch(() => { /* here is error */ });
                                                                                giveawayTempConfig['drawTime'] = collectedDrawTime;
                                                                                await message.channel.send(this.embed
                                                                                    .setAuthor(message.author.tag, message.author.avatarURL({ dynamic: true, size: 1024 }))
                                                                                    .setColor('#2F3136')
                                                                                    .setDescription(this.i18n.__('giveawayDetails', {"prize": giveawayTempConfig['reward'], "winnerCount": giveawayTempConfig['winnerCount'], "guaranteedWinners": giveawayTempConfig['guaranteedWinners'].map((u) => '<@'+u+'>'), "postChannelId": giveawayTempConfig['postChannelId'], "drawTime": giveawayTempConfig['drawTime']}))
                                                                                ).then(async (m) => {
                                                                                    this.refreshEmbed();
                                                                                    m.delete({timeout: 30000}).catch(() => { /* here is error */ });
                                                                                    for (const k of Object.keys(global.emojis.giveaway)) {
                                                                                        await m.react(global.emojis.giveaway[k]).catch(() => { /* */ });
                                                                                    }
                                                                                    let giveawayEmojiFilter = (reaction, user) => {
                                                                                        return this.getKeyByValueForSingle(global.emojis.giveaway, reaction._emoji.id) && message.author.id === user.id;
                                                                                    }
                                                                                    m.awaitReactions(giveawayEmojiFilter, {max: 1, time: 30000, errors: ['time']})
                                                                                    .then(async (collected) => {
                                                                                        await m.delete({timeout: 100}).catch(() => { /* here is error */ });
                                                                                        if(collected.first()._emoji.name == 'yes') {
                                                                                            let fetchGiveawayChannel = this.client.channels.cache.find(channel => channel.id == giveawayTempConfig['postChannelId']);
                                                                                            if(fetchGiveawayChannel) {
                                                                                                await this.client.giveaway.start(fetchGiveawayChannel, {
                                                                                                    time: ms(giveawayTempConfig['drawTime']),
                                                                                                    winnerCount: parseInt(giveawayTempConfig['winnerCount']),
                                                                                                    prize: giveawayTempConfig['reward'],
                                                                                                    hostedBy: message.author,
                                                                                                    bonusEntries: [
                                                                                                        {
                                                                                                            bonus: (member) => giveawayTempConfig['guaranteedWinners'].includes(member.id) ? 99999 : null,
                                                                                                            cumulative: false 
                                                                                                        }
                                                                                                    ],
                                                                                                    messages: {
                                                                                                        giveaway: '@everyone\n\n🎉🎉 **'+this.i18n.__('giveawayMessagesOne')+'** 🎉🎉',
                                                                                                        giveawayEnded: '@everyone\n\n🎉🎉 **'+this.i18n.__('giveawayMessagesTwo')+'** 🎉🎉',
                                                                                                        timeRemaining: this.i18n.__('giveawayMessagesThree')+': **{duration}**',
                                                                                                        inviteToParticipate: this.i18n.__('giveawayMessagesFour'),
                                                                                                        winMessage: this.i18n.__('giveawayMessagesCongratulations')+', {winners}! '+this.i18n.__('giveawayYouWon')+' **{prize}**!\n{messageURL}',
                                                                                                        embedFooter: null,
                                                                                                        noWinner: this.i18n.__('giveawayMessageFive'),
                                                                                                        hostedBy: this.i18n.__('giveawayMessageSix')+': {user}',
                                                                                                        winners: this.i18n.__('giveawayMessageSeven'),
                                                                                                        endedAt: this.i18n.__('giveawayMessageEight'),
                                                                                                        units: {
                                                                                                            seconds: this.i18n.__('giveawayTimeSeconds'),
                                                                                                            minutes: this.i18n.__('giveawayTimeMinutes'),
                                                                                                            hours: this.i18n.__('giveawayTimeHours'),
                                                                                                            days: this.i18n.__('giveawayTimeDays'),
                                                                                                            pluralS: false
                                                                                                        }
                                                                                                    }
                                                                                                })
                                                                                                await message.channel.send(this.embed
                                                                                                    .setAuthor(message.author.tag, message.author.avatarURL({ dynamic: true, size: 1024 }))
                                                                                                    .setColor('#2F3136')
                                                                                                    .setDescription(this.i18n.__('giveawaySuccessMessage', {"postChannelId": giveawayTempConfig['postChannelId']}))
                                                                                                ).then(async (m) => { await m.delete({timeout: 15000}) }).catch(() => { /* here is error */ })
                                                                                                this.refreshEmbed();
                                                                                            } else {
                                                                                                await message.channel.send(this.embed
                                                                                                    .setAuthor(message.author.tag, message.author.avatarURL({ dynamic: true, size: 1024 }))
                                                                                                    .setColor('#2F3136')
                                                                                                    .setDescription(this.i18n.__('giveawayErrorOne'))
                                                                                                ).then(async (m) => { await m.delete({timeout: 10000}) }).catch(() => { /* here is error */ })
                                                                                                this.refreshEmbed();
                                                                                            }
                                                                                        } else {
                                                                                            await message.channel.send(this.embed
                                                                                                .setAuthor(message.author.tag, message.author.avatarURL({ dynamic: true, size: 1024 }))
                                                                                                .setColor('#2F3136')
                                                                                                .setDescription(this.i18n.__('giveawayErrorTwo'))
                                                                                            ).then(async (m) => { await m.delete({timeout: 10000}) }).catch(() => { /* here is error */ })
                                                                                            this.refreshEmbed();
                                                                                        }
                                                                                    }).catch(async () => {
                                                                                        await message.channel.send(this.embed
                                                                                            .setAuthor(message.author.tag, message.author.avatarURL({ dynamic: true, size: 1024 }))
                                                                                            .setColor('#2F3136')
                                                                                            .setDescription(this.i18n.__('giveawayErrorThree'))
                                                                                        ).then(async (m) => { await m.delete({timeout: 10000}) }).catch(() => { /* here is error */ })
                                                                                        this.refreshEmbed();
                                                                                    })
                                                                                })
                                                                            }).catch(async() => {
                                                                                await message.channel.send(this.embed
                                                                                    .setAuthor(message.author.tag, message.author.avatarURL({ dynamic: true, size: 1024 }))
                                                                                    .setColor('#2F3136')
                                                                                    .setDescription(this.i18n.__('giveawayErrorFour'))
                                                                                ).then(async (m) => { await m.delete({timeout: 10000}) }).catch(() => { /* here is error */ })
                                                                                this.refreshEmbed();
                                                                            })
                                                                        })
                                                                    } else {
                                                                        await message.channel.send(this.embed
                                                                            .setAuthor(message.author.tag, message.author.avatarURL({ dynamic: true, size: 1024 }))
                                                                            .setColor('#2F3136')
                                                                            .setDescription(this.i18n.__('giveawayErrorFive'))
                                                                        ).then(async (m) => { await m.delete({timeout: 10000}) }).catch(() => { /* here is error */ })
                                                                        this.refreshEmbed();
                                                                    }
                                                                }).catch(async (err) => {
                                                                    await message.channel.send(this.embed
                                                                        .setAuthor(message.author.tag, message.author.avatarURL({ dynamic: true, size: 1024 }))
                                                                        .setColor('#2F3136')
                                                                        .setDescription(this.i18n.__('giveawayErrorSix'))
                                                                    ).then(async (m) => { await m.delete({timeout: 10000}) }).catch(() => { /* here is error */ })
                                                                    this.refreshEmbed();
                                                                })
                                                            })
                                                        } else {
                                                            await message.channel.send(this.embed
                                                                .setAuthor(message.author.tag, message.author.avatarURL({ dynamic: true, size: 1024 }))
                                                                .setColor('#2F3136')
                                                                .setDescription(this.i18n.__('giveawayErrorSeven'))
                                                            ).then(async (m) => { await m.delete({timeout: 10000}) }).catch(() => { /* here is error */ })
                                                            this.refreshEmbed();
                                                        }
                                                    }).catch(async () => {
                                                        await message.channel.send(this.embed
                                                            .setAuthor(message.author.tag, message.author.avatarURL({ dynamic: true, size: 1024 }))
                                                            .setColor('#2F3136')
                                                            .setDescription(this.i18n.__('giveawayErrorEight'))
                                                        ).then(async (m) => { await m.delete({timeout: 10000}) }).catch(() => { /* here is error */ })
                                                        this.refreshEmbed();
                                                    })
                                                })
                                            } else {
                                                await message.channel.send(this.embed
                                                    .setAuthor(message.author.tag, message.author.avatarURL({ dynamic: true, size: 1024 }))
                                                    .setColor('#2F3136')
                                                    .setDescription(this.i18n.__('giveawayErrorNine'))
                                                ).then(async (m) => { await m.delete({timeout: 10000}) }).catch(() => { /* here is error */ })
                                                this.refreshEmbed();
                                            }
                                        }).catch(async () => {
                                            await message.channel.send(this.embed
                                                .setAuthor(message.author.tag, message.author.avatarURL({ dynamic: true, size: 1024 }))
                                                .setColor('#2F3136')
                                                .setDescription(this.i18n.__('giveawayErrorTen'))
                                            ).then(async (m) => { await m.delete({timeout: 10000}) }).catch(() => { /* here is error */ })
                                            this.refreshEmbed();
                                        })
                                    })
                                } else {
                                    await message.channel.send(this.embed
                                        .setAuthor(message.author.tag, message.author.avatarURL({ dynamic: true, size: 1024 }))
                                        .setColor('#2F3136')
                                        .setDescription(this.i18n.__('giveawayErrorEleven'))
                                    ).then(async (m) => { await m.delete({timeout: 10000}) }).catch(() => { /* here is error */ })
                                    this.refreshEmbed();
                                }
                            } else {
                                await message.channel.send(this.embed
                                    .setAuthor(message.author.tag, message.author.avatarURL({ dynamic: true, size: 1024 }))
                                    .setColor('#2F3136')
                                    .setDescription(this.i18n.__('giveawayErrorTwelve'))
                                ).then(async (m) => { await m.delete({timeout: 10000}) }).catch(() => { /* here is error */ })
                                this.refreshEmbed();
                            }
                        }).catch(async () => {
                            await message.channel.send(this.embed
                                .setAuthor(message.author.tag, message.author.avatarURL({ dynamic: true, size: 1024 }))
                                .setColor('#2F3136')
                                .setDescription(this.i18n.__('giveawayErrorThirteen'))
                            ).then(async (m) => { await m.delete({timeout: 10000}) }).catch(() => { /* here is error */ })
                            this.refreshEmbed();
                        })
                    })
                break;
                case 'xprofile':
                    const user = message.mentions.users.first() || (args[0] ? await this.fetchDiscordUser(args[0]) : undefined) || message.author;
                    if(user) {
                        console.log('user var axios working')
                        this.axios.get(this.addons.ember.api+"api/betterdiscordbot/user/"+user.id).then((res) => {
                            console.log('axios get ok')
                            if(res) {
                                res = res.data;
                                console.log(res);
                            }
                        }).catch((err) => {
                            console.log(err)
                            console.log("an error occurred while get data")
                        });
                    } else {
                        return await message.channel.send(this.embed
                            .setAuthor(message.author.tag, message.author.avatarURL({ dynamic: true, size: 1024 }))
                            .setColor('#2F3136')
                            .setDescription('Invalid user specified.')
                        ).catch(() => { /* */ })
                        this.refreshEmbed();
                    }
                break;
                default:
                    if(command.length >= 2) {
                        //console.log(message)
                        this.log('[DISCORD] '+this.i18n.__('commandNotFound')+' ('+command+')', "error")
                        await message.delete();
                        return await message.channel.send(this.embed
                            .setAuthor(message.author.tag, message.author.avatarURL({ dynamic: true, size: 1024 }))
                            .setColor('#2F3136')
                            .setDescription(this.i18n.__('commandNotFound'))
                        ).then(async (m) => { await m.delete({timeout: 7500}) }).catch(() => { /* */ })
                        this.refreshEmbed();
                    }
                    
            }
            return;
        })();
    }
    commandGetUser(discordId) {
        if(!this.addons.ember.api || !this.addons.ember.secret || !this.addons.ember.enabled) return;
        axios.get(this.addons.ember.api+"api/betterdiscordbot/user/"+discordId).then((res) => {
            if(res) {
                res = res.data;
                console.log(res);
            }
        }).catch((err) => {
            console.log(err)
            console.log("an error occurred while get data")
        });
    }
    updatePlayerList() {
        
    }
    disconnecting(msg) {
        
    }
    async suicide(id, nickname, message) {
        let guild = this.client.guilds.cache.get(this.guild.guildId);
        if(this.data.channels.killFeed.discordChannelId) {
            if(guild) {
                if(guild.available) {
                    let killFeedLogChannel = guild.channels.cache.get(this.data.channels.killFeed.discordChannelId);
                    if(killFeedLogChannel) {
                        const getUserAvatar = await this.getSteamAvatarById(id);
                        if(getUserAvatar) {
                            await killFeedLogChannel.send(this.embed
                                .setAuthor(nickname, (getUserAvatar != 1337 ? getUserAvatar : 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/b5/b5bd56c1aa4644a474a2e4972be27ef9e82e517e_full.jpg'))
                                .setColor("#2F3136")
                                .setDescription(message+"\n["+this.i18n.__('steamProfile')+"](https://steamcommunity.com/profiles/"+id+"/) - "+new Date().toLocaleString())
                            ).catch(() => { /* err */ })
                            this.refreshEmbed();
                        }
                        //console.log("EZBIR");
                        //console.log(msg);
                        //const testt = msg.match(/([0-9]{17,17})/g)
                        //console.log(testt)
                        //console.log(msg.match(/\[(^\d{15}$)|(^\d{17}$)\]/))
                        /*let getEventType = msg.split('[')[0];
                        let getEventType*/
                    }
                }
            }
        }
    }

    refreshEmbed() {
        this.embed.setAuthor("", "").setColor("").setDescription("");
        this.embed = null;
        this.embed = new discord.MessageEmbed();
    }
    async punishLog(message, id) {
        let guild = this.client.guilds.cache.get(this.guild.guildId);
        if(this.data.channels.punishmentLog.discordChannelId && this.data.channels.punishmentLog.enabled) {
            if(guild) {
                if(guild.available) {
                    let punishmentLogChannel = guild.channels.cache.get(this.data.channels.punishmentLog.discordChannelId);
                    if(punishmentLogChannel) {
                        await punishmentLogChannel.send(this.embed
                            .setColor("#2F3136")
                            .setDescription(message)
                        ).catch(() => { /* err */ })
                        this.refreshEmbed();
                        //console.log("EZBIR");
                        //console.log(msg);
                        //const testt = msg.match(/([0-9]{17,17})/g)
                        //console.log(testt)
                        //console.log(msg.match(/\[(^\d{15}$)|(^\d{17}$)\]/))
                        /*let getEventType = msg.split('[')[0];
                        let getEventType*/
                    }
                }
            }
        }
    }
    async chatLog(msg) {
        let guild = this.client.guilds.cache.get(this.guild.guildId);
        if(this.data.channels.chat.discordChannelId) {
            if(guild) {
                if(guild.available) {
                    let chatLogChannel = guild.channels.cache.get(this.data.channels.chat.discordChannelId)
                    if(chatLogChannel) {
                        //console.log(msg);
                        if(msg.Username && msg.UserId) {
                            if(!steamAvatars.includes(msg.UserId)) {
                                this.axios.get('http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key='+this.steamApiKey+'&steamids='+msg.UserId).then(async (res) => {
                                    if(res) {
                                        res = res.data;
                                        if(res.response.players.length >= 1) {
                                            steamAvatars.push(res.response.players[0].steamid);
                                            steamAvatars[res.response.players[0].steamid] = res.response.players[0].avatarfull;
                                            await chatLogChannel.send(this.embed
                                                .setAuthor(msg.Username, res.response.players[0].avatarfull)
                                                .setColor(msg.Color)
                                                .setDescription((msg.Channel == 0 ? '[**'+this.i18n.__('tagGeneral')+'**]: ' : '[**'+this.i18n.__('tagTeam')+'**]: ')+msg.Message.replace(/<[^>]*>?/gm, '').split(':')[1]+"\n["+this.i18n.__('steamProfile')+"](https://steamcommunity.com/profiles/"+msg.UserId+"/) - "+new Date().toLocaleString()+"")
                                            ).then(async (m) => {
                                                this.refreshEmbed();
                                                for (const k of Object.keys(global.emojis.punishment)) {
                                                    await m.react(global.emojis.punishment[k]).catch(() => { /* */ });
                                                }
                                                m.awaitReactions(this.reactionFilter, { max: 1, time: 30*60*1000, errors: ['time'] })
                                                    .then(async (collected) => {
                                                        const reaction = collected.first();
                                                        const action = this.getKeyByValueForSingle(global.emojis, reaction._emoji.id);
                                                        const message = reaction.message.embeds[0].description.split("\n")[0];
                                                        const steamid = reaction.message.embeds[0].description.split("\n")[1].split("/")[4];
                                                        await this.doAction(action, "add", steamid, message, "1337");
                                                    }).catch(() => {})
                                            }).catch(() => {})
                                        }
                                    }
                                }).catch(() => { /* here is axios error */ })
                            } else {
                                await chatLogChannel.send(this.embed
                                    .setAuthor(msg.Username, steamAvatars[msg.UserId])
                                    .setColor(msg.Color)
                                    .setDescription((msg.Channel == 0 ? '[**'+this.i18n.__('tagGeneral')+'**]: ' : '[**'+this.i18n.__('tagTeam')+'**]: ')+msg.Message.replace(/<[^>]*>?/gm, '').split(':')[1]+"\n["+this.i18n.__('steamProfile')+"](https://steamcommunity.com/profiles/"+msg.UserId+"/) - "+new Date().toLocaleString()+"")
                                ).then(async (m) => {
                                    this.refreshEmbed();
                                    for (const k of Object.keys(global.emojis.punishment)) {
                                        await m.react(global.emojis.punishment[k]).catch(() => { /* */ });
                                    }
                                    m.awaitReactions(this.reactionFilter, { max: 1, time: 30*60*1000, errors: ['time'] })
                                        .then(async (collected) => {
                                            const reaction = collected.first();
                                            const action = this.getKeyByValueForSingle(global.emojis, reaction._emoji.id);
                                            const message = reaction.message.embeds[0].description.split("\n")[0];
                                            const steamid = reaction.message.embeds[0].description.split("\n")[1].split("/")[4];
                                            await this.doAction(action, "add", steamid, message, "1337");
                                        }).catch(() => {})
                                }).catch(() => {})

                            }
                        }
                    }

                }
            }
        }
    }
    reactionAdd() {
        this.client.on('messageReactionAdd', async(reaction, user) => {
            if(user.bot) return;
            if(reaction.partial) {
                try {
                    await reaction.fetch();
                } catch(err) {
                    this.log('[DISCORD] '+this.i18n.__('discordErrorCode', {"code": 1852}), "error");
                    return;
                }
            }
            const action = this.getKeyByValueForSingle(global.emojis.punishment, reaction._emoji.id);
            if(action) {
                const message = reaction.message.embeds[0].description.split("\n")[0];
                const steamid = reaction.message.embeds[0].description.split("\n")[1].split("/")[4];
                (async () => {
                    this.doAction(action, "add", steamid, message, user.id, reaction.message.channel.id);
                })();
            }
            
        })
    }
    reactionRemove() {
        this.client.on('messageReactionRemove', async(reaction, user) => {
            if(user.bot) return;
            if(reaction.partial) {
                try {
                    await reaction.fetch();
                } catch(err) {
                    this.log('[DISCORD] '+this.i18n.__('discordErrorCode', {"code": 1853}), "error");
                    return;
                }
            }
            const action = this.getKeyByValueForSingle(global.emojis.punishment, reaction._emoji.id);
            if(action) {
                const message = reaction.message.embeds[0].description.split("\n")[0];
                const steamid = reaction.message.embeds[0].description.split("\n")[1].split("/")[4];
                (async () => {
                    this.doAction(action, "delete", steamid, message, user.id, reaction.message.channel.id);
                })();
            }
        })
    }
    async doAction(action, reactType, steamid, message, staffid, channelid = null) {
        if(!action || !reactType || !steamid || !staffid) return;
        if(message) {
            message = message.replace('[**'+this.i18n.__('tagGeneral')+'**]: ', '').replace('[**'+this.i18n.__('tagTeam')+'**]: ', '');
        }
        let steamUsername = await this.getSteamUsernameById(steamid);
        steamUsername = (steamUsername == "___" ? this.i18n.__('unknown') : steamUsername)
        switch(action) {
            case 'mute':
                switch(reactType) {
                    case 'add':
                        console.log("mute triggered");
                        this.askMute(steamid, staffid, channelid, (message ? message: null));
                        //this.punishLog('**['+steamUsername+'](https://steamcommunity.com/profiles/'+steamid+'/)** was muted by **<@'+staffid+'>** for **1h**. Reason: Message: **'+(message ? message : '-')+'**', steamid)
                        //return this.mute(steamid, (!message ? '-' : message));
                    case 'delete':
                        this.punishLog('**['+steamUsername+'](https://steamcommunity.com/profiles/'+steamid+'/)** has been unmuted by **<@'+staffid+'>**.', steamid)
                        return this.unmute(steamid);
                    default:
                        return;
                }
            case 'ban':
                switch(reactType) {
                    case 'add':
                        this.punishLog(this.i18n.__('bannedBy', {"steamUsername": steamUsername, "steamId": steamid, "staffId": staffid, "muteTime": "1h", "reason": (message ? message : '-')}), steamid)
                        //this.punishLog('**['+steamUsername+'](https://steamcommunity.com/profiles/'+steamid+'/)** was banned by **Staff** for **1h**. Reason: **'+(message ? message : '-')+'**', steamid)
                        return this.ban(steamid, (!message ? '-' : message));
                    case 'delete':
                        this.punishLog(this.i18n.__('unbannedBy', {"steamUsername": steamUsername, "steamId": steamid, "staffId": staffid}), steamid)
                        //this.punishLog('**['+steamUsername+'](https://steamcommunity.com/profiles/'+steamid+'/)** has been unbanned by **<@'+staffid+'>**.', steamid)
                        return this.unban(steamid);
                    default:
                        return;
                }
            case 'kick':
                switch(reactType) {
                    case 'add':
                        this.punishLog(this.i18n.__('kickedBy', {"steamUsername": steamUsername, "steamId": steamid, "staffId": staffid, "reason": (message ? message : '-')}), steamid)
                        //this.punishLog('**['+steamUsername+'](https://steamcommunity.com/profiles/'+steamid+'/)** was kicked by **<@'+staffid+'>**. Reason: **'+(message ? message : '-')+'**', steamid)
                        return this.kick(steamid, (!message ? '-' : message));
                }
            default:
                return;
        }
    }
    async askMute(steamid, staffid, channelid, message) {
        const checkReactionChannel = this.client.channels.cache.find(channel => channel.id === channelid);
        if(checkReactionChannel) {
            const fetchStaff = await this.fetchDiscordUser(staffid);
            await checkReactionChannel.send(this.embed
                .setColor("#2F3136")
                .setDescription("süre seç")
            ).then(async (m) => {
                this.refreshEmbed();
                for (const k of Object.keys(global.emojis.numbers)) {
                    await m.react(global.emojis.numbers[k]).catch(() => { /* */ });
                }
                m.awaitReactions(this.numberFilter, { max: 1, time: 30000, errors: ['time'] })
                    .then(async (collected) => {
                        /*const reaction = collected.first();
                        const action = this.getKeyByValueForSingle(global.emojis, reaction._emoji.id);
                        const message = reaction.message.embeds[0].description.split("\n")[0];
                        const steamid = reaction.message.embeds[0].description.split("\n")[1].split("/")[4];
                        await this.doAction(action, "add", steamid, message, "1337");*/
                    }).catch(() => {})
            }).catch(() => {})
            if(fetchStaff) {
                
            } else {
                this.log("[DISCORD] "+this.i18n.__('discordAnErrorOccurredWhileFetchUser'), "error")
            }
        } else {
            this.log("[DISCORD] "+this.i18n.__('discordReactionChannelNotFound'), "error")
        }
    }
    login() {
        this.log("[DISCORD] "+this.i18n.__('attemptingToConnectDiscord'), "info")
        this.client.login(this.data.botToken).catch((e) => {
            this.log("[DISCORD] "+e.message.slice(0, -1), "error")
            this.log("[DISCORD] "+this.i18n.__('discordProcessTerminated'), "crash")
            process.exit(-1);
        });
    }
    say(message) {
        return this.rcon.run('say "'+message+'"');
    }
    mute(steamid, message) {
        return this.rcon.run('mute '+steamid+' 1h "'+message+'"');
    }
    unmute(steamid) {
        return this.rcon.run('unmute '+steamid);
    }
    ban(steamid, message) {
        return this.rcon.run('banid '+steamid+' 1h "'+message+'"');
    }
    unban(steamid) {
        return this.rcon.run('unban '+steamid);
    }
    kick(steamid, message) {
        return this.rcon.run('kick '+steamid+' "'+message+'"')
    }
    reactionFilter(reaction, user) {
        return Object.values(global.emojis.punishment).includes(reaction.emoji.id);
    }
    numberFilter(reaction, user) {
        return Object.keys(global.emojis.numbers).includes(reaction.emoji.id);
    }
    getKeyByValueForSingle(arr, value) {
        return Object.keys(arr).find(key => arr[key] === value);
    }
    selectGameType(type, msg) {
        switch(type) {
            case 'rust':
                this.rust(msg);
                break;
            default:
                return;
        }
    }
    rust(msg) {
        //msg = (typeof this.fixJSON(msg) != "object" ? JSON.parse(this.fixJSON(msg)) : this.fixJSON(msg));
        if(msg && msg.MaxPlayers) {
            if(msg.Restarting) {
                this.client.user.setActivity(this.i18n.__('serverNameRestarting', {"name": this.data.serverName}));
                this.log('[RCON]['+this.data.rconHost+'] '+this.i18n.__('serverNameRestarting', {"name": this.data.serverName}), "info");
            } else {
                this.log('[RCON]['+this.data.rconHost+'] '+msg.Players+'/'+msg.MaxPlayers+(msg.Queued >= 1 || msg.Joining >= 1 ? ' ('+(msg.Joining >= 1 ? msg.Joining+' '+this.i18n.__('serverJoining') : '')+(msg.Joining >= 1 && msg.Queued >= 1 ? ' ' : '')+(msg.Queued >= 1 ? msg.Queued+' '+this.i18n.__('serverQueue') : '')+')' : ' '+this.i18n.__('serverPlayer')+''+(msg.Players > 1 ? this.i18n.__('serverPlayerPlutal') : '')+''), "info");
                this.client.user.setActivity(msg.Players+'/'+msg.MaxPlayers+(msg.Queued >= 1 || msg.Joining >= 1 ? ' ('+(msg.Joining >= 1 ? msg.Joining+' '+this.i18n.__('serverJoining') : '')+(msg.Joining >= 1 && msg.Queued >= 1 ? ' ' : '')+(msg.Queued >= 1 ? msg.Queued+' '+this.i18n.__('serverQueue') : '')+')' : ' '+this.i18n.__('serverPlayer')+''+(msg.Players > 1 ? this.i18n.__('serverPlayerPlutal') : '')+''));
                setTimeout(() => {
                    this.client.user.setActivity(this.data.serverName+' - '+msg.Map);
                    setTimeout(() => {
                        this.client.user.setActivity(msg.Players+'/'+msg.MaxPlayers+(msg.Queued >= 1 || msg.Joining >= 1 ? ' ('+(msg.Joining >= 1 ? msg.Joining+' '+this.i18n.__('serverJoining') : '')+(msg.Joining >= 1 && msg.Queued >= 1 ? ' ' : '')+(msg.Queued >= 1 ? msg.Queued+' '+this.i18n.__('serverQueue') : '')+')' : ' '+this.i18n.__('serverPlayer')+''+(msg.Players > 1 ? this.i18n.__('serverPlayerPlutal') : '')+''));
                    }, 5*1000)
                }, 5*1000)
            }
        }
    }
    getGuild(guilds) {
        let guildData = false;
        guilds.forEach((k) => {
            if(k['key'] == this.data.guild) {
                guildData = k;
            }
        });
        return guildData;
    }
    strstr(haystack, needle, before_needle) {
        if(haystack.indexOf(needle) >= 0) 
            return before_needle ? haystack.substr(0, haystack.indexOf(needle)) 
                   : haystack.substr(haystack.indexOf(needle));
        return false;
    }
    fixJSON(json) {
        function bulkRegex(str, callback) {
            if(callback && typeof callback === 'function') {
                return callback(str);
            }else if(callback && Array.isArray(callback)){
                for(let i = 0; i < callback.length; i++){
                    if(callback[i] && typeof callback[i] === 'function'){
                        str = callback[i](str);
                    }else{break;}
                }
                return str;
            }
            return str;
        }
        if(json && json !== ''){
            if(typeof json !== 'string'){
                try{
                    json = JSON.stringify(json);
                }catch(e){return false;}
            }
            if(typeof json === 'string'){
                json = bulkRegex(json, false, [
                    str => str.replace(/[\n\t]/gm, ''),
                    str => str.replace(/,\}/gm, '}'),
                    str => str.replace(/,\]/gm, ']'),
                    str => {
                        str = str.split(/(?=[,\}\]])/g);
                        str = str.map(s => {
                            if(s.includes(':') && s){
                                let strP = s.split(/:(.+)/, 2);
                                strP[0] = strP[0].trim();
                                if(strP[0]){
                                    let firstP = strP[0].split(/([,\{\[])/g);
                                    firstP[firstP.length-1] = bulkRegex(firstP[firstP.length-1], false, p => p.replace(/[^A-Za-z0-9\-_]/, ''));
                                    strP[0] = firstP.join('');
                                }
                                let part = strP[1].trim();
                                if((part.startsWith('"') && part.endsWith('"')) || (part.startsWith('\'') && part.endsWith('\'')) || (part.startsWith('`') && part.endsWith('`'))){
                                    part = part.substr(1, part.length - 2);
                                }
                                part = bulkRegex(part, false, [
                                    p => p.replace(/(["])/gm, '\\$1'),
                                    p => p.replace(/\\'/gm, '\''),
                                    p => p.replace(/\\`/gm, '`'),
                                ]);
                                strP[1] = ('"'+part+'"').trim();
                                s = strP.join(':');
                            }
                            return s;
                        });
                        return str.join('');
                    },
                    str => str.replace(/(['"])?([a-zA-Z0-9\-_]+)(['"])?:/g, '"$2":'),
                    str => {
                        str = str.split(/(?=[,\}\]])/g);
                        str = str.map(s => {
                            if(s.includes(':') && s){
                                let strP = s.split(/:(.+)/, 2);
                                strP[0] = strP[0].trim();
                                if(strP[1].includes('"') && strP[1].includes(':')){
                                    let part = strP[1].trim();
                                    if(part.startsWith('"') && part.endsWith('"')){
                                        part = part.substr(1, part.length - 2);
                                        part = bulkRegex(part, false, p => p.replace(/(?<!\\)"/gm, ''));
                                    }
                                    strP[1] = ('"'+part+'"').trim();
                                }
                                s = strP.join(':');
                            }
                            return s;
                        });
                        return str.join('');
                    },
                ]);
                try{
                    json = JSON.parse(json);
                }catch(e){return false;}
            }
            return json;
        }
        return false;
    }
}

module.exports = XARust