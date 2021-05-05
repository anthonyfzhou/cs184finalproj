const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
//renderer.shadowMap.enabled = true;
document.body.appendChild( renderer.domElement );

// renderer.setClearColor( 0x87ceeb );

var lightsource = new THREE.DirectionalLight(0xFFFFFF, 2);
    lightsource.position.x = 6;
    lightsource.position.y = 6;
    lightsource.position.z = 6;
    lightsource.castShadow = true;
    scene.add(lightsource);


const plane_geo = new THREE.PlaneGeometry(5, 20, 32 );
const plane_material = new THREE.MeshBasicMaterial( {color: 0xc2b280, side: THREE.DoubleSide} );
const plane = new THREE.Mesh( plane_geo, plane_material );
//plane.receiveShadow = true;
plane.position.y = -4;
plane.scale.set(100, 1, 30);
//scene.add( plane );



const box_geo = new THREE.BoxGeometry(.1, .1, .1);
const material = new THREE.MeshLambertMaterial({color: 0xd3d3d3});
var cloud_parts = [];

const nx = 30;
const ny = 30;
const nz = 20;
										   
var pext = 0.9;//.5;
var phum = 0.1;//.5;
var pact = 0.001;//.5;



camera.position.z = nz*ny/2/Math.sqrt(((nx/2)*(nx/2)) + ((ny/2)*(ny/2)) + ((nz/2)*(nz/2)))/4;
camera.position.x = nx/2*ny/2/Math.sqrt(((nx/2)*(nx/2)) + ((ny/2)*(ny/2)) + ((nz/2)*(nz/2)))/12;
camera.position.y = ny/2*ny/2/Math.sqrt(((nx/2)*(nx/2)) + ((ny/2)*(ny/2)) + ((nz/2)*(nz/2)))/12;

camera.position.x = 0;
camera.position.y = 10;
camera.position.z = 3;

scene.add(new THREE.AxesHelper(50));

camera.lookAt(0,0,0);




// The Voxel class we use as the particles for the 
class Voxel {
   constructor(humid, activate, mat) {
      this.hum = humid;
      this.next_hum = humid;
      this.cld = false;
      this.next_cld = false;
      this.act = activate;
      this.next_act = activate;
      this.part = new THREE.Mesh(box_geo, mat);
      //this.part.castShadow = true;
      //this.part.receiveShadow = true;
      this.phum = 0;
      this.pext = 0;
      this.pact = 0;
      this.next_phum = 0;
      this.next_pext = 0;
      this.next_pact = 0;
      this.density= 0;
   }
}

class Ellipse {
   constructor(a, b, c, x_pos, y_pos, z_pos) {
      //a corresponds to x, b corresponds to y, c corresponds to z
      this.a = a;
      this.b = b;
      this.c = c;
      this.x_pos = x_pos;
      this.y_pos = y_pos;
      this.z_pos = z_pos;
   }
}

var boundary_Vox = new Voxel(false,false);

const update_humid = function (i, j ,k) {
   let pt = get_Voxel(i, j, k);
   var prob = Math.random();
   pt.next_hum = (pt.hum && !pt.act) || (prob < pt.phum);
};

const update_cld = function (i, j, k) {
   let pt = get_Voxel(i, j ,k);
   pt.next_cld = (pt.cld || pt.act);
	if (pt.next_cld) {
		var prob = Math.random();
		if (prob > pt.pext) {
			pt.next_cld = false;
		}
	}
};

const get_Voxel = function (i, j, k) {
   if ((i >= nx) || (i < 0) || (j >= ny) || (j < 0) || (k >= nz) || (k < 0)) {
      return boundary_Vox;
   }
   return cloud_parts[(nx*ny*k) + (nx*j) + i];
}

const dark_grey = new THREE.Color(0x222222);
const light_grey = new THREE.Color(0xd3d3d3);

// Velocity function-- said to be piecewise-linear
const velocity = function(z) {

   return 0;
   return Math.round(0.01*z);

   if (z >= 25) {
      return -Math.round(0.01 * z);;
   }

   if (z >= 17) {   
      return -Math.round(0.003 * z);
   }

   if (z >= 12) {   
      return Math.round(0.002 * z);
   }

   if (z >= 9) {   
      return Math.round(0.003 * z);
   }

   return Math.round(0.001 * z);

}


const advection_cld = function (i, j, k) {
   let pt = get_Voxel(i, j, k);

   if (i - velocity(j) > 0) {
      pt.cld = get_Voxel(i - velocity(j), j, k).next_cld;
   }
   else {
      pt.cld = 0;
   }  
};

const advection_hum = function (i, j, k) {
   let pt = get_Voxel(i, j, k);

   if (i - velocity(j) > 0) {
      pt.hum = get_Voxel(i - velocity(j), j, k).next_hum;
   }
   else {
      pt.hum = 0;
   }  
};

const advection_act = function (i, j, k) {
   let pt = get_Voxel(i, j, k);

   if (i - velocity(j) > 0) {
      pt.act = get_Voxel(i - velocity(j), j, k).next_act;
   }
   else {
      pt.act = 0;
   }  
};

const advection_prob = function (i, j, k) {
   let pt = get_Voxel(i, j, k);

   if (i - velocity(j) > 0) {
      pt.next_phum = get_Voxel(i - velocity(j), j, k).phum;
      pt.next_pact = get_Voxel(i - velocity(j), j, k).pact;
      pt.next_pext = get_Voxel(i - velocity(j), j, k).pext;
   }
   else {
      pt.next_phum = 0;
      pt.next_pact = 0;
      pt.next_pext = 0;
   }  
};


const f_act = function (i, j, k) {
   return ((get_Voxel(i+1, j, k).act) || (get_Voxel(i, j+1, k).act) || 
      (get_Voxel(i, j, k+1).act) || (get_Voxel(i-1, j, k).act) ||
      (get_Voxel(i, j, k - 1).act) || (get_Voxel(i, j - 1, k).act) ||
      (get_Voxel(i-2,j,k).act) || (get_Voxel(i+2, j, k).act) || 
      (get_Voxel(i, j-2, k).act) || (get_Voxel(i, j+2, k).act) ||
      (get_Voxel(i,j, k-2).act));
}

const update_act = function (i, j, k) {
   var prob = Math.random();
   get_Voxel(i,j,k).next_act = (!get_Voxel(i, j, k).act && get_Voxel(i,j,k).hum && f_act(i,j,k)) || (prob < get_Voxel(i,j,k).pact);
}

const density_weight = function(i, j, k) {
   let sum = 0;
   let tsum = 0;
   let i0 = 3;
   let j0 = 3;
   let k0 = 3;
   for (let iloop = -i0; iloop <= i0; iloop++) {
      for (let jloop = -j0; jloop <= j0; jloop++) {
         for (let kloop = -k0; kloop <= k0; kloop++) {
            let pt = get_Voxel(i+iloop, j+jloop, k+kloop);
            let cont = (iloop*iloop + jloop*jloop + kloop*kloop)/(i0*i0 + j0*j0 + k0*k0);
            if (pt.cld == true) {
               sum += (1-cont);
            }
            tsum += (1 - cont);
         }
      }
   }
   sum = sum/tsum;
   return sum;
}


const update_voxel = function (i,j,k) {
   let pt = get_Voxel(i,j,k);
	pt.density = density_weight(i, j, k);
   pt.phum = pt.next_phum;
   pt.pact = pt.next_pact;
   pt.pext = pt.next_pext;
	/*if (pt.cld == false) {
	   pt.part.material.opacity = 0;
	} else {
	   pt.part.material.opacity = 0.05;
	}*/
   
}

const update_color = function (i, j, k) {
   let pt = get_Voxel(i,j,k);
   let block = 0;
   for (let step = 0; step <= 20; step+=1) {
      block += get_Voxel(i+step, j+step, k+step).density;
   }
   block = Math.sqrt(block/5);
   pt.part.material.opacity = pt.density;
   pt.part.material.color.lerpColors(dark_grey, light_grey, 1*block);
}

const update_all = function () {
   for (let k = 0; k < nz; k++) {
      for (let j = 0; j < ny; j++) {
         for (let i = 0; i < nx; i++) {
            update_humid(i, j, k);
            update_act(i,j,k);
            update_cld(i,j,k);
            advection_cld(i,j,k);
            advection_act(i,j,k);
            advection_hum(i,j,k);
            advection_prob(i,j,k);
         }
      }
   }
   for (let k = 0; k < nz; k++) {
      for (let j = 0; j < ny; j++) {
         for (let i = 0; i < nx; i++) {
            update_voxel(i,j,k);
         }
      }
   }
   for (let k = 0; k < nz; k++) {
      for (let j = 0; j < ny; j++) {
         for (let i = 0; i < nx; i++) {
            update_color(i,j,k);
         }
      }
   }
}

const get_weight = function(e, i, j, k) {
   let rad = ((Math.pow(((i - e.x_pos)/e.a), 2)) + (Math.pow(((j - e.y_pos)/e.b), 2)) + (Math.pow(((k - e.z_pos)/e.c), 2)));
   if (rad <= 1) {
      return Math.sqrt(1-rad);
   } else {
      return 0;
   }
}





//store a nx by ny by nz array as a List
//row-major format (x is row, y is column), for each z-dir (closer plane stored earlier)

const scene_dim_x = 3;
const scene_dim_y = 5;


const x_offset = -0.1*nx/2;
const y_offset = -0.1*ny/2;
const z_offset = -0.1*nz/2;

var num_ellipses = 2;
var all_ellipses = [];

var min_a = nx/4;
var min_b = ny/4;
var min_c = nz/4;


var max_a = nx/2;
var max_b = ny/2;
var max_c = nz/2;
for (let i = 0; i < num_ellipses; i++) {
   all_ellipses.push(new Ellipse((max_a-min_a)*Math.random() + min_a, (max_b-min_b)*Math.random() + min_b, (max_c - min_c)*Math.random() + min_c, nx*Math.random(),ny*Math.random(),nz*Math.random()));
   //all_ellipses.push(new Ellipse(10, 10, 6, 10+ 18*i,10+ 18*i,10+10*i));
   console.log("ellipse", i, "position:", all_ellipses[i].x_pos, all_ellipses[i].y_pos, all_ellipses[i].z_pos, "Radius:", all_ellipses[i].a, all_ellipses[i].b, all_ellipses[i].c);
}




for (let k = 0; k < nz; k++) {
   for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
         hum = 0;
         act = 0;
         let mat = new THREE.MeshLambertMaterial({color: 0xd3d3d3});
         // TOGGLE THIS FOR PRETTY COLORS!!:
         // mat.color = new THREE.Color(i/nx, j/ny, k/nz); 
         mat.transparent = true;
         let vox = new Voxel(hum, act, mat);
         vox.part.position.set(x_offset + 0.1*i, y_offset + 0.1*j, z_offset + 0.1*k);
         vox.part.material.opacity = 0;

         for (let e = 0; e < num_ellipses; e++) {
            let wt = get_weight(all_ellipses[e], i, j, k);
            /*if (pext*wt > vox.pext) {
               vox.pext = pext*wt;
               vox.phum = phum*wt;
               vox.pact = pact*wt;
            }*/
            vox.pext += pext*wt;
            vox.phum += phum*wt;
            vox.pact += pact*wt;
            if (vox.pext > pext) {
               vox.pext = pext;
               vox.phum = phum;
               vox.pact = pact;
            }
         }


         cloud_parts.push(vox);
      }
   }
}




for (let i = 0; i < cloud_parts.length; i++) {
   scene.add(cloud_parts[i].part);
}





const animate = function () {
   update_all();
   
   renderer.render( scene, camera );
};

setInterval(animate, 500);
