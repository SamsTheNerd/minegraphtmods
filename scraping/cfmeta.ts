import * as https from 'node:https';
import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';

// curseforge metadata used for mods and modpacks
export class CFMeta {
    id: number;
    name: string;
    slug: string;

    // don't access this directly, use #getMpiId
    mpiId: number = undefined; 
    #fetchPromise: Promise<number>;

    sourceLink: string;
    categories: [string]; // store category slugs
    devs: [string]; // store dev slugs

    dependencies: { [key:number]: number} // mod-id to dependency type

    // arguably not important for this project, but could be useful for displaying stuff ?
    summary: string; 
    logoUrl: string; 


    downloadCount: number;

    constructor(cfJson: any = null){
        if(cfJson == null){
            return;
        }
        this.id = cfJson["id"]
        this.name = cfJson["name"]
        this.slug = cfJson["slug"]

        this.sourceLink = cfJson["links"]["sourceUrl"]
        this.categories = <[string]><unknown>[] // wtf typescript
        cfJson["categories"].forEach((category: any) => {
            this.categories.push(category.slug)
        });
        this.devs = <[string]><unknown>[] // wtf typescript
        cfJson["authors"].forEach((author: any) => {
            this.devs.push(author.url.split("/").slice(-1)[0])
        });
        this.dependencies = {};
        cfJson["latestFiles"].forEach((modfile: any) => {
            modfile["dependencies"].forEach((dep: any) => {
                this.dependencies[dep.modId] = dep.relationType;
            })
        })

        this.summary = cfJson["summary"]
        this.logoUrl = cfJson.logo.url

        this.downloadCount = cfJson.downloadCount
    }

    getMpiId(): Promise<number> {
        if(this.mpiId != undefined){
            return Promise.resolve(this.mpiId)
        }
        if(this.#fetchPromise != null){
            return this.#fetchPromise; // don't do another call if we already have one going
        }
        this.#fetchPromise = new Promise((resolve) => {
            var mpi_url = `https://www.modpackindex.com/api/v1/mods?limit=1&name=${encodeURIComponent(this.name)}`
            // console.log(mpi_url)
            https.request(mpi_url, {}, 
                (res) => {
                    var data = ''
                    res.on('data', (chunk) => {
                        data += chunk
                        // console.log(`BODY: ${chunk}\n\n`);
                    });
                    res.on('end', () => {
                        var modResults: [any] = JSON.parse(data)['data']
                        if(modResults.length > 0){
                            this.mpiId = modResults[0].id;
                            // console.log(`resolving ${this.mpiId} from fetch`)
                            resolve(this.mpiId)
                        }
                    })
            }).end()
        })
        return this.#fetchPromise;
    }

    static fromDisk(_cfid: number, path = "./data"): Promise<CFMeta> {
        return fsp.readFile(`${path}/cfmeta/${_cfid}.json`, { encoding: 'utf8' }).then((fileData) => {
            return Object.assign(new CFMeta(), JSON.parse(fileData));
        })
    }

    saveToDisk(path = "./data"){
        return fsp.mkdir(`${path}/cfmeta/`, {recursive: true}).then(() =>
            fsp.writeFile(`${path}/cfmeta/${this.id}.json`, JSON.stringify(this))
        )
    }
}
