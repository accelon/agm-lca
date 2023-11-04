import { toBase26 } from 'ptk/nodebundle.cjs'
import {eudc} from './eudc.js'
export const Chunkpats={
    agmd:[/第([一二三四五六七八九○]{1,2})經/g, '\n__', 30],
    agms:[/經文（內([一二三四五六七八九○]{1,4})）/g,'\n__',],
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
    .replace(/([^\d])\^m/g,'$1\n^m') //被上面替代接在一起的^m，必須是獨立段落
    return content;
}
const addN=(content,fn)=>{
    const lines=content.split('\n');
    let n=0,acc=0;
    for (let i=0;i<lines.length;i++) {
        const line=lines[i];
        
        if (line.slice(0,3)=='^ck') {
            n=0;
            acc=0;
        } else if (line.slice(0,2)=='^m') {
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
        content='^ak#ak#dn【長阿含】^bk#dn〔長阿含〕'+content;
        content=content.replace(/佛說長阿含經卷第[一二三四五六七八九○十]+\n/g,'')
        .replace(/________________/g,'')
        .replace(/ck(\d+)第([一二三四五六七八九十○]+)經 +([^經]+經)/g,(m,ck,cnum,title)=>{
            return 'ck#d'+ck+'〔'+title+'〕';
        })
        .replace(/\n([^品]{2,4}品)第([一二三四五六七八九十○]+)/g,(m,m1,m2)=>{
             return "\n^ck#d30"+ toBase26(pin++) +'〔'+m1.trim()+'〕';
        })
        .replace(/\n\^ck#d30a〔閻浮提洲品〕/,'閻浮提洲品');
    }
    return addN(content);
}

export const tagit=(content,fn)=>{
    content=content.replace(/\n?[（\(] ?(\d+[a-z]*)[）\)]/g,(m,m1)=>{
        return '\n^m'+m1.replace(/^0+/g,'');
    })
    return epilog(content,fn)
}
export const tidy=content=>{
    content=content.replace(/ +\n/g,'\n').replace(/\n +/g,'\n').replace(/\n+/g,'\n')
    return content;
}