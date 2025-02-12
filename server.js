const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Servir les fichiers statiques de l'application React
app.use(express.static(path.join(__dirname, "build")));

// Gérer toutes les requêtes en renvoyant l'index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

// Écouter sur 0.0.0.0 pour un déploiement en production
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
