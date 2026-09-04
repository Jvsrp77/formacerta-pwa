# FormaCerta AI

Sistema web (PWA) de análise biomecânica de exercícios físicos em tempo real, usando detecção de pose por visão computacional direto no navegador — sem sensores vestíveis, sem servidor.

Projeto de Engenharia da Computação.

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

Não há passo de build. Como o projeto usa ES Modules e acessa câmera/microfone, é preciso servir por HTTP (não abrir via `file://`):

```bash
python -m http.server 8000
```

Depois acesse `http://localhost:8000`.

> Durante o desenvolvimento, o service worker pode servir arquivos antigos do cache.
> Se uma alteração não aparecer: DevTools → Application → Service Workers → marcar
> *Update on reload*, ou incrementar `CACHE_NAME` em `service-worker.js`.

## O pipeline de análise

O sistema é organizado como um **pipeline de 5 etapas** que roda uma vez por quadro de vídeo. O arquivo [`js/pipeline/loop.js`](js/pipeline/loop.js) é o melhor ponto de partida para a leitura do código — ele mostra o caminho completo em uma tela só.

| # | Etapa | Arquivo | Entrada → Saída |
|---|-------|---------|-----------------|
| 1 | **Captura** | `pipeline/etapa1-captura.js` | câmera ou arquivo MP4 → frames em `<video>` |
| 2 | **Detecção de pose** | `pipeline/etapa2-deteccao-pose.js` | frame → 33 landmarks (BlazePose) |
| 3 | **Biomecânica** | `pipeline/etapa3-biomecanica.js` | landmarks → ângulos, VBT, fadiga |
| 4 | **Avaliação** | `pipeline/etapa4-avaliacao.js` | medidas → veredito da repetição + desvio postural |
| 5 | **Feedback** | `pipeline/etapa5-feedback.js` | veredito → HUD, som e voz |

A ETAPA 4 é deliberadamente **pura em relação à interface**: ela não escreve no DOM, não toca som e não fala — devolve um descritor de resultado, e a ETAPA 5 é quem comunica. Isso permite testar as regras de avaliação biomecânica isoladamente.

## Estrutura de arquivos

```
formacerta-pwa/
├── index.html              Apenas marcação — nenhum CSS ou JS embutido
├── manifest.json           Metadados do PWA
├── service-worker.js       Cache offline (APP_SHELL lista todos os arquivos)
│
├── css/                    Carregados na ordem da cascata
│   ├── 01-tokens.css       Variáveis de cor/tipografia + reset
│   ├── 02-layout.css       Cabeçalho, abas, grades
│   ├── 03-components.css   Botões, cards, switches, tabela, toast
│   ├── 04-analyzer.css     Aba "Análise Ao Vivo" (palco, HUD, métricas, circuito)
│   ├── 05-pages.css        Demais abas + modal do laudo
│   └── 06-responsive.css   Mobile e impressão (precisa vir por último)
│
└── js/
    ├── main.js             Ponto de entrada: só liga os módulos
    ├── pwa.js              Registro do service worker
    │
    ├── config/             Dados fixos, sem lógica
    │   ├── exercises.js    Base biomecânica dos 5 exercícios
    │   └── constants.js    URLs do modelo, chaves, limiares globais
    │
    ├── core/               Base compartilhada
    │   ├── dom.js          Todas as referências de elementos
    │   ├── state.js        Estado da aplicação
    │   └── geometry.js     Matemática vetorial (funções puras)
    │
    ├── pipeline/           AS 5 ETAPAS, na ordem de execução
    │   ├── loop.js         ◀ comece a leitura por aqui
    │   ├── etapa1-captura.js
    │   ├── etapa2-deteccao-pose.js
    │   ├── etapa3-biomecanica.js
    │   ├── etapa4-avaliacao.js
    │   └── etapa5-feedback.js
    │
    ├── render/             Tudo que desenha em canvas
    │   ├── hud-overlay.js  HUD sobre o vídeo
    │   ├── skeleton-3d.js  Visualizador 3D rotacionável
    │   ├── sparkline.js    Gráfico de trajetória angular
    │   └── muscle-map.js   Mapa de solicitação muscular
    │
    ├── feedback/           Canais de saída para o usuário
    │   ├── toast.js
    │   ├── audio.js        Bipes via Web Audio API
    │   ├── speech.js       Síntese de voz PT-BR
    │   └── status-panel.js Faixas de status e alerta postural
    │
    ├── features/           Funcionalidades independentes do pipeline
    │   ├── circuit.js      Modo Circuito
    │   ├── recorder.js     Gravação de vídeo com HUD
    │   ├── voice-commands.js
    │   ├── history.js      Persistência e tabela de sessões
    │   ├── export.js       CSV / JSON
    │   └── report.js       Laudo cinesiológico
    │
    └── ui/                 Controles de interface
        ├── tabs.js
        ├── exercise-selector.js
        └── settings.js     Calibração goniométrica
```

## Como adicionar um exercício novo

1. Acrescente uma entrada em `js/config/exercises.js` (índices dos landmarks, ângulo de repouso, faixa ideal, mensagens e regras de postura).
2. Adicione o `<option>` correspondente no `<select id="exerciseSelect">` do `index.html`.
3. Se quiser suporte por voz, inclua os apelidos em `VOICE_EXERCISE_ALIASES`, no mesmo arquivo de configuração.

Nenhuma etapa do pipeline precisa ser alterada.
