import * as https from 'node:https';
import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';

import {CFMeta} from './cfmeta'
import {MPList} from './mplist'
import {Modpack} from './modpack'
import {Mod} from './mod'


// SO, due to errors in the modpack fetching, it didn't fetch the last page of modpacks. it also didn't store the first page if there were multiple pages.
// so any mod with multiple of 100 packs probably had its last cut off. additionally, every mod with actually 101-199 packs will only show as having 1-99, which makes it indistinguishable from mods with actually 1-99 packs. 

// plan is to loop through all the mpls, delete any with 1-99 packs - since we'll need to refetch these anyways.
// then anything with less than 1000 modpacks we refetch their first page 

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
    if(modid && !mod.hasModpacks()){
        console.log(`Getting packs for ${modid}`)
        mod.getCFMeta().then(cfm => {
            mod.getModpacks().then((mps) => {
                mod.saveToDisk()
                console.log(`got ${mps.mpIds.length} packs for ${cfm.name} (${modid}) -- ${Math.floor(100 * idx / ALL_MODS.length)}% (${idx} / ${ALL_MODS.length})`)
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