/*
// main.js - Proj4
// Computação Gráfica, Grupo 22 2019-20
*/

/* PG
// TODOs 
// Fix pause overlay resize
// Edit dice texture
// Reset dice
// Review delta
*/

/*  DG
//  TODO:
//  Add texture
//  Rotate Ball
//  Ball's Acceleration and De--
//  Reset the ball
*/

/*==============================================================================
	Modulation
==============================================================================*/

var objects = [];
var ballInitPos = new THREE.Vector3(25,0,0);

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

    toggleWireframe() {
        this.basicMaterial.wireframe = !this.basicMaterial.wireframe;
        this.phongMaterial.wireframe = !this.phongMaterial.wireframe;
        //this.lambertMaterial.wireframe = !this.lambertMaterial.wireframe;
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
        this.position.set(0, 0, 0);
        objects.push(this);
    }
}

class Dice extends THREEJSObject {
    constructor() {
        super();
        this.geometry = new THREE.CubeGeometry(10, 10, 10);
        this.texture = new textureLoader.load("resources/dice-bumpmap.jpg");
        this.bumpMap = this.texture;
        this.rotationAxis = new THREE.Vector3(0, 1, 0)

        this.faces = []
		this.mapTextures()

        this.createBasicMaterial(this.texture);
        this.createPhongMaterial(this.texture, this.bumpMap);
        this.mesh = new THREE.Mesh(this.geometry, this.getPhongMaterial());

        // Note: expensive operations turned into const
        // Angle (radian) for second rotation given by:
        // THREE.Math.degToRad(Math.atan(1 / Math.sqrt(2)) * 180 / Math.PI)
        const rotZ = 0.6154797086703874;    
        this.mesh.rotateX(Math.PI / 4);
        this.rotateZ(rotZ)
        this.add(this.mesh);
        
        // Distance d between dice cornes given by:
        // 10 * Math.sqrt(3)
        const height = 17.32050807568877;
        this.position.set(0, height / 2, 0);
        objects.push(this);
    }

    mapTextures() {
    	// Iterate over the texture to separate the dice's faces.
		for (let x = 0.0; x < 1; x += 0.5) {
			for (let bottom = 2/3; bottom >= 0; bottom -= 1/3) {
				this.faces.push([
                    new THREE.Vector2(x, bottom),
                    new THREE.Vector2(x, bottom + 1/3),
                    new THREE.Vector2(x + 0.5, bottom + 1/3),
                    new THREE.Vector2(x + 0.5, bottom)
                ])
			}
		}

		// Insert in order.
		this.geometry.faceVertexUvs[0] = []; 
		for (let i in [3, 2, 4, 1, 5, 0]) {
			const face = this.faces[i];
            this.geometry.faceVertexUvs[0].push([face[0], face[1], face[3]]);
            this.geometry.faceVertexUvs[0].push([face[1], face[2], face[3]]);
		}
    }

    rotate(delta) {
        if (delta > 0) {
            this.rotateOnWorldAxis(this.rotationAxis, delta / 200)
        }
	}
}

class Ball extends THREEJSObject {
    constructor(position) {

        // Prepare mesh parameters
        super();
        var radius = 5;
        this.geometry = new THREE.SphereGeometry(radius, 8,8, 0);
        this.texture = new textureLoader.load("resources/dice-bumpmap.jpg");
        this.bumpMap = this.texture;

        // Create material and mesh
        this.createBasicMaterial(this.texture);
        this.createPhongMaterial(this.texture, this.bumpMap);
        this.mesh = new THREE.Mesh(this.geometry, this.getPhongMaterial());

        // Positionate object and add it
        this.add(this.mesh);
        this.position.set(position.x, position.y+radius, position.z);
        objects.push(this);

        // Flags and increments
        this.flags = {'isStarting': true, 'isStoping': false, 'isStoped': false}
        this.currInc = 0
    }

    rotate(delta){
        if (delta>0 && !this.isStoped) this.rotateY(delta / 200);
    }

    move(delta){
        // Get delta
        if (delta<=0 || !delta) return
        this.currInc += delta
        if (this.currInc >= 2*Math.PI) this.currInc = 0;

        // Normal movement
        var x = Math.cos(this.currInc)*40, z = -Math.sin(this.currInc)*40;
        this.position.set(x,0,z);
    }
}

/*==============================================================================
	Cameras
==============================================================================*/

var camera, pauseCamera;

function createCameras() {
    createOrthographicCamera();
    createPerspectiveCamera();
}

function createOrthographicCamera() {
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
	pointLight = new THREE.PointLight( pointLightColor, 0, 100);
    pointLight.position.set(0, 30, 0);
    scene.add(pointLight);
}

/*==============================================================================
	Scene Creation
==============================================================================*/

var board, dice, ball, overlay;
var textureLoader = new THREE.TextureLoader();

function createScene() {
    'use strict';

    scene = new THREE.Scene();
    //scene.add(new THREE.AxesHelper(100));

    createBoard();
    createBall();
    createDice();
    createDirectionalLight();
    createPointLight();
}

function createPauseHUD() {
    'use strict';

    pauseHUD = new THREE.Scene();
	textureLoader.load("resources/paused.png", createPauseOverlay);
}

function createPauseOverlay(texture) {
	const material = new THREE.SpriteMaterial( { map: texture } );

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
    ball = new Ball(ballInitPos);
    scene.add(ball);
}

function createDice() {
	dice = new Dice();
	scene.add(dice);
}

function createBoard() {
    board = new Board();
    scene.add(board);
}

/*==============================================================================
	Event Listeners
==============================================================================*/

var togglePause = false, shouldReset = false, toggleWire = false;
var toggleMaterials = false, toggleBallMovement = false;
var togglePointLights = false, toggleDirectionalLights = false;
var width = window.innerWidth, height = window.innerHeight, viewSize = 4/5;

function onResize() {
    'use strict';
    
    const oldWidth = width, oldHeight = height;

    const angle = width / height;
    const windowVector = new THREE.Vector3(0,0,0);

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

    // Updates pause overlay camera
	pauseCamera.left = - width / 2;
	pauseCamera.right = width / 2;
	pauseCamera.top = height / 2;
	pauseCamera.bottom = - height / 2;
	pauseCamera.updateProjectionMatrix();
}

function onKeyDown(e) {
    'use strict';

    switch(e.keyCode) {
        case 66: //B - Ball's movement 
        	toggleBallMovement = true;
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
        	shouldReset = true;
            break;
        case 83: //S - Start/Stop
        	togglePause = true;
            break;
        case 87: //W - Wireframe
            toggleWire = true;
            break;
        default:
            break;
    }
}

/*==============================================================================
	Update scenes
==============================================================================*/

var timePrev;
var isPaused = false, isBasicMaterial = false;

function update(delta) {
    updateStatus();

    if (!isPaused) { updateWorld(delta) }
}

function updateStatus() {
    if (togglePause) {
        togglePause = false;
        isPaused = !isPaused;
    }

    if (shouldReset) {
        shouldReset = false;
        reset();
    }
}

function updateWorld(delta) {
    dice.rotate(delta);
    ball.rotate(delta);
    ball.move(delta);


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

function reset() {
	//TODO
}

function toggleWireframe() {
    for (let i = 0; i < objects.length; i++) {
        objects[i].toggleWireframe();
    }
}

function toggleLightning() {
	for (let i = 0; i < objects.length; i++) {
        if (!isBasicMaterial)
            objects[i].setBasicMaterial();
        else
            objects[i].setPhongMaterial();
    }

    isBasicMaterial = !isBasicMaterial;
}

function toggleDirectionalLight() {
    let lightTimeout
    
    if (directionalLight.intensity >= 1 && !switchingDirectionalLights) {
        switchingDirectionalLights = true;
        lightTimeout = setInterval(function() {
            directionalLight.intensity -= 0.1;
            if (directionalLight.intensity <= 0) {
                clearInterval(lightTimeout);
                switchingDirectionalLights = false;
            }
        }, 50);
    }
    
    else if (!switchingDirectionalLights) {
        switchingDirectionalLights = true;
        lightTimeout = setInterval(function() {
            directionalLight.intensity += 0.1;
            if (directionalLight.intensity >= 1) {
                clearInterval(lightTimeout);
                switchingDirectionalLights = false;
            }
        }, 50);
    }
}

function togglePointLight() {
    let lightTimeout

	if (pointLight.intensity >= 1 && !switchingPointLights) {
        switchingPointLights = true;
        lightTimeout = setInterval(function() {
            pointLight.intensity -= 0.1;
            if (pointLight.intensity <= 0) {
                clearInterval(lightTimeout);
                switchingPointLights = false;
            }
        }, 50);
    }

    else if (!switchingPointLights) {
        switchingPointLights = true;
        lightTimeout = setInterval(function() {
            pointLight.intensity += 0.1;
            if (pointLight.intensity >= 1) {
                clearInterval(lightTimeout);
                switchingPointLights = false;
            }
        }, 50);
    }
}

/*==============================================================================
    Core functions
==============================================================================*/

var scene, pauseHUD, renderer, controls;
var backgroundColor = 0x000000;

function animate(time) {
    'use strict';

    const delta = time - timePrev;

    controls.update();
    update(delta);
    render();
    
    timePrev = time;
    requestAnimationFrame(animate);
}

function render() {
    'use strict';
    
    renderer.autoClear = false; // render overlay on top of main scene

    renderer.clear();
    renderer.render(scene, camera);
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

    createScene();
    createCameras();
    createPauseHUD();
    
    render();

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.update();

    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKeyDown);
}
