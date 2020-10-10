function setButtonClass() {
  browser.storage.sync.get("ghrOn").then((res) => {
    let onOffButton = document.querySelector(".on-off");
    if (res.ghrOn) {
      onOffButton.classList.remove("off");
      onOffButton.classList.add("on");
    } else {
      onOffButton.classList.remove("on");
      onOffButton.classList.add("off");
    }
  });
}
setButtonClass();

function toggleOnOff(e) {
  let icons = {
    on: "../icons/dwarf_walking_orange.svg",
    off: "../icons/dwarf_walking_grey.svg",
  };

  let button = e.currentTarget;
  browser.storage.sync.get("ghrOn").then((res) => {
    let newState = !res.ghrOn;
    browser.storage.sync
      .set({
        ghrOn: newState,
      })
      .then(() => {
        setButtonClass();
        let icon = newState ? icons.on : icons.off;
        browser.browserAction.setIcon({ path: icon });
      });
  });
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
  .querySelector(".settings-button")
  .addEventListener("click", openSettings);
document.querySelector(".on-off").addEventListener("click", toggleOnOff);
