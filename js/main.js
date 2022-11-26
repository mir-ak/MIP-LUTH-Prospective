window.addEventListener("load", (event) => main());
window.addEventListener("resize", (event) => resize());
let camera, scene, renderer, controls;
let raycaster, raycasterMouse, lastIntersect;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;
let prevTime = performance.now();
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let vertex = new THREE.Vector3();
let color = new THREE.Color();
let types = ["Cube", "Hache"];
let type = "Cube";
let select = 0;
let CubeColor;
let SlectedColor = false;
let stopColor, ToolColor, crosshair;

const resize = () => {
  console.log("resize", window.innerWidth, window.innerHeight);
};
const main = () => {
  let tab = [];
  function readFile(file) {
    Papa.parse(file, {
      download: true,
      step: function (row) {
        tab.push([row.data[0], parseInt(row.data[1])]);
      },
      complete: function () {
        console.log("All done!");
      },
    });
  }

  readFile("../data/data.csv");

  camera = new THREE.PerspectiveCamera(
    90,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  scene = new THREE.Scene();
  scene.background = new THREE.Color("#87CEFA");
  scene.fog = new THREE.Fog(0xffffff, 0, 750);
  const ambientLight = new THREE.AmbientLight(" ", 0.7);
  scene.add(ambientLight);
  let Texture = new THREE.TextureLoader().load("../image/tx_floor.png");
  Texture.wrapS = Texture.wrapT = THREE.RepeatWrapping;
  Texture.repeat.set(25, 25);
  Texture.anisotropy = 16;
  let groundMaterial = new THREE.MeshLambertMaterial({ map: Texture });
  let mesh = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(4000, 4000),
    groundMaterial
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  mesh.typeObject = "floor";
  scene.add(mesh);
  controls = new THREE.PointerLockControls(camera);
  let blocker = document.getElementById("blocker");
  stopColor = document.getElementById("stopColor");
  ToolColor = document.getElementById("ToolColor");
  crosshair = document.getElementById("crosshair");
  stopColor.style.display = "none";
  document.getElementById("ToolColor").style.visibility = "hidden";
  instructions.addEventListener(
    "click",
    function () {
      controls.lock();
    },
    false
  );
  document.addEventListener("click", function () {
    if (controls.isLocked) {
      mouseClick(tab);
    } else {
      if (SlectedColor) {
        document.getElementById("ToolColor").style.visibility = "";
        stopColor.style.display = "";
      }
    }
  });
  ToolColor.addEventListener("click", function () {
    SlectedColor = true;
    document.getElementById("ChosenColor").jscolor.show();
  });
  stopColor.addEventListener("click", function () {
    SlectedColor = false;
    controls.lock();
    document.getElementById("ToolColor").style.visibility = "hidden";
    stopColor.style.display = "none";
    crosshair.style.display = "";
  });
  document.addEventListener("wheel", (event) => {
    if (controls.isLocked) {
      const delta = Math.sign(event.deltaY);
      Selcted(delta);
    }
  });
  controls.addEventListener("lock", function () {
    instructions.style.display = "none";
    blocker.style.display = "none";
  });
  controls.addEventListener("unlock", function () {
    if (SlectedColor) {
      document.getElementById("ToolColor").style.visibility = "";
      stopColor.style.display = "";
    } else {
      blocker.style.display = "block";
      instructions.style.display = "";
    }
  });
  scene.add(controls.getObject());
  let onKeyDown = function (event) {
    switch (event.keyCode) {
      case 16: //shift
        if (controls.isLocked) changeColor();
        break;
      case 38: // up
      case 87: // w
        moveForward = true;
        break;
      case 37: // left
      case 65: // a
        moveLeft = true;
        break;
      case 40: // down
      case 83: // s
        moveBackward = true;
        break;
      case 39: // right
      case 68: // d
        moveRight = true;
        break;
      case 32: // space
        if (canJump === true) velocity.y += 350;
        canJump = false;
        break;
    }
  };
  let onKeyUp = function (event) {
    switch (event.keyCode) {
      case 38: // up
      case 87: // w
        moveForward = false;
        break;
      case 37: // left
      case 65: // a
        moveLeft = false;
        break;
      case 40: // down
      case 83: // s
        moveBackward = false;
        break;
      case 39: // right
      case 68: // d
        moveRight = false;
        break;
    }
  };
  document.addEventListener("keydown", onKeyDown, false);
  document.addEventListener("keyup", onKeyUp, false);
  raycaster = new THREE.Raycaster(
    new THREE.Vector3(),
    new THREE.Vector3(0, -1, 0),
    0,
    2.5
  );
  raycasterMouse = new THREE.Raycaster();
  controls.getObject().position.y = 10;
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  function changeColor() {
    if (!SlectedColor) {
      SlectedColor = true;
      controls.unlock();
      document.getElementById("ToolColor").style.visibility = "";
      stopColor.style.visibility = "";
      document.getElementById("ChosenColor").jscolor.show();
      crosshair.style.display = "none";
    }
  }
  function Selcted(cur) {
    document
      .getElementById("menu")
      .children[select].classList.remove("Selected");
    if (select + cur > 1) {
      select = 0;
    } else if (select + cur < 0) {
      select = 1;
    } else {
      select += cur;
    }
    document.getElementById("menu").children[select].classList.add("Selected");
    type = types[select];
  }

  function createCube(tab, x, y, z) {
    const loader = new THREE.FontLoader();
    loader.load("fonts/helvetiker_regular.typeface.json", function (font) {
      const message = tab[0][0];
      const shapes = font.generateShapes(message, tab[0][1]);
      const geometry = new THREE.ShapeGeometry(shapes);
      const material = new THREE.MeshBasicMaterial({
        color: CubeColor ? CubeColor : "#FFFFFF",
      });
      tab.shift();
      geometry.computeBoundingBox();

      geometry.translate(y, 2 + y, z);
      const text = new THREE.Mesh(geometry, material);
      text.typeObject = "block";
      text.materialType = type;
      text.position.x = x;
      text.position.y = y;
      text.position.z = z;
      scene.add(text);
    });
  }

  function deleteCube(cube) {
    scene.remove(cube.object);
    cube.object.material.dispose();
    cube.object.geometry.dispose();
  }
  function mouseClick(tab) {
    raycasterMouse.ray.origin.copy(
      camera.getWorldPosition(new THREE.Vector3())
    );
    let pos = camera.getWorldDirection(new THREE.Vector3());
    raycasterMouse.ray.direction.copy(pos);
    let intersec = raycasterMouse.intersectObjects(scene.children);
    if (intersec.length > 0 && intersec[0].object.typeObject == "block") {
      console.log(intersec);
      let elm = intersec[0];
      if (type === "Cube") {
        createCube(
          tab,
          elm.object.coord.x + elm.face.normal.x,
          elm.object.coord.y + elm.face.normal.y,
          elm.object.coord.z + elm.face.normal.z
        );
      } else {
        deleteCube(elm);
      }
    } else if (
      intersec.length > 0 &&
      intersec[0].object.typeObject == "floor" &&
      type != "Hache"
    ) {
      let posX = Math.round(intersec[0].point.x - tab[0][1]);
      let posz = Math.round(intersec[0].point.z);
      console.log(posX);
      createCube(tab, posX, 4, posz, true);
    }

    lastIntersect = intersec[0];
  }
  animate();
  function animate() {
    requestAnimationFrame(animate);
    let time = performance.now();
    let delta = (time - prevTime) / 1000;
    if (controls.isLocked === true) {
      raycaster.ray.origin.copy(controls.getObject().position);
      raycaster.ray.origin.y -= 5;
      let intersections = raycaster.intersectObjects(scene.children);
      let onObject = intersections.length > 0;
      velocity.x -= velocity.x * 10.0 * delta;
      velocity.z -= velocity.z * 10.0 * delta;
      if (controls.getObject().position.y > 7) {
        velocity.y -= 9.8 * 100.0 * delta;
      }
      direction.z = Number(moveForward) - Number(moveBackward);
      direction.x = Number(moveLeft) - Number(moveRight);
      direction.normalize();
      if (moveForward || moveBackward)
        velocity.z -= direction.z * 200.0 * delta;
      if (moveLeft || moveRight) velocity.x -= direction.x * 200.0 * delta;
      if (onObject === true) {
        velocity.y = Math.max(0, velocity.y);
        canJump = true;
      } else {
        if (controls.getObject().position.y == 7) {
          canJump = true;
        } else {
          canJump = false;
        }
      }
      let object = new THREE.Object3D();
      object.copy(controls.getObject());
      object.translateX(velocity.x * delta);
      object.position.y += velocity.y * delta * 0.2;
      object.translateZ(velocity.z * delta);
      let lastPos = new THREE.Vector3(
        controls.getObject().position.x,
        controls.getObject().position.y,
        controls.getObject().position.z
      );
      let newPos = new THREE.Vector3(
        object.position.x,
        controls.getObject().position.y,
        object.position.z
      );
      let tmp;
      if (controls.getObject().position.y < 7) {
        velocity.y = 0;
        controls.getObject().position.y = 7;
        canJump = true;
      } else {
        controls.getObject().position.x = newPos.x;
        controls.getObject().position.z = newPos.z;
        controls.getObject().position.y += velocity.y * delta * 0.2;
      }
    }
    prevTime = time;
    renderer.render(scene, camera);
  }
};
function updateColor(jscolor) {
  CubeColor = new THREE.Color("#" + jscolor);
}
