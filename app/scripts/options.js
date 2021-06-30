import { DateTime } from "luxon";
import { clearStudyData, initStudy, requestDeletion } from "./study.js";

(() => {
  let msu = document.querySelector("#mostsigunit");
  let exampleField = document.querySelector("#example");
  let studyOptIn = document.querySelector("#study-optin");
  let purgeModal = document.querySelector("#datapurgemodal");
  let serverDeleteBox = document.querySelector("#deleteServer");
  let responseEl = document.querySelector("#response");

  function saveOptions() {
    console.assert(!studyOptIn.checked || msu.value == "year");
    return browser.storage.sync.set({ mostsigunit: msu.value })
    .then(() => {
      return browser.storage.local.set({ studyOptIn: studyOptIn.checked });
    })
    .catch(error => console.error(error));
  }

  function restoreOptions() {
    return Promise.all([
      browser.storage.sync.get("mostsigunit"),
      browser.storage.local.get("studyOptIn"),
    ])
    .then((results) => {
      let msuval = results[0].mostsigunit;
      let optin = results[1].studyOptIn;

      if (msuval) {
        msu.value = msuval;
      }
      studyOptIn.checked = optin;
      if (optin) {
        disableMsuSelection();
      }
    })
    .then(() => updateExampleField())
    .catch(error => console.error(error));
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

  function abortOptOut() {
    purgeModal.style.display = "none";
    studyOptIn.checked = true;
  }

  document.addEventListener("DOMContentLoaded", restoreOptions);
  document.querySelector("#mostsigunit").addEventListener("change", function () {
    saveOptions()
    .then(() => {
      updateExampleField();
    })
    .catch(error => console.error(error));
  });
  document.querySelector("#study-optin").addEventListener("change", function() {
    if (this.checked) {
      // opting in
      clearStudyData()
      .then(() => {
        disableMsuSelection();
        return initStudy();
      })
      .then(() => {
        return saveOptions();
      })
      .catch(error => console.error(error));
    } else {
      // opting out
      purgeModal.style.display = "block";
    }
  });
  document.querySelector("#purgeAbort").addEventListener("click", abortOptOut);

  function optOutHandler(event) {
    // purge data
    responseEl.classList.remove("message-success", "message-failure");
    let doDelete = serverDeleteBox.checked;
    let deletion;
    if (doDelete) {
      console.log("Requesting deletion");
      deletion = requestDeletion().then((res) => {
        console.log(res);
        if (res.result == "notsent" || res.result == "deleted") {
          return true;
        } else {
          responseEl.textContent = `Error ${res.status} while deleting study data. Please contact support.`;
          responseEl.classList.add("message-failure");
          abortOptOut();
          return false;
        }
      });
    } else {
      deletion = Promise.resolve(true);
    }
    deletion.then((success) => {
      if (success) {
        return clearStudyData(); // fulfilled with no return
      }
      return success; // to be distinguishable from clears undefined
    })
    .then((res) => {
      if (res === undefined) {  // clear succeeded
        enableMsuSelection();
        return saveOptions();
      }
    })
    .catch(error => {
      console.error(error);
      responseEl.textContent = `Error ${error}. Please contact support.`;
      responseEl.classList.add("message-failure");
      abortOptOut();
    })
    .finally(() => {
      purgeModal.style.display = "none";
    });
  }
  document.querySelector("#purgeCont").addEventListener("click", optOutHandler);

  // When the user clicks anywhere outside of the modal, close it
  window.addEventListener("click", function(event) {
    if (event.target == purgeModal) {
      abortOptOut();
    }
  });
})();
