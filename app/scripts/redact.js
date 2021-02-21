import { DateTime } from "luxon";

(() => {
  if (window.ghRedactHasRun) {
    return;
  }
  window.ghRedactHasRun = true;

  // TODO(FAP): listen for storage changes and show original dates again?
  // browser.storage.onChanged.addListener(callback)

  browser.storage.sync.get("ghrOn").then((res) => {
    if (!res.ghrOn) {
      console.log("Git-privacy deactivated");
      return;
    }
    function createPopup(){
      console.log("Open popup");
      // - insert div around ts element if not already present
      // TODO-CB Maybe remove divs after menu closing to tidy up DOM?
      // https://stackoverflow.com/a/11601108
      var parent = this.parentNode;
      if (!parent.classList.contains("dropdown")) {
        var ddwrapper = document.createElement("div");
        ddwrapper.classList.add("dropdown");
        parent.insertBefore(ddwrapper, this);
        ddwrapper.appendChild(this);
        var ddcontent = document.createElement("div");
        ddcontent.classList.add("dropdown-content");
        ddwrapper.appendChild(ddcontent);
        var dditem1 = document.createElement("a");
        var ts = this;
        dditem1.addEventListener('click', function() { unredact(ts); });
        dditem1.innerHTML = "Full precision";
        ddcontent.appendChild(dditem1);
      } else {
        var ddcontent = this.nextElementSibling;
      }
      // - set menu visible
      ddcontent.classList.toggle("show");
      // - set close listeners (click outside)
      window.onclick = function(event) {
        if (!event.target.matches('.dropbtn')) {
          var dropdowns = document.getElementsByClassName("dropdown-content");
          var i;
          for (i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
              openDropdown.classList.remove('show');
            }
          }
        }
      }
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
          // remember original datetime for selective controls
          el.dataset.dtoriginally = el.getAttribute("datetime");
          // remember used redaction setting
          el.dataset.redactions = JSON.stringify(res);
          // apply redaction
          let dateTime = DateTime.fromISO(el.getAttribute("datetime"));
          if (res.ghrRedactMonth) {
            dateTime = dateTime.set({ month: 1 });
          }
          if (res.ghrRedactDay) {
            dateTime = dateTime.set({ day: 1 });
          }
          if (res.ghrRedactHours) {
            dateTime = dateTime.set({ hour: 0 });
          }
          if (res.ghrRedactMinutes) {
            dateTime = dateTime.set({ minute: 0 });
          }
          if (res.ghrRedactSeconds) {
            dateTime = dateTime.set({ second: 0 });
          }
          el.setAttribute("datetime", dateTime.toISO());
          el.setAttribute("redacted", true);

          // - make el the dropdown button
          el.classList.add("dropbtn");
          // - set popup trigger
          el.addEventListener('click', createPopup);
        });
    }
    function unredact(el) {
      // reset to original datetime
      console.log("Unredact");
      el.setAttribute("datetime", el.dataset.dtoriginally);
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
            dateTime = dateTime.set({ month: 1 });
          }
          if (res.ghrRedactDay) {
            dateTime = dateTime.set({ day: 1 });
          }
          if (res.ghrRedactHours) {
            dateTime = dateTime.set({ hour: 0 });
          }
          if (res.ghrRedactMinutes) {
            dateTime = dateTime.set({ minute: 0 });
          }
          if (res.ghrRedactSeconds) {
            dateTime = dateTime.set({ second: 0 });
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
    document.addEventListener("pjax:end", function () {  // hook for partial refreshes
      connsole.log("Refresh hook");
      // content change without full page load
      redactTimelineTimestamps();
      redactTimestamps();
    });

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
