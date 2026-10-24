import {test,expect} from '@playwright/test';
test('project page renders with measured data and working controls',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 const missing=[];page.on('response',response=>{if(response.status()>=400&&response.url().startsWith('http://127.0.0.1:4173'))missing.push(response.url());});
 await page.goto('/');
 await expect(page.locator('h1')).toContainText('Learn the intent.');
 await expect(page.locator('#signal-chart circle')).toHaveCount(25);
 await page.locator('#node-touch').click();await expect(page.locator('#detail-title')).toContainText('contact evidence');
 await page.locator('#node-execute').click();await expect(page.locator('#detail-title')).toContainText('Plan goals');
 await page.locator('#tab-bottle').click();await expect(page.locator('#task-title')).toContainText('Know when');
 await expect(page.locator('#task-video source')).toHaveAttribute('src',/bottle-explainer/);
 await expect(page.locator('#task-captions')).toHaveAttribute('src',/bottle-captions/);
 await page.getByRole('button',{name:'05 Verify & lift'}).click();
 await expect(page.locator('#stage-detail')).toContainText('release_verified');
 await expect.poll(()=>page.locator('#task-video').evaluate(v=>v.currentTime)).toBeGreaterThanOrEqual(49.9);
 await page.locator('#task-video').evaluate(v=>v.pause());
 await page.locator('[data-gate="lost"]').click();await expect(page.locator('#gate-result')).toContainText('Stop rotation and hold');
 await page.locator('[data-gate="release"]').click();await expect(page.locator('#gate-result')).toContainText('Verify at rest');
 await page.locator('#tab-cup').click();await expect(page.locator('#task-boundary')).toContainText('retry is scripted');
 expect(errors).toEqual([]);expect(missing).toEqual([]);
 const sizes=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));expect(sizes.scroll).toBeLessThanOrEqual(sizes.width+1);
});
test('keyboard tabs, reduced motion, and detailed documents work',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
 await expect.poll(()=>page.locator('#hero-video').evaluate(v=>v.paused)).toBe(true);
 await page.locator('#node-observe').focus();await page.keyboard.press('ArrowRight');await expect(page.locator('#node-compile')).toHaveAttribute('aria-selected','true');
 await page.locator('#tab-cup').focus();await page.keyboard.press('ArrowRight');await expect(page.locator('#tab-bottle')).toHaveAttribute('aria-selected','true');
 for(const [url,text] of [['/architecture.html','What a single demonstration provides'],['/video-script.html','Three-minute script']]){
  await page.goto(url);await expect(page.getByRole('heading',{name:text,exact:false})).toBeVisible();
  const sizes=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));expect(sizes.scroll).toBeLessThanOrEqual(sizes.width+1);
 }
});
