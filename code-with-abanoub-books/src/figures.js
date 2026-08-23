module.exports = {
    figures: [
        {
            id: "moores-law",
            lesson: "Lesson 1-1",
            sourceSection: "Moore's Law",
            purpose: "conceptual-diagram",
            type: "png",
            preferredWidth: "medium",
            caption: "The exponential growth of hardware scaling vs. physical limits.",
            alt: "Diagram showing Moore's Law.",
            filename: "moores-law.png"
        },
        {
            id: "cloud-vs-edge",
            lesson: "Lesson 1-1",
            sourceSection: "Cloud Computing vs. Edge Computing",
            purpose: "comparison",
            type: "png",
            preferredWidth: "large",
            caption: "Cloud computing processes data centrally with latency, while edge computing processes data locally for instant decisions.",
            alt: "Comparison of cloud and edge computing.",
            filename: "cloud-vs-edge.png"
        },
        {
            id: "ar-vs-vr",
            lesson: "Lesson 1-1",
            sourceSection: "AR vs. VR",
            purpose: "comparison",
            type: "png",
            preferredWidth: "medium",
            caption: "AR augments the real world, whereas VR replaces it entirely.",
            alt: "Comparison of Augmented Reality and Virtual Reality.",
            filename: "ar-vs-vr.png"
        },
        {
            id: "ai-hierarchy",
            lesson: "Lesson 1-2",
            sourceSection: "Core Concepts",
            purpose: "conceptual-diagram",
            type: "png",
            preferredWidth: "medium",
            caption: "The relationship between AI, Machine Learning, Deep Learning, and Generative AI.",
            alt: "AI nested hierarchy.",
            filename: "ai-hierarchy.png"
        },
        {
            id: "neural-network",
            lesson: "Lesson 1-2",
            sourceSection: "Inside a Neural Network",
            purpose: "conceptual-diagram",
            type: "png",
            preferredWidth: "large",
            caption: "An artificial neural network processing inputs through hidden layers to produce an output.",
            alt: "Diagram of an Artificial Neural Network.",
            filename: "neural-network.png"
        },
        {
            id: "explainable-ai",
            lesson: "Lesson 1-4",
            sourceSection: "Explainable AI",
            purpose: "conceptual-diagram",
            type: "png",
            preferredWidth: "medium",
            caption: "Explainable AI (XAI) makes the black box transparent.",
            alt: "Black Box vs Explainable AI.",
            filename: "explainable-ai.png"
        }
    ],
    getFigureForSection: function(lesson, section) {
        return this.figures.find(f => lesson.includes(f.lesson) && section.includes(f.sourceSection));
    }
};
