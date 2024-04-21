import * as https from 'node:https';
import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';

import {CFMeta} from '../scraping/cfmeta'
import {MPList} from '../scraping/mplist'
import {Modpack} from '../scraping/modpack'
import {Mod} from '../scraping/mod'

var ALL_MODS = Mod.getAllMods()

var USER_VIEW: { [key: string]: number[] } = {};

var makeUserView = async () => {

    var count = 0;
    var zeroCount = 0;

    for(var modid of ALL_MODS){
        var mod = Mod.getMod(modid)
        var ghd = await mod.getGHData()
        if(Object.keys(ghd.interactions).length == 0){
            zeroCount++
        }
        for(var user in ghd.interactions){
            if(!USER_VIEW.hasOwnProperty(user)){
                USER_VIEW[user] = []
            }
            USER_VIEW[user].push(modid)
        }
        count++;
    }

    console.log(`parsed ${count}/${ALL_MODS.length} mod interactions`);
    console.log(`${zeroCount} mods had no interactions (or no github found)`)
    fs.writeFileSync(`./computedData/USER_VIEW.json`, JSON.stringify(USER_VIEW))

}

makeUserView();