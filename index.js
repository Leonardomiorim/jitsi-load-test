// Requisitos: Node.js + Playwright instalado
// Instalação: npm install playwright axios uuid

const { chromium } = require('playwright');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const API_URL = 'https://dev-conferencia.pepunimed.com.br/video-conference';
const AUTH_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoiYXV0aF9wZXAiLCJ0eXBlIjoicGVwIn0.MNNhHBrrs4L5aojpo9uJZx0AbKADVDPSz8XXjNq4_Hk';

const VIDEO_PATH = path.resolve(__dirname, 'video_5s.y4m');
const AUDIO_PATH = path.resolve(__dirname, 'audio_5s.wav');

async function criarSala() {
  const scheduleId = uuidv4();

  const body = {
    systemIdentifier: "PEP_UNIMED",
    pepNotificationUrl: "http://conferenciapep.pepunimed.com.br/my-api",
    pepNotificationToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoiZXhhbXBsZSIsIm5hbWUiOiJleGFtcGxlIn0.J-nkbcnJvCyd8hEEYUYVysN861wTJ-eQFGe85KxU1RM",
    scheduleId: scheduleId,
    startDate: "2024-12-31T23:59:00.000Z",
    name: "Consulta Simulada",
    endTime: "2024-12-31T23:59:59.000Z",
    patient: {
      patientName: "Teste Paciente",
      patientBirthDate: "2000-12-01",
      patientTreatmentPronoun: "Sr(a)"
    },
    doctor: {
      doctorDocument: "12345",
      doctorName: "Teste Médico",
      doctorTreatmentPronoun: "Sr(a)"
    },
    clinic: {
      clinicEmail: "teste@clinica.com",
      clinicName: "Clínica Teste",
      clinicSite: "clinicadeteste.com",
      clinicResponsible: "Responsável Teste",
      clinicPhones: ["(11) 99999-9999"]
    }
  };

  const response = await axios.post(API_URL, body, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`
    }
  });

  return response.data;
}

async function simularUsuario(url, role) {
  console.log(`[${role}] Verificando arquivos de mídia fake...`);

  if (!fs.existsSync(VIDEO_PATH)) {
    console.error(`[${role}] Arquivo de vídeo não encontrado em ${VIDEO_PATH}`);
    return;
  }
  if (!fs.existsSync(AUDIO_PATH)) {
    console.error(`[${role}] Arquivo de áudio não encontrado em ${AUDIO_PATH}`);
    return;
  }

  const browser = await chromium.launch({
    headless: false,
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      `--use-file-for-fake-video-capture=${VIDEO_PATH}`,
      `--use-file-for-fake-audio-capture=${AUDIO_PATH}`
    ]
  });

  const context = await browser.newContext();
  const page = await context.newPage();
  console.log(`[${role}] Acessando ${url}`);
  await page.goto(url);

  try {
    await page.waitForSelector('button[aria-label*="microfone"], button[aria-label*="microphone"]', { timeout: 15000 });
    console.log(`[${role}] Elementos de mídia detectados.`);
  } catch (error) {
    console.warn(`[${role}] Elementos de mídia não encontrados dentro do tempo limite.`);
  }

  await page.screenshot({ path: `screenshot-${role}.png` });
  console.log(`[${role}] Screenshot salva.`);

  await page.waitForTimeout(5 * 60 * 1000);

  await browser.close();
  console.log(`[${role}] Navegador encerrado.`);
}

(async () => {
  const dados = await criarSala();
  const pacienteUrl = dados.pepPatientIframeUrl; // Corrigido!
  const medicoUrl = dados.pepDoctorIframeUrl;

  await Promise.all([
    simularUsuario(pacienteUrl, 'Paciente'),
    simularUsuario(medicoUrl, 'Médico')
  ]);

  console.log("✅ Simulação finalizada com sucesso.");
})();

