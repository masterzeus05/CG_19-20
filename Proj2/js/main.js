var scene, renderer, currCamera, viewSize = 4/5;
var topCamera, perCamera, ballCamera, camera;
var controls;

var cannons = [], balls = [], wallSurface;
var cannonRadius = 5, cannonLength = 50, ballRadius = 5, wallLength = 100, wallHeight = 4*ballRadius;

var wallsColor = 0xff0000, ballsColor = 0xffffff, cannonsColor = 0x00ff00, selectedColor = 0x0000ff, backgroundColor = 0x000000;
var materials = [], leftLimit, rightLimit, distanceCannonWall = 100;
var wireframeOn = true, showAxis = true;
var nullVector = new THREE.Vector3(0, 0, 0);

var width = window.innerWidth, height = window.innerHeight, oldWidth = width, oldHeight = height;
var timePrev = 0;
var deacceleration = 995/1000;

let COR = 0.75, stopVelocity = 0.001

var movementFlags = {"moveLeft":0, "moveRight":0, "shooting": 0}, selectedCannon;
var angleMovement = Math.PI/360;

class Cannon extends THREE.Object3D {
    constructor(x, y, z, angle) {
        super();

        this.position.set(x, y+cannonRadius, z);
        var geometry = new THREE.CylinderGeometry(cannonRadius, cannonRadius*1.5, cannonLength, 64, 1);
        var material = new THREE.MeshBasicMaterial({color: cannonsColor, wireframe: true});
        materials.push(material);
        var mesh = new THREE.Mesh(geometry, material);
        this.add(mesh);
        mesh.rotateX(-Math.PI/2);
        this.rotateY(angle);
        this.mesh = mesh;
        this.canShoot = true;
        this._direction = new THREE.Vector3(Math.sin(this.rotation.y),0,1);

    }

    getDirection(){
        return new THREE.Vector3(this._direction.x, this._direction.y, this._direction.z)
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
        var aux = angleMovement*delta;
        var flag = (this.position.x -(Math.tan(this.rotation.y+aux)*distanceCannonWall) ) >= leftLimit
        if (flag) {
            this.rotateY(aux);
            this._direction.set(Math.sin(this.rotation.y+aux), 0, Math.cos(this.rotation.y));
        }
    }

    moveRight(rightLimit, delta) {
        var aux = -angleMovement*delta;
        var flag = (this.position.x -(Math.tan(this.rotation.y+aux)*distanceCannonWall) ) <= rightLimit
        if (flag) {
            this.rotateY(aux);
            this._direction.set(Math.sin(this.rotation.y), 0, Math.cos(this.rotation.y));
        }
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
        this.velocity = nullVector;
        this.canFall = false;

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
    }

    saveRealRotY(value) {
        this.roty = value;
    }

    getRotationY() {
        return this.roty;
    }

    increaseRotationX(delta) {
        var rot = this.getVelocity().z / 10 * delta;
        if (rot) this.rotateX(rot);
    }

    increaseRotationZ(delta) {
        var rot = this.getVelocity().z / 10 * delta;
        if (rot) this.rotateZ(rot);
    }

    setVelocity(x, y, z) {
        this.velocity = new THREE.Vector3(x, y, z);
    }

    changeVelocityScalar(scalar, delta) {
        if (this.velocity != nullVector) this.velocity.multiplyScalar(scalar**delta);

        if (Math.abs(this.velocity.x) < stopVelocity
            && Math.abs(this.velocity.z) < stopVelocity) {
            this.velocity = nullVector;
        }
    }

    getVelocity() {
        return this.velocity;
    }

    setAxis(value) {
        this.axis.visible = value;
    }

    getCanFall() {
        return this.canFall;
    }

    setCanFall(value) {
        this.canFall = value;
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
        leftLimit = x - size;

        //Right wall
        var meshRight = new THREE.Mesh(geometry, material);
        meshRight.position.set(x+size,y+heightSize/2,z);
        rightLimit = x + size;

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

    createFieldBalls(3, rightLimit - ballRadius, -(distanceCannonWall - ballRadius));
    createFieldBalls(3, leftLimit + ballRadius, -(distanceCannonWall - ballRadius));
}

function onResize() {
    'use strict';
    renderer.setSize(window.innerWidth, window.innerHeight);
    var windowVector = new THREE.Vector3(0,0,0);
    renderer.getSize(windowVector);
    width = windowVector.x, height = windowVector.y;
    var angle = oldWidth/oldHeight;

    if (window.innerHeight > 0 && window.innerWidth > 0){
    
        if (width != oldWidth) {
            if (width>oldWidth) viewSize /= (1.01**angle);
            else viewSize *= (1.01**angle);
        }

        if (height != oldHeight) {
            if (height>oldHeight) viewSize /= (1.01**angle);
            else viewSize *= (1.01**angle);
        }
        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        topCamera.left = width / -2 * viewSize;
        topCamera.right = -topCamera.left;
        topCamera.top = height / 2 * viewSize;
        topCamera.bottom = -topCamera.top;
        topCamera.updateProjectionMatrix();

        if (width > oldWidth) perCamera.fov -= Math.atan(angle);
        else if (width < oldWidth) perCamera.fov += Math.atan(angle);
        perCamera.aspect = width / height;
        perCamera.updateProjectionMatrix();


        if (width > oldWidth) ballCamera.fov -= Math.atan(angle);
        else if (width < oldWidth) ballCamera.fov += Math.atan(angle);
        ballCamera.aspect = width / height;
        ballCamera.updateProjectionMatrix();
        renderer.setSize(width, height);
    }
    oldWidth = width; oldHeight = height;
}

function onKeyDown(e) {
    'use strict';

    switch(e.keyCode){
        case 48: //0 - Default Camera
            //console.log("Default camera activates!");
            currCamera = camera;
            break;
        case 49: //1 - Top Camera
            //console.log("TopCamera activates!");
            currCamera = topCamera;
            break;
        case 50: //2 - Lateral Camera
            //console.log("perCamera activates!");
            currCamera = perCamera;
            break;
        case 51: //3 - Front Camera
            //console.log("ballCamera activates!");
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
                movementFlags["shooting"] = 1;
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
        case 32:
            movementFlags["shooting"] = 0;
            break;
        default:
            //console.log(e.keyCode);
            break;
    }
}

function createBall() {
    var ball = new Ball();
    var pI = selectedCannon.getLaunchPosition();
    ball.setPosition(pI.x, pI.y, pI.z);
    var random = 2 + Math.random();
    ball.setVelocity(-Math.sin(selectedCannon.getRotY()) * random, 0, -Math.cos(selectedCannon.getRotY()) * random);

    var rotY = Math.acos(ball.getVelocity().x/ball.getVelocity().length());
    ball.setRotationY(rotY);
    if (rotY > Math.PI / 2) rotY = rotY - Math.PI / 2;
    else rotY = -(Math.PI / 2 - rotY);
    ball.saveRealRotY(rotY);

    balls.push(ball);
    selectedCannon.changeShooting(false);
    var cannonToChange = selectedCannon;
	window.setTimeout(function() { cannonToChange.changeShooting(true) }, 500);
    scene.add(ball);
}

function updatePosition(delta) {
    if (movementFlags["moveLeft"]) selectedCannon.moveLeft(leftLimit, delta);
    if (movementFlags["moveRight"]) selectedCannon.moveRight(rightLimit, delta);
    if (movementFlags["shooting"] && selectedCannon.canShoot) createBall();

    for (var i = 0; i < balls.length ; i++) {
        var currentBall = balls[i];

        if (currentBall.getPosition().z <= 0) {
            currentBall.setCanFall(true);
        }

        // Check if the ball should be removed
        if ((currentBall.getPosition().z > 0 && currentBall.getCanFall()) ||
            (currentBall.getPosition().z > 0 && currentBall.getVelocity() == nullVector)) {
            scene.remove(currentBall);
            balls.splice(i, 1);
        }

        // Update Position
        currentBall.positionIncrease(delta);

        // Update Velocity
        currentBall.changeVelocityScalar(deacceleration, delta);

        // Update rotation
        currentBall.increaseRotationZ(delta);
    }

    if (currCamera == ballCamera) {
        var ball = currCamera.getFollowingBall();
        var angle = ball.getRotationY();
        var rotX, rotZ;

        if (angle) {
            console.log(angle * 180 / Math.PI);
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
    var ball = balls[balls.length - 1];

    camera.setFollowingBall(ball);
    currCamera = camera;
}

function checkLimits() {
	for (var i = 0; i < balls.length; i++) {
        var currentBall = balls[i];
        var velocity = currentBall.getVelocity()
        var position = currentBall.getPosition()

        // Check for collision with another ball
		for (var j = i + 1; j < balls.length; j++) {
            var mag = Math.pow(ballRadius * 2, 2) - distanceBalls(currentBall, balls[j])
			if (mag >= 0) {
                velocity == Math.max(velocity, balls[j].getVelocity())
                ? compute_Ballintersection(mag, currentBall, balls[j])
                : compute_Ballintersection(mag, balls[j], currentBall);
			}

		}

        // Check for collision with a wall
        var d
        if ((d = position.x - leftLimit - ballRadius) < 0) {
            // Left wall collision
            currentBall.setVelocity(-velocity.x * COR, velocity.y, velocity.z)
            currentBall.setPosition(position.x - d, position.y, position.z)
            var rotY = Math.acos(currentBall.getVelocity().x/currentBall.getVelocity().length());
            currentBall.setRotationY(Math.PI -rotY);
            if (currentBall.getVelocity().z < 0) currentBall.saveRealRotY(rotY - Math.PI / 2);
            else currentBall.saveRealRotY(-rotY - Math.PI / 2);
        }

        else if ((d = position.x - rightLimit + ballRadius) > 0) {
            // Right wall collision
            currentBall.setVelocity(-velocity.x * COR, velocity.y, velocity.z)
            currentBall.setPosition(position.x - d, position.y, position.z)
            var rotY = Math.acos(currentBall.getVelocity().x/currentBall.getVelocity().length());
            currentBall.setRotationY(rotY);
            if (currentBall.getVelocity().z < 0) currentBall.saveRealRotY(rotY - Math.PI / 2);
            else currentBall.saveRealRotY(-rotY - Math.PI / 2)
        }

        else if ((d = position.z + 2 * wallLength - ballRadius) < 0) {
            // Center wall collision
            currentBall.setVelocity(velocity.x, velocity.y, -velocity.z * COR)
            currentBall.setPosition(position.x, position.y, position.z - d)
            var rotY = Math.acos(currentBall.getVelocity().x/currentBall.getVelocity().length());
            if (currentBall.getVelocity().x > 0) currentBall.setRotationY(-rotY + Math.PI);
            else currentBall.setRotationY(rotY);
            currentBall.saveRealRotY(-rotY - Math.PI / 2);
        }
    }
}

function collisionAngle(ball1, ball2) {
    return Math.atan2(ball2.position.z - ball1.position.z,
        ball2.position.x - ball1.position.x)
}

/*
function compute_Ballintersection(mag, fastBall, slowBall) {

    // Calculate new position

    var d = Math.sqrt(mag) / 2
    var angle = collisionAngle(fastBall, slowBall)
    console.log("angle: " + angle);
    var x = d * Math.cos(angle)
    var z = d * Math.sin(angle)

    slowBall.setPosition(
        slowBall.position.x + x,
        slowBall.position.y,
        slowBall.position.z + z
    )

    fastBall.setPosition(
        fastBall.position.x - x,
        fastBall.position.y,
        fastBall.position.z - z
    )

    // TODO verify new position

    // Calculate new velocities

    var fastBallVelocity = fastBall.getVelocity()
    var slowBallVelocity = slowBall.getVelocity()

    var velocity = fastBallVelocity.length()

    var finalVelocityA = [0, 0, 0]
    finalVelocityA[0] = (COR * (slowBallVelocity.x - fastBallVelocity.x)
        + fastBallVelocity.x + slowBallVelocity.x) / 2
    finalVelocityA[2] = (COR * (slowBallVelocity.z - fastBallVelocity.z)
        + fastBallVelocity.z + slowBallVelocity.z) / 2

    var finalVelocityB = [velocity * Math.cos(angle), 0, velocity * Math.sin(angle)]

    fastBall.setVelocity(finalVelocityA[0], finalVelocityA[1], finalVelocityA[2])
    slowBall.setVelocity(finalVelocityB[0], finalVelocityB[1], finalVelocityB[2])

    if (slowBall.getVelocity().length() != 0) {
        var rotY = Math.acos(slowBall.getVelocity().x/slowBall.getVelocity().length());
        if (slowBall.getVelocity().z > 0) rotY = -rotY;
        slowBall.setRotationY(rotY);
        console.log("slowball: " + rotY * 180 / Math.PI);

        slowBall.setRotationY(rotY);
        console.log("x: " + slowBall.getVelocity().x + " z: " + slowBall.getVelocity().z);
    }

    if (fastBall.getVelocity().length() != 0) {
        var rotY = Math.acos(fastBall.getVelocity().x/fastBall.getVelocity().length());
        if (fastBall.getVelocity().z > 0) rotY = -rotY
        
        fastBall.setRotationY(rotY);
        console.log("fastball: " + rotY * 180 / Math.PI);
        
        console.log("x: " + fastBall.getVelocity().x + " z: " + fastBall.getVelocity().z);
    }
}
*/

function compute_Ballintersection(mag, b1, b2) {

    // Calculate new positions
    var d = Math.sqrt(mag) / 2
    var angle = collisionAngle(b1, b2)
    var x = d * Math.cos(angle)
    var z = d * Math.sin(angle)

    b1.setPosition(
        b1.position.x - x,
        b1.position.y,
        b1.position.z - z
    )

    b2.setPosition(
        b2.position.x + x,
        b2.position.y,
        b2.position.z + z
    )

    // TODO verify new position

    // Calculate new velocities
    // STEP #1 - normalize relevant vectors
    var collisionVec = new THREE.Vector3(
        b2.position.x - b1.position.x,
        b2.position.y - b1.position.y,
        b2.position.z - b1.position.z
    ).normalize()
  
    /*
    var collisionMag = Math.sqrt(
        collisionVec.x * collisionVec.x
        + collisionVec.y * collisionVec.y
        + collisionVec.z * collisionVec.z
    )
    collisionVec.divideScalar(collisionMag)
    */

    var tangent = new THREE.Vector3(
        -collisionVec.z,
        collisionVec.y,
        collisionVec.x
    )

    var velocityA = Math.sqrt(
        b1.velocity.x * b1.velocity.x
        + b1.velocity.y * b1.velocity.y
        + b1.velocity.z * b1.velocity.z
    )

    /*
    var normedVelocityA = b1.getVelocity()
    normedVelocityA.divideScalar(velocityA)
    */

    var normedVelocityA = b1.getVelocity().normalize()
    angle = tangent.angleTo(normedVelocityA)


    // STEP #2 - compute new velocities
    var finalVelocity

    finalVelocity = tangent
    finalVelocity.multiplyScalar(velocityA * Math.cos(angle))
    b1.setVelocity(
        finalVelocity.x,
        finalVelocity.y,
        finalVelocity.z
    )
    
    finalVelocity = collisionVec
    finalVelocity.multiplyScalar(velocityA * Math.sin(angle))
    b2.setVelocity(
        finalVelocity.x,
        finalVelocity.y,
        finalVelocity.z
    )

    // Calculate new rotations
    if (b2.getVelocity().length() != 0) {
        var rotY = Math.acos(b2.getVelocity().x / b2.getVelocity().length());
        if (b2.getVelocity().z > 0) rotY = -rotY;
        b2.setRotationY(rotY);
        //console.log("slowball: " + rotY * 180 / Math.PI);
        //console.log("x: " + b2.getVelocity().x + " z: " + b2.getVelocity().z);
    }

    if (b1.getVelocity().length() != 0) {
        var rotY = Math.acos(b1.getVelocity().x / b1.getVelocity().length());
        if (b1.getVelocity().z > 0) rotY = -rotY
        
        b1.setRotationY(rotY);
        //console.log("fastball: " + rotY * 180 / Math.PI);
        //console.log("x: " + b1.getVelocity().x + " z: " + b1.getVelocity().z);
    }
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
    perCamera = new PerCamera(0, 200, 100, 0, 0, 0);
    ballCamera = new PerCamera(0, 30, 200, 0, 0, 0);


    currCamera = camera;
    render();

    controls = new THREE.OrbitControls( currCamera, renderer.domElement );
    controls.update();

    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
}