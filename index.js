const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 60001 });
const snoowrap = require('snoowrap');
const apiKey = require('./Dependencies/RedditAPI.json');
const redditAPI = new snoowrap({
    userAgent: 'my user-agent',
    clientId: apiKey.clientId,
    clientSecret: apiKey.clientSecret,
    username: apiKey.username,
    password: apiKey.password
});
const RiotAPIKey = require('./Dependencies/RiotAPIKey.json'); //Has RiotAPIKey under RiotAPIKey.key
let LeagueAPI = require('leagueapiwrapper');
LeagueAPI = new LeagueAPI(RiotAPIKey.key, Region.EUW);
const osu = require('node-osu');
const osuAPIKey = require('./Dependencies/osuAPIKey.json'); //Has APIKey under osuAPIKEY.key
const osuAPI = new osu.Api(osuAPIKey.key, {
    // baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
    notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
    completeScores: true, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
    parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
});

wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
        console.log(message);
        let contentArgs = message.split(" "); //Split Message for simpler Access
        switch (contentArgs[0]) {
            case 'RedditAPI':
                redditAPI.getSubreddit(contentArgs[1]).getRandomSubmission().then(submission => {
                    ws.send(JSON.stringify(submission));
                }).catch(error => {
                    ws.send('ERROR');
                    console.log(error);
                });
                break;

            case 'LeagueAPI':
                name = message.substring(contentArgs[0].length+1);

                LeagueAPI.getSummonerByName(name)
                    .then(async function (accountObject) {
                        return await LeagueAPI.getActiveGames(accountObject);

                    }).catch()
                    .then(function (activeGames) {
                        ws.send(JSON.stringify(activeGames));
                    })
                    .catch(error => {
                        ws.send('ERROR');
                        console.log(error);
                    });

                break;

            case 'osuAPI':

            name = message.substring(message.indexOf(' ')+1);
            name = name.substring(name.indexOf(' ')+1);

                switch (contentArgs[1]) {

                    case 'plays':
                        osuAPI.getUserBest({ u: name }).then(
                            scores => {
                                var AccArray = [];
                                for (let s of scores) {
                                    AccArray.push(s.accuracy);
                                }

                                ws.send(JSON.stringify([scores,AccArray]));
                            }).catch((error) => {
                                ws.send('ERROR');
                                console.log(error);
                            });
                        break;

                    case 'recent':
                        osuAPI.getUserRecent({ u: name }).then( //osuAPI-Call
                            result => {
                                ws.send(JSON.stringify([result[0],parseMods(result[0].mods),result[0].accuracy]));
                            }
                        ).catch((error) => {
                            ws.send('ERROR');
                            console.log(error);
                        });
                        break;
                }
                break;
        }
    });
});

function parseMods(mods) {
    let result = "";
    for (let x = 0; x < mods.length; x++) {

        if (mods[x] != 'FreeModAllowed' && mods[x] != 'ScoreIncreaseMods') {
            result += mods[x] + ',';
        }
    }

    result = result.substring(0, result.length - 1);
    return result;
}