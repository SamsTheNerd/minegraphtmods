import * as fs from 'node:fs';
import * as os from 'node:os';

import {Mod} from '../scraping/mod'

const MP_VIEW: { [key: string]:number[] } = require('../computedData/MP_VIEW.json')
const MP_COUNT = Object.keys(MP_VIEW).length

var weightMap: Map<string, number> = new Map()

var addWeight = (modA: number, modB: number) => {
    var key = ""
    if(modA > modB){
        key = `${modB} ${modA}`
    } else {
        key = `${modA} ${modB}`
    }
    weightMap.set(key, 1 + (weightMap.get(key) || 0))
    // if(!weightMap.hasOwnProperty(key)){
    //     weightMap[key] = 0
    // }
}

var edgeList: string[] = []

var mpCounts: { [key: string]: number} = {}

var getMPCount = async (modid: string) => {
    if(!mpCounts.hasOwnProperty(modid)){
        var mps = await Mod.getMod(Number.parseInt(modid)).getModpacks()
        mpCounts[modid] = mps.mpIds.length;
    }
    return mpCounts[modid]
}

var makeForMP = (mp: string) => {
    // var common = await Promise.all(MP_VIEW[mp].map(async (modid) => {
    //     var mpl = (await Mod.getMod(modid).getModpacks()).mpIds
    //     return mpl
    // }))
    const modsInPack = MP_VIEW[mp];
    var mpInt = Number.parseInt(mp);
    // console.log(`Making for modpack ${mp} with ${modsInPack.length} mods`)
    for(var i = 0; i < modsInPack.length; i++){
        // let modI = Mod.getMod(modsInPack[i])
        // var mplI = await (await modI.getModpacks()).mpIds
        for(var j = i+1; j < modsInPack.length; j++){
            // let modJ = Mod.getMod(modsInPack[j])
            // var mplJ = await (await modJ.getModpacks()).mpIds
            // edgeList.push(`${modsInPack[i]} ${modsInPack[j]} {'weight':${mpInteractions[i] + mpInteractions[j]}, 'mp': '${mp}'}`)
            // console.log(`${modsInPack[i]},  ${modsInPack[j]}`)
            // if(mpInt >= 75548 && mpInt <= 75550){
            //     console.log(`on mp ${mp} adding weight between ${modsInPack[i]} & ${modsInPack[j]} (${i}, ${j})`)
            // }
            addWeight(modsInPack[i], modsInPack[j]);
        }
    }
    // console.log(`FINISHED ${mp}`)
}

var make = () => {
    var count = 0;
    // var mpproms: Promise<void>[] = []
    for(var mp in MP_VIEW){
        // let uprom = makeForMP(mp).then(()=>{
            makeForMP(mp);
            count++
            if(count % 100 == 0){
                console.log(`${Math.floor(100 * count / MP_COUNT)}% (${count} / ${MP_COUNT})`)
            }
            // console.log(`${Math.floor(100 * count / MP_COUNT)}% (${count} / ${MP_COUNT})`)
        // })
        // mpproms.push(uprom)
    }
    // await Promise.all(mpproms)
    // fs.writeFileSync(`./computedData/mc_mp_graph.data`, edgeList.join('\n'))
    var edgeMaker = async () => {
        var edges: string[] = [];
        for(const [key, value] of weightMap.entries()){
            var keyMods = key.split(' ');
            edges.push(`${key} ${value / Math.min(await getMPCount(keyMods[0]), await getMPCount(keyMods[1]))}`)
        }
        fs.writeFileSync(`./computedData/mc_mp_graph_flat.data`, edges.join('\n'))
    }
    edgeMaker();
}

console.log(MP_COUNT)

make()