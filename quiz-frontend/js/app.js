import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getFirestore, collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// ── CONFIG ──────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyC6wiRzX7RJfhOsr40N8gJuTHzv7WRzXG8",
  authDomain: "quiz-ba0e1.firebaseapp.com",
  projectId: "quiz-ba0e1",
  storageBucket: "quiz-ba0e1.firebasestorage.app",
  messagingSenderId: "95191392925",
  appId: "1:95191392925:web:f54a697a1b5f05cdd12a74",
  measurementId: "G-WLRKXHP7W6"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ── API ─────────────────────────────────────────────────
async function getPerguntas(quantidade = 10) {
  const snapshot = await getDocs(collection(db, 'perguntas'));
  const todas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  if (todas.length === 0) throw new Error('Nenhuma pergunta cadastrada no Firestore.');

  // Fisher-Yates
  for (let i = todas.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [todas[i], todas[j]] = [todas[j], todas[i]];
  }

  return todas.slice(0, quantidade);
}

// ── HELPERS ─────────────────────────────────────────────
function mostrarTela(id) {
  document.querySelectorAll('.tela').forEach(t => t.style.display = 'none');
  document.getElementById(id).style.display = 'flex';
}

// ── GAME ────────────────────────────────────────────────
const GAME = {
  perguntas: [],
  atual: 0,
  pontos: 0,
  timer: null,
  TEMPO: 20,

  async iniciar() {
    try {
      mostrarTela('quiz');
      document.getElementById('loading').style.display = 'flex';
      document.getElementById('conteudo-quiz').style.display = 'none';

      this.perguntas = await getPerguntas(10);
      this.atual = 0;
      this.pontos = 0;

      document.getElementById('loading').style.display = 'none';
      document.getElementById('conteudo-quiz').style.display = 'block';

      this.mostrarPergunta();
    } catch (err) {
      console.error(err);
      alert('❌ Erro ao carregar perguntas.\n\n' + err.message);
      mostrarTela('inicio');
    }
  },

  mostrarPergunta() {
    const p = this.perguntas[this.atual];
    const pct = (this.atual / this.perguntas.length) * 100;

    document.getElementById('barra-progresso').style.width = pct + '%';
    document.getElementById('num-pergunta').textContent = this.atual + 1;
    document.getElementById('total-perguntas').textContent = this.perguntas.length;
    document.getElementById('pontos-atual').textContent = this.pontos;
    document.getElementById('categoria-badge').textContent = p.categoria || '';
    document.getElementById('dificuldade-badge').textContent = p.dificuldade || '';
    document.getElementById('dificuldade-badge').className = 'badge badge-' + (p.dificuldade || 'medio');
    document.getElementById('enunciado').textContent = p.enunciado;

    const letras = ['A', 'B', 'C', 'D'];
    const container = document.getElementById('alternativas');
    container.innerHTML = '';

    p.alternativas.forEach((alt, i) => {
      const btn = document.createElement('button');
      btn.className = 'alternativa';
      btn.innerHTML = `<span class="letra">${letras[i]}</span><span class="texto">${alt}</span>`;
      btn.onclick = () => this.responder(i);
      container.appendChild(btn);
    });

    this.iniciarTimer();
  },

  iniciarTimer() {
    clearInterval(this.timer);
    let tempo = this.TEMPO;
    const el = document.getElementById('timer');
    el.textContent = tempo;
    el.style.color = '';

    this.timer = setInterval(() => {
      tempo--;
      el.textContent = tempo;
      if (tempo <= 5) el.style.color = '#ef4444';
      if (tempo <= 0) { clearInterval(this.timer); this.responder(-1); }
    }, 1000);
  },

  responder(indice) {
    clearInterval(this.timer);
    const p = this.perguntas[this.atual];
    const botoes = document.querySelectorAll('.alternativa');

    botoes.forEach(b => b.disabled = true);

    if (indice === -1) {
      botoes[p.resposta_correta].classList.add('correta');
    } else {
      botoes[indice].classList.add(indice === p.resposta_correta ? 'correta' : 'errada');
      botoes[p.resposta_correta].classList.add('correta');
      if (indice === p.resposta_correta) this.pontos++;
    }

    document.getElementById('pontos-atual').textContent = this.pontos;

    setTimeout(() => {
      this.atual++;
      if (this.atual < this.perguntas.length) this.mostrarPergunta();
      else this.mostrarResultado();
    }, 1400);
  },

  mostrarResultado() {
    mostrarTela('resultado');
    const total = this.perguntas.length;
    const pct   = Math.round((this.pontos / total) * 100);

    document.getElementById('res-pontos').textContent = this.pontos;
    document.getElementById('res-total').textContent  = total;
    document.getElementById('res-pct').textContent    = pct + '%';

    let emoji = '😔', msg = 'Continue estudando!';
    if (pct >= 80) { emoji = '🏆'; msg = 'Excelente! Você é um especialista!'; }
    else if (pct >= 60) { emoji = '🎨'; msg = 'Muito bem! Você conhece bastante!'; }
    else if (pct >= 40) { emoji = '📚'; msg = 'Bom começo! Continue aprendendo!'; }

    document.getElementById('res-emoji').textContent = emoji;
    document.getElementById('res-msg').textContent   = msg;
  }
};

// ── EVENTOS ─────────────────────────────────────────────
document.getElementById('btn-iniciar').addEventListener('click', () => GAME.iniciar());
document.getElementById('btn-jogar-novamente').addEventListener('click', () => GAME.iniciar());
document.getElementById('btn-menu').addEventListener('click', () => mostrarTela('inicio'));
