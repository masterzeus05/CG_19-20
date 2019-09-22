var scene, renderer;
var topCamera, LateralCamera, FrontCamera, camera;
var currCamera;
var viewSize = 1;

var cube;

function createTopCamera(){
    'use strict';
    var width = window.innerWidth;
    var height = window.innerHeight;
    topCamera = new THREE.OrthographicCamera( width / - 2 * viewSize, width / 2 * viewSize, height / 2 * viewSize, height / - 2 * viewSize, 1, 1000 );

    topCamera.position.x = 0;
    topCamera.position.y = 0;
    topCamera.position.z = 50;
    topCamera.lookAt(0,0,0);
}

function createCamera(){
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

function createCube(x,y,z){
    'use strict';
    cube = new THREE.Object3D();

    var material = new THREE.MeshBasicMaterial({color: 0xff0000, wireframe: true});
    var geometry = new THREE.BoxGeometry(30,30,30);
    var mesh = new THREE.Mesh(geometry, material);

    cube.add(mesh);
    cube.position.set(x,y,z);

    scene.add(cube);
}

function createScene(){
    'use strict';

    scene = new THREE.Scene();
    scene.add(new THREE.AxesHelper(100));

    createCube(0,0,0);
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

function animate(){
    'use strict';

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
    renderer.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(renderer.domElement);

    createScene();
    createCamera();
    createTopCamera();

    currCamera = camera;
    render();

    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKeyDown);
}