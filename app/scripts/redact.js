import { DateTime } from "luxon";
import { updateStudyData } from "./study.js";

const dateprevFormat = "yyyy-MM-dd HH:mm:ss";

// GitHub View/URL classifier
const ghBaseUrlTypes = {
  root: /^\/?$/i,
  user: /^\/[^/]+\/?$/i,
};
const ghRepoUrlTypes = {
  compare: /^\/compare\/[^/]+\/?$/i,
  commits: /^\/commits\//i,
  commit: /^\/commit\/[0-9a-f]+\/?$/i,
  issuelist: /^\/issues\/?$/i,
  issue: /^\/issues\/\d+\/?$/i,
  label: /^\/labels\/\w+\/?$/i,
  milestone: /^\/milestones\/\d+\/?$/i,
  pulllist: /^\/pulls\/?$/i,
  pull: /^\/pull\/\d+\/?$/i,
  pullcommits: /^\/pull\/\d+\/commits\/?$/i,
  pullcommit: /^\/pull\/\d+\/commits\/[0-9a-f]+\/?$/i,
  repo: /^\/?$/i,
  releaselist: /^\/releases\/?$/i,
  release: /^\/releases\/tag\/[^/]+\/?$/i,
  taglist: /^\/tags\/?$/i,
  tree: /^\/tree\//i,
};

// build simple xpath to element
function getPathTo(element) {
  // recursively build path from element up to the root
  if (element === document.body) {
    return element.tagName; // end recursion at root
  }
  return getPathTo(element.parentNode) + "/" + element.tagName;
}

function getTimestampType(el) {
  return getPathTo(el);
}

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
    const Timeunit = {
      Year: "year",
      Month: "month",
      Day: "day",
      Hour: "hour",
      Minute: "minute",
      Second: "second",
    };
    function createPopup(event) {
      // - insert div around ts element if not already present
      var parent = this.parentNode;
      if (!parent.classList.contains("dropdown")) {
        var ddwrapper = document.createElement("div");
        ddwrapper.classList.add("dropdown");
        parent.insertBefore(ddwrapper, this);
        ddwrapper.appendChild(this);
        var ddcontent = document.createElement("div");
        ddcontent.classList.add("dropdown-content");
        ddwrapper.appendChild(ddcontent);
        ddcontent.addEventListener("click", function(event) {
          // catch and discard all clicks on the open popup
          // to prevent parent links from being followed etc
          event.preventDefault();
          event.stopPropagation();
        });
        var ts = this;
        // Date preview <input id="dateprev" type="datetime-local" readonly>
        var dateprev = document.createElement("span");
        dateprev.id = "dateprev";
        let dateTime = DateTime.fromISO(ts.getAttribute("datetime"));
        dateprev.innerHTML = dateTime.toFormat(dateprevFormat);
        dateprev.classList.add("datebox");
        ddcontent.appendChild(dateprev);
        // Enhance button – increase msu by one
        var enhancebtn = document.createElement("button");
        enhancebtn.id = "enhance";
        enhancebtn.innerHTML = "+";
        enhancebtn.addEventListener("click", function () {
          increaseMsu(ts);
        });
        ddcontent.appendChild(enhancebtn);
        // Ok/close button – dummy button to close the popup
        var okbtn = document.createElement("button");
        okbtn.innerHTML = "✓";
        okbtn.addEventListener("click", function () {
          removePopup(ts); // remove remaining dropdowns from DOM
          logChoice(ts); // log the redaction choice
        });
        ddcontent.appendChild(okbtn);
        // Info Text
        var info = document.createElement("p");
        info.innerHTML = "Select date precision";
        ddcontent.appendChild(info);
        // add msu quick-selectors/indicators
        function addMsuSel(msu, displayText) {
          var sel = document.createElement("a");
          sel.id = msu;
          sel.addEventListener("click", function() {
            unredact(ts, msu);
            removePopup(ts); // remove remaining dropdowns from DOM
            logChoice(ts); // log the redaction choice
          });
          sel.innerHTML = displayText;
          ddcontent.appendChild(sel);
          return sel;
        }
        addMsuSel(Timeunit.Year, "yyyy");
        addMsuSel(Timeunit.Month, "mm");
        addMsuSel(Timeunit.Day, "dd");
        addMsuSel(Timeunit.Hour, "HH");
        addMsuSel(Timeunit.Minute, "MM");
        addMsuSel(Timeunit.Second, "SS");
      } else {
        var ddcontent = this.nextElementSibling;
      }
      // - set active msu
      setActiveMsu(ts);
      // - set menu visible
      ddcontent.classList.toggle("show");
      // - stop propagation of click to parent nodes
      event.preventDefault();
      event.stopPropagation();
    }
    function setActiveMsu(el) {
      let msu = el.dataset.mostsigunit;
      document.getElementById(msu).classList.add("active");
    }
    function increaseMsu(el) {
      let msu = el.dataset.mostsigunit;
      if (msu == "second") return; // cannot increase any further
      let nextMsuEl = document.getElementById(msu).nextSibling;
      let nextMsu = nextMsuEl.id;
      // clear all active marks
      document.querySelectorAll("a.active").forEach((a) => {
        a.classList.remove("active");
      });
      // set new active msu
      unredact(el, nextMsu);
      // update dateprev
      let dateTime = DateTime.fromISO(el.getAttribute("datetime"));
      document.querySelector("#dateprev").innerHTML = dateTime.toFormat(
        dateprevFormat
      );
      setActiveMsu(el);
    }
    function removePopup(el) {
      // remove dropdown elements from DOM
      var parent = el.parentNode;
      if (!parent.classList.contains("dropdown")) {
        return; // no popup to remove
      }
      var ddwrapper = parent;
      var origParent = ddwrapper.parentNode;
      origParent.insertBefore(el, ddwrapper);
      origParent.removeChild(ddwrapper);
    }
    function redact2globalpref(el) {
      browser.storage.sync.get(["mostsigunit"]).then((res) => {
        // remember original datetime for selective controls
        el.dataset.dtoriginally = el.getAttribute("datetime");
        // apply redaction
        let dateTime = DateTime.fromISO(el.getAttribute("datetime"));
        let msu = res.mostsigunit;
        dateTime = redact(el, dateTime, msu);
        el.setAttribute("datetime", dateTime.toISO());

        // - make el the dropdown button
        el.classList.add("dropbtn");
        // - set popup trigger
        el.addEventListener("click", createPopup);
      });
    }
    function redact(el, dateTime, mostsigunit) {
      // redact precision to the most significant unit
      switch (
        mostsigunit // fall through
      ) {
        case Timeunit.Year:
          dateTime = dateTime.set({ month: 1 });
        case Timeunit.Month:
          dateTime = dateTime.set({ day: 1 });
        case Timeunit.Day:
          dateTime = dateTime.set({ hour: 0 });
        case Timeunit.Hour:
          dateTime = dateTime.set({ minute: 0 });
        case Timeunit.Minute:
          dateTime = dateTime.set({ second: 0 });
        case Timeunit.Second:
          // nothing to redact if seconds are wanted
          break;
      }
      el.dataset.redacted = true; // flag to avoid repeated redactions
      el.dataset.mostsigunit = mostsigunit; // remember redaction level
      return dateTime;
    }
    function unredact(el, mostsigunit = Timeunit.Second) {
      let dateTime = redact(
        el,
        DateTime.fromISO(el.dataset.dtoriginally),
        mostsigunit
      );
      el.setAttribute("datetime", dateTime.toISO());
    }
    function logChoice(el) {
      // log the unredaction choice of the user
      //removePopup(el);  // make sure DOM is clean for path calc
      // unredact to the msu of the original datetime
      let tsType = getTimestampType(el);
      let msu = el.dataset.mostsigunit;
      let urlType = getUrlType();
      console.log(`Unredact ${urlType} ${tsType} to ${msu}`);
      browser.storage.sync.get("studyOptIn")
      .then((res) => {
        if (res.studyOptIn) {
          return updateStudyData(urlType, tsType, msu);
        }
      })
      .catch(error => console.error(error));
    }
    function getUrlType() {
      let path = window.location.pathname;
      let numPathComp = path.split("/").length - 1; // -1 because path starts with /
      let subrepopath = path.replace(/^(\/[^/]+){2}/i, "");
      let types;
      if (numPathComp < 2) {
        types = ghBaseUrlTypes;
      } else {
        path = path.replace(/^(\/[^/]+){2}/i, "");
        types = ghRepoUrlTypes;
      }
      for (var type in types) {
        if (types.hasOwnProperty(type)) {
            if (types[type].test(path)) {
                return type;
            }
        }
      }
      console.error(`No matching url type for ${path}`);
      return "unknown";
    }

    function redactTimestamps() {
      document.querySelectorAll("time-ago, relative-time").forEach((el) => {
        redact2globalpref(el);
      });
    }

    console.log("Redacting timestamps");
    redactTimestamps();

    function redactTimelineItem(el) {
      return browser.storage.sync.get(["mostsigunit"]).then((res) => {
        // "Commits on Jul 12, 2020".substring(11) -> "Jul 12, 2020"
        let text = el.textContent.substring(11);
        let dateTime = DateTime.fromFormat(text, "MMM d, y");
        el.dataset.dtoriginally = dateTime;
        var msu = res.mostsigunit;
        dateTime = redact(el, dateTime, msu);
        el.textContent = "Commits on " + dateTime.toFormat("MMM d, y");
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
    document.addEventListener("pjax:end", function () {
      // hook for partial refreshes
      console.log("Refresh hook");
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
          !node.dataset.redacted
        ) {
          redact2globalpref(node);
        }
      });
    });

    observer.observe(document, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false,
    });

    // - set popup close listeners (click outside)
    window.onclick = function (event) {
      if (!event.target.matches(".dropbtn")) {
        document.querySelectorAll(".dropdown-content.show").forEach((dd) => {
          dd.classList.remove("show");
        });
        document.querySelectorAll(".dropdown > .dropbtn").forEach((dbtn) => {
          removePopup(dbtn); // remove remaining dropdowns from DOM
          logChoice(dbtn); // log the redaction choice
        });
      }
    };
  });
})();
