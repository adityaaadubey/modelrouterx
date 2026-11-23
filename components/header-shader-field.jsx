"use client";

import { useEffect, useRef } from "react";

const VERTEX_SHADER = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_pixel_size;
uniform float u_intensity;
uniform float u_vignette_alpha;
uniform vec3 u_vignette;
uniform vec3 u_palette[8];

float bayerValue(vec2 pixel) {
  float value = 0.0;
  for (int i = 0; i < 3; i++) {
    float scale = exp2(float(i));
    float bitX = mod(floor(mod(pixel.x, 8.0) / scale), 2.0);
    float bitY = mod(floor(mod(pixel.y, 8.0) / scale), 2.0);
    float cell = bitX == bitY ? bitY : 2.0 + bitY;
    value += cell * exp2(float(2 * i));
  }
  return (value + 0.5) / 64.0;
}

vec3 rampColor(float value) {
  float scaled = clamp(value, 0.0, 1.0) * 7.0;
  float band = floor(scaled);
  float blend = fract(scaled);
  if (band < 1.0) return mix(u_palette[0], u_palette[1], blend);
  if (band < 2.0) return mix(u_palette[1], u_palette[2], blend);
  if (band < 3.0) return mix(u_palette[2], u_palette[3], blend);
  if (band < 4.0) return mix(u_palette[3], u_palette[4], blend);
  if (band < 5.0) return mix(u_palette[4], u_palette[5], blend);
  if (band < 6.0) return mix(u_palette[5], u_palette[6], blend);
  return mix(u_palette[6], u_palette[7], blend);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float sweep = 0.08 * sin(uv.x * 7.0 + u_time * 0.14) + 0.06 * sin(uv.y * 9.0 - u_time * 0.1);
  float field = clamp((uv.x * 0.42 + uv.y * 0.34 + sweep + 0.11) * u_intensity, 0.0, 0.98);
  float threshold = bayerValue(floor(gl_FragCoord.xy / u_pixel_size));
  float level = clamp(floor(field * 7.0 + (threshold - 0.5) * 0.72), 0.0, 7.0) / 7.0;
  vec3 color = rampColor(level);
  float edge = max(abs(uv.x - 0.5) * 1.18, abs(uv.y - 0.5) * 2.0);
  float vignette = smoothstep(0.18, 0.82, edge) * u_vignette_alpha;
  color = mix(color, u_vignette, vignette);
  gl_FragColor = vec4(color, 1.0);
}
`;

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function parseColor(value) {
  const hex = value.match(/^#([\da-f]{3}|[\da-f]{6})$/i);
  if (hex) {
    const digits = hex[1].length === 3 ? hex[1].split("").map((digit) => digit + digit).join("") : hex[1];
    return [0, 2, 4].map((offset) => Number.parseInt(digits.slice(offset, offset + 2), 16) / 255);
  }
  const rgb = value.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+))?\s*\)/i);
  if (!rgb) return null;
  return [Number(rgb[1]) / 255, Number(rgb[2]) / 255, Number(rgb[3]) / 255];
}

function readThemePalette() {
  const styles = getComputedStyle(document.documentElement);
  const palette = Array.from({ length: 8 }, (_, index) => parseColor(styles.getPropertyValue(`--shader-ramp-${index}`).trim()));
  const vignette = parseColor(styles.getPropertyValue("--dock-vignette").trim());
  if (palette.some((stop) => !stop) || !vignette) return null;
  const vignetteAlpha = Number(styles.getPropertyValue("--dock-vignette-opacity").trim()) || (document.documentElement.dataset.theme === "light" ? 0.12 : 0.6);
  const intensity = Number(styles.getPropertyValue("--shader-intensity").trim()) || 1;
  const pixelSize = Number(styles.getPropertyValue("--shader-pixel-size").trim()) || 4;
  return { palette, vignette, vignetteAlpha, intensity, pixelSize };
}

function interpolate(from, to, amount) {
  return from.map((value, index) => value + (to[index] - value) * amount);
}

export default function HeaderShaderField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext("webgl", { alpha: false, antialias: false, powerPreference: "low-power" });
    if (!canvas || !gl) return undefined;

    const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vertex || !fragment) return undefined;

    const program = gl.createProgram();
    if (!program) return undefined;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return undefined;

    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const uniforms = {
      resolution: gl.getUniformLocation(program, "u_resolution"),
      time: gl.getUniformLocation(program, "u_time"),
      pixelSize: gl.getUniformLocation(program, "u_pixel_size"),
      intensity: gl.getUniformLocation(program, "u_intensity"),
      vignetteAlpha: gl.getUniformLocation(program, "u_vignette_alpha"),
      vignette: gl.getUniformLocation(program, "u_vignette"),
      palette: gl.getUniformLocation(program, "u_palette[0]"),
    };

    let reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frameId = 0;
    let startedAt = performance.now();
    let transitionStart = startedAt;
    let transitionFrom = readThemePalette();
    let transitionTo = transitionFrom;
    let displayed = transitionFrom;

    if (!displayed) return undefined;

    function draw(now) {
      frameId = 0;
      const duration = reducedMotion ? 0 : 150;
      const progress = duration === 0 ? 1 : Math.min(1, (now - transitionStart) / duration);
      const steppedProgress = progress >= 1 ? 1 : Math.floor(progress * 3) / 3;
      const mixStops = (from, to) => from.map((stop, index) => interpolate(stop, to[index], steppedProgress));
      const current = {
        palette: mixStops(transitionFrom.palette, transitionTo.palette),
        vignette: interpolate(transitionFrom.vignette, transitionTo.vignette, steppedProgress),
        vignetteAlpha: transitionFrom.vignetteAlpha + (transitionTo.vignetteAlpha - transitionFrom.vignetteAlpha) * steppedProgress,
        intensity: transitionFrom.intensity + (transitionTo.intensity - transitionFrom.intensity) * steppedProgress,
        pixelSize: transitionTo.pixelSize,
      };
      displayed = current;

      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
      gl.uniform1f(uniforms.time, reducedMotion ? 0 : (now - startedAt) / 1000);
      gl.uniform1f(uniforms.pixelSize, current.pixelSize);
      gl.uniform1f(uniforms.intensity, current.intensity);
      gl.uniform1f(uniforms.vignetteAlpha, current.vignetteAlpha);
      gl.uniform3fv(uniforms.vignette, new Float32Array(current.vignette));
      gl.uniform3fv(uniforms.palette, new Float32Array(current.palette.flat()));
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      if (!reducedMotion || progress < 1) frameId = window.requestAnimationFrame(draw);
    }

    function scheduleDraw() {
      if (!frameId) frameId = window.requestAnimationFrame(draw);
    }

    function updateTheme() {
      const next = readThemePalette();
      if (!next) return;
      transitionFrom = displayed || next;
      transitionTo = next;
      transitionStart = performance.now();
      scheduleDraw();
    }

    function resize() {
      const bounds = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(bounds.width * ratio));
      const height = Math.max(1, Math.round(bounds.height * ratio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
      scheduleDraw();
    }

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const themeObserver = new MutationObserver(updateTheme);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = (event) => {
      reducedMotion = event.matches;
      if (!reducedMotion) scheduleDraw();
      else scheduleDraw();
    };
    motionQuery.addEventListener("change", updateMotion);

    return () => {
      observer.disconnect();
      themeObserver.disconnect();
      motionQuery.removeEventListener("change", updateMotion);
      if (frameId) window.cancelAnimationFrame(frameId);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
    };
  }, []);

  return <div className="header-shader-field" aria-hidden="true"><canvas ref={canvasRef} /></div>;
}
