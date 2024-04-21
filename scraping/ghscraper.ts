import * as https from 'node:https';
import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';

import {Mod} from './mod'
import { GHData, octokit} from './ghdata';

var getAllMods = (): number[] => {
    return fs.readdirSync("./data/cfmeta", {
        encoding: "utf-8"
    }).map(fileName => {
        try{
            return Number(fileName.replace(".json", ""))
        } catch (err){
            console.log(`couldn't read file ${fileName}`)
            return -1;
        }
    }).filter((val) => val != -1)
}


// getAllMods().forEach(modid => {
//     var mod = Mod.getMod(modid)
//     if(!mod.hasModpacks()){
//         console.log(`Getting packs for ${modid}`)
//         mod.getCFMeta().then(cfm => {
//             mod.getModpacks().then((mps) => {
//                 console.log(`got packs for ${cfm.name} (${modid})`)
//             })
//         })
//     } else {
//         console.log(`Already had packs for ${modid}`)
//     }
// })

var SOURCE_LOOKUP: { [key: string]: number } = {}

var ALL_MODS = getAllMods();
var getPacksForIdx = async (idx: number = 0) => {
    var modid = ALL_MODS[idx]
    var mod = Mod.getMod(modid)
    if(!modid){
        if(idx < ALL_MODS.length){
            getPacksForIdx(idx+1)
        }
        return;
    }
    var cfm = await mod.getCFMeta();
    if(SOURCE_LOOKUP.hasOwnProperty(cfm.sourceLink) && cfm.sourceLink != null){
        console.log(`wow, saving time reusing that source lookup for ${cfm.name} !!`)
        await GHData.copyData(SOURCE_LOOKUP[cfm.sourceLink], modid)
    } else {
        SOURCE_LOOKUP[cfm.sourceLink] = modid;
    }
    if(!mod.hasGHData()){
        console.log(`Getting github data for ${cfm.name} ( ${modid} | ${cfm.sourceLink} )`)
        var ghd = await mod.getGHData();
        if(ghd == null){
            console.log(`\t-> No GitHub data for ${cfm.name} ( ${modid} | ${cfm.sourceLink} )\n`)
        } else {
            console.log(`\t-> Got ${Object.keys(ghd.interactions).length} users for ${cfm.name} ( ${modid} | ${cfm.sourceLink} )`) 
            console.log(`\t-> ${Math.floor(100 * idx / ALL_MODS.length)}% (${idx+1} / ${ALL_MODS.length})`)
            console.log()
            mod.saveToDisk()
        }
    }
    if(idx < ALL_MODS.length){
        getPacksForIdx(idx+1)
    }
}

getPacksForIdx()