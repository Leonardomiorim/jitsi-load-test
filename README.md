# Simulador de Teleconsulta - Teste de Carga com Jitsi

## Objetivo
Simular sessões reais de teleconsulta utilizando o ambiente da Unimed com Jitsi, gerando tráfego de vídeo e áudio de forma automatizada e controlada.

## Ferramentas Utilizadas
- **Node.js**
- **Playwright**
- **Axios**
- **UUID**
- **Fake Media**: `audio_5s.wav` e `video_5s.y4m`

## Cenário Simulado
- A API da Unimed é acionada para criar uma nova conferência.
- Os links retornados (paciente, médico e assistente) são utilizados para simular a entrada real em uma chamada.
- Dois navegadores são abertos (médico e paciente) com mídia fake.
- A chamada é mantida por 5 minutos para garantir tráfego de vídeo/áudio.

## Evidências de Sucesso
- O nome do outro participante aparece em cada instância (prova da conexão ativa via WebRTC).
- O áudio de mídia fake é audível (beep contínuo).
- O Jitsi exibe status de chamada em andamento com timer.
- Prints automáticos são salvos para verificação visual.

## Execução Simples
```bash
npm install
npx playwright install chromium
node index.js
```

## Execução de Carga
Um script especial (`script-carga.js`) permite simular múltiplas chamadas simultâneas:
- Exemplo: 5 salas simultâneas = 10 navegadores
- Cada chamada dura 5 minutos
- Evidências geradas por sala

## Arquivos Importantes
- `index.js` → script base de uma chamada
- `script-carga.js` → script de carga com múltiplas salas
- `audio_5s.wav`, `video_5s.y4m` → mídia fake
- `screenshot-Médico.png`, `screenshot-Paciente.png` → prints por chamada


