var scene, renderer, currCamera, viewSize = 4/5;
var sceneCamera, opArtCamera, camera;
var controls;

var materials = [], dots = [], squares = [];
var dotsColor = 0xffffff, wallColor = 0x6f7170, squareColor = backgroundColor = 0x000000;
var wireframeOn = false;
var dotRadius = 1;

var width = window.innerWidth, height = window.innerHeight;
var oldWidth = width, oldHeight = height;

class Dot extends THREE.Object3D {
    constructor() {
        super();
        var geometry = new THREE.SphereGeometry(dotRadius, 16, 16);
        var material = new THREE.MeshBasicMaterial( {color:dotsColor, wireframe: wireframeOn} );
        materials.push(material);
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.add(this.mesh);
    }

    setPosition(x, y, z) {
        this.position.set(x, y, z);
    }
}

class Wall extends THREE.Object3D {
    constructor(x, y, z, width, height) {
        super();
        this.position.set(x, y, z);

        var material = new THREE.MeshBasicMaterial( {color: wallColor, wireframe: wireframeOn} );
        materials.push(material);
        var geometry = new THREE.BoxGeometry(2, height, width, 8, 8);

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x + width / 2, y + height / 2, z);
        this.mesh.rotateY(Math.PI / 2);
        this.add(this.mesh);
    }
}

class Square extends THREE.Object3D {
    constructor(x, y, z, width, height) {
        super();
        this.position.set(x, y, z);

        var material = new THREE.MeshBasicMaterial( {color: squareColor, wireframe: wireframeOn} );
        materials.push(material);
        var geometry = new THREE.BoxGeometry(2, height, width, 8, 8);

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x + width / 2, y + height / 2, z);
        this.mesh.rotateY(Math.PI / 2);
        this.add(this.mesh);
    }

    setPosition(x, y, z) {
        this.position.set(x, y, z);
    }
} 

class OrtCamera extends THREE.OrthographicCamera {
    constructor(x, y, z, lookx, looky, looz) {
        super(width / -2 * viewSize, width / 2 * viewSize, 
            height / 2 * viewSize, height / -2 * viewSize, 1, 800);

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

function createWall(width, height) {
	var wall = new Wall(0, 0, 0, (width + 1) * 10, (height + 1) * 10)
	scene.add(wall)
}

function createDots(width, height) {
	var x = y = 10
	for (var i = 0; i < width; i++, x += 10) {
		y = 10
		for (var j = 0; j < height; j++, y += 10) {
			var dot = new Dot()
			dot.setPosition(x, y, dotRadius * 2);
			dots.push(dot)
			scene.add(dot)
		}
	}
}

function createSquares(width, height) {
	var x = Math.cos(Math.PI / 4)
	for (var i = 0; i <= width; i++, x += 10) {
		var y = Math.cos(Math.PI / 4)
		for (var j = 0; j <= height; j++, y += 10) {
			var square = new Square(0, 0, 0, 10 - 2 * Math.cos(Math.PI / 4), 10 - 2 * Math.cos(Math.PI / 4))
			square.setPosition(x, y, dotRadius * 2);
			squares.push(square)
			scene.add(square)
		}
	}
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

function createScene() {
    'use strict';

    scene = new THREE.Scene();
    scene.add(new THREE.AxesHelper(100));

    createWall(12, 9)
    createDots(12, 9)
    createSquares(12, 9)
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

        opArtCamera.left = width / -2 * viewSize;
        opArtCamera.right = -opArtCamera.left;
        opArtCamera.top = height / 2 * viewSize;
        opArtCamera.bottom = -opArtCamera.top;
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
}

function init() {
    'use strict';

    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(width, height);
    renderer.setClearColor(new THREE.Color(backgroundColor))

    document.body.appendChild(renderer.domElement);

    createScene();
    createPerspectiveCamera();
    opArtCamera = new OrtCamera(0, 30, 50, 0, 30, 0);
    sceneCamera = new PerCamera(0, 200, 100, 0, 0, 0);

    currCamera = camera;
    render();

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.update();

    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKeyDown);
}
