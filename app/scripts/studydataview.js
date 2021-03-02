import { mapreplacer, mapreviver } from "./utils.js";

(() => {
  let placeholder = document.querySelector("#placeholder");
  let msuTable = placeholder.parentElement;

  function loadStudyData() {
    browser.storage.local
      .get([
        "msuChoices",
      ])
      .then((res) => {
        let msuChoices = res.msuChoices;
        if (msuChoices === undefined) {
          return;  // load nothing
        }
        placeholder.remove();
        msuChoices = JSON.parse(msuChoices, mapreviver);
        msuChoices.forEach(addMsuChoiceRows);
      });
  }

  function addMsuChoiceRows(msuChoices, tsType) {
    var group = document.createElement("tbody");
    msuChoices.forEach((frequency, msu) => {
      var row = document.createElement("tr");
      var tsCol = document.createElement("td");
      tsCol.innerHTML = tsType;
      row.appendChild(tsCol);
      var msuCol = document.createElement("td");
      msuCol.innerHTML = msu;
      row.appendChild(msuCol);
      var freqCol = document.createElement("td");
      freqCol.innerHTML = frequency;
      row.appendChild(freqCol);
      group.appendChild(row);
    });
    msuTable.appendChild(group);
  }


  function clearStudyData() {
    browser.storage.local.remove("msuChoices");
  }

  document.addEventListener("DOMContentLoaded", loadStudyData);
  document.querySelector("#studypurge").addEventListener("click", clearStudyData);
})();
