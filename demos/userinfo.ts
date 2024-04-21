import * as readline from 'node:readline';
import { Mod } from '../scraping/mod';


var USER_VIEW: { [key: string]:number[] } = require('../computedData/USER_VIEW.json')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

var doUserInfo = () => {
    rl.question(`Input a github username (capitalization matters):\n`, async (user) => {
        if(!USER_VIEW.hasOwnProperty(user)){
            console.log(`user "${user}" not found in the dataset (could be a typo - check caps again or check the USER_VIEW.json to see if you're in there)\n`)
        } else {
            var modids = USER_VIEW[user]
            var ghds = await Promise.all(modids.map((modid) => {
                var mod = Mod.getMod(modid)
                return mod.getGHData();

                // console.log(`activity on ${cfm.name}`)
            }))
            ghds.sort((a, b) => b.numInteractions(user) - a.numInteractions(user))
            for(var ghd of ghds){
                var cfm = await Mod.getMod(ghd.cfid).getCFMeta();
                console.log(`${ghd.numInteractions(user)} interactions on ${cfm.name}`)
            }
        }
        doUserInfo()
    });
}

doUserInfo()