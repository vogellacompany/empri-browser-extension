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
      return browser.storage.sync
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

          el.textContent = "Commits on " + dateTime.toFormat("MMM d, y");
          el.setAttribute("redacted", true);
        });
    }

    // https://github.com/user/repo/commits/master
    // https://github.com/user/repo/pull/42/commits
    async function redactTimelineTimestamps() {
      let timelineTimestamps = document.querySelectorAll(
        ".TimelineItem-body > .f5"
      );
      await Promise.all(
        Array.from(timelineTimestamps).map((el) => {
          return redactTimelineItem(el);
        })
      );

      for (let i = 0; i < timelineTimestamps.length; i++) {
        if (timelineTimestamps.item(i).parentElement.parentElement == null) {
          continue;
        }

        let currentEl = timelineTimestamps.item(i);
        let currentElParent = currentEl.parentElement;
        for (let j = i + 1; j < timelineTimestamps.length; j++) {
          var nextEl = timelineTimestamps.item(j);
          var nextElParent = nextEl.parentElement;
          if (!(currentEl.textContent === nextEl.textContent)) {
            break;
          }
          nextElParent.querySelectorAll("ol > li").forEach((li) => {
            currentElParent.querySelector("ol").append(li);
          });
          nextElParent.parentElement.remove();
        }
      }
      timelineTimestamps.forEach((el) => {});
    }

    redactTimelineTimestamps();
    document.addEventListener("pjax:end", redactTimelineTimestamps); // content change without full page load

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
