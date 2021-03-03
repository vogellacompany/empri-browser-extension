import { DateTime } from "luxon";
import { resetStudyData } from "./study.js";

(() => {
  let msu = document.querySelector("#mostsigunit");
  let exampleField = document.querySelector("#example");
  let studyOptIn = document.querySelector("#study-optin");

  function saveOptions(e) {
    browser.storage.sync.set({
      mostsigunit: msu.value,
      studyOptIn: studyOptIn.checked,
    });
    e.preventDefault();
  }

  function restoreOptions() {
    browser.storage.sync
      .get([
        "mostsigunit",
        "studyOptIn",
      ])
      .then((res) => {
        if (res.mostsigunit) {
          msu.value = res.mostsigunit;
        }
        studyOptIn.checked = res.studyOptIn;
      })
      .then(() => updateExampleField());
  }

  function updateExampleField() {
    let dateTime = DateTime.fromISO("2020-09-02T23:23:23");
    switch (msu.value) {  // fall through
      case "year":
        dateTime = dateTime.set({ month: 1 });
      case "month":
        dateTime = dateTime.set({ day: 1 });
      case "day":
        dateTime = dateTime.set({ hour: 0 });
      case "hour":
        dateTime = dateTime.set({ minute: 0 });
      case "minute":
        dateTime = dateTime.set({ second: 0 });
      case "second":
        // nothing to redact if seconds are wanted
        break;
    }
    let v = dateTime.toFormat("yyyy-MM-dd'T'HH:mm:ss");
    console.log(v);
    exampleField.value = v;
  }

  document.addEventListener("DOMContentLoaded", restoreOptions);
  document.querySelector("form").addEventListener("submit", saveOptions);
  document.querySelector("form").addEventListener("submit", function() {window.close();});
  document.querySelector("#mostsigunit").addEventListener("change", updateExampleField);
  document.querySelector("#study-optin").addEventListener("change", resetStudyData);
})();
