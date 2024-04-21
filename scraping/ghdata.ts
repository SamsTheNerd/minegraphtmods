import * as https from 'node:https';
import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';

import {Mod} from './mod'
import { Octokit, RequestError } from 'octokit';

const SECRETS = require('../secrets.json')

const GH_URL_REGEX = /(?:.*github.com\/)([^\/]+)\/([^\/\n]+)/
const ISSUE_GRABBER = /\/([0-9])+$/

var octokit:Octokit = new Octokit({ auth: SECRETS.gh });

export class GHData {
    cfid: number; 
    interactions: { [key:string]: {[key in InteractionType]?: number}};

    constructor(_cfid: number, _interactions = {}){
        this.cfid = _cfid;
        this.interactions = _interactions
    }

    static parseUrl(_url: string): { ["owner"]: string, ["repo"]: string } | null{
        var results = GH_URL_REGEX.exec(_url)
        if(results == null){
            return null;
        }
        return {
            "owner": results[1],
            "repo": results[2]
        }
    }

    numInteractions(user:string, type: InteractionType = null): number{
        if(!this.interactions.hasOwnProperty(user)) return 0;
        if(type == null){
            return this.numInteractions(user, InteractionType.ISSUE_POST) + this.numInteractions(user, InteractionType.PR_POST)
                +  this.numInteractions(user, InteractionType.ISSUE_COMMENT) + this.numInteractions(user, InteractionType.PR_COMMENT)
        }
        if(!this.interactions[user][type]) return 0; 
        return this.interactions[user][type];
    }

    static fromDisk(_cfid: number, path = "./data"): Promise<GHData> {
        return fsp.readFile(`${path}/ghdata/${_cfid}.json`, { encoding: 'utf8' }).then((fileData) => {
            return Object.assign(new GHData(_cfid), {interactions: JSON.parse(fileData)});
        })
    }

    saveToDisk(path = "./data"){
        return fsp.mkdir(`${path}/ghdata/`, {recursive: true}).then(() =>
            fsp.writeFile(`${path}/ghdata/${this.cfid}.json`, JSON.stringify(this.interactions))
        )
    }

    static async copyData(srcCfid: number, dstCfid: number, path = "./data"){
        var srcData = await this.fromDisk(srcCfid)
        srcData.cfid = dstCfid;
        await srcData.saveToDisk()
    }

    static async fetchGHData(_cfid: number): Promise<GHData>{
        var repo = await Mod.getMod(_cfid).getGHRepo();
        if(!repo) return new GHData(_cfid, {});
        try{
            const issueIterator = octokit.paginate.iterator(octokit.rest.issues.listForRepo, {
                "owner": repo.owner,
                "repo": repo.repo,
                "per_page": 100,
                "state": "all"
            })
            const commentIterator = octokit.paginate.iterator(octokit.rest.issues.listCommentsForRepo, {
                "owner": repo.owner,
                "repo": repo.repo,
                "per_page": 100,
                "state": "all"
            })

            var interactions: {[key: string]: {[key in InteractionType]?: number}} = {}
            
            var prOrNot: {[key: number]: boolean} = {}

            for await (const { data: issues } of issueIterator){
                // console.log(`\t\t-> issue response !!`)
                for (const issue of issues) {
                    var isPR = issue.pull_request != null ? true : false;
                    prOrNot[issue.number] = isPR;
                    // console.log("\t\t%s #%d: %s", isPR ? "PR" : "Issue", issue.number, issue.title);
                    if(!interactions[issue.user.login]){
                        interactions[issue.user.login] = {}
                    }
                    var interType = isPR ? InteractionType.PR_POST : InteractionType.ISSUE_POST;
                    if(!interactions[issue.user.login][interType]){
                        interactions[issue.user.login][interType] = 0
                    }
                    interactions[issue.user.login][interType]++
                    // interactions[issue.user.login].push(new GHInteraction(issue.id, isPR ? InteractionType.PR_POST : InteractionType.ISSUE_POST))

                }
            }

            for await (const { data: comments } of commentIterator){
                // console.log(`\t\t-> comment response !!`)
                for (const comment of comments) {
                    var issueNumSplit = comment.issue_url.split("/");
                    var issueNum = Number.parseInt(issueNumSplit[issueNumSplit.length - 1])
                    // var issueNum = Number.parseInt(ISSUE_GRABBER.exec(comment.issue_url)[1])
                    var isPR = prOrNot[issueNum]
                    // console.log("\t\tComment on %s %s by %s: %s", isPR ? "PR" : "Issue", comment.issue_url, comment.user.login, comment.body);
                    if(!interactions[comment.user.login]){
                        interactions[comment.user.login] = {}
                    }
                    var interType = isPR ? InteractionType.PR_COMMENT : InteractionType.ISSUE_COMMENT;
                    if(!interactions[comment.user.login][interType]){
                        interactions[comment.user.login][interType] = 0
                    }
                    interactions[comment.user.login][interType]++
                }
            }

            return new GHData(_cfid, interactions);
        } catch (err){
            if(err instanceof RequestError){
                if(err.status == 404){
                    console.log("\t-> 404, invalid repo")
                    return new GHData(_cfid, {});;
                }
            }
            throw err;
        }
    }
}

// export class GHInteraction {
//     id: number;
//     type: InteractionType;

//     constructor(_id:number, _type: InteractionType){
//         this.id = _id;
//         this.type = _type;
//     }

//     static allFromJson(json: string): { [key:string]: GHInteraction[]}{
//         var rawJson: {[key:string]: [GHInteraction]} = JSON.parse(json)
//         var output:{[key:string]: GHInteraction[]} = {}
//         for(var key in Object.keys(rawJson)){
//             output[key] = rawJson[key].map((rawInteraction) => new GHInteraction(rawInteraction.id, rawInteraction.type));
//         }
//         return output;
//     }
// }

enum InteractionType{
    ISSUE_POST = "issue_post",
    PR_POST = "pr_post",
    ISSUE_COMMENT = "issue_comment",
    PR_COMMENT = "pr_comment"
}

var test = async () => {
    var gloop = new Mod(897558)
    var hex = new Mod(569849);
    // console.log(JSON.stringify(await GHData.fetchGHData(897558), null, 2))
    // var gloopGHD = gloop.getGHData()
    // var hexGHD = hex.getGHData();
    // console.log(await gloopGHD);
    // console.log(await hexGHD)
    // gloop.saveToDisk()
    // hex.saveToDisk()
}

// test()

export {
    octokit
}