import { describe, it, expect } from 'vitest';

// Mock script response with visual prompts
const MOCK_SCRIPT = `
[HEADER] Core Architecture Initiation
Welcome to the module.

[VISUAL] A professional boardroom setting with a diverse team.
[VISUAL_PROMPT] A photorealistic medium shot of a diverse corporate team engaged in a strategic meeting in a modern, sunlit glass boardroom. Professional studio lighting, 8k, sharp focus.

[NARRATION] Today we will explore the constellation.
`;

describe('Visual Engine: Semantic Parser', () => {
  it('should correctly identify and extract [VISUAL_PROMPT] from script text', () => {
    const promptRegex = /\[VISUAL_PROMPT\]:?\s*(.*?)(?=\n|\[|$)/g;
    const matches = [...MOCK_SCRIPT.matchAll(promptRegex)];
    
    expect(matches.length).toBe(1);
    expect(matches[0][1].trim()).toBe('A high-fidelity 4k render of a glowing neural network in deep space, teal accents, cinematic lighting.');
  });

  it('should correctly handle multiple visual prompts in one script', () => {
    const multiScript = MOCK_SCRIPT + '\n[VISUAL] Second frame.\n[VISUAL_PROMPT] Prompt 2';
    const promptRegex = /\[VISUAL_PROMPT\]:?\s*(.*?)(?=\n|\[|$)/g;
    const matches = [...multiScript.matchAll(promptRegex)];
    
    expect(matches.length).toBe(2);
    expect(matches[1][1].trim()).toBe('Prompt 2');
  });
});
