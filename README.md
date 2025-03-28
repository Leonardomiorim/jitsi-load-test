# 📊 Simulador de Teleconsulta - Teste de Carga com Jitsi

## 🌟 Objetivo

Simular sessões reais de teleconsulta utilizando o ambiente da Unimed com Jitsi, gerando tráfego de vídeo e áudio de forma automatizada e controlada, com múltiplos usuários simultâneos.

---

## 🛠️ Ferramentas Utilizadas

- Node.js
- Playwright
- Axios
- UUID
- Mídia fake:
  - `audio_5s.wav`
  - `video_5s.y4m`

---

## 🧲 Cenário Simulado

1. A API da Unimed é acionada para criar uma nova conferência.
2. Os links de acesso (paciente, médico e assistente) são retornados.
3. Os navegadores são abertos com mídia fake.
4. A conferência é mantida por até **5 minutos**, garantindo o tráfego de vídeo e áudio.
5. Prints são capturados e logs são salvos para auditoria.

---

## ✅ Evidências de Sucesso

- O nome do outro participante aparece na tela (prova de conexão ativa via WebRTC).
- O Jitsi exibe timer de chamada em andamento.
- Áudio fake audível (beep contínuo).
- Prints salvos automaticamente por usuário e sala.
- Relatório `.txt` e JSONs com os dados da chamada.

---

## 🚀 Execução Simples (Chamada única)

```bash
npm install
npx playwright install chromium
node scripts/index.js
```

---

## 🔁 Execução de Carga (Múltiplas salas simultâneas)

Use um dos scripts localizados em `scripts/`:

### Exemplos:

- `script-carga.js` → Carga básica com paciente e médico.
- `script-carga-assistente.js` → Carga incluindo paciente, médico e assistente.
- `script-carga-g.js` → Versão de carga personalizada para 120 usuários.

> O número de salas e usuários por sala pode ser configurado diretamente no script.

---

## ✨ Exemplo de Evidências Geradas

- `prints/sala1-Médico.png`
- `prints/sala1-Paciente.png`
- `logs/sala1.log`
- `reports/relatorio.txt`
- `reports/registros/sala-UUID.json`

---

## 📌 Observações

- O script simula conferências reais. Cuidado ao executar em ambientes com poucos recursos.
- Use `headless: false` apenas para debug ou análise visual.
- Recomendado rodar com carga moderada para máquinas pessoais.

---

## 🧐 Autor

> Criado por Leonardo Miorim • QA Lead

---