/* ---------- State ----------
   Two separate values keep hover and selection apart:
   - rating     : the rating the person actually CHOSE by clicking (0 = none)
   - hoverValue : the star the mouse is over right now (0 = not hovering)
   The stars on screen show hoverValue while hovering, otherwise rating. */
let rating = 0;
let hoverValue = 0;

const LABELS = {
  0: { text: "Choose a rating", face: "🤔" },
  1: { text: "Terrible", face: "😞" },
  2: { text: "Poor", face: "😕" },
  3: { text: "Okay", face: "😐" },
  4: { text: "Good", face: "🙂" },
  5: { text: "Excellent", face: "🤩" }
};

// Sample ratings for the summary panel (index = number of stars)
const counts = { 1: 5, 2: 8, 3: 15, 4: 38, 5: 62 };

const $ = (id) => document.getElementById(id);
const starsEl = $("stars");
const stars = [...starsEl.querySelectorAll(".star")];
const commentEl = $("comment");
let lastFace = LABELS[0].face;

/* ---------- Showing the stars ---------- */
function render() {
  const shown = hoverValue || rating; // hover wins while the mouse is over the stars

  stars.forEach((star) => {
    const value = Number(star.dataset.value);          // read the star's number from data-value
    star.classList.toggle("filled", value <= shown);   // toggle the filled class
    star.setAttribute("aria-checked", String(value === rating));
    star.tabIndex = value === (rating || 1) ? 0 : -1;  // only one star is a Tab stop
  });

  starsEl.classList.toggle("previewing", hoverValue > 0 && hoverValue !== rating);

  // Label and face follow what is shown
  $("label").textContent = LABELS[shown].text;
  const face = $("face");
  if (LABELS[shown].face !== lastFace) {
    face.textContent = LABELS[shown].face;
    face.classList.remove("change");
    void face.offsetWidth;
    face.classList.add("change");
    lastFace = LABELS[shown].face;
  }

  // The saved rating (not the hover preview)
  $("current-value").textContent = rating === 0 ? "none" : `${rating} out of 5`;
  $("submit").disabled = rating === 0;
}

/* ---------- Changing the rating ---------- */
function setRating(value) {
  rating = value;
  render();
}

function resetRating() {
  rating = 0;
  hoverValue = 0;
  commentEl.value = "";
  updateCharCount();
  $("thanks").textContent = "";
  render();
}

/* ---------- Events (delegation: listeners on the container, not on each star) ---------- */
starsEl.addEventListener("mouseover", (event) => {
  const star = event.target.closest(".star");
  if (!star) return;
  hoverValue = Number(star.dataset.value);
  render();
});

starsEl.addEventListener("mouseleave", () => {
  hoverValue = 0;   // back to the selected rating
  render();
});

starsEl.addEventListener("click", (event) => {
  const star = event.target.closest(".star");
  if (!star) return;
  $("thanks").textContent = "";
  setRating(Number(star.dataset.value));
  star.classList.remove("pop");
  void star.offsetWidth;
  star.classList.add("pop");
});

// Keyboard support: arrow keys, Home and End change the rating, like a radio group
starsEl.addEventListener("keydown", (event) => {
  let next = null;
  if (event.key === "ArrowRight" || event.key === "ArrowUp") next = Math.min(5, rating + 1);
  else if (event.key === "ArrowLeft" || event.key === "ArrowDown") next = Math.max(1, rating - 1);
  else if (event.key === "Home") next = 1;
  else if (event.key === "End") next = 5;
  if (next === null) return;

  event.preventDefault();
  $("thanks").textContent = "";
  setRating(next);
  stars[next - 1].focus();
});

$("reset").addEventListener("click", resetRating);

function updateCharCount() {
  $("char-count").textContent = `${commentEl.value.length} / 200`;
}
commentEl.addEventListener("input", updateCharCount);

/* ---------- Summary panel ---------- */
const starSvg = '<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z"/></svg>';

function getTotals() {
  let total = 0, sum = 0;
  for (const [stars, count] of Object.entries(counts)) {
    total += count;
    sum += Number(stars) * count;
  }
  return { total, average: total === 0 ? 0 : sum / total };
}

function renderSummary() {
  const { total, average } = getTotals();
  $("avg").textContent = average.toFixed(1);
  $("total").textContent = `${total.toLocaleString()} rating${total === 1 ? "" : "s"}`;

  // Small star row showing the average
  const row = $("avg-stars");
  row.innerHTML = starSvg.repeat(5);
  [...row.children].forEach((svg, i) => {
    if (average >= i + 1) svg.classList.add("on");
    else if (average >= i + 0.5) svg.classList.add("half");
  });

  // Bars show each star's share of all ratings
  for (let i = 1; i <= 5; i++) {
    $("bar-" + i).style.width = (total === 0 ? 0 : (counts[i] / total) * 100) + "%";
    $("count-" + i).textContent = counts[i];
  }
}

$("submit").addEventListener("click", () => {
  if (rating === 0) return;
  counts[rating] += 1;
  renderSummary();
  $("thanks").textContent = `Thank you! You rated ${rating} out of 5.`;
  rating = 0;
  hoverValue = 0;
  commentEl.value = "";
  updateCharCount();
  render();
});

/* ---------- Start ---------- */
// Half-star gradient used by the average stars
document.body.insertAdjacentHTML("beforeend",
  '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><linearGradient id="half"><stop offset="50%" stop-color="#f5a623"/><stop offset="50%" stop-color="#d7deec"/></linearGradient></defs></svg>');
render();
renderSummary();
