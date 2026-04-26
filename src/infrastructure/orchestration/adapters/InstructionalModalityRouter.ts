export class InstructionalModalityRouter {
  static getModalityTemplate(modality?: string): string {
    const normalizedModality = (modality || 'BLENDED').toUpperCase();

    const baseDirectives = `
    GENERAL OUTPUT RULES:
    - SCENE HEADERS: You MUST start every scene with "### Scene [Number]: [Title]".
    - TAGS: [VISUAL], [VISUAL_PROMPT], [NARRATION], [ACTIVITY], [BRANCHING], [SPEAKER_NOTES].
    - Each tag block MUST start on a NEW line.
    - DO NOT put content on the same line as a tag.
    - BRAND AGNOSTIC: Adapt art direction to the "visual_direction" in the schematic.
    - 100% AMBIGUITY FREE: The content developer should not have to guess.`;

    switch (normalizedModality) {
      case 'VIDEO':
      case 'NARRATIVE VIDEO':
      case 'ANIMATION':
        return `
        MODALITY TEMPLATE: [VIDEO]
        Your goal is to script a continuous visual flow. Focus on pacing, B-roll transitions, and conversational narration.
        - [VISUAL]: Describe camera movements, on-screen text, and B-roll transitions.
        - [VISUAL_PROMPT]: Ensure aspect ratio and cinematic quality (e.g., "16:9, cinematic lighting").
        - [NARRATION]: Natural, conversational script. Include pauses or emphasis notes.
        - [ACTIVITY]: Minimal. Focus on passive engagement (e.g., "Reflect on this concept").
        - [BRANCHING]: None. Linear flow.
        - [SPEAKER_NOTES]: List required stock footage or graphic assets.
        ${baseDirectives}`;

      case 'SIMULATION':
      case 'SCENARIO':
      case 'ROLE-PLAY':
        return `
        MODALITY TEMPLATE: [SIMULATION]
        Your goal is to build an interactive, state-driven experience. Focus on decisions and consequences.
        - [VISUAL]: Describe the UI layout for the simulation (e.g., "Two-pane view, choices on right").
        - [VISUAL_PROMPT]: Describe the immersive environment or character the user is interacting with.
        - [NARRATION]: Use for character dialogue or system prompts only.
        - [ACTIVITY]: Highly detailed. Describe the user's task and available actions.
        - [BRANCHING]: CRITICAL. Detail the Success path, the Failure path, and the Feedback given for each.
        - [SPEAKER_NOTES]: List required UI states and logic variables.
        ${baseDirectives}`;

      case 'DOCUMENT':
      case 'READING':
      case 'TEXT':
        return `
        MODALITY TEMPLATE: [DOCUMENT]
        Your goal is to structure high-density text for readability.
        - [VISUAL]: Describe layout, typography emphasis, and placement of diagrams.
        - [VISUAL_PROMPT]: Diagrams or infographics that support the text.
        - [NARRATION]: High-density, professional text content (Articles, Case Studies).
        - [ACTIVITY]: Optional reflection questions at the end.
        - [BRANCHING]: None. Linear flow.
        - [SPEAKER_NOTES]: List required formatting or specific CSS classes if applicable.
        ${baseDirectives}`;

      default:
        return `
        MODALITY TEMPLATE: [BLENDED / DEFAULT]
        Your goal is to create a balanced, interactive learning object.
        - Use exactly these tags: [VISUAL], [VISUAL_PROMPT], [NARRATION], [ACTIVITY], [BRANCHING], [SPEAKER_NOTES].
        ${baseDirectives}`;
    }
  }
}
