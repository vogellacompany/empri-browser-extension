import { DateTime } from "luxon";
import { v4 as uuidv4 } from 'uuid';


class MsuChoiceRecord {
  constructor(daysSince, url, tsType, msu, frequency = 0) {
    this.daysSinceOptIn = daysSince;
    this.url = url;
    this.xpath = tsType;
    this.mostSignificantUnit = msu;
    this.frequency = frequency;
  }

  inc() {
    this.frequency++;
  }

  matches(other) {
    return this.daysSinceOptIn == other.daysSinceOptIn &&
      this.url == other.url &&
      this.xpath == other.xpath &&
      this.mostSignificantUnit == other.mostSignificantUnit;
  }

  static from(json){
    return Object.assign(new MsuChoiceRecord(), json);
  }
}


class Report {
  constructor(partId) {
    this.participantIdentifier = partId;
    this.entries = [];
  }

  static from(json){
    let report = new Report(json.participantIdentifier);
    report.entries = Array.from(json.entries, MsuCoiceRecord.from);
    return report;
  }
}


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


export function calcDaysSince(date) {
  let datetime = DateTime.fromFormat(date, "yyyy-MM-dd");
  return -Math.trunc(datetime.diffNow("days").days);
}


export function updateStudyData(tsType, msu) {
  // increment counter in local storage area
  Promise.all([
    browser.storage.local.get("msuChoices"),
    browser.storage.sync.get("studyOptInDate"), // to calc daysSince
  ])
  .then((results) => {
    let local = results[0];
    let sync = results[1];

    if (local.msuChoices === undefined) {
      local.msuChoices = [];
    }

    let daysSince = calcDaysSince(sync.studyOptInDate);
    let newChoice = new MsuChoiceRecord(daysSince, "", tsType, msu);

    // reuse existing matching choice or add new one
    let msuChoices = Array.from(local.msuChoices, MsuChoiceRecord.from);
    let matchingRecord = msuChoices.find(newChoice.matches, newChoice);
    if (matchingRecord === undefined) {
      msuChoices.push(newChoice);
      matchingRecord = newChoice;
      console.log("No match");
    } else {
      console.log(`Matched ${JSON.stringify(matchingRecord)}`);
    }

    // increment choice frequency
    matchingRecord.inc();
    console.log(`LS: msuChoices ${JSON.stringify(msuChoices)}`);

    // store updated stats
    return browser.storage.local.set({ msuChoices: msuChoices });
  })
  .catch(error => console.error(error));
}
