var scene, renderer, currCamera, viewSize = 4/5;
var sceneCamera, opArtCamera, camera;
var controls;

var wireframeOn = false;

//Scene
var backgroundColor = 0x000000, floorColor = 0x727982, objectDepth = 1;

//Wall
var wall, wallColor = 0xbdbcba, wallWidth = 130, wallHeight = 100;

//Frame
var dotRadius = 1;
var dotsColor = 0xffffff, paintColor = 0x858585, squareColor = 0x000000, frameColor = 0x653815;

var width = window.innerWidth, height = window.innerHeight;
var oldWidth = width, oldHeight = height;

//Lights
var directionalLight;

class THREEJSObject extends THREE.Object3D {
    constructor() {
        super();
    }

    createBasicMaterial(color) {
        this.basicMaterial = new THREE.MeshBasicMaterial( {color:color, wireframe: wireframeOn} );
    }

    createPhongMaterial(color) {
        this.phongMaterial = new THREE.MeshPhongMaterial( {color:color, wireframe: wireframeOn} );
    }

    createLambertMaterial(color) {
        this.lambertMaterial = new THREE.MeshLambertMaterial( {color:color, wireframe: wireframeOn} );
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
}

class Dot extends THREEJSObject {
    constructor() {
        super();
        this.geometry = new THREE.CylinderGeometry(dotRadius, dotRadius, objectDepth, 64, 1);

        this.createBasicMaterial(dotsColor);
        this.createPhongMaterial(dotsColor);
        this.createLambertMaterial(dotsColor);

        this.mesh = new THREE.Mesh(this.geometry, this.getPhongMaterial());
        this.mesh.rotateX(-Math.PI / 2);
        this.add(this.mesh);
    }

    setPosition(x, y, z) {
        this.position.set(x, y, z);
    }
}

class Wall extends THREEJSObject {
    constructor(x, y, z, width, height) {
        super();
        this.position.set(x, y, z);
        var geometry = new THREE.BoxGeometry(width, height, objectDepth);

        this.createBasicMaterial(wallColor);
        this.createPhongMaterial(wallColor);
        this.createLambertMaterial(wallColor);

        this.mesh = new THREE.Mesh(geometry, this.getBasicMaterial());
        this.add(this.mesh);
    }
}

class Paint extends THREEJSObject {
    constructor(x, y, z, width, height) {
        super();
        this.position.set(x, y, z);
        var geometry = new THREE.BoxGeometry(width, height, objectDepth);

        this.createBasicMaterial(paintColor);
        this.createPhongMaterial(paintColor);
        this.createLambertMaterial(paintColor);

        this.mesh = new THREE.Mesh(geometry, this.getPhongMaterial());
        this.add(this.mesh);
    }
}

class Frame extends THREEJSObject {
    constructor(x, y, z, width, height) {
        super();
        this.position.set(x, y, z);

        this.createBasicMaterial(frameColor);
        this.createPhongMaterial(frameColor);
        this.createLambertMaterial(frameColor);
       
        var geometry = new THREE.BoxGeometry(width, height, objectDepth * 3);
        this.mesh = new THREE.Mesh(geometry, this.getPhongMaterial());

        // solve Z-fighting problem
        this.mesh.material.polygonOffset = true;
        this.mesh.material.depthTest = true;
        this.mesh.material.polygonOffsetFactor = 1;
        this.mesh.material.polygonOffsetUnits = 0.1;

        this.add(this.mesh);
    }
}

class Square extends THREEJSObject {
    constructor(x, y, z, width, height) {
        super();
        this.position.set(x, y, z);
        var geometry = new THREE.BoxGeometry(width, height, objectDepth);

        this.createBasicMaterial(squareColor);
        this.createPhongMaterial(squareColor);
        this.createLambertMaterial(squareColor);

        this.mesh = new THREE.Mesh(geometry, this.getPhongMaterial());
        this.add(this.mesh);
    }
} 

class OrtCamera extends THREE.OrthographicCamera {
    constructor(x, y, z, lookx, looky, looz) {
        var cameraWidth = (camera.aspect * wallHeight - wallWidth) / 2;
        super(0 - cameraWidth, wallWidth + cameraWidth, wallHeight / 2, -wallHeight / 2, 1, 800);

        this.position.x = x;
        this.position.y = y;
        this.position.z = z;
        this.lookAt(lookx,looky,looz);
    }
}

class PerCamera extends THREE.PerspectiveCamera {
    constructor(x, y, z, lookx, looky, looz) {
        super(80, window.innerWidth / window.innerHeight, 1, 1000);

        this.position.x = x;
        this.position.y = y;
        this.position.z = z;
        this.lookAt(lookx,looky,looz);
    }

    setCameraPosition(x, y, z) {
        this.position.x = x;
        this.position.y = y;
        this.position.z = z;
    }

    setCameraRotation(value) {
        this.rotation.y = value;
    }

    lookAtObject(pos) {
        this.lookAt(pos);
    }
}

function createWall() {
	wall = new Wall(wallWidth / 2, wallHeight / 2, objectDepth / 2, wallWidth, wallHeight)
	scene.add(wall)
}

function createPaint() {
    let width = 110, height = 80
    var paint = new Paint(width / 2 + 10, height / 2 + 10, objectDepth, width, height)
    scene.add(paint)

    createFrame(9, (wallHeight - 20) / 2 + 10, objectDepth * 2, 3, wallHeight - 20)
    createFrame(9 + width + 2, (wallHeight - 20) / 2 + 10, objectDepth * 2, 3, wallHeight - 20)
    createFrame(9 + (wallWidth - 18) / 2, height + 10, objectDepth * 2, wallWidth - 15, 3)
    createFrame(9 + (wallWidth - 18) / 2, 10, objectDepth * 2, wallWidth - 15, 3)
}

function createFrame(x, y, z, width, height) {
    var frame = new Frame(x, y, z, width, height)
    scene.add(frame)
}

function createDots(width, height) {
	var x = y = 20
	for (var i = 0; i < width; i++, x += 10) {
		y = 20
		for (var j = 0; j < height; j++, y += 10) {
			var dot = new Dot()
			dot.setPosition(x, y, objectDepth * 2);
			scene.add(dot)
		}
	}
}

function createSquares(width, height) {
	var x = Math.cos(Math.PI / 4) + 10
	for (var i = 0; i <= width; i++, x += 10) {
		var y = Math.cos(Math.PI / 4) + 10
		for (var j = 0; j <= height; j++, y += 10) {
            let squareWidth = 10 - 2 * Math.cos(Math.PI / 4)
            let squareHeight = 10 - 2 * Math.cos(Math.PI / 4)
			var square = new Square(x + squareWidth / 2, y + squareHeight / 2, objectDepth * 2, squareWidth, squareHeight);
			scene.add(square)
		}
	}
}

function createFloor() {
    var geometry = new THREE.PlaneGeometry(260, 100);
    var material = new THREE.MeshBasicMaterial( {color: floorColor, side: THREE.DoubleSide} ); 
    var plane = new THREE.Mesh( geometry, material );
    plane.rotateX( - Math.PI / 2);
    plane.position.set(0, 0, 50);
    scene.add(plane);
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

function createDirectionalLight() {
    directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 200, 200);
    directionalLight.target = wall;
    scene.add(directionalLight);
    scene.add(directionalLight.target);
}

function createScene() {
    'use strict';

    scene = new THREE.Scene();
    scene.add(new THREE.AxesHelper(100));

    createFloor()
    createWall()
    createPaint()
    createDots(10, 7)
    createSquares(10, 7)
    createDirectionalLight();
}

function onResize() {
    'use strict';
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    var windowVector = new THREE.Vector3(0,0,0);
    renderer.getSize(windowVector);
    width = windowVector.x, height = windowVector.y;

    var angle = oldWidth / oldHeight;

    if (window.innerHeight > 0 && window.innerWidth > 0) {
    
        if (width != oldWidth) {
            if (width > oldWidth) viewSize /= (1.01 ** angle);
            else viewSize *= (1.01 ** angle);
        }

        if (height != oldHeight) {
            if (height > oldHeight) viewSize /= (1.01 ** angle);
            else viewSize *= (1.01 ** angle);
        }
        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        var cameraWidth = (camera.aspect * wallHeight - wallWidth) / 2;
        opArtCamera.left = 0 - cameraWidth;
        opArtCamera.right = wallWidth + cameraWidth;
        opArtCamera.top = wallHeight / 2;
        opArtCamera.bottom = -wallHeight / 2;
        opArtCamera.updateProjectionMatrix();

        if (width > oldWidth) sceneCamera.fov -= Math.atan(angle);
        else if (width < oldWidth) sceneCamera.fov += Math.atan(angle);
        sceneCamera.aspect = width / height;
        sceneCamera.updateProjectionMatrix();
    }

    oldWidth = width; oldHeight = height;
}

function onKeyDown(e) {
    'use strict';

    switch(e.keyCode) {
        case 48: //0 - Default Camera
            currCamera = camera;
            break;
        case 48: //1 - Spotlight #1
            //TODO toggler
            break;
        case 48: //2 - Spotlight #2
            //TODO toggler
            break;
        case 48: //3 - Spotlight #3
            //TODO toggler
            break;
        case 48: //4 - Spotlight #4
            //TODO toggler
            break;           
        case 53: //5 - Scene camera
            currCamera = sceneCamera;
            break;
        case 54: //6 - Op Art camera
            currCamera = opArtCamera;
            break;
        case 81: //Q - Toggle directional lights
            if (directionalLight.intensity == 1) directionalLight.intensity = 0;
            else directionalLight.intensity = 1;
            break;
        default:
            break;
    }
}

function animate(time) {
    'use strict';

    controls.update();
    render();
    requestAnimationFrame(animate);
}

function render() {
    'use strict';
    
    renderer.render(scene, currCamera);
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
    opArtCamera = new OrtCamera(0, 50, 50, 0, wallHeight / 2, 0);
    sceneCamera = new PerCamera(0, 150, 150, 0, 0, 0);

    currCamera = camera;
    render();

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.update();

    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKeyDown);
}
