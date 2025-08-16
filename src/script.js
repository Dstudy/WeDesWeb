// /src/script.js  — responsive rewrite (mobile landscape aware)

import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Observer } from "gsap/Observer";

gsap.registerPlugin(ScrollTrigger, Observer, SplitText);

/* ========= Loader + main build ========= */
const showDemo = () => {
  document.body.style.overflow = "auto";
  document.scrollingElement.scrollTo(0, 0);
  gsap.to(document.querySelector(".loader"), { autoAlpha: 0 });

  const letters = document.querySelectorAll(".letter");
  const stars = document.querySelectorAll(".star");
  const box = document.querySelector(".text-container");

  let tl; // keep the timeline to rebuild on resize/orientation
  let tl1;

  function build() {
    // Clean any previous runs
    ScrollTrigger.getAll().forEach((st) => st.kill());
    tl && tl.kill();

    // Clear transforms/styles set by GSAP so we can recalc cleanly
    gsap.set([letters, stars, ".ellipse", ".under-box"], { clearProps: "all" });

    const w = box.clientWidth;
    const h = box.clientHeight;
    const isLandscape = w > h;
    const isShort = isLandscape && h < 480; // landscape phones typically have short viewport height
    const base = Math.min(w, h);

    // Orientation-aware multipliers (tweak to taste)
    const k = {
      scale: isLandscape ? (isShort ? 0.28 : 0.32) : 0.35, // letter scale factor
      space: isLandscape ? (isShort ? 0.22 : 0.26) : 0.28, // spacing factor
      lineY: isLandscape ? (isShort ? 0.56 : 0.5) : 0.5, // baseline Y
      ellipseY: isLandscape ? (isShort ? 1.35 : 1.5) : 1.6, // ellipse offset
      underY: isLandscape ? (isShort ? 0.3 : 0.34) : 0.38, // under-box offset
    };

    // Responsive scale & spacing
    const letterScale = isShort
      ? gsap.utils.clamp(0.12, 0.4, (base / 900) * 0.24)
      : gsap.utils.clamp(
          0.28,
          0.42,
          (base / 900) * (isLandscape ? 0.32 : 0.35)
        );

    const scaleFactor = letterScale * 0.6;

    const spacing = isShort
      ? gsap.utils.clamp(16, w * 0.34, w * 0.2) // tighter on short landscape
      : gsap.utils.clamp(24, w * 0.45, w * (isLandscape ? 0.24 : 0.28));

    const baselineY = h * (isShort ? 0.42 : isLandscape ? 0.1 : 0.5); // raise letters on short screens
    const startX = -((letters.length - 1) / 2) * spacing;

    // Normalized initial positions (percent of container → pixels)
    // These keep the "scattered" intro look but scale with the stage size.
    const posN = [
      { x: -0.12, y: -0.07, r: -45 }, // W
      { x: 0.12, y: -0.05, r: 60 }, // E
      { x: -0.1, y: 0.03, r: 30 }, // D
      { x: 0.14, y: 0.05, r: -75 }, // E
      { x: 0.0, y: -0.1, r: 90 }, // S
    ];
    const initialPositions = posN.map((p) => ({
      x: p.x * w,
      y: p.y * h,
      rotation: p.r,
    }));

    // Stars: end positions normalized (adjust to your visuals)
    const starEndN = [
      { x: -0.8, y: 0.65, r: -45, s: scaleFactor },
      { x: 0.57, y: 0.25, r: 60, s: scaleFactor },
      { x: -0.09, y: 0.03, r: 30, s: scaleFactor },
      { x: 0.12, y: 0.05, r: -75, s: scaleFactor },
    ];
    const starEnd = starEndN.map((p) => ({
      x: p.x * w * (isShort ? 0.9 : isLandscape ? 1 : h),
      y: p.y * h * (isShort ? 2.5 : isLandscape ? 1 : h),
      rotation: p.r,
      scale: p.s,
    }));

    // Set initial states for letters & stars
    letters.forEach((letter, i) => {
      gsap.set(letter, {
        x: initialPositions[i].x,
        y: initialPositions[i].y,
        rotation: i % 2 ? 0 : 720,
        scale: 0.1,
        opacity: 0,
        z: -100,
      });
    });

    stars.forEach((star) => {
      gsap.set(star, {
        x: 0,
        y: 0,
        rotation: 0,
        scale: 0.1,
        opacity: 0,
        z: -100,
      });
    });

    // Ellipse and under-box
    const ellipseX = startX + 2 * spacing;
    gsap.set(".under-box", { opacity: 0, y: 20 });

    // Make timeline
    tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".text-container",
        start: "top top",
        end: "+=50%",
        scrub: 2,
        pin: true,
        markers: false,
        onLeave: () => tl1.play(0), // when you scroll past the end
        onLeaveBack: () => tl1.pause(0), // when you scroll back above the end
      },
    });

    tl1 = gsap.timeline({
      repeat: -1,
      repeatDelay: 1,
      yoyo: true,
      paused: true,
    });

    // Letters enter to final positions based on responsive spacing
    letters.forEach((letter, i) => {
      tl.to(
        letter,
        {
          x: startX + i * spacing,
          y: baselineY,
          rotation: 360,
          z: 10,
          scale: letterScale,
          opacity: 1,
          duration: 3,
          ease: "power1.inOut",
        },
        0
      ).to(
        ".ellipse",
        {
          scale: isShort ? 1.65 : isLandscape ? 3.3 : h,
          duration: 3,
          ease: "power1.inOut",
        },
        "<"
      );
    });

    // Stars fly to responsive end positions
    stars.forEach((star, i) => {
      tl.to(
        star,
        {
          ...starEnd[i],
          opacity: 1,
          z: 10,
          duration: 2,
          ease: "circ.out",
        },
        0
      );
    });

    tl1.to(
      ".star",
      {
        rotation: () => gsap.utils.random(380, 760, 1),
        duration: 5,
        ease: "back.inOut",
        stagger: 0.5,
      },
      0
    );

    // Under box settles relative to container height
    tl.to(
      ".under-box",
      {
        opacity: 1,
        y: baselineY + (isShort ? h : isLandscape ? h * 0.28 : h),
        duration: 1,
        ease: "power2.out",
      },
      "+=0.00001"
    );

    // Hover effects (use the current computed scale so it works after rebuilds)
    const letterScaleHover = () =>
      parseFloat(gsap.getProperty(letters[0], "scale")) || 1;
    letters.forEach((letter) => {
      letter.addEventListener("mouseenter", () => {
        const s = letterScaleHover();
        gsap.to(letter, {
          scale: letterScale * 1.3,
          rotation: 10,
          duration: 0.3,
          ease: "back.out(1.7)",
        });
      });
      letter.addEventListener("mouseleave", () => {
        const s = letterScaleHover();
        gsap.to(letter, {
          scale: letterScale,
          rotation: 0,
          duration: 0.3,
          ease: "back.out(1.7)",
        });
      });
    });
  }

  build();

  // Rebuild on resize and orientation changes (landscape support on mobile)
  let rid;
  const rebuild = () => {
    clearTimeout(rid);
    rid = setTimeout(() => {
      build();
      ScrollTrigger.refresh();
    }, 150);
  };

  window.addEventListener("resize", rebuild);
  window.addEventListener("orientationchange", rebuild);
  if (window.visualViewport)
    window.visualViewport.addEventListener("resize", rebuild);
};

/* ========= Other sections you already had ========= */
// Hero zoom + "next" fade/scale (kept)
window.addEventListener("load", () => {
  gsap
    .timeline({
      scrollTrigger: {
        id: "wrapperST",
        trigger: ".wrapper",
        start: "top top",
        end: "+=150%",
        pin: true,
        scrub: true,
        markers: false,
      },
    })
    .to(".image-zoom", {
      scale: 2,
      z: 350,
      transformOrigin: "center center",
      ease: "power1.inOut",
    })
    .to(
      ".section.hero",
      {
        scale: 1.1,
        transformOrigin: "center center",
        ease: "power1.inOut",
      },
      "<"
    );

  gsap.set(".next", { opacity: 0 });
  gsap
    .timeline({
      scrollTrigger: {
        trigger: ".next",
        start: "top top",
        end: "bottom top",
        scrub: 2,
        pin: true,
        markers: false,
      },
    })
    .to(".next", {
      opacity: 1,
      duration: 1,
      scale: 2,
      ease: "power2.inOut",
    });
});

// SplitText section (kept)
document.addEventListener("DOMContentLoaded", () => {
  gsap.set(".split", { opacity: 1 });

  let splits = [];
  function buildSplits() {
    splits.forEach((s) => s.revert());
    splits = [];

    gsap.utils.toArray(".container").forEach((container) => {
      let text = container.querySelector(".split");
      if (!text) return;

      const split = new SplitText(text, {
        type: "lines,words",
        linesClass: "line",
        mask: "lines",
      });
      splits.push(split);

      gsap.from(split.words, {
        yPercent: 200,
        stagger: 0.02,
        ease: "none",
        scrollTrigger: {
          trigger: container,
          markers: false,
          scrub: true,
          start: "top bottom",
          end: "bottom center",
          refreshPriority: -1,
        },
      });
    });
  }

  buildSplits();
  ScrollTrigger.addEventListener("refreshInit", buildSplits);
  window.addEventListener("load", () => ScrollTrigger.refresh());
});

// Loader image progress (kept)
const images = gsap.utils.toArray("img");
const loader = document.querySelector(".loader--text");
const updateProgress = (instance) =>
  (loader.textContent = `${Math.round(
    (instance.progressedCount * 100) / images.length
  )}%`);

imagesLoaded(images).on("progress", updateProgress).on("always", showDemo);

// Gallery marquee (kept)
gsap.utils.toArray(".gallery-wrapper").forEach((wrapper, index) => {
  const [x, xEnd] =
    index % 2
      ? ["100%", (wrapper.scrollWidth - wrapper.offsetWidth) * -1 - 500]
      : [wrapper.scrollWidth * -1, 500];
  gsap.fromTo(
    wrapper,
    { x },
    {
      x: xEnd,
      scrollTrigger: {
        trigger: wrapper,
        scrub: 0.5,
        markers: false,
      },
    }
  );
});
