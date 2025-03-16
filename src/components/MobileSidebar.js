import React, { memo } from 'react';
import {
    Drawer,
    DrawerBody,
    DrawerOverlay,
    DrawerContent,
    DrawerCloseButton,
    Button,
    useDisclosure,
    Box,
} from '@chakra-ui/react';
import Sidebar from './Sidebar';
import useColors  from '../hooks/useColors';

const MobileSidebar = ({
    index,
    guessList,
    setIndex,
    foundSongs,
    trophies,
    setGameMode,
    gameMode,
    sideBarLoading,
    setSideBarLoading,
    inProgressSongs,
    isConnected,
    roomPlayers,
    otherPlayersInfo,
    setOtherPlayersInfo,
    setRtcModalOpen,
    playerName,
    sendGuessListCallback,
    setIsReady,
    battleState,
    setBattleState,
    myGuess,
    battleStartTime,
    setBattleStartTime,
    fightIndex,
    setFightIndex,
    gameState,
    setWantsTie,
    roomId,
    selectedImage,
    setGameState,
    dailyIndex,
    dailyScores,
    setDailySongOrQuiz,
    dailyTotalPoints,
}) => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const colors = useColors();
    console.log('MobileSidebar Reredendered');
    return (
        <>
            {/* Bouton pour ouvrir le Drawer, affiché uniquement sur mobile */}
            <Box display={{ base: 'block', xl: 'none' }} position="fixed" top="0" left="0" zIndex="1000" w="100%">
                <Button
                    p="2"
                    m="2"
                    borderRadius="md"
                    size="sm"
                    color="white"
                    bg={colors.primary}
                    onClick={onOpen}
                >
                    ☰ Menu
                </Button>
            </Box>
            <Drawer placement="left" onClose={onClose} isOpen={isOpen}>
                <DrawerOverlay>
                    <DrawerContent>
                        <DrawerCloseButton />
                        <DrawerBody bgColor={colors.primary} pb={10}>
                            <Sidebar
                                index={index}
                                guessList={guessList}
                                setIndex={setIndex}
                                foundSongs={foundSongs}
                                trophies={trophies}
                                setGameMode={setGameMode}
                                gameMode={gameMode}
                                sideBarLoading={sideBarLoading}
                                setSideBarLoading={setSideBarLoading}
                                inProgressSongs={inProgressSongs}
                                isConnected={isConnected}
                                roomPlayers={roomPlayers}
                                otherPlayersInfo={otherPlayersInfo}
                                setOtherPlayersInfo={setOtherPlayersInfo}
                                setRtcModalOpen={setRtcModalOpen}
                                playerName={playerName}
                                sendGuessListCallback={sendGuessListCallback}
                                setIsReady={setIsReady}
                                battleState={battleState}
                                setBattleState={setBattleState}
                                guess={myGuess}
                                battleStartTime={battleStartTime}
                                setBattleStartTime={setBattleStartTime}
                                fightIndex={fightIndex}
                                setFightIndex={setFightIndex}
                                gameState={gameState}
                                setWantsTie={setWantsTie}
                                roomId={roomId}
                                selectedImage={selectedImage}
                                setGameState={setGameState}
                                dailyIndex={dailyIndex}
                                dailyScores={dailyScores}
                                setDailySongOrQuiz={setDailySongOrQuiz}
                                dailyTotalPoints={dailyTotalPoints}
                                isMobile={true}
                            />
                        </DrawerBody>
                    </DrawerContent>
                </DrawerOverlay>
            </Drawer>
        </>
    );
};

export default memo(MobileSidebar);
