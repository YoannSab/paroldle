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
                boxSize={{ base: '70px', sm: '80px', md: '110px' }}
                objectFit="cover"
                cursor="pointer"
                border={'3px solid black'}
                _hover={{ transform: 'scale(1.1)', transition: 'transform 0.2s' }}
                onClick={onOpen}
            />

            <Modal isOpen={isOpen} onClose={onClose} size={{ base: "xs", xl: "md" }}>
                <ModalOverlay />
                <ModalContent mx={2}>
                    <ModalHeader fontSize={{ base: "md", xl: "xl" }}>Select Profile Picture</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Grid templateColumns={{ base: "repeat(4, 1fr)", sm: "repeat(4, 1fr)", xl: "repeat(5, 1fr)" }} gap={2}>
                            {images.map((image, index) => (
                                <Image
                                    key={index}
                                    src={`/characters/${image}.png`}
                                    alt={`Profile ${index}`}
                                    boxSize={{ base: '50px', sm: '70px', xl: '100px' }}
                                    objectFit="cover"
                                    cursor="pointer"
                                    _hover={{ transform: 'scale(1.1)' }}
                                    border={selectedImage === image ? '3px solid blue' : 'none'}
                                    onClick={() => handleImageClick(image)}
                                />
                            ))}
                        </Grid>
                    </ModalBody>

                    <ModalFooter>
                        <Button colorScheme="blue" mr={3} onClick={handleSave} size={{ base: "sm", sm: "md" }}>
                            Save
                        </Button>
                        <Button variant="ghost" onClick={onClose} size={{ base: "sm", sm: "md" }}>Cancel</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
};

export default ProfilePictureModal;
