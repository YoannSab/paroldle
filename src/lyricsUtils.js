// lyricsUtils.js
import { word_to_lemme } from './word_to_lemme_thresh_1.js';

/**
 * Transforme un texte en une liste de tokens (mots, ponctuation et retours à la ligne).
 */
export const stringToList = (text, lang) => {
  return text
    .replace(/\n+/g, "\n")
    .split(/\r?\n/)
    .map((line) => {
      let tokens = [];
      if (lang === "english") {
        // On récupère d'abord les tokens, en incluant les apostrophes dans les contractions
        tokens = line.match(/([\w]+(?:'[a-z]+)?)|[^\s\w]/gi) || [];
        // Pour l'anglais, on déplace l'apostrophe sur le token suivant,
        // sauf si le token est une négation (contenant "n't")
        tokens = tokens.flatMap((token) => {
          if (
            token.includes("'") &&
            !token.toLowerCase().includes("n't")
          ) {
            const idx = token.indexOf("'");
            // Ne splitter que si l'apostrophe n'est pas en première position
            if (idx > 0) {
              return [token.slice(0, idx), token.slice(idx)];
            }
          }
          return token;
        });
      } else {
        // Pour le français, on garde le comportement d'origine
        tokens = line.match(/([\w\u00C0-\u017F]+(?:')?|[^\s\w])/g) || [];
      }
      // On ajoute un saut de ligne à la fin de chaque ligne
      return [...tokens, "\n"];
    })
    .flat();
};


/**
 * Vérifie si un mot est alphanumérique.
 */
export const isAlphanumeric = (word) =>
  /^[a-z0-9\u00C0-\u00FF\u0152\u0153']+$/i.test(word);

/**
 * Vérifie un cas particulier : un mot d'une lettre suivi d'une apostrophe.
 */
export const endsWithApostrophe = (word) =>
  /^[a-zA-Z\u00C0-\u00FF\u0152\u0153]+'$/i.test(word);

/**
 * Recherche un point de coupure dans les paroles afin de pouvoir les afficher en deux colonnes.
 */
export const findBreakPoint = (lyrics) => {
  if (!lyrics) return 0;
  const middle = Math.floor(lyrics.length / 2);
  for (let i = middle; i < lyrics.length; i++) {
    if (lyrics[i] === "\n") return i + 1;
  }
  for (let i = middle; i >= 0; i--) {
    if (lyrics[i] === "\n") return i + 1;
  }
  return middle;
};

/**
 * Retire les diacritiques d'une chaîne de caractères.
 * Par exemple, "éàèùâ" devient "eaeua".
 *
 * La méthode normalize("NFD") décompose chaque caractère accentué en la lettre de base et ses diacritiques.
 * Ensuite, la regex supprime uniquement les diacritiques.
 *
 * @param {string} str - La chaîne d'origine.
 * @returns {string} - La chaîne sans diacritiques.
 */
export function removeDiacritics(str) {
  return str
    .replace(/œ/g, "oe") // Remplace "œ" par "oe"
    .normalize("NFD") // Décompose les caractères accentués
    .replace(/[\u0300-\u036f]/g, ""); // Supprime les diacritiques
}


/**
 * Calcule la distance de Levenshtein entre deux chaînes.
 * Cette version utilise deux tableaux pour optimiser l'utilisation mémoire.
 *
 * @param {string} a - Première chaîne.
 * @param {string} b - Deuxième chaîne.
 * @returns {number} - La distance de Levenshtein.
 */
export function levenshteinDistance(a, b) {
  if (a === b) return 0;
  const aLen = a.length;
  const bLen = b.length;
  if (aLen === 0) return bLen;
  if (bLen === 0) return aLen;

  const v0 = new Array(bLen + 1);
  const v1 = new Array(bLen + 1);

  for (let i = 0; i <= bLen; i++) {
    v0[i] = i;
  }

  for (let i = 0; i < aLen; i++) {
    v1[0] = i + 1;
    for (let j = 0; j < bLen; j++) {
      const cost = a[i] === b[j] ? 0 : 1;
      v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
    }
    // Copie v1 dans v0 pour la prochaine itération
    for (let j = 0; j <= bLen; j++) {
      v0[j] = v1[j];
    }
  }
  return v0[bLen];
}

/**
 * Calcule une similarité entre deux chaînes, basée sur la distance de Levenshtein.
 * La similarité est comprise entre 0 et 1 (1 = chaînes identiques).
 *
 * @param {string} a - Première chaîne.
 * @param {string} b - Deuxième chaîne.
 * @returns {number} - Similarité entre a et b.
 */
export function similarity(a, b) {
  const distance = levenshteinDistance(a, b);
  const maxLen = Math.max(a.length, b.length);
  return maxLen === 0 ? 1 : 1 - distance / maxLen;
}

/**
 * Compare le mot deviné (guess) avec un mot de référence (word).
 * La comparaison se fait :
 *  - D'abord par égalité (avec et sans diacritiques)
 *  - Puis en testant un cas particulier pour un mot d'une lettre suivi d'une apostrophe.
 *  - Enfin, par lemmatisation via word_to_lemme.
 *
 * @param {string} guess - Le mot deviné.
 * @param {string} word - Le mot à comparer.
 * @returns {boolean} - true si le mot est considéré comme un match parfait.
 */
export const matchWord = (guess, word, lang) => {
  const guessLower = guess.toLowerCase();
  const wordLower = word.toLowerCase();
  const guessNoAccent = removeDiacritics(guessLower);
  const wordNoAccent = removeDiacritics(wordLower);

  // 1. Comparaison directe (avec ou sans diacritiques)
  if (guessLower === wordLower || guessNoAccent === wordNoAccent) {
    return 1;
  }

  // // 2. Normalisation pour articles et pronoms (traitement du genre et du pluriel)
  // const normalizeArticlePronoun = (w) => {
  //   let lw = w;

  //   // Normalisation pour "il", "elle", "le", "la" et "l'"
  //   // if (["il", "elle", "on"].includes(lw)) return "il";
  //   // if (["le", "la", "les", "l'"].includes(lw)) return "le";
  //   // if (['mon', 'ma', 'mes'].includes(lw)) return 'mon';
  //   // if (['ton', 'ta', 'tes'].includes(lw)) return 'ton';
  //   // if (['son', 'sa', 'ses'].includes(lw)) return 'son';
  //   // if (['notre', 'nos', 'votre', 'vos', 'leur', 'leurs'].includes(lw)) return 'leur';
  //   // if (['ce', 'cet', 'cette', 'ces', "c'"].includes(lw)) return 'ce';
  //   // if (['un', 'une', 'des'].includes(lw)) return 'un';
  //   // if (['ceci', 'cela', 'ca'].includes(lw)) return 'ceci';
  //   // if (['moi','je', "j'"].includes(lw)) return 'je';
  //   // if (['toi','tu', "te", "t'"].includes(lw)) return 'tu';
  //   // if (["me", "m'"].includes(lw)) return 'me';
  //   // if (["se", "s'"].includes(lw)) return 'se';
  //   // if (['de', "d'"].includes(lw)) return 'de';
  //   // if (['ne', "n'"].includes(lw)) return 'ne';
  //   // if (['que', "qu'", "qui"].includes(lw)) return 'que';


  //   // // Retire le 's' final pour traiter le pluriel
  //   // if (lw.endsWith("s")) {
  //   //   lw = lw.slice(0, -1);
  //   // }
  //   return lw;
  // };

  let normGuess = guessNoAccent;
  let normWord = wordNoAccent;

  // if (lang === "french") {
  //   normGuess = normalizeArticlePronoun(guessNoAccent);
  //   normWord = normalizeArticlePronoun(wordNoAccent);
  // }

  if (lang === "english") {
    const normalizeEnglish = (lw) => {
      // English negations, if n't 
      if (lw.endsWith("n't")) {
        lw = lw.slice(0, -3);
      }
      // may, might, must, shall, should, will, would, can, could, ain't
      if (lw === 'ca') return 'can';
      if (lw === 'wo') return 'will';
      if (lw === "ai") return "be";
      return lw;
    };

    normGuess = normalizeEnglish(guessNoAccent);
    normWord = normalizeEnglish(wordNoAccent);
  }

  // 6. Comparaison par lemmatisation (si disponible)
  const guessLems = word_to_lemme[normGuess] || [normGuess];
  const wordLems = word_to_lemme[normWord] || [normWord];
  if (guessLems.some((lem) => wordLems.includes(lem))) {
    return 1;
  }

  // 5. Si la similarité (sans accents) est très élevée (≥ 0.95), c'est un match parfait
  const sim = similarity(normGuess, normWord);
  return sim >= 0.9 ? 1 : sim;
};

