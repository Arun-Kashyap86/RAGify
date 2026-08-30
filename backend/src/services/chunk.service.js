function cleanText(text) {
    return text
        .replace(/\r/g, "")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

function createChunks(text, chunkSize = 1000, overlap = 150) {
    const cleanedText = cleanText(text);
    const chunks = [];
    let start = 0;
    while (start < cleanedText.length) {
        const end = Math.min(start + chunkSize, cleanedText.length);
        const chunk = cleanedText.slice(start, end).trim();
        if (chunk) {
            chunks.push(chunk);
        }
        if (end === cleanedText.length) {
            break;
        }
        start = end - overlap;
    }
    return chunks;
}

module.exports = {
    createChunks
};