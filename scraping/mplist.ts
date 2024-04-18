import * as https from 'node:https';
import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';

import {Mod} from './mod'

// list of modpacks that the given mod is in
export class MPList {

    cfid: number;
    mpIds: number[] = [] // mpi ids since that's all we need i think

    constructor(_cfid: number = null, _mpIds: number[] = null){
        this.cfid = _cfid;
        this.mpIds = _mpIds;
    }

    static fromDisk(_cfid: number, path = "./data"): Promise<MPList> {
        return fsp.readFile(`${path}/mplists/${_cfid}.json`, { encoding: 'utf8' }).then((fileData) => {
            return Object.assign(new MPList(_cfid), {mpIds: JSON.parse(fileData)});
        })
    }

    saveToDisk(path = "./data"){
        return fsp.mkdir(`${path}/mplists/`, {recursive: true}).then(() =>
            fsp.writeFile(`${path}/mplists/${this.cfid}.json`, JSON.stringify(this.mpIds))
        )
    }

    // just to move it out of Mod. 
    static async fetchPacks(_cfid: number, page: number = 1, mpiId:number = null): Promise<MPList>{
        if(mpiId == null){
            mpiId = await Mod.getMod(_cfid).getCFMeta().then((cfm) => cfm.getMpiId())
        }
        return new Promise((resolve) => {
            var url = `https://www.modpackindex.com/api/v1/mod/${mpiId}/modpacks?limit=100&page=${page}`
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
                        var mpCount:number = resData.meta.total
                        var pageCount = Math.ceil(mpCount / 100.0)
                        var pageOneMPL = new MPList(_cfid, resData.data.flatMap((mpData: any) => {
                            // if(mpData.curse_info != null)
                            //     return mpData.curse_info.curse_id
                            return mpData.id
                        }))
                        if(page == 1 && pageCount > 1){
                            var moreProms: [Promise<MPList>] = <[Promise<MPList>]><unknown> []
                            for(var p = 2; p <= Math.min(pageCount, 20); p++){
                                moreProms.push(MPList.fetchPacks(_cfid, p, mpiId))
                            }
                            Promise.all(moreProms).then((mpls) => {
                                mpls.push(pageOneMPL)
                                resolve(new MPList(_cfid, [... new Set(mpls.flatMap(mpl => mpl.mpIds))]))
                            })
                        } else {
                            resolve(pageOneMPL)
                        }
                    })
                }
            ).end()
        })
    }
}
