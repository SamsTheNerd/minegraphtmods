import * as fs from 'node:fs';

import {Mod} from '../scraping/mod'

const USER_VIEW: { [key: string]:number[] } = require('../computedData/USER_VIEW.json')
const USER_COUNT = Object.keys(USER_VIEW).length

// var make = async () => {
//     var edgeList: string[] = []
    

//     for (var i = 0; i < ALL_MODS.length; i++){
//         var modidI = ALL_MODS[i];
//         var modI = Mod.getMod(modidI)
//         var cfmI = await modI.getCFMeta()
//         var ghdI = await modI.getGHData()
//         for (var j = i+1; j < ALL_MODS.length; j++){
//             var modidJ = ALL_MODS[j];
//             var modJ = Mod.getMod(modidJ)
//             var ghdJ = await modJ.getGHData()
//             var commonUsers = Object.keys(ghdI.interactions).filter(user => Object.keys(ghdJ.interactions).includes(user))
//             for(var user of commonUsers){
//                 edgeList.push(`${modidI} ${modidJ} {'weight':${ghdI.numInteractions(user) + ghdJ.numInteractions(user)}, 'user': '${user}'}`)
//             }
//         }
//         console.log(`Finished ${cfmI.name} -- ${Math.floor(100 * i / ALL_MODS.length)}%`)
//     }
    
//     fs.writeFileSync(`./computedData/mc_gh_graph.data`, edgeList.join('\n'))
// }

var edgeList: string[] = []

var makeForUser = async (user: string) => {
    var userInteractions = await Promise.all(USER_VIEW[user].map(async (modid) => {
        var ghd = await Mod.getMod(modid).getGHData()
        return ghd.numInteractions(user)
    }))
    const userrepos = USER_VIEW[user];
    for(var i = 0; i < userrepos.length; i++){
        for(var j = i+1; j < userrepos.length; j++){
            edgeList.push(`${userrepos[i]} ${userrepos[j]} {'weight':${userInteractions[i] + userInteractions[j]}, 'user': '${user}'}`)
        }
    }
}

var make = async () => {
    var count = 0;
    var userproms: Promise<void>[] = []
    for(var user in USER_VIEW){
        var uprom = makeForUser(user).then(()=>{
            count++
            if(count % 100 == 0){
                console.log(`${Math.floor(100 * count / USER_COUNT)}% (${count} / ${USER_COUNT})`)
            }
        })
        userproms.push(uprom)
    }
    await Promise.all(userproms)
    fs.writeFileSync(`./computedData/mc_gh_graph.data`, edgeList.join('\n'))
}

make()