import seedrandom from 'seedrandom';

function getDeterministicRandom() {
    const seed = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
    return seedrandom(seed);
}

const rng = getDeterministicRandom();

async function getArtists() {
    const response = await fetch("/artists.json");
    return await response.json();
}

async function getSongs() {
    const response = await fetch("/songs_lyrics.json");
    return await response.json();
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function getRandomYears(correctYear, count) {
    const years = new Set();
    years.add(parseInt(correctYear));
    const currentYear = new Date().getFullYear();
    const oldestYear = 1800; // Année de référence minimale

    function getDynamicOffset(year) {
        const maxOffset = 30;
        const minOffset = 2;
        const rangeFactor = (currentYear - year) / Math.pow((currentYear - oldestYear), 0.80);
        return Math.max(minOffset, Math.ceil(maxOffset * rangeFactor));
    }

    while (years.size < count) {
        const offset = getDynamicOffset(correctYear);
        const randomOffset = Math.floor(rng() * (offset * 2 + 1)) - offset;
        const randomYear = parseInt(correctYear) + randomOffset;
        years.add(Math.min(randomYear, currentYear));
    }

    return shuffleArray(Array.from(years));
}

async function generateQuiz(songId) {
    const dataArtists = await getArtists();
    const dataSongs = await getSongs();

    const song = dataSongs[songId];
    const artist = dataArtists[song.author];

    const quiz = {
        song: song.title,
        artist: song.author,
        questions: []
    };

    // Question sur l'année de sortie
    const releaseYearQuestion = {
        type: "year",
        question: "What is the release year of this song?",
        correctAnswer: song.year,
        options: getRandomYears(song.year, 5)
    };
    quiz.questions.push(releaseYearQuestion);

    // Question sur la pochette d'album (avec nom)
    const album = artist.albums.find(a => a.title === song.album);
    if (!album || !album.image) {
        console.log(`No album found for song ${song.title} from ${song.album}`);
    }
    else {
        const otherAlbums = artist.albums.filter(a => a.title !== song.album && a.image);
        const albumOptions = shuffleArray([album, ...otherAlbums.slice(0, 4)]).map(a => ({
            image: a?.image,
            title: a?.title
        }));

        const albumQuestion = {
            type: "image",
            question: "What is the album of this song?",
            correctAnswer: { image: album.image, title: album.title },
            options: albumOptions
        };
        quiz.questions.push(albumQuestion);
    }

    // Question sur l'année de naissance
    const birthQuestion = {
        type: "year",
        question: artist.type === "Person" ? "What is the birth year of the artist?" : "What is the formation year of the band?",
        correctAnswer: parseInt(artist.birth_date),
        options: getRandomYears(artist.birth_date, 5)
    };
    quiz.questions.push(birthQuestion);

    if (artist.death_date) {
        const deathQuestion = {
            type: "year",
            question: artist.type === "Person" ? "What is the death year of the artist?" : "What is the disbandment year of the band?",
            correctAnswer: parseInt(artist.death_date),
            options: getRandomYears(artist.death_date, 5)
        };
        quiz.questions.push(deathQuestion);
    }

    // Question sur le pays
    const countries_possible_choices = {
        "FR": ["BE", "CA", "CH", "US"],
        "US": ["GB", "MX", "CA", "AU"],
        "GB": ["US", "CA", "AU", "FR"],
        "CA": ["US", "GB", "FR", "MX"],
        "AU": ["US", "GB", "FR", "MX"],
        "MX": ["US", "CA", "FR", "AU"],
        "BE": ["FR", "CH", "CA", "IT"],
        "CH": ["FR", "BE", "CA", "IT"],
        "IT": ["FR", "BE", "CA", "CH"]
    };

    if (artist.country) {
        const countryOptions = shuffleArray([artist.country, ...(countries_possible_choices[artist.country] ?? ["BE", "CA", "CH", "US"])])
        const countryQuestion = {
            type: "country",
            question: "Which country is this artist from?",
            correctAnswer: artist.country,
            options: countryOptions
        };
        quiz.questions.push(countryQuestion);
    }

    // Question sur les 5 chansons les plus populaires (sans options)
    const topSongsQuestion = {
        type: "free-text",
        question: "What are the most popular songs of this artist?",
        correctAnswers: artist.top_tracks.slice(0, 5),
    };
    quiz.questions.push(topSongsQuestion);

    // Question sur l'intrus (version améliorée)

    const similarArtists = artist.similar_artists?.filter(name => dataArtists[name])?.slice(0, 2);

    if (!similarArtists || similarArtists.length < 2) {
        console.log(`Not enough similar artists found for ${artist.name}`);
    } else {
        // Création des intrus avec leurs artistes
        const intruders = similarArtists.map(name => ({
            // random least popular song
            track: dataArtists[name].top_tracks.slice(-2)[0],
            artist: name
        }));

        // Sélection de 3 chansons légitimes
        const originalTracks = artist.top_tracks
            .filter(t => !intruders.some(i => i.track === t))
            .reverse()
            .slice(0, 3);

        const intruderOptions = shuffleArray([...originalTracks, ...intruders.map(i => i.track)]);

        const intruderQuestion = {
            type: "intruder",
            question: "Find the two intruder songs",
            correctAnswers: intruders.map(i => ({ track: i.track, artist: i.artist })),
            options: intruderOptions,
            explanation: "Les intrus proviennent de : " + intruders.map(i => `${i.track} (${i.artist})`).join(" et ")
        };
        quiz.questions.push(intruderQuestion);
    }

    return { quiz, songId };
}

async function generateDateBasedIndex() {

    const songs = await getSongs();
    const artists = await getArtists();

    // Sélectionner un index aléatoire
    const filteredSongs = Object.keys(songs).filter(id => Object.hasOwn(artists, songs[id].author));

    // random choice of song
    const songId = filteredSongs[Math.floor(rng() * filteredSongs.length)];

    return songId;
}

export { generateDateBasedIndex };

export default generateQuiz;