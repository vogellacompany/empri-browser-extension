(() => {
  if (window.ghRedactHasRun) {
    return;
  }
    window.ghRedactHasRun = true;

    // TODO(FAP): listen for storage changes and show original dates again?
    // browser.storage.onChanged.addListener(callback)

    browser.storage.sync.get('ghrOn').then((res) => {
        console.log(res);
        if (!res.ghrOn) {
            alert("not on");
            console.log("Git-privacy deactivated");
            return;
        }
    });


  function redact(el) {
    // TODO(FAP): read redaction pattern from storage, cache redaction pattern booleans?
    let datetimeMoment = moment(el.getAttribute("datetime"));
    datetimeMoment.startOf('day').startOf('hour').startOf('minute').startOf('month');
    el.setAttribute("datetime", datetimeMoment.format());
    el.setAttribute("redacted", true);
  }

  console.log("Redacting timestamps");


  function redactTimestamps() {
    Array.from(document.querySelectorAll("time-ago, relative-time")).forEach(el => {
      redact(el);
    })
  }

  redactTimestamps();

  console.log("Initializing git-privacy MutationObserver");

  let observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (!mutation.target) return

      let node = mutation.target;
      if ((node.nodeName === "TIME-AGO" || node.nodeName === "RELATIVE-TIME") &&
          !node.getAttribute("redacted")) {
        redact(node);
      }
    })
  })

    // TODO(FAP): handle additonal timestamps:
    // https://github.com/akermu/emacs-libvterm/commits/master
    // https://github.com/akermu/emacs-libvterm/pull/395/commits

  observer.observe(document, {
      childList: true
    , subtree: true
    , attributes: false
    , characterData: false
  })

})();
