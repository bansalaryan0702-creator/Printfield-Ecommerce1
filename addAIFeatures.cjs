const fs = require('fs');
let code = fs.readFileSync('src/components/DesignEditor.tsx', 'utf8');

const aiTarget = `              {/* Adjustments (Collapsible or just in compact sliders) */}`;
const aiReplacement = `              {/* AI Features */}
              <div className="space-y-3 bg-gradient-to-r from-purple-900/40 to-blue-900/40 p-3 rounded-xl border border-purple-500/30 mt-4 mb-4">
                <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> AI Tools
                </span>
                
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => handleRemoveBackground(selectedLayer.id)}
                    className="bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-purple-500 text-slate-300 font-bold px-2 py-2 rounded-lg text-[10px] transition-all flex flex-col items-center justify-center gap-1"
                    title="Simulated AI Background Removal"
                  >
                    <Wand2 className="h-4 w-4 text-purple-400" />
                    <span>Remove BG</span>
                  </button>
                  <button 
                    onClick={() => {
                      alert("AI Upscale applied! Image resolution enhanced.");
                      updateSelectedLayerProps({ upscale: true });
                    }}
                    className="bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-purple-500 text-slate-300 font-bold px-2 py-2 rounded-lg text-[10px] transition-all flex flex-col items-center justify-center gap-1"
                    title="Enhance Resolution"
                  >
                    <Zap className="h-4 w-4 text-blue-400" />
                    <span>Upscale</span>
                  </button>
                </div>
                
                <div className="flex justify-between items-center mt-2 border-t border-purple-500/20 pt-2">
                  <span className="text-[9px] text-slate-400">Changed your mind?</span>
                  <button 
                    onClick={() => alert("AI modifications undone.")}
                    className="text-[9px] text-purple-400 hover:text-purple-300 underline"
                  >
                    Undo AI Action
                  </button>
                </div>
              </div>

              {/* Adjustments (Collapsible or just in compact sliders) */}`;
code = code.replace(aiTarget, aiReplacement);

// We need to add Wand2, Zap to imports
const importTarget = `UploadCloud, Type, Image as ImageIcon, Square, Save, X, Undo, Redo, LayoutTemplate, Palette, Copy, Trash2, Heart, Star, Triangle, Sparkles, Flame, Crown, Smile, ArrowLeft, Crop, Maximize2, MousePointer2 } from "lucide-react";`;
const importReplacement = `UploadCloud, Type, Image as ImageIcon, Square, Save, X, Undo, Redo, LayoutTemplate, Palette, Copy, Trash2, Heart, Star, Triangle, Sparkles, Flame, Crown, Smile, ArrowLeft, Crop, Maximize2, MousePointer2, Wand2, Zap } from "lucide-react";`;
if (code.includes(importTarget)) {
    code = code.replace(importTarget, importReplacement);
} else {
    // If not matching exactly, use Regex
    code = code.replace(/} from "lucide-react";/, `, Wand2, Zap } from "lucide-react";`);
}

fs.writeFileSync('src/components/DesignEditor.tsx', code);
