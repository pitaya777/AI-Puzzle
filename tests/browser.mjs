import {chromium} from 'playwright-core';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('.');
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:1280,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:8001');await page.waitForSelector('#begin');
 await page.screenshot({path:path.join(root,'docs','首页.png'),fullPage:true});
 const canvas=await page.evaluate(()=>{let c=document.createElement('canvas');c.width=540;c.height=960;let x=c.getContext('2d');let g=x.createLinearGradient(0,0,0,960);g.addColorStop(0,'#acc7ad');g.addColorStop(1,'#d6b98a');x.fillStyle=g;x.fillRect(0,0,540,960);x.fillStyle='#c69a68';x.fillRect(70,350,400,310);x.fillStyle='#526a57';for(let y=380;y<620;y+=70)for(let q=95;q<440;q+=70)x.fillRect(q,y,40,45);x.fillStyle='#eef0db';x.font='bold 45px sans-serif';x.fillText('校园时光',160,220);return c.toDataURL('image/png').split(',')[1]});
 await fs.writeFile(path.join(root,'docs','测试校园图.png'),Buffer.from(canvas,'base64'));
 await page.click('#begin');await page.setInputFiles('#photo',path.join(root,'docs','测试校园图.png'));await page.click('#upload');await page.waitForSelector('[data-tile="0"]');
 for(let i=0;i<9;i++){await page.click(`[data-tile="${i}"]`);await page.click(`[data-slot="${i}"]`);await page.waitForFunction(n=>document.querySelector(`[data-slot="${n}"]`)?.classList.contains('done'),i);console.log('拼图块已放置',i+1);if([2,4,6,8].includes(i)){await page.waitForSelector('#answer');await page.fill('#answer',['图书馆前和同学讨论课程项目','感谢老师和并肩学习的朋友','独立完成作品让我更加自信','勇敢表达并珍惜校园里的每一天'][[2,4,6,8].indexOf(i)]);await page.click('#saveAnswer');await page.waitForFunction(()=>document.querySelector('#modal').children.length===0)}}
 await page.click('#generate');await page.waitForSelector('.video video',{timeout:180000});
 let media=await page.locator('video').evaluate(async v=>{if(v.readyState<1)await new Promise(r=>v.addEventListener('loadedmetadata',r,{once:true}));return {duration:v.duration,width:v.videoWidth,height:v.videoHeight}});
 if(Math.abs(media.duration-15)>.2||media.width!==1080||media.height!==1920)throw Error('媒体规格错误 '+JSON.stringify(media));
 await page.click('#share');await page.waitForSelector('.share input');let link=await page.inputValue('.share input');let token=new URL(link).searchParams.get('share');let shared=await page.request.get('http://127.0.0.1:8001/api/shared/'+token+'/video');if(shared.status()!==200)throw Error('分享失败');await page.click('#revoke');await page.waitForSelector('#revoke',{state:'detached'});let revoked=await page.request.get('http://127.0.0.1:8001/api/shared/'+token+'/video');if(revoked.status()!==404)throw Error('撤销分享失败');
 await page.setViewportSize({width:390,height:844});await page.click('[data-go="home"]');let overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);if(overflow)throw Error('手机页面横向溢出');await page.screenshot({path:path.join(root,'docs','手机首页.png'),fullPage:true});
 if(errors.length)throw Error(errors.join('\n'));await fs.writeFile(path.join(root,'docs','验证结果.json'),JSON.stringify({passed:true,media,errors},null,2));console.log('浏览器完整流程通过',media);
}finally{await browser.close()}
