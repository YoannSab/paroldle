import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton,
    ModalBody, ModalFooter, Text, Switch,
    HStack, Button, VStack, Icon, useColorMode,
    Divider,
    IconButton
} from "@chakra-ui/react";
import { FaMoon, FaSun, FaTrophy, FaMusic } from "react-icons/fa";
import { useColors } from "../constants";

const ParoldleModal = ({ isOpen, onClose, autoplay, setAutoplay }) => {
    const { colorMode, toggleColorMode } = useColorMode();
    const colors = useColors();
    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
            <ModalOverlay />
            <ModalContent borderRadius="lg" boxShadow="2xl">
                <ModalHeader textAlign="center" fontSize="3xl" fontWeight="bold">
                    🎵 Bienvenue sur <Text as="span" color="blue.300">Paroldle</Text> 🎶
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack spacing={4} align="stretch">
                        <Text>
                            Devinez le <Text as="span" fontWeight="bold" color="blue.300">titre des chansons</Text> à partir des paroles !
                            Plus vous trouvez de titres, plus vous gagnez des <Icon as={FaTrophy} color="yellow.400" /> trophées
                            et débloquez de nouvelles chansons ! 🎤
                        </Text>
                        
                        <Text fontWeight="bold" fontSize="xl" textAlign="center" color="blue.400">
                            🎮 Modes de jeu disponibles
                        </Text>
                        
                        <VStack spacing={3} align="start" p={4} borderRadius="md" bg={colors.backgroundLight} boxShadow="md">
                            <Text fontWeight="bold" fontSize="lg">
                                🎼 Mode Classique
                            </Text>
                            <Text>
                                Trouvez le <Text as="span" fontWeight="bold" color="blue.300">titre de la chanson</Text> à partir des paroles.
                                Une fois trouvé, passez en <Text as="span" fontWeight="bold" color="red.400">Mode Hardcore 🔥</Text>
                                et devinez toutes les paroles pour gagner des points bonus !
                            </Text>
                        </VStack>
                        
                        <VStack spacing={3} align="start" p={4} borderRadius="md" bg={colors.backgroundLight} boxShadow="md">
                            <Text fontWeight="bold" fontSize="lg">
                                🎤 Mode NOPLP
                            </Text>
                            <Text>
                                Sélectionnez une chanson dans la base de données et tentez de retrouver <Text as="span" fontWeight="bold" color="blue.300">toutes les paroles</Text> !
                                Plus vous en trouvez, plus vous marquez de points 🎶
                            </Text>
                        </VStack>
                        
                        <Divider />
                        
                        <Text fontWeight="bold" fontSize="xl" textAlign="center">
                            ⚙️ Paramètres
                        </Text>
                        <VStack spacing={4} align={"center"}>
                            <HStack>
                                <Text fontWeight="bold" fontSize="md" textAlign="center">
                                    🎧 Lecture automatique
                                </Text>
                                <Switch
                                    id="autoplay"
                                    isChecked={autoplay}
                                    onChange={(e) => setAutoplay(e.target.checked)}
                                    colorScheme="blue"
                                />
                            </HStack>
                            <HStack>
                                {/* Thème */}
                                <Text fontWeight="bold" fontSize="md" textAlign="center">
                                    🎨 Thème
                                </Text>
                                <IconButton
                                    icon={<Icon as={colorMode === "light" ? FaMoon : FaSun} />}
                                    onClick={toggleColorMode}
                                    colorScheme={colorMode === "light" ? "purple" : "yellow"}
                                    size={"sm"}
                                />
                            </HStack>
                        </VStack>
                    </VStack>
                </ModalBody>
                <ModalFooter justifyContent="center">
                    <Button onClick={onClose} colorScheme="blue" borderRadius="full">
                        🎶 Jouer maintenant !
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default ParoldleModal;
