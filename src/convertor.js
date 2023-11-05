import { toBase26, fromChineseNumber, writeChanged, fromObj } from 'ptk/nodebundle.cjs'
import {eudc} from './eudc.js'
export const Chunkpats={
    agmd:[/第([一二三四五六七八九○]{1,2})經/g, '\n__', 30],
    agms:[/經文（內([一二三四五六七八九○]{1,4})）/g,'\n__',1334],
    agmu:[/（([一二三四五六七八九○]{1,3})）\n/g, '\n__', 472],
    agmm:[/\n（([一二三四五六七八九○]{1,3})）/g, '\n__', 222],
}


export const splitlongsentence=(content)=>{
    content=content
    .replace(/(.{10})：「(.{15})/g,"$1：\n「$2")
    .replace(/(.{15})：「(.{10})/g,"$1：\n「$2")
    .replace(/(.{10})：『(.{15})/g,"$1：\n『$2")
    .replace(/(.{15})：『(.{10})/g,"$1：\n『$2")
    .replace(/(.{10})：(.{15})/g,"$1：\n$2")
    .replace(/(.{15})：(.{10})/g,"$1：\n$2")
    .replace(/(.{10})。(.{15})/g,"$1。\n$2")
    .replace(/(.{15})。(.{10})/g,"$1。\n$2")
    .replace(/(.{10})；(.{15})/g,"$1；\n$2")
    .replace(/(.{15})；(.{10})/g,"$1；\n$2")

    .replace(/(.{10})！(.{15})/g,"$1！\n$2")
    .replace(/(.{15})！(.{10})/g,"$1！\n$2")
    .replace(/(.{10})？(.{15})/g,"$1？\n$2")
    .replace(/(.{15})？(.{10})/g,"$1？\n$2")

    .replace(/(.{10})──(.{15})/g,"$1──\n$2")
    .replace(/\[([^\]]{3,10})\]/g,(m,m1)=>{
        const c= eudc[m1]||'^mc'
        if (!eudc[m1]) console.log(m1)
        return c;
    })
    .replace(/\n([』」])/g,'$1\n')
     .replace(/\^m(\d+)(.{1,10}[：！])\n/g,'^m$1$2')  //呼名，太短，接續
     .replace(/\^m/g,'\n^m') //被上面替代接在一起的^m，必須是獨立段落
     .replace(/\^n(\d+)\n\^m/g,(m,m1)=>"^n"+m1+"^m")
     .replace(/如是我聞：(.)/g,'如是我聞：\n$1')
    return content;
}
const addN=(content,fn)=>{
    const lines=content.replace(/(.)\^m/g,'$1\n^m').split('\n');//確保 ^m 在行首
    let n=0,acc=0;
    for (let i=0;i<lines.length;i++) {
        const line=lines[i];
        
        if (line.slice(0,3)=='^ck') {
            n=0;
            acc=0;
        } 
        if (line.slice(0,2)=='^m') {
            if ( (acc>150 || n==0) && line.indexOf('答曰')==-1 && line.indexOf('唯然')==-1 && line.indexOf('對曰')==-1) {
                lines[i]='^n'+(++n)+line;
                acc=line.length;
            }
        }
        acc+=line.length;
    }
    return lines.join('\n').replace(/\n\^n1\^/g,"^n1^");
}
const buildSutraNumberMap=content=>{
    const lines=content.replace(/(.)\^ref/g,'$1\n^ref').split('\n');
    let ck='1'; //ck#s1 不在開頭
    const obj={};
    for (let i=0;i<lines.length;i++) {
        const line=lines[i];
        if (line.slice(0,3)=='^ck') { //除ck#s1 ，都在開頭
            const m=line.match(/\^ck#s(\d+[a-z]?)/);
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
    return lines.join('\n')
}
const epilog=(content,fn)=>{
    if (fn=='agmd') {
        let pin=0;
        content='^ak#agmd【長阿含】^bk#agmd〔長阿含〕'
        +content.replace(/佛說長阿含經卷第([一二三四五六七八九○十]+)\n/g,(m,m1)=>'^juan'+fromChineseNumber(m1))
        .replace(/_{3,}/g,'')
        .replace(/ck(\d+)第([一二三四五六七八九十○]+)經 +([^經]+經)/g,(m,ck,cnum,title)=>'ck#d'+ck+'〔'+title+'〕')
        .replace(/\n([^品]{2,4}品)第([一二三四五六七八九十○]+)/g,(m,m1,m2)=>{
             return "\n^ck#d30"+ toBase26(pin++) +'〔'+m1.trim()+'〕';
        })
        .replace(/\n\^ck#d30a〔閻浮提洲品〕/,'閻浮提洲品')

    } else if (fn=='agmm') {
        const refs={}
        content='^ak#agmm【中阿含】^bk#agmm〔中阿含〕'
        +content.replace(/\^ck(\d+)\n（[一二三四五六七八九十○]+）([^【]+)【([^】]+)】/g,(m,ck,title,ref)=>{
            refs[ck]=ref;
            return '^ck#m'+ck+'〔'+title+'〕';
        })
        .replace(/_{3,}/g,'')
        .replace(/─{3,}/g,'')
        
    } else if (fn=='agms') {
        const at=content.indexOf('《雜阿含經˙阿育王品》');//drop it 
        content=content.slice(0,at).replace(/※+/g,'');

        //這兩部經 重號, 無法在Chunkpats 標記ck 。為了 內觀號的統一，在此補上 ck
        content=content.replace('經文（內八○一＃四四八）斷惡不善法經','^ck#s801a（內八○一）斷惡不善法經')
        .replace('經文（內八○一＃四五○）欲定經','^ck#s801b經文（內八○一）欲定經')

        content='^ak#agms【雜阿含】^bk#agms〔雜阿含〕'
        +content.replace(/\^ck(\d+[a-z]?)經文（內([一二三四五六七八九十○]+)）【([^】]+)】(.+?)\n/g,(m,ck,n,ref,title)=>{
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
        .replace(/（印([^）]+)）/g,(m,m1)=>'^ref#y'+ fromChineseNumber(m1)) //未處理 （印二～四）
        .replace(/（光([^）]+)）/g,(m,m1)=>'^ref#f'+ fromChineseNumber(m1))
        .replace(/[\(（]大([^）]+)[\)）]/g,(m,m1)=>'^ref#t'+ fromChineseNumber(m1));

        content=buildSutraNumberMap(content);
    } else if (fn=='agmu') {
        content='^ak#agmu【增一阿含】^bk#agmu〔增一阿含〕'
        +content.replace(/增壹阿含經卷第([一二三四五六七八九○十]+)/g,(m,m1)=>'^juan'+fromChineseNumber(m1))
        .replace(/※+/g,'');
    }
    return addN(content,fn);
}

export const tagit=(content,fn)=>{
    content=content.replace(/\n?[（\(] ?(\d+[a-z]*)[）\)]/g,(m,m1)=>{
        return '\n^m'+m1.replace(/^0+/g,'');
    })
    return epilog(content,fn)
}
export const tidy=content=>{
    content=content
    .replace(/ +\n/g,'\n').replace(/\n +/g,'\n').replace(/\n+/g,'\n')
    .replace(/\^m(\d+[a-z]?) +/g,'^m$1')
    
    return content;
}