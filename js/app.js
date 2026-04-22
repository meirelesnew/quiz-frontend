import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getFirestore, collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

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

// ── HELPERS ─────────────────────────────────────────────
function mostrarTela(id) {
  document.querySelectorAll('.tela').forEach(t => t.style.display = 'none');
  document.getElementById(id).style.display = 'flex';
}

function embaralhar(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function buscarPerguntas(qtd = 10) {
  const snap = await getDocs(collection(db, 'perguntas'));
  const todas = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  if (!todas.length) throw new Error('Nenhuma pergunta no Firestore.');
  return embaralhar(todas).slice(0, qtd);
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
      document.getElementById('loading').style.display = 'block';
      document.getElementById('conteudo-quiz').style.display = 'none';

      this.perguntas = await buscarPerguntas(10);
      this.atual = 0;
      this.pontos = 0;

      document.getElementById('loading').style.display = 'none';
      document.getElementById('conteudo-quiz').style.display = 'block';
      this.mostrarPergunta();
    } catch (err) {
      console.error(err);
      alert('Erro ao carregar perguntas: ' + err.message);
      mostrarTela('inicio');
    }
  },

  mostrarPergunta() {
    const p = this.perguntas[this.atual];
    const num = String(this.atual + 1).padStart(2, '0');

    document.getElementById('num-pergunta').textContent = num;
    document.getElementById('total-perguntas').textContent = this.perguntas.length;
    document.getElementById('pontos-atual').textContent = this.pontos;

    document.getElementById('tag-categoria').textContent = p.categoria || '';
    const tagDif = document.getElementById('tag-dificuldade');
    tagDif.textContent = p.dificuldade || '';
    tagDif.className = 'tag tag-' + (p.dificuldade || 'medio');

    document.getElementById('enunciado').textContent = p.enunciado;

    const letras = ['A', 'B', 'C', 'D'];
    const container = document.getElementById('alternativas');
    container.innerHTML = '';

    p.alternativas.forEach((alt, i) => {
      const btn = document.createElement('button');
      btn.className = 'alt-btn';
      btn.innerHTML = `<span class="alt-letra">${letras[i]}</span><span>${alt}</span>`;
      btn.onclick = () => this.responder(i);
      container.appendChild(btn);
    });

    this.iniciarTimer();
  },

  iniciarTimer() {
    clearInterval(this.timer);
    let tempo = this.TEMPO;
    const label = document.getElementById('timer');
    const fill  = document.getElementById('timer-fill');

    label.textContent = tempo;
    label.className = 'timer-label';
    fill.style.width = '100%';
    fill.className = 'timer-fill';

    this.timer = setInterval(() => {
      tempo--;
      label.textContent = tempo;
      fill.style.width = (tempo / this.TEMPO * 100) + '%';

      if (tempo <= 6) {
        label.className = 'timer-label urgente';
        fill.className  = 'timer-fill urgente';
      }
      if (tempo <= 0) {
        clearInterval(this.timer);
        this.responder(-1);
      }
    }, 1000);
  },

  responder(indice) {
    clearInterval(this.timer);
    const p = this.perguntas[this.atual];
    const botoes = document.querySelectorAll('.alt-btn');

    botoes.forEach(b => b.disabled = true);

    if (indice >= 0) {
      botoes[indice].classList.add(indice === p.resposta_correta ? 'correta' : 'errada');
      if (indice === p.resposta_correta) this.pontos++;
    }
    botoes[p.resposta_correta].classList.add('correta');
    document.getElementById('pontos-atual').textContent = this.pontos;

    setTimeout(() => {
      this.atual++;
      if (this.atual < this.perguntas.length) this.mostrarPergunta();
      else this.mostrarResultado();
    }, 1500);
  },

  mostrarResultado() {
    mostrarTela('resultado');
    const total = this.perguntas.length;
    const pct   = Math.round((this.pontos / total) * 100);

    document.getElementById('res-pontos').textContent = this.pontos;
    document.getElementById('res-total').textContent  = total;
    document.getElementById('res-pct').textContent    = pct + '% de aproveitamento';

    let emoji = '😔', msg = '"A arte é longa, a vida é breve." Continue explorando.';
    if (pct >= 80) { emoji = '🏆'; msg = '"A arte é a mentira que nos faz ver a verdade." — Picasso'; }
    else if (pct >= 60) { emoji = '🎨'; msg = '"A pintura é poesia muda." — Leonardo da Vinci'; }
    else if (pct >= 40) { emoji = '🏛️'; msg = '"Todo artista foi primeiro um amador." — Emerson'; }

    document.getElementById('res-emoji').textContent = emoji;
    document.getElementById('res-msg').textContent   = msg;
  }
};

// ── EVENTOS ─────────────────────────────────────────────
document.getElementById('btn-iniciar').addEventListener('click', () => GAME.iniciar());
document.getElementById('btn-jogar-novamente').addEventListener('click', () => GAME.iniciar());
document.getElementById('btn-menu').addEventListener('click', () => mostrarTela('inicio'));
document.getElementById('btn-como-funciona').addEventListener('click', () => {
  alert('🎨 Como funciona:\n\n• 10 perguntas aleatórias por rodada\n• 20 segundos por questão\n• Sem resposta no tempo = pergunta perdida\n• Clique na alternativa correta para pontuar');
});
