import * as use from '@tensorflow-models/universal-sentence-encoder';

// Fonction pour charger le modèle Universal Sentence Encoder
async function loadModel() {
    const model = await use.load();
    return model;
}

// Fonction pour calculer la similarité cosinus entre deux vecteurs
function cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.map((val, i) => val * vecB[i]).reduce((acc, val) => acc + val, 0);
    const normA = Math.sqrt(vecA.map(val => val * val).reduce((acc, val) => acc + val, 0));
    const normB = Math.sqrt(vecB.map(val => val * val).reduce((acc, val) => acc + val, 0));
    return dotProduct / (normA * normB);
}

// Fonction principale pour comparer deux mots
async function compareWords() {
    const word1 = "chat";
    const word2 = "chien";

    // Charger le modèle
    const model = await loadModel();

    // Obtenir les embeddings pour les mots
    const embeddings = await model.embed([word1, word2]);

    // Extraire les vecteurs d'embeddings sous forme de tableau 2D (512 dimensions)
    const embeddingWord1 = embeddings.arraySync()[0]; // Vecteur 512-D pour le mot1
    const embeddingWord2 = embeddings.arraySync()[1]; // Vecteur 512-D pour le mot2

    const sim = cosineSimilarity(embeddingWord1, embeddingWord2);

    // Afficher le résultat
    alert(`Similarité cosinus entre "${word1}" et "${word2}": ${sim}`);
}

// // execute loadModel function when the page loads
// loadModel();
// compareWords();

