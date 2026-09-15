export interface GifItem {
  id: string;
  title: string;
  url: string;
  category: string;
  tags: string[];
}

export const GIF_CATEGORIES = [
  { id: 'all', label: '🔥 Destaques' },
  { id: 'gratidao', label: '🙏 Obrigado & Gratidão' },
  { id: 'parabens', label: '🎉 Parabéns & Conquistas' },
  { id: 'reconhecimento', label: '👏 Aplausos & Top' },
  { id: 'equipe', label: '🤝 Parceria & Equipe' },
  { id: 'motivacao', label: '🚀 Motivação & Energia' },
  { id: 'carinho', label: '💛 Carinho & Abraço' },
  { id: 'humor', label: '😄 Alegria & Humor' },
  { id: 'cafe', label: '☕ Café & Pausa' },
];

export const CURATED_GIFS: GifItem[] = [
  // Obrigado & Gratidão
  {
    id: 'gif-obrigado-1',
    title: 'Muito Obrigado com Flores',
    url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3ZtMmNxNXl2NXAzb2p2ZWk5NGNvaWlzbTF6NXo0M2VqczZ0Ym5oMiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/osAcIGJnIsR8444Wfu/giphy.gif',
    category: 'gratidao',
    tags: ['obrigado', 'muito obrigado', 'gratidao', 'valeu', 'thanks', 'thank you', 'agradecimento', 'flores'],
  },
  {
    id: 'gif-obrigado-2',
    title: 'Gratidão e Coração',
    url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3ZtMmNxNXl2NXAzb2p2ZWk5NGNvaWlzbTF6NXo0M2VqczZ0Ym5oMiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/xdMXeiYZK61VMvv56q/giphy.gif',
    category: 'gratidao',
    tags: ['obrigado', 'gratidao', 'valeu', 'coração', 'heart', 'thank you', 'reconhecimento'],
  },
  {
    id: 'gif-obrigado-3',
    title: 'Valeu Demais!',
    url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3ZtMmNxNXl2NXAzb2p2ZWk5NGNvaWlzbTF6NXo0M2VqczZ0Ym5oMiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/xUPGcxpCV81ebKh7Vu/giphy.gif',
    category: 'gratidao',
    tags: ['valeu', 'obrigado', 'joinha', 'thumbs up', 'thanks', 'top', 'parceria'],
  },
  {
    id: 'gif-obrigado-4',
    title: 'Thank You So Much',
    url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3ZtMmNxNXl2NXAzb2p2ZWk5NGNvaWlzbTF6NXo0M2VqczZ0Ym5oMiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3oEjHWXddNP88GuGYU/giphy.gif',
    category: 'gratidao',
    tags: ['obrigado', 'gratidão', 'thanks', 'abraço', 'carinho', 'agradecido'],
  },

  // Parabéns & Conquistas
  {
    id: 'gif-parabens-1',
    title: 'Parabéns e Confetes',
    url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3ZtMmNxNXl2NXAzb2p2ZWk5NGNvaWlzbTF6NXo0M2VqczZ0Ym5oMiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/g9582DNuQppxC/giphy.gif',
    category: 'parabens',
    tags: ['parabens', 'festa', 'conquista', 'sucesso', 'brinde', 'champagne', 'celebracao', 'congrats', 'cheers'],
  },
  {
    id: 'gif-parabens-2',
    title: 'Comemoração e Festa',
    url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3ZtMmNxNXl2NXAzb2p2ZWk5NGNvaWlzbTF6NXo0M2VqczZ0Ym5oMiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/artj92V8o75VPL7AeQ/giphy.gif',
    category: 'parabens',
    tags: ['parabens', 'festa', 'dancinha', 'comemoracao', 'show', 'alegria', 'party'],
  },
  {
    id: 'gif-parabens-3',
    title: 'Você Mandou Muito Bem!',
    url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3ZtMmNxNXl2NXAzb2p2ZWk5NGNvaWlzbTF6NXo0M2VqczZ0Ym5oMiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/111ebonMs90YLu/giphy.gif',
    category: 'parabens',
    tags: ['mandou bem', 'parabens', 'top', 'arrasou', 'thumbs up', 'show', 'sucesso'],
  },
  {
    id: 'gif-parabens-4',
    title: 'Troféu e Vitória',
    url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3ZtMmNxNXl2NXAzb2p2ZWk5NGNvaWlzbTF6NXo0M2VqczZ0Ym5oMiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/ely3apij36BJhoZ224/giphy.gif',
    category: 'parabens',
    tags: ['vitoria', 'campeao', 'trofeu', 'sucesso', 'parabens', 'meta', 'conquista'],
  },

  // Reconhecimento & Aplausos
  {
    id: 'gif-aplausos-1',
    title: 'Aplausos de Pé',
    url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3ZtMmNxNXl2NXAzb2p2ZWk5NGNvaWlzbTF6NXo0M2VqczZ0Ym5oMiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/l3q2XhfQ8oCkm1GhO/giphy.gif',
    category: 'reconhecimento',
    tags: ['aplausos', 'palmas', 'clapping', 'bravo', 'top', 'reconhecimento', 'espetacular'],
  },
  {
    id: 'gif-aplausos-2',
    title: 'Sensacional / Palmas',
    url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3ZtMmNxNXl2NXAzb2p2ZWk5NGNvaWlzbTF6NXo0M2VqczZ0Ym5oMiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/nbvFVPiEiJH6JOGIok/giphy.gif',
    category: 'reconhecimento',
    tags: ['palmas', 'aplausos', 'clap', 'reconhecimento', 'mandou bem', 'inspiracao'],
  },
  {
    id: 'gif-aplausos-3',
    title: 'Aprovado com Louvor',
    url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3ZtMmNxNXl2NXAzb2p2ZWk5NGNvaWlzbTF6NXo0M2VqczZ0Ym5oMiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/26u4cqiYI30juCOGY/giphy.gif',
    category: 'reconhecimento',
    tags: ['aprovado', 'top', 'show', 'yes', 'perfeito', 'otimo', 'excelente'],
  },

  // Parceria & Equipe
  {
    id: 'gif-equipe-1',
    title: 'Toca Aqui / High Five',
    url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3ZtMmNxNXl2NXAzb2p2ZWk5NGNvaWlzbTF6NXo0M2VqczZ0Ym5oMiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/pHb82xtBPfqEg/giphy.gif',
    category: 'equipe',
    tags: ['toca aqui', 'high five', 'equipe', 'parceria', 'tamojunto', 'teamwork', 'amizade', 'uniao'],
  },
  {
    id: 'gif-equipe-2',
    title: 'Trabalho em Equipe Perfeito',
    url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3ZtMmNxNXl2NXAzb2p2ZWk5NGNvaWlzbTF6NXo0M2VqczZ0Ym5oMiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/l0ErFafpUCQTQFMSk/giphy.gif',
    category: 'equipe',
    tags: ['equipe', 'time', 'parceria', 'juntos', 'scl', 'stone', 'trabalho em equipe', 'team'],
  },
  {
    id: 'gif-equipe-3',
    title: 'Tamo Junto Sempre',
    url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3ZtMmNxNXl2NXAzb2p2ZWk5NGNvaWlzbTF6NXo0M2VqczZ0Ym5oMiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3oEjHV0z8S7WM4MwnK/giphy.gif',
    category: 'equipe',
    tags: ['tamojunto', 'parceria', 'amigo', 'colega', 'sintonia', 'apoio'],
  },

  // Motivação & Energia
  {
    id: 'gif-motivacao-1',
    title: 'Foguete Subindo / Rumo ao Topo',
    url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3ZtMmNxNXl2NXAzb2p2ZWk5NGNvaWlzbTF6NXo0M2VqczZ0Ym5oMiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/tXLpxypfSXvUc/giphy.gif',
    category: 'motivacao',
    tags: ['foguete', 'rocket', 'sucesso', 'vamos', 'energia', 'meta', 'topo', 'motivacao', 'stone'],
  },
  {
    id: 'gif-motivacao-2',
    title: 'Força e Foco!',
    url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3ZtMmNxNXl2NXAzb2p2ZWk5NGNvaWlzbTF6NXo0M2VqczZ0Ym5oMiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/yoJC2K6rCzwNY2EngA/giphy.gif',
    category: 'motivacao',
    tags: ['forca', 'foco', 'yes', 'energia', 'bora', 'vamos com tudo', 'poder'],
  },
  {
    id: 'gif-motivacao-3',
    title: 'Dança da Vitória',
    url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3ZtMmNxNXl2NXAzb2p2ZWk5NGNvaWlzbTF6NXo0M2VqczZ0Ym5oMiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/blSTtZehjAZ8I/giphy.gif',
    category: 'motivacao',
    tags: ['danca', 'vitoria', 'alegria', 'motivacao', 'animacao', 'energia', 'celebracao'],
  },

  // Carinho & Abraço
  {
    id: 'gif-carinho-1',
    title: 'Aquele Abraço Apertado',
    url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3ZtMmNxNXl2NXAzb2p2ZWk5NGNvaWlzbTF6NXo0M2VqczZ0Ym5oMiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/5OqXb948EBkyUcnwHt/giphy.gif',
    category: 'carinho',
    tags: ['abraco', 'carinho', 'hug', 'amizade', 'acolhimento', 'coracao', 'cuidado'],
  },
  {
    id: 'gif-carinho-2',
    title: 'Coração Amarelo & Amor',
    url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3ZtMmNxNXl2NXAzb2p2ZWk5NGNvaWlzbTF6NXo0M2VqczZ0Ym5oMiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/M90mJvfWfd5mbUuULX/giphy.gif',
    category: 'carinho',
    tags: ['coracao', 'amarelo', 'carinho', 'amor', 'love', 'afeto', 'luz', 'gratidao'],
  },
  {
    id: 'gif-carinho-3',
    title: 'Você é Especial',
    url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3ZtMmNxNXl2NXAzb2p2ZWk5NGNvaWlzbTF6NXo0M2VqczZ0Ym5oMiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3o7TKoWXm3okO1kgHC/giphy.gif',
    category: 'carinho',
    tags: ['especial', 'carinho', 'estrela', 'brilho', 'acolhimento', 'gratidao'],
  },

  // Café & Descontração
  {
    id: 'gif-cafe-1',
    title: 'Hora do Cafezinho',
    url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3ZtMmNxNXl2NXAzb2p2ZWk5NGNvaWlzbTF6NXo0M2VqczZ0Ym5oMiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3oriO04qxVReM5rJEA/giphy.gif',
    category: 'cafe',
    tags: ['cafe', 'coffee', 'pausa', 'conversa', 'descontracao', 'bom dia', 'energia'],
  },
  {
    id: 'gif-cafe-2',
    title: 'Pausa Merecida',
    url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3ZtMmNxNXl2NXAzb2p2ZWk5NGNvaWlzbTF6NXo0M2VqczZ0Ym5oMiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/hPTZgtzfRIB5Nfb5rL/giphy.gif',
    category: 'cafe',
    tags: ['descanso', 'relax', 'pausa', 'tranquilo', 'merecido', 'cafe'],
  },

  // Alegria & Humor
  {
    id: 'gif-humor-1',
    title: 'Sorriso Contagiante',
    url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3ZtMmNxNXl2NXAzb2p2ZWk5NGNvaWlzbTF6NXo0M2VqczZ0Ym5oMiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3oz8xAFtqoOUUrsh7W/giphy.gif',
    category: 'humor',
    tags: ['sorriso', 'alegria', 'rir', 'smile', 'happy', 'divertido', 'humor'],
  },
  {
    id: 'gif-humor-2',
    title: 'Dancinha Feliz',
    url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3ZtMmNxNXl2NXAzb2p2ZWk5NGNvaWlzbTF6NXo0M2VqczZ0Ym5oMiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/l3vRhaxZ279rxEjm0/giphy.gif',
    category: 'humor',
    tags: ['danca', 'dancinha', 'happy', 'sextou', 'anima', 'festa', 'alegria'],
  },
];
