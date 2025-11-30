import { Agent, AgentRole, AppMode } from './types';
import { Bot, Wand2, Globe } from 'lucide-react';

export const MODES: Record<AppMode, { label: string; icon: any; description: string; fileExt: string; fileLang: string }> = {
  STATIC_SITE: {
    label: "Static Site",
    icon: Globe,
    description: "One-file HTML + Three.js 3D Generator.",
    fileExt: 'index.html',
    fileLang: 'html'
  },
  TG_BOT: { 
    label: "Telegram Bot", 
    icon: Bot,
    description: "Node.js or Python bot logic.",
    fileExt: 'bot.js', // Default, changes dynamically
    fileLang: 'javascript'
  },
  PROMPT_OPTIMIZER: {
    label: "Prompt God",
    icon: Wand2,
    description: "Refine any text into a Super Prompt.",
    fileExt: 'prompt.md',
    fileLang: 'markdown'
  }
};

const BASE_AGENTS: Record<AgentRole, Partial<Agent>> = {
  [AgentRole.PRODUCT_OWNER]: { id: AgentRole.PRODUCT_OWNER },
  [AgentRole.MECHANIC]: { id: AgentRole.MECHANIC },
  [AgentRole.INNOVATOR]: { id: AgentRole.INNOVATOR },
  [AgentRole.TECH_LEAD]: { id: AgentRole.TECH_LEAD },
  [AgentRole.DESIGNER]: { id: AgentRole.DESIGNER },
  [AgentRole.QA_ENGINEER]: { id: AgentRole.QA_ENGINEER },
  [AgentRole.SYNTHESIZER]: { id: AgentRole.SYNTHESIZER },
  [AgentRole.CRITIC]: { id: AgentRole.CRITIC },
};

export const getAgentProfile = (role: AgentRole, mode: AppMode): Agent => {
  const base = BASE_AGENTS[role];
  
  const profiles: Record<AppMode, Record<AgentRole, { name: string; title: string; description: string }>> = {
    STATIC_SITE: {
      [AgentRole.PRODUCT_OWNER]: { name: "CREATIVE_DIR", title: "Creative Lead", description: "3D Concept" },
      [AgentRole.MECHANIC]: { name: "ARCHITECT", title: "Structure", description: "DOM & Canvas" },
      [AgentRole.INNOVATOR]: { name: "DESIGNER", title: "UI/UX", description: "Visuals & HUD" },
      [AgentRole.TECH_LEAD]: { name: "WEBGL", title: "WebGL Lead", description: "Three.js Logic" },
      [AgentRole.DESIGNER]: { name: "FX_ARTIST", title: "Shaders", description: "Post-Process" },
      [AgentRole.QA_ENGINEER]: { name: "PERF", title: "Performance", description: "FPS Check" },
      [AgentRole.SYNTHESIZER]: { name: "DEVELOPER", title: "Coder", description: "Final Code" },
      [AgentRole.CRITIC]: { name: "BROWSER", title: "Renderer", description: "Visual Check" }
    },
    TG_BOT: {
      [AgentRole.PRODUCT_OWNER]: { name: "ADMIN", title: "Bot Owner", description: "Utility Def" },
      [AgentRole.MECHANIC]: { name: "LOGIC", title: "Flow Engineer", description: "State Machine" },
      [AgentRole.INNOVATOR]: { name: "ENGAGE", title: "Interaction Lead", description: "Gamification" },
      [AgentRole.TECH_LEAD]: { name: "BACKEND", title: "System Architect", description: "API & Setup" },
      [AgentRole.DESIGNER]: { name: "WRITER", title: "UX Writer", description: "Copy & Tone" },
      [AgentRole.QA_ENGINEER]: { name: "TESTER", title: "QA", description: "Scenario Tests" },
      [AgentRole.SYNTHESIZER]: { name: "DEVELOPER", title: "Coder", description: "Final Bot Code" },
      [AgentRole.CRITIC]: { name: "MOD", title: "Reviewer", description: "Limits Check" }
    },
    PROMPT_OPTIMIZER: {
      [AgentRole.PRODUCT_OWNER]: { name: "STRATEGIST", title: "Prompt Lead", description: "Intent Analysis" },
      [AgentRole.MECHANIC]: { name: "STRUCTURE", title: "Architect", description: "Prompt Format" },
      [AgentRole.INNOVATOR]: { name: "CREATIVE", title: "Writer", description: "Word Choice" },
      [AgentRole.TECH_LEAD]: { name: "LOGIC", title: "System Logic", description: "Constraints" },
      [AgentRole.DESIGNER]: { name: "STYLE", title: "Stylist", description: "Tone & Voice" },
      [AgentRole.QA_ENGINEER]: { name: "TESTER", title: "Simulate", description: "Test Run" },
      [AgentRole.SYNTHESIZER]: { name: "MASTER", title: "Optimizer", description: "Final Prompt" },
      [AgentRole.CRITIC]: { name: "USER", title: "User Proxy", description: "Clarity Check" }
    }
  };

  const specific = profiles[mode][role];
  
  return {
    ...base,
    ...specific,
  } as Agent;
};

export const PIPELINE_ORDER = [
  AgentRole.PRODUCT_OWNER,
  AgentRole.MECHANIC,
  AgentRole.INNOVATOR,
  AgentRole.TECH_LEAD,
  AgentRole.DESIGNER,
  AgentRole.QA_ENGINEER,
  AgentRole.SYNTHESIZER
];