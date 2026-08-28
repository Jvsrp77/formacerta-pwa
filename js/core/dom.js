/**
 * REFERÊNCIAS DE DOM
 * ---------------------------------------------------------------
 * Ponto único de contato entre o JavaScript e o HTML. Nenhum outro
 * módulo chama `document.getElementById` — todos importam daqui.
 *
 * Vantagem prática: se um `id` mudar no index.html, só este arquivo
 * precisa ser corrigido.
 */

const byId = (id) => document.getElementById(id);

/* ---------- Palco de vídeo e HUD ---------- */
export const stage = {
  video: byId('videoElement'),
  overlayCanvas: byId('overlayCanvas'),
  placeholder: byId('placeholder'),
  instructionHint: byId('exerciseInstructionHint'),
  statusBadge: byId('hudStatusBadge'),
  statusText: byId('hudStatusText'),
  fpsBadge: byId('hudFpsBadge'),
  fpsValue: byId('fpsVal'),
  voiceCmdBadge: byId('hudVoiceCmdBadge')
};

/* ---------- Barra de controles ---------- */
export const controls = {
  exerciseSelect: byId('exerciseSelect'),
  singleModeGroup: byId('singleModeGroup'),
  modeTabs: byId('modeTabs'),
  startCamBtn: byId('startCamBtn'),
  videoFileInput: byId('videoFileInput'),
  flipCamBtn: byId('flipCamBtn'),
  recordVideoBtn: byId('recordVideoBtn'),
  stopBtn: byId('stopBtn')
};

/* ---------- Controles do vídeo carregado (MP4) ---------- */
export const videoFile = {
  controls: byId('videoFileControls'),
  playPauseBtn: byId('playPauseVideoBtn'),
  seeker: byId('videoSeeker'),
  timeText: byId('videoTimeText')
};

/* ---------- Painel de métricas ---------- */
export const metrics = {
  statusBanner: byId('statusBanner'),
  formAlertBanner: byId('formAlertBanner'),
  formAlertText: byId('formAlertText'),
  goodReps: byId('goodRepsVal'),
  badReps: byId('badRepsVal'),
  angleLabel: byId('angleLabelName'),
  currentAngle: byId('currentAngleVal'),
  vbt: byId('vbtVal'),
  fatigue: byId('fatigueVal'),
  posture: byId('postureVal'),
  plane: byId('planeTag'),
  targetRange: byId('targetRangeTag'),
  secondaryRow: byId('secondaryAngleRow'),
  secondaryLabel: byId('secondaryAngleLabel'),
  secondaryValue: byId('secondaryAngleVal'),
  sparklineCanvas: byId('sparklineCanvas')
};

/* ---------- Visualizador 3D e mapa muscular ---------- */
export const visualizer = {
  canvas3D: byId('canvas3D'),
  rotationSlider: byId('slider3DRotation'),
  muscleBadgesGroup: byId('muscleBadgesGroup')
};

/* ---------- Modo Circuito ---------- */
export const circuit = {
  builderCard: byId('circuitBuilderCard'),
  stepsList: byId('circuitStepsList'),
  stepsCount: byId('circuitStepsCount'),
  addStepBtn: byId('addCircuitStepBtn'),
  progressPanel: byId('circuitProgressPanel'),
  progressList: byId('circuitProgressList'),
  stepCounter: byId('circuitStepCounter'),
  skipExerciseBtn: byId('skipExerciseBtn'),
  restOverlay: byId('restOverlay'),
  restNextName: byId('restNextExerciseName'),
  restCountdown: byId('restCountdownVal'),
  skipRestBtn: byId('skipRestBtn')
};

/* ---------- Aba Desempenho & VBT ---------- */
export const analytics = {
  tableBody: byId('historyTableBody'),
  totalSessions: byId('statTotalSessions'),
  accuracyScore: byId('statAccuracyScore'),
  avgVbt: byId('statAvgVbt'),
  generateLaudoBtn: byId('generateLaudoBtn'),
  exportCsvBtn: byId('exportCsvBtn'),
  exportJsonBtn: byId('exportJsonBtn'),
  clearHistoryBtn: byId('clearHistoryBtn')
};

/* ---------- Aba Configurações ---------- */
export const settings = {
  goodMin: byId('cfgGoodMin'),
  goodMax: byId('cfgGoodMax'),
  restSeconds: byId('cfgRestSeconds'),
  voiceToggle: byId('settingVoiceToggle'),
  voiceCmdToggle: byId('settingVoiceCmdToggle'),
  voiceCmdDesc: byId('voiceCmdDesc'),
  multiAngleToggle: byId('settingMultiAngleToggle')
};

/* ---------- Modal do laudo ---------- */
export const laudo = {
  modal: byId('laudoModal'),
  closeBtn: byId('laudoCloseBtn'),
  printBtn: byId('laudoPrintBtn'),
  patientName: byId('laudoPatientName'),
  exerciseName: byId('laudoExerciseName'),
  score: byId('laudoScoreVal'),
  reps: byId('laudoRepsVal'),
  vbt: byId('laudoVbtVal'),
  riskBadge: byId('laudoRiskBadge'),
  prescription: byId('laudoPrescriptionText')
};

/* ---------- Toast ---------- */
export const toast = {
  root: byId('toast'),
  icon: byId('toastIcon'),
  message: byId('toastMessage')
};
