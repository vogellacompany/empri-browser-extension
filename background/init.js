browser.storage.sync.get("ghrOn").then((res) => {
  if (typeof res.ghrOn == "undefined") {
    browser.storage.sync.set({
      ghrOn: true,
    });
  }
  // TODO(FAP): set icon depending on "on"/"off" state? (test with full install
});
