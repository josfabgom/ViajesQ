const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const https = require('https');

async function testSite() {
  console.log("Fetching https://soporteq.tech/dashboard...");
  
  const resourceLoader = new jsdom.ResourceLoader({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    strictSSL: false
  });

  const virtualConsole = new jsdom.VirtualConsole();
  virtualConsole.on("error", () => { /* Prevent jsdom from flooding */ });
  virtualConsole.on("jsdomError", (e) => { console.error("JSDOM ERROR:", e.message, e.stack); });
  virtualConsole.sendTo(console);

  try {
    const dom = await JSDOM.fromURL("https://soporteq.tech/dashboard", {
      runScripts: "dangerously",
      resources: resourceLoader,
      virtualConsole: virtualConsole,
      pretendToBeVisual: true
    });
    
    console.log("DOM loaded. Waiting for scripts...");
    
    setTimeout(() => {
      console.log("Finished waiting.");
      process.exit(0);
    }, 5000);
    
  } catch(e) {
    console.error("Failed to load:", e);
  }
}

testSite();
