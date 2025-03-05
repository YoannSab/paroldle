import { useColorModeValue } from '@chakra-ui/react';

const useColors = () => {
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
    const partialGuessOnNormal = useColorModeValue('orange.300', 'orange.300');
    const maskedWordBg = useColorModeValue('gray.600', 'gray.600');
    const partialOnOtherPlayersGuess = useColorModeValue('orange.800', 'orange.300');
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
    const tabsColors = [useColorModeValue("green.400", "green.800"), useColorModeValue("purple.500", "purple.800"), useColorModeValue("blue.400", "blue.800")];
    const tabsBgColors = [useColorModeValue("rgb(159, 218, 167)", "green.600"), useColorModeValue("purple.200", "purple.600"), useColorModeValue("blue.200", "blue.600")];
    const otherPlayersGuessBg = useColorModeValue('cyan.400', 'cyan.700');
    return {
        background, tabsBgColors, tabsColors, primary, buttonBgHover, buttonBg, songBg, filtersBg, text, invText, guessListBg, modalBg, maskedWordBg, redModal, correctGuessBg, guessBg, lyricsBg
        , blueButtonBg, blueButtonBgHover, pinkButtonBg, pinkButtonBgHover, tealButtonBg, tealButtonBgHover, orangeButtonBg, orangeButtonBgHover, otherPlayersGuessBg, partialGuessOnNormal, partialOnOtherPlayersGuess
    };
}

export default useColors;