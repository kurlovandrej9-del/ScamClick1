import { GoogleGenAI, Type } from "@google/genai";
import { AgentRole, LogMessage, AppMode, Attachment, BotLanguage } from "../types";
import { getAgentProfile } from "../constants";

// Helper to convert File to Base64 for Gemini
const fileToPart = async (file: File): Promise<{ mimeType: string; data: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({
        mimeType: file.type,
        data: base64String
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const getSystemInstruction = (role: AgentRole, mode: AppMode, botLang: BotLanguage = 'javascript'): string => {
  const profile = getAgentProfile(role, mode);
  
  const BASE_INSTRUCTION = `You are ${profile.name}, the ${profile.title}. Your goal is to refine the user's request into perfection.`;

  // --- STATIC SITE MODE INSTRUCTIONS ---
  if (mode === 'STATIC_SITE') {
    switch (role) {
      case AgentRole.PRODUCT_OWNER:
        return `${BASE_INSTRUCTION}
        You have received the User's Idea, clarifying answers, and potentially Reference Images/PDFs.
        MANDATORY: This website MUST feature high-end 3D graphics using Three.js.
        1. Synthesize the MASTER SPECIFICATION.
        2. Define the "Hero Moment": How will the 3D scene impress the user?
        3. Define the content sections.
        4. Ensure the style is modern.`;

      case AgentRole.MECHANIC: // Architect
        return `${BASE_INSTRUCTION}
        Plan the HTML Structure.
        1. Container for 3D Canvas.
        2. UI Overlay structure.
        3. Semantic HTML.`;

      case AgentRole.INNOVATOR: // Designer
        return `${BASE_INSTRUCTION}
        Define Visual Design & 3D Aesthetic.
        1. Color Palette.
        2. Typography.
        3. 3D Objects/Shapes.
        4. Lighting.`;

      case AgentRole.TECH_LEAD: // WebGL Lead
        return `${BASE_INSTRUCTION}
        Define Three.js Logic.
        1. Setup (Scene, Camera, Renderer).
        2. Geometries & Materials.
        3. Animation Loop.
        4. Resize Handler.`;

      case AgentRole.DESIGNER: // FX Artist
        return `${BASE_INSTRUCTION}
        Add Polish and Shaders.
        1. Post-processing (Bloom, etc).
        2. Interactive Hover effects.`;

      case AgentRole.QA_ENGINEER:
        return `${BASE_INSTRUCTION}
        Performance and Crash Prevention.
        1. Resize handler check.
        2. Memory leaks check.
        3. CDN link verification.`;

      case AgentRole.SYNTHESIZER: // Developer
        return `${BASE_INSTRUCTION}
        WRITE THE FINAL CODE.
        Output a SINGLE valid HTML string starting with <!DOCTYPE html>.
        
        MANDATORY REQUIREMENTS:
        1. Include Tailwind CSS: <script src="https://cdn.tailwindcss.com"></script>
        2. Include Lucide Icons: <script src="https://unpkg.com/lucide@latest"></script>
        3. Include Three.js: <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"></script>
        
        HTML Structure:
        - Fixed div for WebGL Canvas (z-index: 0).
        - Relative div for Content Overlay (z-index: 10).
        - Script at the end with full Three.js logic.
        
        DO NOT wrap in markdown code blocks. Output raw HTML only.`;
        
       case AgentRole.CRITIC:
         return `${BASE_INSTRUCTION} Ensure the 3D implementation is robust.`;
    }
  }

  // --- TELEGRAM BOT MODE INSTRUCTIONS ---
  if (mode === 'TG_BOT') {
    const isPython = botLang === 'python';
    
    switch (role) {
      case AgentRole.PRODUCT_OWNER:
        return `${BASE_INSTRUCTION}
        Define a Telegram Bot structure.
        Target Language: ${isPython ? 'Python (python-telegram-bot)' : 'Node.js (Telegraf)'}.
        1. Purpose & Utility.
        2. Commands (/start, /help, custom).
        3. User Flow.`;

      case AgentRole.MECHANIC:
        return `${BASE_INSTRUCTION}
        Define Conversation Logic.
        1. Menu Hierarchy (Inline Buttons vs Keyboard).
        2. State Machine (Scene/Conversation Wizard).`;

      case AgentRole.INNOVATOR:
        return `${BASE_INSTRUCTION}
        Gamification & Engagement.
        1. Emojis and Tone.
        2. Feedback loops.`;

      case AgentRole.TECH_LEAD:
        return `${BASE_INSTRUCTION}
        Stack: ${isPython ? 'Python + python-telegram-bot (async)' : 'Node.js + Telegraf'}.
        1. Middleware setup.
        2. API structure.
        3. Error handling.`;

      case AgentRole.DESIGNER:
        return `${BASE_INSTRUCTION}
        Copywriting & UX.
        1. Message templates.
        2. Button text.`;

      case AgentRole.QA_ENGINEER:
        return `${BASE_INSTRUCTION}
        Validation.
        1. Async/Await error catching.
        2. Token security (ENV variables).`;

      case AgentRole.SYNTHESIZER:
        if (isPython) {
            return `${BASE_INSTRUCTION}
            WRITE THE FINAL CODE.
            Output a SINGLE valid Python file (.py).
            
            Requirements:
            1. Use 'python-telegram-bot' library (v20+ async).
            2. Include comments explaining how to run (pip install python-telegram-bot).
            3. Handle /start and /help.
            4. Implement the logic defined by the team.
            
            DO NOT wrap in markdown code blocks. Output raw Python code only.`;
        } else {
            return `${BASE_INSTRUCTION}
            WRITE THE FINAL CODE.
            Output a SINGLE valid JavaScript file (Node.js).
            
            Requirements:
            1. Use 'telegraf' library.
            2. Include comments explaining how to run (npm install telegraf).
            3. Handle /start and /help.
            4. Implement the logic defined by the team.
            
            DO NOT wrap in markdown code blocks. Output raw JavaScript code only.`;
        }
      
      default: return `${BASE_INSTRUCTION} Plan the bot.`;
    }
  }

  // --- PROMPT OPTIMIZER MODE ---
  if (mode === 'PROMPT_OPTIMIZER') {
    switch (role) {
      case AgentRole.PRODUCT_OWNER:
        return `${BASE_INSTRUCTION} Analyze intent.`;
      case AgentRole.MECHANIC:
        return `${BASE_INSTRUCTION} Define structure.`;
      case AgentRole.INNOVATOR:
        return `${BASE_INSTRUCTION} Enhance vocabulary.`;
      case AgentRole.TECH_LEAD:
        return `${BASE_INSTRUCTION} Add logic constraints.`;
      case AgentRole.SYNTHESIZER:
        return `${BASE_INSTRUCTION} Output the final optimized text only. No code blocks.`;
      default: return `${BASE_INSTRUCTION} Optimize.`;
    }
  }

  return BASE_INSTRUCTION;
};

// --- QUIZ & PROMPT GEN FUNCTIONS ---
export const generateQuiz = async (idea: string, apiKey: string, attachments?: Attachment[]): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey });
  
  const contentParts: any[] = [{ text: `
    USER IDEA: "${idea}"
    
    TASK: Generate exactly 5 clarifying questions to fully understand the requirements.
    Focus on: Visual style, specific features, goal, and constraints.
    
    OUTPUT FORMAT: JSON array of strings only.
    Example: ["What is the primary brand color?", "Do you prefer abstract shapes or realistic models?"]
  `}];

  if (attachments && attachments.length > 0) {
    for (const att of attachments) {
      const part = await fileToPart(att.file);
      contentParts.push({
        inlineData: {
          mimeType: part.mimeType,
          data: part.data
        }
      });
    }
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts: contentParts },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const text = response.text;
    return JSON.parse(text || "[]");
  } catch (error) {
    console.error("Quiz gen error", error);
    return ["What is the main goal?", "Who is the target audience?", "Any specific style preferences?", "Key features needed?", "Any specific integrations?"];
  }
};

export const generateImprovedPrompt = async (idea: string, qa: {q: string, a: string}[], apiKey: string): Promise<string> => {
   const ai = new GoogleGenAI({ apiKey });
   
   const formattedQA = qa.map(item => `Q: ${item.q}\nA: ${item.a}`).join('\n');
   
   const prompt = `
     ORIGINAL IDEA: "${idea}"
     
     USER ANSWERS:
     ${formattedQA}
     
     TASK: Rewrite the Original Idea into a comprehensive specification.
     Include all details from the answers. Be specific and technical.
   `;
 
   try {
     const response = await ai.models.generateContent({
       model: 'gemini-3-pro-preview',
       contents: prompt,
     });
     return response.text || idea;
   } catch (error) {
     return idea;
   }
}

export const runAgentStep = async (
  role: AgentRole,
  userIdea: string,
  history: LogMessage[],
  apiKey: string,
  mode: AppMode,
  attachments?: Attachment[],
  botLang: BotLanguage = 'javascript'
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey });
  const agentProfile = getAgentProfile(role, mode);
  
  const conversationContext = history.map(msg => {
    const historicalAgent = getAgentProfile(msg.agentId, msg.mode || mode);
    return `[${historicalAgent.name} (${historicalAgent.title})]: ${msg.content}`
  }).join('\n\n');

  const contentParts: any[] = [];
  
  const textPrompt = `
    CURRENT MODE: ${mode}
    ${mode === 'TG_BOT' ? `TARGET LANGUAGE: ${botLang}` : ''}
    ORIGINAL IDEA: "${userIdea}"
    
    TEAM CONVERSATION SO FAR:
    ${conversationContext}
    
    YOUR ROLE: ${agentProfile.name} - ${agentProfile.title}
    YOUR TASK: Perform your specific analysis based on your system instructions.
    
    CRITICAL: Be specific, technical, and concise. 
    ${(mode === 'STATIC_SITE' || mode === 'TG_BOT') && role === AgentRole.SYNTHESIZER ? 'OUTPUT ONLY RAW CODE. NO MARKDOWN.' : ''}
    
    ${attachments && attachments.length > 0 ? 'NOTE: The user has attached files. Use them as visual or text references.' : ''}
  `;
  
  contentParts.push({ text: textPrompt });

  if (attachments && attachments.length > 0) {
    for (const att of attachments) {
      try {
        const part = await fileToPart(att.file);
        contentParts.push({
           inlineData: {
             mimeType: part.mimeType,
             data: part.data
           }
        });
      } catch (e) {
        console.error("Failed to process attachment", att.file.name, e);
      }
    }
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts: contentParts },
      config: {
        systemInstruction: getSystemInstruction(role, mode, botLang),
      }
    });

    return response.text || "Analysis complete.";
  } catch (error) {
    console.error(`Error in agent ${role}:`, error);
    return `[System Error]: Failed to process step. ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
};