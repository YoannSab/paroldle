import React from 'react';
import {

Modal,
ModalOverlay,
ModalContent,
ModalHeader,
ModalFooter,
ModalBody,
ModalCloseButton,
Button,
Image,
Grid,
useDisclosure,
} from '@chakra-ui/react';

const ProfilePictureModal = ({selectedImage, setSelectedImage}) => {
const { isOpen, onOpen, onClose } = useDisclosure();

const handleImageClick = (image) => {
    setSelectedImage(image);
    onClose();
};

// fetch image from public folder
const images = [...Array.from({ length: 22 }, (_, i) => `pdp${i + 1}`)];

const handleSave = () => {
    // Save the selected image
    console.log('Selected Image:', selectedImage);
    onClose();
};

return (
    <>
        <Image
            src={`/characters/${selectedImage}.png`}
            alt="Profile Picture"
            boxSize="110px"
            objectFit="cover"
            cursor="pointer"
            border={'3px solid black'}
            _hover={{ transform: 'scale(1.1)', transition: 'transform 0.2s' }}
            onClick={onOpen}
        />
        {/* <Button onClick={onOpen}>Select PP</Button> */}
        {/* </VStack> */}

        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Select Profile Picture</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <Grid templateColumns="repeat(5, 2fr)" gap={3}>
                        {images.map((image, index) => (
                            <Image
                                key={index}
                                src={`/characters/${image}.png`}
                                alt={`Profile ${index}`}
                                boxSize="100px"
                                objectFit="cover"
                                cursor="pointer"
                                _hover={{transform: 'scale(1.1)' }}
                                border={selectedImage === image ? '3px solid blue' : 'none'}
                                onClick={() => handleImageClick(image)}
                            />
                        ))}
                    </Grid>
                </ModalBody>

                <ModalFooter>
                    <Button colorScheme="blue" mr={3} onClick={handleSave}>
                        Save
                    </Button>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    </>
);
};

export default ProfilePictureModal;