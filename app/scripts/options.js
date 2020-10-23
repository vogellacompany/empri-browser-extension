import { DateTime } from "luxon";

(() => {
  let fieldset = document.querySelector(".redaction-pattern");
  let month = fieldset.querySelector("#month");
  let day = fieldset.querySelector("#day");
  let hour = fieldset.querySelector("#hour");
  let minute = fieldset.querySelector("#minute");
  let second = fieldset.querySelector("#second");
  let exampleField = document.querySelector(".example > input");

  function saveOptions(e) {
    browser.storage.sync.set({
      ghrRedactMonth: month.checked,
      ghrRedactDay: day.checked,
      ghrRedactHours: hour.checked,
      ghrRedactMinutes: minute.checked,
      ghrRedactSeconds: second.checked,
    });
    e.preventDefault();
  }

  function restoreOptions() {
    browser.storage.sync
      .get([
        "ghrRedactMonth",
        "ghrRedactDay",
        "ghrRedactHours",
        "ghrRedactMinutes",
        "ghrRedactSeconds",
      ])
      .then((res) => {
        month.checked = res.ghrRedactMonth;
        day.checked = res.ghrRedactDay;
        hour.checked = res.ghrRedactHours;
        minute.checked = res.ghrRedactMinutes;
        second.checked = res.ghrRedactSeconds;
      })
      .then(() => updateExampleField());
  }

  function updateExampleField() {
    let dateTime = DateTime.fromISO("2020-09-02T23:23:23");
    if (month.checked) {
      dateTime = dateTime.set({ month: 1 });
    }
    if (day.checked) {
      dateTime = dateTime.set({ day: 1 });
    }
    if (hour.checked) {
      dateTime = dateTime.set({ hour: 0 });
    }
    if (minute.checked) {
      dateTime = dateTime.set({ minute: 0 });
    }
    if (second.checked) {
      dateTime = dateTime.set({ second: 0 });
    }
    let v = dateTime.toFormat("yyyy-MM-dd'T'hh:mm:ss");
    console.log(v);
    exampleField.value = v;
  }

  document.addEventListener("DOMContentLoaded", restoreOptions);
  document.querySelector("form").addEventListener("submit", saveOptions);
  document.querySelectorAll("input[type=checkbox]").forEach((ele) => {
    ele.addEventListener("click", updateExampleField);
  });
})();
