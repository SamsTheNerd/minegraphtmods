import * as https from 'node:https';
import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';

import {CFMeta} from './cfmeta'
import {MPList} from './mplist'
import {Modpack} from './modpack'
import {Mod} from './mod'

var MOD_LOADING_QUEUE: number[];
var MODPACK_LOADING_QUEUE: number[];

var mqDirty = false;
var mpqDirty = false;

var loadQueues = () => {
    console.log("Loading Queues")
    var mqStr = fs.readFileSync("./state/mod_queue.json", {
        encoding: 'utf-8'
    })
    MOD_LOADING_QUEUE = JSON.parse(mqStr);
    mqDirty = false;

    var mpqStr = fs.readFileSync("./state/mp_queue.json", {
        encoding: 'utf-8'
    })
    MODPACK_LOADING_QUEUE = JSON.parse(mpqStr);
    mpqDirty = false;
}

var saveQueues = () => {
    if(mqDirty){
        fs.writeFileSync("./state/mod_queue.json", JSON.stringify(MOD_LOADING_QUEUE));
        mqDirty = false;
    }
    if(mpqDirty){
        fs.writeFileSync("./state/mp_queue.json", JSON.stringify(MODPACK_LOADING_QUEUE));
        mpqDirty = false;
    }
}

// scrapes the next modpack
var scrapePack = ():Promise<void> => {
    console.log(`shifting mp queue: ${MODPACK_LOADING_QUEUE.length}`)
    var nextPackId = MODPACK_LOADING_QUEUE.shift()
    mpqDirty = true;
    if(!nextPackId) return Promise.reject();
    console.log(`Scraping pack ${nextPackId}`)
    return Modpack.getModpack(nextPackId).then((mp) => {
        console.log(`Scraped pack ${nextPackId}`)
        mp.modIds.forEach((modId) => {
            if(Mod.getMod(modId).isNew()){
                MOD_LOADING_QUEUE.push(modId);
                // console.log(`Added mod ${modId} to queue`)
                mqDirty = true;
            }
        })
        // just keep going i guess ? 
        if(MOD_LOADING_QUEUE.length == 0 && MODPACK_LOADING_QUEUE.length > 0){
            return scrapePack();
        }
        return;
    })
}

var modsScraped = 0;

var scrape = (modLimit = 100, modDepth = 0) => {
    if(modDepth > modLimit){
        return;
    }
    var packPromise;
    if(MOD_LOADING_QUEUE.length == 0 && MODPACK_LOADING_QUEUE.length > 0){
        // need to refill the mod loading queue with new mods from the modpack queue
        packPromise = scrapePack()
    } else {
        packPromise = Promise.resolve();
    }
    packPromise.then(() => {
        var nextModId = MOD_LOADING_QUEUE.shift()
        mqDirty = true;
        if(!nextModId) return;
        console.log(`Scraping mod ${nextModId}`)
        var nextMod = Mod.getMod(nextModId);
        nextMod.getCFMeta().then((cfm) => {
            if(!cfm.isAvailable()){
                saveQueues();
                scrape(modLimit, modDepth+1)
            } else {
                nextMod.getModpacks().then(async (mpl) => {
                    nextMod.saveToDisk();
                    console.log(`Scraped ${(await nextMod.getCFMeta()).name} (${nextModId})`)
                    modsScraped++;
                    mpl.mpIds.forEach((pack) => {
                        if(!Modpack.hasData(pack) && !MODPACK_LOADING_QUEUE.includes(pack)){
                            // console.log(`Added pack ${pack} to queue`)
                            MODPACK_LOADING_QUEUE.push(pack);
                            mpqDirty = true;
                        }
                    })
                    saveQueues();
                    scrape(modLimit, modDepth+1);
                })
            }
        })
    })
}

loadQueues()
scrape(1)