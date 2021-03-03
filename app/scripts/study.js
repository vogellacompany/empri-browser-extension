import { v4 as uuidv4 } from 'uuid';


// Random participant identifier
function generateParticipantId() {
  return uuidv4();
}


// Init study
// - generate participant id if not set
export function initStudy() {
  console.log("Init Study");
  browser.storage.sync
    .get([
      "studyParticipantId",
    ])
    .then((res) => {
      if (res.studyParticipantId === undefined) {
        let partId = generateParticipantId();
        console.log(`New participant id: ${partId}`);
        browser.storage.sync.set({
          studyParticipantId: partId,
        });
      }
    });
}


export function clearStudyData() {
  browser.storage.local.remove("msuChoices");
  browser.storage.sync.remove("studyParticipantId");
}


export function resetStudyData() {
  clearStudyData();
  initStudy();
}

