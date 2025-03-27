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
const PRINTS_DIR = path.resolve(__dirname, 'prints'); // pasta para prints
const RELATORIO_PATH = path.resolve(__dirname, 'relatorio.txt');

const TOTAL_SALAS = 10; // 60 salas => 120 usuários (Paciente + Médico)
const DURACAO_MS = 2 * 60 * 1000; // 2 minutos
const WAVE_INTERVAL_MS = 10000; // intervalo entre cada onda de criação de salas
const USUARIOS_POR_SALA = 2; // paciente + médico

if (!fs.existsSync(PRINTS_DIR)) {
  fs.mkdirSync(PRINTS_DIR);
}

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
  console.log(`[Sala ${salaId}] ${role} acessando ${url}`);

  await page.goto(url);

  try {
    await page.waitForTimeout(10000); // aguarda 10s antes do print
    await page.screenshot({ path: path.join(PRINTS_DIR, `sala${salaId}-${role}.png`) });
  } catch (e) {
    console.warn(`[Sala ${salaId}] ${role} - erro ao tirar screenshot.`);
  }

  try {
    await page.waitForTimeout(DURACAO_MS - 10000);
  } catch (e) {
    console.warn(`[Sala ${salaId}] Timeout encerrado.`);
  }

  await browser.close();
  console.log(`[Sala ${salaId}] ${role} finalizou.`);
  fs.appendFileSync(RELATORIO_PATH, `Sala ${salaId} - ${role} finalizado com sucesso\n`);
}

(async () => {
  const salas = [];
  for (let i = 1; i <= TOTAL_SALAS; i++) {
    const dados = await criarSala();
    salas.push({
      id: i,
      paciente: dados.pepPatientIframeUrl,
      medico: dados.pepDoctorIframeUrl
    });
    console.log(`[Sala ${i}] Criada. Aguardando ${WAVE_INTERVAL_MS / 1000}s para a próxima.`);
    await new Promise(resolve => setTimeout(resolve, WAVE_INTERVAL_MS));
  }

  const execucoes = [];
  for (const sala of salas) {
    execucoes.push(simularUsuario(sala.paciente, 'Paciente', sala.id));
    execucoes.push(simularUsuario(sala.medico, 'Médico', sala.id));
  }

  await Promise.all(execucoes);
  console.log("✅ Execução de carga finalizada.");
  fs.appendFileSync(RELATORIO_PATH, '\nExecução encerrada com sucesso.');
})();

