document.addEventListener("DOMContentLoaded", function () {
  const summary = window.localStorage.getItem("summary");
  console.log("Received summary from local storage:", summary);
  document.getElementById("summary").textContent = summary;
});
