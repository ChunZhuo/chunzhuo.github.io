(function () {
  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function initViewer(root) {
    const svg = root.querySelector(".perturbseq-svg");
    const viewport = root.querySelector(".perturbseq-viewport");
    const status = root.querySelector(".perturbseq-zoom-status");
    const focusLabel = root.querySelector(".perturbseq-focus-label");
    const focusText = root.querySelector(".perturbseq-focus-text");
    const focusButtons = root.querySelectorAll("[data-focus-target]");
    const zoomIn = root.querySelector("[data-zoom-action='in']");
    const zoomOut = root.querySelector("[data-zoom-action='out']");
    const reset = root.querySelector("[data-zoom-action='reset']");

    if (!svg || !viewport) return;

    const view = { width: 1000, height: 700, cx: 500, cy: 350 };
    const focuses = {
      cell: {
        label: "Whole cell",
        text: "One perturbed cell remains in view: membrane, nucleus, organelles, sgRNA cargo, mRNA molecules, and capture barcode are all part of the same scene.",
        x: 500,
        y: 350,
        k: 1,
      },
      nucleus: {
        label: "Nucleus and chromatin",
        text: "Zooming into the nucleus exposes chromatin, the target locus, nascent RNA, and the CRISPRi complex rather than a separate schematic panel.",
        x: 455,
        y: 318,
        k: 2.25,
      },
      binding: {
        label: "sgRNA target binding",
        text: "At the target site, the sgRNA-dCas9-KRAB complex is positioned on DNA near the TSS, blocking productive transcription and lowering target transcript output.",
        x: 487,
        y: 285,
        k: 4.4,
      },
      readout: {
        label: "Transcript and guide readout",
        text: "The same cell contains reduced target mRNA, other transcripts, and guide identity molecules that become linked to a cell barcode during Perturb-seq.",
        x: 650,
        y: 438,
        k: 2.6,
      },
    };

    let transform = { x: 0, y: 0, k: 1 };
    let drag = null;
    let currentFocus = "cell";

    function applyTransform() {
      transform.k = clamp(transform.k, 0.8, 5);
      viewport.setAttribute("transform", `translate(${transform.x} ${transform.y}) scale(${transform.k})`);
      if (status) status.textContent = `${Math.round(transform.k * 100)}%`;

      const zoomLevel = transform.k >= 3.2 ? "deep" : transform.k >= 1.8 ? "inside" : "whole";
      root.dataset.zoom = zoomLevel;
    }

    function setFocus(name) {
      const focus = focuses[name] || focuses.cell;
      currentFocus = name in focuses ? name : "cell";
      transform = {
        x: view.cx - focus.x * focus.k,
        y: view.cy - focus.y * focus.k,
        k: focus.k,
      };
      if (focusLabel) focusLabel.textContent = focus.label;
      if (focusText) focusText.textContent = focus.text;
      focusButtons.forEach((button) => {
        const pressed = button.dataset.focusTarget === currentFocus;
        button.classList.toggle("is-active", pressed);
        button.setAttribute("aria-pressed", pressed ? "true" : "false");
      });
      applyTransform();
    }

    function svgPoint(event) {
      const point = svg.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      return point.matrixTransform(svg.getScreenCTM().inverse());
    }

    function zoomAt(point, factor) {
      const nextK = clamp(transform.k * factor, 0.8, 5);
      const worldX = (point.x - transform.x) / transform.k;
      const worldY = (point.y - transform.y) / transform.k;
      transform.x = point.x - worldX * nextK;
      transform.y = point.y - worldY * nextK;
      transform.k = nextK;
      applyTransform();
    }

    svg.addEventListener(
      "wheel",
      function (event) {
        event.preventDefault();
        zoomAt(svgPoint(event), event.deltaY < 0 ? 1.15 : 0.87);
      },
      { passive: false }
    );

    svg.addEventListener("pointerdown", function (event) {
      svg.setPointerCapture(event.pointerId);
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
      root.classList.add("is-dragging");
    });

    svg.addEventListener("pointermove", function (event) {
      if (!drag || drag.id !== event.pointerId) return;
      const rect = svg.getBoundingClientRect();
      const scale = view.width / rect.width;
      transform.x += (event.clientX - drag.x) * scale;
      transform.y += (event.clientY - drag.y) * scale;
      drag.x = event.clientX;
      drag.y = event.clientY;
      applyTransform();
    });

    function clearDrag(event) {
      if (!event || !drag || drag.id === event.pointerId) {
        drag = null;
        root.classList.remove("is-dragging");
      }
    }

    svg.addEventListener("pointerup", clearDrag);
    svg.addEventListener("pointercancel", clearDrag);
    svg.addEventListener("pointerleave", clearDrag);

    focusButtons.forEach((button) => {
      button.addEventListener("click", () => setFocus(button.dataset.focusTarget));
    });

    if (zoomIn) {
      zoomIn.addEventListener("click", () => zoomAt({ x: view.cx, y: view.cy }, 1.2));
    }

    if (zoomOut) {
      zoomOut.addEventListener("click", () => zoomAt({ x: view.cx, y: view.cy }, 0.84));
    }

    if (reset) {
      reset.addEventListener("click", () => setFocus("cell"));
    }

    setFocus(currentFocus);
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".perturbseq-crispri-viewer").forEach(initViewer);
  });
})();
