import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const App = () => {
  const mountRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [joystick, setJoystick] = useState({ x: 0, y: 0, active: false });

  useEffect(() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
    camera.position.set(0, 20, 40);

    const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 2));
    const sun = new THREE.DirectionalLight(0xffffff, 1.5);
    sun.position.set(50, 100, 50);
    scene.add(sun);

    const loader = new GLTFLoader();
    let player = null;
    let mixer = null; // Анимация үшін
    let clock = new THREE.Clock();

    // 1. КАРТАНЫ ЖҮКТЕУ (Өлшемін үлкейту)
    loader.load('/map.glb', (gltf) => {
      const map = gltf.scene;
      map.scale.set(15, 15, 15); // Карта көрінбесе, осыны үлкейт
      map.position.y = -1; 
      scene.add(map);
    });

    // 2. КЕЙІПКЕРДІ ЖҮКТЕУ + АНИМАЦИЯ
    loader.load('/hero.glb', (gltf) => {
      player = gltf.scene;
      player.scale.set(5, 5, 5);
      scene.add(player);

      // Модель ішіндегі анимацияны іздеу
      mixer = new THREE.AnimationMixer(player);
      if (gltf.animations.length > 0) {
        // Бірінші анимацияны (көбіне Idle немесе Walk) қосу
        const action = mixer.clipAction(gltf.animations[0]);
        action.play();
      }
      setLoading(false);
    });

    const animate = () => {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();
      
      if (mixer) mixer.update(delta); // Анимацияны жаңарту

      if (player && joystick.active) {
        const speed = 0.6;
        player.position.x += joystick.x * speed;
        player.position.z += joystick.y * speed;

        // Бұрылу
        player.rotation.y = Math.atan2(joystick.x, joystick.y);

        // Камера бақылауы
        camera.position.lerp(new THREE.Vector3(player.position.x, player.position.y + 15, player.position.z + 30), 0.1);
        camera.lookAt(player.position.x, player.position.y + 5, player.position.z);
      }
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [joystick.active, joystick.x, joystick.y]);

  // Джойстик баптауы
  const handleTouch = (e) => {
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const dx = (touch.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const dy = (touch.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    setJoystick({ x: dx, y: dy, active: true });
  };

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', touchAction: 'none' }}>
      <div ref={mountRef} />
      {loading && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#fff' }}>
          <h2>ЖҮКТЕЛУДЕ...</h2>
        </div>
      )}
      {!loading && (
        <div 
          style={{ position: 'absolute', bottom: '50px', left: '50px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '2px solid white' }}
          onTouchMove={handleTouch}
          onTouchEnd={() => setJoystick({ x: 0, y: 0, active: false })}
        />
      )}
    </div>
  );
};
export default App;



