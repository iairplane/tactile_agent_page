import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir:'./tests', timeout:30000, fullyParallel:true,
  use:{baseURL:'http://127.0.0.1:4173',headless:true,launchOptions:{executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--no-sandbox']},screenshot:'only-on-failure'},
  webServer:{command:'npm run serve',url:'http://127.0.0.1:4173',reuseExistingServer:!process.env.CI,timeout:15000},
  projects:[{name:'desktop',use:{viewport:{width:1440,height:1000}}},{name:'mobile',use:{viewport:{width:390,height:844},isMobile:true,hasTouch:true}}]
});
