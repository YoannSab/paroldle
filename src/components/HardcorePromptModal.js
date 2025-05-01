// HardcorePromptModal.js
import React, { memo } from 'react';
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
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

// Composant mémorisé pour les boutons du footer
const ModalButtons = memo(({ onConfirm, onDecline, t }) => (
  <Stack 
    direction="row"
    spacing={3} 
    width="100%"
  >
    <Button 
      colorScheme="green" 
      w="100%" 
      onClick={onConfirm}
      size={["sm", "md"]}
    >
      {t("Yes")}
    </Button>
    <Button 
      variant="ghost" 
      w="100%" 
      onClick={onDecline}
      size={["sm", "md"]}
    >
      {t("No")}
    </Button>
  </Stack>
));

// Composant principal optimisé
const HardcorePromptModal = memo(({ isOpen, onConfirm, onDecline }) => {
  const { t } = useTranslation();
  console.log('HardcorePromptModal Rerendered');

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={() => {}} 
      isCentered 
      size={["xs", "sm", "md"]}
    >
      <ModalOverlay />
      <ModalContent mx={4}>
        <ModalHeader 
          textAlign="center" 
          fontSize={["lg", "xl"]}
          py={[3, 5]}
        >
          🔥 {t("Hardcore mode ")} 🔥
        </ModalHeader>
        <ModalBody>
          <Text 
            fontSize={["sm", "md"]}
            textAlign="center"
          >
            {t("Continue in hardcore mode to try to discover all the lyrics and earn more points?")}
          </Text>
        </ModalBody>
        <ModalFooter>
          <ModalButtons 
            onConfirm={onConfirm} 
            onDecline={onDecline} 
            t={t} 
          />
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
});

export default HardcorePromptModal;