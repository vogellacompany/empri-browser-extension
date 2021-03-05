import { DateTime } from "luxon";
import { v4 as uuidv4 } from 'uuid';
import { mapreplacer, mapreviver } from "./utils.js";


// Random participant identifier
function generateParticipantId() {
  return uuidv4();
}


// Init study
// - generate participant id if not set
// - set opt-in date
export function initStudy() {
  console.log("Init Study");
  browser.storage.sync
    .get([
      "studyParticipantId",
      "studyOptInDate", // FIXME if optIn is handled locally per client, this should too
    ])
    .then((res) => {
      if (res.studyParticipantId === undefined) {
        let partId = generateParticipantId();
        console.log(`New participant id: ${partId}`);
        browser.storage.sync.set({
          studyParticipantId: partId,
        });
      }
      if (res.studyOptInDate === undefined) {
        let optInDate = DateTime.utc().toFormat("yyyy-MM-dd");
        console.log(`New opt-in date: ${optInDate}`);
        browser.storage.sync.set({
          studyOptInDate: optInDate,
        });
      }
    });
}


export function clearStudyData() {
  browser.storage.local.remove("msuChoices");
  browser.storage.sync.remove("studyParticipantId");
  browser.storage.sync.remove("studyOptInDate");
}


export function resetStudyData() {
  clearStudyData();
  initStudy();
}


export function getDaysSinceOptIn(callback) {
  browser.storage.sync.get("studyOptInDate").then((res) => {
    let optInDateRaw = res.studyOptInDate;
    if (optInDateRaw) {
      let optInDate = DateTime.fromFormat(optInDateRaw, "yyyy-MM-dd");
      let daysSinceOptIn = Math.trunc(optInDate.diffNow("days").days);
      callback(daysSinceOptIn);
    }
  });
}


export function updateStudyData(tsType, msu) {
  // increment counter in local storage area
  browser.storage.local
    .get("msuChoices") // {TSTYPE: {MSU: Counter, ...}, ...}
    .then((res) => {
      var msuChoices = res.msuChoices;
      if (msuChoices === undefined) {
        msuChoices = new Map();
      } else {
        msuChoices = JSON.parse(msuChoices, mapreviver);
      }

      var tsStats = msuChoices.get(tsType);
      if (tsStats === undefined) {
        tsStats = new Map();
      }
      var tsMsuCount = tsStats.get(msu);
      if (tsMsuCount === undefined) {
        tsMsuCount = 0;
      }
      tsMsuCount++;
      tsStats.set(msu, tsMsuCount);
      msuChoices.set(tsType, tsStats);
      let stringified = JSON.stringify(msuChoices, mapreplacer);
      console.log(`LS: msuChoices ${stringified}`);

      // store updated stats
      browser.storage.local.set({ msuChoices: stringified });
    });
}
