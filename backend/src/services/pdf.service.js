const { PDFParse } = require("pdf-parse");

async function extractText(filePath) {
    const parser = new PDFParse({
        url: filePath
    });

    try {
        const data = await parser.getText();

        const text = await data.text?.trim();

        if (!text) {
            return res.status(400).json({
            message: "The PDF contains no readable text"})
        }

        return {
            text,
            pages: data.numpages
        };

    } catch(error){
        return res.status(400).json({
        message: error.message
    });

    }finally {
        await parser.destroy();
    }
}

module.exports = {
    extractText
};