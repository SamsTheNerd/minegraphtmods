import * as https from 'node:https';
import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';

var SECRETS = require('../secrets.json')

import {CFMeta} from './cfmeta'
import {MPList} from './mplist'
import {Modpack} from './modpack'
import {GHData} from './ghdata'


var MOD_CACHE: { [key:string]:Mod; } = {}

// gave an invalid mod id somehow
var INVALID_MOD_SET: { [key:string]: any } = {}

// Mod class will act as a wrapper for everything else
class Mod {
    cfid: number;

    #cfMetaPromise: Promise<CFMeta>;
    #mpListPromise: Promise<MPList>;
    #ghDataPromise: Promise<GHData>;

    #cfDirty = false;
    #mplDirty = false;
    #ghdDirty = false;

    // use getMod() instead of this
    constructor(_cfid:number){
        this.cfid = _cfid
    }

    static getMod(_cfid: number): Mod {
        // first check if we have it cached
        if(!MOD_CACHE.hasOwnProperty(_cfid)){
            MOD_CACHE[_cfid] = new Mod(_cfid);
        }
        return MOD_CACHE[_cfid]
    }

    isNew(): boolean{
        if(this.#cfMetaPromise != undefined){
            return false;
        }
        return !fs.existsSync(`./data/cfmeta/${this.cfid}.json`)
    }

    hasModpacks(): boolean{
        if(this.#mpListPromise != undefined){
            return true;
        }
        return fs.existsSync(`./data/mplists/${this.cfid}.json`)
    }

    hasGHData(): boolean{
        if(this.#ghDataPromise != undefined){
            return true;
        }
        return fs.existsSync(`./data/ghdata/${this.cfid}.json`)
    }

    getCFMeta(): Promise<CFMeta> {
        if(this.#cfMetaPromise != undefined){
            return this.#cfMetaPromise;
        }
        if(INVALID_MOD_SET.hasOwnProperty(this.cfid)){
            return Promise.reject("couldnt find mod");
        }
        // check for it in data folder
        this.#cfMetaPromise = CFMeta.fromDisk(this.cfid).catch(
            // if it can't read from disk, fetch it
            () => new Promise((resolve) => {
            // https.request(`https://api.curseforge.com/v1/mods/695890`,
            // console.log(`https://api.curseforge.com/v1/mods/${this.cfid}`)
            https.request(`https://api.curseforge.com/v1/mods/${this.cfid}`,
                {
                    method: 'GET',
                    headers: {
                        "x-api-key": SECRETS.cf
                    }
                }, (res) => {
                    var data = ''
                    res.on('data', (chunk) => {
                        data += chunk
                        // console.log(`BODY: ${chunk}\n\n`);
                      });
                    res.on('end', () => {
                        var resData = JSON.parse(data)['data']
                        // mod.#cfmeta = new CFMeta(resData)
                        // console.log(JSON.stringify(mod.cfmeta))
                        this.#cfDirty = true;
                        resolve(new CFMeta(resData))
                    })
                }
            ).end()
        }))
        // fetch the data
        return this.#cfMetaPromise;
    }

    async getGHRepo(){
        var cfm = await this.getCFMeta()
        return GHData.parseUrl(cfm.sourceLink)
    }

    getModpacks(): Promise<MPList> {
        if(this.#mpListPromise != undefined){
            return this.#mpListPromise;
        }
        if(INVALID_MOD_SET.hasOwnProperty(this.cfid)){
            return Promise.reject("couldnt find mod");
        }
        // check for it in data folder
        this.#mpListPromise = MPList.fromDisk(this.cfid).catch(() => {
            // if it can't read from disk, fetch it
            var fetchPromise = this.getCFMeta().then(cfm => {
                return cfm.getMpiId().then((_mfiId) => {
                    return MPList.fetchPacks(this.cfid, 1, _mfiId);
                })
            });
            fetchPromise.then(() => {
                this.#mplDirty = true;
            })
            return fetchPromise;
        })
        // fetch the data
        return this.#mpListPromise;
    }

    getGHData(): Promise<GHData> {
        if(this.#ghDataPromise != undefined){
            return this.#ghDataPromise;
        }
        if(INVALID_MOD_SET.hasOwnProperty(this.cfid)){
            return Promise.reject("couldnt find mod");
        }
        // check for it in data folder
        this.#ghDataPromise = GHData.fromDisk(this.cfid).catch(() => {
            // if it can't read from disk, fetch it
            var fetchPromise = this.getCFMeta().then(cfm => {
                return GHData.fetchGHData(this.cfid);
            });
            fetchPromise.then(() => {
                this.#ghdDirty = true;
            })
            return fetchPromise;
        })
        // fetch the data
        return this.#ghDataPromise;
    }

    async saveToDisk(){
        if(this.#cfDirty){
            this.#cfDirty = false;
            this.getCFMeta().then(cfm => cfm.saveToDisk())
        }
        if(this.#mplDirty){
            this.#mplDirty = false;
            this.getModpacks().then(mpl => mpl.saveToDisk())
        }
        if(this.#ghdDirty){
            this.#ghdDirty = false;
            this.getGHData().then(ghd => ghd.saveToDisk())
        }
    }
}

async function test(){
    var gloop = Mod.getMod(897558)
    var hex = Mod.getMod(569849); 
    // console.log(gloop)
    await gloop.getCFMeta().then(cfm => {
        cfm.getMpiId();
    })
    await hex.getCFMeta().then(async cfm => {
        // console.log(cfm);
        // console.log(await cfm.getMpiId())
    });
    // console.log(await hex.getCFMeta());
    // console.log(await gloop.getCFMeta());
    // (await gloop.getCFMeta()).saveToDisk();
    // console.log(await gloop.getModpacks())
    // console.log(await hex.getModpacks());
    // await gloop.getModpacks()
    var hexmp0mods = await (hex.getModpacks().then(mpl => {
        // console.log(mpl)
        return Modpack.getModpack(mpl.mpIds[0])
    }));
    // console.log(hexmp0mods)
    // gloop.saveToDisk();
    // hex.saveToDisk();
}

// console.log(SECRETS.cf)

// test()

export {
    Mod
}