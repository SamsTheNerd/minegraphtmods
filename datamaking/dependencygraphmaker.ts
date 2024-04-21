import * as https from 'node:https';
import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';

import {CFMeta} from '../scraping/cfmeta'
import {MPList} from '../scraping/mplist'
import {Modpack} from '../scraping/modpack'
import {Mod} from '../scraping/mod'

var ALL_MODS = Mod.getAllMods()

var make = async () => {
    var edgeList: string[] = []
    

    for (var modid of ALL_MODS){
        var mod = Mod.getMod(modid);
        var cfm = await mod.getCFMeta();
        for( var depid in cfm.dependencies){
            edgeList.push(`${modid} ${depid} ${cfm.dependencies[depid]}`)
        }
    }
    
    fs.writeFileSync(`./computedData/dependency_graph.data`, edgeList.join('\n'))
}

make()