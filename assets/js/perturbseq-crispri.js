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
          roughness: 0.66,
          metalness: 0.02,
        },
        options || {}
      )
    );
  }

  function addTube(THREE, group, points, color, radius, options) {
    const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(point[0], point[1], point[2])));
    const geometry = new THREE.TubeGeometry(curve, 120, radius, 14, false);
    const mesh = new THREE.Mesh(geometry, makeMaterial(THREE, color, options));
    group.add(mesh);
    return mesh;
  }

  function addCylinderBetween(THREE, group, start, end, radius, color, options) {
    const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const direction = new THREE.Vector3().subVectors(end, start);
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, direction.length(), 10), makeMaterial(THREE, color, options));
    mesh.position.copy(midpoint);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    group.add(mesh);
    return mesh;
  }

  function addTextSprite(THREE, text, options) {
    const settings = Object.assign({ width: 512, height: 128, fontSize: 34, scale: [1.65, 0.42, 1] }, options || {});
    const canvas = document.createElement("canvas");
    canvas.width = settings.width;
    canvas.height = settings.height;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = `600 ${settings.fontSize}px system-ui, -apple-system, Segoe UI, sans-serif`;
    ctx.fillStyle = colorVar("--global-text-color", "#232323");
    ctx.fillText(text, 20, settings.height * 0.62);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(settings.scale[0], settings.scale[1], settings.scale[2]);
    return sprite;
  }

  function addLabel(THREE, group, text, position, stage) {
    const sprite = addTextSprite(THREE, text);
    sprite.position.copy(position);
    sprite.userData.stage = stage;
    group.add(sprite);
    return sprite;
  }

  function setGroupOpacity(group, opacity) {
    group.visible = opacity > 0.001;
    group.traverse((object) => {
      if (!object.material) return;
      object.material.transparent = opacity < 1 || object.material.transparent;
      object.material.opacity = object.userData.baseOpacity == null ? opacity : object.userData.baseOpacity * opacity;
    });
  }

  function addHistoneOctamer(THREE, group, position, scale, colors) {
    const octamer = new THREE.Group();
    const subunitColors = [colors.histoneA, colors.histoneB, colors.histoneC, colors.histoneD];
    const offsets = [
      [-0.12, 0.1, 0.08],
      [0.12, 0.1, 0.08],
      [-0.12, -0.1, 0.08],
      [0.12, -0.1, 0.08],
      [-0.12, 0.1, -0.08],
      [0.12, 0.1, -0.08],
      [-0.12, -0.1, -0.08],
      [0.12, -0.1, -0.08],
    ];

    offsets.forEach(([x, y, z], index) => {
      const subunit = new THREE.Mesh(new THREE.SphereGeometry(0.115, 28, 18), makeMaterial(THREE, subunitColors[index % subunitColors.length]));
      subunit.scale.set(1.05, 0.86, 0.92);
      subunit.position.set(x, y, z);
      octamer.add(subunit);
    });

    octamer.position.copy(position);
    octamer.scale.setScalar(scale);
    group.add(octamer);
    return octamer;
  }

  function addWrappedDna(THREE, group, radius, width, turns, colors) {
    const strandA = [];
    const strandB = [];
    const steps = 120;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * Math.PI * 2 * turns;
      const x = -width / 2 + (i / steps) * width;
      strandA.push([x, Math.cos(t) * radius, Math.sin(t) * radius]);
      strandB.push([x, Math.cos(t + Math.PI) * radius, Math.sin(t + Math.PI) * radius]);
    }
    addTube(THREE, group, strandA, colors.dnaBlue, 0.018);
    addTube(THREE, group, strandB, colors.dnaWhite, 0.014);
  }

  function addNucleosome(THREE, group, position, rotation, scale, colors) {
    const nucleosome = new THREE.Group();
    addHistoneOctamer(THREE, nucleosome, new THREE.Vector3(0, 0, 0), 1, colors);
    addWrappedDna(THREE, nucleosome, 0.27, 0.48, 1.75, colors);
    nucleosome.position.copy(position);
    nucleosome.rotation.set(rotation.x, rotation.y, rotation.z);
    nucleosome.scale.setScalar(scale);
    group.add(nucleosome);
    return nucleosome;
  }

  function addChromosomeTerritory(THREE, group, colors) {
    const territory = new THREE.Group();
    const shell = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 48, 28),
      makeMaterial(THREE, colors.territory, {
        transparent: true,
        opacity: 0.32,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    shell.userData.baseOpacity = 0.32;
    shell.scale.set(1.22, 0.72, 0.86);
    shell.position.set(-0.38, 0.08, 0.08);
    territory.add(shell);

    for (let loop = 0; loop < 11; loop++) {
      const points = [];
      const phase = loop * 0.7;
      const yBias = -0.42 + loop * 0.085;
      for (let i = 0; i < 8; i++) {
        const t = i / 7;
        points.push([
          -1.38 + t * 2.05 + Math.sin(t * Math.PI * 3 + phase) * 0.18,
          yBias + Math.sin(t * Math.PI * 2.2 + phase) * 0.22,
          0.02 + Math.cos(t * Math.PI * 2.5 + phase) * 0.38,
        ]);
      }
      const tube = addTube(THREE, territory, points, loop % 3 === 0 ? colors.dnaBlue : "#6f8fba", 0.026, { transparent: true, opacity: 0.9 });
      tube.userData.baseOpacity = 0.9;
      tube.userData.loopPhase = phase;
    }

    group.add(territory);
    return territory;
  }

  function addLoopDomain(THREE, group, colors) {
    const loops = new THREE.Group();
    const anchorMaterial = makeMaterial(THREE, colors.anchor, { transparent: true, opacity: 0.9 });
    const loopPath = [];

    for (let i = 0; i < 5; i++) {
      const x = -0.9 + i * 0.45;
      const height = 0.65 + Math.sin(i * 1.3) * 0.18;
      const depth = i % 2 === 0 ? 0.28 : -0.24;
      loopPath.push(
        [x - 0.18, -0.4, depth * 0.4],
        [x - 0.32, 0.04, depth],
        [x, height, depth * 0.6],
        [x + 0.32, 0.02, -depth],
        [x + 0.18, -0.4, -depth * 0.3]
      );

      if (i < 4) {
        const nextX = -0.9 + (i + 1) * 0.45;
        loopPath.push(
          [x + 0.24, -0.43, -depth * 0.18],
          [(x + nextX) / 2, -0.46, 0],
          [nextX - 0.24, -0.43, 0]
        );
      }

      [-0.18, 0.18].forEach((dx) => {
        const anchor = new THREE.Mesh(new THREE.SphereGeometry(0.055, 18, 12), anchorMaterial);
        anchor.position.set(x + dx, -0.42, dx < 0 ? depth * 0.35 : -depth * 0.25);
        loops.add(anchor);
      });
    }

    addTube(THREE, loops, loopPath, colors.dnaBlue, 0.026, { transparent: true, opacity: 0.86 }).userData.baseOpacity = 0.86;

    loops.position.set(-0.1, 0.02, 0.22);
    group.add(loops);
    return loops;
  }

  function addBeadsOnStringFiber(THREE, group, colors) {
    const fiber = new THREE.Group();
    const centers = [];
    for (let i = 0; i < 8; i++) {
      const t = i / 7;
      centers.push(new THREE.Vector3(-0.92 + t * 1.84, Math.sin(t * Math.PI * 2.2) * 0.16, Math.cos(t * Math.PI * 2.8) * 0.12));
    }

    centers.forEach((center, index) => {
      addNucleosome(THREE, fiber, center, new THREE.Euler(0.2 + index * 0.12, index * 0.38, -0.15 + index * 0.18), 0.45, colors);
      if (index < centers.length - 1) {
        const next = centers[index + 1];
        addTube(
          THREE,
          fiber,
          [
            [center.x + 0.12, center.y, center.z],
            [(center.x + next.x) / 2, (center.y + next.y) / 2 + 0.12, (center.z + next.z) / 2],
            [next.x - 0.12, next.y, next.z],
          ],
          colors.dnaWhite,
          0.016
        );
      }
    });

    fiber.position.set(-0.1, 0.03, 0.24);
    group.add(fiber);
    return fiber;
  }

  function addSingleNucleosomeDetail(THREE, group, colors) {
    const detail = new THREE.Group();
    addNucleosome(THREE, detail, new THREE.Vector3(0, 0, 0), new THREE.Euler(0.05, -0.4, 0.2), 0.45, colors);
    addTube(
      THREE,
      detail,
      [
        [-0.3, -0.02, -0.06],
        [-0.22, 0.03, -0.02],
        [-0.14, 0.02, 0.02],
      ],
      colors.dnaWhite,
      0.01
    );
    addTube(
      THREE,
      detail,
      [
        [0.14, -0.01, 0.02],
        [0.22, -0.04, 0.06],
        [0.3, -0.02, 0.08],
      ],
      colors.dnaBlue,
      0.01
    );
    detail.position.set(0.18, -0.04, 0.28);
    group.add(detail);
    return detail;
  }

  function addDoubleHelixDetail(THREE, group, colors) {
    const helix = new THREE.Group();
    const strandA = [];
    const strandB = [];
    const basePairs = [
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
    ];
    const baseColors = { A: "#4e8bd6", T: "#d9b95b", C: "#49a978", G: "#bd6a9a" };

    basePairs.forEach((pair, index) => {
      const t = index / (basePairs.length - 1);
      const x = -0.9 + t * 1.8;
      const phase = index * 0.82;
      const first = new THREE.Vector3(x, Math.cos(phase) * 0.22, Math.sin(phase) * 0.22);
      const second = new THREE.Vector3(x, Math.cos(phase + Math.PI) * 0.22, Math.sin(phase + Math.PI) * 0.22);
      strandA.push([first.x, first.y, first.z]);
      strandB.push([second.x, second.y, second.z]);
      addCylinderBetween(THREE, helix, first, second, 0.012, "#bcc9d8");

      [first, second].forEach((point, side) => {
        const base = pair[side];
        const baseMesh = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 10), makeMaterial(THREE, baseColors[base]));
        baseMesh.position.copy(point.clone().lerp(side === 0 ? second : first, 0.38));
        helix.add(baseMesh);
      });
    });

    addTube(THREE, helix, strandA, colors.dnaBlue, 0.024);
    addTube(THREE, helix, strandB, colors.dnaWhite, 0.02);
    helix.position.set(0.27, -0.04, 0.31);
    helix.rotation.set(0.05, -0.46, 0.18);
    helix.scale.setScalar(0.12);
    group.add(helix);
    return helix;
  }

  function addCrispriComplex(THREE, group, colors) {
    const crispri = new THREE.Group();
    const guide = [];
    const guideStart = new THREE.Vector3(-0.18, 0.04, 0.02);
    const guideEnd = new THREE.Vector3(0.18, 0.04, -0.02);

    for (let i = 0; i <= 18; i++) {
      const t = i / 18;
      guide.push([
        guideStart.x + (guideEnd.x - guideStart.x) * t,
        guideStart.y + Math.sin(t * Math.PI) * 0.03,
        guideStart.z + (guideEnd.z - guideStart.z) * t,
      ]);
    }

    addTube(THREE, crispri, guide, colors.guide, 0.018);

    const cas9 = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 32, 22),
      makeMaterial(THREE, colors.cas9)
    );
    cas9.scale.set(1.2, 0.9, 0.82);
    cas9.position.set(0, 0.14, 0);
    crispri.add(cas9);

    const krab = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 28, 18),
      makeMaterial(THREE, colors.krab)
    );
    krab.position.set(0.12, 0.3, 0.02);
    crispri.add(krab);

    addCylinderBetween(
      THREE,
      crispri,
      new THREE.Vector3(0.06, 0.22, 0.01),
      new THREE.Vector3(0.1, 0.27, 0.02),
      0.018,
      colors.krab
    );

    const targetMarker = new THREE.Mesh(
      new THREE.TorusGeometry(0.12, 0.012, 12, 36),
      makeMaterial(THREE, colors.target, { transparent: true, opacity: 0.88 })
    );
    targetMarker.rotation.x = Math.PI / 2;
    targetMarker.position.set(0, -0.02, 0);
    targetMarker.userData.baseOpacity = 0.88;
    crispri.add(targetMarker);

    crispri.position.set(0.27, -0.04, 0.31);
    crispri.rotation.set(0.05, -0.46, 0.18);
    crispri.scale.setScalar(0.18);
    group.add(crispri);
    return crispri;
  }

  function addTranscriptRibbon(THREE, group, points, color, radius) {
    const transcript = addTube(THREE, group, points, color, radius, { transparent: true, opacity: 0.92 });
    transcript.userData.baseOpacity = 0.92;
    return transcript;
  }

  function addRnaReadout(THREE, group, colors) {
    const readout = new THREE.Group();

    const nucleusShell = new THREE.Mesh(
      new THREE.SphereGeometry(0.98, 48, 28),
      makeMaterial(THREE, colors.nucleus, {
        transparent: true,
        opacity: 0.24,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    nucleusShell.userData.baseOpacity = 0.24;
    nucleusShell.scale.set(1.08, 0.82, 0.78);
    nucleusShell.position.set(-0.82, 0, 0);
    readout.add(nucleusShell);

    const pore = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.018, 12, 32), makeMaterial(THREE, colors.nucleus));
    pore.rotation.y = Math.PI / 2;
    pore.position.set(0.13, 0.04, 0);
    readout.add(pore);

    const backgroundTranscripts = [
      [[-0.24, 0.34, -0.1], [0.2, 0.44, -0.08], [0.62, 0.32, -0.04], [1.02, 0.4, 0]],
      [[-0.2, 0.02, 0.08], [0.18, 0.08, 0.12], [0.62, 0.02, 0.16], [1.08, 0.12, 0.18]],
      [[-0.16, -0.28, -0.1], [0.18, -0.24, -0.06], [0.56, -0.34, -0.02], [1.02, -0.26, 0.02]],
      [[0.18, 0.62, 0.12], [0.48, 0.72, 0.08], [0.82, 0.66, 0.14], [1.14, 0.74, 0.1]],
    ];

    backgroundTranscripts.forEach((points) => addTranscriptRibbon(THREE, readout, points, colors.rna, 0.024));

    const targetTranscripts = [
      [[-0.2, -0.02, -0.18], [0.14, -0.02, -0.18], [0.5, -0.08, -0.14], [0.82, -0.02, -0.1]],
      [[0.08, -0.58, 0.1], [0.34, -0.54, 0.12], [0.62, -0.6, 0.14], [0.88, -0.56, 0.18]],
    ];

    targetTranscripts.forEach((points) => addTranscriptRibbon(THREE, readout, points, colors.target, 0.028));

    const droplet = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 36, 24),
      makeMaterial(THREE, colors.readout, { transparent: true, opacity: 0.24, depthWrite: false })
    );
    droplet.userData.baseOpacity = 0.24;
    droplet.position.set(1.42, 0.06, 0);
    readout.add(droplet);

    const barcode = addTextSprite(THREE, "cell barcode + guide ID", { width: 768, scale: [1.8, 0.36, 1], fontSize: 30 });
    barcode.position.set(1.42, 0.58, 0);
    readout.add(barcode);

    const counts = addTextSprite(THREE, "mRNA counts", { width: 512, scale: [1.18, 0.34, 1], fontSize: 30 });
    counts.position.set(1.42, -0.48, 0);
    readout.add(counts);

    readout.position.set(0, 0, 0);
    group.add(readout);
    return readout;
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
      dnaBlue: "#2f6fbd",
      dnaWhite: "#dbeafe",
      territory: "#6f7fd3",
      anchor: "#6d7890",
      histoneA: "#7d62b8",
      histoneB: "#9a77d2",
      histoneC: "#6b8ac9",
      histoneD: "#b57cb6",
      nucleus: "#7fc7df",
      guide: "#3b9467",
      cas9: "#2f6fbd",
      krab: "#7d62b8",
      target: "#c85c5c",
      rna: "#3b9467",
      readout: "#d39b2c",
    };

    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0xf7fbff, 0.78);

    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    const world = new THREE.Group();
    const labels = new THREE.Group();
    scene.add(world, labels);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x9fb1c9, 2.2));
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
    keyLight.position.set(4, 5, 7);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0x9bdfff, 1.25);
    rimLight.position.set(-5, -2, 4);
    scene.add(rimLight);

    const nucleusGroup = new THREE.Group();
    const territoryGroup = new THREE.Group();
    const loopGroup = new THREE.Group();
    const fiberGroup = new THREE.Group();
    const nucleosomeGroup = new THREE.Group();
    const helixGroup = new THREE.Group();
    const crispriGroup = new THREE.Group();
    const readoutGroup = new THREE.Group();
    world.add(nucleusGroup, territoryGroup, loopGroup, fiberGroup, nucleosomeGroup, helixGroup, crispriGroup, readoutGroup);

    const nucleus = new THREE.Mesh(
      new THREE.SphereGeometry(2.35, 72, 42),
      makeMaterial(THREE, colors.nucleus, {
        transparent: true,
        opacity: 0.36,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    nucleus.userData.baseOpacity = 0.36;
    nucleus.scale.set(1.16, 0.82, 0.76);
    nucleusGroup.add(nucleus);

    const nucleusWire = new THREE.Mesh(
      new THREE.SphereGeometry(2.38, 34, 20),
      new THREE.MeshBasicMaterial({ color: colors.nucleus, wireframe: true, transparent: true, opacity: 0.32 })
    );
    nucleusWire.scale.copy(nucleus.scale);
    nucleusWire.userData.baseOpacity = 0.32;
    nucleusGroup.add(nucleusWire);

    const territory = addChromosomeTerritory(THREE, territoryGroup, colors);
    const loops = addLoopDomain(THREE, loopGroup, colors);
    const fiber = addBeadsOnStringFiber(THREE, fiberGroup, colors);
    const nucleosome = addSingleNucleosomeDetail(THREE, nucleosomeGroup, colors);
    const helix = addDoubleHelixDetail(THREE, helixGroup, colors);
    const crispri = addCrispriComplex(THREE, crispriGroup, colors);
    const readout = addRnaReadout(THREE, readoutGroup, colors);

    addLabel(THREE, labels, "nucleus", new THREE.Vector3(-2.62, 1.46, 0.2), "nucleus");
    addLabel(THREE, labels, "chromosome territory", new THREE.Vector3(-1.85, 0.78, 0.95), "territory");
    addLabel(THREE, labels, "loop domains", new THREE.Vector3(-0.9, 0.98, 0.74), "loops");
    addLabel(THREE, labels, "beads-on-a-string", new THREE.Vector3(0.02, -0.82, 0.82), "fiber");
    addLabel(THREE, labels, "nucleosome", new THREE.Vector3(0.62, 0.24, 1.12), "nucleosome");
    addLabel(THREE, labels, "DNA double helix", new THREE.Vector3(1.1, -0.98, 1.1), "helix");

    const focuses = {
      nucleus: {
        label: "Semi-transparent nucleus",
        text: "A transparent eukaryotic nucleus contains diffuse chromosome territories rather than condensed X-shaped chromosomes.",
        target: new THREE.Vector3(0, 0, 0),
        distance: 7.2,
      },
      territory: {
        label: "Chromosome territory",
        text: "One territory is shown as a soft volume filled with flexible chromatin paths occupying a nuclear subregion.",
        target: new THREE.Vector3(-0.42, 0.08, 0.12),
        distance: 4.35,
      },
      loops: {
        label: "Folded chromatin loops",
        text: "Higher-order chromatin is represented as irregular dynamic loops, avoiding an over-regular solenoid fiber.",
        target: new THREE.Vector3(-0.12, 0.08, 0.28),
        distance: 2.75,
      },
      fiber: {
        label: "Open nucleosome fiber",
        text: "The raw loop path resolves in place into an open beads-on-a-string fiber with nucleosomes on the same chromatin segment.",
        target: new THREE.Vector3(-0.1, 0.03, 0.24),
        distance: 1.55,
      },
      nucleosome: {
        label: "Single nucleosome",
        text: "The view zooms into one bead from the fiber, showing the same nucleosome with DNA wrapped around the histone octamer.",
        target: new THREE.Vector3(0.18, -0.04, 0.28),
        distance: 0.8,
      },
      helix: {
        label: "DNA double helix",
        text: "At the finest scale, the wrapped DNA at the nucleosome resolves into a double helix with visible base pairs.",
        target: new THREE.Vector3(0.27, -0.04, 0.31),
        distance: 0.25,
      },
      crispri: {
        label: "CRISPRi complex",
        text: "An sgRNA guides dCas9-KRAB onto a target DNA segment, where the repressor blocks transcription without cutting the DNA.",
        target: new THREE.Vector3(0.27, -0.04, 0.31),
        distance: 0.3,
      },
      readout: {
        label: "RNA readout",
        text: "After repression, fewer target mRNA transcripts leave the nucleus; single-cell sequencing captures transcript counts together with the guide identity.",
        target: new THREE.Vector3(0.28, 0.04, 0),
        distance: 4.2,
      },
    };

    const stageOrder = ["nucleus", "territory", "loops", "fiber", "nucleosome", "helix", "crispri", "readout"];
    const state = {
      target: focuses.nucleus.target.clone(),
      cameraTarget: focuses.nucleus.target.clone(),
      distance: focuses.nucleus.distance,
      cameraDistance: focuses.nucleus.distance,
      yaw: -0.42,
      pitch: 0.22,
      dragging: null,
      focus: "nucleus",
      lastWheelStep: 0,
      time: 0,
    };

    function resize() {
      const rect = stage.getBoundingClientRect();
      const width = Math.max(320, Math.floor(rect.width));
      const height = Math.max(420, Math.floor(rect.height));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      labels.visible = camera.aspect >= 0.78;
    }

    function updateStageVisibility() {
      const index = stageOrder.indexOf(state.focus);
      const opacityByStage = [
        [1, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 0, 0, 0, 0, 0, 0],
        [0, 0, 1, 0, 0, 0, 0, 0],
        [0, 0, 0, 1, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 0, 0, 0],
        [0, 0, 0, 0, 0, 1, 0, 0],
        [0, 0, 0, 0, 0, 1, 1, 0],
        [0, 0, 0, 0, 0, 0, 0, 1],
      ];
      const opacities = opacityByStage[index] || opacityByStage[0];
      setGroupOpacity(nucleusGroup, opacities[0]);
      setGroupOpacity(territoryGroup, opacities[1]);
      setGroupOpacity(loopGroup, opacities[2]);
      setGroupOpacity(fiberGroup, opacities[3]);
      setGroupOpacity(nucleosomeGroup, opacities[4]);
      setGroupOpacity(helixGroup, opacities[5]);
      setGroupOpacity(crispriGroup, opacities[6]);
      setGroupOpacity(readoutGroup, opacities[7]);
      labels.children.forEach((label) => {
        label.visible = camera.aspect >= 0.78 && index < 4 && label.userData.stage === state.focus;
      });
    }

    function updateCamera() {
      state.pitch = clamp(state.pitch, -1.05, 1.05);
      state.distance = clamp(state.distance, 0.08, 8.6);
      const displayDistance = state.cameraDistance * (camera.aspect < 0.75 ? 1.95 : 1);
      const cosPitch = Math.cos(state.pitch);
      camera.position.set(
        state.cameraTarget.x + Math.sin(state.yaw) * cosPitch * displayDistance,
        state.cameraTarget.y + Math.sin(state.pitch) * displayDistance,
        state.cameraTarget.z + Math.cos(state.yaw) * cosPitch * displayDistance
      );
      camera.lookAt(state.cameraTarget);
      if (status) status.textContent = `${Math.round((focuses.nucleus.distance / state.distance) * 100)}%`;
    }

    function setFocus(name) {
      const focus = focuses[name] || focuses.nucleus;
      state.focus = name in focuses ? name : "nucleus";
      state.target.copy(focus.target);
      state.distance = focus.distance;
      if (focusLabel) focusLabel.textContent = focus.label;
      if (focusText) focusText.textContent = focus.text;
      focusButtons.forEach((button) => {
        const pressed = button.dataset.focusTarget === state.focus;
        button.classList.toggle("is-active", pressed);
        button.setAttribute("aria-pressed", pressed ? "true" : "false");
      });
      updateStageVisibility();
    }

    function stepFocus(direction) {
      const index = stageOrder.indexOf(state.focus);
      const nextIndex = clamp(index + direction, 0, stageOrder.length - 1);
      setFocus(stageOrder[nextIndex]);
    }

    function render() {
      state.time += 0.012;
      state.cameraTarget.lerp(state.target, 0.055);
      state.cameraDistance += (state.distance - state.cameraDistance) * 0.055;

      territory.rotation.y = Math.sin(state.time * 0.45) * 0.05;
      loops.rotation.z = Math.sin(state.time * 0.7) * 0.035;
      loops.scale.y = 1 + Math.sin(state.time * 0.9) * 0.025;
      fiber.rotation.y = Math.sin(state.time * 0.6) * 0.08;
      nucleosome.rotation.y = Math.sin(state.time * 0.48) * 0.12;
      helix.rotation.x = Math.sin(state.time * 0.55) * 0.1;
      crispri.rotation.z = Math.sin(state.time * 0.8) * 0.05;
      readout.rotation.y = Math.sin(state.time * 0.28) * 0.04;

      labels.children.forEach((label) => {
        if (label.isSprite) label.quaternion.copy(camera.quaternion);
      });
      world.traverse((object) => {
        if (object.isSprite) object.quaternion.copy(camera.quaternion);
      });
      updateCamera();
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
        const now = performance.now();
        if (now - state.lastWheelStep < 260) return;
        state.lastWheelStep = now;
        stepFocus(event.deltaY < 0 ? 1 : -1);
      },
      { passive: false }
    );

    focusButtons.forEach((button) => {
      button.addEventListener("click", () => setFocus(button.dataset.focusTarget));
    });

    if (zoomIn) zoomIn.addEventListener("click", () => stepFocus(1));
    if (zoomOut) zoomOut.addEventListener("click", () => stepFocus(-1));
    if (reset) reset.addEventListener("click", () => setFocus("nucleus"));

    window.addEventListener("resize", resize);
    resize();
    setFocus("nucleus");
    updateCamera();
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
        if (focusText) focusText.textContent = "The 3D chromatin viewer could not load. Please refresh the page.";
      });
    }
  });
})();
