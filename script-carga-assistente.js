// Simulador de Carga - Múltiplas chamadas Jitsi simultâneas com até 120 usuários

const { chromium } = require('playwright');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const API_URL = 'https://dev-conferencia.pepunimed.com.br/video-conference';
const AUTH_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoiYXV0aF9wZXAiLCJ0eXBlIjoicGVwIn0.MNNhHBrrs4L5aojpo9uJZx0AbKADVDPSz8XXjNq4_Hk';
const VIDEO_PATH = path.resolve(__dirname, 'video_5s.y4m');
const AUDIO_PATH = path.resolve(__dirname, 'audio_5s.wav');
const PRINTS_DIR = path.resolve(__dirname, 'prints');
const RELATORIO_PATH = path.resolve(__dirname, 'relatorio.txt');
const LOGS_DIR = path.resolve(__dirname, 'logs');
const SCRIPTS_DIR = path.resolve(__dirname, 'reports', 'registros');

const TOTAL_SALAS = 5;
const DURACAO_MS = 2 * 60 * 1000;
const WAVE_INTERVAL_MS = 10000;
const USUARIOS_POR_SALA = 3;

if (!fs.existsSync(PRINTS_DIR)) fs.mkdirSync(PRINTS_DIR);
if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR);
if (!fs.existsSync(SCRIPTS_DIR)) fs.mkdirSync(SCRIPTS_DIR);
if (!fs.existsSync(path.dirname(RELATORIO_PATH))) fs.mkdirSync(path.dirname(RELATORIO_PATH));

fs.writeFileSync(RELATORIO_PATH, 'Relatório de Execução de Carga - Jitsi\n\n');

async function criarSala() {
  const scheduleId = uuidv4();
  const body = {
    systemIdentifier: "PEP_UNIMED",
    pepNotificationUrl: "http://conferenciapep.pepunimed.com.br/my-api",
    pepNotificationToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoiZXhhbXBsZSIsIm5hbWUiOiJleGFtcGxlIn0.J-nkbcnJvCyd8hEEYUYVysN861wTJ-eQFGe85KxU1RM",
    scheduleId,
    startDate: "2024-12-31T23:59:00.000Z",
    name: "Carga Teste",
    endTime: "2024-12-31T23:59:59.000Z",
    patient: {
      patientName: "Paciente Carga",
      patientBirthDate: "2000-01-01",
      patientTreatmentPronoun: "Sr(a)"
    },
    doctor: {
      doctorDocument: "9999",
      doctorName: "Médico Carga",
      doctorTreatmentPronoun: "Sr(a)"
    },
    assistant: {
      assistantName: "Assistente Carga",
      assistantTreatmentPronoun: "Sr(a)"
    },
    clinic: {
      clinicEmail: "clinica@teste.com",
      clinicName: "Clínica Carga",
      clinicSite: "clinicateste.com",
      clinicResponsible: "Resp Teste",
      clinicPhones: ["(00) 0000-0000"]
    }
  };

  const response = await axios.post(API_URL, body, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AUTH_TOKEN}`
    }
  });

  fs.writeFileSync(path.join(SCRIPTS_DIR, `sala-${scheduleId}.json`), JSON.stringify(response.data, null, 2));

  return response.data;
}

async function simularUsuario(url, role, salaId) {
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      `--use-file-for-fake-video-capture=${VIDEO_PATH}`,
      `--use-file-for-fake-audio-capture=${AUDIO_PATH}`
    ]
  });

  const context = await browser.newContext();
  const page = await context.newPage();
  const startTime = Date.now();

  console.log(`[Sala ${salaId}] ${role} acessando ${url}`);
  fs.appendFileSync(path.join(LOGS_DIR, `sala${salaId}.log`), `[${new Date().toISOString()}] ${role} acessando ${url}\n`);

  await page.goto(url);

  try {
    await page.waitForTimeout(10000);
    await page.screenshot({ path: path.join(PRINTS_DIR, `sala${salaId}-${role}.png`) });
  } catch (e) {
    console.warn(`[Sala ${salaId}] ${role} - erro ao tirar screenshot.`);
    fs.appendFileSync(path.join(LOGS_DIR, `sala${salaId}.log`), `[${new Date().toISOString()}] ${role} - erro ao tirar screenshot.\n`);
  }

  try {
    await page.waitForTimeout(DURACAO_MS - 10000);
  } catch (e) {
    console.warn(`[Sala ${salaId}] Timeout encerrado.`);
  }

  await browser.close();
  const tempoExecucao = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`[Sala ${salaId}] ${role} finalizou em ${tempoExecucao}s.`);

  fs.appendFileSync(RELATORIO_PATH, `Sala ${salaId} - ${role} finalizado com sucesso em ${tempoExecucao}s\n`);
  fs.appendFileSync(path.join(LOGS_DIR, `sala${salaId}.log`), `[${new Date().toISOString()}] ${role} finalizado em ${tempoExecucao}s\n`);
}

(async () => {
  const salas = [];
  for (let i = 1; i <= TOTAL_SALAS; i++) {
    const dados = await criarSala();
    salas.push({
      id: i,
      paciente: dados.pepPatientIframeUrl,
      medico: dados.pepDoctorIframeUrl,
      assistente: dados.pepAssistantIframeUrl || dados.pepDoctorIframeUrl
    });
    console.log(`[Sala ${i}] Criada. Aguardando ${WAVE_INTERVAL_MS / 1000}s para a próxima.`);
    await new Promise(resolve => setTimeout(resolve, WAVE_INTERVAL_MS));
  }

  for (const sala of salas) {
    if (USUARIOS_POR_SALA >= 1) simularUsuario(sala.paciente, 'Paciente', sala.id);
    if (USUARIOS_POR_SALA >= 2) simularUsuario(sala.medico, 'Médico', sala.id);
    if (USUARIOS_POR_SALA >= 3) simularUsuario(sala.assistente, 'Assistente', sala.id);
  }
})();
