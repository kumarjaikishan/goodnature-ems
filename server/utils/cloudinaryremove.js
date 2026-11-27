const cloudinary = require('./cloudinary');

/**
 * Remove a photo from Cloudinary by its secure URL
 * @param {string} secureUrl - The secure URL of the photo to be removed
 * @returns {Promise} A Promise that resolves with the result of the removal
 */
const removePhotoBySecureUrl = async (secureUrlArray) => {
    console.log("clopudinary preious image url in utils for removal",secureUrlArray )
    try {
        const deletionPromises = secureUrlArray.map(async (url) => {
            if (!url || typeof url !== 'string') return null;
            const pathAfterUpload = url.split(/\/upload\/(?:v[^/]+\/)?/)[1];
            if (!pathAfterUpload) return null;

            const dfvf = pathAfterUpload.split('/');
            const fd = dfvf.pop();
            if (!fd) return null;
            const publicid = fd.split('.')[0];
            const join = dfvf.join('/');

            const path = join.length > 0 ? `${join}/${publicid}` : publicid;

            const result = await cloudinary.uploader.destroy(path);
            return { publicid, result };
        });

        const results = await Promise.all(deletionPromises);
        return results;
    } catch (error) {
        throw error;
    }
};

module.exports = removePhotoBySecureUrl;
