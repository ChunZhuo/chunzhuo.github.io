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

  function addLabel(THREE, scene, text, position) {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = "600 34px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillStyle = colorVar("--global-text-color", "#232323");
    ctx.fillText(text, 22, 76);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    sprite.position.copy(position);
    sprite.scale.set(1.9, 0.48, 1);
    scene.add(sprite);
    return sprite;
  }

  function addTube(THREE, group, points, color, radius) {
    const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(point[0], point[1], point[2])));
    const geometry = new THREE.TubeGeometry(curve, 80, radius, 12, false);
    const mesh = new THREE.Mesh(geometry, makeMaterial(THREE, color));
    group.add(mesh);
    return mesh;
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

    addTube(
      THREE,
      cell,
      [
        [-1.62, 0.06, 0.14],
        [-1.18, 0.44, -0.1],
        [-0.68, -0.05, 0.2],
        [-0.12, 0.32, -0.14],
        [0.48, -0.02, 0.16],
      ],
      colors.blue,
      0.035
    );
    addTube(
      THREE,
      cell,
      [
        [-1.46, -0.28, -0.12],
        [-0.94, -0.54, 0.12],
        [-0.32, -0.16, -0.14],
        [0.26, -0.46, 0.1],
        [0.74, -0.16, -0.1],
      ],
      colors.blue,
      0.032
    );

    const cas9 = new THREE.Mesh(new THREE.SphereGeometry(0.18, 32, 18), makeMaterial(THREE, colors.blue));
    cas9.position.set(-0.22, 0.22, 0.42);
    cell.add(cas9);

    const krab = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.2, 0.18), makeMaterial(THREE, colors.purple));
    krab.position.set(0.02, 0.38, 0.48);
    krab.rotation.set(0.2, 0.4, 0.15);
    cell.add(krab);

    addTube(
      THREE,
      cell,
      [
        [-0.48, 0.04, 0.48],
        [-0.36, -0.12, 0.64],
        [-0.12, -0.04, 0.56],
        [0.02, 0.14, 0.48],
      ],
      colors.green,
      0.025
    );

    const rnap = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.42, 8, 24), makeMaterial(THREE, colors.gold));
    rnap.position.set(0.58, -0.02, 0.35);
    rnap.rotation.z = Math.PI / 2;
    cell.add(rnap);

    addTube(
      THREE,
      cell,
      [
        [0.75, -0.05, 0.32],
        [1.12, -0.08, 0.45],
        [1.44, -0.22, 0.28],
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

    addLabel(THREE, labels, "membrane", new THREE.Vector3(-2.9, 1.75, 0));
    addLabel(THREE, labels, "nucleus", new THREE.Vector3(-1.45, 1.25, 0.25));
    addLabel(THREE, labels, "dCas9-KRAB + sgRNA", new THREE.Vector3(0.12, 0.86, 0.8));
    addLabel(THREE, labels, "guide + mRNA readout", new THREE.Vector3(1.16, -1.78, 0.38));

    const focuses = {
      cell: {
        label: "Whole 3D cell",
        text: "Drag to rotate one perturbed cell. The translucent membrane keeps the nucleus, organelles, guide molecules, and transcript readout in the same spatial model.",
        target: new THREE.Vector3(0, 0, 0),
        distance: 7.2,
      },
      nucleus: {
        label: "Nucleus and chromatin",
        text: "The camera moves into the nucleus so the chromatin path and target locus remain part of the same rotatable cell.",
        target: new THREE.Vector3(-0.45, 0.08, 0.18),
        distance: 4.1,
      },
      binding: {
        label: "sgRNA target binding",
        text: "The sgRNA-dCas9-KRAB complex sits near the target DNA and RNA polymerase, illustrating CRISPRi repression without turning the view into a flat diagram.",
        target: new THREE.Vector3(-0.04, 0.22, 0.44),
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
      labels.children.forEach((label) => label.quaternion.copy(camera.quaternion));
      membrane.rotation.y += 0.0015;
      membraneWire.rotation.y -= 0.001;
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
