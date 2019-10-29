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

//Icosahedron
var icosahedronColor = 0x159809, icosahedronSideLength = 10, icosahedronOffset = 1, icosahedronOpacity = 0.7;
var pedestalColor = frameColor, pedestalHeight = 30, pedestalRadius = 10;
var icosahedron;

var width = window.innerWidth, height = window.innerHeight;
var oldWidth = width, oldHeight = height;

//Lights
var directionalLight;

var objects = [], lastUsedMaterial = "phong", isBasicMaterial = 0;;

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
        objects.push(this);
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
        objects.push(this);
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
        objects.push(this);
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
        objects.push(this);
    }
} 

// Icosahedron and pedestal
class Icosahedron extends THREE.Object3D {
    constructor(x, y, z) {
        super();
        this.position.set(x,y+0.2,z+pedestalRadius*2+5);
        this._showEdges = true;
        this._pointList = [];

        // Prepare materials
        this.materialPedestal = new THREE.MeshBasicMaterial( {color: pedestalColor, wireframe: wireframeOn} );
        materials.push(this.materialPedestal);

        this.materialIcosahedron = new THREE.MeshBasicMaterial( {color: icosahedronColor, wireframe: wireframeOn, side: THREE.DoubleSide, 
            transparent:true, opacity: icosahedronOpacity} );
        materials.push(this.materialIcosahedron);

        // Create meshes
        this.meshList = [];
        this.createPedestal();
        this.createIcosahedron();
        this.toggleEdges();

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

        var geo = new THREE.EdgesGeometry( mesh.geometry );
        var mat = new THREE.LineBasicMaterial( { color: 0xffffff, linewidth: 2 } );
        var wireframe = new THREE.LineSegments( geo, mat );
        mesh.add( wireframe );

        // Pedestal cylinder
        var geometry = new THREE.CylinderGeometry( pedestalRadius, pedestalRadius, pedestalHeight, 16, 8);
        mesh = new THREE.Mesh(geometry, this.materialPedestal);
        mesh.position.set(0,pedestalHeight/2+pedestalHeight/4,0);
        this.meshList.push(mesh);

        var geo = new THREE.EdgesGeometry( mesh.geometry );
        var mat = new THREE.LineBasicMaterial( { color: 0xffffff, linewidth: 2 } );
        var wireframe = new THREE.LineSegments( geo, mat );
        mesh.add( wireframe );

        // Pedestal bottom basis
        geometry = new THREE.CylinderGeometry( pedestalRadius, pedestalRadius*3/2, pedestalHeight/4, 16, 8);
        mesh = new THREE.Mesh(geometry, this.materialPedestal);
        mesh.position.set(0,pedestalHeight/8,0);
        this.meshList.push(mesh);

        var geo = new THREE.EdgesGeometry( mesh.geometry );
        var mat = new THREE.LineBasicMaterial( { color: 0xffffff, linewidth: 2 } );
        var wireframe = new THREE.LineSegments( geo, mat );
        mesh.add( wireframe );
    }

    createIcosahedron() {
    
        var geometry = new THREE.Geometry();
        var goldNum = (1+Math.sqrt(5))/2;
        var aux = icosahedronSideLength;

        var v0 = new THREE.Vector3(0 + icosahedronOffset, -1*aux, -goldNum*aux);
        var v1 = new THREE.Vector3(0, -1*aux + icosahedronOffset, goldNum*aux);
        var v2 = new THREE.Vector3(0, 1*aux - icosahedronOffset, -goldNum*aux);
        var v3 = new THREE.Vector3(0 - icosahedronOffset, 1*aux, goldNum*aux);

        var v4 = new THREE.Vector3(-1*aux + icosahedronOffset, -goldNum*aux, 0);
        var v5 = new THREE.Vector3(-1*aux, goldNum*aux + icosahedronOffset, 0);
        var v6 = new THREE.Vector3(1*aux, -goldNum*aux - icosahedronOffset, 0);
        var v7 = new THREE.Vector3(1*aux - icosahedronOffset, goldNum*aux, 0);

        var v8 = new THREE.Vector3(-goldNum*aux + icosahedronOffset, 0, -1*aux);
        var v9 = new THREE.Vector3(goldNum*aux, 0 + icosahedronOffset, -1*aux);
        var v10 = new THREE.Vector3(-goldNum*aux, 0 - icosahedronOffset, 1*aux);
        var v11 = new THREE.Vector3(goldNum*aux - icosahedronOffset, 0, 1*aux);

        geometry.vertices.push(v0, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11);
        geometry.faces.push( new THREE.Face3( 0, 2, 9 ) );
        geometry.faces.push( new THREE.Face3( 0, 2, 8 ) );
        geometry.faces.push( new THREE.Face3( 0, 4, 8 ) );
        geometry.faces.push( new THREE.Face3( 0, 4, 6 ) );
        geometry.faces.push( new THREE.Face3( 0, 6, 9 ) );
        geometry.faces.push( new THREE.Face3( 1, 3, 10 ) );
        geometry.faces.push( new THREE.Face3( 1, 3, 11 ) );
        geometry.faces.push( new THREE.Face3( 1, 4, 6 ) );
        geometry.faces.push( new THREE.Face3( 1, 4, 10 ) );
        geometry.faces.push( new THREE.Face3( 1, 6, 11 ) );
        geometry.faces.push( new THREE.Face3( 2, 5, 7 ) );
        geometry.faces.push( new THREE.Face3( 2, 5, 8 ) );
        geometry.faces.push( new THREE.Face3( 2, 7, 9 ) );
        geometry.faces.push( new THREE.Face3( 3, 5, 7 ) );
        geometry.faces.push( new THREE.Face3( 3, 5, 10 ) );
        geometry.faces.push( new THREE.Face3( 3, 7, 11 ) );
        geometry.faces.push( new THREE.Face3( 4, 8, 10 ) );
        geometry.faces.push( new THREE.Face3( 5, 8, 10 ) );
        geometry.faces.push( new THREE.Face3( 6, 9, 11 ) );
        geometry.faces.push( new THREE.Face3( 7, 9, 11 ) );

        geometry.computeFaceNormals(); 
        var mesh = new THREE.Mesh(geometry, this.materialIcosahedron);

        for (let j=0; j<geometry.vertices.length; j++){
            var v = geometry.vertices[j];
            mesh.add(this.createPoint(v.x, v.y, v.z, j))
        }

        var geo = new THREE.EdgesGeometry( mesh.geometry );
        var mat = new THREE.LineBasicMaterial( { color: 0xffffff, linewidth: 2 } );
        var wireframe = new THREE.LineSegments( geo, mat );
        this._edge = wireframe;
        mesh.add( wireframe );

        mesh.position.set(0, pedestalHeight*3/2 + icosahedronSideLength*16/20, 0);
        mesh.rotateX(Math.PI/8);
        this.meshList.push(mesh);   

    }

    toggleEdges() {
        this._showEdges = !this._showEdges;
        //this._edge.visible = this._showEdges;
        for (let k=0; k<this._pointList.length; k++) this._pointList[k].visible = this._showEdges;
    }

    createPoint(x,y,z, i) {
        var dotGeometry = new THREE.Geometry();
        dotGeometry.vertices.push(new THREE.Vector3( x, y, z));
        var dotMaterial = new THREE.PointsMaterial( { size: 10, sizeAttenuation: false } );
        var dot = new THREE.Points( dotGeometry, dotMaterial );
        
        var sprite = this.makeTextSprite(i.toString(), {fontsize: 64});
        sprite.position.set( x,y,z );
        dot.add( sprite );
        this._pointList.push(dot);

        return dot;
    }

    makeTextSprite(message, opts) {
        var parameters = opts || {};
        var fontface = parameters.fontface || 'Helvetica';
        var fontsize = parameters.fontsize || 120;
        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
        context.font = fontsize + "px " + fontface;
    
        // get size data (height depends only on font size)
        var metrics = context.measureText(message);
        var textWidth = metrics.width;
    
        // text color
        context.fillStyle = 'rgba(255, 255, 255, 1.0)';
        context.fillText(message, 0, fontsize);
    
        // canvas contents will be used for a texture
        var texture = new THREE.Texture(canvas)
        texture.minFilter = THREE.LinearFilter;
        texture.needsUpdate = true;
    
        var spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        var sprite = new THREE.Sprite( spriteMaterial );
        sprite.scale.set( 10, 5, 1.0 );
        sprite.center.set( 0,1 );
        return sprite;
    }

}

// Cameras
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

// Creation

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

function createIcosahedron(x, y, z) {
    icosahedron = new Icosahedron(x, y, z);
    scene.add(icosahedron);
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
        case 69: //E - Change between Phong and Lambert Materials
            for (var i = 0; i < objects.length; i++) {
                if (lastUsedMaterial == "phong") objects[i].setLambertMaterial();
                else objects[i].setPhongMaterial();
            }

            lastUsedMaterial = lastUsedMaterial == "phong" ? "lambert" : "phong";
            isBasicMaterial = 0;
            break;
        case 81: //Q - Toggle directional lights
            if (directionalLight.intensity == 1) directionalLight.intensity = 0;
            else directionalLight.intensity = 1;
            break;
        case 82: //r - Change edges of icosahedron
            icosahedron.toggleEdges();
            break;
        case 87: //W - Toggle basic material
            for (var i = 0; i < objects.length; i++) {
                if (isBasicMaterial && lastUsedMaterial == "phong") objects[i].setPhongMaterial();
                else if (isBasicMaterial && lastUsedMaterial == "lambert") objects[i].setLambertMaterial();
                else objects[i].setBasicMaterial();
            }
            
            isBasicMaterial = isBasicMaterial == 0 ? 1 : 0;
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
