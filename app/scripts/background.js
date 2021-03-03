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
