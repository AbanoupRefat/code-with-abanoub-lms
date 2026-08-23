const fs = require('fs');
const path = require('path');
const { program } = require('commander');
const { chromium } = require('playwright');
const { processMarkdown } = require('./markdown');
const { assembleDocument } = require('./document');

program
    .requiredOption('-i, --input <path>', 'input markdown file path')
    .parse(process.argv);

const options = program.opts();
const inputPath = path.resolve(options.input);

if (!fs.existsSync(inputPath)) {
    console.error(`Error: File not found at ${inputPath}`);
    process.exit(1);
}

const basename = path.basename(inputPath, '.md');
const outputHtmlPath = path.resolve(__dirname, `../output/${basename}.html`);
const outputPdfPath = path.resolve(__dirname, `../output/${basename}.pdf`);

// 1. Read Markdown
const markdownText = fs.readFileSync(inputPath, 'utf8');

// 2. Parse Markdown
const contentHtml = processMarkdown(markdownText);

// 3. Assemble Full HTML
const fullHtml = assembleDocument(contentHtml);

// 4. Write HTML
fs.writeFileSync(outputHtmlPath, fullHtml);
console.log(`Generated HTML at: ${outputHtmlPath}`);

// 5. Generate PDF
(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    // We navigate to the file URL so that relative CSS/images load correctly
    await page.goto(`file://${outputHtmlPath}`, { waitUntil: 'networkidle' });

    // Ensure MathJax or other dynamic content has time to render if we add it later
    await page.waitForTimeout(1000); 

    await page.pdf({
        path: outputPdfPath,
        format: 'A4',
        printBackground: true,
        margin: {
            top: '15mm',
            right: '15mm',
            bottom: '15mm',
            left: '15mm'
        },
        displayHeaderFooter: true,
        headerTemplate: `
            <div style="font-size: 8px; width: 100%; text-align: center; color: #666; font-family: 'Noto Sans', sans-serif;">
                <span class="title"></span>
            </div>
        `,
        footerTemplate: `
            <div style="font-size: 10px; width: 100%; text-align: center; color: #666; font-family: 'Noto Sans', sans-serif; padding: 0 20px; display: flex; justify-content: space-between;">
                <span>Eng/ Abanoub Refat - Code With Abanoub | Programming | البكالوريا | 01017747943</span>
                <span>Page <span class="pageNumber"></span></span>
            </div>
        `
    });

    await browser.close();
    console.log(`Generated PDF at: ${outputPdfPath}`);
})();
