const fs = require('fs');
const path = require('path');
const config = require('./config');

function assembleDocument(htmlContent) {
    const templatePath = path.join(__dirname, 'template.html');
    let template = fs.readFileSync(templatePath, 'utf8');

    template = template.replace('{{content}}', htmlContent);
    template = template.replace('{{brandNameEnglish}}', config.brandNameEnglish);
    
    return template;
}

module.exports = {
    assembleDocument
};
