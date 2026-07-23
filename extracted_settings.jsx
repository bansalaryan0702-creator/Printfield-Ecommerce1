          {/* Active Text Edit Box */}
          {selectedLayer && selectedLayer.type === "text" && (
            <div className="mb-6 space-y-2 border-b border-slate-200 pb-5">
              <h4 className="font-bold text-xs tracking-wider uppercase text-purple-600">Edit Selected Text</h4>
              <textarea
                value={selectedLayer.text || ""}
                onChange={(e) => updateSelectedLayerProps({ text: e.target.value })}
                rows={3}
                className="w-full bg-slate-50 text-slate-800 rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-purple-500 transition-colors placeholder-slate-400 leading-normal"
                placeholder="Type your text content here..."
              />
              
              <div className="pt-3 space-y-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Fine-tune Text</span>
                
                {/* Letter Spacing */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Letter Spacing</span>
                    <span className="text-slate-800 font-semibold">{selectedLayer.letterSpacing || 0}px</span>
                  </div>
                  <input 
                    type="range"
                    min={-10}
                    max={50}
                    value={selectedLayer.letterSpacing || 0}
                    onChange={(e) => updateSelectedLayerProps({ letterSpacing: parseInt(e.target.value) })}
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>

                {/* Line Height */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Line Height</span>
                    <span className="text-slate-800 font-semibold">{selectedLayer.lineHeight || 1.25}x</span>
                  </div>
                  <input 
                    type="range"
                    min={0.5}
                    max={3}
                    step={0.05}
                    value={selectedLayer.lineHeight || 1.25}
                    onChange={(e) => updateSelectedLayerProps({ lineHeight: parseFloat(e.target.value) })}
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>

                {/* Opacity/Fade */}
                <div className="space-y-1 pt-2">
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Opacity (Fade)</span>
                    <span className="text-slate-800 font-semibold">{selectedLayer.opacity !== undefined ? Math.round(selectedLayer.opacity * 100) : 100}%</span>
                  </div>
                  <input 
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={selectedLayer.opacity !== undefined ? selectedLayer.opacity : 1}
                    onChange={(e) => updateSelectedLayerProps({ opacity: parseFloat(e.target.value) })}
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>
                
                {/* Drop Shadow settings */}
                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] text-slate-500">Shadow:</span>
                    <input 
                      type="color"
                      value={selectedLayer.shadowColor || "#000000"}
                      onChange={(e) => updateSelectedLayerProps({ shadowColor: e.target.value, shadowBlur: selectedLayer.shadowBlur === undefined ? 5 : selectedLayer.shadowBlur })}
                      className="w-6 h-6 rounded cursor-pointer p-0 border-0 bg-transparent"
                    />
                    <button 
                      onClick={() => updateSelectedLayerProps({ shadowColor: undefined, shadowBlur: undefined })}
                      className="ml-auto text-[10px] text-slate-400 hover:text-slate-800"
                    >
                      Clear
                    </button>
                  </div>
                  
                  {selectedLayer.shadowColor && (
                    <div className="space-y-3 bg-slate-550 bg-slate-50 p-3 rounded border border-slate-200 mt-2">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span>Blur</span>
                        </div>
                        <input 
                          type="range"
                          min={0}
                          max={50}
                          value={selectedLayer.shadowBlur || 0}
                          onChange={(e) => updateSelectedLayerProps({ shadowBlur: parseInt(e.target.value) })}
                          className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span>Offset X</span>
                        </div>
                        <input 
                          type="range"
                          min={-50}
                          max={50}
                          value={selectedLayer.shadowOffsetX || 0}
                          onChange={(e) => updateSelectedLayerProps({ shadowOffsetX: parseInt(e.target.value) })}
                          className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span>Offset Y</span>
                        </div>
                        <input 
                          type="range"
                          min={-50}
                          max={50}
                          value={selectedLayer.shadowOffsetY || 0}
                          onChange={(e) => updateSelectedLayerProps({ shadowOffsetY: parseInt(e.target.value) })}
                          className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Active Image Customization Panel */}
          {selectedLayer && selectedLayer.type === "image" && (
            <div className="mb-6 space-y-4 border-b border-slate-200 pb-5 text-xs">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-xs tracking-wider uppercase text-purple-600">Image Settings</h4>
                <div className="flex gap-1">
                  <button 
                    onClick={() => handleOpenCropper(selectedLayer.id)}
                    className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white font-bold px-2.5 py-1 rounded-lg text-[10px] transition-all"
                  >
                    <Crop className="h-3 w-3" />
                    <span>Crop</span>
                  </button>
                  {selectedLayer.crop && (
                    <button 
                      onClick={() => handleResetCrop(selectedLayer.id)}
                      className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold px-2 py-1 rounded-lg text-[10px]"
                      title="Reset all cropping"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {/* AI Tools */}
              <div className="space-y-3 bg-purple-50/50 p-3 rounded-xl border border-purple-100">
                <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block flex items-center gap-1.5">
                  <Wand2 className="h-3 w-3" /> AI Image Tools
                </span>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleRemoveBackground}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-white border border-purple-200 hover:border-purple-500 hover:shadow-md hover:shadow-purple-500/10 text-purple-700 transition-all text-[10px] font-bold"
                  >
                    <ImageOff className="h-4 w-4" />
                    <span>Remove BG</span>
                  </button>
                  <button
                    onClick={handleUpscaleImage}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-white border border-purple-200 hover:border-purple-500 hover:shadow-md hover:shadow-purple-500/10 text-purple-700 transition-all text-[10px] font-bold"
                  >
                    <Maximize className="h-4 w-4" />
                    <span>Upscale HD</span>
                  </button>
                
                  <button
                    onClick={() => setIsEraserOpen(true)}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-white border border-purple-200 hover:border-purple-500 hover:shadow-md hover:shadow-purple-500/10 text-purple-700 transition-all text-[10px] font-bold"
                  >
                    <Eraser className="h-4 w-4" />
                    <span>Eraser</span>
                  </button>
                </div>
                
                {selectedLayer.originalSrc && (
                  <button 
                    onClick={handleUndoImage}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-dashed border-slate-300 mt-1"
                  >
                    <Undo2 className="h-3 w-3" />
                    Restore Original
                  </button>
                )}
              </div>

              {/* Flip & Opacity Row */}
              <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-[11px] font-medium">Quick Flip:</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => updateSelectedLayerProps({ flipX: !selectedLayer.flipX })}
                      className={`px-2 py-1 rounded border text-[10px] font-bold transition-all ${selectedLayer.flipX ? "bg-purple-600/10 border-purple-500 text-purple-700" : "bg-white border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-100"}`}
                    >
                      Flip Horiz
                    </button>
                    <button
                      onClick={() => updateSelectedLayerProps({ flipY: !selectedLayer.flipY })}
                      className={`px-2 py-1 rounded border text-[10px] font-bold transition-all ${selectedLayer.flipY ? "bg-purple-600/10 border-purple-500 text-purple-700" : "bg-white border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-100"}`}
                    >
                      Flip Vert
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Layer Opacity</span>
                    <span className="text-purple-600 font-bold">{Math.round((selectedLayer.opacity !== undefined ? selectedLayer.opacity : 1) * 100)}%</span>
                  </div>
                  <input 
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round((selectedLayer.opacity !== undefined ? selectedLayer.opacity : 1) * 100)}
                    onChange={(e) => updateSelectedLayerProps({ opacity: parseInt(e.target.value) / 100 })}
                    className="w-full accent-purple-500 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    onMouseUp={() => saveHistoryState(layers)}
                    onTouchEnd={() => saveHistoryState(layers)}
                  />
                </div>
              </div>

                            {selectedLayer.type === "image" && (
              <>
              {/* Image Fine-Tune Filters */}
              <div className="space-y-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Fine-tune Filters</span>
                  <button 
                    onClick={() => updateSelectedLayerProps({ brightness: 100, contrast: 100, saturate: 100, grayscale: 0, blur: 0, sepia: 0, hueRotate: 0 })}
                    className="text-[9px] text-slate-400 hover:text-slate-600 font-semibold"
                  >
                    Reset All
                  </button>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Brightness</span>
                    <span className="text-purple-600 font-bold">{selectedLayer.brightness !== undefined ? selectedLayer.brightness : 100}%</span>
                  </div>
                  <input type="range" min={0} max={200} value={selectedLayer.brightness !== undefined ? selectedLayer.brightness : 100}
                    onChange={(e) => updateSelectedLayerProps({ brightness: parseInt(e.target.value) }, false)}
                    className="w-full accent-purple-500 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    onMouseUp={() => saveHistoryState(layers)}
                    onTouchEnd={() => saveHistoryState(layers)}
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Contrast</span>
                    <span className="text-purple-600 font-bold">{selectedLayer.contrast !== undefined ? selectedLayer.contrast : 100}%</span>
                  </div>
                  <input type="range" min={0} max={200} value={selectedLayer.contrast !== undefined ? selectedLayer.contrast : 100}
                    onChange={(e) => updateSelectedLayerProps({ contrast: parseInt(e.target.value) }, false)}
                    className="w-full accent-purple-500 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    onMouseUp={() => saveHistoryState(layers)}
                    onTouchEnd={() => saveHistoryState(layers)}
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Saturation</span>
                    <span className="text-purple-600 font-bold">{selectedLayer.saturate !== undefined ? selectedLayer.saturate : 100}%</span>
                  </div>
                  <input type="range" min={0} max={200} value={selectedLayer.saturate !== undefined ? selectedLayer.saturate : 100}
                    onChange={(e) => updateSelectedLayerProps({ saturate: parseInt(e.target.value) }, false)}
                    className="w-full accent-purple-500 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    onMouseUp={() => saveHistoryState(layers)}
                    onTouchEnd={() => saveHistoryState(layers)}
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Grayscale</span>
                    <span className="text-purple-600 font-bold">{selectedLayer.grayscale !== undefined ? selectedLayer.grayscale : 0}%</span>
                  </div>
                  <input type="range" min={0} max={100} value={selectedLayer.grayscale !== undefined ? selectedLayer.grayscale : 0}
                    onChange={(e) => updateSelectedLayerProps({ grayscale: parseInt(e.target.value) }, false)}
                    className="w-full accent-purple-500 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    onMouseUp={() => saveHistoryState(layers)}
                    onTouchEnd={() => saveHistoryState(layers)}
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Blur</span>
                    <span className="text-purple-600 font-bold">{selectedLayer.blur !== undefined ? selectedLayer.blur : 0}px</span>
                  </div>
                  <input type="range" min={0} max={20} value={selectedLayer.blur !== undefined ? selectedLayer.blur : 0}
                    onChange={(e) => updateSelectedLayerProps({ blur: parseInt(e.target.value) }, false)}
                    className="w-full accent-purple-500 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    onMouseUp={() => saveHistoryState(layers)}
                    onTouchEnd={() => saveHistoryState(layers)}
                  />
                </div>
              </div>

              </>
            )}
              {/* Precise Rotation Controls */}
              <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">Rotation Angle</span>
                  <span className="text-purple-600 font-bold">{Math.round(((selectedLayer.rotation || 0) * 180 / Math.PI + 360) % 360)}°</span>
                </div>
                <div className="flex items-center gap-3">
                  <input 
                    type="range"
                    min={0}
                    max={359}
                    value={Math.round(((selectedLayer.rotation || 0) * 180 / Math.PI + 360) % 360)}
                    onChange={(e) => {
                      const deg = parseInt(e.target.value);
                      updateSelectedLayerProps({ rotation: (deg * Math.PI / 180) });
                    }}
                    className="flex-1 accent-purple-500 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex gap-1 shrink-0">
                    <button 
                      onClick={() => {
                        const currDeg = (selectedLayer.rotation || 0) * 180 / Math.PI;
                        const newRad = ((currDeg - 90) * Math.PI / 180);
                        updateSelectedLayerProps({ rotation: newRad });
                        saveHistoryState(layers.map(l => l.id === selectedLayer.id ? { ...l, rotation: newRad } : l));
                      }}
                      className="p-1 rounded bg-white border border-slate-200 hover:bg-slate-100 text-slate-600"
                      title="Rotate -90°"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </button>
                    <button 
                      onClick={() => {
                        const currDeg = (selectedLayer.rotation || 0) * 180 / Math.PI;
                        const newRad = ((currDeg + 90) * Math.PI / 180);
                        updateSelectedLayerProps({ rotation: newRad });
                        saveHistoryState(layers.map(l => l.id === selectedLayer.id ? { ...l, rotation: newRad } : l));
                      }}
                      className="p-1 rounded bg-white border border-slate-200 hover:bg-slate-100 text-slate-600"
                      title="Rotate +90°"
                    >
                      <RotateCw className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>


            </div>
          )}

