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
  // TODO(FAP): change browser bar icon when deactivated?
  let button = e.currentTarget;
  browser.storage.sync.get("ghrOn").then((res) => {
    browser.storage.sync
      .set({
        ghrOn: !res.ghrOn,
      })
      .then(() => setButtonClass());
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
