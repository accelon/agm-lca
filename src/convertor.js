import { toBase26, fromChineseNumber,cjkPhrases,sortObj,jsonify} from 'ptk/nodebundle.cjs'
import {eudc} from './eudc.js'
import {process_agms} from './agms.js';
export const Chunkpats={
    agmd:[/第([一二三四五六七八九○]{1,2})經/g, '\n__', 30],
    agms:[/經文（內([一二三四五六七八九○]{1,4})）/g,'\n__',1337],
    agmu:[/（([一二三四五六七八九○]{1,3})）\n/g, '\n__', 472],
    agmm:[/\n（([一二三四五六七八九○]{1,3})）/g, '\n__', 222],
}
    // .replace(/(.{10})：「(.{15})/g,"$1：\n「$2")
    // .replace(/(.{15})：「(.{10})/g,"$1：\n「$2")
    // .replace(/(.{10})：『(.{15})/g,"$1：\n『$2")
    // .replace(/(.{15})：『(.{10})/g,"$1：\n『$2")
    // .replace(/(.{10})：(.{15})/g,"$1：\n$2")
    // .replace(/(.{15})：(.{10})/g,"$1：\n$2")
    // .replace(/(.{10})。(.{15})/g,"$1。\n$2")
    // .replace(/(.{15})。(.{10})/g,"$1。\n$2")
    // .replace(/(.{10})；(.{15})/g,"$1；\n$2")
    // .replace(/(.{15})；(.{10})/g,"$1；\n$2")
    // .replace(/(.{10})！(.{15})/g,"$1！\n$2")
    // .replace(/(.{15})！(.{10})/g,"$1！\n$2")
    // .replace(/(.{10})？(.{15})/g,"$1？\n$2")
    // .replace(/(.{15})？(.{10})/g,"$1？\n$2")
    // .replace(/(.{10})──(.{15})/g,"$1──\n$2")
    //.replace(/\^m(\d+)(.{1,10}[：！])\n/g,'^m$1$2')  //呼名，太短，接續
    //.replace(/\^m/g,'\n^m') //被上面替代接在一起的^m，必須是獨立段落
    //.replace(/\^n(\d+)\n\^m/g,(m,m1)=>"^n"+m1+"^m")
    //.replace(/如是我聞：(.)/g,'如是我聞：\n$1')
    //.replace(/\n([』」])/g,'$1\n')
export const replaceEUDC=(content)=>{
    content=content
    .replace(/\[([^\]]{3,10})\]/g,(m,m1)=>{
        const c= eudc[m1]||'^mc'
        if (!eudc[m1]) console.log(m1)
        return c;
    })
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
const epilog=(content,fn)=>{
    if (fn=='agmd') {
        let pin=0;
        content='{id:"agmd-lca",title:"長阿含"}\n'+content.replace(/佛說長阿含經卷第([一二三四五六七八九○十]+)\n/g,(m,m1)=>'^juan'+fromChineseNumber(m1))
        .replace(/_{3,}/g,'')
        .replace(/\^ck(\d+)第([一二三四五六七八九十○]+)經 +([^經]+經)/g,(m,ck,cnum,title)=>title+'\t^ck#d'+ck+'〔'+title+'〕')
        .replace(/\n([^品]{2,4}品)第([一二三四五六七八九十○]+)/g,(m,m1,m2)=>{
             return "\n"+m1+"\t^ck#d30"+ toBase26(pin++) +'〔'+m1.trim()+'〕';
        })
        .replace(/\n閻浮提洲品\t\^ck#d30a〔閻浮提洲品〕/,'\n〔閻浮提洲品〕')
    } else if (fn=='agmm') {
        const refs={}
        content='{id:"agmm-lca",title:"中阿含"}\n'+content.replace(/\^ck(\d+)\n（[一二三四五六七八九十○]+）([^【〔\m]*)【([^】\n]+)】/g,(m,ck,title,ref)=>{
            refs[ck]=ref;
            //console.log(title.length)
            return '^ck#m'+ck+'〔'+title+'〕';
        })
        //沒有括號的經名
        .replace(/\^ck(\d+)\n（[一二三四五六七八九十○]+）([^\n]+)/g,(m,ck,title)=>{
            //console.log(title)
            return '^ck#m'+ck+'〔'+title+'〕';
        })
    } else if (fn=='agms') {
        content=process_agms(content);
        content='{id:"agms-lca",title:"雜阿含"}\n'+content
    } else if (fn=='agmu') {
        content='{id:"agmu-lca",title:"增一阿含"}\n'
        +content.replace(/增壹阿含經卷第([一二三四五六七八九○十]+)/g,(m,m1)=>'^juan'+fromChineseNumber(m1))
        .replace(/\^ck(\d+)（([一二三四五六七八九十○]+)）/g,"$2\t^ck#u$1〔$2〕")
    }
    return content;;
}
export const tagit=(content,fn)=>{
    content=content.replace(/\n?[（\(] ?(\d+[a-z]*)[）\)]/g,(m,m1)=>{
        return '\n^m'+m1.replace(/^0+/g,'');
    })
    content=epilog(content,fn);
    const lines=content.split("\n");
    let ck='';
    for (let i=0;i<lines.length;i++) {
        const m=lines[i].match(/\^ck#([dmsu]\d+)/);
        const m2=lines[i].match(/\^m(\d+[a-z]*)/);
        if (m) ck=m[1];
        if (m2) {
            lines[i]=lines[i].replace(/\^m(\d+[a-z]*) */,'^y'+ck+'_'+m2[1]+' ');
        }
    }
    return lines.join('\n')
}
export const tidy=content=>{
    content=content
    .replace(/※/g,'')
    .replace(/_{3,}/g,'')        
    .replace(/─{3,}/g,'')        
    .replace(/ +\n/g,'\n').replace(/\n +/g,'\n').replace(/\n+/g,'\n')
    .replace(/\^y(\d+[a-z]?) +/g,'^y$1 ')
    return content;
}
export const topaged=(content)=>{
    content=content.replace(/\^ck#([\dagms]\d+)〔([^〕]+)〕/g,"$2\t^ck#$1《$2》")
    return content;
}
let prev='';
export const toMarkdown=content=>{
    prev='';
    const at=content.indexOf('\n');
    const header=jsonify(content.slice(0,at));
    console.log(header)
    content=content.slice(at+1);//remove header
    content= content
    // .replace(/\^m\d+/g,'')
    .replace(/\^ak#agm.【(.+?)】/,'$1')
    .replace(/\^y.([_\da-z]+)/g,(m,m1)=>{ //move sentence id to end of block
        const [sutta,sentence] = m1.split('_');
        const r=prev? (prev+'\n'):'\n';
        prev='^'+sutta+(sentence?'-'+sentence:'');
        return r;
    })
    .replace(/\n\^(\d+)-([a-z\d]+)/g,' ^$1-$2\n')
    .replace(/(\n?).+?\t\^ck#([a-z\d]+)〔(.+?)〕/g,'$1## $3 ^$2')
    .replace(/\^ck#([a-z\d]+)〔(.+?)〕/g,'## $2 ^$1') //有些還沒name paged
    .replace(/\^bk#agm(.)〔(.+?)〕/,'\n# $2 ^agm$1')
//move last block id to upper line
    .replace(/\n(.+?)(\^[a-z]\d+) ?(\^[\d\-]+)/g, '$3\n\n$1$2')
    .replace(/\n +/g,'\n')
     .replace(/\^s(\d+)\n+/g,'^s$1\n\n')//make sure sutta name is a block

    content='# '+header.title+'\n'+content.trim()+' '+prev;
    return content;
}


export const statPhrase=(content)=>{
    const phrases=cjkPhrases(content);
    const obj={};
    for (let i=0;i<phrases.length/2;i++) {
        if (!obj[phrases[i]]) obj[phrases[i]]=0;
        obj[phrases[i]]++;
    }
    return sortObj(obj);
}