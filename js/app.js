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

// ── HELPERS ─────────────────────────────────
function mostrarTela(id) {
  document.querySelectorAll('.tela').forEach(t => {
    t.style.display = 'none';
    t.classList.remove('ativa');
  });
  const el = document.getElementById(id);
  el.style.display = 'flex';
  el.classList.add('ativa');
}

function embaralhar(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const NOMES_NIVEL = {
  '6ano': '6° Ano',
  '7ano': '7° Ano',
  '8ano': '8° Ano',
  '9ano': '9° Ano'
};

// ── GAME ────────────────────────────────────
const GAME = {
  perguntas: [],
  atual: 0,
  pontos: 0,
  timer: null,
  TEMPO: 20,
  nivel: null,

  async iniciar(nivel) {
    this.nivel = nivel;
    mostrarTela('quiz');

    // badge do nível
    document.getElementById('quiz-nivel-badge').textContent = NOMES_NIVEL[nivel] || nivel;

    // loading
    document.getElementById('loading').style.display = 'flex';
    document.getElementById('conteudo-quiz').style.display = 'none';

    try {
      const snap = await getDocs(collection(db, `perguntas_${nivel}`));
      const todas = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      if (!todas.length) {
        alert(`Ainda não há perguntas cadastradas para o ${NOMES_NIVEL[nivel]}.\nCadastre perguntas na coleção "perguntas_${nivel}" no Firestore.`);
        mostrarTela('inicio');
        return;
      }

      this.perguntas = embaralhar(todas).slice(0, 10);
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
    const total = this.perguntas.length;

    // progresso
    const pct = (this.atual / total) * 100;
    document.getElementById('progresso-fill').style.width = pct + '%';

    // número
    document.getElementById('num-pergunta').textContent = String(this.atual + 1).padStart(2, '0');
    document.getElementById('total-perguntas').textContent = total;
    document.getElementById('pontos-atual').textContent = this.pontos;

    // imagem da obra
    const img = document.getElementById('obra-imagem');
    const placeholder = document.getElementById('obra-placeholder');
    const wrap = document.getElementById('obra-imagem-wrap');

    if (p.imagem_url) {
      img.src = p.imagem_url;
      img.style.display = 'block';
      placeholder.style.display = 'none';
      wrap.style.display = 'flex';
      img.onerror = () => {
        img.style.display = 'none';
        placeholder.style.display = 'block';
      };
    } else {
      img.style.display = 'none';
      placeholder.style.display = 'block';
      // sem imagem: oculta o wrap para não ocupar espaço
      wrap.style.display = p.imagem_url ? 'flex' : 'none';
    }

    // tags
    document.getElementById('tag-categoria').textContent = p.categoria || '';
    const tagDif = document.getElementById('tag-dificuldade');
    tagDif.textContent = p.dificuldade || '';
    tagDif.className = 'tag tag-' + (p.dificuldade || 'medio');

    // enunciado
    document.getElementById('enunciado').textContent = p.enunciado;

    // alternativas
    const letras = ['A', 'B', 'C', 'D'];
    const container = document.getElementById('alternativas');
    container.innerHTML = '';

    embaralhar(p.alternativas.map((txt, i) => ({ txt, original: i }))).forEach(({ txt, original }) => {
      const btn = document.createElement('button');
      btn.className = 'alt-btn';
      btn.dataset.idx = original;
      btn.innerHTML = `<span class="alt-letra">${letras[container.children.length]}</span><span>${txt}</span>`;
      btn.onclick = () => this.responder(original);
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
    label.className = 'timer-num';
    fill.style.width = '100%';
    fill.className = 'timer-fill';

    this.timer = setInterval(() => {
      tempo--;
      label.textContent = tempo;
      fill.style.width = (tempo / this.TEMPO * 100) + '%';
      if (tempo <= 6) {
        label.className = 'timer-num urgente';
        fill.className  = 'timer-fill urgente';
      }
      if (tempo <= 0) { clearInterval(this.timer); this.responder(-1); }
    }, 1000);
  },

  responder(indiceOriginal) {
    clearInterval(this.timer);
    const p = this.perguntas[this.atual];
    const botoes = document.querySelectorAll('.alt-btn');

    botoes.forEach(b => {
      b.disabled = true;
      const idx = parseInt(b.dataset.idx);
      if (idx === p.resposta_correta) b.classList.add('correta');
      else if (idx === indiceOriginal) b.classList.add('errada');
    });

    if (indiceOriginal === p.resposta_correta) this.pontos++;
    document.getElementById('pontos-atual').textContent = this.pontos;

    setTimeout(() => {
      this.atual++;
      if (this.atual < this.perguntas.length) this.mostrarPergunta();
      else this.mostrarResultado();
    }, 1600);
  },

  mostrarResultado() {
    mostrarTela('resultado');
    const total = this.perguntas.length;
    const pct   = Math.round((this.pontos / total) * 100);

    document.getElementById('res-pontos').textContent = this.pontos;
    document.getElementById('res-total').textContent  = total;
    document.getElementById('res-pct').textContent    = pct + '% de aproveitamento';
    document.getElementById('nivel-badge-res').textContent = NOMES_NIVEL[this.nivel] || this.nivel;

    document.getElementById('progresso-fill').style.width = '100%';

    let emoji = '😔', msg = '"A arte é longa, a vida é breve." Continue explorando!';
    if (pct >= 80) { emoji = '🏆'; msg = '"A arte é a mentira que nos faz ver a verdade." — Picasso'; }
    else if (pct >= 60) { emoji = '🎨'; msg = '"A pintura é poesia muda." — Leonardo da Vinci'; }
    else if (pct >= 40) { emoji = '🏛️'; msg = '"Todo artista foi primeiro um amador." — Emerson'; }

    document.getElementById('res-emoji').textContent = emoji;
    document.getElementById('res-msg').textContent   = msg;
  }
};

// ── EVENTOS ─────────────────────────────────
document.querySelectorAll('.nivel-card').forEach(btn => {
  btn.addEventListener('click', () => GAME.iniciar(btn.dataset.nivel));
});

document.getElementById('btn-voltar').addEventListener('click', () => {
  clearInterval(GAME.timer);
  mostrarTela('inicio');
});

document.getElementById('btn-jogar-novamente').addEventListener('click', () => {
  GAME.iniciar(GAME.nivel);
});

document.getElementById('btn-menu').addEventListener('click', () => {
  mostrarTela('inicio');
});
