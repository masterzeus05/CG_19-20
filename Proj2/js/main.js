var scene, renderer, currCamera, viewSize = 3/4;
var topCamera, perCamera, ballCamera, camera;
var controls;

var canons = [], balls = [], wallSurface;
var wallsColor = 0xff0000, ballsColor = 0xffffff, canonsColor = 0x00ff00, selectedColor = 0x0000ff;
var materials = [], leftLimit, rightLimit, distanceCanonWall = 100;
var wireframeOn = true, showAxis = true;

var width = window.innerWidth, height = window.innerHeight;

var movementFlags = {"moveLeft":0, "moveRight":0}, selectedCanon;
var angleMovement = Math.PI/180;

class Canon extends THREE.Object3D {
    constructor(x, y, z, angle) {
        super();

        this.position.set(x, y, z);
        var geometry = new THREE.CylinderGeometry( 10, 10, 50, 64, 1);
        var material = new THREE.MeshBasicMaterial({color: canonsColor, wireframe: true});
        materials.push(material);
        var mesh = new THREE.Mesh(geometry, material);
        mesh.rotateX(Math.PI/2);
        this.add(mesh);
        this.rotateY(angle);
        this.mesh = mesh;
        this.canShoot = true;
    }

    getDirection(){
        var direction = new THREE.Vector3();
        this.getWorldDirection(direction);
        return direction;
    }

    getPosX() {
        return this.position.x;
    }

    getPosY() {
        return this.position.y;
    }

    getPosZ() {
        return this.position.z;
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

    changeShooting(value) {
        this.canShoot = value;
    }

    getRotY() {
        return this.rotation.y;
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

class OrtCamera extends THREE.OrthographicCamera {
    constructor(x, y, z, lookx, looky, looz) {
        super(width / - 2 * viewSize, width / 2 * viewSize, height / 2 * viewSize, height / - 2 * viewSize, 1, 800);

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

    setFollowingBall(ball) {
        this.ball = ball;
    }

    getFollowingBall() {
        return this.ball;
    }

    setCameraRotation(value) {
        this.rotation.y = value;
    }
}

class Ball extends THREE.Object3D {
    constructor() {
        super();
        var geometry = new THREE.SphereGeometry(10, 16, 16);
        var material = new THREE.MeshBasicMaterial({ color:0xffffff, wireframe: wireframeOn });
        materials.push(material);
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.setRotationFromEuler(this.mesh.rotation);
        this.axis = new THREE.AxesHelper(20);
        this.axis.visible = showAxis;
        this.mesh.add(this.axis);
        this.add(this.mesh);
    }

    setPosition(x, y, z) {
        this.position.set(x, y, z);
    }

    getPositionX() {
        return this.position.x;
    }

    getPositionY() {
        return this.position.y;
    }

    getPositionZ() {
        return this.position.z;
    }

    positionIncrease(vector) {
        this.position.add(vector);
    }

    setRotationY(rot) {
        this.rotation.y = rot;
    }

    getRotationY() {
        return this.roty;
    }

    setVelocity(x, y, z) {
        this.velocity = new THREE.Vector3(x, y, z);
    }

    getVelocity(){
        return this.velocity;
    }

    getVelocityX() {
        return this.velocity.x;
    }

    getVelocityZ() {
        return this.velocity.z;
    }

    setAxis(value) {
        this.axis.visible = value;
    }
}

function createPerspectiveCamera(){
    'use strict';

    camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 1, 1000);

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

    createFieldBalls(3, rightLimit, -(distanceCanonWall - 10));
    createFieldBalls(3, leftLimit, -(distanceCanonWall - 10));
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

        perCamera.left = width / -2 * viewSize;
        perCamera.right = -topCamera.left;
        perCamera.top = height / 2 * viewSize;
        perCamera.bottom = -topCamera.top;
        perCamera.updateProjectionMatrix();
        renderer.setSize(width, height);

        ballCamera.left = width / -2 * viewSize;
        ballCamera.right = -topCamera.left;
        ballCamera.top = height / 2 * viewSize;
        ballCamera.bottom = -topCamera.top;
        ballCamera.updateProjectionMatrix();
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
            console.log("perCamera activates!");
            currCamera = perCamera;
            break;
        case 51: //3 - Front Camera
            console.log("ballCamera activates!");
            followBall(ballCamera);
            break;
        case 52: //4 - Wireframe toggle
            wireframeOn = !wireframeOn;
            for (let i=0; i<materials.length; i++) materials[i].wireframe = wireframeOn;
            break;
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
        case 82: //r - show balls axis
            showAxis = !showAxis;
            for (var i = 0; i < balls.length ; i++) {
                balls[i].setAxis(showAxis);
            }
            break;
        case 37: // < - Move left
            movementFlags["moveLeft"] = 1;
            break;
        case 39: // > - Move right
            movementFlags["moveRight"] = 1;
            break;
        case 32: //space bar - shoot a ball
            if (selectedCanon.canShoot) {
                var ball = new Ball();
                ball.setPosition(selectedCanon.getPosX(), selectedCanon.getPosY(), selectedCanon.getPosZ());
                ball.setRotationY( selectedCanon.getRotY());
                var random = 1 + Math.random();
                ball.setVelocity(-Math.sin(selectedCanon.rotation.y) * random, 0, -Math.cos(selectedCanon.rotation.y) * random);
                balls.push(ball);
                selectedCanon.changeShooting(false);
                window.setTimeout(function() { canShootAgain(selectedCanon); }, 1000);
                scene.add(ball);
            }
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

function canShootAgain(cannon) {
    cannon.changeShooting(true);
}

function createFieldBalls(numb, coorX, coorZ) {
    for (var i = 0; i < Math.random() * numb; i++) {
        var ball = new Ball();
        var x = Math.random() * coorX;
        var z = Math.random() * coorZ;
        var onTop = true
        while (onTop) {
            var j = 0;
            var newBallPos = new THREE.Vector3(x, 10, z);
            for (j = 0; j < balls.length; j++) {
                var ballPos = new THREE.Vector3(balls[j].position.x, balls[j].position.y, balls[j].position.z);
                if (ballPos.distanceTo(newBallPos) < 20) {
                    x = Math.random() * coorX;
                    z = Math.random() * coorZ;
                    break;
                }
            }

            if (j == balls.length) onTop = false;
        }
        ball.setPosition(x, 10, z);
        balls.push(ball);
        scene.add(ball);
    }
}

function updatePosition() {
    if (movementFlags["moveLeft"]) selectedCanon.moveLeft(leftLimit);
    if (movementFlags["moveRight"]) selectedCanon.moveRight(rightLimit);

    for (var i = 0; i < balls.length ; i++) {
        if(balls[i].getVelocity()) {
            // Update Position
            balls[i].positionIncrease(balls[i].velocity);

            // Update Velocity
            if (balls[i].getVelocityX()) balls[i].setVelocity(balls[i].getVelocityX() - balls[i].getVelocityX()/500, 0, balls[i].getVelocityZ() - balls[i].getVelocityZ()/500);
            else balls[i].setVelocity(0, 0, balls[i].getVelocityZ() - balls[i].getVelocityZ()/500);

            // Update rotation
            if (balls[i].getVelocityZ()) balls[i].rotateX(balls[i].getVelocityZ() / 10);
        }
    }

    if (currCamera == ballCamera) {
        currCamera.setCameraPosition(currCamera.getFollowingBall().getPositionX() - currCamera.getFollowingBall().getVelocityX() * 50, 
                                     currCamera.getFollowingBall().getPositionY() + 10, 
                                     currCamera.getFollowingBall().getPositionZ() + 30 - currCamera.getFollowingBall().getVelocityZ() * 50);
        currCamera.lookAt(currCamera.getFollowingBall().position);
    }
}

function followBall(camera) {
    var random = Math.round(Math.random() * (balls.length - 1));
    var randomBall = balls[balls.length - 1];
    var angle = randomBall.getRotationY();

    if (angle) {
        camera.setCameraPosition(randomBall.getPositionX(), randomBall.getPositionY() + 10, randomBall.getPositionZ() + 30);
        camera.lookAt(randomBall.position);
    }
    else camera.setCameraPosition(randomBall.getPositionX(), randomBall.getPositionY() + 10, randomBall.getPositionZ() + 30);
    camera.setFollowingBall(randomBall);
    console.log("rot: " + randomBall.getRotationY());
    currCamera = camera;
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
    topCamera = new OrtCamera(0, 100, 0, 0, 0, 0);
    perCamera = new PerCamera(0, 200, 150, 0, 0, 0);
    ballCamera = new PerCamera(0, 30, 200, 0, 0, 0);


    currCamera = camera;
    render();

    controls = new THREE.OrbitControls( currCamera, renderer.domElement );
    controls.update();

    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
}