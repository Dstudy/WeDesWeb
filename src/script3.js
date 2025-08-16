import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const SAFE_MARGIN = 100;
const TOP_CARD = document.querySelector(".top-card");

let tl = null; // module-scoped handle
let isDone = 0; // your flag
window.layoutTL = null; // optional: expose for debugging/auto-scroll

function autoScrollToEnd() {
  const tlRef = window.layoutTL || window.tl || tl; // whichever you used
  const st = tlRef && tlRef.scrollTrigger;
  if (!st) {
    console.log("No scroll");
    return; // no scrollTrigger → nothing to scroll
  }

  const scroller = st.scroller || window; // window or a custom scroller
  const targetY = Math.max(0, st.end - 1); // -1 to ensure we cross the end

  if (
    scroller === window ||
    scroller === document.body ||
    scroller === document.documentElement
  ) {
    window.scrollTo({ top: targetY, behavior: "smooth" });
  } else {
    scroller.scrollTo({ top: targetY, behavior: "smooth" });
  }
}

/* --------- DETERMINISTIC POSITIONS (from your setup) --------- */
function initializeCardPositions() {
  const cards = document.querySelectorAll(".team-card");
  const container = document.querySelector(".team-card-container");
  const containerWidth = container.offsetWidth - 80; // padding allowance
  const containerHeight = container.offsetHeight - 80;

  // where cards fly in from
  const startPos = { x: 800, y: 200 };

  // normalized target positions (0–1)
  const finalPos = [
    { x: 0.1, y: 0.025 },
    { x: 0.4, y: 0.025 },
    { x: 0.7, y: 0.025 },
    { x: 0.25, y: 0.4 },
    { x: 0.55, y: 0.4 },
    { x: 0.85, y: 0.4 },
    { x: 0.1, y: 0.75 },
    { x: 0.4, y: 0.75 },
    { x: 0.7, y: 0.75 },
  ];

  // set all cards to start position
  cards.forEach((card) => {
    gsap.set(card, { x: startPos.x, y: startPos.y, rotation: 0 });
  });

  tl = gsap.timeline({
    scrollTrigger: {
      trigger: ".team-card-container", // was ".text-container" (doesn't exist)
      start: "top top",
      end: "max",
      scrub: 2,
      pin: true,
      markers: false,
      onUpdate(self) {
        if (!isDone && self.progress >= 0.8) isDone = 1;
        else isDone = 0;
      },
    },
  });

  // animate each card to its final spot
  cards.forEach((card, i) => {
    const fp = finalPos[i] || finalPos[finalPos.length - 1];
    const x = fp.x * containerWidth;
    const y = fp.y * containerHeight;

    // add all tweens at time 0 so they move together with scroll
    tl.to(card, { x, y, rotation: 0, duration: 1, ease: "power2.out" }, 0);
  });
}

/* --------- EXPAND/COLLAPSE LEFT→RIGHT --------- */
const COLLAPSED_WIDTH = 160; // match CSS base width

function toggleCard(card) {
  // close others first
  document.querySelectorAll(".team-card.expanded").forEach((openCard) => {
    if (openCard !== card) collapseCard(openCard);
  });

  if (card == TOP_CARD && !isDone) {
    autoScrollToEnd();
    isDone = 1;
    return;
  }

  if (card.classList.contains("expanded")) {
    collapseCard(card);
  } else {
    expandCard(card);
  }
}

function expandCard(card) {
  const overlay = document.querySelector(".overlay");
  const quote = card.querySelector(".quote-content");

  // Lock current width to animate from
  const startW = card.offsetWidth;
  card.style.width = startW + "px";
  // Force reflow
  void card.offsetWidth;

  // Apply expanded state + show right content
  card.classList.add("expanded");
  quote.classList.add("show");
  overlay.classList.add("show");

  // Compute a comfortable target width
  const desired = startW + Math.max(280, quote.scrollWidth + 40);
  const targetW = Math.max(460, desired);
  card.style.width = targetW + "px";

  // 👉 Shift the card to the left so the expanded width fits.
  // Snap to left=0 if the card is already near the left edge.
  const vw = window.innerWidth;
  const rect = card.getBoundingClientRect();

  // how far we need to move left so right edge doesn't overflow
  const overflow = rect.left + targetW + SAFE_MARGIN - vw;
  let shift = 0;
  if (rect.left <= SAFE_MARGIN) {
    // very close to the left, snap to 0    shift = -rect.left;
  } else if (overflow > 0) {
    // otherwise, only move as much as needed
    shift = -overflow;
  }

  // Remember current GSAP x, then apply the shift smoothly
  const prevX = parseFloat(gsap.getProperty(card, "x")) || 0;
  card.dataset.prevX = String(prevX);
  if (shift) {
    gsap.to(card, { x: prevX + shift, duration: 0.35, ease: "power2.out" });
  }
  // Optional: bring into view horizontally
  setTimeout(() => {
    try {
      card.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest", // prevents vertical re-centering (no jump)
      });
    } catch {}
  }, 50);

  // Cleanup inline width after transition to allow responsiveness
  const onEnd = (e) => {
    if (e.propertyName === "width") {
      card.style.width = "auto";
      card.removeEventListener("transitionend", onEnd);
    }
  };
  card.addEventListener("transitionend", onEnd);
}

function collapseCard(card) {
  const overlay = document.querySelector(".overlay");
  const quote = card.querySelector(".quote-content");

  // If width is 'auto', lock it to px value first
  const startW = card.offsetWidth;
  card.style.width = startW + "px";
  // Force reflow
  void card.offsetWidth;

  // Start collapse: hide right content and shrink width
  quote.classList.remove("show");
  card.classList.remove("expanded");
  card.style.width = COLLAPSED_WIDTH + "px";

  const prevX = parseFloat(card.dataset.prevX || "0");
  gsap.to(card, { x: prevX, duration: 0.3, ease: "power2.inOut" });

  const onEnd = (e) => {
    if (e.propertyName === "width") {
      card.style.width = ""; // cleanup
      card.removeEventListener("transitionend", onEnd);

      // Hide overlay when none expanded
      if (!document.querySelector(".team-card.expanded")) {
        overlay.classList.remove("show");
      }
    }
  };
  card.addEventListener("transitionend", onEnd);
}

function closeAllCards() {
  document.querySelectorAll(".team-card.expanded").forEach(collapseCard);
}

function initLoopText() {
  const track = document.querySelector(".loop-track");
  if (!track) return;

  // Build the repeated text (2x viewport width so we can loop seamlessly)
  const unit = "Thành viên WeDes";
  const approxUnitPx = 300; // rough width of one unit at typical sizes
  const repeats = Math.max(
    8,
    Math.ceil((window.innerWidth * 2) / approxUnitPx)
  );

  track.innerHTML = "";
  for (let i = 0; i < repeats * 2; i++) {
    const span = document.createElement("span");
    span.className = "loop-item";
    span.textContent = unit;
    track.appendChild(span);
  }

  // Kill any previous loop animation
  if (track._loopTl) {
    track._loopTl.kill();
    track._loopTl = null;
  }

  // Animate from 0 to -half the scrollWidth, then snap back to 0 on each repeat
  const distance = track.scrollWidth / 2;

  gsap.set(track, { x: 0 });
  track._loopTl = gsap.fromTo(
    track,
    { x: 0 },
    {
      x: -distance,
      duration: 70, // adjust speed (lower = faster)
      ease: "none",
      repeat: -1,
      onRepeat: () => gsap.set(track, { x: 0 }),
    }
  );
}

/* --------- INIT + EVENTS --------- */
window.addEventListener("load", () => {
  ScrollTrigger.getAll().forEach((t) => t.kill());
  setTimeout(initializeCardPositions, 100);
  initLoopText();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeAllCards();
});

window.toggleCard = toggleCard;
window.closeAllCards = closeAllCards;
