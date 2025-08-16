import { gsap } from "gsap";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollSmoother, ScrollTrigger);

const skewSetter = gsap.quickSetter(".images img", "skewY", "deg"); // targets only gallery imgs, uses fast setter
const clamp = gsap.utils.clamp(-10, 10); // tighter range = fewer repaints
let last = 0;

ScrollSmoother.create({
  wrapper: "#wrapper",
  content: "#content",
  smooth: 0.9, // lighter work
  speed: 0.9,
  effects: false, // skip extra effect pipeline
  onUpdate: (self) => {
    const v = self.getVelocity();
    const s = clamp(v / -80);
    if (s === last) return; // avoid redundant writes
    last = s;
    skewSetter(s);
  },
  onStop: () => {
    last = 0;
    skewSetter(0);
  },
});
