var scene, renderer, currCamera, viewSize = 3/4;
var topCamera, lateralCamera, frontCamera, camera;
var controls;

var canons = [], balls = [], wallSurface;
var wallsColor = 0xff0000, ballsColor = 0xffffff, canonsColor = 0x00ff00, selectedColor = 0x0000ff;
var materials = [], leftLimit, rightLimit, distanceCanonWall = 100;

var width = window.innerWidth, height = window.innerHeight;

var movementFlags = {"moveLeft":0, "moveRight":0}, selectedCanon;
var angleMovement = Math.PI/180;

class Canon extends THREE.Object3D {
    constructor(x, y, z, angle) {
        super();

        this.position.set(x, y, z);
        var geometry = new THREE.CylinderGeometry( 10, 10, 50, 8, 1);
        var material = new THREE.MeshBasicMaterial({color: canonsColor, wireframe: true});
        materials.push(material);
        var mesh = new THREE.Mesh(geometry, material);
        mesh.rotateX(Math.PI/2);
        this.add(mesh);
        this.rotateY(angle);
        this.mesh = mesh;
    }

    getDirection(){
        var direction = new THREE.Vector3();
        this.getWorldDirection(direction);
        return direction;
    }

    moveLeft(leftLimit) {
        var flag = (this.position.x -(Math.tan(this.rotation.y)*distanceCanonWall) ) >= leftLimit
        if (flag) this.rotateY(angleMovement);
    }

    moveRight(rightLimit) {
        var flag = (this.position.x -(Math.tan(this.rotation.y)*distanceCanonWall) ) <= rightLimit
        if (flag) this.rotateY(-angleMovement);
    }

    changeColor(color){
        this.mesh.material.color.setHex(color);
    }
}

class Walls extends THREE.Object3D {
    constructor(x, y, z) {
        super();
        var size = 100;
        this.position.set(x, y, z-size);

        var material = new THREE.MeshBasicMaterial({color: wallsColor, wireframe: true});
        materials.push(material);
        var geometry = new THREE.BoxGeometry(2, size, 2*size, 8, 8);

        //Left wall
        var meshLeft = new THREE.Mesh(geometry, material);
        meshLeft.position.set(x-size,y+size/2,z);
        leftLimit = x-size+10;

        //Right wall
        var meshRight = new THREE.Mesh(geometry, material);
        meshRight.position.set(x+size,y+size/2,z);
        rightLimit = x+size-10;

        //Center wall
        var meshCenter = new THREE.Mesh(geometry, material);
        meshCenter.position.set(x,y+size/2,z-size);
        meshCenter.rotateY(Math.PI/2);
        
        this.add(meshLeft);
        this.add(meshRight);
        this.add(meshCenter);
    
    }
}

class Camera extends THREE.OrthographicCamera {
    constructor(x, y, z, lookx, looky, looz) {
        super(width / - 2 * viewSize, width / 2 * viewSize, height / 2 * viewSize, height / - 2 * viewSize, 1, 800);

        this.position.x = x;
        this.position.y = y;
        this.position.z = z;
        this.lookAt(lookx,looky,looz);
    }
}

function createPerspectiveCamera(){
    'use strict';

    camera = new THREE.PerspectiveCamera(80,
        window.innerWidth / window.innerHeight,
        1,
        1000);

    camera.position.x = 50;
    camera.position.y = 50;
    camera.position.z = 50;
    camera.lookAt(0,0,0);
}

function createCanon(x, y, z, angle, tag){
    'use strict';
    var canon = new Canon(x, y, z, angle);
    canons[tag] = canon;
    scene.add(canon);
}

function createWalls(x, y, z){
    'use strict';
    wallSurface = new Walls(x, y, z);
    scene.add(wallSurface);
}

function createScene(){
    'use strict';

    scene = new THREE.Scene();
    scene.add(new THREE.AxesHelper(100));

    //Plane for help
    var geometry = new THREE.PlaneGeometry( 200, 400, 10, 10);
    var material = new THREE.MeshBasicMaterial( {color: 0x808080, side: THREE.DoubleSide} ); 
    var plane = new THREE.Mesh( geometry, material );
    plane.rotateX( - Math.PI / 2);
    plane.position.set(0, 0, 0);
    scene.add( plane );

    //Creation of Models
    createCanon(50, 10, distanceCanonWall, Math.PI/16, "right");
    createCanon(0, 10, distanceCanonWall, 0, "center");
    createCanon(-50, 10, distanceCanonWall, -Math.PI/16, "left");
    selectedCanon = canons["center"];
    selectedCanon.changeColor(selectedColor);

    createWalls(0,0,0);
}

function onResize(){
    'use strict';
    renderer.setSize(window.innerWidth, window.innerHeight);
    var width = renderer.getSize().width, height = renderer.getSize().height;

    if (window.innerHeight > 0 && window.innerWidth > 0){
        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        topCamera.left = width / -2 * viewSize;
        topCamera.right = -topCamera.left;
        topCamera.top = height / 2 * viewSize;
        topCamera.bottom = -topCamera.top;
        topCamera.updateProjectionMatrix();
        renderer.setSize(width, height);

        lateralCamera.left = width / -2 * viewSize;
        lateralCamera.right = -topCamera.left;
        lateralCamera.top = height / 2 * viewSize;
        lateralCamera.bottom = -topCamera.top;
        lateralCamera.updateProjectionMatrix();
        renderer.setSize(width, height);

        frontCamera.left = width / -2 * viewSize;
        frontCamera.right = -topCamera.left;
        frontCamera.top = height / 2 * viewSize;
        frontCamera.bottom = -topCamera.top;
        frontCamera.updateProjectionMatrix();
        renderer.setSize(width, height);
    }

}

function onKeyDown(e){
    'use strict';

    switch(e.keyCode){
        case 48: //0 - Default Camera
            console.log("Default camera activates!");
            currCamera = camera;
            break;
        case 49: //1 - Top Camera
            console.log("TopCamera activates!");
            currCamera = topCamera;
            break;
        case 50: //2 - Lateral Camera
            console.log("LateralCamera activates!");
            currCamera = lateralCamera;
            break;
        case 51: //3 - Front Camera
            console.log("FrontalCamera activates!");
            currCamera = frontCamera;
            break;
        case 52: //4 - Wireframe toggle
            for (let i=0; i<materials.length; i++) materials[i].wireframe = !materials[i].wireframe;
        case 81: //q - Select left canon
            selectedCanon.changeColor(canonsColor);
            selectedCanon = canons["left"];
            selectedCanon.changeColor(selectedColor);
            break;
        case 87: //w - Select center canon
            selectedCanon.changeColor(canonsColor);
            selectedCanon = canons["center"];
            selectedCanon.changeColor(selectedColor);
            break;
        case 69: //e - Select right canon
            selectedCanon.changeColor(canonsColor);
            selectedCanon = canons["right"];
            selectedCanon.changeColor(selectedColor);
            break;
        case 69: //r - show balls axis
            break;
        case 37: // < - Move left
            movementFlags["moveLeft"] = 1;
            break;
        case 39: // > - Move right
            movementFlags["moveRight"] = 1;
            break;
        default:
            console.log(e.keyCode);
            break;
    }
}

function onKeyUp(e){
    'use strict';

    switch(e.keyCode){
        case 37: // < - Move left
            movementFlags["moveLeft"] = 0;
            break;
        case 39: // > - Move right
            movementFlags["moveRight"] = 0;
            break;
        default:
            //console.log(e.keyCode);
            break;
    }
}

function updatePosition() {
    if (movementFlags["moveLeft"]) selectedCanon.moveLeft(leftLimit);
    if (movementFlags["moveRight"]) selectedCanon.moveRight(rightLimit);
}

function animate(){
    'use strict';

    controls.update();
    updatePosition();
    render();

    requestAnimationFrame(animate);
}

function render(){
    'use strict';
    renderer.render(scene, currCamera);
}

function init(){
    'use strict';

    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(width, height);

    document.body.appendChild(renderer.domElement);

    createScene();
    createPerspectiveCamera();
    topCamera = new Camera(0, 100, 0, 0, 0, 0);
    lateralCamera = new Camera(200, 30, 0, 0, 30, 0);
    frontCamera = new Camera(0, 30, 200, 0, 30, 0);


    currCamera = camera;
    render();

    controls = new THREE.OrbitControls( currCamera, renderer.domElement );
    controls.update();

    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
}