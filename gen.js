import {nodefs, writeChanged, readTextContent, patchBuf} from 'ptk/nodebundle.cjs'
await nodefs;
import {splitlongsentence,tidy,tagit,Chunkpats} from './src/convertor.js'
import {Errata} from './src/errata.js'
/*
prerequisite
get *.doc and save as pure text
expecting agmd-lca.txt agmm-lca.txt agms-lca.txt  agmu-lca.txt
*/
const agm=process.argv[2];
let  files=agm||['agmd','agmm','agms','agmu']
const processfile=(fn)=>{
    const infn='raw/'+fn+'-lca.txt';
    const outfn='off/'+fn+'-lca.off';
    const [regex,endmarker,chunkcount]=Chunkpats[fn]
    let nchunk=0,prev=0;
    let rawcontent=readTextContent(infn);
    if (Errata[fn]) rawcontent=patchBuf(rawcontent,Errata[fn])
    const chunks=[];
    const start=rawcontent.indexOf(endmarker);
    rawcontent=rawcontent.slice(start);
    const emitchunk=(from,till)=>{
        const at=rawcontent.indexOf( endmarker, from);
        if (at>-1 && at<till) till=at;
        chunks.push( '^ck'+nchunk+rawcontent.slice(from,till||rawcontent.length));
    }    
    rawcontent.replace( regex,(m,m1,idx)=>{
        if (prev ) emitchunk(prev,idx);
        nchunk++;
        prev=idx;
    })
    emitchunk(prev);
    const outcontent=tidy(splitlongsentence(tagit(chunks.join('\n'),fn)));
    if (nchunk!==chunkcount) {
        console.log('warning chunkcount mismatch',nchunk,'expecting',chunkcount)
    }
    writeChanged( outfn, outcontent ,true)
}
if (typeof files=='string') files=[agm];
files.forEach(processfile)