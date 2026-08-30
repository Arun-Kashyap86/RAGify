const { PDFParse } = require("pdf-parse");

async function extractText(filePath) {
  const parser = new PDFParse({
    url: filePath,
  });

  try {
    const data = await parser.getText();
    const text = data.text ? data.text.trim() : "";

    if (!text) {
      throw new Error("The PDF contains no readable text");
    }

    return {
      text,
      pages: data.numpages || 1,
    };
  } finally {
    if (typeof parser.destroy === "function") {
      await parser.destroy();
    }
  }
}

module.exports = {
  extractText,
};
