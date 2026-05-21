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

    function addHistoneH1(position, rotation) {
      const h1 = new THREE.Group();
      const material = makeMaterial(THREE, colors.histoneH1);
      const globular = new THREE.Mesh(new THREE.SphereGeometry(0.055, 18, 12), material);
      globular.scale.set(1.1, 0.72, 0.62);
      h1.add(globular);

      const tailA = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.18, 10), material);
      tailA.position.set(-0.055, -0.02, 0);
      tailA.rotation.z = 0.9;
      h1.add(tailA);

      const tailB = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.16, 10), material);
      tailB.position.set(0.06, 0.01, 0.005);
      tailB.rotation.z = -0.75;
      h1.add(tailB);

      h1.position.copy(position);
      h1.rotation.set(rotation[0], rotation[1], rotation[2]);
      detail.add(h1);
      return h1;
    }

    function addContinuousDoubleHelix() {
      const centerline = [];
      const strandA = [];
      const strandB = [];
      const basePairs = [];

      function addHydrogenBonds(first, second, index) {
        const axis = new THREE.Vector3().subVectors(second, first);
        const length = axis.length();
        if (length === 0) return;

        const direction = axis.clone().normalize();
        const middle = new THREE.Vector3().addVectors(first, second).multiplyScalar(0.5);
        const bondCount = index % 2 === 0 ? 2 : 3;
        const spacing = 0.014;
        const normal = new THREE.Vector3(direction.z, 0, -direction.x).normalize();
        if (normal.lengthSq() === 0) normal.set(1, 0, 0);

        for (let bondIndex = 0; bondIndex < bondCount; bondIndex++) {
          const shift = (bondIndex - (bondCount - 1) / 2) * spacing;
          const bondMiddle = middle.clone().add(normal.clone().multiplyScalar(shift));
          const halfLength = length * 0.46;
          const start = bondMiddle.clone().add(direction.clone().multiplyScalar(-halfLength));
          const end = bondMiddle.clone().add(direction.clone().multiplyScalar(halfLength));
          addCylinderBetween(THREE, detail, start, end, 0.0068, colors.hydrogenBond, {
            transparent: true,
            opacity: 1,
            emissive: colors.hydrogenBond,
            emissiveIntensity: 0.45,
          });
        }
      }

      function pushPoint(point) {
        const last = centerline[centerline.length - 1];
        if (last && last.distanceTo(point) < 0.001) return;
        centerline.push(point);
      }

      function addLine(start, end, steps) {
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          pushPoint(new THREE.Vector3().lerpVectors(start, end, t));
        }
      }

      function addWrap(center, startTheta, turns, steps) {
        const width = 0.34;
        const radius = 0.16;
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const theta = startTheta + t * Math.PI * 2 * turns;
          pushPoint(
            new THREE.Vector3(
              center.x - width / 2 + t * width,
              center.y + Math.cos(theta) * radius,
              center.z + Math.sin(theta) * radius
            )
          );
        }
      }

      const firstCenter = new THREE.Vector3(-0.34, 0, 0);
      const secondCenter = new THREE.Vector3(0.72, 0.02, 0.02);
      const firstWrapStart = new THREE.Vector3(-0.51, 0.02, -0.16);
      const firstWrapEnd = new THREE.Vector3(-0.17, -0.04, 0.15);
      const secondWrapStart = new THREE.Vector3(0.55, 0.04, -0.14);
      const secondWrapEnd = new THREE.Vector3(0.89, -0.02, 0.17);

      addLine(new THREE.Vector3(-1.32, 0.02, -0.03), firstWrapStart, 32);
      addWrap(firstCenter, -Math.PI / 2 + 0.12, 1.52, 96);
      addLine(firstWrapEnd, secondWrapStart, 42);
      addWrap(secondCenter, -Math.PI / 2 + 0.12, 1.52, 96);
      addLine(secondWrapEnd, new THREE.Vector3(1.48, 0.02, 0.04), 26);

      centerline.forEach((point, index) => {
        const phase = index * 0.74;
        const offset = new THREE.Vector3(0, Math.cos(phase) * 0.038, Math.sin(phase) * 0.038);
        const first = point.clone().add(offset);
        const second = point.clone().sub(offset);
        strandA.push([first.x, first.y, first.z]);
        strandB.push([second.x, second.y, second.z]);
        if (index % 4 === 0) basePairs.push([first, second, index]);
      });

      addTube(THREE, detail, strandA, colors.dnaBlue, 0.012);
      addTube(THREE, detail, strandB, colors.dnaWhite, 0.01);
      basePairs.forEach(([first, second, index]) => addHydrogenBonds(first, second, index));
    }

    addHistoneOctamer(THREE, detail, new THREE.Vector3(-0.34, 0, 0), 0.62, colors);
    addHistoneOctamer(THREE, detail, new THREE.Vector3(0.72, 0.02, 0.02), 0.62, colors);
    addHistoneH1(new THREE.Vector3(-0.34, -0.16, 0.08), [0.4, -0.2, 0.2]);
    addHistoneH1(new THREE.Vector3(0.72, -0.14, 0.1), [0.35, 0.25, -0.15]);
    addContinuousDoubleHelix();

    detail.position.set(0.04, 0.14, 0.28);
    detail.scale.setScalar(0.62);
    group.add(detail);
    return detail;
  }

  function addCrispriComplex(THREE, group, colors) {
    const crispri = new THREE.Group();

    function addAlphaHelix(parent, center, radius, length, color, rotation, tubeRadius) {
      const points = [];
      for (let i = 0; i <= 42; i++) {
        const t = i / 42;
        const phase = t * Math.PI * 7;
        points.push([
          -length / 2 + t * length,
          Math.cos(phase) * radius,
          Math.sin(phase) * radius,
        ]);
      }
      const helix = new THREE.Group();
      addTube(THREE, helix, points, color, tubeRadius || 0.012);
      helix.position.copy(center);
      helix.rotation.set(rotation[0], rotation[1], rotation[2]);
      parent.add(helix);
      return helix;
    }

    function addNucleotideBeads(parent, points, color, radius, every) {
      points.forEach((point, index) => {
        if (index % (every || 2) !== 0) return;
        const bead = new THREE.Mesh(new THREE.SphereGeometry(radius, 14, 10), makeMaterial(THREE, color));
        bead.position.set(point[0], point[1], point[2]);
        parent.add(bead);
      });
    }

    function addProteinBead(parent, position, radius, color, scale) {
      const bead = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 18, 12),
        makeMaterial(THREE, color, { transparent: true, opacity: 0.88 })
      );
      bead.position.copy(position);
      bead.scale.set(scale[0], scale[1], scale[2]);
      bead.userData.baseOpacity = 0.88;
      parent.add(bead);
      return bead;
    }

    function addMoleculeLabel(text, position, scale) {
      const label = addTextSprite(THREE, text, { width: 420, height: 104, fontSize: 34, scale: [scale || 0.58, (scale || 0.58) * 0.24, 1] });
      label.position.copy(position);
      crispri.add(label);
      return label;
    }

    const locus = new THREE.Group();
    crispri.add(locus);

    const nucleosomeCenters = [
      [-1.38, -0.18, -0.16],
      [-0.98, 0.2, 0.18],
      [-0.54, -0.22, 0.1],
      [0.68, 0.22, -0.14],
      [1.08, -0.18, 0.16],
      [1.42, 0.12, -0.08],
    ];
    nucleosomeCenters.forEach(([x, y, z], index) => {
      const compactShift = index > 2 ? -0.18 : 0.06;
      const nucleosome = addNucleosome(
        THREE,
        locus,
        new THREE.Vector3(x + compactShift, y * 0.72, z),
        new THREE.Euler(0.18, index * 0.55, -0.18),
        index > 2 ? 0.19 : 0.15,
        colors
      );
      nucleosome.userData.compactTarget = index > 2 ? 1 : 0;

      const tailStart = new THREE.Vector3(x + compactShift + 0.03, y * 0.72 + 0.08, z + 0.04);
      const tailEnd = new THREE.Vector3(x + compactShift + 0.2, y * 0.72 + 0.24, z + 0.02);
      addCylinderBetween(THREE, locus, tailStart, tailEnd, 0.006, colors.histoneD, { transparent: true, opacity: 0.84 }).userData.baseOpacity = 0.84;

      const methyl = new THREE.Mesh(new THREE.SphereGeometry(0.026, 14, 10), makeMaterial(THREE, colors.h3k9me3));
      methyl.position.copy(tailEnd);
      methyl.userData.repressor = true;
      locus.add(methyl);

      if (index < 3) {
        const acetyl = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 8), makeMaterial(THREE, colors.acetyl, { transparent: true, opacity: 0.32 }));
        acetyl.position.set(tailEnd.x + 0.05, tailEnd.y - 0.02, tailEnd.z);
        acetyl.userData.baseOpacity = 0.32;
        locus.add(acetyl);
      }
    });

    const dnaA = [];
    const dnaB = [];
    const bpCount = 34;
    for (let i = 0; i <= bpCount; i++) {
      const t = i / bpCount;
      const x = -1.0 + t * 2.0;
      const phase = i * 0.72;
      const targetWindow = i >= 7 && i <= 26;
      const pamWindow = i >= 27 && i <= 29;
      const openOffset = targetWindow ? Math.sin(((i - 7) / 19) * Math.PI) * 0.07 : 0;
      const first = new THREE.Vector3(x, Math.cos(phase) * 0.07 - 0.02 - openOffset, Math.sin(phase) * 0.07);
      const second = new THREE.Vector3(x, Math.cos(phase + Math.PI) * 0.07 - 0.02 + openOffset, Math.sin(phase + Math.PI) * 0.07);
      dnaA.push([first.x, first.y, first.z]);
      dnaB.push([second.x, second.y, second.z]);
      if (i % 2 === 0) {
        const baseColor = pamWindow ? colors.pam : targetWindow ? colors.target : "#bdc9d7";
        addCylinderBetween(
          THREE,
          crispri,
          first,
          second,
          targetWindow ? 0.0055 : 0.004,
          baseColor,
          { transparent: true, opacity: pamWindow || targetWindow ? 0.92 : 0.62 }
        ).userData.baseOpacity = pamWindow || targetWindow ? 0.92 : 0.62;
      }
    }
    addTube(THREE, crispri, dnaA, colors.dnaBlue, 0.016);
    addTube(THREE, crispri, dnaB, colors.dnaWhite, 0.013);
    addNucleotideBeads(crispri, dnaA, colors.dnaBlue, 0.018, 3);
    addNucleotideBeads(crispri, dnaB, colors.dnaWhite, 0.015, 3);

    const guide = [];
    for (let i = 7; i <= 26; i++) {
      const t = (i - 7) / 19;
      const x = -1.0 + (i / bpCount) * 2.0;
      guide.push([
        x,
        0.02 + Math.sin(t * Math.PI) * 0.045,
        -0.12 + Math.cos(t * Math.PI * 2) * 0.012,
      ]);
    }
    addTube(THREE, crispri, guide, colors.guide, 0.015);
    addNucleotideBeads(crispri, guide, colors.guide, 0.018, 2);
    guide.forEach((point, index) => {
      if (index % 2 !== 0) return;
      const x = point[0];
      addCylinderBetween(
        THREE,
        crispri,
        new THREE.Vector3(x, point[1] - 0.008, point[2]),
        new THREE.Vector3(x, -0.005, -0.035),
        0.0035,
        colors.guide,
        { transparent: true, opacity: 0.58 }
      ).userData.baseOpacity = 0.58;
    });

    const scaffold = [
      [-0.4, 0.08, -0.12],
      [-0.48, 0.24, -0.18],
      [-0.33, 0.34, -0.16],
      [-0.2, 0.22, -0.12],
      [-0.32, 0.1, -0.1],
    ];
    addTube(THREE, crispri, scaffold, colors.guide, 0.012);
    addNucleotideBeads(crispri, scaffold, colors.guide, 0.016, 1);

    const cas9 = new THREE.Group();
    cas9.name = "dCas9 clamp";
    crispri.add(cas9);

    const recBeads = [
      [-0.52, 0.22, -0.04, 0.09, [1.25, 0.72, 0.7]],
      [-0.34, 0.36, 0.02, 0.085, [1.1, 0.78, 0.72]],
      [-0.12, 0.32, -0.03, 0.08, [1.0, 0.68, 0.7]],
      [0.1, 0.24, 0.02, 0.075, [1.0, 0.7, 0.7]],
    ];
    recBeads.forEach(([x, y, z, r, scale]) => addProteinBead(cas9, new THREE.Vector3(x, y, z), r, colors.cas9Rec, scale));

    const nucBeads = [
      [-0.22, -0.22, 0.06, 0.08, [1.1, 0.64, 0.72]],
      [0.02, -0.28, 0.02, 0.09, [1.2, 0.62, 0.7]],
      [0.28, -0.18, -0.02, 0.085, [1.1, 0.68, 0.7]],
      [0.5, 0.0, 0.03, 0.07, [0.95, 0.62, 0.66]],
    ];
    nucBeads.forEach(([x, y, z, r, scale]) => addProteinBead(cas9, new THREE.Vector3(x, y, z), r, colors.cas9Nuc, scale));

    addTube(THREE, cas9, [[-0.5, 0.18, -0.05], [-0.22, 0.22, -0.02], [0.08, 0.17, 0.01], [0.42, 0.02, 0.02]], colors.proteinDetail, 0.014);
    addTube(THREE, cas9, [[-0.28, -0.16, 0.05], [0.02, -0.2, 0.02], [0.28, -0.11, -0.02], [0.48, 0.02, 0.02]], colors.proteinDetail, 0.014);
    addAlphaHelix(cas9, new THREE.Vector3(-0.24, 0.17, 0.13), 0.018, 0.28, colors.proteinDetail, [0.2, 0.45, 0.25], 0.008);
    addAlphaHelix(cas9, new THREE.Vector3(0.18, -0.08, 0.13), 0.016, 0.24, colors.proteinDetail, [-0.2, 0.25, -0.35], 0.008);

    const contactPoints = [
      [-0.42, 0.08, -0.05],
      [-0.2, 0.07, -0.04],
      [0.0, 0.065, -0.035],
      [0.22, 0.055, -0.02],
      [0.46, 0.04, -0.01],
    ];
    contactPoints.forEach(([x, y, z]) => {
      addCylinderBetween(
        THREE,
        crispri,
        new THREE.Vector3(x, y + 0.045, z),
        new THREE.Vector3(x, y, z),
        0.0035,
        colors.bridge,
        { transparent: true, opacity: 0.72 }
      ).userData.baseOpacity = 0.72;
    });

    const krabTether = [
      [0.12, 0.32, 0.04],
      [0.24, 0.5, 0.08],
      [0.16, 0.68, 0.03],
      [0.0, 0.76, 0.08],
    ];
    addTube(THREE, crispri, krabTether, colors.krab, 0.012);

    const krab = new THREE.Group();
    krab.name = "KRAB repression domain";
    krab.position.set(-0.08, 0.82, 0.08);
    crispri.add(krab);
    addProteinBead(krab, new THREE.Vector3(0, 0, 0), 0.09, colors.krab, [1.2, 0.62, 0.62]);
    addAlphaHelix(krab, new THREE.Vector3(-0.02, 0.02, 0.08), 0.014, 0.18, colors.krabLight, [0.2, 0.15, 0.72], 0.008);
    addAlphaHelix(krab, new THREE.Vector3(0.04, -0.02, -0.06), 0.012, 0.16, colors.krabLight, [-0.18, -0.25, -0.55], 0.007);

    const repressors = [
      ["KAP1", colors.kap1, [-0.36, 1.0, 0.05], 0.075],
      ["SETDB1", colors.setdb1, [-0.1, 1.12, 0.18], 0.066],
      ["HP1", colors.hp1, [0.18, 1.02, -0.02], 0.058],
      ["HDAC", colors.hdac, [0.42, 0.82, 0.12], 0.055],
    ];
    repressors.forEach(([label, color, position, radius], index) => {
      const repressor = addProteinBead(crispri, new THREE.Vector3(position[0], position[1], position[2]), radius, color, [1.1, 0.82, 0.82]);
      repressor.userData.repressor = true;
      addMoleculeLabel(label, new THREE.Vector3(position[0] - 0.11, position[1] + 0.11, position[2]), 0.38);
      addCylinderBetween(
        THREE,
        crispri,
        new THREE.Vector3(position[0], position[1] - 0.06, position[2]),
        index === 0 ? new THREE.Vector3(-0.08, 0.86, 0.08) : new THREE.Vector3(-0.36 + (index - 1) * 0.26, 0.92, 0.08),
        0.004,
        color,
        { transparent: true, opacity: 0.62 }
      ).userData.baseOpacity = 0.62;
    });

    const pamMarker = new THREE.Mesh(
      new THREE.TorusGeometry(0.08, 0.006, 10, 32),
      makeMaterial(THREE, colors.pam, { transparent: true, opacity: 0.92 })
    );
    pamMarker.position.set(0.68, -0.02, 0);
    pamMarker.rotation.x = Math.PI / 2;
    pamMarker.userData.baseOpacity = 0.92;
    crispri.add(pamMarker);

    const targetMarker = new THREE.Mesh(
      new THREE.TorusGeometry(0.52, 0.006, 12, 56),
      makeMaterial(THREE, colors.target, { transparent: true, opacity: 0.72 })
    );
    targetMarker.rotation.x = Math.PI / 2;
    targetMarker.scale.y = 0.2;
    targetMarker.position.set(0, -0.02, 0);
    targetMarker.userData.baseOpacity = 0.72;
    crispri.add(targetMarker);

    const blockedPol = addProteinBead(crispri, new THREE.Vector3(1.25, 0.34, -0.05), 0.09, colors.pol2, [1.35, 0.78, 0.72]);
    blockedPol.userData.baseOpacity = 0.34;
    const block = addTube(
      THREE,
      crispri,
      [
        [1.1, 0.48, -0.05],
        [1.22, 0.28, -0.05],
        [1.36, 0.48, -0.05],
      ],
      colors.target,
      0.012,
      { transparent: true, opacity: 0.84 }
    );
    block.userData.baseOpacity = 0.84;

    const noCutA = addTube(THREE, crispri, [[-0.07, -0.12, 0.18], [0.07, 0.02, 0.18]], colors.target, 0.008);
    const noCutB = addTube(THREE, crispri, [[0.07, -0.12, 0.18], [-0.07, 0.02, 0.18]], colors.target, 0.008);
    noCutA.userData.baseOpacity = 0.92;
    noCutB.userData.baseOpacity = 0.92;

    addMoleculeLabel("20 bp target", new THREE.Vector3(-0.36, -0.36, 0.02), 0.48);
    addMoleculeLabel("NGG PAM", new THREE.Vector3(0.56, -0.32, 0.05), 0.46);
    addMoleculeLabel("dCas9 clamp", new THREE.Vector3(-0.62, 0.52, 0.04), 0.46);
    addMoleculeLabel("DNA uncut", new THREE.Vector3(-0.18, 0.02, 0.34), 0.44);
    addMoleculeLabel("Pol II excluded", new THREE.Vector3(1.02, 0.58, -0.02), 0.44);

    crispri.position.set(0.27, 0.34, 0.31);
    crispri.rotation.set(0.1, -0.44, 0.12);
    crispri.scale.setScalar(0.24);
    crispri.userData.krab = krab;
    crispri.userData.cas9 = cas9;
    crispri.userData.repressors = repressors;
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
      histoneH1: "#e0a15a",
      hydrogenBond: "#f4d97a",
      nucleus: "#7fc7df",
      guide: "#f2b84b",
      cas9: "#2f6fbd",
      cas9Rec: "#d7e7f8",
      cas9Nuc: "#b9d4ef",
      cas9Hnh: "#55a7e3",
      cas9Ruvc: "#5f7ccf",
      cas9Pam: "#255c9f",
      proteinDetail: "#f7fbff",
      bridge: "#d9b95b",
      krab: "#9b4bc2",
      krabLight: "#f0c6ff",
      target: "#c85c5c",
      pam: "#38c6df",
      h3k9me3: "#2f7d54",
      acetyl: "#f0b24a",
      kap1: "#d4a72c",
      setdb1: "#cf5151",
      hp1: "#49a978",
      hdac: "#6f7fd3",
      pol2: "#9aa5b1",
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
    const crispriGroup = new THREE.Group();
    const readoutGroup = new THREE.Group();
    world.add(nucleusGroup, territoryGroup, loopGroup, fiberGroup, nucleosomeGroup, crispriGroup, readoutGroup);

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
    const crispri = addCrispriComplex(THREE, crispriGroup, colors);
    const readout = addRnaReadout(THREE, readoutGroup, colors);

    addLabel(THREE, labels, "nucleus", new THREE.Vector3(-2.62, 1.46, 0.2), "nucleus");
    addLabel(THREE, labels, "chromosome territory", new THREE.Vector3(-1.85, 0.78, 0.95), "territory");
    addLabel(THREE, labels, "loop domains", new THREE.Vector3(-0.9, 0.98, 0.74), "loops");
    addLabel(THREE, labels, "beads-on-a-string", new THREE.Vector3(0.02, -0.82, 0.82), "fiber");
    addLabel(THREE, labels, "nucleosome", new THREE.Vector3(0.62, 0.24, 1.12), "nucleosome");

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
        label: "Connected nucleosomes",
        text: "Two nucleosomes are shown on one continuous DNA molecule: double-helix DNA wraps around each histone octamer, with histone H1 at the DNA entry-exit region, and continues through linker DNA between them.",
        target: new THREE.Vector3(0.04, -0.18, 0.28),
        distance: 1.8,
      },
      crispri: {
        label: "CRISPRi complex",
        text: "dCas9-KRAB clamps onto an NGG-adjacent target without cutting DNA, forms an sgRNA-DNA R-loop, recruits KAP1, SETDB1, HP1, and HDACs, and compacts the promoter into a repressed state.",
        target: new THREE.Vector3(0.27, 0.26, 0.31),
        distance: 0.76,
      },
      readout: {
        label: "RNA readout",
        text: "After repression, fewer target mRNA transcripts leave the nucleus; single-cell sequencing captures transcript counts together with the guide identity.",
        target: new THREE.Vector3(0.28, 0.04, 0),
        distance: 4.2,
      },
    };

    const stageOrder = ["nucleus", "territory", "loops", "fiber", "nucleosome", "crispri", "readout"];
    const state = {
      target: focuses.nucleus.target.clone(),
      cameraTarget: focuses.nucleus.target.clone(),
      distance: focuses.nucleus.distance,
      cameraDistance: focuses.nucleus.distance,
      yaw: -0.42,
      pitch: 0.22,
      dragging: null,
      focus: "nucleus",
      previousFocus: "nucleus",
      transitionProgress: 1,
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

    function stageOpacityVector(name) {
      const opacityByStage = {
        nucleus: [1, 0, 0, 0, 0, 0, 0],
        territory: [0, 1, 0, 0, 0, 0, 0],
        loops: [0, 0, 1, 0, 0, 0, 0],
        fiber: [0, 0, 0, 1, 0, 0, 0],
        nucleosome: [0, 0, 0, 0, 1, 0, 0],
        crispri: [0, 0, 0, 0, 0, 1, 0],
        readout: [0, 0, 0, 0, 0, 0, 1],
      };
      return opacityByStage[name] || opacityByStage.nucleus;
    }

    function updateStageVisibility() {
      const index = stageOrder.indexOf(state.focus);
      const fromOpacities = stageOpacityVector(state.previousFocus);
      const toOpacities = stageOpacityVector(state.focus);
      const blend = state.transitionProgress;
      const opacities = toOpacities.map((value, i) => fromOpacities[i] + (value - fromOpacities[i]) * blend);
      setGroupOpacity(nucleusGroup, opacities[0]);
      setGroupOpacity(territoryGroup, opacities[1]);
      setGroupOpacity(loopGroup, opacities[2]);
      setGroupOpacity(fiberGroup, opacities[3]);
      setGroupOpacity(nucleosomeGroup, opacities[4]);
      setGroupOpacity(crispriGroup, opacities[5]);
      setGroupOpacity(readoutGroup, opacities[6]);
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
      const nextFocus = name in focuses ? name : "nucleus";
      if (nextFocus !== state.focus) {
        state.previousFocus = state.focus;
        state.transitionProgress = 0;
      }
      state.focus = nextFocus;
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
      state.transitionProgress = Math.min(1, state.transitionProgress + 0.022);

      territory.rotation.y = Math.sin(state.time * 0.45) * 0.05;
      loops.rotation.z = Math.sin(state.time * 0.7) * 0.035;
      loops.scale.y = 1 + Math.sin(state.time * 0.9) * 0.025;
      fiber.rotation.y = Math.sin(state.time * 0.6) * 0.08;
      nucleosome.rotation.y = Math.sin(state.time * 0.48) * 0.12;
      crispri.rotation.z = 0.12 + Math.sin(state.time * 0.35) * 0.012;
      readout.rotation.y = Math.sin(state.time * 0.28) * 0.04;

      labels.children.forEach((label) => {
        if (label.isSprite) label.quaternion.copy(camera.quaternion);
      });
      world.traverse((object) => {
        if (object.isSprite) object.quaternion.copy(camera.quaternion);
      });
      updateStageVisibility();
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
