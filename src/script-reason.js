import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Observer } from "gsap/Observer";

gsap.registerPlugin(SplitText, ScrollTrigger, Observer);

const starPos = [
  { x: 400, y: -220 },
  { x: 1350, y: -420 },
  { x: -700, y: 200 },
  { x: 700, y: 200 },
  { x: -700, y: 200 },
];

const stars = document.querySelectorAll(".star");

stars.forEach((star, index) => {
  gsap.set(star, { x: starPos[index].x, y: starPos[index].y });
});

document.fonts.ready.then(() => {
  gsap.set(".split", { opacity: 1 });

  // Create a master timeline with ScrollTrigger
  let tl = gsap.timeline({
    scrollTrigger: {
      trigger: ".split", // element to watch
      start: "top 80%", // when top hits 80% viewport height
      toggleActions: "play none none reverse",
    },
  });

  // SplitText animation
  let split = new SplitText(".split", {
    type: "words,lines",
    linesClass: "line",
    autoSplit: true,
    mask: "lines",
  });

  tl.from(split.lines, {
    duration: 0.6,
    yPercent: 100,
    opacity: 1,
    stagger: 0.1,
    ease: "expo.out",
  });

  tl.to(
    ".star-hero",
    {
      rotation: () => gsap.utils.random(380, 720, 1),
      opacity: 1,
      scale: 1.9,
      duration: 3,
      stagger: 0.7,
      ease: "back.inOut",
    },
    "<"
  );

  // Example: add more animations here in sequence
  tl.from(
    split.lines,
    {
      scale: 1.1,
      opacity: 0,
      duration: 0.5,
      ease: "power2.out",
    },
    "-=0.2"
  );
});

let tl1, tl2, tl3;

tl1 = gsap.timeline({
  scrollTrigger: {
    trigger: ".first",
    scrub: true,
    pin: true,
    start: "top top",
    end: "+=150%",
    markers: false,
  },
});

// move the inner wrapper up while the section is pinned
tl1.to(".run-wrapper", { y: -1500, duration: 1, ease: "circ.out" }, 0);
tl1.to(".star1", { rotation: 200, ease: "circ.out" }, "<");

const cards = document.querySelectorAll(".card");
cards.forEach((card, i) => {
  if (i % 2) {
    gsap.set(card, { rotation: -3.9 });
  } else {
    gsap.set(card, { rotation: 3.9 });
  }
});

tl2 = gsap.timeline({
  scrollTrigger: {
    trigger: ".second",
    scrub: true,
    pin: true,
    start: "top top",
    end: "+=100%",
    markers: false,
  },
});

tl2.to(".run-wrapper", { y: 0, duration: 1, ease: "circ.out" }, 0);
tl2.to(".star2", { rotation: 200, ease: "circ.out" }, "<");

tl3 = gsap.timeline({
  scrollTrigger: {
    trigger: ".third",
    scrub: true,
    pin: true,
    start: "top top",
    end: "+=100%",
    markers: false,
  },
});

tl3.to(".run-wrapper", { y: -800, duration: 1, ease: "circ.out" }, 0);
tl3.to(".star3", { rotation: 200, ease: "circ.out" }, "<");
