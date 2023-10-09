import {loadGLTF, loadVideo} from "../../libs/loader.js";
// import {mockWithVideo} from '../../libs/camera-mock';
import {createChromaMaterial} from './chroma-video.js';

const THREE = window.MINDAR.IMAGE.THREE;

document.addEventListener('DOMContentLoaded', () => {
  const start = async() => {
    // mockWithVideo('../../assets/mock-videos/course-banner1.mp4');
    
    const mindarThree = new window.MINDAR.IMAGE.MindARThree({
      container: document.body,
      imageTargetSrc: '../targets.mind',
    });
    const {renderer, scene, camera} = mindarThree;

    const video = await loadVideo("../video.mp4");
    video.play();
    video.pause();
    const texture = new THREE.VideoTexture(video);

    const geometry = new THREE.PlaneGeometry(1, 1/1);
    // const material = new THREE.MeshBasicMaterial({map: texture});
    const material = createChromaMaterial(texture, 0x00ff00);
    const plane = new THREE.Mesh(geometry, material);
    plane.rotation.x = 0; // for 90 digress or on screen 
    // plane.rotation.x = Math.PI/2;
    // plane.rotation.y = 0; 
    // plane.rotation.z = 0;
    plane.position.y = 0;
    // plane.position.z = 0.8;
    plane.scale.multiplyScalar(0.5);

    const anchor = mindarThree.addAnchor(0);
    anchor.group.add(plane);

    anchor.onTargetFound = () => {
      video.play();
    }
    anchor.onTargetLost = () => {
      video.pause();
    }

    await mindarThree.start();
    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
    });
  }
  start();
});
