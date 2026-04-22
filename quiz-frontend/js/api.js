// API usa Firestore diretamente — sem backend
const API = {
  db: null,

  async init() {
    if (this.db) return;
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
    const { getFirestore, collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    const app = initializeApp(firebaseConfig);
    this.db = getFirestore(app);
    this._collection = collection(this.db, 'perguntas');
    this._getDocs = getDocs;
  },

  async getPerguntas(quantidade = 10) {
    await this.init();
    const snapshot = await this._getDocs(this._collection);
    const todas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (todas.length === 0) throw new Error('Nenhuma pergunta no Firestore');

    // Fisher-Yates shuffle
    for (let i = todas.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [todas[i], todas[j]] = [todas[j], todas[i]];
    }

    const selecionadas = todas.slice(0, quantidade);
    return { total: selecionadas.length, perguntas: selecionadas };
  }
};
