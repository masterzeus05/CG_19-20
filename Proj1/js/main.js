var scene, renderer;
var topCamera, LateralCamera, FrontCamera, camera;
var currCamera;
var viewSize = 1/4;

var baseGroup, cube;

var robotColor = 0xff0000;

var controls; //WRONG

function createTopCamera(){
    'use strict';
    var width = window.innerWidth;
    var height = window.innerHeight;
    topCamera = new THREE.OrthographicCamera( width / - 2 * viewSize, width / 2 * viewSize, height / 2 * viewSize, height / - 2 * viewSize, 1, 100 );

    topCamera.position.x = 0;
    topCamera.position.y = 50;
    topCamera.position.z = 0;
    topCamera.lookAt(0,0,0);
}

function createCamera(){ //WRONG
    'use strict';

    camera = new THREE.PerspectiveCamera(70,
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

    baseGroup = new THREE.Object3D();

    baseGroup.add(new THREE.Mesh(new THREE.BoxGeometry(30,10,50, 16,16,16), new THREE.MeshBasicMaterial({color: robotColor, wireframe: true})));
    baseGroup.position.set(x,y,z);

    for (let i=0; i<4; i+=1){
        var geometry = new THREE.SphereGeometry( 5, 16, 16 );
        var material = new THREE.MeshBasicMaterial( {color: robotColor, wireframe:true} );
        var sphere = new THREE.Mesh( geometry, material );

        var positions = [[-10,20],[10,-20],[-10,-20],[10,20]]
        sphere.position.set( positions[i][0], -10, positions[i][1]);
        baseGroup.add(sphere);
    }

    var geometry = new THREE.SphereGeometry( 10, 16, 16, 0, 2*Math.PI, 0, 0.5*Math.PI );
    var material = new THREE.MeshBasicMaterial( {color: robotColor, wireframe:true} );
    var sphere = new THREE.Mesh( geometry, material );
    sphere.position.set( 0, 5, 0);
    baseGroup.add(sphere);

    scene.add(baseGroup);
}

function createRobotArm(objBasis, x,y,z){ //TODO

}

function createCube(x,y,z, w, h, d){ //WRONG, for testing
    'use strict';
    cube = new THREE.Object3D();

    var material = new THREE.MeshBasicMaterial({color: 0xff0000, wireframe: true});
    var geometry = new THREE.BoxGeometry(w,h,d);
    var mesh = new THREE.Mesh(geometry, material);

    cube.add(mesh);
    cube.position.set(x,y,z);

    var newcube = new THREE.Object3D()
    material = new THREE.MeshBasicMaterial({color: 0xff0000, wireframe: true});
    geometry = new THREE.BoxGeometry(w/2,h/2,d/2);
    var mesh = new THREE.Mesh(geometry, material);
    
    newcube.add(mesh)
    newcube.position.set(x,y,z);
    cube.add(newcube);

    scene.add(cube);
}

function createScene(){
    'use strict';

    scene = new THREE.Scene();
    scene.add(new THREE.AxesHelper(100));

    //Plane for help
    var geometry = new THREE.PlaneGeometry( 100, 100, 32 );
    var material = new THREE.MeshBasicMaterial( {color: 0x0800a6, side: THREE.DoubleSide} ); 
    var plane = new THREE.Mesh( geometry, material );
    plane.rotateX( - Math.PI / 2); 
    scene.add( plane );

    //Creation of Models
    createCube(5,5,50,10,10,10); //WRONG, just for testing
    createRobotBasis(0,15,0);
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

        //LateralCamera.aspect = renderer.getSize().width / renderer.getSize().height;
        //LateralCamera.updateProjectionMatrix();

        //FrontCamera.aspect = renderer.getSize().width / renderer.getSize().height;
        //FrontCamera.updateProjectionMatrix();
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
            break;
        case 51: //3 - Front Camera
            break;
        case 52: //4 - Wireframe toggle
            scene.traverse(function (node){
                if (node instanceof THREE.Mesh){
                    node.material.wireframe = !node.material.wireframe;
                }
            });
            break;
        case 65: //a - Angle O1
            break;
        case 83: //s - Angle O1
            break;
        case 81: //q - Angle O2
            break;
        case 87: //w - Angle O2
            break;
        case 37: // < - Move left
            break;
        case 39: // > - Move right
            break;
        case 38: // /\ - Move up
            break;
        case 40: // \/ - Move down
            break;
        default:
            console.log(e.keyCode);
            break;
    }
}

var i=0
function animate(){
    'use strict';

    controls.update();
    render();
    cube.position.x = Math.cos(i/20)*30 //WRONG

    baseGroup.position.x = Math.cos(i/40)*35
    i+=1;
    if (i>40*2*Math.PI) i=0;

    requestAnimationFrame(animate);
}

function render(){
    'use strict';
    renderer.render(scene, currCamera);
}

function init(){
    'use strict';

    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(renderer.domElement);

    createScene();
    createCamera(); //WRONG
    createTopCamera();

    currCamera = camera;
    render();

    controls = new THREE.OrbitControls( currCamera, renderer.domElement );
    controls.update();

    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKeyDown);
}