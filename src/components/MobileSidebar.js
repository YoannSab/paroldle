import React, { memo, useMemo } from 'react';
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
import useColors from '../hooks/useColors';

const MobileSidebar = memo(({
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
    console.log('MobileSidebar Rerendered');
    
    // Mémoriser les props pour Sidebar afin d'éviter la recréation à chaque render
    const sidebarProps = useMemo(() => ({
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
        guess: myGuess,
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
        isMobile: true
    }), [
        index, guessList, setIndex, foundSongs, trophies, setGameMode, gameMode,
        sideBarLoading, setSideBarLoading, inProgressSongs, isConnected, roomPlayers,
        otherPlayersInfo, setOtherPlayersInfo, setRtcModalOpen, playerName,
        sendGuessListCallback, setIsReady, battleState, setBattleState, myGuess,
        battleStartTime, setBattleStartTime, fightIndex, setFightIndex, gameState,
        setWantsTie, roomId, selectedImage, setGameState, dailyIndex, dailyScores,
        setDailySongOrQuiz, dailyTotalPoints
    ]);
    
    // Styles mémorisés pour le bouton
    const buttonStyles = useMemo(() => ({
        p: "2",
        m: "2",
        borderRadius: "md",
        size: "sm",
        color: "white",
        bg: colors.primary,
        onClick: onOpen
    }), [colors.primary, onOpen]);

    return (
        <>
            {/* Bouton pour ouvrir le Drawer, affiché uniquement sur mobile */}
            <Box position="fixed" top="0" left="0" zIndex="1000" w="100%">
                <Button {...buttonStyles}>
                    ☰ Menu
                </Button>
            </Box>
            
            {/* Drawer avec une largeur de 1/3 de l'écran */}
            <Drawer 
                placement="left" 
                onClose={onClose} 
                isOpen={isOpen}
                size="md" // Taille standard médium
            >
                <DrawerOverlay>
                    <DrawerContent 
                        maxW={{ base: "80%", sm: "80%", md: "50%"}} // 1/3 de l'écran sur les écrans md et plus grands
                    >
                        <DrawerCloseButton />
                        <DrawerBody bgColor={colors.primary} pb={10} px={2}>
                            <Sidebar {...sidebarProps} />
                        </DrawerBody>
                    </DrawerContent>
                </DrawerOverlay>
            </Drawer>
        </>
    );
});

export default MobileSidebar;