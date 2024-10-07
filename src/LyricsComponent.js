import { Box, Text } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { memo } from 'react';


function stringToList(text) {
    text = text.replace('\n', '. ');
    return text.match(/([\w\u00C0-\u017F]+|[^\s\w])/g);
}

const isAlphanumeric = (word) => {
    return /^[a-z0-9\u00C0-\u00FF]+$/i.test(word);
};

const LyricsComponent = ({ song, setVictory, guess, showAllSong }) => {

    const [title, setTitle] = useState([]);
    const [words, setWords] = useState([]);
    const [titleFound, setTitleFound] = useState([]);
    const [wordsFound, setWordsFound] = useState([]);

    // Initialisation des états (toujours appelés)
    useEffect(() => {
        if (!song) {
            return;
        }
        let titleList = stringToList(song.name);
        let wordsList = stringToList(song.lyrics);
        setTitle(titleList);
        setWords(wordsList);
        setTitleFound(titleList.map(() => false));
        setWordsFound(wordsList.map(() => false));
        
    }, [song]);

    // Effet de mise à jour des mots trouvés lors du changement de guess
    useEffect(() => {
        console.log('guess:', guess);
        if (guess && song) {
            let foundIndicesTitle = title.map((word, i) => {
                return word.toLowerCase() === guess.toLowerCase() ? i : -1;
            }).filter(i => i !== -1);
            console.log('foundIndicesTitle:', foundIndicesTitle);
            console.log('titleFound:', titleFound);
            setTitleFound(titleFound.map((val, i) => foundIndicesTitle.includes(i) || val));

            let foundIndicesWords = words.map((word, i) => {
                return word.toLowerCase() === guess.toLowerCase() ? i : -1;
            }).filter(i => i !== -1);
            setWordsFound(wordsFound.map((val, i) => foundIndicesWords.includes(i) || val));
        }
    }, [guess]);

    useEffect(() => {
        if (titleFound.length > 0 && titleFound.every(val => val)) {
            setVictory(true);
        }
    }, [titleFound]);

    if (!song) {
        return <Text>Loading...</Text>;
    }

    return (
        <>
            <Box mb={4}>
                {title.map((word, i) => (
                    <LyricWords key={i} word={word} found={titleFound[i] || showAllSong} />
                ))}
            </Box>
            <Box>
                {words.map((word, i) => (
                    <LyricWords key={i} word={word} found={wordsFound[i] || showAllSong} />
                ))}
            </Box>
        </>
    );
};

const LyricWords = ({ word, found }) => {
    const [showWordLength, setShowWordLength] = useState(false);

    const handleClick = () => {
        if (!found && isAlphanumeric(word)) {
            setShowWordLength(true);
            setTimeout(() => {
                setShowWordLength(false);
            }, 2000);
        }
    };

    return (
        found ? (
            <Text fontSize={'xl'} display={'inline-block'} color={'green.400'} mr={4}>{word}</Text>
        ) : isAlphanumeric(word) ? (
            <Box
                width={word.length * 6} // Largeur en fonction de la longueur du mot
                height={5} // Hauteur fixe
                backgroundColor={'gray.600'}
                display={'inline-block'}
                cursor={'pointer'}
                position={'relative'}
                mr={3}
                onClick={handleClick}
                textAlign={'center'}
                borderRadius={'md'}
            >
                {showWordLength && (
                    <Text
                        color={'white'}
                        position="absolute"
                        top="50%"
                        left="50%"
                        transform="translate(-50%, -50%)"
                        fontWeight={'bold'}
                        fontSize={'lg'}
                    >
                        {word.length}
                    </Text>
                )}
            </Box>
        ) : (
            <span>{word} </span>
        )
    );
};

export default memo(LyricsComponent);
