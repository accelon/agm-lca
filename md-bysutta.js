import {nodefs, writeChanged,readTextLines} from './nodebundle.cjs'
await nodefs;

const agm=process.argv[2];
let  files=agm||['agmd','agmm','agms','agmu']


const splitfile=filename=>{
    let fileid='';
    const out=[];
    let count=0;
    const emitfile=()=>{
        writeChanged(outdir+'/'+fileid+'.md',out.join('\n'));
        count++;
        out.length=0;
    }

    const lines=readTextLines('agm-lca/'+'/'+filename+'-lca.md');
    const outdir='agm-lca/'+filename
    if (!fs.existsSync(outdir )) fs.mkdirSync(outdir);
    for (let i=1;i<lines.length;i++) {//skip first line
        const line=lines[i];
        const m=line.match(/[dmsu](\d+)$/);
        if (m) {
            if (fileid) emitfile();
            fileid=m[1];
            out.push(line.slice(1,line.length-m[0].length-1).trim())
        } else {
            out.push(line.replace(/\d+\-([\da-z]+)/g,'n$1' ));
        }
        
    }
    console.log(filename,'has ',count,'files')
    emitfile()
}
files.forEach(splitfile)