import React from 'react';
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, Text, Flex, Icon } from '@chakra-ui/react';
import { FaMedal, FaMusic } from 'react-icons/fa'; // Icônes festives
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use'; // Pour les dimensions de la fenêtre

const FestiveModal = ({ isOpen, onClose }) => {
    const { width, height } = useWindowSize();

    return (
      <>
        {isOpen && <Confetti width={width} height={height} />}
        
        <Modal isOpen={isOpen} onClose={onClose} size="sm" isCentered>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader textAlign="center">
              <Icon as={FaMedal} color="yellow.400" boxSize={8} />
              Bravo !
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Flex direction="column" align="center">
                <Icon as={FaMusic} color="green.400" boxSize={12} mb={4} />
                <Text fontSize="xl" textAlign="center">Vous avez trouvé la chanson !</Text>
              </Flex>
            </ModalBody>
          </ModalContent>
        </Modal>
      </>
    );
};

export default FestiveModal;
