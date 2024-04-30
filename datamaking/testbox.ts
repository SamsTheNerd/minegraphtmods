// const USER_VIEW: { [key: string]:number[] } = require('../computedData/USER_VIEW.json')

// console.log(Object.keys(USER_VIEW).length)

import {Mod} from '../scraping/mod'

var ALL_MODS = Mod.getAllMods()

var test = async () => {
    
    var BIG_MODS: Mod[] = []
    var PACK_COUNT = 0
    
    var finisher: Promise<void>[] = []
    
    for(var modid of ALL_MODS){
        var mod = Mod.getMod(modid);
        finisher.push(mod.getModpacks().then((mpi) => {
            PACK_COUNT += mpi.mpIds.length
            if(mpi.mpIds.length == 2000){
                BIG_MODS.push(mod);
            }
        }))
    
    }
    
    await Promise.all(finisher);
    
    console.log(`${BIG_MODS.length} big mods`)
    console.log(`${PACK_COUNT/(ALL_MODS.length)} average modpack count`)
}

test();