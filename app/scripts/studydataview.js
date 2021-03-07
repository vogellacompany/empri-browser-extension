import { calcDaysSince, resetStudyData } from "./study.js";

(() => {
  let placeholder = document.querySelector("#placeholder");
  let msuTable = placeholder.parentElement;
  let partIdCell = document.querySelector("#participantId");
  let optInDateCell = document.querySelector("#optInDate");
  let daysSinceCell = document.querySelector("#daysSinceOptIn");

  function loadStudyData() {
    browser.storage.local.get("msuChoices")
    .then((res) => {
      let msuChoices = res.msuChoices;
      if (msuChoices === undefined) {
        return;  // load nothing
      }
      placeholder.remove();
      msuChoices.forEach(addMsuChoiceRows);
    })
    .catch(error => console.error(error));

    browser.storage.sync.get([
      "studyParticipantId",
      "studyOptInDate",
    ])
    .then((res) => {
      if (res.studyParticipantId) {
        partIdCell.innerHTML = res.studyParticipantId;
      }
      if (res.studyOptInDate) {
        optInDateCell.innerHTML = res.studyOptInDate;
        daysSinceCell.innerHTML = calcDaysSince(res.studyOptInDate);
      }
    })
    .catch(error => console.error(error));
  }

  function addMsuChoiceRows(record) {
    var row = document.createElement("tr");
    var urlCol = document.createElement("td");
    urlCol.innerHTML = record.url;
    row.appendChild(urlCol);
    var tsCol = document.createElement("td");
    tsCol.innerHTML = record.xpath;
    row.appendChild(tsCol);
    var msuCol = document.createElement("td");
    msuCol.innerHTML = record.mostSignificantUnit;
    row.appendChild(msuCol);
    var daysCol = document.createElement("td");
    daysCol.innerHTML = record.daysSinceOptIn;
    row.appendChild(daysCol);
    var freqCol = document.createElement("td");
    freqCol.innerHTML = record.frequency;
    row.appendChild(freqCol);
    msuTable.appendChild(row);
  }


  document.addEventListener("DOMContentLoaded", loadStudyData);
  document.querySelector("#studypurge").addEventListener("click", resetStudyData);
})();
