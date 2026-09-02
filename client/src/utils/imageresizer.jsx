const useImageUpload = () => {
    const handleImage = async (width = 400, imageFile, quality = 0.85) => {
        if (!imageFile) return null;
        try {
            let newImageFile = await new Promise((resolve, reject) => {
                let reader = new FileReader();
                reader.readAsDataURL(imageFile);
                reader.onload = (event) => {
                    const imageUrl = event.target.result;
                    const image = new Image();

                    image.onload = () => {
                        const canvas = document.createElement("canvas");
                        const scale = Math.min(1, width / image.width);
                        canvas.width = Math.round(image.width * scale);
                        canvas.height = Math.round(image.height * scale);
                        const context = canvas.getContext("2d");
                        context.drawImage(image, 0, 0, canvas.width, canvas.height);

                        canvas.toBlob(
                            (blob) => {
                                if (!blob) {
                                    resolve(imageFile);
                                    return;
                                }
                                const cleanName = imageFile.name.replace(/\.[^/.]+$/, "") + ".webp";
                                const file = new File([blob], cleanName, { type: "image/webp" });
                                resolve(file);
                            },
                            "image/webp",
                            quality
                        );
                    };

                    image.onerror = (err) => reject(err);
                    image.src = imageUrl;
                };

                reader.onerror = (error) => {
                    reject(error);
                };
            });

            return newImageFile;
        } catch (error) {
            console.error('Error handling image:', error);
            return imageFile; // fallback to original on error
        }
    };

    return { handleImage };
};

export default useImageUpload;

