const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );


const box_geo = new THREE.BoxGeometry(.1, .1, .1);
const material = new THREE.MeshBasicMaterial({color: 0xd3d3d3});
var cloud_parts = [];

const nx = 100;
const ny = 30;
const nz = 30;

class Voxel {
   constructor(humid, activate, mat) {
      this.hum = humid;
      this.next_hum = humid;
      this.cld = false;
      this.next_cld = false;
      this.act = activate;
      this.next_act = activate;
      this.part = new THREE.Mesh(box_geo, mat);
   }
}

var boundary_Vox = new Voxel(false,false);

const update_humid = function (i, j ,k) {
   let pt = get_Voxel(i, j, k);
   pt.next_hum = (pt.hum && !pt.act);
};

const update_cld = function (i, j, k) {
   let pt = get_Voxel(i, j ,k);
   pt.next_cld = (pt.cld || pt.act);
};

const get_Voxel = function (i, j, k) {
   if ((i >= nx) || (i < 0) || (j >= ny) || (j < 0) || (k >= nz) || (k < 0)) {
      return boundary_Vox;
   }
   return cloud_parts[(nx*ny*k) + (nx*j) + i];
}

const f_act = function (i, j, k) {
   return ((get_Voxel(i+1, j, k).act) || (get_Voxel(i, j+1, k).act) || 
      (get_Voxel(i, j, k+1).act) || (get_Voxel(i-1, j, k).act) ||
      (get_Voxel(i, j, k - 1).act) || (get_Voxel(i, j - 1, k).act) ||
      (get_Voxel(i-2,j,k).act) || (get_Voxel(i+2, j, k).act) || 
      (get_Voxel(i, j-2, k).act) || (get_Voxel(i, j+2, k).act) ||
      (get_Voxel(i,j, k-2).act));
}

const update_act = function (i, j, k) {
   get_Voxel(i,j,k).next_act = (!get_Voxel(i, j, k).act && get_Voxel(i,j,k).hum && f_act(i,j,k));
}


const update_all = function () {
   for (let k = 0; k < nz; k++) {
      for (let j = 0; j < ny; j++) {
         for (let i = 0; i < nx; i++) {
            update_humid(i, j, k);
            update_act(i,j,k);
            update_cld(i,j,k);
         }
      }
   }
   for (let i = 0; i < cloud_parts.length; i++) {
      let pt = cloud_parts[i];
      pt.act = pt.next_act;
      pt.cld = pt.next_cld;
      pt.hum = pt.next_hum;
      if (pt.cld == false) {
         pt.part.material.opacity = 0;
      } else {
         pt.part.material.opacity = 0.02;
         
      }
   }
}



//store a nx by ny by nz array as a List
//row-major format (x is row, y is column), for each z-dir (closer plane stored earlier)

const scene_dim_x = 3;
const scene_dim_y = 5;


const x_offset = -0.1*nx/2;
const y_offset = -0.1*ny/2;
const z_offset = -0.1*nz/2;


for (let k = 0; k < nz; k++) {
   for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
         let hum = Math.random();
         if (hum > 0.7) {
            hum = true;
         } else {
            hum = false;
         }
         let act = Math.random();
         if (act > 0.97) {
            act = true;
         } else {
            act = false;
         }
         let mat = new THREE.MeshBasicMaterial({color: 0xd3d3d3});
         mat.transparent = true;
         let vox = new Voxel(hum, act, mat);
         vox.part.position.set(x_offset + 0.1*i, y_offset + 0.1*j, z_offset + 0.1*k);
         vox.part.material.opacity = 0;

         cloud_parts.push(vox);
      }
   }
}

for (let i = 0; i < cloud_parts.length; i++) {
   scene.add(cloud_parts[i].part);
}

camera.position.z = nz/2*ny/2/Math.sqrt(((nx/2)*(nx/2)) + ((ny/2)*(ny/2)) + ((nz/2)*(nz/2)));
camera.position.x = nx/2*ny/2/Math.sqrt(((nx/2)*(nx/2)) + ((ny/2)*(ny/2)) + ((nz/2)*(nz/2)));
camera.position.y = ny/2*ny/2/Math.sqrt(((nx/2)*(nx/2)) + ((ny/2)*(ny/2)) + ((nz/2)*(nz/2)));;
camera.lookAt(0,0,0);

const animate = function () {
   update_all();

   renderer.render( scene, camera );
};

setInterval(animate, 300);
