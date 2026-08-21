/**
 * GEOMETRIA VETORIAL
 * ---------------------------------------------------------------
 * Funções puras (sem DOM, sem estado). É a base matemática que a
 * ETAPA 3 usa para transformar coordenadas em ângulos articulares.
 *
 * Fundamentação — ângulo entre três marcadores A, B, C, com B como
 * articulação-pivô:
 *
 *   u = A - B          (vetor do pivô até o ponto proximal)
 *   v = C - B          (vetor do pivô até o ponto distal)
 *   θ = arccos( (u · v) / (||u|| * ||v||) ) * (180 / π)
 *
 * Observação: o cálculo usa o plano (x, y) da projeção da câmera.
 * A coordenada z do BlazePose é usada apenas no visualizador 3D,
 * porque sua escala relativa é menos estável para goniometria.
 */

/**
 * Ângulo em graus formado por A-B-C, com B no vértice.
 * @param {{x:number,y:number}} a ponto proximal
 * @param {{x:number,y:number}} b articulação-pivô
 * @param {{x:number,y:number}} c ponto distal
 * @returns {number} ângulo em graus (0 se algum vetor for degenerado)
 */
export function calculateAngle(a, b, c) {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };

  const dot = ab.x * cb.x + ab.y * cb.y;
  const magAB = Math.hypot(ab.x, ab.y);
  const magCB = Math.hypot(cb.x, cb.y);

  if (magAB * magCB === 0) return 0;

  // O clamp em [-1, 1] protege contra erro de ponto flutuante que
  // faria o arccos retornar NaN em ângulos muito próximos de 0/180°.
  const cosine = Math.min(1, Math.max(-1, dot / (magAB * magCB)));
  return Math.acos(cosine) * (180 / Math.PI);
}

/**
 * Projeta um ponto 3D rotacionado em torno do eixo Y (vertical).
 * Usado pelo visualizador 3D para girar o esqueleto em 360°.
 * @param {{x:number,z?:number}} point landmark normalizado (0..1)
 * @param {number} cos cosseno do ângulo de rotação
 * @param {number} sin seno do ângulo de rotação
 * @returns {number} coordenada x projetada (0..1)
 */
export function rotateAroundY(point, cos, sin) {
  return (point.x - 0.5) * cos - (point.z || 0) * sin + 0.5;
}
