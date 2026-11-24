/**
 * SKY SANCTUARY - METAVERSE TRÊN ĐẢO BAY 3D
 * Xây dựng bằng Three.js
 */

// ==========================================
// 1. CẤU HÌNH & TRẠNG THÁI TOÀN CỤC
// ==========================================
const CONFIG = {
  playerHeight: 1.7,
  walkSpeed: 14.0,
  runSpeed: 24.0,
  jumpForce: 12.0,
  gravity: 30.0,
  friction: 8.0,
  respawnPoint: new THREE.Vector3(0, 3, 0)
};

const state = {
  isLocked: false,
  crystalsCollected: 0,
  totalCrystals: 4,
  audioEnabled: false,
  currentLocation: "Quảng Trường Thánh Điện",
  activeInteractable: null
};

// ==========================================
// 2. KHỞI TẠO THREE.JS SCENE, CAMERA, RENDERER
// ==========================================
const container = document.getElementById("canvas-container");
const scene = new THREE.Scene();

// Bầu trời pastel & sương mù huyền ảo
scene.background = new THREE.Color(0xa0d8ef);
scene.fog = new THREE.FogExp2(0xa0d8ef, 0.012);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, CONFIG.playerHeight + 1, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
container.appendChild(renderer.domElement);

// ==========================================
// 3. HỆ THỐNG ÁNH SÁNG (LIGHTING)
// ==========================================
// Ánh sáng môi trường hai màu (bầu trời xanh & mặt đất phản chiếu ấm)
const hemiLight = new THREE.HemisphereLight(0xfff5e6, 0x4d7938, 0.75);
hemiLight.position.set(0, 50, 0);
scene.add(hemiLight);

// Ánh sáng mặt trời tạo bóng đổ ấm áp
const dirLight = new THREE.DirectionalLight(0xfff8e7, 1.2);
dirLight.position.set(45, 70, 30);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 250;
const d = 50;
dirLight.shadow.camera.left = -d;
dirLight.shadow.camera.right = d;
dirLight.shadow.camera.top = d;
dirLight.shadow.camera.bottom = -d;
dirLight.shadow.bias = -0.0005;
scene.add(dirLight);

// Ánh sáng mặt trời visual
const sunGeometry = new THREE.SphereGeometry(6, 16, 16);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xfff9d2 });
const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
sunMesh.position.copy(dirLight.position).multiplyScalar(2);
scene.add(sunMesh);

// ==========================================
// 4. HỆ THỐNG ĐIỀU KHIỂN NHÂN VẬT & VẬT LÝ
// ==========================================
const controls = new THREE.PointerLockControls(camera, document.body);

const moveState = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  sprint: false,
  jump: false,
  canJump: false
};

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

// Các nền tảng đảo để kiểm tra va chạm mặt đất
const islandPlatforms = [];
// Danh sách các vật thể tương tác
const interactables = [];
// Danh sách các đám mây di chuyển
const clouds = [];
// Danh sách các đối tượng hoạt ảnh
const animatedObjects = [];

// ==========================================
// 5. TỔNG HỢP ÂM THANH BẰNG WEB AUDIO API
// ==========================================
let audioCtx = null;
let ambientOsc1 = null;
let ambientOsc2 = null;
let ambientGain = null;

function initAudio() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}

// Tiếng chuông nhặt tinh thể
function playCrystalSound() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = "sine";
  osc.frequency.setValueAtTime(587.33, now); // D5
  osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.15); // D6
  osc.frequency.exponentialRampToValueAtTime(1760.00, now + 0.35); // A6
  
  gain.gain.setValueAtTime(0.3, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.8);
}

// Tiếng dịch chuyển thời không (Teleport Warp)
function playTeleportSound() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(150, now);
  osc.frequency.exponentialRampToValueAtTime(880, now + 0.4);
  osc.frequency.exponentialRampToValueAtTime(220, now + 0.8);
  
  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.85);
}

// Tiếng đàn ngũ cung cho phiến đá âm nhạc
function playMusicNote(freq) {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, now);
  
  gain.gain.setValueAtTime(0.35, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 1.2);
}

// Tiếng bước chân nhẹ
let lastStepTime = 0;
function playFootstep() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  if (now - lastStepTime < 0.32) return;
  lastStepTime = now;
  
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = "triangle";
  osc.frequency.setValueAtTime(90, now);
  osc.frequency.exponentialRampToValueAtTime(30, now + 0.08);
  
  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.08);
}

// Nhạc nền phong cách Ambient
function toggleAmbientMusic() {
  initAudio();
  if (!state.audioEnabled) {
    ambientGain = audioCtx.createGain();
    ambientGain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    
    ambientOsc1 = audioCtx.createOscillator();
    ambientOsc1.type = "sine";
    ambientOsc1.frequency.setValueAtTime(220, audioCtx.currentTime); // A3
    
    ambientOsc2 = audioCtx.createOscillator();
    ambientOsc2.type = "triangle";
    ambientOsc2.frequency.setValueAtTime(329.63, audioCtx.currentTime); // E4
    
    ambientOsc1.connect(ambientGain);
    ambientOsc2.connect(ambientGain);
    ambientGain.connect(audioCtx.destination);
    
    ambientOsc1.start();
    ambientOsc2.start();
    state.audioEnabled = true;
    document.getElementById("audio-status-text").innerText = "Tắt Nhạc";
    showToast("🎵 Đã bật nhạc nền Ambient");
  } else {
    if (ambientGain) {
      ambientGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      setTimeout(() => {
        if (ambientOsc1) ambientOsc1.stop();
        if (ambientOsc2) ambientOsc2.stop();
      }, 500);
    }
    state.audioEnabled = false;
    document.getElementById("audio-status-text").innerText = "Bật Nhạc";
    showToast("🔇 Đã tắt nhạc nền");
  }
}

// ==========================================
// 6. KIẾN TẠO THẾ GIỚI ĐẢO BAY (WORLD BUILDER)
// ==========================================

// Vật liệu chuẩn (PBR phong cách hoạt họa Ghibli)
const materials = {
  grass: new THREE.MeshStandardMaterial({
    color: 0x5fa83b,
    roughness: 0.8,
    metalness: 0.05,
    flatShading: true
  }),
  path: new THREE.MeshStandardMaterial({
    color: 0xd9c5a0,
    roughness: 0.9,
    metalness: 0.0,
    flatShading: true
  }),
  rock: new THREE.MeshStandardMaterial({
    color: 0x5a626a,
    roughness: 0.85,
    metalness: 0.1,
    flatShading: true
  }),
  wood: new THREE.MeshStandardMaterial({
    color: 0x6e4327,
    roughness: 0.8,
    flatShading: true
  }),
  foliage: new THREE.MeshStandardMaterial({
    color: 0x388e3c,
    roughness: 0.7,
    flatShading: true
  }),
  flowerPink: new THREE.MeshStandardMaterial({ color: 0xff6b81, roughness: 0.6 }),
  flowerYellow: new THREE.MeshStandardMaterial({ color: 0xffd32a, roughness: 0.6 }),
  marble: new THREE.MeshStandardMaterial({
    color: 0xf1f2f6,
    roughness: 0.4,
    metalness: 0.1
  }),
  gold: new THREE.MeshStandardMaterial({
    color: 0xffd700,
    roughness: 0.3,
    metalness: 0.8
  }),
  crystal: new THREE.MeshStandardMaterial({
    color: 0x00f2fe,
    emissive: 0x00b4db,
    emissiveIntensity: 0.4,
    roughness: 0.2,
    metalness: 0.9,
    transparent: true,
    opacity: 0.88
  }),
  crystalPurple: new THREE.MeshStandardMaterial({
    color: 0xa855f7,
    emissive: 0x7c3aed,
    emissiveIntensity: 0.5,
    roughness: 0.2,
    metalness: 0.8,
    transparent: true,
    opacity: 0.9
  }),
  portalVortex: new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    wireframe: true,
    transparent: true,
    opacity: 0.75
  })
};

// Hàm tạo một khối Đảo Bay hình nón dốc ngược
function createFloatingIsland(x, y, z, radius, depth, islandName = "Đảo") {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  // Mặt đảo bên trên (Hình trụ cỏ xanh)
  const topGeo = new THREE.CylinderGeometry(radius, radius * 0.95, 2.5, 24);
  const topMesh = new THREE.Mesh(topGeo, materials.grass);
  topMesh.position.y = 1.25;
  topMesh.receiveShadow = true;
  group.add(topMesh);

  // Thân đá dốc ngược bên dưới đảo (Chóp nón đá)
  const rockGeo = new THREE.ConeGeometry(radius * 0.95, depth, 18);
  const rockMesh = new THREE.Mesh(rockGeo, materials.rock);
  rockMesh.position.y = -depth / 2;
  rockMesh.rotation.x = Math.PI; // Đảo ngược chóp nón
  rockMesh.castShadow = true;
  rockMesh.receiveShadow = true;
  group.add(rockMesh);

  scene.add(group);

  // Lưu thông tin platform để phát hiện va chạm đứng
  islandPlatforms.push({
    name: islandName,
    center: new THREE.Vector2(x, z),
    radius: radius + 0.3,
    topY: y + 2.5
  });

  return group;
}

// Hàm tạo Cây Cối cách điệu Low-poly
function createTree(x, y, z, scale = 1) {
  const tree = new THREE.Group();
  tree.position.set(x, y, z);
  tree.scale.set(scale, scale, scale);

  // Thân cây
  const trunkGeo = new THREE.CylinderGeometry(0.3, 0.45, 3, 6);
  const trunkMesh = new THREE.Mesh(trunkGeo, materials.wood);
  trunkMesh.position.y = 1.5;
  trunkMesh.castShadow = true;
  tree.add(trunkMesh);

  // Tán lá 3 tầng
  const fol1 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.6, 1), materials.foliage);
  fol1.position.y = 3.6;
  fol1.castShadow = true;
  tree.add(fol1);

  const fol2 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2, 1), materials.foliage);
  fol2.position.set(0.3, 4.8, -0.2);
  fol2.castShadow = true;
  tree.add(fol2);

  scene.add(tree);
  return tree;
}

// Cột đá cổ Hy Lạp / Đền thờ
function createPillar(x, y, z, height = 5) {
  const pillar = new THREE.Group();
  pillar.position.set(x, y, z);

  // Chân đế
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 1.6), materials.marble);
  base.position.y = 0.3;
  base.castShadow = true;
  pillar.add(base);

  // Thân cột
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, height, 12), materials.marble);
  col.position.y = height / 2 + 0.6;
  col.castShadow = true;
  pillar.add(col);

  // Đỉnh cột
  const cap = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 1.6), materials.marble);
  cap.position.y = height + 0.9;
  cap.castShadow = true;
  pillar.add(cap);

  scene.add(pillar);
  return pillar;
}

// Bậc đá lơ lửng bắc qua các đảo
function createSteppingStone(x, y, z, radius = 2) {
  const geo = new THREE.CylinderGeometry(radius, radius * 0.8, 1, 10);
  const mesh = new THREE.Mesh(geo, materials.path);
  mesh.position.set(x, y, z);
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  scene.add(mesh);

  islandPlatforms.push({
    name: "Bậc Đá Lơ Lửng",
    center: new THREE.Vector2(x, z),
    radius: radius + 0.3,
    topY: y + 0.5
  });

  return mesh;
}

// Tinh thể ánh sáng có thể thu thập
function createCollectibleCrystal(x, y, z, id) {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  const geo = new THREE.OctahedronGeometry(0.8, 0);
  const mesh = new THREE.Mesh(geo, materials.crystal);
  mesh.castShadow = true;
  group.add(mesh);

  // Ánh sáng phát ra từ tinh thể
  const light = new THREE.PointLight(0x00f2fe, 1.5, 8);
  group.add(light);

  scene.add(group);

  // Đưa vào danh sách tương tác
  const interactable = {
    id: `crystal_${id}`,
    type: "crystal",
    position: new THREE.Vector3(x, y, z),
    mesh: group,
    prompt: "Thu thập Tinh Thể Ánh Sáng",
    action: () => {
      collectCrystal(interactable);
    }
  };
  interactables.push(interactable);

  // Hoạt ảnh xoay & nhấp nhô
  animatedObjects.push({
    update: (time) => {
      if (group.visible) {
        mesh.rotation.y = time * 1.5;
        mesh.rotation.x = Math.sin(time * 2) * 0.2;
        group.position.y = y + Math.sin(time * 3 + id) * 0.3;
      }
    }
  });

  return group;
}

// Thu thập tinh thể
function collectCrystal(item) {
  item.mesh.visible = false;
  state.crystalsCollected++;
  playCrystalSound();

  // Cập nhật UI
  document.getElementById("crystal-count").innerText = state.crystalsCollected;
  const progress = (state.crystalsCollected / state.totalCrystals) * 100;
  document.getElementById("quest-progress-fill").style.width = `${progress}%`;

  showToast(`✨ Đã thu thập Mảnh Tinh Thể (${state.crystalsCollected}/${state.totalCrystals})`);

  // Xóa khỏi danh sách tương tác
  const index = interactables.indexOf(item);
  if (index > -1) interactables.splice(index, 1);

  // Hoàn thành nhiệm vụ
  if (state.crystalsCollected >= state.totalCrystals) {
    setTimeout(() => {
      showDialog(
        "🎉 Chúc Mừng Bạn!",
        "Bạn đã thu thập đủ 4 Mảnh Tinh Thể Năng Lượng! Nguồn sức mạnh cổ xưa của Đảo Bay Huyền Ảo đã hoàn toàn thức tỉnh. Bạn có thể tự do khám phá và chiêm ngưỡng toàn bộ cảnh sắc!",
        "🏆"
      );
    }, 600);
  }
}

// ------------------------------------------
// XÂY DỰNG CHI TIẾT CÁC KHU VỰC TRONG THẾ GIỚI
// ------------------------------------------

// 1. ĐẢO CHÍNH (MAIN SANCTUARY ISLAND)
createFloatingIsland(0, 0, 0, 24, 28, "Quảng Trường Thánh Điện");

// Đường đá hoa văn trung tâm
const pathGeo = new THREE.CircleGeometry(7, 16);
const pathMesh = new THREE.Mesh(pathGeo, materials.path);
pathMesh.rotation.x = -Math.PI / 2;
pathMesh.position.set(0, 2.51, 0);
pathMesh.receiveShadow = true;
scene.add(pathMesh);

// 4 Cột đá bảo vệ quảng trường trung tâm
createPillar(-8, 2.5, -8, 6);
createPillar(8, 2.5, -8, 6);
createPillar(-8, 2.5, 8, 6);
createPillar(8, 2.5, 8, 6);

// Bia Ký Cổ Xưa (Ancient Obelisk) ở trung tâm quảng trường
const obeliskGroup = new THREE.Group();
obeliskGroup.position.set(0, 2.5, -7);
const obeliskBase = new THREE.Mesh(new THREE.BoxGeometry(2, 0.8, 2), materials.marble);
obeliskBase.position.y = 0.4;
obeliskGroup.add(obeliskBase);

const obeliskShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.8, 4.5, 4), materials.marble);
obeliskShaft.position.y = 3;
obeliskShaft.rotation.y = Math.PI / 4;
obeliskGroup.add(obeliskShaft);

const runeRings = new THREE.Mesh(
  new THREE.TorusGeometry(0.85, 0.08, 8, 24),
  materials.gold
);
runeRings.position.y = 3;
runeRings.rotation.x = Math.PI / 2;
obeliskGroup.add(runeRings);
scene.add(obeliskGroup);

interactables.push({
  id: "ancient_obelisk",
  type: "lore",
  position: new THREE.Vector3(0, 2.5, -7),
  prompt: "Đọc Bia Ký Cổ Xưa",
  action: () => {
    showDialog(
      "Bia Ký Thần Vực Sky Sanctuary",
      "Chào mừng nhà lữ hành đã đặt chân lên Đảo Bay Huyền Ảo! Nơi đây từng là vùng đất thánh của các cổ nhân lơ lửng giữa biển mây. Hãy đi qua Cổng Thời Không để lên Tầng Thượng Giới, và bước lên các Phiến Đá Âm Nhạc để lắng nghe thanh âm của gió mây.",
      "📜"
    );
  }
});

// Cây cối xung quanh đảo chính
createTree(-14, 2.5, -5, 1.2);
createTree(-12, 2.5, 8, 1.0);
createTree(13, 2.5, -7, 1.1);
createTree(15, 2.5, 9, 0.9);
createTree(-6, 2.5, 14, 1.3);

// 2. BẬC ĐÁ BẮC SANG ĐẢO ĐẠI TINH THỂ
createSteppingStone(24, 1.5, 0, 2.2);
createSteppingStone(31, 2.5, 3, 2.0);
createSteppingStone(38, 3.5, 1, 2.2);

// 3. ĐẢO ĐẠI TINH THỂ (ASTRAL CRYSTAL ISLAND)
createFloatingIsland(48, 4, 2, 14, 18, "Đảo Đại Tinh Thể");

// Đại Tinh Thể khổng lồ phát sáng xoay tròn
const giantCrystalGroup = new THREE.Group();
giantCrystalGroup.position.set(48, 8.5, 2);
const giantCrystalGeo = new THREE.OctahedronGeometry(3.5, 0);
const giantCrystalMesh = new THREE.Mesh(giantCrystalGeo, materials.crystalPurple);
giantCrystalGroup.add(giantCrystalMesh);

const giantLight = new THREE.PointLight(0xa855f7, 2.5, 35);
giantCrystalGroup.add(giantLight);
scene.add(giantCrystalGroup);

animatedObjects.push({
  update: (time) => {
    giantCrystalMesh.rotation.y = time * 0.8;
    giantCrystalMesh.rotation.z = Math.sin(time) * 0.2;
    giantCrystalGroup.position.y = 8.5 + Math.sin(time * 2) * 0.5;
  }
});

// Cây hoa quanh Đại Tinh Thể
createTree(43, 6.5, -4, 0.8);
createTree(53, 6.5, 6, 0.9);

// Tinh thể #1 tại Đảo Đại Tinh Thể
createCollectibleCrystal(53, 7.5, -2, 1);

// 4. BẬC ĐÁ BẮC SANG ĐẢO CỔNG THỜI KHÔNG
createSteppingStone(-24, 1.0, -8, 2.2);
createSteppingStone(-32, 2.0, -14, 2.2);
createSteppingStone(-40, 3.0, -18, 2.2);

// 5. ĐẢO CỔNG THỜI KHÔNG (MYSTIC PORTAL ISLAND)
createFloatingIsland(-52, 4, -24, 13, 16, "Cổng Thời Không");

// Cổng vòm đá
const portalArch = new THREE.Group();
portalArch.position.set(-52, 6.5, -24);

const archPillar1 = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 5, 8), materials.marble);
archPillar1.position.set(-2.5, 2.5, 0);
portalArch.add(archPillar1);

const archPillar2 = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 5, 8), materials.marble);
archPillar2.position.set(2.5, 2.5, 0);
portalArch.add(archPillar2);

const archTop = new THREE.Mesh(new THREE.BoxGeometry(6.5, 1, 1.2), materials.marble);
archTop.position.set(0, 5.2, 0);
portalArch.add(archTop);

// Vòng xoáy năng lượng cổng dịch chuyển
const vortexGeo = new THREE.TorusGeometry(2, 0.2, 16, 32);
const vortexMesh = new THREE.Mesh(vortexGeo, materials.portalVortex);
vortexMesh.position.set(0, 2.8, 0);
portalArch.add(vortexMesh);

const portalLight = new THREE.PointLight(0x38bdf8, 2, 15);
portalLight.position.set(0, 2.8, 0);
portalArch.add(portalLight);

scene.add(portalArch);

animatedObjects.push({
  update: (time) => {
    vortexMesh.rotation.z = time * 3;
    vortexMesh.scale.setScalar(1 + Math.sin(time * 4) * 0.05);
  }
});

// Điểm tương tác / Bước vào cổng dịch chuyển
interactables.push({
  id: "teleport_portal",
  type: "portal",
  position: new THREE.Vector3(-52, 6.5, -24),
  prompt: "Bước vào Cổng Thời Không để lên Tầng Thượng Giới",
  action: () => {
    teleportPlayer(new THREE.Vector3(0, 38, -50), "Đài Quan Sát Thượng Giới");
  }
});

// Tinh thể #2 tại gần cổng dịch chuyển
createCollectibleCrystal(-54, 7.5, -29, 2);

// 6. TẦNG THƯỢNG GIỚI (HIGH SKY OBSERVATION SPIRE)
createFloatingIsland(0, 35, -50, 10, 14, "Đài Quan Sát Thượng Giới");

// Cột viền quanh đài quan sát
for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 3) {
  const px = Math.cos(angle) * 7.5;
  const pz = -50 + Math.sin(angle) * 7.5;
  createPillar(px, 37.5, pz, 3.5);
}

// Cổng dịch chuyển ngược về đảo chính
const returnPortalGroup = new THREE.Group();
returnPortalGroup.position.set(0, 37.5, -53);
const retRing = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.15, 12, 24), materials.portalVortex);
retRing.position.y = 1.8;
returnPortalGroup.add(retRing);
scene.add(returnPortalGroup);

interactables.push({
  id: "return_portal",
  type: "portal",
  position: new THREE.Vector3(0, 37.5, -53),
  prompt: "Dịch chuyển trở về Quảng Trường Thánh Điện",
  action: () => {
    teleportPlayer(new THREE.Vector3(0, 4, 0), "Quảng Trường Thánh Điện");
  }
});

// Tinh thể #3 trên đài quan sát Thượng Giới
createCollectibleCrystal(0, 39, -46, 3);

// 7. ĐẢO PHÍM ĐÁ ÂM NHẠC (RESONANCE MUSIC ISLAND)
createFloatingIsland(0, 2, 42, 16, 20, "Vườn Đá Âm Nhạc");

// Nối từ đảo chính sang Đảo Âm Nhạc
createSteppingStone(0, 1.5, 22, 2.2);
createSteppingStone(0, 1.8, 29, 2.2);

// 5 Phiến đá âm thanh ngũ cung (Do - Re - Mi - Sol - La)
const notes = [
  { note: "C4 (Đô)", freq: 261.63, color: 0xef4444 },
  { note: "D4 (Rê)", freq: 293.66, color: 0xf97316 },
  { note: "E4 (Mi)", freq: 329.63, color: 0xeab308 },
  { note: "G4 (Sol)", freq: 392.00, color: 0x22c55e },
  { note: "A4 (La)", freq: 440.00, color: 0x06b6d4 }
];

const slabMeshes = [];
notes.forEach((item, index) => {
  const slabAngle = (index - 2) * 0.35;
  const sx = Math.sin(slabAngle) * 9;
  const sz = 42 + Math.cos(slabAngle) * 8;
  const sy = 4.6;

  const slabGeo = new THREE.CylinderGeometry(1.4, 1.5, 0.4, 16);
  const slabMat = new THREE.MeshStandardMaterial({
    color: item.color,
    emissive: item.color,
    emissiveIntensity: 0.25,
    roughness: 0.3
  });
  const slabMesh = new THREE.Mesh(slabGeo, slabMat);
  slabMesh.position.set(sx, sy, sz);
  slabMesh.receiveShadow = true;
  scene.add(slabMesh);
  slabMeshes.push(slabMesh);

  // Thêm tương tác nhấn E hoặc dẫm lên
  interactables.push({
    id: `music_stone_${index}`,
    type: "music",
    position: new THREE.Vector3(sx, sy, sz),
    prompt: `Đánh phím đá âm nhạc: Nốt ${item.note}`,
    action: () => {
      initAudio();
      playMusicNote(item.freq);
      slabMat.emissiveIntensity = 1.0;
      setTimeout(() => {
        slabMat.emissiveIntensity = 0.25;
      }, 350);
      showToast(`🎵 Âm vang nốt ${item.note}`);
    }
  });
});

// Cây cối tại Đảo Âm Nhạc
createTree(-7, 4.5, 46, 1.1);
createTree(8, 4.5, 45, 1.0);

// Tinh thể #4 tại Đảo Âm Nhạc
createCollectibleCrystal(0, 5.8, 48, 4);

// 8. ĐÁM MÂY LƠ LỬNG BỔ TRỢ (PROCEDURAL CLOUDS)
function createCloud(x, y, z, scale = 1) {
  const cloudGroup = new THREE.Group();
  cloudGroup.position.set(x, y, z);

  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.9,
    flatShading: true,
    transparent: true,
    opacity: 0.88
  });

  const puffCount = 5 + Math.floor(Math.random() * 4);
  for (let i = 0; i < puffCount; i++) {
    const puff = new THREE.Mesh(
      new THREE.DodecahedronGeometry(2.5 + Math.random() * 1.5, 1),
      cloudMat
    );
    puff.position.set(
      (Math.random() - 0.5) * 6,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 4
    );
    cloudGroup.add(puff);
  }

  cloudGroup.scale.set(scale, scale, scale);
  scene.add(cloudGroup);
  clouds.push({
    group: cloudGroup,
    speed: 0.4 + Math.random() * 0.6,
    initialX: x
  });
}

// Sinh 18 đám mây trôi xung quanh các tầng mây
for (let i = 0; i < 18; i++) {
  const cx = (Math.random() - 0.5) * 260;
  const cy = -10 + Math.random() * 55;
  const cz = (Math.random() - 0.5) * 260;
  createCloud(cx, cy, cz, 1.2 + Math.random() * 1.5);
}

// ==========================================
// 7. XỬ LÝ SỰ KIỆN PHÍM BẤM & TƯƠNG TÁC UI
// ==========================================

const onKeyDown = (event) => {
  switch (event.code) {
    case "KeyW":
    case "ArrowUp":
      moveState.forward = true;
      break;
    case "KeyS":
    case "ArrowDown":
      moveState.backward = true;
      break;
    case "KeyA":
    case "ArrowLeft":
      moveState.left = true;
      break;
    case "KeyD":
    case "ArrowRight":
      moveState.right = true;
      break;
    case "ShiftLeft":
    case "ShiftRight":
      moveState.sprint = true;
      break;
    case "Space":
      if (moveState.canJump) {
        velocity.y = CONFIG.jumpForce;
        moveState.canJump = false;
      }
      break;
    case "KeyE":
      if (state.activeInteractable) {
        state.activeInteractable.action();
      }
      break;
  }
};

const onKeyUp = (event) => {
  switch (event.code) {
    case "KeyW":
    case "ArrowUp":
      moveState.forward = false;
      break;
    case "KeyS":
    case "ArrowDown":
      moveState.backward = false;
      break;
    case "KeyA":
    case "ArrowLeft":
      moveState.left = false;
      break;
    case "KeyD":
    case "ArrowRight":
      moveState.right = false;
      break;
    case "ShiftLeft":
    case "ShiftRight":
      moveState.sprint = false;
      break;
  }
};

document.addEventListener("keydown", onKeyDown);
document.addEventListener("keyup", onKeyUp);

// Khóa chuột và bắt đầu trải nghiệm
const blocker = document.getElementById("blocker");
const startBtn = document.getElementById("start-btn");

startBtn.addEventListener("click", () => {
  controls.lock();
  initAudio();
});

controls.addEventListener("lock", () => {
  blocker.classList.add("hidden");
  state.isLocked = true;
});

controls.addEventListener("unlock", () => {
  // Chỉ hiện lại màn hình nếu không đang mở dialog modal
  if (document.getElementById("dialog-modal").classList.contains("hidden")) {
    blocker.classList.remove("hidden");
  }
  state.isLocked = false;
});

// Nút âm thanh & trợ giúp
document.getElementById("audio-toggle-btn").addEventListener("click", toggleAmbientMusic);
document.getElementById("help-btn").addEventListener("click", () => {
  showDialog(
    "Hướng Dẫn Điều Khiển",
    "• W, A, S, D hoặc Phím mũi tên: Di chuyển<br>• Giữ phím Shift: Chạy nhanh<br>• Phím Space: Nhảy lên<br>• Di chuyển chuột: Xoay góc nhìn 360°<br>• Phím E: Tương tác với đồ vật gần tầm mắt<br>• Phím ESC: Tạm dừng và giải phóng chuột",
    "🎮"
  );
});

// Modal Dialog
function showDialog(title, bodyHtml, icon = "📜") {
  const modal = document.getElementById("dialog-modal");
  document.getElementById("modal-title").innerText = title;
  document.getElementById("modal-body").innerHTML = bodyHtml;
  document.getElementById("modal-icon").innerText = icon;
  modal.classList.remove("hidden");
  controls.unlock();
}

function closeDialog() {
  const modal = document.getElementById("dialog-modal");
  modal.classList.add("hidden");
  controls.lock();
}

document.getElementById("modal-close-btn").addEventListener("click", closeDialog);
document.getElementById("modal-ok-btn").addEventListener("click", closeDialog);

// Toast thông báo
let toastTimeout;
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.innerText = message;
  toast.classList.remove("hidden");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.add("hidden");
  }, 2600);
}

// Dịch chuyển người chơi (Teleport)
function teleportPlayer(targetVec3, locationTitle) {
  playTeleportSound();
  controls.getObject().position.copy(targetVec3);
  velocity.set(0, 0, 0);
  showToast(`🌀 Đã dịch chuyển đến: ${locationTitle}`);
  updateLocationBanner(locationTitle);
}

// Cập nhật banner địa danh
function updateLocationBanner(name) {
  const banner = document.getElementById("location-name");
  banner.innerText = name;
  state.currentLocation = name;
}

// ==========================================
// 8. TÍNH TOÁN VA CHẠM ĐỨNG & HỒI SINH (RESPAWN)
// ==========================================
function getSurfaceElevation(px, pz) {
  let highestElevation = -999;
  let currentPlatformName = null;

  for (const plat of islandPlatforms) {
    const distSq = (px - plat.center.x) ** 2 + (pz - plat.center.y) ** 2;
    if (distSq <= plat.radius ** 2) {
      if (plat.topY > highestElevation) {
        highestElevation = plat.topY;
        currentPlatformName = plat.name;
      }
    }
  }

  return { elevation: highestElevation, platformName: currentPlatformName };
}

// ==========================================
// 9. VÒNG LẶP RENDER CHÍNH (GAME LOOP)
// ==========================================
const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
const screenCenter = new THREE.Vector2(0, 0);

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.1);
  const time = clock.getElapsedTime();

  // Cập nhật các đối tượng có hoạt ảnh
  animatedObjects.forEach((obj) => obj.update(time));

  // Cập nhật mây bay trôi nhẹ
  clouds.forEach((cloud) => {
    cloud.group.position.x += cloud.speed * delta * 2;
    if (cloud.group.position.x > 140) {
      cloud.group.position.x = -140;
    }
  });

  if (controls.isLocked) {
    const playerPos = controls.getObject().position;

    // 1. Giảm chấn ma sát
    velocity.x -= velocity.x * CONFIG.friction * delta;
    velocity.z -= velocity.z * CONFIG.friction * delta;

    // 2. Trọng lực
    velocity.y -= CONFIG.gravity * delta;

    // 3. Tính hướng di chuyển
    direction.z = Number(moveState.forward) - Number(moveState.backward);
    direction.x = Number(moveState.right) - Number(moveState.left);
    direction.normalize();

    const currentSpeed = moveState.sprint ? CONFIG.runSpeed : CONFIG.walkSpeed;

    if (moveState.forward || moveState.backward) {
      velocity.z -= direction.z * currentSpeed * delta * 12;
    }
    if (moveState.left || moveState.right) {
      velocity.x -= direction.x * currentSpeed * delta * 12;
    }

    // Tiếng bước chân khi di chuyển trên mặt đất
    if ((moveState.forward || moveState.backward || moveState.left || moveState.right) && moveState.canJump) {
      playFootstep();
    }

    // 4. Áp dụng vận tốc di chuyển
    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);
    playerPos.y += velocity.y * delta;

    // 5. Kiểm tra mặt đất va chạm (Ground Collision)
    const { elevation, platformName } = getSurfaceElevation(playerPos.x, playerPos.z);
    const minHeight = elevation + CONFIG.playerHeight;

    if (playerPos.y <= minHeight) {
      velocity.y = 0;
      playerPos.y = minHeight;
      moveState.canJump = true;

      if (platformName && platformName !== state.currentLocation) {
        updateLocationBanner(platformName);
      }
    }

    // 6. Rơi khỏi đảo -> Hồi sinh tại Quảng Trường
    if (playerPos.y < -35) {
      teleportPlayer(CONFIG.respawnPoint.clone(), "Quảng Trường Thánh Điện");
      showToast("🕊️ Bạn vừa rơi khỏi mây và đã được đưa trở về an toàn!");
    }

    // 7. Tương tác Raycasting (Tâm ngắm nhìn vào vật thể)
    raycaster.setFromCamera(screenCenter, camera);
    let nearestItem = null;
    let minDist = 4.5; // Khoảng cách có thể bấm tương tác

    interactables.forEach((item) => {
      const dist = playerPos.distanceTo(item.position);
      if (dist < minDist) {
        nearestItem = item;
      }
    });

    const promptEl = document.getElementById("interaction-prompt");
    const crosshairEl = document.getElementById("crosshair");

    if (nearestItem) {
      state.activeInteractable = nearestItem;
      document.getElementById("interaction-text").innerText = nearestItem.prompt;
      promptEl.classList.add("show");
      crosshairEl.classList.add("active");
    } else {
      state.activeInteractable = null;
      promptEl.classList.remove("show");
      crosshairEl.classList.remove("active");
    }
  }

  renderer.render(scene, camera);
}

// Khởi chạy vòng lặp
animate();

// Cập nhật khi thay đổi kích thước cửa sổ
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
