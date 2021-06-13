import { DateTime } from "luxon";
import { updateStudyData, sendReport, updateViewCount } from "./study.js";
import { toFuzzyDate } from "./fuzzydate.js";
import { createPopper } from '@popperjs/core';

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
  milestonelist: /^\/milestones\/?$/i,
  milestonelistfilter: /^\/milestones\/[^/]+\/?$/i,
  milestone: /^\/milestone\/\d+\/?$/i,
  pulllist: /^\/pulls\/?$/i,
  pull: /^\/pull\/\d+\/?$/i,
  pullcommits: /^\/pull\/\d+\/commits\/?$/i,
  pullcommit: /^\/pull\/\d+\/commits\/[0-9a-f]+\/?$/i,
  pullchecks: /^\/pull\/\d+\/checks\/?$/i,
  repo: /^\/?$/i,
  releaselist: /^\/releases\/?$/i,
  release: /^\/releases\/tag\/[^/]+\/?$/i,
  taglist: /^\/tags\/?$/i,
  treeroot: /^\/tree\/[^/]+\/?$/i,
  treesub: /^\/tree\/[^/]+\/.+$/i,
  blob: /^\/blob\/[^/]+\//i,
  wikipage: /^\/wiki(\/[^/]+)?\/?$/i,
  wikipagehistory: /^\/wiki\/([^/]+)\/_history$/i,
  wikipagerev: /^\/wiki\/([^/]+)\/([0-9a-f]+)\/?$/i,
  workflowruns: /^\/actions(\/workflows\/[^/]+)?\/?$/i,
  workflowrun: /^\/actions\/runs\/(\d+)\/?$/i,
  jobrun: /^\/runs\/(\d+)\/?$/i,
  projectlist: /^\/projects\/?$/i,
  project: /^\/projects\/(\d+)\/?$/i,
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

function getSiblingTimestamps(el) {
  // returns Array of timestamps that share the same xpath
  let xpath = getPathTo(el)
  let iter = document.evaluate("//"+xpath, document, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null)
  let siblings = []
  var sibling = iter.iterateNext()
  while (sibling) {
    siblings.push(sibling)
    sibling = iter.iterateNext()
  }
  return siblings
}

function calcDistanceToClosestSibling(el) {
  // Returns absolute distance to closest sibling in seconds
  // or NaN if el has no siblings
  let siblings = getSiblingTimestamps(el)
  let elIdx = siblings.indexOf(el)
  console.assert(elIdx !== -1, "Element not found in siblings")
  let directSibs = siblings.filter((sib, idx) => {
    return Math.abs(idx - elIdx) === 1
  })
  let distances = directSibs.map(sib => {
    let elDateTime = DateTime.fromISO(el.dataset.dtoriginally)
    let sibDateTime = DateTime.fromISO(sib.dataset.dtoriginally)
    return Math.abs(elDateTime.diff(sibDateTime).as("seconds"))
  })
  return Math.min(...distances)
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

    function clickBlackhole(event) {
      event.preventDefault();
      event.stopPropagation();
    }
    function hasPopup(ts) {
      var parent = ts.parentNode;
      return parent.classList.contains("dropdown-empri");
    }
    function createPopup(ts, twoClickNote = false) {
      // - insert div around ts element if not already present
      console.assert(ts.classList.contains("replaced"), "TS not replaced");
      var parent = ts.parentNode;
      let fuzDateEl = ts.nextSibling;
      if (!hasPopup(ts)) {
        var ddwrapper = document.createElement("div");
        ddwrapper.classList.add("dropdown-empri");
        parent.insertBefore(ddwrapper, ts);
        ddwrapper.appendChild(ts);
        ddwrapper.appendChild(fuzDateEl);
        if (twoClickNote) {
          var note = document.createElement("div");
          note.textContent = "Click again to follow link";
          note.classList.add("popuptext");
          note.classList.add("show");
          note.addEventListener("click", clickBlackhole);
          let arrow = document.createElement("div");
          arrow.setAttribute("data-popper-arrow", "");
          arrow.id = "arrow";
          note.appendChild(arrow);
          ddwrapper.appendChild(note);
          createPopper(fuzDateEl, note, {
            placement: 'top',
            strategy: popperStrategyFor(ts),
            modifiers: [
              {
                name: 'offset',
                options: {
                  offset: [0, 3],
                },
              },
              {
                name: 'preventOverflow',
                options: {
                  mainAxis: false, // true by default
                },
              },
            ],
          });
        }
        var ddcontent = document.createElement("div");
        ddcontent.classList.add("dropdown-content");
        ddwrapper.appendChild(ddcontent);
        // catch and discard all clicks on the open popup
        // to prevent parent links from being followed etc
        ddcontent.addEventListener("click", clickBlackhole);
        // Date preview <input id="dateprev" type="datetime-local" readonly>
        var dateprev = document.createElement("span");
        dateprev.id = "dateprev";
        let dateTime = DateTime.fromISO(ts.getAttribute("datetime"));
        dateprev.textContent = dateTime.toFormat(dateprevFormat);
        dateprev.classList.add("datebox");
        ddcontent.appendChild(dateprev);
        // Enhance button – increase msu by one
        var enhancebtn = document.createElement("button");
        enhancebtn.id = "enhance";
        enhancebtn.textContent = "+";
        enhancebtn.addEventListener("click", function () {
          increaseMsu(ts);
        });
        ddcontent.appendChild(enhancebtn);
        // Ok/close button – dummy button to close the popup
        var okbtn = document.createElement("button");
        okbtn.textContent = "✓";
        okbtn.addEventListener("click", function () {
          saveAndRemovePopup(ts);
        });
        ddcontent.appendChild(okbtn);
        // Info Text
        var info = document.createElement("p");
        info.textContent = "Select date precision";
        ddcontent.appendChild(info);
        // add msu quick-selectors/indicators
        function addMsuSel(msu, displayText) {
          var sel = document.createElement("a");
          sel.id = msu;
          sel.addEventListener("click", function() {
            unredact(ts, msu);
            ts.dataset.msuChanged = true;
            saveAndRemovePopup(ts);
          });
          sel.textContent = displayText;
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
        var ddcontent = ts.nextElementSibling;
      }
      // - set active msu
      setActiveMsu(ts);
      // - set menu visible
      ddcontent.classList.toggle("show");
      createPopper(fuzDateEl, ddcontent, {
        placement: 'bottom-start',
        strategy: popperStrategyFor(ts),
        modifiers: [
          {
            name: 'offset',
            options: {
              offset: [0, 3],
            },
          },
          {
            name: 'preventOverflow',
            options: {
              mainAxis: false, // true by default
            },
          },
        ],
      });
    }
    function popperStrategyFor(el) {
      // GitHub seems to use details-menu elements for all it's dropdowns
      return el.closest("details-menu") || el.closest(".js-project-card-details-pane") ? "fixed" : "absolute";
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
      document.querySelector("#dateprev").textContent = dateTime.toFormat(
        dateprevFormat
      );
      setActiveMsu(el);
      el.dataset.msuChanged = true;
    }
    function removePopup(el) {
      // remove dropdown elements from DOM
      var parent = el.parentNode;
      let fuzDateEl = el.nextSibling;
      console.assert(fuzDateEl && fuzDateEl.classList.contains("dropbtn"), "Sibling not fuzzy date");
      if (!parent.classList.contains("dropdown-empri")) {
        return; // no popup to remove
      }
      var ddwrapper = parent;
      var origParent = ddwrapper.parentNode;
      origParent.insertBefore(el, ddwrapper);
      origParent.insertBefore(fuzDateEl, ddwrapper);
      origParent.removeChild(ddwrapper);
    }
    function saveAndRemovePopup(dbtn) {
      removePopup(dbtn); // remove remaining dropdowns from DOM
      logChoice(dbtn); // log the redaction choice
    }
    function hasAnchorParent(el) {
      while (el.parentNode) {
        el = el.parentNode;
          if (el.tagName === 'A')
            return true;
      }
      return false;
    }
    function tsClickHandler(event) {
      let alreadyOpen = hasPopup(this);
      // - save and remove all popups
      // (including potentially open one for this)
      saveAndRemoveAllPopups();
      if (alreadyOpen) {
        // second click closes, no re-open (toggle)
        return;
      }
      let anchorParent = hasAnchorParent(this);
      createPopup(this, anchorParent);
      // - stop propagation of opening click to parent nodes
      event.preventDefault();
      event.stopPropagation();
    }
    function addTsClickHandler(el) {
      el.addEventListener("click", tsClickHandler);
      el.setAttribute("role", "button");
    }
    function fuzDateClickHandler(event) {
      // redirect event to time-element
      let timeEl = this.parentNode.querySelector(".dropbtn.replaced");
      console.assert(timeEl.classList.contains("dropbtn"), "Sibling not time-element %s", timeEl);
      let popupOpen = hasPopup(timeEl);
      const newEvent = new Event('click');
      timeEl.dispatchEvent(newEvent);
      if (!popupOpen) { // allow anchor following on second click
        event.preventDefault();
        event.stopPropagation();
      }
    }
    function updateFuzzyDateElement(fuzEl, dateTime, msu) {
      fuzEl.textContent = toFuzzyDate(dateTime, msu);
      fuzEl.title = toFuzzyDate(dateTime, msu, false, true);
    }
    function redactTimeElement(timeEl) {
      browser.storage.sync.get(["mostsigunit"]).then((res) => {
        // apply redaction
        let dateTime = DateTime.fromISO(timeEl.getAttribute("datetime"));
        let msu = res.mostsigunit;
        dateTime = initialRedact(timeEl, dateTime, msu);
        timeEl.setAttribute("datetime", dateTime.toISO());
        // - make timeEl the dropdown button
        timeEl.classList.add("dropbtn");
        // - set popup trigger
        addTsClickHandler(timeEl);

        let fuzDateEl
        if (!timeEl.classList.contains("replaced")) {
          fuzDateEl = document.createElement("span");
          fuzDateEl.classList.add("dropbtn");
          timeEl.parentElement.insertBefore(fuzDateEl, timeEl.nextSibling);
          fuzDateEl.setAttribute("role", "button");
          timeEl.classList.add("replaced");
        } else {
          fuzDateEl = timeEl.nextSibling;
          console.assert(fuzDateEl.classList.contains("dropbtn"), "Sibling not fuzzy date");
        }
        // set or re-set listener
        // (also necessary for existing fuzDateEl, e.g., after a history
        // navigation)
        fuzDateEl.addEventListener("click", fuzDateClickHandler);
        updateFuzzyDateElement(fuzDateEl, dateTime, msu);
      });
    }
    function tsNeedsProcessing(el) {
      return (
        el.dataset.dtoriginally === undefined
        || el.listeners === undefined
      );
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
      el.dataset.mostsigunit = mostsigunit; // remember redaction level
      return dateTime;
    }
    function initialRedact(el, dateTime, mostsigunit) {
      if (el.dataset.dtoriginally) {
        // run only once to avoid overwriting dtoriginally
        return dateTime;
      }
      let newDateTime = redact(el, dateTime, mostsigunit);
      el.dataset.dtoriginally = dateTime.toISO(); // preserve original date for unredaction
      return newDateTime;
    }
    function unredact(el, mostsigunit = Timeunit.Second) {
      let dateTime = redact(
        el,
        DateTime.fromISO(el.dataset.dtoriginally),
        mostsigunit
      );
      el.setAttribute("datetime", dateTime.toISO());
      if (el.classList.contains("replaced")) {
        // get fuzzy date element
        // was next sibling of time-element but with
        // popup its now sibling of the parent div
        const fuzDateEl = el.nextSibling;
        console.assert(fuzDateEl && fuzDateEl.classList.contains("dropbtn"));
        updateFuzzyDateElement(fuzDateEl, dateTime, mostsigunit);
      }
    }
    function logViewLoad() {
      let urlType = getUrlType();
      console.log(`Log view load for ${urlType}`);
      browser.storage.local.get("studyOptIn")
      .then((res) => {
        if (res.studyOptIn) {
          updateViewCount(urlType);
        }
      })
      .catch(error => console.error(error));
    }
    function logChoice(el) {
      // log the unredaction choice of the user
      if (el.dataset.msuChanged !== "true") {
        return; // msu did not change – nothing to log
      }
      el.dataset.msuChanged = false; // clear flag
      // unredact to the msu of the original datetime
      let tsType = getTimestampType(el);
      let closestSibDist = calcDistanceToClosestSibling(el); // Infinite if no siblings
      let msu = el.dataset.mostsigunit;
      let urlType = getUrlType();
      console.log(`Unredact ${urlType} ${tsType} to ${msu} with distance ${closestSibDist}sec`);
      browser.storage.local.get("studyOptIn")
      .then((res) => {
        if (res.studyOptIn) {
          return updateStudyData(urlType, tsType, msu, closestSibDist);
        }
      })
      .catch(error => console.error(error));
    }
    function getUrlType() {
      let path = window.location.pathname;
      let numPathComp = path.split("/").reduce((cnt, val) => {
        if (val != "") {
          cnt++;
        }
        return cnt;
      }, 0);
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
        if (!tsNeedsProcessing(el)) return;
        redactTimeElement(el);
      });
    }

    console.log("Redacting timestamps");
    redactTimestamps();

    function redactTimelineItem(el) {
      return browser.storage.sync.get(["mostsigunit"]).then((res) => {
        // "Commits on Jul 12, 2020".substring(11) -> "Jul 12, 2020"
        let text = el.textContent.trim().substring(11);
        let dateTime = DateTime.fromFormat(text, "MMM d, y");
        var msu = res.mostsigunit;
        dateTime = initialRedact(el, dateTime, msu);
        const prep = (msu == "year" || msu == "month") ? "in" : "on";
        el.textContent = `Commits ${prep} ` + toFuzzyDate(dateTime, msu);
        return el;
      });
    }

    async function redactTimelineTimestamps() {
      redactTimelineNested();
      redactTimelineFlat();
    }

    async function redactTimelineNested() {
      // Textual date grouping header for list of commits
      // (not themselves timeline items)
      // format used on
      // - /user/repo/commits/master
      // - /user/repo/pull/42/commits
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

    async function redactTimelineFlat() {
      // Date text used for push item which are at
      // same (flat) nesting level as commit items
      // format used on /user/repo/compare/
      let prevDate = "";
      document.querySelectorAll(
        ".TimelineItem-badge > svg.octicon-repo-push"
      ).forEach(function (svgEl) {
        let tlEl = svgEl.parentElement.parentElement;
        let dateDiv = tlEl.querySelector(".TimelineItem-body");
        redactTimelineItem(dateDiv)
        .then((redEl) => {
          // remove subsequent items with the same
          // redacted date value, only keep the first.
          if (prevDate != redEl.textContent) {
            prevDate = redEl.textContent;
          } else {
            // remove the timelineitem but leave
            // the padding div around the push group
            redEl.parentNode.remove();
          }
        })
        .catch(error => console.error(error));
      });
    }

    async function redactCustomTimestamp(el, timeElement="relative-time") {
      // replace custom element with time-element
      // title format 2021-05-19 01:07:06 UTC
      // Note: luxon cannot handle this type of textual timezone
      // FIXME: Timezones are currently lost
      const titleFmt = "yyyy-MM-dd HH:mm:ss z";
      let dateTime = DateTime.fromFormat(el.title, titleFmt);
      let timeEl = document.createElement(timeElement);
      timeEl.setAttribute("datetime", dateTime.toISO());
      el.parentNode.insertBefore(timeEl, el);
      el.remove();
      redactTimeElement(timeEl);
    }

    function redactCustomTimestamps() {
      // Timestamps not rendered with time-elements
      // and not part of a timeline
      let urlType = getUrlType();

      if (urlType == "milestonelist") {
        document.querySelectorAll(".milestone-meta-item > span[title]").forEach(function (el) {
          redactCustomTimestamp(el, "time-ago");
        });
      }
    }

    redactTimelineTimestamps();
    redactCustomTimestamps();
    document.addEventListener("pjax:end", function () {
      // hook for partial refreshes
      console.log("Refresh hook");
      // content change without full page load
      logViewLoad();
      redactTimelineTimestamps();
      redactCustomTimestamps();
      redactTimestamps();
    });

    console.log("Initializing git-privacy MutationObserver");
    let observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (!mutation.target) return;

        let node = mutation.target;
        if (
          (node.nodeName === "TIME-AGO" || node.nodeName === "RELATIVE-TIME") &&
          !node.dataset.dtoriginally
          // Warning: Checking for tsNeedsProcessing(node) will cause Firefox to hang somehow
        ) {
          redactTimeElement(node);
        } else {
          let timeElements = node.querySelectorAll("time-ago, relative-time");
          if (timeElements) {
            timeElements.forEach((el) => {
              if (!el.dataset.dtoriginally) {
                redactTimeElement(el);
              }
            });
          }
        }
      });
    });

    observer.observe(document, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false,
    });

    function saveAndRemoveAllPopups() {
      let wasOpen = false;
      document.querySelectorAll(".dropdown-empri > .dropbtn.replaced").forEach((dbtn) => {
        saveAndRemovePopup(dbtn); // remove remaining dropdowns from DOM
        wasOpen = true;
      });
      return wasOpen;
    }

    // - set popup close listeners (click outside)
    window.onclick = function (event) {
      if (!event.target.matches(".dropbtn")) {
        document.querySelectorAll(".dropdown-content.show").forEach((dd) => {
          dd.classList.remove("show");
        });
        saveAndRemoveAllPopups();
      }
    };
    document.addEventListener('keydown', function(event) {
      if (event.key === "Escape") {
        let wasOpen = saveAndRemoveAllPopups();
        if (wasOpen) { // Esc was probably intended for us
          // prevent Esc to also close higher-level menus
          event.preventDefault();
          event.stopPropagation();
        }
      }
    }, true);

    // - log view for study (if opted in)
    logViewLoad();

    // - send study report if participanting and necessary
    browser.storage.local.get("studyOptIn")
    .then((res) => {
      if (res.studyOptIn) {
        return sendReport();
      }
    })
    .catch(error => console.error(error));
  });
})();
