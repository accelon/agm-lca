import { writeChanged, fromObj ,fromChineseNumber} from 'ptk/nodebundle.cjs'
const sortByTaishoSuttaNumber=(content,sutramap)=>{
    // const taisho_lca=fromObj(sutramap,(lca,ref)=>[ parseInt(ref.t), a]);
    //console.log(taisho_lca);
    const chunks=content.split(/\^ck#s(\d+[ab]?)/)
    const firstline=chunks.shift();  //text before first ^ck
    const neworder=[];
    for (let i=0;i<chunks.length/2;i++) {
        const taisho= sutramap[chunks[i*2]].t;
        neworder.push([parseInt(taisho), chunks[i*2+1]]);
    }
    neworder.sort((a,b)=>a[0]-b[0]);
    
    let outcontent=[firstline];

    for (let i=0;i<neworder.length;i++) {
        const [taisho,text]=neworder[i];
        outcontent.push(  '^ck#s'+taisho+text );
    }
    return outcontent.join('');
}
const buildSutraNumberMap=content=>{
    const lines=content.replace(/(.)\^ref/g,'$1\n^ref').split('\n');
    let ck='1'; //ck#s1 不在開頭
    const obj={};
    for (let i=0;i<lines.length;i++) {
        const line=lines[i];
        if (line.slice(0,3)=='^ck') { //除ck#s1 ，都在開頭
            const m=line.match(/\^ck#s(\d+[a-z]?)/);
            if (!m) console.log(line)
            ck=m[1];       
        } else if (line.slice(0,4)=='^ref') {
            if (!obj[ck]) obj[ck]={y:'',f:'',t:''}
            const reftarget=line.slice(5,6);
            if (!obj[ck][reftarget]) { //只取第一次出現的  ，印第1~4經，只記錄 1，
                obj[ck][reftarget]=line.slice(6).trim();
            }
            
            lines[i]=line.replace(/\^ref#[a-z]\d+/g,'')
        }
    }

    const themap=fromObj(obj,(a,b)=> a+'\t'+b.t+'\t'+b.y+'\t'+b.f);
    themap.unshift('^:<name=sutranumber_agms preload=true>\ttaisho=number\tyinshun=number\tfoguang=number')
    writeChanged( 'off/sutranumber_agms.tsv',themap.join('\n'),true)
    return [obj,lines.join('\n')]
}
export const process_agms=(content)=>{
    //這兩部經 重號, 無法在Chunkpats 標記ck 。為了 內觀號的統一，在此補上 ck
    content=content.replace('經文（內八○一＃四四八）斷惡不善法經','^ck#s801a（內八○一）斷惡不善法經')
    .replace('經文（內八○一＃四五○）欲定經','^ck#s801b經文（內八○一）欲定經')        
    content=content.replace(/\^ck(\d+[a-z]?)經文（內([一二三四五六七八九十○]+)）【([^】]+)】(.+?)\n/g,(m,ck,n,ref,title)=>{
        if (fromChineseNumber(n)!==parseInt(ck)) {
            console.log("warning",title,ck,n);
        }
        return '^ck#s'+ck+'〔'+title+'〕\n';
    })
    .replace(/\^ck(\d+[a-z]?)經文（內([一二三四五六七八九十○]+)）(.+?)\n/g,(m,ck,n,title)=>{
        if (fromChineseNumber(n)!==parseInt(ck)) {
            console.log("warning",title,ck,n);
        }
        return '^ck#s'+ck+'〔'+title+'〕';
    })
    .replace(/（印([^）]{1,30})）/g,(m,m1)=>'^ref#y'+ fromChineseNumber(m1)) //未處理 （印二～四）
    .replace(/（光([^）]{1,30})）/g,(m,m1)=>'^ref#f'+ fromChineseNumber(m1))
    .replace(/[\(（]大([^）]{1,30})[\)）]/g,(m,m1)=>'^ref#t'+ fromChineseNumber(m1));

    const [sutramap,newcontent]=buildSutraNumberMap(content);
    return sortByTaishoSuttaNumber(newcontent,sutramap)
}