import { DateTime } from "luxon";
import { v4 as uuidv4 } from "uuid";

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
    return (
      this.daysSinceOptIn == other.daysSinceOptIn &&
      this.url == other.url &&
      this.xpath == other.xpath &&
      this.mostSignificantUnit == other.mostSignificantUnit
    );
  }

  static from(json) {
    return Object.assign(new MsuChoiceRecord(), json);
  }
}

class Report {
  constructor(partId) {
    this.participantIdentifier = partId;
    this.entries = [];
  }

  static from(json) {
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
  browser.storage.local.remove("studyLastReport");
  browser.storage.sync.remove("studyParticipantId");
  browser.storage.sync.remove("studyOptInDate");
}

export function resetStudyData() {
  clearStudyData();
  initStudy();
}

export function calcDaysSince(date, reference) {
  let refDate;
  if (reference === undefined) {
    refDate = DateTime.utc();
  } else {
    refDate = DateTime.fromFormat(reference, "yyyy-MM-dd");
  }
  let datetime = DateTime.fromFormat(date, "yyyy-MM-dd");
  return -Math.trunc(datetime.diff(refDate, "days").days);
}

export function updateStudyData(urlType, tsType, msu) {
  // increment counter in local storage area
  return Promise.all([
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
    let newChoice = new MsuChoiceRecord(daysSince, urlType, tsType, msu);

    // reuse existing matching choice or add new one
    let msuChoices = Array.from(local.msuChoices, MsuChoiceRecord.from);
    let matchingRecord = msuChoices.find(newChoice.matches, newChoice);
    if (matchingRecord === undefined) {
      msuChoices.push(newChoice);
      matchingRecord = newChoice;
    }

    // increment choice frequency
    matchingRecord.inc();

    // store updated stats
    return browser.storage.local.set({ msuChoices: msuChoices });
  })
  .catch((error) => console.error(error));
}

export function buildReport(firstDay = 0) {
  return Promise.all([
    browser.storage.local.get("msuChoices"),
    browser.storage.sync.get("studyParticipantId"),
  ])
  .then((results) => {
    let msuChoices = results[0].msuChoices;
    let partID = results[1].studyParticipantId;
    let report = new Report(partID);

    if (msuChoices === undefined) {
      msuChoices = [];
    }

    // filter out entries before firstDay
    let allEntries = Array.from(msuChoices, MsuChoiceRecord.from);
    report.entries = allEntries.filter((e) => e.daysSinceOptIn >= firstDay);

    return report;
  })
  .catch((error) => console.error(error));
}

export function sendReport() {
  return Promise.all([
    browser.storage.local.get("studyLastReport"),
    browser.storage.sync.get("studyOptInDate"),
  ])
  .then((results) => {
    let lastReport = results[0].studyLastReport;
    let optInDate = results[1].studyOptInDate;
    let startDay;

    if (lastReport === undefined) {
      startDay = 0; // first report – send everything
    } else {
      let daysSinceReport = calcDaysSince(lastReport);
      if (daysSinceReport < 1) {
        // already sent a report today – do nothing
        return;
      }
      startDay = calcDaysSince(lastReport, optInDate);
    }
    return buildReport(startDay);
  })
  .then((report) => {
    if (report && report.entries.length > 0) {
      console.log(report);
      return fetch(API_URL + "/data_point", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Basic " +
            btoa(
              process.env.BROWSER_USER + ":" + process.env.BROWSER_PASSWORD
            ),
        },
        body: JSON.stringify(report),
      })
    }
  })
  .then((res) => {
    if (res && res.status == 201) { // reporting succeeded
      // update last report date
      let today = DateTime.utc().toFormat("yyyy-MM-dd");
      return browser.storage.local.set({ studyLastReport: today });
    } else if (res) { // reporting failed somehow
      console.error("Reporting failed:", response);
    }
  });
}
