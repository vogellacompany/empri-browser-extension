import { DateTime } from "luxon";
import { clearStudyData, initStudy } from "./study.js";

(() => {
  let msu = document.querySelector("#mostsigunit");
  let exampleField = document.querySelector("#example");
  let studyOptIn = document.querySelector("#study-optin");

  function saveOptions(e) {
    console.assert(!studyOptIn.checked || msu.value == "year");
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
        if (res.studyOptIn) {
          disableMsuSelection();
        }
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

  function disableMsuSelection() {
    msu.value = "year";
    msu.disabled = true;
    msu.title = "Study participation requires Year precision.";
    updateExampleField();
  }

  function enableMsuSelection() {
    msu.disabled = false;
    msu.title = "";
  }

  document.addEventListener("DOMContentLoaded", restoreOptions);
  document.querySelector("form").addEventListener("submit", saveOptions);
  document.querySelector("form").addEventListener("submit", function() {window.close();});
  document.querySelector("#mostsigunit").addEventListener("change", updateExampleField);
  document.querySelector("#study-optin").addEventListener("change", function() {
    clearStudyData()
    .then(() => {
      if (this.checked) {
        disableMsuSelection();
        return initStudy();
      } else {
        enableMsuSelection();
      }
    })
    .catch(error => console.error(error));
  });
})();
