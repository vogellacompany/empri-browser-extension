(() => {
  if (window.ghRedactHasRun) {
    return;
  }
  window.ghRedactHasRun = true;
  let DateTime = luxon.DateTime;

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
        let dateTime = DateTime.fromISO(el.getAttribute("datetime"));
        if (res.ghrRedactMonth) {
          dateTime = dateTime.startOf("month");
        }
        if (res.ghrRedactDay) {
          dateTime = dateTime.startOf("day");
        }
        if (res.ghrRedactHours) {
          dateTime = dateTime.startOf("hour");
        }
        if (res.ghrRedactMinutes) {
          dateTime = dateTime.startOf("minute");
        }
        if (res.ghrRedactSeconds) {
          dateTime = dateTime.startOf("second");
        }

        el.setAttribute("datetime", dateTime.toISO());
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
