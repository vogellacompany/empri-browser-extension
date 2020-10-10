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

    function redactTimestamps() {
      document.querySelectorAll("time-ago, relative-time").forEach((el) => {
        redact(el);
      });
    }

    console.log("Redacting timestamps");
    redactTimestamps();

    function redactTimelineItem(el) {
      browser.storage.sync
        .get([
          "ghrRedactMonth",
          "ghrRedactDay",
          "ghrRedactHours",
          "ghrRedactMinutes",
          "ghrRedactSeconds",
        ])
        .then((res) => {
          // "Commits on Jul 12, 2020".substring(11) -> "Jul 12, 2020"
          let text = el.textContent.substring(11);
          let dateTime = DateTime.fromFormat(text, "MMM d, y");
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
          console.log("####");
          console.log(el);
          console.log(dateTime);
          el.textContent = "Commits on " + dateTime.toFormat("MMM d, y");
          el.setAttribute("redacted", true);
        });
    }

    // https://github.com/user/repo/commits/master
    // https://github.com/user/repo/pull/42/commits
    function redactTimelineTimestamps() {
      document.querySelectorAll(".TimelineItem-body > .f5").forEach((el) => {
        redactTimelineItem(el);
        // TODO(FAP): join days that show the same date now?
      });
    }

    redactTimelineTimestamps();

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

    observer.observe(document, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false,
    });
  });
})();
