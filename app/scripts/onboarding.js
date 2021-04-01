import { clearStudyData, initStudy } from "./study.js";

function setOptInState() {
  browser.storage.local.get("studyOptIn").then((res) => {
    let optInBox = document.querySelector("#studyoptin");
    optInBox.checked = res.studyOptIn || false;
  });
}

setOptInState();
document.querySelector("#studyoptin").addEventListener("click", function() {
  clearStudyData()
  .then(() => {
    // init if checked
    if (this.checked) {
      return initStudy();
    }
  })
  .then(() => {
    // save opt-in state
    return browser.storage.local.set({ studyOptIn: this.checked });
  })
  .catch(error => console.error(error));
});
