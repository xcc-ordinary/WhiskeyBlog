const {chromium}=require('@playwright/test');
const fs=require('node:fs');const path=require('node:path');
(async()=>{
 const out=path.resolve('design/harbor-personality-v3/browser-frames');fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.goto('http://localhost:3102/prototypes/harbor/index.html');
 await page.waitForFunction(()=>window.__harborPreview?.ready,{timeout:60000});
 const frames=[];
 for(let i=0;i<25;i++){await page.evaluate(i=>window.__harborPreview.renderAt(i/4,i/24),i);await page.screenshot({path:path.join(out,`frame-${String(i).padStart(3,'0')}.png`)});frames.push(await page.evaluate(()=>window.__harborPreview.stats()));}
 await page.setViewportSize({width:390,height:844});
 for(let i=0;i<2;i++){await page.evaluate(i=>window.__harborPreview.renderAt(i*3,i*.5),i);await page.screenshot({path:path.join(out,`mobile-${i}.png`)});}
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
 await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await page.waitForFunction(()=>window.__harborPreview?.ready);
 const reduced=await page.evaluate(()=>window.__harborPreview.stats());await page.waitForTimeout(400);const still=await page.evaluate(()=>window.__harborPreview.stats());
 await page.getByRole('button',{name:'播放场景动画'}).click();await page.waitForTimeout(300);const playing=await page.evaluate(()=>window.__harborPreview.stats());
 await page.getByRole('button',{name:'暂停场景动画'}).click();const paused=await page.evaluate(()=>window.__harborPreview.stats());await page.waitForTimeout(300);const frozen=await page.evaluate(()=>window.__harborPreview.stats());
 const report={errors,frames,overflow,reducedMotionStopped:reduced.time===still.time,playAdvances:playing.time>still.time,pauseStops:paused.time===frozen.time};
 fs.writeFileSync(path.resolve('design/harbor-personality-v3/browser-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));await browser.close();
 if(errors.length||overflow||!report.reducedMotionStopped||!report.playAdvances||!report.pauseStops)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
