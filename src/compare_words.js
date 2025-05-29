// import { word_to_lemme } from "./word_to_lemme_thresh_1.js";
// import { embeddings } from "./embeddings_small.js";

// // Fonction pour calculer la similarité cosinus entre deux vecteurs
// function cosineSimilarity(wordA, wordB) {
//     const vecA = embeddings[wordA]
//         || (word_to_lemme[wordA] && embeddings[word_to_lemme[wordA][0]])
//         || null;

//     const vecB = embeddings[wordB]
//         || (word_to_lemme[wordB] && embeddings[word_to_lemme[wordB][0]])
//         || null;

//     if (!vecA || !vecB) {
//         console.error(`Word not found in model: ${wordA}, ${wordB}`);
//         return 0;
//     }
//     const dotProduct = vecA.map((val, i) => val * vecB[i]).reduce((acc, val) => acc + val, 0);
//     const normA = Math.sqrt(vecA.map(val => val * val).reduce((acc, val) => acc + val, 0));
//     const normB = Math.sqrt(vecB.map(val => val * val).reduce((acc, val) => acc + val, 0));
//     const sim = dotProduct / (normA * normB);
//     console.log(`Similarity between ${wordA} and ${wordB}: ${sim}`);
//     return sim;
// }


// export { cosineSimilarity };
