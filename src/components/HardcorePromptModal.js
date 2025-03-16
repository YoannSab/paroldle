// HardcorePromptModal.js
import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Text,
  Stack,
  Box,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

const HardcorePromptModal = ({ isOpen, onConfirm, onDecline }) => {
  const { t } = useTranslation();

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={() => {}} 
      isCentered 
      size={{ base: 'xs', sm: 'md' }}
    >
      <ModalOverlay />
      <ModalContent mx={4}>
        <ModalHeader 
          textAlign={'center'} 
          fontSize={{ base: 'lg', sm: 'xl' }}
          py={{ base: 3, sm: 5 }}
        >
          🔥 {t("Hardcore mode ")} 🔥
        </ModalHeader>
        <ModalBody>
          <Text 
            fontSize={{ base: 'sm', sm: 'md' }}
            textAlign="center"
          >
            {t("Continue in hardcore mode to try to discover all the lyrics and earn more points?")}
          </Text>
        </ModalBody>
        <ModalFooter>
          <Stack 
            direction={"row"}
            spacing={3} 
            width="100%"
          >
            <Button 
              colorScheme="green" 
              w="100%" 
              onClick={onConfirm}
              size={{ base: 'sm', sm: 'md' }}
            >
              {t("Yes")}
            </Button>
            <Button 
              variant="ghost" 
              w="100%" 
              onClick={onDecline}
              size={{ base: 'sm', sm: 'md' }}
            >
              {t("No")}
            </Button>
          </Stack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default HardcorePromptModal;
