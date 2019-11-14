var scene, renderer, viewSize = 4/5;
var controls;

var wireframeOn = false, isPaused = false;

var backgroundColor = 0x000000;

var width = window.innerWidth, height = window.innerHeight;
var oldWidth = width, oldHeight = height;

/*==============================================================================
	Modulation
==============================================================================*/

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

function createDirectionalLight() {
    //TODO
}

function createPointLight() {
	//TODO
}

/*==============================================================================
	Scene Creation
==============================================================================*/

function createScene() {
    'use strict';

    scene = new THREE.Scene();
    scene.add(new THREE.AxesHelper(100));

    createFloor();
    createBoard();
    createBall();
    createDice();
    createDirectionalLight();
    createPointLight();
}

// uses texture + bump map
function createBoard() {
	//TODO
}

// uses texture
function createBall() {
	//TODO
}

// uses texture + bump map
function createDice() {
	//TODO
}

function createFloor() {
	var geometry = new THREE.PlaneGeometry(100 , 100, 10, 10);
    var material = new THREE.MeshBasicMaterial({
    		color: 0x808080, 
    		side: THREE.DoubleSide
    	}
    );
    
    var plane = new THREE.Mesh( geometry, material );
    plane.rotateX( - Math.PI / 2);
    plane.position.set(50, 0, 50);
    scene.add( plane );
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
        	toggleDirectionalLight();
            break;
        case 76: //L - Lightning
        	toggleLightning();
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
        	toggleWireframe();
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
	wireframeOn = !wireframeOn
}

function toggleLightning() {
	//TODO
}

function toggleDirectionalLight() {
	//TODO
}

function togglePointLight() {
	//TODO
}

function animate(time) {
    'use strict';

    controls.update();
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
