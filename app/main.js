const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );
										   
										   
const geometry = new THREE.BoxGeometry(.1, .1, .1);
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );
										   
const geometry1 = new THREE.BoxGeometry(.1, .1, .1);
const material1 = new THREE.MeshBasicMaterial( { color: 0x002fff } );
const cube1 = new THREE.Mesh( geometry1, material1 );
cube1.position.x = .1;
scene.add( cube1 );

camera.position.z = 5;
										   
function animate() {
   requestAnimationFrame( animate );
   cube.rotation.x += 0.01;
   cube.rotation.y += 0.01;
	
   cube1.rotation.x += 0.01;
   cube1.rotation.y += 0.01;
   // update time step
   // determine
   renderer.render( scene, camera );
}
animate();