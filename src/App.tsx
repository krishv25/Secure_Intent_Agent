/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Shield, ShieldAlert, ShieldCheck, Terminal, FileCode, Search, Play, Trash2, FolderSync, Eraser, AlertCircle, ChevronRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Intent {
  action: string;
  target_directory: string;
  reasoning: string;
}

interface SimulationStep {
  id: string;
  request: string;
  reasoning: string;
  intent: Intent | null;
  policyResult: 'Allowed' | 'Blocked';
  policyReason: string;
  executionResult: string;
  timestamp: Date;
}

const ALLOWED_DIR = 'workspace';
const PROTECTED_DIR = 'protected';

const POSSIBLE_ACTIONS = ['organize_files', 'clean_workspace', 'delete_files', 'move_files'];

export default function App() {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<SimulationStep[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const processRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    setIsProcessing(true);
    const currentRequest = input;
    setInput('');

    try {
      // 1. Reasoning Layer (using Gemini)
      const prompt = `
        You are the Reasoning Layer of a Secure File Management Agent.
        User Request: "${currentRequest}"
        
        Analyze the request and determine the intended action and target directory.
        Possible Actions: ${POSSIBLE_ACTIONS.join(', ')}
        Directories: "workspace" (allowed), "protected" (restricted).
        
        Output ONLY a JSON object in this format:
        {
          "action": "one of the possible actions",
          "target_directory": "the directory name",
          "reasoning": "brief explanation of how you interpreted the request"
        }
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const intent: Intent = JSON.parse(response.text || '{}');

      // 2. Policy Enforcement Layer
      let policyResult: 'Allowed' | 'Blocked' = 'Blocked';
      let policyReason = '';
      let executionResult = '';

      if (intent.target_directory === ALLOWED_DIR) {
        policyResult = 'Allowed';
        policyReason = `Access to "${ALLOWED_DIR}" is permitted under system policy.`;
        
        // 3. Execution Layer (Simulated)
        switch (intent.action) {
          case 'organize_files':
            executionResult = `Files in "${ALLOWED_DIR}" have been categorized and sorted.`;
            break;
          case 'clean_workspace':
            executionResult = `Temporary files and cache removed from "${ALLOWED_DIR}".`;
            break;
          case 'delete_files':
            executionResult = `Specified files in "${ALLOWED_DIR}" have been securely deleted.`;
            break;
          case 'move_files':
            executionResult = `Files successfully relocated within "${ALLOWED_DIR}".`;
            break;
          default:
            executionResult = `Action "${intent.action}" executed successfully in "${ALLOWED_DIR}".`;
        }
      } else if (intent.target_directory === PROTECTED_DIR) {
        policyResult = 'Blocked';
        policyReason = `Action prevented because "${PROTECTED_DIR}" directory is restricted and requires higher clearance.`;
        executionResult = `Execution halted by Policy Enforcement Layer.`;
      } else {
        policyResult = 'Blocked';
        policyReason = `Target directory "${intent.target_directory || 'unknown'}" is outside the allowed scope of this agent.`;
        executionResult = `Execution prevented: Scope violation.`;
      }

      const newStep: SimulationStep = {
        id: Math.random().toString(36).substr(2, 9),
        request: currentRequest,
        reasoning: intent.reasoning,
        intent: intent,
        policyResult,
        policyReason,
        executionResult,
        timestamp: new Date(),
      };

      setHistory(prev => [...prev, newStep]);
    } catch (error) {
      console.error("Processing error:", error);
      const errorStep: SimulationStep = {
        id: Math.random().toString(36).substr(2, 9),
        request: currentRequest,
        reasoning: "System error during reasoning.",
        intent: null,
        policyResult: 'Blocked',
        policyReason: "Internal system failure.",
        executionResult: "Execution aborted due to system error.",
        timestamp: new Date(),
      };
      setHistory(prev => [...prev, errorStep]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#E1E1E3] font-mono selection:bg-[#3B82F6] selection:text-white">
      {/* Header */}
      <header className="border-b border-[#1F1F23] bg-[#0F0F12] p-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#1F1F23] rounded-lg border border-[#2F2F35]">
              <Shield className="w-6 h-6 text-[#3B82F6]" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">SECURE INTENT AGENT</h1>
              <p className="text-[10px] text-[#8E8E93] uppercase tracking-[0.2em]">Intent-Aware Execution System v2.4.0</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-[10px] text-[#8E8E93]">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              SYSTEM ONLINE
            </div>
            <div className="px-2 py-1 bg-[#1F1F23] rounded border border-[#2F2F35]">
              LATENCY: 42ms
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Controls & Status */}
        <div className="lg:col-span-1 space-y-6">
          <section className="bg-[#0F0F12] border border-[#1F1F23] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[#1F1F23] bg-[#141417] flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#3B82F6]" />
              <h2 className="text-xs font-bold uppercase tracking-wider">Command Input</h2>
            </div>
            <form onSubmit={processRequest} className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] text-[#8E8E93] uppercase tracking-widest">User Request</label>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="e.g., Organize the files in the workspace..."
                  className="w-full h-32 bg-[#0A0A0B] border border-[#1F1F23] rounded-lg p-3 text-sm focus:outline-none focus:border-[#3B82F6] transition-colors resize-none placeholder-[#3F3F46]"
                />
              </div>
              <button
                type="submit"
                disabled={isProcessing || !input.trim()}
                className="w-full py-3 bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 disabled:hover:bg-[#3B82F6] text-white rounded-lg font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    Execute Intent
                  </>
                )}
              </button>
            </form>
          </section>

          <section className="bg-[#0F0F12] border border-[#1F1F23] rounded-xl">
            <div className="p-4 border-b border-[#1F1F23] bg-[#141417] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider">Policy Rules</h2>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 p-1 bg-emerald-500/10 rounded">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Allowed Scope</p>
                  <p className="text-[11px] text-[#8E8E93] mt-0.5">Directory: <code className="text-emerald-400">/workspace</code></p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 p-1 bg-red-500/10 rounded">
                  <ShieldAlert className="w-3 h-3 text-red-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Protected Scope</p>
                  <p className="text-[11px] text-[#8E8E93] mt-0.5">Directory: <code className="text-red-400">/protected</code></p>
                </div>
              </div>
              <div className="pt-4 border-t border-[#1F1F23]">
                <p className="text-[10px] text-[#8E8E93] leading-relaxed italic">
                  * All requests are analyzed by the Reasoning Layer before policy validation.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Simulation Output */}
        <div className="lg:col-span-2 flex flex-col h-[calc(100vh-12rem)]">
          <div className="bg-[#0F0F12] border border-[#1F1F23] rounded-xl flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-[#1F1F23] bg-[#141417] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-[#3B82F6]" />
                <h2 className="text-xs font-bold uppercase tracking-wider">Execution Log</h2>
              </div>
              <div className="text-[10px] text-[#8E8E93]">
                {history.length} ENTRIES RECORDED
              </div>
            </div>

            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-[#1F1F23] scrollbar-track-transparent"
            >
              <AnimatePresence initial={false}>
                {history.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-[#3F3F46] space-y-4">
                    <Terminal className="w-12 h-12 opacity-20" />
                    <p className="text-sm">Waiting for user request...</p>
                  </div>
                ) : (
                  history.map((step) => (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4 border-l-2 border-[#1F1F23] pl-6 relative"
                    >
                      <div className="absolute left-[-5px] top-0 w-2 h-2 rounded-full bg-[#1F1F23]" />
                      
                      {/* User Request */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[10px] text-[#8E8E93] uppercase tracking-widest">
                          <ChevronRight className="w-3 h-3" />
                          User Request
                          <span className="ml-auto opacity-50">{step.timestamp.toLocaleTimeString()}</span>
                        </div>
                        <p className="text-sm text-white font-bold">{step.request}</p>
                      </div>

                      {/* Layers */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Reasoning Layer */}
                        <div className="bg-[#141417] border border-[#1F1F23] rounded-lg p-3 space-y-2">
                          <div className="flex items-center gap-2 text-[9px] text-[#8E8E93] uppercase tracking-widest font-bold">
                            <Search className="w-3 h-3 text-[#3B82F6]" />
                            1. Reasoning Layer
                          </div>
                          <p className="text-[11px] leading-relaxed text-[#A1A1AA]">{step.reasoning}</p>
                        </div>

                        {/* Intent Model */}
                        <div className="bg-[#141417] border border-[#1F1F23] rounded-lg p-3 space-y-2">
                          <div className="flex items-center gap-2 text-[9px] text-[#8E8E93] uppercase tracking-widest font-bold">
                            <FileCode className="w-3 h-3 text-[#3B82F6]" />
                            2. Intent Model
                          </div>
                          <pre className="text-[10px] text-blue-400 overflow-x-auto">
                            {JSON.stringify(step.intent, null, 2)}
                          </pre>
                        </div>

                        {/* Policy Enforcement */}
                        <div className={`border rounded-lg p-3 space-y-2 ${
                          step.policyResult === 'Allowed' 
                            ? 'bg-emerald-500/5 border-emerald-500/20' 
                            : 'bg-red-500/5 border-red-500/20'
                        }`}>
                          <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest font-bold">
                            {step.policyResult === 'Allowed' ? (
                              <ShieldCheck className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <ShieldAlert className="w-3 h-3 text-red-500" />
                            )}
                            3. Policy Enforcement: <span className={step.policyResult === 'Allowed' ? 'text-emerald-500' : 'text-red-500'}>{step.policyResult}</span>
                          </div>
                          <p className="text-[11px] leading-relaxed text-[#A1A1AA]">{step.policyReason}</p>
                        </div>

                        {/* Execution Result */}
                        <div className="bg-[#141417] border border-[#1F1F23] rounded-lg p-3 space-y-2">
                          <div className="flex items-center gap-2 text-[9px] text-[#8E8E93] uppercase tracking-widest font-bold">
                            <Play className="w-3 h-3 text-[#3B82F6]" />
                            4. Execution Result
                          </div>
                          <p className={`text-[11px] font-bold ${step.policyResult === 'Allowed' ? 'text-white' : 'text-red-400'}`}>
                            {step.executionResult}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Status Bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-[#0F0F12] border-t border-[#1F1F23] px-4 py-2 flex items-center justify-between text-[9px] text-[#3F3F46] tracking-widest uppercase">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-emerald-500" />
            CORE_LOAD: 12%
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-emerald-500" />
            MEM_USAGE: 256MB
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span>ENCRYPTION: AES-256-GCM</span>
          <span>SESSION_ID: {Math.random().toString(36).substr(2, 12).toUpperCase()}</span>
        </div>
      </footer>
    </div>
  );
}
