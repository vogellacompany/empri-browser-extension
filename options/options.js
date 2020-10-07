function saveOptions(e) {
  browser.storage.sync.set({
    redactionPattern: document.querySelector("#redaction-pattern").value
  });
  e.preventDefault();
}

function restoreOptions() {
  var gettingItem = browser.storage.sync.get('redactionPattern');
  gettingItem.then((res) => {
    document.querySelector("#redaction-pattern").value = res.redactionPattern || 'hms';
  });
}


document.addEventListener('DOMContentLoaded', restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);
