import { gsap } from "gsap";

type Cover = { image?: string; title?: string };

/** Independently drawn paper geometry, with the selected artwork on the sheet. */
export function createProjectPaperTransition(host: HTMLElement) {
  const sheet = document.createElement("div");
  sheet.className = "journal-transition-sheet";
  const picture = document.createElement("img");
  picture.alt = "";
  picture.className = "journal-transition-image";
  const label = document.createElement("span");
  label.className = "journal-transition-label";
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add("journal-transition-edge");
  svg.setAttribute("preserveAspectRatio", "none");
  const edge = document.createElementNS(svg.namespaceURI, "path");
  svg.appendChild(edge);
  sheet.append(picture, label);
  host.append(sheet, svg);
  let disposed = false;
  let tween: gsap.core.Tween | undefined;
  let complete: (() => void) | undefined;
  let imageGeneration = 0;
  const state = { progress: 0 };

  function draw() {
    if (disposed) return;
    const width = innerWidth, height = innerHeight, p = state.progress;
    const bend = Math.sin(p * Math.PI);
    const points: string[] = [], line: string[] = [];
    for (let index = 0; index <= 96; index++) {
      const x = index / 96;
      const curl = (Math.sin(x * Math.PI * 1.3 + p * 2.4) * .07 + Math.sin(x * 11 + p * 4) * .014) * bend;
      const fibre = (Math.sin(index * 2.41) * .0025 + Math.sin(index * 5.73) * .0017) * bend;
      const y = (1.12 - p * 1.24 + curl + fibre) * height;
      points.push(`${x * 100}% ${y / height * 100}%`);
      line.push(`${index === 0 ? "M" : "L"}${x * width},${y}`);
    }
    sheet.style.clipPath = `polygon(${points.join(",")},100% 100%,0% 100%)`;
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    edge.setAttribute("d", line.join(" "));
    picture.style.transform = `translateY(${(1 - p) * 5}%) scale(${1.04 - p * .04})`;
  }

  function animate(progress: number, duration: number) {
    tween?.kill();
    complete?.();
    return new Promise<void>(resolve => {
      complete = resolve;
      tween = gsap.to(state, { progress, duration, ease: "power3.inOut", onUpdate: draw, onComplete() { complete = undefined; resolve(); } });
    });
  }

  async function cover({ image, title }: Cover) {
    const generation = ++imageGeneration;
    host.style.visibility = "visible";
    host.style.pointerEvents = "auto";
    label.textContent = title ?? "THE PERSONAL JOURNAL";
    picture.removeAttribute("src");
    picture.hidden = true;
    if (image) {
      picture.src = image;
      await Promise.race([picture.decode().then(() => { if (!disposed && generation === imageGeneration) { picture.hidden = false; label.hidden = true; } }).catch(() => {}), new Promise(resolve => setTimeout(resolve, 220))]);
    }
    if (disposed) return;
    label.hidden = !picture.hidden;
    state.progress = 0;
    draw();
    host.dataset.state = "covering";
    await animate(1, innerWidth <= 760 ? .8 : 1.1);
    if (!disposed) host.dataset.state = "covered";
  }

  async function reveal() {
    if (disposed) return;
    host.dataset.state = "revealing";
    await animate(0, innerWidth <= 760 ? .65 : .9);
    if (disposed) return;
    host.dataset.state = "idle";
    host.style.visibility = "hidden";
    host.style.pointerEvents = "none";
    picture.removeAttribute("src");
  }

  window.addEventListener("resize", draw);
  return { cover, reveal, dispose() { disposed = true; imageGeneration++; tween?.kill(); complete?.(); window.removeEventListener("resize", draw); sheet.remove(); svg.remove(); } };
}
