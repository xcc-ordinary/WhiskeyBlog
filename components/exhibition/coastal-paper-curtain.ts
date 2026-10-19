import * as THREE from "three";
import { gsap } from "gsap";

/** Original procedural edge shader; no Miranda scripts, textures or licensed fonts. */
export function createPaperCurtain(host:HTMLElement, initial=0) {
  const renderer=new THREE.WebGLRenderer({alpha:true,antialias:false});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));renderer.setClearColor(0,0);host.appendChild(renderer.domElement);
  const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-1,1,1,-1,0,2);camera.position.z=1;
  const uniforms={progress:{value:initial},aspect:{value:innerWidth/innerHeight}};
  const material=new THREE.ShaderMaterial({uniforms,transparent:true,depthTest:false,depthWrite:false,
    vertexShader:"varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}",
    fragmentShader:`varying vec2 vUv;uniform float progress;uniform float aspect;
      float random(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(random(i),random(i+vec2(1.,0.)),f.x),mix(random(i+vec2(0.,1.)),random(i+vec2(1.,1.)),f.x),f.y);}
      void main(){float bend=sin(progress*3.14159);float curve=sin(vUv.x*3.8+progress*4.)*.12*bend;float fiber=(noise(vec2(vUv.x*65.,progress*7.))-.5)*.018*bend;float edge=progress*1.5-.25+curve+fiber;float distance=edge-vUv.y;float alpha=smoothstep(-.001,.003,distance);float grain=noise(vUv*vec2(950.*aspect,950.));float shade=1.-exp(-max(distance,0.)*28.)*.11;vec3 color=mix(vec3(.89,.87,.8),vec3(.97,.95,.88),shade)+(grain-.5)*.018;gl_FragColor=vec4(color,alpha);}`,
  });
  const geometry=new THREE.PlaneGeometry(2,2);scene.add(new THREE.Mesh(geometry,material));
  let disposed=false,tween:gsap.core.Tween|undefined;
  function draw(){if(!disposed)renderer.render(scene,camera);}
  function resize(){renderer.setSize(innerWidth,innerHeight,false);uniforms.aspect.value=innerWidth/innerHeight;draw();}
  window.addEventListener("resize",resize);resize();
  function animate(value:number,duration=2){host.style.visibility="visible";host.style.pointerEvents="auto";tween?.kill();return new Promise<void>(resolve=>{tween=gsap.to(uniforms.progress,{value,duration,ease:"power3.inOut",onUpdate:draw,onComplete:()=>{if(value===0){host.style.visibility="hidden";host.style.pointerEvents="none";}resolve();}});});}
  return {cover:()=>animate(1),reveal:()=>animate(0),dispose(){disposed=true;tween?.kill();window.removeEventListener("resize",resize);geometry.dispose();material.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();}};
}
