import React, { memo, useCallback, useMemo } from 'react';
import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton,
    ModalBody, ModalFooter, Text, Switch,
    HStack, Button, VStack, Icon, useColorMode,
    Divider, IconButton, useBreakpointValue
} from "@chakra-ui/react";
import { FaMoon, FaSun, FaTrophy } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import useColors from "../hooks/useColors";

// Sous-composants mémorisés pour éviter les re-renders inutiles
const GameModeDescription = memo(({ title, icon, description, colors, padding, spacing, textSize }) => (
  <VStack spacing={spacing} align="start" p={padding} borderRadius="md" bg={colors.backgroundLight} boxShadow="md">
    <Text fontWeight="bold" fontSize={textSize}>
      {icon} {title}
    </Text>
    <Text fontSize={textSize}>
      {description}
    </Text>
  </VStack>
));

const SettingsControls = memo(({ 
  t, 
  autoplay, 
  setAutoplay, 
  colorMode, 
  toggleColorMode, 
  i18n, 
  handleSwitchLanguage, 
  spacing, 
  textSize, 
  buttonSize 
}) => (
  <VStack spacing={spacing} align="center">
    <HStack spacing={spacing}>
      <Text fontSize={textSize} fontWeight="medium">🎧 {t("Autoplay")}</Text>
      <Switch
        id="autoplay"
        isChecked={autoplay}
        onChange={(e) => setAutoplay(e.target.checked)}
        colorScheme="blue"
        size={buttonSize}
      />
    </HStack>

    <HStack spacing={spacing}>
      <Text fontSize={textSize} fontWeight="medium">🎨 {t("Theme")}</Text>
      <IconButton
        icon={<Icon as={colorMode === "light" ? FaMoon : FaSun} />}
        onClick={toggleColorMode}
        colorScheme={colorMode === "light" ? "purple" : "yellow"}
        size={buttonSize}
      />
    </HStack>

    <HStack spacing={spacing}>
      <Text fontSize={textSize} fontWeight="medium">🌍 {t("Language")}</Text>
      <Button onClick={handleSwitchLanguage} colorScheme="blue" size={buttonSize}>
        {i18n.language === "fr" ? "🇬🇧 English" : "🇫🇷 Français"}
      </Button>
    </HStack>
  </VStack>
));

// Composant principal
const ParoldleModal = memo(({ isOpen, onClose, autoplay, setAutoplay }) => {
  console.log('ParoldleModal Rerendered');
  const { colorMode, toggleColorMode } = useColorMode();
  const colors = useColors();
  const { t, i18n } = useTranslation();
    
  // Utiliser directement des arrays pour les breakpoints
  const modalSize = useBreakpointValue(["sm", "md", "lg"]);
  const headerSize = useBreakpointValue(["xl", "2xl", "3xl"]);
  const textSize = useBreakpointValue(["sm", "md", "md"]);
  const titleSize = useBreakpointValue(["md", "lg", "xl"]);
  const spacing = useBreakpointValue([2, 3, 4]);
  const padding = useBreakpointValue([2, 3, 4]);
  const buttonSize = useBreakpointValue(["sm", "md", "md"]);

  // Mémoriser la fonction de changement de langue
  const handleSwitchLanguage = useCallback(() => {
    const newLanguage = i18n.language === "fr" ? "en" : "fr";
    i18n.changeLanguage(newLanguage);
  }, [i18n]);

  // Mémoriser les descriptions des modes de jeu avec composants spécialisés
  const gameModeProps = useMemo(() => ({
    colors,
    padding,
    spacing,
    textSize
  }), [colors, padding, spacing, textSize]);

  // Mémoriser les props pour les contrôles de paramètres
  const settingsProps = useMemo(() => ({
    t,
    autoplay, 
    setAutoplay,
    colorMode,
    toggleColorMode,
    i18n,
    handleSwitchLanguage,
    spacing,
    textSize,
    buttonSize
  }), [t, autoplay, setAutoplay, colorMode, toggleColorMode, i18n, handleSwitchLanguage, spacing, textSize, buttonSize]);

  // Mémoriser le contenu enrichi des descriptions
  const dailyDescription = useMemo(() => (
    <>
      {t("Each day, find the song of the day in as few tries as possible")} !{" "}
      {t("Once found, take a quiz about the artist to earn bonus points")} 🎯.{" "}
      {t("Compare your score with others and check the daily leaderboard")} 🏆.
    </>
  ), [t]);

  const classicDescription = useMemo(() => (
    <>
      {t("Find the")} <Text as="span" fontWeight="bold" color="blue.300">{t("song titles")}</Text> {t("from the lyrics")}.{" "}
      {t("Once found, switch to")} <Text as="span" fontWeight="bold" color="red.400">{t("Hardcore Mode")} 🔥</Text> {t("to guess all the lyrics and earn bonus points")}.
    </>
  ), [t]);

  const noplpDescription = useMemo(() => (
    <>
      {t("Select a song from the database")} {t("and try to find")} <Text as="span" fontWeight="bold" color="blue.300">{t("all the lyrics")}</Text> !{" "}
    </>
  ), [t]);

  const battleDescription = useMemo(() => (
    <>
      {t("Challenge your friends in a musical duel")} !{" "}
      {t("Be the first to find the")} <Text as="span" fontWeight="bold" color="blue.300">{t("song titles")}</Text>{" "}
      {t("to win the battle and steal trophies")} 🏆
    </>
  ), [t]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={modalSize} isCentered>
      <ModalOverlay />
      <ModalContent borderRadius="lg" boxShadow="2xl" mx={2}>
        <ModalHeader textAlign="center" fontSize={headerSize} fontWeight="bold">
          🎵 {t("Welcome to")} <Text as="span" color="blue.300">Paroldle</Text> 🎶
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={spacing} align="stretch">
            <Text fontSize={textSize}>
              {t("Guess the")} <Text as="span" fontWeight="bold" color="blue.300">{t("song titles")}</Text> {t("from the lyrics")} !{" "}
              {t("The more titles you find")}, {t("the more trophies you earn")} <Icon as={FaTrophy} color="yellow.400" /> {t("and unlock new songs")} ! 🏆
            </Text>
            <Text fontSize={textSize}>
              {t("Invite your friends to ")} <Text as="span" fontWeight="bold" color="blue.300">{t("help you out")}</Text> 🤝 {t("and play together")} !{" "}
              {t("You can also challenge them in")} <Text as="span" fontWeight="bold" color="blue.300">{t("Battle Mode")}</Text> {t("to steal their trophies")} 🏆
            </Text>

            <Text fontWeight="bold" fontSize={titleSize} textAlign="center" color="blue.400">
              🎮 {t("Available game modes")}
            </Text>

            {/* Modes de jeu */}
            <GameModeDescription 
              title={t("Daily Mode")}
              icon="📅"
              description={dailyDescription}
              {...gameModeProps}
            />

            <GameModeDescription 
              title={t("Classic Mode")}
              icon="🎼"
              description={classicDescription}
              {...gameModeProps}
            />

            <GameModeDescription 
              title={t("NOPLP Mode")}
              icon="⚔️"
              description={noplpDescription}
              {...gameModeProps}
            />

            <GameModeDescription 
              title={t("Battle Mode")}
              icon="🎵"
              description={battleDescription}
              {...gameModeProps}
            />

            <Divider borderWidth={2} borderColor={colors.text} width="80%" mx="auto" my={spacing} />

            {/* Paramètres */}
            <VStack spacing={spacing} align="stretch">
              <Text fontWeight="bold" fontSize={titleSize} textAlign="center">
                ⚙️ {t("Settings")}
              </Text>

              <SettingsControls {...settingsProps} />
            </VStack>
          </VStack>
        </ModalBody>
        <ModalFooter justifyContent="center">
          <Button onClick={onClose} colorScheme="blue" borderRadius="full" size={buttonSize}>
            🎶 {t("Play now")} !
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
});

export default ParoldleModal;