var scene, renderer, viewSize = 4/5;
var controls, objects = [];

var wireframeOn = false, isPaused = false;

var backgroundColor = 0x000000;

var width = window.innerWidth, height = window.innerHeight;
var oldWidth = width, oldHeight = height;

/*==============================================================================
	Modulation
==============================================================================*/
class THREEJSObject extends THREE.Object3D {
    constructor() {
        super();
    }

    createBasicMaterial(texture, color = 0xffffff) {
        this.basicMaterial = new THREE.MeshBasicMaterial( {color: color, side: THREE.DoubleSide, map: texture, wireframe: wireframeOn} );
    }

    createPhongMaterial(texture, bumpMap, color = 0xffffff) {
        this.phongMaterial = new THREE.MeshPhongMaterial( {color: 0xffffff, side: THREE.DoubleSide, map: texture, bumpMap: bumpMap, wireframe: wireframeOn} );
    }

    createLambertMaterial(color = 0xffffff, texture, bumpMap) {
        this.lambertMaterial = new THREE.MeshLambertMaterial( {color: color, side: THREE.DoubleSide, map: texture, bumpMap: bumpMap, wireframe: wireframeOn} );
    }

    setBasicMaterial() {
        this.mesh.material = this.basicMaterial;
    }

    setPhongMaterial() {
        this.mesh.material = this.phongMaterial;
    }

    setLambertMaterial() {
        this.mesh.material = this.lambertMaterial;
    }

    getBasicMaterial() {
        return this.basicMaterial;
    }

    getPhongMaterial() {
        return this.phongMaterial;
    }

    getLambertMaterial() {
        return this.lambertMaterial;
    }

    changeWireframe() {
        this.basicMaterial.wireframe = wireframeOn;
        this.phongMaterial.wireframe = wireframeOn;
        //this.lambertMaterial.wireframe = wireframeOn;
    }
}

class Board extends THREEJSObject{
    constructor() {
        super();
        this.boardtexture = new textureLoader.load("resources/chess_texture.jpg");
        this.boardBumpMap = new textureLoader.load("resources/wood_bump_map.jpg");
        this.geometry = new THREE.PlaneGeometry(100 , 100, 10, 10);
        this.createBasicMaterial(this.boardtexture);
        this.createPhongMaterial(this.boardtexture, this.boardBumpMap);
        this.mesh = new THREE.Mesh(this.geometry, this.getPhongMaterial());
        this.mesh.rotateX( - Math.PI / 2);
        this.add(this.mesh);
        this.position.set(50, 0, 50);
        objects.push(this);
    }
}

/*==============================================================================
	Cameras
==============================================================================*/

var camera;

function createPerspectiveCamera() {
    'use strict';

    camera = new THREE.PerspectiveCamera(80,
        window.innerWidth / window.innerHeight, 1, 1000);

    camera.position.x = 50;
    camera.position.y = 50;
    camera.position.z = 50;
    camera.lookAt(0,0,0);
}

/*==============================================================================
	Lightning
==============================================================================*/

var directionalLight, pointLight;
var toggleDirectionalLights = false, togglePointLights = false;
var switchingDirectionalLights = false, switchingPointLights = false;

function createDirectionalLight() {
    directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 200, 200);
    directionalLight.target = board;
    scene.add(directionalLight);
    scene.add(directionalLight.target);
}

function createPointLight() {
	//TODO
}

/*==============================================================================
	Scene Creation
==============================================================================*/
var board, toggleMaterials = false, isBasicMaterial = 0, toggleWire = false; 
var textureLoader = new THREE.TextureLoader();

function createScene() {
    'use strict';

    scene = new THREE.Scene();
    scene.add(new THREE.AxesHelper(100));

    createBoard();
    createBall();
    createDice();
    createDirectionalLight();
    createPointLight();
}

// uses texture
function createBall() {
	//TODO
}

// uses texture + bump map
function createDice() {
	//TODO
}

// uses texture + bump map
function createBoard() {
    board = new Board();
    scene.add(board);
}

/*==============================================================================
	Event Listeners
==============================================================================*/

function onResize() {
    'use strict';
    
    var angle = oldWidth / oldHeight;
    var windowVector = new THREE.Vector3(0,0,0);

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.getSize(windowVector);
    width = windowVector.x, height = windowVector.y;

    if (window.innerHeight > 0 && window.innerWidth > 0) {
    
        if (width != oldWidth) {
            if (width > oldWidth) 
            	viewSize /= (1.01 ** angle);
            else 
            	viewSize *= (1.01 ** angle);
        }

        if (height != oldHeight) {
            if (height > oldHeight) 
            	viewSize /= (1.01 ** angle);
            else 
            	viewSize *= (1.01 ** angle);
        }

        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }

    oldWidth = width;
    oldHeight = height;
}

function onKeyDown(e) {
    'use strict';

    switch(e.keyCode) {
        case 66: //B - Ball's movement 
        	toggleBallMovement();
            break;
        case 68: //D - Directional light
            toggleDirectionalLights = true;
            break;
        case 76: //L - Lightning
            toggleMaterials = true;
            break;
        case 80: //P - Point light
        	togglePointLight();
            break;
        case 82: //R - Reset
        	reset()
            break;
        case 83: //S - Start/Stop
        	toggleAnimation();
            break;
        case 87: //W - Wireframe
            toggleWire = true;
            break;
        default:
            break;
    }
}

/*==============================================================================
	Core functions
==============================================================================*/

function reset() {
	
	if (!isPaused) { return }
	//TODO
}

function toggleAnimation() {
	isPaused = !isPaused
}

function toggleWireframe() {
    wireframeOn = !wireframeOn;
    for (var i = 0; i < objects.length; i++) {
        objects[i].changeWireframe();
    }
}

function toggleLightning() {
	for (var i = 0; i < objects.length; i++) {
        if (!isBasicMaterial) objects[i].setBasicMaterial();
        else objects[i].setPhongMaterial();
    }

    isBasicMaterial = isBasicMaterial == 0 ? 1 : 0;
}

function toggleDirectionalLight() {
    if (directionalLight.intensity == 1 && !switchingDirectionalLights) {
        switchingDirectionalLights = true;
        var lightTimeout = setInterval(function() {
            directionalLight.intensity -= 0.1;
            if (directionalLight.intensity <= 0) {
                clearInterval(lightTimeout);
                switchingDirectionalLights = false;
            }
        }, 50);
    }
    else if (!switchingDirectionalLights) {
        switchingDirectionalLights = true;
        var lightTimeout = setInterval(function() {
            directionalLight.intensity += 0.1;
            if (directionalLight.intensity >= 1) {
                clearInterval(lightTimeout);
                switchingDirectionalLights = false;
            }
        }, 50);
    }
}

function togglePointLight() {
	//TODO
}

function checkChanges() {
    if (toggleDirectionalLights) {
        toggleDirectionalLights = false;
        toggleDirectionalLight();
    }

    if (toggleMaterials) {
        toggleMaterials = false;
        toggleLightning();
    }

    if (toggleWire) {
        toggleWire = false;
        toggleWireframe();
    }
}

function animate(time) {
    'use strict';

    controls.update();
    checkChanges();
    render();
    requestAnimationFrame(animate);
}

function render() {
    'use strict';
    
    renderer.render(scene, camera);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.BasicShadowMap;
}

function init() {
    'use strict';

    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(width, height);
    renderer.setClearColor(new THREE.Color(backgroundColor))

    document.body.appendChild(renderer.domElement);

    createScene();
    createPerspectiveCamera();

    render();

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.update();

    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKeyDown);
}
