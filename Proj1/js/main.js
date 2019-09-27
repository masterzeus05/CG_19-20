var scene, renderer;
var topCamera, lateralCamera, frontCamera, camera;
var currCamera, controls;
var viewSize = 1/4;

var robot, target;
var arm, armBase;
var robotColor = 0xff0000;
var movement = new THREE.Vector3();

var width = window.innerWidth;
var height = window.innerHeight;

var left = false, right = false, up = false, down = false;
var rotateBasePos = false, rotateBaseNeg = false, rotateArmPos = false, rotateArmNeg = false;

function createTopCamera(){
    'use strict';
    topCamera = new THREE.OrthographicCamera( width / - 2 * viewSize, width / 2 * viewSize, height / 2 * viewSize, height / - 2 * viewSize, 1, 200 );

    topCamera.position.x = 0;
    topCamera.position.y = 100;
    topCamera.position.z = 0;
    topCamera.lookAt(0,0,0);
}

function createLateralCamera(){
    'use strict';
    lateralCamera = new THREE.OrthographicCamera( width / - 2 * viewSize, width / 2 * viewSize, height / 2 * viewSize, height / - 2 * viewSize, 1, 100 );

    lateralCamera.position.x = 50;
    lateralCamera.position.y = 30;
    lateralCamera.position.z = 0;
    lateralCamera.lookAt(0,30,0);
}

function createFrontalCamera(){
    'use strict';
    frontCamera = new THREE.OrthographicCamera( width / - 2 * viewSize, width / 2 * viewSize, height / 2 * viewSize, height / - 2 * viewSize, 1, 100 );

    frontCamera.position.x = 0;
    frontCamera.position.y = 30;
    frontCamera.position.z = 50;
    frontCamera.lookAt(0,30,0);
}


function createCamera(){ //WRONG
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

function createRobotBasis(x,y,z){ //Completed
    'use strict';

    robot = new THREE.Object3D();

    robot.add(new THREE.Mesh(new THREE.BoxGeometry(30,6,50, 8,8,8), new THREE.MeshBasicMaterial({color: robotColor, wireframe: true})));
    robot.position.set(x,y,z);

    var positions = [[-10,20],[10,-20],[-10,-20],[10,20]];
    for (let i=0; i<4; i+=1){
        var geometry = new THREE.SphereGeometry( 5, 16, 16 );
        var material = new THREE.MeshBasicMaterial( {color: 0x797979, wireframe:true} );
        var sphere = new THREE.Mesh( geometry, material );

        sphere.position.set( positions[i][0], -8, positions[i][1]);
        robot.add(sphere);
    }

    var geometry = new THREE.SphereGeometry( 6, 16, 16, 0, 2*Math.PI, 0, 0.5*Math.PI );
    var material = new THREE.MeshBasicMaterial( {color: 0x797979, wireframe:true} );
    armBase = new THREE.Mesh( geometry, material );
    armBase.position.set( 0, 3, 0);
    robot.add(armBase);
    movement = robot.getWorldDirection(movement);

    scene.add(robot);
}

function createRobotArm(objBasis, x,y,z){ //TODO
    'use strict';

    arm = new THREE.Object3D();

    // forearm
    var geometry = new THREE.BoxGeometry( 3, 23, 3, 1,1,1);
    var material = new THREE.MeshBasicMaterial( {color: 0x797979, wireframe:true} );
    var forearm = new THREE.Mesh( geometry, material );
    forearm.position.set(0, 17, 0);
    arm.add(forearm);
    
    // arm
    var geometry = new THREE.BoxGeometry( 3, 3, 19, 1,1,1);
    var material = new THREE.MeshBasicMaterial( {color: 0x797979, wireframe:true} );
    var _arm = new THREE.Mesh( geometry, material );
    _arm.position.set(0, 30, -11);
    arm.add(_arm);

    // hand
    var geometry = new THREE.BoxGeometry( 6, 6, 1, 1,1,1);
    var material = new THREE.MeshBasicMaterial( {color: 0x797979, wireframe:true} );
    var hand = new THREE.Mesh( geometry, material );
    hand.position.set(0, 30, -25);
    arm.add(hand);

    // fingers
    var finger_positions = [28,32];
    for (let i=0; i<2; i+=1){
        var geometry = new THREE.BoxGeometry( 1, 1, 5, 1,1,1);
        var material = new THREE.MeshBasicMaterial( {color: 0x797979, wireframe:true} );
        var finger = new THREE.Mesh( geometry, material );
        finger.position.set( 0, finger_positions[i], -27);
        arm.add(finger);
    }

    // articulation + hand support
    var positions = [0,-22];
    for (let i=0; i<2; i+=1){
        var geometry = new THREE.SphereGeometry( 3, 16, 16 );
        var material = new THREE.MeshBasicMaterial( {color: 0x797979, wireframe:true} );
        var support = new THREE.Mesh( geometry, material );
        support.position.set(0, 30 , positions[i]);
        arm.add(support);
    }
    
    objBasis.add(arm);
}

function createTarget(x, y, z) {
	'use strict';

	target = new THREE.Object3D();
    target.position.set(x,y,z);
    
    target.add(new THREE.Mesh(new THREE.CylinderGeometry( 5, 5, 38, 32 ), new THREE.MeshBasicMaterial({color: robotColor, wireframe: true})));
  
    // torus
    var geometry = new THREE.TorusGeometry(4, 1, 16, 50);
    var material = new THREE.MeshBasicMaterial( {color: 0x797979, wireframe:true} );
    var torus = new THREE.Mesh( geometry, material );
    torus.position.set(0, 24, 0);
    target.add(torus);

    scene.add(target);
}

function createScene(){
    'use strict';

    scene = new THREE.Scene();
    scene.add(new THREE.AxesHelper(100));

    //Plane for help
    var geometry = new THREE.PlaneGeometry( 100, 100, 32 );
    var material = new THREE.MeshBasicMaterial( {color: 0xffffff, side: THREE.DoubleSide} ); 
    var plane = new THREE.Mesh( geometry, material );
    plane.rotateX( - Math.PI / 2);
    plane.position.set(0, 2, 0);
    scene.add( plane );

    //Creation of Models
    createRobotBasis(0,15,0);
    createRobotArm(armBase, 0, 0, 0);
    createTarget(0, 21, -40);
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
        case 48: //0 - Default Camera (WRONG)
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
            scene.traverse(function (node){
                if (node instanceof THREE.Mesh){
                    node.material.wireframe = !node.material.wireframe;
                }
            });
            break;
        case 65: //a - Angle O1
            rotateBasePos = true;
            break;
        case 83: //s - Angle O1
            rotateBaseNeg = true;
            break;
        case 81: //q - Angle O2
            rotateArmPos = true;
            break;
        case 87: //w - Angle O2
            rotateArmNeg = true;
            break;
        case 37: // < - Move left
            left = true;
            break;
        case 39: // > - Move right
            right = true;
            break;
        case 38: // /\ - Move up
            up = true;
            break;
        case 40: // \/ - Move down
            down = true;
            break;
        default:
            console.log(e.keyCode);
            break;
    }
}

function onKeyUp(e){
    'use strict';

    switch(e.keyCode){
        case 65: //a - Angle O1
            rotateBasePos = false;
            break;
        case 83: //s - Angle O1
            rotateBaseNeg = false;
            break;
        case 81: //q - Angle O2
            rotateArmPos = false;
            break;
        case 87: //w - Angle O2
            rotateArmNeg = false;
            break;
        case 37: // < - Move left
            left = false;
            break;
        case 39: // > - Move right
            right = false;
            break;
        case 38: // /\ - Move up
            up = false;
            break;
        case 40: // \/ - Move down
            down = false;
            break;
        default:
            //console.log(e.keyCode);
            break;
    }
}

function moveRobot() {
    if (left) {
        robot.rotateY(0.1);
        movement = robot.getWorldDirection(movement);
    } 
    if (right) {
        robot.rotateY(-0.1);
        movement = robot.getWorldDirection(movement);
    }
    if (up) robot.position.add(movement.clone().negate());
    if (down) robot.position.add(movement);
    if (rotateBasePos) armBase.rotateY(0.1);
    if (rotateBaseNeg) armBase.rotateY(-0.1);
    if (rotateArmPos && arm.rotation.x <= Math.PI*4/9) arm.rotateX(0.1);
    if (rotateArmNeg  && arm.rotation.x >= -Math.PI/3) arm.rotateX(-0.1);
}

function animate(){
    'use strict';

    controls.update();
    render();
    moveRobot();

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
    createCamera(); //WRONG
    createTopCamera();
    createLateralCamera();
    createFrontalCamera();

    currCamera = camera;
    render();

    controls = new THREE.OrbitControls( currCamera, renderer.domElement );
    controls.update();

    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
}