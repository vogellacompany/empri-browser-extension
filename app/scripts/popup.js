function setButtonState() {
  browser.storage.sync.get("ghrOn").then((res) => {
    let onOffButton = document.querySelector("#ghonoff");
    onOffButton.checked = res.ghrOn;
  });
}
setButtonState();

function toggleOnOff(e) {
  let icons = {
    on: {
      19: "../images/on-19.png",
      38: "../images/on-38.png",
    },
    off: {
      19: "../images/off-19.png",
      38: "../images/off-38.png",
    },
  };

  browser.storage.sync.get("ghrOn").then((res) => {
    let newState = !res.ghrOn;
    browser.storage.sync
      .set({
        ghrOn: newState,
      })
      .then(() => {
        setButtonState();
        let icon = newState ? icons.on : icons.off;
        browser.browserAction.setIcon({ path: icon });
      });
  });
  document.querySelector("#slider").classList.remove("notransition");
}

function onOpened() {
  console.log(`Options page opened`);
  window.close();
}
function onError(error) {
  console.log(`Error: ${error}`);
}
function openSettings() {
  var opening = browser.runtime.openOptionsPage();
  opening.then(onOpened, onError);
}

document
  .querySelector("#settings")
  .addEventListener("click", openSettings);
document.querySelector("#ghonoff").addEventListener("click", toggleOnOff);
