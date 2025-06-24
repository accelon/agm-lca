import {nodefs, writeChanged, readTextContent, patchBuf} from './nodebundle.cjs'
await nodefs;
import {replaceEUDC,tidy,tagit,Chunkpats,toMarkdown} from './src/convertor.js'
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
    const outfn='agm-lca/'+fn+'-lca.md';
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
    const outcontent=toMarkdown(tidy(replaceEUDC(tagit(chunks.join('\n'),fn))));
    // const c=chunks.join('\n');
    // console.log(c.slice(c.length-100))
    if (nchunk!==chunkcount) {
        console.log('warning chunkcount mismatch',nchunk,'expecting',chunkcount)
    }
    // console.log(outcontent.slice(outcontent.length-100))

    //const arr=statPhrase(outcontent).filter(it=>it[0].length>5);
    //console.log(arr.slice(0,20))
    writeChanged( outfn, outcontent ,true)
}
if (typeof files=='string') files=[agm];
files.forEach(processfile)


