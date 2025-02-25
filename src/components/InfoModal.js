import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton,
    ModalBody, ModalFooter, Text, Switch,
    HStack, Button, VStack, Icon, useColorMode,
    Divider,
    IconButton
} from "@chakra-ui/react";
import { FaMoon, FaSun, FaTrophy } from "react-icons/fa";
import { useColors } from "../constants";
import { useTranslation } from "react-i18next";

const ParoldleModal = ({ isOpen, onClose, autoplay, setAutoplay }) => {
    const { colorMode, toggleColorMode } = useColorMode();
    const colors = useColors();
    const { t, i18n } = useTranslation();

    const handleSwitchLanguage = () => {
        const newLanguage = i18n.language === "fr" ? "en" : "fr";
        i18n.changeLanguage(newLanguage);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
            <ModalOverlay />
            <ModalContent borderRadius="lg" boxShadow="2xl">
                <ModalHeader textAlign="center" fontSize="3xl" fontWeight="bold">
                    🎵 {t("Welcome to")} <Text as="span" color="blue.300">Paroldle</Text> 🎶
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack spacing={4} align="stretch">
                        <Text>
                            {t("Guess the")} <Text as="span" fontWeight="bold" color="blue.300">{t("song titles")}</Text> {t("from the lyrics")} !{" "}
                            {t("The more titles you find")},{" "} {t("the more trophies you earn")} <Icon as={FaTrophy} color="yellow.400" /> {t("and unlock new songs")} ! 🎤
                        </Text>
                        
                        <Text fontWeight="bold" fontSize="xl" textAlign="center" color="blue.400">
                            🎮 {t("Available game modes")}
                        </Text>
                        
                        <VStack spacing={3} align="start" p={4} borderRadius="md" bg={colors.backgroundLight} boxShadow="md">
                            <Text fontWeight="bold" fontSize="lg">
                                🎼 {t("Classic Mode")}
                            </Text>
                            <Text>
                                {t("Find the")} <Text as="span" fontWeight="bold" color="blue.300">{t("song titles")}</Text> {t("from the lyrics")}.
                                {" "}{t("Once found, switch to")} <Text as="span" fontWeight="bold" color="red.400">{t("Hardcore Mode")} 🔥</Text>
                                {t("and guess all the lyrics")} {t("to earn bonus points")} !
                            </Text>
                        </VStack>
                        
                        <VStack spacing={3} align="start" p={4} borderRadius="md" bg={colors.backgroundLight} boxShadow="md">
                            <Text fontWeight="bold" fontSize="lg">
                                🎤 {t("NOPLP Mode")}
                            </Text>
                            <Text>
                                {t("Select a song from the database")} {t("and try to find")} <Text as="span" fontWeight="bold" color="blue.300">{t("all the lyrics")}</Text> !
                                {" "}{t("The more you find")}, {t("the more points you score")} 🎶
                            </Text>
                        </VStack>
                        
                        <Divider />
                        
                        <Text fontWeight="bold" fontSize="xl" textAlign="center">
                            ⚙️ {t("Settings")}
                        </Text>
                        <VStack spacing={4} align={"center"}>
                            <HStack>
                                <Text fontWeight="bold" fontSize="md" textAlign="center">
                                    🎧 {t("Autoplay")}
                                </Text>
                                <Switch
                                    id="autoplay"
                                    isChecked={autoplay}
                                    onChange={(e) => setAutoplay(e.target.checked)}
                                    colorScheme="blue"
                                />
                            </HStack>
                            <HStack>
                                <Text fontWeight="bold" fontSize="md" textAlign="center">
                                    🎨 {t("Theme")}
                                </Text>
                                <IconButton
                                    icon={<Icon as={colorMode === "light" ? FaMoon : FaSun} />}
                                    onClick={toggleColorMode}
                                    colorScheme={colorMode === "light" ? "purple" : "yellow"}
                                    size={"sm"}
                                />
                            </HStack>
                            <HStack>
                                <Text fontWeight="bold" fontSize="md" textAlign="center">
                                    🌍 {t("Language")}
                                </Text>
                                <Button onClick={() => handleSwitchLanguage()} colorScheme="blue" borderRadius="full" size={"sm"}>
                                    {i18n.language === "fr" ? "🇬🇧 English" : "🇫🇷 Français"}
                                </Button>
                            </HStack>
                        </VStack>
                    </VStack>
                </ModalBody>
                <ModalFooter justifyContent="center">
                    <Button onClick={onClose} colorScheme="blue" borderRadius="full">
                        🎶 {t("Play now")} !
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default ParoldleModal;