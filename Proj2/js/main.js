var scene, renderer, currCamera, viewSize = 3/4;
var topCamera, perCamera, ballCamera, camera;
var controls;

var cannons = [], balls = [], wallSurface;
var cannonRadius = 5, cannonLength = 50, ballRadius = 5, wallLength = 100, wallHeight = 4*ballRadius;

var wallsColor = 0xff0000, ballsColor = 0xffffff, cannonsColor = 0x00ff00, selectedColor = 0x0000ff, backgroundColor = 0x000000;
var materials = [], leftLimit, rightLimit, distanceCannonWall = 100;
var wireframeOn = true, showAxis = true;

var width = window.innerWidth, height = window.innerHeight;
var timePrev = 0;
var deacceleration = 995/1000;

var movementFlags = {"moveLeft":0, "moveRight":0}, selectedCannon;
var angleMovement = Math.PI/180;

class Cannon extends THREE.Object3D {
    constructor(x, y, z, angle) {
        super();

        this.position.set(x, y+cannonRadius, z);
        var geometry = new THREE.CylinderGeometry(cannonRadius, cannonRadius*1.5, cannonLength, 64, 1);
        var material = new THREE.MeshBasicMaterial({color: cannonsColor, wireframe: true});
        materials.push(material);
        var mesh = new THREE.Mesh(geometry, material);
        mesh.rotateX(-Math.PI/2);
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

    moveLeft(leftLimit, delta) {
        var flag = (this.position.x -(Math.tan(this.rotation.y)*distanceCannonWall) ) >= leftLimit
        if (flag) this.rotateY(angleMovement*delta);
    }

    moveRight(rightLimit, delta) {
        var flag = (this.position.x -(Math.tan(this.rotation.y)*distanceCannonWall) ) <= rightLimit
        if (flag) this.rotateY(-angleMovement*delta);
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

    getLaunchPosition() {
        return this.getDirection().multiplyScalar(-cannonLength/2).add(this.position);
    }
}

class Ball extends THREE.Object3D {
    constructor() {
        super();
        var geometry = new THREE.SphereGeometry( ballRadius, 16, 16);
        var material = new THREE.MeshBasicMaterial({ color:0xffffff, wireframe: wireframeOn });
        materials.push(material);
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.setRotationFromEuler(this.mesh.rotation);
        this.axis = new THREE.AxesHelper(2*ballRadius);
        this.axis.visible = showAxis;
        this.mesh.add(this.axis);
        this.add(this.mesh);
        this.setVelocity(0,0,0);
    }

    setPosition(x, y, z) {
        this.position.set(x, y, z);
    }

    getPosition() {
        return this.position;
    }

    positionIncrease(delta) {
        var vector = this.velocity.clone().multiplyScalar(delta)
        if (vector.length()) this.position.add(vector);
    }

    setRotationY(rot) {
        this.rotation.y = rot;
        this.roty = rot;
    }

    getRotationY() {
        return this.roty;
    }

    increaseRotationX(delta) {
        var rot = this.getVelocity().z / 10 * delta;
        if (rot) this.rotateX(rot);
    }

    setVelocity(x, y, z) {
        this.velocity = new THREE.Vector3(x, y, z);
    }

    changeVelocityScalar(scalar, delta) {
        this.velocity.multiplyScalar(scalar**delta);
    }

    getVelocity() {
        return this.velocity;
    }

    setAxis(value) {
        this.axis.visible = value;
    }
}

class Walls extends THREE.Object3D {
    constructor(x, y, z) {
        super();
        var size = wallLength, heightSize = wallHeight;
        this.position.set(x, y, z-size);

        var material = new THREE.MeshBasicMaterial({color: wallsColor, wireframe: true});
        materials.push(material);
        var geometry = new THREE.BoxGeometry(2, heightSize, 2*size, 8, 8);

        //Left wall
        var meshLeft = new THREE.Mesh(geometry, material);
        meshLeft.position.set(x-size,y+heightSize/2,z);
        leftLimit = x-size+10;

        //Right wall
        var meshRight = new THREE.Mesh(geometry, material);
        meshRight.position.set(x+size,y+heightSize/2,z);
        rightLimit = x+size-10;

        //Center wall
        var meshCenter = new THREE.Mesh(geometry, material);
        meshCenter.position.set(x,y+heightSize/2,z-size);
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

    lookAtObject(pos) {
        this.lookAt(pos);
    }
}

function createPerspectiveCamera() {
    'use strict';

    camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 1, 1000);

    camera.position.x = 50;
    camera.position.y = 50;
    camera.position.z = 50;
    camera.lookAt(0,0,0);
}

function createcannon(x, y, z, angle, tag) {
    'use strict';
    var cannon = new Cannon(x, y, z, angle);
    cannons[tag] = cannon;
    scene.add(cannon);
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
        ball.setPosition(x, ballRadius, z);
        balls.push(ball);
        scene.add(ball);
    }
}

function createWalls(x, y, z) {
    'use strict';
    wallSurface = new Walls(x, y, z);
    scene.add(wallSurface);
}

function createScene() {
    'use strict';

    scene = new THREE.Scene();
    scene.add(new THREE.AxesHelper(100));

    //Plane for ground
    var geometry = new THREE.PlaneGeometry( 2*wallLength, 2*wallLength, 10, 10);
    var material = new THREE.MeshBasicMaterial( {color: 0x808080, side: THREE.DoubleSide} ); 
    var plane = new THREE.Mesh( geometry, material );
    plane.rotateX( - Math.PI / 2);
    plane.position.set(0, 0, -wallLength);
    scene.add( plane );

    //Creation of Models
    createcannon(50, 0, distanceCannonWall, Math.PI/16, "right");
    createcannon(0, 0, distanceCannonWall, 0, "center");
    createcannon(-50, 0, distanceCannonWall, -Math.PI/16, "left");
    selectedCannon = cannons["center"];
    selectedCannon.changeColor(selectedColor);

    createWalls(0,0,0);

    createFieldBalls(3, rightLimit, -(distanceCannonWall - 10));
    createFieldBalls(3, leftLimit, -(distanceCannonWall - 10));
}

function onResize() {
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

function onKeyDown(e) {
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
        case 81: //q - Select left cannon
            selectedCannon.changeColor(cannonsColor);
            selectedCannon = cannons["left"];
            selectedCannon.changeColor(selectedColor);
            break;
        case 87: //w - Select center cannon
            selectedCannon.changeColor(cannonsColor);
            selectedCannon = cannons["center"];
            selectedCannon.changeColor(selectedColor);
            break;
        case 69: //e - Select right cannon
            selectedCannon.changeColor(cannonsColor);
            selectedCannon = cannons["right"];
            selectedCannon.changeColor(selectedColor);
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
            if (selectedCannon.canShoot) {
                var ball = new Ball();
                var pI = selectedCannon.getLaunchPosition();
                ball.setPosition(pI.x, pI.y, pI.z);
                ball.setRotationY( selectedCannon.getRotY());
                var random = 1 + Math.random();
                ball.setVelocity(-Math.sin(selectedCannon.rotation.y) * random, 0, -Math.cos(selectedCannon.rotation.y) * random);
                balls.push(ball);
                selectedCannon.changeShooting(false);
                window.setTimeout(function() { selectedCannon.changeShooting(true); }, 1000);
                scene.add(ball);
            }
            break;
        default:
            //console.log(e.keyCode);
            break;
    }
}

function onKeyUp(e) {
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

function updatePosition(delta) {
    if (movementFlags["moveLeft"]) selectedCannon.moveLeft(leftLimit, delta);
    if (movementFlags["moveRight"]) selectedCannon.moveRight(rightLimit, delta);

    for (var i = 0; i < balls.length ; i++) {
        // Update Position
        balls[i].positionIncrease(delta);

        // Update Velocity
        balls[i].changeVelocityScalar(deacceleration, delta);

        // Update rotation
        balls[i].increaseRotationX(delta);
    }

    if (currCamera == ballCamera) {
        var ball = currCamera.getFollowingBall();
        var angle = ball.getRotationY();
        var rotX, rotZ;

        if (angle) {
            rotX = 30 * Math.sin(angle);
            rotZ = 30 * Math.cos(angle);
        }
        else {
            rotX = 0;
            rotZ = 30;
        }

        currCamera.setCameraPosition(ball.getPosition().x + rotX, ball.getPosition().y + 20, ball.getPosition().z + rotZ);
        currCamera.lookAtObject(ball.getPosition());
    }
}

function followBall(camera) {
    var random = Math.round(Math.random() * (balls.length - 1));
    var randomBall = balls[random];

    camera.setFollowingBall(randomBall);
    currCamera = camera;
}

function checkLimits() {
	for (var i = 0; i < balls.length; i++) {
		for (var j = i + 1; j < balls.length; j++) {
			if (Math.pow(ballRadius * 2, 2) >= distanceBalls(balls[i], balls[j])) {
                balls[i].velocity == Math.max(balls[i].velocity, balls[j].velocity)
                ? compute_intersection(balls[i], balls[j])
                : compute_intersection(balls[j], balls[i])
			}
		}
    }
}

function compute_intersection(fastBall, slowBall) {
    var velocity_aux = fastBall.velocity
    fastBall.velocity = slowBall.velocity
    slowBall.velocity = velocity_aux
}

function distanceBalls(thisBall, otherBall) {
	return (Math.pow(thisBall.getPosition().x - otherBall.getPosition().x, 2)
	 + Math.pow(thisBall.getPosition().z - otherBall.getPosition().z, 2))
}

function animate(time) {
    'use strict';
    var delta = (time - timePrev) / 10;

    controls.update();
    updatePosition(delta);
    checkLimits();
    render();

    timePrev = time;
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