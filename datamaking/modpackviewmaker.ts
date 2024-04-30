import * as https from 'node:https';
import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';

import {CFMeta} from '../scraping/cfmeta'
import {MPList} from '../scraping/mplist'
import {Modpack} from '../scraping/modpack'
import {Mod} from '../scraping/mod'

var ALL_MODS = Mod.getAllMods()

var MP_VIEW: { [key: string]: number[] } = {};

var makeMPView = () => {

    var count = 0;
    var zeroCount = 0;
    var mpCount = 0;

    var adderMods: { [key:number]: boolean} = {}

    var modproms: Promise<any>[] = []

    for(let modid of ALL_MODS){
        let mod = Mod.getMod(modid)
        modproms.push(mod.getModpacks().then((mpl) => {
            if(Object.keys(mpl.mpIds).length == 0){
                zeroCount++
            }
            var addedAny = false;
            for(var mp of mpl.mpIds){
                if(!MP_VIEW.hasOwnProperty(mp)){
                    MP_VIEW[mp] = []
                    mpCount++;
                    adderMods[mod.cfid] = true;
                    addedAny = true;
                    // console.log(mod.cfid)
                }
                MP_VIEW[mp].push(mod.cfid)
            }
            count++;
            return addedAny;
        }))
    }

    Promise.all(modproms).then((res) => {
        // console.log(res)
        // console.log(Object.keys(adderMods))
        console.log(`parsed ${count}/${ALL_MODS.length} mods`);
        console.log(`found ${mpCount} packs`)
        console.log(`${zeroCount} mods had no modpacks`)
        fs.writeFileSync(`./computedData/MP_VIEW.json`, JSON.stringify(MP_VIEW))
    })

}

makeMPView();