(function () {
  const THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js";

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function colorVar(name, fallback) {
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  }

  function makeMaterial(THREE, color, options) {
    return new THREE.MeshStandardMaterial(
      Object.assign(
        {
          color,
          roughness: 0.62,
          metalness: 0.03,
        },
        options || {}
      )
    );
  }

  function addTextSprite(THREE, text, options) {
    const settings = Object.assign({ width: 512, height: 128, fontSize: 34, scale: [1.9, 0.48, 1] }, options || {});
    const canvas = document.createElement("canvas");
    canvas.width = settings.width;
    canvas.height = settings.height;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = `600 ${settings.fontSize}px system-ui, -apple-system, Segoe UI, sans-serif`;
    ctx.fillStyle = colorVar("--global-text-color", "#232323");
    ctx.fillText(text, 22, settings.height * 0.62);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(settings.scale[0], settings.scale[1], settings.scale[2]);
    return sprite;
  }

  function addLabel(THREE, scene, text, position, target) {
    const sprite = addTextSprite(THREE, text);
    sprite.position.copy(position);
    scene.add(sprite);

    if (target) {
      const line = addTube(
        THREE,
        scene,
        [
          [position.x - 0.24, position.y - 0.08, position.z],
          [target.x, target.y, target.z],
        ],
        "#596579",
        0.01
      );
      line.material.transparent = true;
      line.material.opacity = 0.62;
    }

    return sprite;
  }

  function addCylinderBetween(THREE, group, start, end, radius, color) {
    const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const direction = new THREE.Vector3().subVectors(end, start);
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, direction.length(), 10), makeMaterial(THREE, color));
    mesh.position.copy(midpoint);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    group.add(mesh);
    return mesh;
  }

  function addTube(THREE, group, points, color, radius) {
    const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(point[0], point[1], point[2])));
    const geometry = new THREE.TubeGeometry(curve, 80, radius, 12, false);
    const mesh = new THREE.Mesh(geometry, makeMaterial(THREE, color));
    group.add(mesh);
    return mesh;
  }

  function addNucleotideLabel(THREE, group, base, position) {
    const sprite = addTextSprite(THREE, base, { width: 96, height: 96, fontSize: 46, scale: [0.18, 0.18, 1] });
    sprite.position.copy(position);
    group.add(sprite);
    return sprite;
  }

  function addDnaSequence(THREE, group, colors) {
    const dna = new THREE.Group();
    const bases = [
      ["A", "T"],
      ["C", "G"],
      ["G", "C"],
      ["T", "A"],
      ["A", "T"],
      ["G", "C"],
      ["C", "G"],
      ["T", "A"],
      ["G", "C"],
      ["A", "T"],
      ["C", "G"],
      ["G", "C"],
      ["T", "A"],
      ["A", "T"],
      ["C", "G"],
      ["G", "C"],
    ];
    const baseColors = { A: "#4c8bd6", T: "#d6a33f", C: "#4da878", G: "#bd6a9a" };
    const strandA = [];
    const strandB = [];
    const sugarMaterial = makeMaterial(THREE, "#d8e8ff", { transparent: true, opacity: 0.88 });

    bases.forEach((pair, index) => {
      const t = index / (bases.length - 1);
      const x = -1.46 + t * 2.15;
      const phase = index * 0.82;
      const y = 0.08 + Math.sin(phase) * 0.18;
      const z = 0.14 + Math.cos(phase) * 0.18;
      const opposite = new THREE.Vector3(x, 0.08 - Math.sin(phase) * 0.18, 0.14 - Math.cos(phase) * 0.18);
      const first = new THREE.Vector3(x, y, z);
      strandA.push([first.x, first.y, first.z]);
      strandB.push([opposite.x, opposite.y, opposite.z]);

      addCylinderBetween(THREE, dna, first, opposite, 0.012, "#b8c2d3");

      [first, opposite].forEach((point, side) => {
        const base = pair[side];
        const sugar = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), sugarMaterial);
        sugar.position.copy(point);
        dna.add(sugar);

        const basePoint = point.clone().lerp(side === 0 ? opposite : first, 0.38);
        const baseMesh = new THREE.Mesh(new THREE.SphereGeometry(0.046, 16, 10), makeMaterial(THREE, baseColors[base]));
        baseMesh.position.copy(basePoint);
        dna.add(baseMesh);

        if (index % 2 === 0) {
          addNucleotideLabel(THREE, dna, base, basePoint.clone().add(new THREE.Vector3(0, side === 0 ? 0.08 : -0.08, 0.03)));
        }
      });
    });

    addTube(THREE, dna, strandA, colors.blue, 0.018);
    addTube(THREE, dna, strandB, colors.blue, 0.018);
    dna.position.set(0.02, 0.1, 0.36);
    dna.rotation.set(-0.08, 0.05, 0.16);
    group.add(dna);
    return dna;
  }

  function initViewer(THREE, root) {
    const stage = root.querySelector(".perturbseq-three-stage");
    const canvas = root.querySelector(".perturbseq-three-canvas");
    const status = root.querySelector(".perturbseq-zoom-status");
    const focusLabel = root.querySelector(".perturbseq-focus-label");
    const focusText = root.querySelector(".perturbseq-focus-text");
    const focusButtons = root.querySelectorAll("[data-focus-target]");
    const zoomIn = root.querySelector("[data-zoom-action='in']");
    const zoomOut = root.querySelector("[data-zoom-action='out']");
    const reset = root.querySelector("[data-zoom-action='reset']");

    if (!stage || !canvas) return;

    const colors = {
      blue: "#2f6fbd",
      cyan: "#2daecb",
      green: "#3b9467",
      gold: "#d39b2c",
      red: "#c85c5c",
      purple: "#7d62b8",
    };

    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    const cell = new THREE.Group();
    const labels = new THREE.Group();
    scene.add(cell, labels);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x8aa0b8, 2.1));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.7);
    keyLight.position.set(4, 5, 7);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0x8fd5ff, 1.2);
    rimLight.position.set(-5, -2, 4);
    scene.add(rimLight);

    const membrane = new THREE.Mesh(
      new THREE.SphereGeometry(2.8, 80, 48),
      makeMaterial(THREE, colors.cyan, {
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    membrane.scale.set(1.28, 0.86, 0.72);
    cell.add(membrane);

    const membraneWire = new THREE.Mesh(
      new THREE.SphereGeometry(2.83, 28, 18),
      new THREE.MeshBasicMaterial({ color: colors.cyan, wireframe: true, transparent: true, opacity: 0.14 })
    );
    membraneWire.scale.copy(membrane.scale);
    cell.add(membraneWire);

    const nucleus = new THREE.Mesh(
      new THREE.SphereGeometry(1.35, 56, 36),
      makeMaterial(THREE, colors.blue, { transparent: true, opacity: 0.42, depthWrite: false })
    );
    nucleus.position.set(-0.45, 0.05, 0.05);
    nucleus.scale.set(1.12, 0.82, 0.78);
    cell.add(nucleus);

    const nucleolus = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 32, 18),
      makeMaterial(THREE, colors.purple, { transparent: true, opacity: 0.78 })
    );
    nucleolus.position.set(-0.92, -0.28, 0.34);
    cell.add(nucleolus);

    const dnaSequence = addDnaSequence(THREE, cell, colors);

    const cas9 = new THREE.Mesh(new THREE.SphereGeometry(0.18, 32, 18), makeMaterial(THREE, colors.blue));
    cas9.position.set(-0.2, 0.38, 0.54);
    cell.add(cas9);

    const krab = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.2, 0.18), makeMaterial(THREE, colors.purple));
    krab.position.set(0.04, 0.54, 0.58);
    krab.rotation.set(0.2, 0.4, 0.15);
    cell.add(krab);

    addTube(
      THREE,
      cell,
      [
        [-0.48, 0.04, 0.48],
        [-0.34, 0.02, 0.7],
        [-0.1, 0.16, 0.67],
        [0.03, 0.36, 0.56],
      ],
      colors.green,
      0.025
    );

    const rnap = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.42, 8, 24), makeMaterial(THREE, colors.gold));
    rnap.position.set(0.82, 0.18, 0.43);
    rnap.rotation.z = Math.PI / 2;
    cell.add(rnap);

    addTube(
      THREE,
      cell,
      [
        [0.98, 0.15, 0.4],
        [1.28, 0.12, 0.53],
        [1.54, -0.02, 0.36],
      ],
      colors.red,
      0.024
    ).material.opacity = 0.45;

    const mitoMaterial = makeMaterial(THREE, colors.red, { transparent: true, opacity: 0.82 });
    [
      [-1.95, 0.74, -0.56, -0.7],
      [1.7, -0.82, 0.6, 0.45],
    ].forEach(([x, y, z, rot]) => {
      const mito = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.82, 12, 28), mitoMaterial);
      mito.position.set(x, y, z);
      mito.rotation.set(Math.PI / 2, 0.2, rot);
      cell.add(mito);
    });

    const er = new THREE.Group();
    addTube(
      THREE,
      er,
      [
        [0.64, 0.58, -0.46],
        [1.1, 0.74, -0.24],
        [1.52, 0.42, 0.0],
        [1.28, 0.08, 0.3],
        [0.76, 0.16, 0.12],
      ],
      colors.green,
      0.04
    );
    addTube(
      THREE,
      er,
      [
        [0.58, 0.34, -0.3],
        [1.02, 0.38, -0.1],
        [1.24, 0.12, 0.1],
        [0.9, -0.08, 0.26],
      ],
      colors.green,
      0.035
    );
    cell.add(er);

    const guideMaterial = makeMaterial(THREE, colors.green, { emissive: colors.green, emissiveIntensity: 0.16 });
    [
      [1.0, -0.88, -0.28],
      [1.34, -1.16, 0.22],
      [0.68, -1.22, 0.52],
    ].forEach(([x, y, z]) => {
      const guide = new THREE.Mesh(new THREE.SphereGeometry(0.08, 18, 12), guideMaterial);
      guide.position.set(x, y, z);
      cell.add(guide);
    });

    addTube(
      THREE,
      cell,
      [
        [0.78, -0.7, -0.2],
        [1.16, -0.54, -0.02],
        [1.54, -0.68, 0.08],
      ],
      "#7f8a97",
      0.026
    );
    addTube(
      THREE,
      cell,
      [
        [0.26, -1.08, 0.16],
        [0.68, -0.9, 0.38],
        [1.02, -1.04, 0.52],
      ],
      "#7f8a97",
      0.026
    );

    addLabel(THREE, labels, "cell membrane", new THREE.Vector3(-2.78, 1.7, 0), new THREE.Vector3(-2.48, 0.86, 0.02));
    addLabel(THREE, labels, "nucleus", new THREE.Vector3(-1.95, 1.28, 0.28), nucleus.position);
    addLabel(THREE, labels, "DNA sequence", new THREE.Vector3(-1.05, 1.02, 1.05), dnaSequence.position);
    addLabel(THREE, labels, "dCas9-KRAB + sgRNA", new THREE.Vector3(0.26, 1.1, 1.02), cas9.position);
    addLabel(THREE, labels, "guide + mRNA readout", new THREE.Vector3(1.02, -1.78, 0.38), new THREE.Vector3(1.1, -1.02, 0.16));

    const focuses = {
      cell: {
        label: "Whole 3D cell",
        text: "Drag to rotate one perturbed cell. The membrane stays still unless you move the view; callout lines point to the nucleus, DNA sequence, CRISPRi complex, and readout molecules.",
        target: new THREE.Vector3(0, 0, 0),
        distance: 7.2,
      },
      nucleus: {
        label: "Nucleus and DNA sequence",
        text: "The nucleus contains a nucleotide-level DNA segment: paired A/T and C/G bases sit between two sugar-phosphate backbones.",
        target: new THREE.Vector3(-0.16, 0.22, 0.52),
        distance: 3.4,
      },
      binding: {
        label: "sgRNA target binding",
        text: "The sgRNA-dCas9-KRAB complex is positioned on the DNA sequence near RNA polymerase, showing where repression acts at the target locus.",
        target: new THREE.Vector3(0.12, 0.42, 0.58),
        distance: 2.4,
      },
      readout: {
        label: "Transcript and guide readout",
        text: "The lower cytoplasm shows guide identifiers and transcript molecules that are captured with the same cell barcode.",
        target: new THREE.Vector3(1.02, -0.98, 0.18),
        distance: 3.4,
      },
    };

    const state = {
      target: focuses.cell.target.clone(),
      distance: focuses.cell.distance,
      yaw: -0.45,
      pitch: 0.2,
      dragging: null,
      focus: "cell",
    };

    function resize() {
      const rect = stage.getBoundingClientRect();
      const width = Math.max(320, Math.floor(rect.width));
      const height = Math.max(420, Math.floor(rect.height));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      labels.visible = camera.aspect >= 0.75;
    }

    function updateCamera() {
      state.pitch = clamp(state.pitch, -1.1, 1.1);
      state.distance = clamp(state.distance, 1.8, 9);
      const displayDistance = state.distance * (camera.aspect < 0.75 ? 2.05 : 1);
      const cosPitch = Math.cos(state.pitch);
      camera.position.set(
        state.target.x + Math.sin(state.yaw) * cosPitch * displayDistance,
        state.target.y + Math.sin(state.pitch) * displayDistance,
        state.target.z + Math.cos(state.yaw) * cosPitch * displayDistance
      );
      camera.lookAt(state.target);
      if (status) status.textContent = `${Math.round((focuses.cell.distance / state.distance) * 100)}%`;
    }

    function setFocus(name) {
      const focus = focuses[name] || focuses.cell;
      state.focus = name in focuses ? name : "cell";
      state.target.copy(focus.target);
      state.distance = focus.distance;
      if (focusLabel) focusLabel.textContent = focus.label;
      if (focusText) focusText.textContent = focus.text;
      focusButtons.forEach((button) => {
        const pressed = button.dataset.focusTarget === state.focus;
        button.classList.toggle("is-active", pressed);
        button.setAttribute("aria-pressed", pressed ? "true" : "false");
      });
      updateCamera();
    }

    function render() {
      labels.children.forEach((label) => {
        if (label.isSprite) label.quaternion.copy(camera.quaternion);
      });
      cell.traverse((object) => {
        if (object.isSprite) object.quaternion.copy(camera.quaternion);
      });
      renderer.render(scene, camera);
      requestAnimationFrame(render);
    }

    stage.addEventListener("pointerdown", function (event) {
      stage.setPointerCapture(event.pointerId);
      state.dragging = { id: event.pointerId, x: event.clientX, y: event.clientY };
      root.classList.add("is-dragging");
    });

    stage.addEventListener("pointermove", function (event) {
      if (!state.dragging || state.dragging.id !== event.pointerId) return;
      const dx = event.clientX - state.dragging.x;
      const dy = event.clientY - state.dragging.y;
      state.yaw -= dx * 0.008;
      state.pitch -= dy * 0.006;
      state.dragging.x = event.clientX;
      state.dragging.y = event.clientY;
      updateCamera();
    });

    function clearDrag(event) {
      if (!event || !state.dragging || state.dragging.id === event.pointerId) {
        state.dragging = null;
        root.classList.remove("is-dragging");
      }
    }

    stage.addEventListener("pointerup", clearDrag);
    stage.addEventListener("pointercancel", clearDrag);
    stage.addEventListener("pointerleave", clearDrag);
    stage.addEventListener(
      "wheel",
      function (event) {
        event.preventDefault();
        state.distance *= event.deltaY < 0 ? 0.9 : 1.1;
        updateCamera();
      },
      { passive: false }
    );

    focusButtons.forEach((button) => {
      button.addEventListener("click", () => setFocus(button.dataset.focusTarget));
    });

    if (zoomIn) zoomIn.addEventListener("click", () => ((state.distance *= 0.84), updateCamera()));
    if (zoomOut) zoomOut.addEventListener("click", () => ((state.distance *= 1.18), updateCamera()));
    if (reset) reset.addEventListener("click", () => setFocus("cell"));

    window.addEventListener("resize", resize);
    resize();
    setFocus("cell");
    render();
  }

  async function loadThree() {
    if (window.__perturbseqThree) return window.__perturbseqThree;
    window.__perturbseqThree = import(THREE_URL);
    return window.__perturbseqThree;
  }

  document.addEventListener("DOMContentLoaded", async function () {
    const roots = document.querySelectorAll(".perturbseq-crispri-viewer");
    if (!roots.length) return;

    try {
      const THREE = await loadThree();
      roots.forEach((root) => initViewer(THREE, root));
    } catch (error) {
      roots.forEach((root) => {
        root.classList.add("perturbseq-three-error");
        const focusText = root.querySelector(".perturbseq-focus-text");
        if (focusText) focusText.textContent = "The 3D viewer could not load. Please refresh the page.";
      });
    }
  });
})();
