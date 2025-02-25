import { useColorModeValue } from '@chakra-ui/react';

// constants.js
export const NORMAL_VICTORY_BASE_POINTS = 50; // points maximum pour une victoire normale
//export const NORMAL_VICTORY_GUESS_FACTOR = 5; // chaque essai en moins fait gagner 5 points en plus

export const HARDCORE_VICTORY_BONUS = 100; // bonus en cas de victoire hardcore

export const SONG_AVAILABILITY_INITIAL = 5; // en pourcentage (10% des chansons par style au départ)
export const SONG_AVAILABILITY_INCREMENT = 5; // on ajoute 10% par palier
export const SONG_AVAILABILITY_THRESHOLD = 200; // seuil de trophées pour débloquer 10% supplémentaires

export const N_CLUES = 5;

export const N_CLUE_BUY = 5; // nombre d'indices achetables pour 30 trophées

// Coût pour acheter des indices : 5 indices pour 30 trophées
export const CLUE_COST_COUNT = 5;
export const CLUE_COST_TROPHIES = 30;

// Nombre de chansons requises pour débloquer un palier (ex : 2 chansons)
export const SONGS_REQUIRED = 2;

export const useColors = () => {
    // Vous pouvez personnaliser ces valeurs selon vos besoins
    const background = useColorModeValue('rgb(245,169,188)', 'blue.800');
    const primary = useColorModeValue('rgb(163,193,224)', 'cyan.800');
    const text = useColorModeValue('black', 'white');
    const invText = useColorModeValue('white', 'black');
    const modalBg = useColorModeValue('white', 'gray.800');
    const redModal = useColorModeValue('red.500', 'red.200');
    const lyricsBg = useColorModeValue('white', 'gray.700');
    const guessBg = useColorModeValue('whiteAlpha.900', 'gray.800');
    const correctGuessBg = useColorModeValue('green.300', 'green.700');
    const maskedWordBg = useColorModeValue('gray.600', 'gray.600');
    const partialGuess = useColorModeValue('orange', 'orange.300');
    const guessListBg = useColorModeValue('rgb(255,245,204)', 'pink.700');
    const filtersBg = useColorModeValue('white', 'gray.700');
    const songBg = useColorModeValue('white', 'gray.600');
    const buttonBg = useColorModeValue('white', 'gray.500');
    const buttonBgHover = useColorModeValue('gray.200', 'gray.600');
    const blueButtonBg = useColorModeValue('blue.400', 'blue.800');
    const blueButtonBgHover = useColorModeValue('blue.500', 'blue.900');
    const pinkButtonBg = useColorModeValue('pink.200', 'pink.800');
    const pinkButtonBgHover = useColorModeValue('pink.300', 'pink.900');
    const tealButtonBg = useColorModeValue('teal.400', 'teal.800');
    const tealButtonBgHover = useColorModeValue('teal.500', 'teal.900');
    const orangeButtonBg = useColorModeValue('orange.200', 'orange.800');
    const orangeButtonBgHover = useColorModeValue('orange.300', 'orange.900');
    const tabsColors = [useColorModeValue("green.400", "green.800"), useColorModeValue("purple.500", "purple.800")];
    const tabsBgColors = [useColorModeValue("rgb(159, 218, 167)", "green.600"), useColorModeValue("purple.200", "purple.600")];
    return {
        background, tabsBgColors, tabsColors, primary, buttonBgHover, buttonBg, songBg, filtersBg, text, invText, partialGuess, guessListBg, modalBg, maskedWordBg, redModal, correctGuessBg, guessBg, lyricsBg
        , blueButtonBg, blueButtonBgHover, pinkButtonBg, pinkButtonBgHover, tealButtonBg, tealButtonBgHover, orangeButtonBg, orangeButtonBgHover
    };
};

export const styleEmojis = {
    "Pop": "💃",
    "Rock": "🎸",
    "Rap": "🎧",
    "French Classics": "📜",
    "French Youtube": "🎥",
    "Disney Songs": "🏰",
    "Metal": "🤘",
    "Reggae": "🇯🇲",
    "Jazz": "🎷",
    "Electro": "🎹",
    "Variété": "🎶",
    "Disco": "🕺",
    "Blues": "🎺",
    "Funk": "🎺",
    "Country": "🤠",
    "Soul": "🎙️",
    "Reggaeton": "🇵🇷",
    "R&B": "🎤",
    "Techno": "🎛️",
    "Punk": "🤘",
    "Indie": "🎸",
    "Folk": "🎻",
    "Gospel": "⛪",
    "Ambiance": "🎉",
    "Latino": "🇪🇸",
    "K-Pop": "🇰🇷",
    "World": "🌍",
    "Autre": "🎵"
};