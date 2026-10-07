import {spawn} from 'node:child_process';import fs from 'node:fs/promises';
const out=process.env.SB_CROSS_OUT??'.local-validation/v051/cross';await fs.mkdir(out,{recursive:true});
const commands=[];
for(const engine of ['firefox','webkit'])for(const script of ['core-polish-browser.mjs','polish-ui-browser.mjs']){
 const dir=`${out}/${engine}-${script.split('.')[0]}`;const start=new Date().toISOString();
 const child=spawn(process.execPath,['tests/'+script],{env:{...process.env,SB_BROWSER_ENGINE:engine,SB_POLISH_OUT:dir,SB_UI_OUT:dir},stdio:['ignore','pipe','pipe']});
 let log='';child.stdout.on('data',b=>{log+=b;process.stdout.write(b);});child.stderr.on('data',b=>{log+=b;process.stderr.write(b);});
 const exit=await new Promise(resolve=>child.on('exit',resolve));await fs.writeFile(`${out}/${engine}-${script}.log`,log);
 commands.push({engine,script,start,end:new Date().toISOString(),exit,status:exit===0?'PASS':'FAIL'});
 await fs.writeFile(out+'/commands.json',JSON.stringify(commands,null,2));if(exit!==0)process.exitCode=1;
}
