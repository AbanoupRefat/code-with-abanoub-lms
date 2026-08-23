const config = require('./config');

function createCover(unitNumber, unitTitle) {
    return `
    <div class="page cover-page">
        <div class="cover-content">
            <div class="cover-logo-container">
                <img src="${config.assets.logo}" alt="Code With Abanoub Logo" class="cover-logo" />
            </div>
            <div class="cover-brand">
                <h1>${config.brandNameEnglish}</h1>
                <h2>${config.brandNameArabic}</h2>
            </div>
            <div class="cover-unit-info">
                <h3>UNIT ${unitNumber || '01'}</h3>
                <h2 class="unit-title">${unitTitle || 'INFORMATION TECHNOLOGY AND SOCIETY'}</h2>
            </div>
            <div class="cover-course-info">
                <p>Programming & Artificial Intelligence</p>
                <p>Egyptian Baccalaureate</p>
            </div>
            <div class="cover-footer">
                <p>Instructor: ${config.instructor}</p>
            </div>
        </div>
    </div>
    `;
}

function createLessonOpener(lessonNumber, lessonTitle) {
    return `
    <div class="page lesson-opener-page">
        <div class="lesson-opener-content">
            <div class="lesson-number">LESSON ${lessonNumber}</div>
            <h2 class="lesson-title">${lessonTitle}</h2>
        </div>
    </div>
    `;
}

function createCallout(type, title, content) {
    const typeLower = type.toLowerCase();
    const typeClass = typeLower.replace(/\s+/g, '-');
    return `
    <div class="callout callout-${typeClass}">
        <div class="callout-header">
            <span class="callout-icon">📌</span>
            <span class="callout-title">${title}</span>
        </div>
        <div class="callout-body">
            ${content}
        </div>
    </div>
    `;
}

function createFigure(figureData) {
    return `
    <figure class="educational-figure size-${figureData.preferredWidth}" data-purpose="${figureData.purpose}" data-source-section="${figureData.lesson} / ${figureData.sourceSection}">
        <img src="../assets/figures/${figureData.filename}" alt="${figureData.alt}" onerror="this.src='../assets/logo.jpg'" />
        <figcaption>${figureData.caption}</figcaption>
    </figure>
    `;
}

module.exports = {
    createCover,
    createLessonOpener,
    createCallout,
    createFigure
};
