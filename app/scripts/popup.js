function setButtonState() {
  browser.storage.sync.get("ghrOn").then((res) => {
    let onOffButton = document.querySelector(".on-off");
    if (res.ghrOn) {
      onOffButton.classList.remove("off");
      onOffButton.classList.add("on");
      onOffButton.textContent = "On";
    } else {
      onOffButton.classList.remove("on");
      onOffButton.classList.add("off");
      onOffButton.textContent = "Off";
    }
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

  let button = e.currentTarget;
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
