import * as https from 'node:https';
import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';

import {CFMeta} from './cfmeta'
import {MPList} from './mplist'
import {Mod} from './mod'

var MODPACK_CACHE: { [key:string]:Promise<Modpack>; } = {}

export class Modpack{
    mpiId: number;
    modIds: number[] = [] // cf ids

    constructor(_mpiId: number, _modIds: number[] = []){
        this.mpiId = _mpiId;
        this.modIds = _modIds;
    }

    static #fromDisk(_mpiId: number, path = "./data"): Promise<Modpack> {
        return fsp.readFile(`${path}/modpacks/${_mpiId}.json`, { encoding: 'utf8' }).then((fileData) => {
            return Object.assign(new Modpack(_mpiId), {modIds: JSON.parse(fileData)});
        })
    }

    #saveToDisk(path = "./data"){
        return fsp.mkdir(`${path}/modpacks/`, {recursive: true}).then(() =>
            fsp.writeFile(`${path}/modpacks/${this.mpiId}.json`, JSON.stringify(this.modIds))
        )
    }

    // this will fetch all the mods in the modpack and save it
    static getModpack(_mpiId: number): Promise<Modpack>{
        if(!MODPACK_CACHE.hasOwnProperty(_mpiId)){
            // check for it in data folder
            MODPACK_CACHE[_mpiId] = Modpack.#fromDisk(_mpiId).catch(() => {
                // if it can't read from disk, fetch it
                var fetchPromise = Modpack.#fetchMods(_mpiId)
                fetchPromise.then((mp) => {
                    mp.#saveToDisk()
                })
                return fetchPromise;
            })
        }
        return MODPACK_CACHE[_mpiId]
    }

    static async #fetchMods(mpiId: number): Promise<Modpack>{
        return new Promise((resolve) => {
            var url = `https://www.modpackindex.com/api/v1/modpack/${mpiId}/mods`
            https.request(url,
                {
                    method: 'GET',
                }, (res) => {
                    var data = ''
                    res.on('data', (chunk) => {
                        data += chunk
                      });
                    res.on('end', () => {
                        // console.log(data)
                        var resData;
                        try{
                            resData = JSON.parse(data)
                        } catch(err) {
                            // console.log(data)
                            console.log(`err in fetchPacks: \n${url}`)
                            throw err;
                        }
                        resolve(new Modpack(mpiId, resData.data.flatMap((modData: any) => {
                            if(modData.curse_info != null)
                                return modData.curse_info.curse_id
                        })))
                    })
                }
            ).end()
        })
    }
}