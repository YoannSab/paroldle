// // import * as use from '@tensorflow-models/universal-sentence-encoder';

// // Fonction pour charger le modèle Universal Sentence Encoder
// async function loadModel() {
//     const model = await use.load();
//     return model;
// }

// async function buildCache(model, words) {
//     const cache = {};
//     await Promise.all(
//         words.map(async word => {
//             await embed(model, cache, word.toLowerCase());
//         })
//     );
//     return cache;
// }

// async function embed(model, cache, word) {
//     if (cache[word]) {
//         return cache[word];
//     }

//     const embeddings = await model.embed(word);
//     const embedding = embeddings.arraySync()[0];
//     cache[word] = embedding;
//     return embedding;
// }

// // Fonction pour calculer la similarité cosinus entre deux vecteurs
// function cosineSimilarity(vecA, vecB) {
//     const dotProduct = vecA.map((val, i) => val * vecB[i]).reduce((acc, val) => acc + val, 0);
//     const normA = Math.sqrt(vecA.map(val => val * val).reduce((acc, val) => acc + val, 0));
//     const normB = Math.sqrt(vecB.map(val => val * val).reduce((acc, val) => acc + val, 0));
//     return dotProduct / (normA * normB);
// }

// // Fonction principale pour comparer deux mots
// async function compareWords(model, cache, word1, word2) {
//     // Obtenir les embeddings pour les mots
//     const [embeddingWord1, embeddingWord2] = await Promise.all([
//         embed(model, cache, word1),
//         embed(model, cache, word2),
//     ]);

//     // Calculer la similarité cosinus entre les embeddings
//     const sim = cosineSimilarity(embeddingWord1, embeddingWord2);
//     console.log(`Similarity between "${word1}" and "${word2}": ${sim}`);
//     return sim;
// }

// export { loadModel, compareWords, buildCache };
