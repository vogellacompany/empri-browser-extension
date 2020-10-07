function saveOptions(e) {
  let pattern = document.querySelector("#redaction-pattern").value;
  browser.storage.sync.set({
    redactionPattern: pattern,
    ghrRedactMonth: pattern.includes("M"),
    ghrRedactDay: pattern.includes("d"),
    ghrRedactHours: pattern.includes("h"),
    ghrRedactMinutes: pattern.includes("m"),
    ghrRedactSeconds: pattern.includes("s"),
  });
  e.preventDefault();
}

function restoreOptions() {
  var gettingItem = browser.storage.sync.get("redactionPattern");
  gettingItem.then((res) => {
    document.querySelector("#redaction-pattern").value =
      res.redactionPattern || "hms";
  });
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);
