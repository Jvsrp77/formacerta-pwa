/**
 * ═══════════════════════════════════════════════════════════════
 * FORMACERTA AI — PONTO DE ENTRADA
 * ═══════════════════════════════════════════════════════════════
 * Único arquivo carregado pelo index.html. Não contém lógica: só
 * liga os módulos à interface, na ordem correta.
 *
 * Para entender COMO o sistema analisa um exercício, comece por
 * js/pipeline/loop.js — ele mostra o caminho de um frame pelas
 * cinco etapas. Os detalhes de cada etapa estão nos arquivos
 * js/pipeline/etapa1..5.
 *
 * Mapa do projeto:
 *   config/    dados fixos (exercícios, limiares, URLs)
 *   core/      DOM, estado e matemática — a base compartilhada
 *   pipeline/  as 5 etapas da análise, em ordem de execução
 *   render/    tudo que desenha em canvas
 *   feedback/  toast, som, voz e painéis de status
 *   features/  circuito, gravação, voz, histórico, export, laudo
 *   ui/        abas, seletor de exercício e calibração
 */

import { bindCaptureControls } from './pipeline/etapa1-captura.js';
import { initCircuit } from './features/circuit.js';
import { initRecorder } from './features/recorder.js';
import { initVoiceCommands } from './features/voice-commands.js';
import { initHistory } from './features/history.js';
import { initExport } from './features/export.js';
import { initReport } from './features/report.js';
import { initTabs } from './ui/tabs.js';
import { initExerciseSelector } from './ui/exercise-selector.js';
import { initSettings } from './ui/settings.js';
import { registerServiceWorker } from './pwa.js';

/* 1. Navegação e configurações da interface */
initTabs();
initSettings();

/* 2. Controles da análise (câmera, arquivo de vídeo, encerrar) */
bindCaptureControls();
initRecorder();

/* 3. Modos de treino */
initCircuit();

// Depois do circuito: `initExerciseSelector` aplica o exercício
// inicial e zera os contadores, que o montador já deixou prontos.
initExerciseSelector();

/* 4. Entrada e saída de dados */
initHistory();
initExport();
initReport();

/* 5. Recursos opcionais do navegador */
initVoiceCommands();
registerServiceWorker();
