import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "@studio-freight/lenis";
import * as Matter from "matter-js";

document.addEventListener("DOMContentLoaded", () => {
  gsap.registerPlugin(ScrollTrigger);

  const lenis = new Lenis();
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);

  const animateOnScroll = true;

  const config = {
    gravity: { x: 0, y: 1 },
    restitution: 0.5,
    friction: 0.15,
    frictionAir: 0.02,
    density: 0.02,
    wallThickness: 200,
    mouseStiffness: 0.6,
  };
  let engine,
    runner,
    mouseConstraint,
    bodies = [],
    topWall = null;

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  function initPhysics(container) {
    engine = Matter.Engine.create();
    engine.gravity = config.gravity;
    engine.constraintIterations = 10;
    engine.positionIterations = 20;
    engine.velocityIterations = 16;
    engine.timing.timeScale = 1;

    const containerRect = container.getBoundingClientRect();
    const wallThickness = config.wallThickness;

    const dropZone = makeDropZone(containerRect);

    // (Optional) if you added .center-drop-zone element to visualize
    const dzEl = container.querySelector(".center-drop-zone");
    if (dzEl) dzEl.classList.add("show");

    const walls = [
      Matter.Bodies.rectangle(
        containerRect.width / 2,
        containerRect.height + wallThickness / 2,
        containerRect.width + wallThickness * 2,
        wallThickness,
        { isStatic: true }
      ),

      Matter.Bodies.rectangle(
        -wallThickness / 2,
        containerRect.height / 2,
        wallThickness,
        containerRect.height + wallThickness * 2,
        { isStatic: true }
      ),

      Matter.Bodies.rectangle(
        containerRect.width + wallThickness / 2,
        containerRect.height / 2,
        wallThickness,
        containerRect.height + wallThickness * 2,
        { isStatic: true }
      ),
    ];

    Matter.World.add(engine.world, walls);

    const objects = container.querySelectorAll(".object");
    objects.forEach((obj, index) => {
      const objRect = obj.getBoundingClientRect();

      const startX =
        Math.random() * (containerRect.width - objRect.width) +
        objRect.width / 2;
      const startY = -500 - index * 200;
      const startRotation = 0;

      const body = Matter.Bodies.rectangle(
        startX,
        startY,
        objRect.width,
        objRect.height,
        {
          restitution: config.restitution,
          friction: config.friction,
          frictionAir: config.frictionAir,
          density: config.density,
        }
      );

      Matter.Body.setAngle(body, startRotation);

      bodies.push({
        body: body,
        element: obj,
        width: objRect.width,
        height: objRect.height,
      });

      Matter.World.add(engine.world, body);
    });

    const smallobjects = container.querySelectorAll(".small-object");
    smallobjects.forEach((obj, index) => {
      const objRect = obj.getBoundingClientRect();

      const startX =
        Math.random() * (containerRect.width - objRect.width) +
        objRect.width / 2;
      const startY = -500 - index * 200;
      const startRotation = (Math.random() - 0.5) * Math.PI;

      const body = Matter.Bodies.rectangle(
        startX,
        startY,
        objRect.width,
        objRect.height,
        {
          restitution: config.restitution,
          friction: config.friction,
          frictionAir: config.frictionAir,
          density: config.density,
        }
      );

      Matter.Body.setAngle(body, startRotation);

      bodies.push({
        body: body,
        element: obj,
        width: objRect.width,
        height: objRect.height,
      });

      Matter.World.add(engine.world, body);
    });

    setTimeout(() => {
      topWall = Matter.Bodies.rectangle(
        containerRect.width / 2,
        -wallThickness / 2,
        containerRect.width + wallThickness * 2,
        wallThickness,
        { isStatic: true }
      );

      Matter.World.add(engine.world, topWall);
    }, 3000);

    const mouse = Matter.Mouse.create(container);
    mouse.element.removeEventListener("mousewheel", mouse.mousewheel);
    mouse.element.removeEventListener("DOMMouseScroll", mouse.mousewheel);

    mouseConstraint = Matter.MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: config.mouseStiffness,
        render: { visible: false },
      },
    });

    mouseConstraint.mouse.element.oncontextmenu = () => false;

    let dragging = null;
    let originalInertia = null;

    Matter.Events.on(mouseConstraint, "startdrag", function (event) {
      dragging = event.body;
      if (dragging) {
        originalInertia = dragging.inertia;
        Matter.Body.setInertia(dragging, Infinity);
        Matter.Body.setVelocity(dragging, { x: 0, y: 0 });
        Matter.Body.setAngularVelocity(dragging, 0);
      }
    });

    Matter.Events.on(mouseConstraint, "enddrag", function (event) {
      if (!dragging) return;

      const wasDragging = dragging;
      const found = bodies.find((b) => b.body === wasDragging);

      // restore inertia regardless
      Matter.Body.setInertia(wasDragging, originalInertia || 1);
      dragging = null;
      originalInertia = null;

      if (found && isInsideZone(wasDragging, dropZone)) {
        // Freeze the card while popup is open so it doesn't fall away
        Matter.Body.setStatic(wasDragging, true);

        // Open popup with the card's DOM content
        openPopupWithElement(found.element, wasDragging);
      }
    });

    Matter.Events.on(engine, "beforeUpdate", function () {
      if (dragging) {
        const found = bodies.find((b) => b.body === dragging);
        if (found) {
          const minX = found.width / 2;
          const maxX = containerRect.width - found.width / 2;
          const minY = found.height / 2;
          const maxY = containerRect.height - found.height / 2;

          Matter.Body.setPosition(dragging, {
            x: clamp(dragging.position.x, minX, maxX),
            y: clamp(dragging.position.y, minY, maxY),
          });

          Matter.Body.setVelocity(dragging, {
            x: clamp(dragging.velocity.x, -20, 20),
            y: clamp(dragging.velocity.y, -20, 20),
          });
        }
      }
    });

    container.addEventListener("mouseleave", () => {
      mouseConstraint.constraint.bodyB = null;
      mouseConstraint.constraint.pointB = null;
    });

    document.addEventListener("mouseup", () => {
      mouseConstraint.constraint.bodyB = null;
      mouseConstraint.constraint.pointB = null;
    });

    Matter.World.add(engine.world, mouseConstraint);

    runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);

    function updatePositions() {
      bodies.forEach(({ body, element, width, height }) => {
        const x = clamp(
          body.position.x - width / 2,
          0,
          containerRect.width - width
        );

        const y = clamp(
          body.position.y - height / 2,
          -height * 3,
          containerRect.height - height
        );
        element.style.left = x + "px";
        element.style.top = y + "px";
        element.style.transform = `rotate(${body.angle}rad)`;
      });

      requestAnimationFrame(updatePositions);
    }
    updatePositions();
  }

  if (animateOnScroll) {
    document.querySelectorAll("section").forEach((section) => {
      if (section.querySelector(".object-container")) {
        ScrollTrigger.create({
          trigger: section,
          start: "top bottom",
          once: true,
          onEnter: () => {
            const container = section.querySelector(".object-container");
            if (container && !engine) {
              initPhysics(container);
            }
          },
        });
      }
    });
  } else {
    window.addEventListener("load", () => {
      const container = document.querySelector(".object-container");
      if (container) {
        initPhysics(container);
      }
    });
  }
});

function makeDropZone(containerRect) {
  // middle 40% of the viewport
  return {
    x1: containerRect.width * 0.3,
    x2: containerRect.width * 0.7,
    y1: containerRect.height * 0.3,
    y2: containerRect.height * 0.7,
  };
}
function isInsideZone(body, zone) {
  const { x, y } = body.position;
  return x >= zone.x1 && x <= zone.x2 && y >= zone.y1 && y <= zone.y2;
}
function resolvePublic(path) {
  // Works in dev and prod (subpaths). Falls back gracefully.
  const base =
    (import.meta && import.meta.env && import.meta.env.BASE_URL) ||
    document.querySelector("base")?.getAttribute("href") ||
    "/";
  // Make an absolute URL from base + path
  return new URL(
    path.replace(/^\/+/, ""),
    new URL(base, window.location.origin)
  ).toString();
}

function openPopupWithElement(el, freezeBody) {
  const popup = document.getElementById("card-popup");
  const backdrop = popup.querySelector(".popup-backdrop");
  const textCard = popup.querySelector(".popup-text");
  const imageEl = popup.querySelector("#popup-img");

  imageEl.classList.remove("shift-left", "shift-right", "shift");

  popup.classList.remove("hidden");
  popup.setAttribute("aria-hidden", "false");

  if (el.innerText.includes("Chia")) {
    imageEl.src = resolvePublic("img/team1.png");
    textCard.innerHTML = "Chia sẻ kiến thức thiết kế cho nội bộ thư viện";
    imageEl.classList.add("shift");
  } else if (el.innerText.includes("Phối")) {
    imageEl.src = resolvePublic("img/team17.png");
    textCard.innerHTML =
      "Phối hợp với các ban khác tổ chức workshop mở rộng cho thư viện/cộng đồng";
    imageEl.classList.add("shift-right");
  } else {
    imageEl.src = resolvePublic("img/team20.png");
    textCard.innerHTML =
      "Tổ chức workshop về thiết kế như: <br> workshop làm tranh mosaic, <br> workshop in tranh rập, <br> workshop Giáng sinh";
    imageEl.classList.add("shift-left");
  }

  const close = () => {
    popup.classList.add("hidden");
    popup.setAttribute("aria-hidden", "true");
    document.removeEventListener("keydown", onEsc);
    backdrop.removeEventListener("click", onBackdropClick);

    if (freezeBody) {
      Matter.Body.setStatic(freezeBody, false);
      Matter.Body.setVelocity(freezeBody, { x: 0, y: 0 });
      Matter.Body.setAngularVelocity(freezeBody, 0);
    }
  };

  const onEsc = (e) => (e.key === "Escape" ? close() : null);

  // only close when backdrop (not panel) is clicked
  const onBackdropClick = (e) => {
    if (e.target === backdrop) {
      close();
    }
  };

  document.addEventListener("keydown", onEsc);
  backdrop.addEventListener("click", onBackdropClick);
}
