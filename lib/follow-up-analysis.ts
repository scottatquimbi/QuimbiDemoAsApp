/**
 * Analyzes user response to follow-up question to determine if they need more help
 */

interface FollowUpAnalysisResult {
  needsMoreHelp: boolean;
  confidence: number;
  reasoning: string;
}

/**
 * Analyzes user response to "If the problem persists, please come back and reference ticket #[ID]"
 * @param response User's response text
 * @returns Analysis of whether they need more help
 */
export function analyzeFollowUpResponse(response: string): FollowUpAnalysisResult {
  const lowerResponse = response.toLowerCase().trim();
  
  // Strong indicators they DON'T need more help
  const negativeIndicators = [
    'no', 'nope', 'nothing', 'nah', 'no thanks', 'no thank you',
    'that\'s all', 'that\'s it', 'all good', 'i\'m good', 'im good',
    'thanks', 'thank you', 'perfect', 'great', 'awesome',
    'all set', 'that helps', 'that\'s helpful', 'solved',
    'that works', 'good to go', 'appreciate it', 'bye', 'goodbye'
  ];
  
  // Strong indicators they DO need more help
  const positiveIndicators = [
    'yes', 'yeah', 'yep', 'actually', 'also', 'another',
    'what about', 'how do i', 'can you', 'i have', 'there\'s',
    'but', 'however', 'one more', 'another thing', 'question',
    'issue', 'problem', 'help', 'assist', 'explain'
  ];
  
  // Question indicators (usually means they need more help)
  const questionIndicators = ['?', 'how', 'what', 'when', 'where', 'why', 'can'];
  
  let needsMoreHelp = false;
  let confidence = 0.5; // Default neutral
  let reasoning = 'Response is ambiguous - agent decision recommended';
  
  // Check for strong negative indicators
  const hasNegative = negativeIndicators.some(indicator => 
    lowerResponse.includes(indicator)
  );
  
  // Check for strong positive indicators
  const hasPositive = positiveIndicators.some(indicator => 
    lowerResponse.includes(indicator)
  );
  
  // Check for question indicators
  const hasQuestion = questionIndicators.some(indicator => 
    lowerResponse.includes(indicator)
  );
  
  if (hasNegative && !hasPositive) {
    needsMoreHelp = false;
    confidence = 0.85;
    reasoning = 'User indicated satisfaction and declined further assistance';
  } else if (hasPositive || hasQuestion) {
    needsMoreHelp = true;
    confidence = 0.8;
    reasoning = hasQuestion 
      ? 'User asked a question, indicating they need more help'
      : 'User indicated they have additional needs or issues';
  } else if (lowerResponse.length < 5) {
    // Very short responses are often negative
    needsMoreHelp = false;
    confidence = 0.6;
    reasoning = 'Very brief response suggests no additional needs';
  } else if (lowerResponse.length > 20) {
    // Longer responses often contain new issues
    needsMoreHelp = true;
    confidence = 0.7;
    reasoning = 'Detailed response suggests additional concerns or questions';
  }
  
  // Special handling for mixed signals
  if (hasNegative && hasPositive) {
    needsMoreHelp = true;
    confidence = 0.6;
    reasoning = 'Mixed signals detected - user may have conflicting needs';
  }
  
  return {
    needsMoreHelp,
    confidence,
    reasoning
  };
}

/**
 * Generates appropriate response when user doesn't need more help
 */
export function generateClosingResponse(): string {
  const closingResponses = [
    "Perfect! I'm glad I could help resolve your issue. Have a great time playing Game of Thrones: Conquest!",
    "Excellent! If you run into any other issues in the future, don't hesitate to reach out. Enjoy your adventures in Westeros!",
    "Great to hear! Your compensation should appear in your mailbox soon. Thanks for playing Game of Thrones: Conquest!",
    "Wonderful! I hope you enjoy the game with your resolved issue. May your kingdom prosper in Westeros!"
  ];
  
  return closingResponses[Math.floor(Math.random() * closingResponses.length)];
}