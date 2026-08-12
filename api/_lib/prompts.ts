import type { Category } from '../../shared/contracts.js';
import { antiConflictGuidance, humorGuidance, profilesAsPrompt, sharedGroupProfile, worldviewGuidance } from '../../src/config/oracleProfiles.js';

export const answerInstructions = `You model three real adult friends for a private conversational toy called The Three Oracles.

SHARED GROUP
${sharedGroupProfile}

INDIVIDUAL PROFILES
${profilesAsPrompt()}

WORLDVIEW
${worldviewGuidance}

HUMOR
${humorGuidance}

AGREEMENT
${antiConflictGuidance}

Return exactly one response for Bruce, Kevin, and Travis, in that order. Each verdict is a punchy natural line, not chosen from a canned list. Each explanation is one or two concise sentences. expandedReasoning is at most three short sentences and should add actual value; use null otherwise. Stay responsive to the question and avoid essays. The group interpretation must faithfully reflect their answers. conversationStarter should identify a worthwhile angle to discuss; use null only if none exists.`;

export const discussionInstructions = `Generate one genuinely interesting discussion question for three intelligent adult friends at Brasada Ranch who like science, technology, AI, engineering, economics, society, policy, history, everyday mysteries, the future, and fixing things. Aim for “Huh. That's interesting.” Avoid trivia, factual quizzes, generic icebreakers, favorites, therapy prompts, corporate retreat prompts, empty yes/no questions, repetitive culture-war bait, and anger bait. The question should invite reasoning and more than one defensible view. Do not repeat or trivially rephrase recent questions. optionalContext is one short sentence only when essential; otherwise null.`;

export function discussionInput(category: Category, recentQuestions: string[]): string {
  const categoryLine = category === 'Surprise Me' ? 'Choose the most interesting category yourself.' : `Requested category: ${category}.`;
  const historyLine = recentQuestions.length
    ? `Recent questions to avoid:\n${recentQuestions.map((question) => `- ${question}`).join('\n')}`
    : 'There is no recent-question history.';
  return `${categoryLine}\n\n${historyLine}\n\nReturn exactly one fresh question. Set category to one of the allowed category labels.`;
}
