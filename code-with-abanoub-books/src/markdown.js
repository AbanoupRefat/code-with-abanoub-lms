const { marked } = require('marked');
const components = require('./components');
const figureManifest = require('./figures');

function processMarkdown(markdownText) {
    let currentLesson = "";
    let currentSection = "";
    
    // Custom renderer
    const renderer = new marked.Renderer();

    // Store original rules
    const originalHeading = renderer.heading.bind(renderer);
    const originalBlockquote = renderer.blockquote.bind(renderer);

    renderer.heading = function({tokens, depth}) {
        const text = this.parser.parseInline(tokens);
        
        // Add page breaks to SECTIONS
        if (depth === 2 && text.toUpperCase().includes('SECTION')) {
            return `<h2 style="page-break-before: always; padding-top: 2em; border-top: 4px solid var(--brand-purple);">${text}</h2>`;
        }

        // Detect Unit Title
        if (depth === 1 && text.toLowerCase().includes('unit')) {
            const unitMatch = text.match(/UNIT\s*(\d+)/i);
            const unitNumber = unitMatch ? unitMatch[1] : '01';
            return components.createCover(unitNumber, text) + originalHeading({tokens, depth});
        }

        // Detect Lesson Boundaries
        if (depth === 2 && text.toLowerCase().includes('lesson')) {
            currentLesson = text;
            const lessonMatch = text.match(/Lesson\s*([\d-]+):?\s*(.*)/i);
            if (lessonMatch) {
                const lessonNumber = lessonMatch[1];
                const lessonTitle = lessonMatch[2];
                return components.createLessonOpener(lessonNumber, lessonTitle) + originalHeading({tokens, depth});
            }
        }
        
        if (depth === 3 || depth === 4) {
            currentSection = text;
            // Check if there is a figure for this section
            const figure = figureManifest.getFigureForSection(currentLesson, currentSection);
            let figHtml = "";
            if (figure) {
                figHtml = components.createFigure(figure);
            }
            return originalHeading({tokens, depth}) + figHtml;
        }

        return originalHeading({tokens, depth});
    };

    renderer.blockquote = function({tokens}) {
        let text = this.parser.parse(tokens);
        // check for callout pattern
        const calloutRegex = /<p>\[!([^\]]+)\]\s*(.*?)<\/p>/is;
        const match = text.match(calloutRegex);
        
        if (match) {
            const type = match[1].trim();
            let content = text.replace(calloutRegex, '<p>$2</p>');
            return components.createCallout(type, type, content);
        }

        return originalBlockquote({tokens});
    };

    marked.setOptions({
        renderer: renderer,
        gfm: true,
        breaks: true,
    });

    // Strip citations like [30], [31, 15], [30, multimodal_15]
    // The regex matches an optional space, followed by a bracket containing a 2+ digit number or "multimodal_", followed by anything up to a closing bracket.
    const cleanedText = markdownText.replace(/\s*\[(?:[2-9]\d|\d{3,}|multimodal_\d+)[^\]]*\]/g, '');

    return marked.parse(cleanedText);
}

module.exports = {
    processMarkdown
};
