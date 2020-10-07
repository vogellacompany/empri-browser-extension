function saveOptions(e) {
  browser.storage.sync.set({
    ghrRedactionPattern: document.querySelector("#redaction-pattern").value
  });
  e.preventDefault();
}

function restoreOptions() {
  var gettingItem = browser.storage.sync.get('ghrRedactionPattern');
  gettingItem.then((res) => {
    document.querySelector("#redaction-pattern").value = res.ghrRedactionPattern || 'hms';
  });
}


document.addEventListener('DOMContentLoaded', restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);
