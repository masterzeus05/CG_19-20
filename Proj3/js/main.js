var scene, renderer, currCamera, viewSize = 4/5;
var sceneCamera, opArtCamera, camera;
var controls;

var materials = [];
var wireframeOn = false;

//Scene
var backgroundColor = 0x000000, floorColor = 0x727982, objectDepth = 1;

//Wall
var wallColor = 0xbdbcba, wallWidth = 130, wallHeight = 100;

//Frame
var dotRadius = 1;
var dotsColor = 0xffffff, paintColor = 0x858585, squareColor = 0x000000, frameColor = 0x653815;

//Icosahedron
var icosahedronColor = 0x159809, icosahedronSideLength = 15;
var pedestalColor = frameColor, pedestalHeight = 30, pedestalRadius = 10;

var width = window.innerWidth, height = window.innerHeight;
var oldWidth = width, oldHeight = height;

// Illusion
class Dot extends THREE.Object3D {
    constructor() {
        super();
        var geometry = new THREE.CylinderGeometry(dotRadius, dotRadius, objectDepth, 64, 1);
        var material = new THREE.MeshBasicMaterial( {color:dotsColor, wireframe: wireframeOn} );
        materials.push(material);
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.rotateX(-Math.PI / 2);
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
        var geometry = new THREE.BoxGeometry(width, height, objectDepth);
        this.mesh = new THREE.Mesh(geometry, material);
        this.add(this.mesh);
    }
}

class Paint extends THREE.Object3D {
    constructor(x, y, z, width, height) {
        super();
        this.position.set(x, y, z);

        var material = new THREE.MeshBasicMaterial( {color: paintColor, wireframe: wireframeOn} );
        materials.push(material);
        var geometry = new THREE.BoxGeometry(width, height, objectDepth);
        this.mesh = new THREE.Mesh(geometry, material);
        this.add(this.mesh);
    }
}

class Frame extends THREE.Object3D {
    constructor(x, y, z, width, height) {
        super();
        this.position.set(x, y, z);

        var material = new THREE.MeshBasicMaterial( {color: frameColor, wireframe: wireframeOn} );
        
        // solve Z-fighting problem
        material.polygonOffset = true;
        material.depthTest = true;
        material.polygonOffsetFactor = 1;
        material.polygonOffsetUnits = 0.1;
       
        materials.push(material);
        var geometry = new THREE.BoxGeometry(width, height, objectDepth * 3);
        this.mesh = new THREE.Mesh(geometry, material);
        this.add(this.mesh);
    }
}

class Square extends THREE.Object3D {
    constructor(x, y, z, width, height) {
        super();
        this.position.set(x, y, z);

        var material = new THREE.MeshBasicMaterial( {color: squareColor, wireframe: wireframeOn} );
        materials.push(material);
        var geometry = new THREE.BoxGeometry(width, height, objectDepth);
        this.mesh = new THREE.Mesh(geometry, material);
        this.add(this.mesh);
    }
} 

// Icosahedron and pedestal
class Icosahedron extends THREE.Object3D {
    constructor(x, y, z) {
        super();
        this.position.set(x,y+0.2,z+pedestalRadius*2+5);

        // Prepare materials
        this.materialPedestal = new THREE.MeshBasicMaterial( {color: pedestalColor, wireframe: wireframeOn} );
        materials.push(this.materialPedestal);

        this.materialIcosahedron = new THREE.MeshBasicMaterial( {color: icosahedronColor, wireframe: wireframeOn, side: THREE.DoubleSide} );
        materials.push(this.materialIcosahedron);

        // Create meshes
        this.meshList = [];
        this.createPedestal();
        this.createIcosahedron();

        // Add all meshes to object3D
        for (let i=0; i<this.meshList.length; i++) this.add(this.meshList[i]);

        // Create wall
        var wall = new Wall(-wallWidth / 2, wallHeight / 2, objectDepth / 2, wallWidth, wallHeight)
	    scene.add(wall)

    }

    createPedestal() {
        var geometry, mesh;

        // Pedestal top basis
        geometry = new THREE.CylinderGeometry( pedestalRadius*2, pedestalRadius, pedestalHeight/4, 16, 8);
        mesh = new THREE.Mesh(geometry, this.materialPedestal);
        mesh.position.set(0,9*pedestalHeight/8,0);
        this.meshList.push(mesh);

        // Pedestal cylinder
        var geometry = new THREE.CylinderGeometry( pedestalRadius, pedestalRadius, pedestalHeight, 16, 8);
        mesh = new THREE.Mesh(geometry, this.materialPedestal);
        mesh.position.set(0,pedestalHeight/2+pedestalHeight/4,0);
        this.meshList.push(mesh);

        // Pedestal bottom basis
        geometry = new THREE.CylinderGeometry( pedestalRadius, pedestalRadius*3/2, pedestalHeight/4, 16, 8);
        mesh = new THREE.Mesh(geometry, this.materialPedestal);
        mesh.position.set(0,pedestalHeight/8,0);
        this.meshList.push(mesh);
    }

    createIcosahedron() {
        var geometry, mesh;

        // What the fuck way TODO
        geometry = new THREE.Geometry();
        var goldNum = (1+Math.sqrt(5))/2;
        var aux = icosahedronSideLength;

        var v1 = new THREE.Vector3(0, 0, 0);
        var v2 = new THREE.Vector3(4*aux, 0, 0);
        var v3 = new THREE.Vector3(2*aux, Math.sqrt(12)*aux, 0);
        geometry.vertices.push(v1, v2, v3);

        geometry.faces.push( new THREE.Face3( 0, 1, 2 ) );
        geometry.computeFaceNormals();
        mesh = new THREE.Mesh(geometry, this.materialIcosahedron);
        mesh.position.set(0, 10, 30);
        this.add(mesh);
        this.meshList.push(mesh);

        // Default way WRONG
        geometry = new THREE.IcosahedronGeometry(icosahedronSideLength, 1);
        mesh = new THREE.Mesh(geometry, this.materialIcosahedron);
        mesh.position.set(0, pedestalHeight*3/2+icosahedronSideLength/4, 0);
        this.add(mesh);
        this.meshList.push(mesh);

    }
}

// Cameras
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

// Creation

function createWall() {
	var wall = new Wall(wallWidth / 2, wallHeight / 2, objectDepth / 2, wallWidth, wallHeight)
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

function createIcosahedron(x, y, z) {
    var object = new Icosahedron(x, y, z);
    scene.add(object);
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

    createFloor();
    createWall();
    createPaint();
    createDots(10, 7);
    createSquares(10, 7);
    createIcosahedron(-65, 0, 0);
}

// Event listeners

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

// Core functions

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
