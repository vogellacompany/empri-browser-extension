browser.storage.sync.get("ghrOn").then((res) => {
  if (typeof res.ghrOn == "undefined") {
    browser.storage.sync.set({
      ghrOn: true,
      mostsigunit: "year",
      studyOptIn: false,
    });
  } else if (!res.ghrOn) {
    browser.browserAction.setIcon({
      path: {
        19: "../images/off-19.png",
        38: "../images/off-38.png",
      },
    });
  }
});

browser.runtime.onInstalled.addListener(async ({ reason, temporary }) => {
  if (temporary) return; // skip during development
  switch (reason) {
    case "install":
      {
        const url = browser.runtime.getURL("pages/welcome.html");
        //await browser.tabs.create({ url });
        await browser.windows.create({ url, type: "popup", height: 600, width: 600, });
      }
      break;
    // see below
  }
});
