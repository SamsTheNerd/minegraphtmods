import * as https from 'node:https';
import * as fsp from 'node:fs/promises';

import {Mod} from './mod'

const fs = require('fs');

function downloadImage(url: string, filepath: string) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode === 200) {
                res.pipe(fs.createWriteStream(filepath))
                    .on('error', reject)
                    .once('close', () => resolve(filepath));
            } else {
                // Consume response data to free up memory
                res.resume();
                reject(new Error(`Request Failed With a Status Code: ${res.statusCode}`));
            }
        });
    });
}

var ALL_MODS = Mod.getAllMods()

var getImgForIdx = async (idx: number = 0) => {
    var modid = ALL_MODS[idx]
    var mod = Mod.getMod(modid)
    if(!modid){
        if(idx < ALL_MODS.length){
            getImgForIdx(idx+3)
        }
        return;
    }
    var cfm = await mod.getCFMeta();
    var filePath = `./data/images/${modid}.png`
    if(!fs.existsSync(filePath)){
        console.log(`Getting icon for ${cfm.name}: ${cfm.logoUrl} -- ${Math.floor(100 * idx / ALL_MODS.length)}%`)
        if(cfm.logoUrl)
            await downloadImage(cfm.logoUrl, filePath)
    }
    if(idx < ALL_MODS.length){
        getImgForIdx(idx+3)
    }
}

getImgForIdx()
getImgForIdx(1)
getImgForIdx(2)