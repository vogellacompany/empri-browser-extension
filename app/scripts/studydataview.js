import { buildReport, calcDaysSince, resetStudyData, MsuChoiceRecord } from "./study.js";

(() => {
  let optin = document.querySelector("#optIn");
  let msuTable = document.querySelector("#msu-choices > tbody");
  let viewCountTable = document.querySelector("#view-counts > tbody");
  let partIdCell = document.querySelector("#participantId");
  let optInDateCell = document.querySelector("#optInDate");
  let daysSinceCell = document.querySelector("#daysSinceOptIn");
  let lastReportCell = document.querySelector("#lastReport");

  function loadStudyData() {
    return browser.storage.local.get([
      "msuChoices",
      "studyLastReport",
      "studyOptIn",
      "studyParticipantId",
      "studyOptInDate",
      "viewCounts",
    ])
    .then((res) => {
      optin.textContent = res.studyOptIn ? "yes" : "no";
      if (res.studyParticipantId) {
        partIdCell.textContent = res.studyParticipantId;
      }
      if (res.studyOptInDate) {
        optInDateCell.textContent = res.studyOptInDate;
        daysSinceCell.textContent = calcDaysSince(res.studyOptInDate);
      }
      if (res.studyLastReport) {
        lastReportCell.textContent = res.studyLastReport;
      }

      if (res.msuChoices !== undefined) {
        let msuChoices = res.msuChoices.map(MsuChoiceRecord.from);
        msuTable.querySelector(".placeholder").remove();
        msuChoices.forEach(addMsuChoiceRows);
      }

      if (res.viewCounts !== undefined) {
        let hasCounts = false;
        let vc = res.viewCounts;
        for (let day in vc) {
          if (vc.hasOwnProperty(day)) {
            for (let type in vc[day]) {
              if (vc[day].hasOwnProperty(type)) {
                addViewCountRow(day, type, vc[day][type]);
                hasCounts = true;
              }
            }
          }
        }
        if (hasCounts) {
          viewCountTable.querySelector(".placeholder").remove();
        }
      }
    })
    .catch(error => console.error(error));
  }

  function addMsuChoiceRows(record) {
    var row = document.createElement("tr");
    var urlCol = document.createElement("td");
    urlCol.textContent = record.url;
    row.appendChild(urlCol);
    var tsCol = document.createElement("td");
    tsCol.textContent = record.xpath;
    row.appendChild(tsCol);
    var msuCol = document.createElement("td");
    msuCol.textContent = record.mostSignificantUnit;
    row.appendChild(msuCol);
    var daysCol = document.createElement("td");
    daysCol.textContent = record.daysSinceOptIn;
    row.appendChild(daysCol);
    var distMeanCol = document.createElement("td");
    distMeanCol.textContent = record.distanceStats.mean;
    row.appendChild(distMeanCol);
    var freqCol = document.createElement("td");
    freqCol.textContent = record.frequency;
    row.appendChild(freqCol);
    msuTable.appendChild(row);
  }
  function addViewCountRow(day, type, count) {
    var row = document.createElement("tr");
    var dCol = document.createElement("td");
    dCol.textContent = day;
    row.appendChild(dCol);
    var tCol = document.createElement("td");
    tCol.textContent = type;
    row.appendChild(tCol);
    var cCol = document.createElement("td");
    cCol.textContent = count;
    row.appendChild(cCol);
    viewCountTable.appendChild(row);
  }

  document.addEventListener("DOMContentLoaded", loadStudyData);
  document.querySelector("#studypurge").addEventListener("click", resetStudyData);
  document.querySelector("#clipcopy").addEventListener("click", (event) => {
    buildReport(0)
    .then((report) => {
      if (report) {
        return navigator.clipboard.writeText(JSON.stringify(report));
      }
    })
    .then(() => {
      console.log("Successfully copied to clipboard");
    })
    .catch((error) => console.error(error));
  });
})();
