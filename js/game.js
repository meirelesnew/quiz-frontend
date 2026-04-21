const GAME = {
  perguntas: [],
  atual: 0,
  pontos: 0,
  timer: null,
  TEMPO_POR_PERGUNTA: 20,

  async iniciar() {
    try {
      mostrarTela('quiz');
      document.getElementById('loading').style.display = 'flex';
      document.getElementById('conteudo-quiz').style.display = 'none';

      const dados = await API.getPerguntas(10);
      this.perguntas = dados.perguntas;
      this.atual = 0;
      this.pontos = 0;

      document.getElementById('loading').style.display = 'none';
      document.getElementById('conteudo-quiz').style.display = 'block';

      this.mostrarPergunta();
    } catch (err) {
      alert('❌ Erro ao carregar perguntas.\nVerifique se o backend está rodando em localhost:3000');
      mostrarTela('inicio');
      console.error(err);
    }
  },

  mostrarPergunta() {
    const p = this.perguntas[this.atual];

    // Progresso
    const pct = ((this.atual) / this.perguntas.length) * 100;
    document.getElementById('barra-progresso').style.width = pct + '%';
    document.getElementById('num-pergunta').textContent = this.atual + 1;
    document.getElementById('total-perguntas').textContent = this.perguntas.length;
    document.getElementById('pontos-atual').textContent = this.pontos;

    // Categoria badge
    document.getElementById('categoria-badge').textContent = p.categoria;
    document.getElementById('dificuldade-badge').textContent = p.dificuldade;
    document.getElementById('dificuldade-badge').className = 'badge badge-' + p.dificuldade;

    // Enunciado
    document.getElementById('enunciado').textContent = p.enunciado;

    // Alternativas
    const container = document.getElementById('alternativas');
    container.innerHTML = '';
    const letras = ['A', 'B', 'C', 'D'];

    p.alternativas.forEach((alt, i) => {
      const btn = document.createElement('button');
      btn.className = 'alternativa';
      btn.innerHTML = `<span class="letra">${letras[i]}</span><span class="texto">${alt}</span>`;
      btn.onclick = () => this.responder(i);
      container.appendChild(btn);
    });

    // Timer
    this.iniciarTimer();
  },

  iniciarTimer() {
    clearInterval(this.timer);
    let tempo = this.TEMPO_POR_PERGUNTA;
    const el = document.getElementById('timer');
    el.textContent = tempo;
    el.style.color = '';

    this.timer = setInterval(() => {
      tempo--;
      el.textContent = tempo;
      if (tempo <= 5) el.style.color = '#ef4444';
      if (tempo <= 0) {
        clearInterval(this.timer);
        this.responder(-1); // tempo esgotado
      }
    }, 1000);
  },

  responder(indice) {
    clearInterval(this.timer);
    const p = this.perguntas[this.atual];
    const botoes = document.querySelectorAll('.alternativa');

    botoes.forEach(b => b.disabled = true);

    if (indice === -1) {
      // Tempo esgotado — só mostra a certa
      botoes[p.resposta_correta].classList.add('correta');
    } else {
      botoes[indice].classList.add(indice === p.resposta_correta ? 'correta' : 'errada');
      botoes[p.resposta_correta].classList.add('correta');
      if (indice === p.resposta_correta) this.pontos++;
    }

    document.getElementById('pontos-atual').textContent = this.pontos;

    setTimeout(() => {
      this.atual++;
      if (this.atual < this.perguntas.length) {
        this.mostrarPergunta();
      } else {
        this.mostrarResultado();
      }
    }, 1400);
  },

  mostrarResultado() {
    mostrarTela('resultado');
    const total = this.perguntas.length;
    const pct = Math.round((this.pontos / total) * 100);

    document.getElementById('res-pontos').textContent = this.pontos;
    document.getElementById('res-total').textContent = total;
    document.getElementById('res-pct').textContent = pct + '%';

    let emoji = '😔';
    let msg = 'Continue estudando!';
    if (pct >= 80) { emoji = '🏆'; msg = 'Excelente! Você é um especialista!'; }
    else if (pct >= 60) { emoji = '🎨'; msg = 'Muito bem! Você conhece bastante!'; }
    else if (pct >= 40) { emoji = '📚'; msg = 'Bom começo! Continue aprendendo!'; }

    document.getElementById('res-emoji').textContent = emoji;
    document.getElementById('res-msg').textContent = msg;
  }
};

function mostrarTela(id) {
  document.querySelectorAll('.tela').forEach(t => t.style.display = 'none');
  document.getElementById(id).style.display = 'flex';
}
