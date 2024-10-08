import { Box, Text } from '@chakra-ui/react';
import { i } from 'framer-motion/client';
import React, { useEffect, useState } from 'react';
import { memo } from 'react';


function stringToList(text) {
    text = text.replace('\n', '. ');
    return text.match(/([\w\u00C0-\u017F]+|[^\s\w])/g);
}

const isAlphanumeric = (word) => {
    return /^[a-z0-9\u00C0-\u00FF]+$/i.test(word);
};

const LyricsComponent = ({ song, setVictory, guess, showAllSong, setGuessFeedback }) => {

    const [title, setTitle] = useState([]);
    const [lyrics, setLyrics] = useState([]);
    const [artist, setArtist] = useState([]);

    const [titleFound, setTitleFound] = useState([]);
    const [lyricsFound, setLyricsFound] = useState([]);
    const [artistFound, setArtistFound] = useState([]);
    const [currentIndexWordFound, setCurrentIndexWordFound] = useState({ "title": [], "lyrics": [], "artist": [] });


    // Initialisation des états (toujours appelés)
    useEffect(() => {
        if (!song) {
            return;
        }
        let titleList = stringToList(song.name);
        let lyricsList = stringToList(song.lyrics);
        let artist = stringToList(song.creator[0].name);

        setTitle(titleList);
        setLyrics(lyricsList);
        setArtist(artist);

        setTitleFound(titleList.reduce((acc, word, i) => {
            if (!isAlphanumeric(word)) {
              acc.push(i);
            }
            return acc;
          }, []));
        setLyricsFound(lyricsList.reduce((acc, word, i) => {
            if (!isAlphanumeric(word)) {
              acc.push(i);
            }
            return acc;
          }
            , []));
        setArtistFound(artist.reduce((acc, word, i) => {
            if (!isAlphanumeric(word)) {
              acc.push(i);
            }
            return acc;
          }
            , []));



    }, [song]);

    // Effet de mise à jour des mots trouvés lors du changement de guess
    useEffect(() => {
        if (guess && song) {
            let foundIndicesTitle = title.map((word, i) => {
                return word.toLowerCase() === guess.toLowerCase() && !titleFound.includes(i) ? i : -1;
            }).filter(i => i !== -1);
            setTitleFound([...titleFound, ...foundIndicesTitle]);


            let foundIndicesLyrics = lyrics.map((word, i) => {
                return word.toLowerCase() === guess.toLowerCase() && !lyricsFound.includes(i) ? i : -1;
            }).filter(i => i !== -1);
            setLyricsFound([...lyricsFound, ...foundIndicesLyrics]);

            let foundIndicesArtist = artist.map((word, i) => {
                return word.toLowerCase() === guess.toLowerCase() && !artistFound.includes(i) ? i : -1;
            }).filter(i => i !== -1);
            setArtistFound([...artistFound, ...foundIndicesArtist]);

            setGuessFeedback({
                'perfect_match': foundIndicesTitle.length + foundIndicesLyrics.length + foundIndicesArtist.length,
            });

            setCurrentIndexWordFound({
                "title": foundIndicesTitle,
                "lyrics": foundIndicesLyrics,
                "artist": foundIndicesArtist
            });
            console.log(artistFound, titleFound, lyricsFound);
        }
    }, [guess]);

    useEffect(() => {
        if (titleFound.length === title.length) {
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
                    <LyricWords key={i} word={word} isCurrentGuess={currentIndexWordFound.title.includes(i)} found={titleFound.includes(i) || showAllSong} />
                ))}
            </Box>
            <Box mb={4}>
                {artist.map((word, i) => (
                    <LyricWords key={i} word={word} isCurrentGuess={currentIndexWordFound.artist.includes(i)} found={artistFound.includes(i) || showAllSong} />
                ))}
            </Box>
            <Box>
                {lyrics.map((word, i) => (
                    <LyricWords key={i} word={word} isCurrentGuess={currentIndexWordFound.lyrics.includes(i)} found={lyricsFound.includes(i) || showAllSong} />
                ))}
            </Box>
        </>
    );
};

const LyricWords = ({ word, isCurrentGuess, found }) => {
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
        (found ? (
            isCurrentGuess ? (
                <Box
                    backgroundColor={'green.300'}
                    display={'inline-block'}
                    mr={3}
                    pl={1}
                    pr={1}
                    textAlign={'center'}
                    borderRadius={'md'}
                    transform='translateY(-2px)'
                >
                    <Text
                        fontSize={'lg'}
                    >
                        {word}
                    </Text>
                </Box>
            ) : (
                <Text fontSize={'lg'} display={'inline-block'} mr={3}>{word}</Text>
            )
        )
            : (
                <Box
                    width={word.length * 6} 
                    height={5} 
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
            ))
    );
};

export default memo(LyricsComponent);
