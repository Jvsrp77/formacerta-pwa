/**
 * BASE DE CONHECIMENTO BIOMECÂNICO
 * ---------------------------------------------------------------
 * Cada exercício descreve, de forma declarativa, tudo que o
 * pipeline de análise precisa saber. Para adicionar um exercício
 * novo ao sistema, basta acrescentar uma entrada aqui — nenhuma
 * outra etapa precisa ser alterada.
 *
 * Campos:
 *   points       Trio de landmarks (a, b, c) do ângulo principal.
 *                `b` é sempre a articulação-pivô. Índices seguem o
 *                padrão de 33 pontos do MediaPipe Pose (BlazePose).
 *   secondary    Trio opcional para um ângulo de apoio (tronco,
 *                coluna, ombro) usado na checagem de postura.
 *   standing     Ângulo de referência do corpo em repouso. Serve de
 *                gatilho para a máquina de estados da repetição.
 *   goodMin/Max  Faixa angular considerada execução correta.
 *   direction    'up'  → o ângulo AUMENTA durante o esforço
 *                       (ex.: elevação lateral, ~25° → ~90°).
 *                ausente → o ângulo DIMINUI durante o esforço
 *                       (agachamento, flexão, rosca, afundo).
 *   check*       Liga as regras de desvio postural da ETAPA 5.
 *   muscles      Chaves usadas pelo mapa de solicitação muscular.
 */
export const EXERCISES = {
  squat: {
    label: 'Agachamento', plane: 'Plano Sagital (Perfil)', angleLabel: 'Ângulo do Joelho',
    points: { a: 24, b: 26, c: 28 },
    rightPoints: { a: 24, b: 26, c: 28 }, leftPoints: { a: 23, b: 25, c: 27 },
    secondary: { a: 12, b: 24, c: 26, name: 'Tronco' },
    rightSecondary: { a: 12, b: 24, c: 26, name: 'Tronco' }, leftSecondary: { a: 11, b: 23, c: 25, name: 'Tronco' },
    standing: 155, goodMin: 70, goodMax: 100,
    muscles: ['quads', 'glutes'],
    instruction: 'Fique de perfil para a câmera. Mantenha o joelho alinhado e desça até as coxas ficarem paralelas ao chão.',
    checkValgus: true, checkPosture: true,
    messages: { down: 'Descendo...', good: 'Ótima profundidade! Pode subir.', tooDeep: 'Atenção: Flexão excessiva do joelho.', shallow: 'Agachamento raso. Desça mais na próxima.', valgus: '⚠️ ALERTA: Joelhos caindo para dentro (Valgo)', posture: '⚠️ ALERTA: Tronco muito inclinado à frente' }
  },
  pushup: {
    label: 'Flexão de Braço', plane: 'Plano Sagital (Perfil)', angleLabel: 'Ângulo do Cotovelo',
    points: { a: 12, b: 14, c: 16 },
    rightPoints: { a: 12, b: 14, c: 16 }, leftPoints: { a: 11, b: 13, c: 15 },
    secondary: { a: 12, b: 24, c: 28, name: 'Coluna' },
    rightSecondary: { a: 12, b: 24, c: 28, name: 'Coluna' }, leftSecondary: { a: 11, b: 23, c: 27, name: 'Coluna' },
    standing: 155, goodMin: 70, goodMax: 95,
    muscles: ['chest'],
    instruction: 'Posicione a câmera na altura do chão de perfil. Mantenha tronco e pernas alinhados em linha reta.',
    checkValgus: false, checkSpine: true,
    messages: { down: 'Flexionando braços...', good: 'Boa amplitude! Empurre o chão.', tooDeep: 'Desceu além do necessário.', shallow: 'Flexão incompleta. Desça mais o tórax.', spine: '⚠️ ALERTA: Mantenha a coluna alinhada (sem arcar o quadril)' }
  },
  bicep: {
    label: 'Rosca Direta', plane: 'Plano Sagital / Frontal', angleLabel: 'Ângulo do Cotovelo',
    points: { a: 12, b: 14, c: 16 },
    rightPoints: { a: 12, b: 14, c: 16 }, leftPoints: { a: 11, b: 13, c: 15 },
    secondary: { a: 24, b: 12, c: 14, name: 'Ombro' },
    rightSecondary: { a: 24, b: 12, c: 14, name: 'Ombro' }, leftSecondary: { a: 23, b: 11, c: 13, name: 'Ombro' },
    standing: 150, goodMin: 40, goodMax: 65,
    muscles: ['biceps'],
    instruction: 'Fique de perfil ou de frente. Flexione o cotovelo sem projetar o ombro à frente.',
    checkValgus: false, checkCheating: true,
    messages: { down: 'Contraindo bíceps...', good: 'Contração máxima alcançada!', tooDeep: 'Flexão completa.', shallow: 'Suba mais a carga para contrair o bíceps.', cheating: '⚠️ ALERTA: Evite balançar o tronco ("roubo")' }
  },
  lateral_raise: {
    label: 'Elevação Lateral', plane: 'Plano Frontal', angleLabel: 'Abdução do Ombro',
    points: { a: 24, b: 12, c: 14 },
    rightPoints: { a: 24, b: 12, c: 14 }, leftPoints: { a: 23, b: 11, c: 13 },
    standing: 25, goodMin: 80, goodMax: 95, direction: 'up',
    muscles: ['chest'],
    instruction: 'Fique de frente para a câmera. Eleve os braços lateralmente até a altura dos ombros.',
    checkValgus: false,
    messages: { down: 'Elevando braços...', good: 'Altura ideal dos ombros!', tooDeep: 'Passou da linha dos ombros.', shallow: 'Eleve mais os braços até 90°.' }
  },
  lunge: {
    label: 'Afundo (Lunge)', plane: 'Plano Sagital', angleLabel: 'Joelho Frontal',
    points: { a: 24, b: 26, c: 28 },
    rightPoints: { a: 24, b: 26, c: 28 }, leftPoints: { a: 23, b: 25, c: 27 },
    standing: 155, goodMin: 75, goodMax: 100,
    muscles: ['quads', 'glutes'],
    instruction: 'Fique de perfil. Dê um passo à frente e flexione ambos os joelhos em ângulo de 90°.',
    checkValgus: false,
    messages: { down: 'Flexionando no afundo...', good: 'Excelente amplitude no afundo!', tooDeep: 'Flexão muito profunda.', shallow: 'Desça mais o joelho de trás.' }
  }
};

/** Palavras que o reconhecimento de voz aceita para trocar de exercício. */
export const VOICE_EXERCISE_ALIASES = {
  squat: ['agachamento', 'squat'],
  pushup: ['flexao de braco', 'flexao', 'pushup', 'push up'],
  bicep: ['rosca direta', 'rosca', 'bicep', 'biceps'],
  lateral_raise: ['elevacao lateral', 'lateral raise', 'elevacao'],
  lunge: ['afundo', 'lunge']
};
