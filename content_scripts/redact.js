(() => {
  if (window.ghRedactHasRun) {
    return;
  }
  window.ghRedactHasRun = true;

  // TODO(FAP): listen for storage changes and show original dates again?
  // browser.storage.onChanged.addListener(callback)

  browser.storage.sync.get("ghrOn").then((res) => {
    console.log(res);
    if (!res.ghrOn) {
      console.log("Git-privacy deactivated");
      return;
    }
  });

  function redact(el) {
    browser.storage.sync
      .get([
        "ghrRedactMonth",
        "ghrRedactDay",
        "ghrRedactHours",
        "ghrRedactMinutes",
        "ghrRedactSeconds",
      ])
      .then((res) => {
        let datetimeMoment = moment(el.getAttribute("datetime"));
        if (res.ghrRedactMonth) {
          datetimeMoment = datetimeMoment.startOf("month");
        }
        if (res.ghrRedactDay) {
          datetimeMoment = datetimeMoment.startOf("day");
        }
        if (res.ghrRedactHours) {
          datetimeMoment = datetimeMoment.startOf("hour");
        }
        if (res.ghrRedactMinutes) {
          datetimeMoment = datetimeMoment.startOf("minute");
        }
        if (res.ghrRedactSeconds) {
          datetimeMoment = datetimeMoment.startOf("second");
        }

        el.setAttribute("datetime", datetimeMoment.format());
        el.setAttribute("redacted", true);
      });
  }

  console.log("Redacting timestamps");

  function redactTimestamps() {
    Array.from(document.querySelectorAll("time-ago, relative-time")).forEach(
      (el) => {
        redact(el);
      }
    );
  }

  redactTimestamps();

  console.log("Initializing git-privacy MutationObserver");

  let observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (!mutation.target) return;

      let node = mutation.target;
      if (
        (node.nodeName === "TIME-AGO" || node.nodeName === "RELATIVE-TIME") &&
        !node.getAttribute("redacted")
      ) {
        redact(node);
      }
    });
  });

  // TODO(FAP): handle additonal timestamps:
  // https://github.com/akermu/emacs-libvterm/commits/master
  // https://github.com/akermu/emacs-libvterm/pull/395/commits

  observer.observe(document, {
    childList: true,
    subtree: true,
    attributes: false,
    characterData: false,
  });
})();
