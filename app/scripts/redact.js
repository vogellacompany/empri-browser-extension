import { DateTime } from "luxon";


// from https://stackoverflow.com/a/2631931
function getPathTo(element) {
  if (element.id!=='')
    return 'id("'+element.id+'")';
  if (element===document.body)
    return element.tagName;

  var ix= 0;
  var siblings= element.parentNode.childNodes;
  for (var i= 0; i<siblings.length; i++) {
    var sibling= siblings[i];
    if (sibling===element)
      return getPathTo(element.parentNode)+'/'+element.tagName+'['+(ix+1)+']';
    if (sibling.nodeType===1 && sibling.tagName===element.tagName)
      ix++;
  }
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
      Second: "second"
    };
    function createPopup(){
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
        var ts = this;
        // Info Text
        var info = document.createElement("p");
        info.innerHTML = "Select date precision";
        ddcontent.appendChild(info);
        // Year
        var ddYear = document.createElement("a");
        ddYear.addEventListener('click', function() { unredact(ts, Timeunit.Year); });
        ddYear.innerHTML = "YYYY";
        ddcontent.appendChild(ddYear);
        // Month
        var ddMonth = document.createElement("a");
        ddMonth.addEventListener('click', function() { unredact(ts, Timeunit.Month); });
        ddMonth.innerHTML = "mm";
        ddcontent.appendChild(ddMonth);
        // Day
        var ddDay = document.createElement("a");
        ddDay.addEventListener('click', function() { unredact(ts, Timeunit.Day); });
        ddDay.innerHTML = "dd";
        ddcontent.appendChild(ddDay);
        // Hour
        var ddHour = document.createElement("a");
        ddHour.addEventListener('click', function() { unredact(ts, Timeunit.Hour); });
        ddHour.innerHTML = "HH";
        ddcontent.appendChild(ddHour);
        // Minute
        var ddMinute = document.createElement("a");
        ddMinute.addEventListener('click', function() { unredact(ts, Timeunit.Minute); });
        ddMinute.innerHTML = "MM";
        ddcontent.appendChild(ddMinute);
        // Second
        var ddSecond = document.createElement("a");
        ddSecond.addEventListener('click', function() { unredact(ts, Timeunit.Second); });
        ddSecond.innerHTML = "SS";
        ddcontent.appendChild(ddSecond);
      } else {
        var ddcontent = this.nextElementSibling;
      }
      // - set menu visible
      ddcontent.classList.toggle("show");
    }
    function removePopup(el){
      // remove dropdown elements from DOM
      var parent = el.parentNode;
      if (!parent.classList.contains("dropdown")) {
        return;  // no popup to remove
      }
      var ddwrapper = parent;
      var origParent = ddwrapper.parentNode;
      origParent.insertBefore(el, ddwrapper);
      origParent.removeChild(ddwrapper);
    }
    function redact2globalpref(el) {
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
          // apply redaction
          let dateTime = DateTime.fromISO(el.getAttribute("datetime"));
          var msu = Timeunit.Second;  // redacts actually nothing
          if (res.ghrRedactMonth) {
            msu = Timeunit.Year;
          } else if (res.ghrRedactDay) {
            msu = Timeunit.Month;
          } else if (res.ghrRedactHours) {
            msu = Timeunit.Day;
          } else if (res.ghrRedactMinutes) {
            msu = Timeunit.Hour;
          } else if (res.ghrRedactSeconds) {
            msu = Timeunit.Minute;
          }
          dateTime = redact(el, dateTime, msu);
          el.setAttribute("datetime", dateTime.toISO());

          // - make el the dropdown button
          el.classList.add("dropbtn");
          // - set popup trigger
          el.addEventListener('click', createPopup);
        });
    }
    function redact(el, dateTime, mostsigunit) {
      // redact precision to the most significant unit
      switch (mostsigunit) {  // fall through
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
      el.dataset.redacted = true;  // flag to avoid repeated redactions
      el.dataset.mostsigunit = mostsigunit;  // remember redaction level
      return dateTime;
    }
    function unredact(el, mostsigunit = Timeunit.Second) {
      removePopup(el);  // make sure DOM is clean for path calc
      // unredact to the msu of the original datetime
      let tsType = getTimestampType(el);
      console.log(`Unredact ${tsType} to ${mostsigunit}`);
      let dateTime = redact(
        el,
        DateTime.fromISO(el.dataset.dtoriginally),
        mostsigunit
      )
      el.setAttribute("datetime", dateTime.toISO());
    }

    function redactTimestamps() {
      document.querySelectorAll("time-ago, relative-time").forEach((el) => {
        redact2globalpref(el);
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
          el.dataset.dtoriginally = dateTime;
          var msu = Timeunit.Second;  // redacts actually nothing
          if (res.ghrRedactMonth) {
            msu = Timeunit.Year;
          } else if (res.ghrRedactDay) {
            msu = Timeunit.Month;
          } else if (res.ghrRedactHours) {
            msu = Timeunit.Day;
          } else if (res.ghrRedactMinutes) {
            msu = Timeunit.Hour;
          } else if (res.ghrRedactSeconds) {
            msu = Timeunit.Minute;
          }
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
    document.addEventListener("pjax:end", function () {  // hook for partial refreshes
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
    window.onclick = function(event) {
      if (!event.target.matches('.dropbtn')) {
        document.querySelectorAll(".dropdown-content.show").forEach((dd) => {
          dd.classList.remove('show');
        });
        document.querySelectorAll(".dropdown > .dropbtn").forEach((dbtn) => {
          removePopup(dbtn);  // remove remaining dropdowns from DOM
        });
      }
    }
  });
})();
