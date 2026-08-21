# FormaCerta AI

Sistema web (PWA) de análise biomecânica de exercícios físicos em tempo real, usando detecção de pose por visão computacional direto no navegador — sem sensores vestíveis, sem servidor.

Projeto de TCC — Engenharia da Computação.

## Funcionalidades

- Detecção de pose em tempo real via [MediaPipe Pose Landmarker](https://developers.google.com/mediapipe/solutions/vision/pose_landmarker) (BlazePose), rodando via WebAssembly direto no navegador.
- Cálculo de ângulos articulares e contagem automática de repetições corretas/incorretas para 5 exercícios: agachamento, flexão de braço, rosca direta, elevação lateral e afundo.
- Detecção de desvios posturais (joelho valgo, desalinhamento de tronco/coluna, compensação no bíceps).
- Velocidade angular (VBT — treino baseado em velocidade) e estimativa de perda de velocidade/fadiga.
- Feedback multimodal: visual (HUD sobreposto ao vídeo), sonoro (Web Audio API) e por voz (Web Speech API).
- **Comandos de voz hands-free** ("iniciar", "parar", "gravar", trocar de exercício).
- **Modo circuito guiado**: sequência de exercícios com meta de reps, descanso cronometrado e transição automática entre exercícios.
- Gravação do vídeo com o HUD sobreposto (MediaRecorder API) e exportação do histórico em CSV/JSON.
- Geração de laudo biomecânico e histórico de sessões (localStorage).
- PWA instalável, com funcionamento offline via Service Worker.
- Responsivo para desktop e mobile.

## Stack

100% client-side — sem backend, sem build step:

- HTML + CSS + JavaScript puro (ES Modules), sem framework.
- [`@mediapipe/tasks-vision`](https://www.npmjs.com/package/@mediapipe/tasks-vision) via CDN.
- APIs nativas do navegador: `getUserMedia`, Canvas, Web Audio, Web Speech (síntese e reconhecimento), MediaRecorder, `localStorage`.

## Como rodar

Basta abrir o `index.html` no navegador. Alguns navegadores exigem um servidor local (não `file://`) para liberar acesso à câmera/microfone:

```bash
python -m http.server 8000
```

Depois acesse `http://localhost:8000`.
