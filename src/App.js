import React, { useEffect } from 'react';
import { Button, Container, Box, Text, Input, Heading, Grid, GridItem, Image, HStack } from '@chakra-ui/react';
import { getSong } from './lyrics';
import { useState } from 'react';
import LyricsComponent from './LyricsComponent';
import FestiveModal from './FestiveModal';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';

function App() {
  const [song, setSong] = useState(null);
  const [inputWord, setInputWord] = useState('');
  const [lastWord, setLastWord] = useState('Mot');
  const [victory, setVictory] = useState(false);
  const [showVictory, setShowVictory] = useState(false);
  const [showAllSong, setShowAllSong] = useState(false);
  const [guess, setGuess] = useState('');
  const [guessList, setGuessList] = useState([]);
  const [index, setIndex] = useState(null);
  const [guessFeedback, setGuessFeedback] = useState({});

  useEffect(() => {
    let index = localStorage.getItem('index');
    if (index) {
      setIndex(parseInt(index));
    } else {
      const today = new Date();
      const day = today.getDate();
      setIndex(day);
    }
  }, []);

  const handleClickEnter = async () => {
    if (inputWord) {
      let inputWordTrim = inputWord.trim();
      setGuess(inputWordTrim);
      setLastWord(inputWordTrim);
      setInputWord('');
      setGuessList([...guessList, inputWordTrim]);
    }
  }

  const handleClickShowSong = async () => {
    if (victory) {
      setShowAllSong((prev) => !prev);
    }
  }

  useEffect(() => {
    if (victory) {
      setShowVictory(true);
    }
  }
    , [victory]);


  useEffect(() => {
    localStorage.setItem('index', index);
    getSong(index).then((data) => {
      setSong(data);
      console.log(data);
    });
    setVictory(false);
    setGuessList([]);
    
  }
    , [index]);


  return (
    <><FestiveModal isOpen={showVictory} onClose={() => setShowVictory(false)} />
      <Container
        maxW="full"
        //h="100vh"
        bg="rgb(168,133,136)"
        centerContent
        padding="4"
      >
        <Grid templateColumns="1fr 4fr" gap={4} w="full" >
          <GridItem>
            <Box bg="rgb(255, 215, 0)" p="4" borderRadius="3xl" textAlign="center" mt={10}>
              <Heading size="lg" mb="4">🎵 Paroldle</Heading>
              <Heading size="md" mb="4">Chanson n°{index}</Heading>
              <Box maxH="calc(100vh - 900px)" overflowY="auto">
                {guessList.reverse().map((word, i) => (
                  <Text key={i}>{guessList.length - i}. 🎵{word}</Text>
                ))}
              </Box>
            </Box>

            <Box bg="rgb(77,120,134)" p="4" borderRadius="3xl" shadow="md" mt={10}>
              <Heading size="lg" mb="4" color={'white'} textAlign={'center'}>Autres chansons</Heading>
              <Box h="calc(100vh - 550px)" overflowY="scroll">
                <Grid templateColumns="repeat(5, 1fr)" gap={4}>
                  {[...Array(73)].map((_, i) => (
                    <Button key={i} bg="gray.100" p="2" borderRadius="md" boxShadow="md" textAlign="center" onClick={() => setIndex(i+1)}>{i+1}</Button>
                  ))}
                </Grid>
              </Box>

            </Box>
          </GridItem>

          <GridItem>
            <Box bg="rgb(77,120,134)" p="4" borderRadius="3xl" shadow="md" mt={10}>
              <Image src="https://yoannsab.github.io/paroldle/paroldle2.png" alt="Paroldle" w={500} mx="auto" mb="4" />
              <Heading size="lg" mb="4" color={'white'} textAlign={'center'}>Découvrez la chanson d'aujourd'hui !</Heading>
              <HStack mb="4">
                <Heading size='lg'>🎤</Heading>
                <Input placeholder={lastWord} maxW={300} color={'white'} onKeyDown={(e) => { if (e.key === 'Enter') handleClickEnter(); }} value={inputWord} onChange={(e) => setInputWord(e.target.value)} />
                <Button colorScheme="blue" onClick={handleClickEnter} mr={4}>Rechercher</Button>
                {(Object.keys(guessFeedback).length > 0) && <Text>{ (guessFeedback.perfect_match > 0) ? '🟩'.repeat(guessFeedback.perfect_match) : '🟥'}</Text>}
                {victory && (showAllSong ? <ViewOffIcon boxSize={7} onClick={handleClickShowSong} /> : <ViewIcon boxSize={7} onClick={handleClickShowSong} />)}
              </HStack>
              <Box bg="gray.100" p="4" borderRadius="md" boxShadow="inset 4px 4px 8px rgba(0, 0, 0, 0.3), inset -4px -4px 8px rgba(255, 255, 255, 0.7)">
                <LyricsComponent song={song} setVictory={setVictory} guess={guess} showAllSong={showAllSong} setGuessFeedback={setGuessFeedback} />
              </Box>
            </Box>
          </GridItem>
        </Grid>
        <footer>
          <Text textAlign="center" mt={4} color="white" mb={5}>© 2024 Paroldle. Fais avec ❤️ pour Charline</Text>
        </footer>
      </Container></>
  );
}

export default App;
