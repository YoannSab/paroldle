import React from 'react';
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, Text, Flex, Icon } from '@chakra-ui/react';
import { FaMedal, FaMusic, FaFire } from 'react-icons/fa'; // Ajout de l'icône de feu
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

const FestiveModal = ({ isOpen, onClose, victory }) => {
  const { width, height } = useWindowSize();

  return (
    <>
      {isOpen && <Confetti width={width} height={height} />}

      <Modal isOpen={isOpen} onClose={onClose} size="sm" isCentered>
        <ModalOverlay />
        {victory === 'hardcore' ? (
          <ModalContent
            bgGradient="linear(to-r, red.400, orange.400)"
            color="white"
            boxShadow="xl"
          >
            <ModalHeader textAlign="center">
              <Flex align="center" justify="center">
                <Icon as={FaFire} boxSize={8} mr={2} />
                <Text fontSize="2xl" fontWeight="bold">
                  Wow, champioooon !
                </Text>
                <Icon as={FaFire} boxSize={8} ml={2} />
              </Flex>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Flex direction="column" align="center" mt={4}>
                <Icon as={FaMusic} color="white" boxSize={12} mb={4} />
                <Text fontSize="xl" textAlign="center">
                  Tu as déchiré la chanson en mode hardcore !
                </Text>
              </Flex>
            </ModalBody>
          </ModalContent>
        ) : (
          <ModalContent>
            <ModalHeader textAlign="center">
              <Icon as={FaMedal} color="yellow.400" boxSize={8} />
              Bravo !
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Flex direction="column" align="center">
                <Icon as={FaMusic} color="green.400" boxSize={12} mb={4} />
                <Text fontSize="xl" textAlign="center">
                  Tu as trouvé la chanson !
                </Text>
              </Flex>
            </ModalBody>
          </ModalContent>
        )}
      </Modal>
    </>
  );
};

export default FestiveModal;
