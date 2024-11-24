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
        maxTrack: 0.2,             // کاهش بیشتر تعداد ردیابی‌ها
        filterMinCF: 0.0000001,    // کاهش بیشتر فیلتر کالمن
        filterBeta: 0.0000001,     // کاهش سرعت فیلتر
        
        trackingMode: 'fast',      // تغییر به حالت سریع
        warmupTolerance: 0.5,      // کاهش زمان آماده‌سازی
        missTolerance: 0.3,        // کاهش آستانه از دست دادن تارگت
    });
    const {renderer, scene, camera} = mindarThree;

    const video = await loadVideo("../video.mp4");
    video.play();
    video.pause();
    const texture = new THREE.VideoTexture(video);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

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

    let scaleX = 0.5;
    let scaleY = 0.5;
    let posX = 0;
    let posY = 0;

    let initialDistance = 0;
    let initialScale = plane.scale.x;

    let isDragging = false;
    let startX, startY;
    let initialPosX, initialPosY;

    // غیرفعال کردن زوم مرورگر
    document.addEventListener('touchstart', (event) => {
    // جلوگیری از زوم پیش‌فرض
    if (event.touches.length > 1) {
        event.preventDefault();
    }
    }, { passive: false });

    document.addEventListener('touchmove', (event) => {
    // جلوگیری از زوم پیش‌فرض
    if (event.touches.length > 1) {
        event.preventDefault();
    }
    }, { passive: false });

    // متا تگ برای غیرفعال کردن زوم در موبایل
    const metaViewport = document.createElement('meta');
    metaViewport.name = 'viewport';
    metaViewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    document.getElementsByTagName('head')[0].appendChild(metaViewport);

    // CSS برای جلوگیری از زوم
    const style = document.createElement('style');
    style.innerHTML = `
    html, body {
        touch-action: none;
        -ms-touch-action: none;
        -webkit-touch-action: none;
    }
    `;
    document.getElementsByTagName('head')[0].appendChild(style);

    // جلوگیری از زوم با استفاده از CSS
    document.documentElement.style.setProperty('touch-action', 'none');

    // مسدود کردن دابل تپ زوم
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (event) => {
    const now = new Date().getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
    }, false);

    document.addEventListener('touchstart', (event) => {
    // برای دو انگشت (زوم)
    if (event.touches.length === 2) {
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        
        // محاسبه فاصله اولیه بین دو انگشت
        initialDistance = Math.hypot(
        touch1.pageX - touch2.pageX, 
        touch1.pageY - touch2.pageY
        );
        
        // مقیاس اولیه
        initialScale = plane.scale.x;
    }
    
    // برای یک انگشت (حرکت)
    if (event.touches.length === 1) {
        const touch = event.touches[0];
        
        // محاسبه موقعیت شروع
        startX = touch.clientX;
        startY = touch.clientY;
        
        // موقعیت اولیه پلن
        initialPosX = plane.position.x;
        initialPosY = plane.position.y;
        
        isDragging = true;
    }
    });

    document.addEventListener('touchmove', (event) => {
    // زوم با دو انگشت
    if (event.touches.length === 2) {
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        
        // محاسبه فاصله جدید بین دو انگشت
        const currentDistance = Math.hypot(
        touch1.pageX - touch2.pageX, 
        touch1.pageY - touch2.pageY
        );
        
        // محاسبه ضریب مقیاس
        const scaleFactorX = currentDistance / initialDistance;
        const scaleFactorY = currentDistance / initialDistance;
        
        // اعمال مقیاس جدید
        const newScaleX = initialScale * scaleFactorX;
        const newScaleY = initialScale * scaleFactorY;
        
        // محدود کردن مقیاس
        const constrainedScaleX = Math.max(0.1, Math.min(newScaleX, 2));
        const constrainedScaleY = Math.max(0.1, Math.min(newScaleY, 2));
        
        // تنظیم مقیاس جدید
        plane.scale.set(constrainedScaleX, constrainedScaleY, 1);
    }
    
    // حرکت با یک انگشت
    if (isDragging && event.touches.length === 1) {
        const touch = event.touches[0];
        
        // محاسبه میزان جابجایی
        const deltaX = (touch.clientX - startX) / window.innerWidth * 2;
        const deltaY = -(touch.clientY - startY) / window.innerHeight * 2;
        
        // محاسبه موقعیت جدید
        let newPosX = initialPosX + deltaX * 0.5;
        let newPosY = initialPosY + deltaY * 0.5;
        
        // محدود کردن موقعیت
        newPosX = Math.max(-1, Math.min(newPosX, 1));
        newPosY = Math.max(-1, Math.min(newPosY, 1));
        
        // تنظیم موقعیت جدید
        plane.position.x = newPosX;
        plane.position.y = newPosY;
    }
    });

    document.addEventListener('touchend', (event) => {
    // ریست کردن حالت درگ
    isDragging = false;
    
    // اگر از حالت دو انگشتی خارج شد، ذخیره مقیاس فعلی
    if (event.touches.length < 2) {
        initialScale = plane.scale.x;
    }
    });

    document.addEventListener('touchcancel', () => {
    isDragging = false;
    });


    // لیسنر برای کلیک ماوس
    document.addEventListener('click', (event) => {
      const clickX = (event.clientX / window.innerWidth) * 2 - 1;
      const clickY = -(event.clientY / window.innerHeight) * 2 + 1;

      // تغییر موقعیت با کلیک
      posX += clickX * 0.2;
      posY += clickY * 0.2;

      // محدود کردن موقعیت
      posX = Math.max(-1, Math.min(posX, 1));
      posY = Math.max(-1, Math.min(posY, 1));

      plane.position.x = posX;
      plane.position.y = posY;
    });

    await mindarThree.start();
    function render() {
        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }
    render();
  }
  start();
});