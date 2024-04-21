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

var ALL_MODS = getAllMods();
var getPacksForIdx = (idx: number = 0) => {
    var modid = ALL_MODS[idx]
    var mod = Mod.getMod(modid)
    if(modid && !mod.hasGHData()){
        mod.getCFMeta().then(cfm => {
            console.log(`Getting github data for ${cfm.name} ( ${modid} | ${cfm.sourceLink} )`)
            mod.getGHData().then((ghd) => {
                if(ghd == null){
                    console.log(`\t-> No GitHub data for ${cfm.name} ( ${modid} | ${cfm.sourceLink} )\n`)
                } else {
                    mod.saveToDisk()
                    console.log(`\t-> Got ${Object.keys(ghd.interactions).length} users for ${cfm.name} ( ${modid} | ${cfm.sourceLink} )`) 
                    console.log(`\t-> ${Math.floor(100 * idx / ALL_MODS.length)}% (${idx+1} / ${ALL_MODS.length})`)
                    console.log()
                }
                if(idx < ALL_MODS.length){
                    getPacksForIdx(idx+1)
                }
            })
        })
    } else {
        if(idx < ALL_MODS.length){
            getPacksForIdx(idx+1)
        }
    }
}

getPacksForIdx()