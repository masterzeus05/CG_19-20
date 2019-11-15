var scene, pauseHUD, renderer, viewSize = 4/5;
var controls, objects = [];

var isPaused = false;

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
        this.basicMaterial = new THREE.MeshBasicMaterial( {
        	color: color,
        	side: THREE.DoubleSide,
        	map: texture,
        	wireframe: false
        } );
    }

    createPhongMaterial(texture, bumpMap, color = 0xffffff) {
        this.phongMaterial = new THREE.MeshPhongMaterial( {
        	color: 0xffffff,
        	side: THREE.DoubleSide,
        	map: texture,
        	bumpMap: bumpMap,
        	wireframe: false
        } );
    }

    createLambertMaterial(color = 0xffffff, texture, bumpMap) {
        this.lambertMaterial = new THREE.MeshLambertMaterial( {
        	color: color,
        	side: THREE.DoubleSide,
        	map: texture,
        	bumpMap: bumpMap,
        	wireframe: false
        } );
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
        this.basicMaterial.wireframe = !this.basicMaterial.wireframe;
        this.phongMaterial.wireframe = !this.phongMaterial.wireframe;
        //this.lambertMaterial.wireframe = wireframeOn;
    }
}

class Board extends THREEJSObject {
    constructor() {
        super();
        this.texture = new textureLoader.load("resources/chess_texture.jpg");
        this.bumpMap = new textureLoader.load("resources/wood_bump_map.jpg");
        this.geometry = new THREE.PlaneGeometry(100 , 100, 10, 10);
        this.createBasicMaterial(this.texture);
        this.createPhongMaterial(this.texture, this.bumpMap);
        this.mesh = new THREE.Mesh(this.geometry, this.getPhongMaterial());
        this.mesh.rotateX( - Math.PI / 2);
        this.add(this.mesh);
        this.position.set(50, 0, 50);
        objects.push(this);
    }
}

class Dice extends THREEJSObject {
    constructor(rotationSpeed) {
        super();
        this.geometry = new THREE.CubeGeometry(10, 10, 10);
        this.texture = new textureLoader.load("resources/dice-bumpmap.jpg");
        this.bumpMap = this.texture;
        this.rotationSpeed = rotationSpeed
        this.rotationAxis = new THREE.Vector3(0, 1, 0)

        this.faces = []
		this.mapTextures()

        this.createBasicMaterial(this.texture);
        this.createPhongMaterial(this.texture, this.bumpMap);
        
        this.mesh = new THREE.Mesh(this.geometry, this.getPhongMaterial());
        this.mesh.rotateX( Math.PI / 4);
        this.mesh.rotateZ(Math.PI / 4);
        this.add(this.mesh);
        
        this.position.set(50, 8.6, 50);
        objects.push(this);
    }

    mapTextures() {
    	// Iterate over the texture to separate the dice's faces.
		for (var x = 0.0; x < 1; x += 0.5) {
			var bottom = 2/3
			for (var i = 0; i < 3; i++) {
				var face = [
					new THREE.Vector2(x, bottom),
					new THREE.Vector2(x, bottom + 1/3),
					new THREE.Vector2(x + 0.5, bottom + 1/3),
					new THREE.Vector2(x + 0.5, bottom)
				];

				this.faces.push(face)
				bottom -= 1/3;
			}
		}

		// Insert in order.
		this.geometry.faceVertexUvs[0] = []; 
		for (i in [3, 2, 4, 1, 5, 0]) {
			if (this.faces[i]) { var face = this.faces[i] }
			
			this.geometry.faceVertexUvs[0].push([face[0], face[1], face[3]])
			this.geometry.faceVertexUvs[0].push([face[1], face[2], face[3]])
		}
    }

    rotate() {
		dice.rotateOnAxis(this.rotationAxis, this.rotationSpeed);
	}
}

/*==============================================================================
	Cameras
==============================================================================*/

var camera, pauseCamera, currCamera;

function createOrthographicCamera() {
	var width = window.innerWidth;
	var height = window.innerHeight;

	pauseCamera = new THREE.OrthographicCamera(
		-width / 2, width / 2,
		height / 2, -height / 2,
		1, 10
	);
    pauseCamera.position.z = 10;
}

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
var directionalLightColor = 0xffffff, pointLightColor = 0xffffff;

function createDirectionalLight() {
    directionalLight = new THREE.DirectionalLight(directionalLightColor, 1);
    directionalLight.position.set(0, 200, 200);
    directionalLight.target = board;
    scene.add(directionalLight);
    scene.add(directionalLight.target);
}

function createPointLight() {
	pointLight = new THREE.PointLight( pointLightColor, 0, 100 );
    pointLight.position.set( 50, 30, 50 );
    scene.add(pointLight);
}

/*==============================================================================
	Scene Creation
==============================================================================*/

var board, dice, overlay;
var toggleMaterials = false, isBasicMaterial = 0, toggleWire = false; 
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

function createPauseHUD() {
    'use strict';

    pauseHUD = new THREE.Scene();
    
	var textureLoader = new THREE.TextureLoader();
	textureLoader.load("resources/paused.png", createPauseOverlay);
}

function createPauseOverlay(texture) {
	var material = new THREE.SpriteMaterial( { map: texture } );

	overlay = new THREE.Sprite(material);
	overlay.position.set(0, 0, 1);
	overlay.scale.set(
		material.map.image.width,
		material.map.image.height,
		1
	);

	pauseHUD.add(overlay);
}

// uses texture
function createBall() {
	//TODO
}

function createDice() {
	dice = new Dice(0.1);
	scene.add(dice);
}

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

    // Updates pause overlay
	pauseCamera.left = - width / 2;
	pauseCamera.right = width / 2;
	pauseCamera.top = height / 2;
	pauseCamera.bottom = - height / 2;
	pauseCamera.updateProjectionMatrix();

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
            togglePointLights = true;
            break;
        case 82: //R - Reset
        	reset()
            break;
        case 83: //S - Start/Stop
        	isPaused = !isPaused
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

function toggleWireframe() {
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
    if (directionalLight.intensity >= 1 && !switchingDirectionalLights) {
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
	if (pointLight.intensity >= 1 && !switchingPointLights) {
        switchingPointLights = true;
        var lightTimeout = setInterval(function() {
            pointLight.intensity -= 0.1;
            if (pointLight.intensity <= 0) {
                clearInterval(lightTimeout);
                switchingPointLights = false;
            }
        }, 50);
    }
    else if (!switchingPointLights) {
        switchingPointLights = true;
        var lightTimeout = setInterval(function() {
            pointLight.intensity += 0.1;
            if (pointLight.intensity >= 1) {
                clearInterval(lightTimeout);
                switchingPointLights = false;
            }
        }, 50);
    }
}

function checkChanges() {
    if (toggleDirectionalLights) {
        toggleDirectionalLights = false;
        toggleDirectionalLight();
    }

    if (togglePointLights) {
        togglePointLights = false;
        togglePointLight();
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

    if (!isPaused) { 
    	controls.update();
    	checkChanges();
    	dice.rotate()
    }

    render();
    requestAnimationFrame(animate);
}

function render() {
    'use strict';
    
    renderer.autoClear = false; // To allow render overlay

    renderer.clear();
    renderer.render(scene, currCamera);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.BasicShadowMap;

    if (isPaused) {
    	renderer.clearDepth();
    	renderer.render(pauseHUD, pauseCamera);
    }
}

function init() {
    'use strict';

    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(width, height);
    renderer.setClearColor(new THREE.Color(backgroundColor))

    document.body.appendChild(renderer.domElement);

    createOrthographicCamera();
    createPerspectiveCamera();

    createScene();
    createPauseHUD();
    
    currCamera = camera;
    render();

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.update();

    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKeyDown);
}
