const API = {
  async getPerguntas(quantidade = 10) {
    const res = await fetch(`${CONFIG.API_URL}/perguntas?quantidade=${quantidade}`);
    if (!res.ok) throw new Error('Erro ao buscar perguntas');
    return res.json();
  }
};
