const fs = require('fs');
let code = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

const stateCode = "  const [isGeneratingCardDesc, setIsGeneratingCardDesc] = useState(false);";
code = code.replace("const [cardDescription, setCardDescription] = useState('');", "const [cardDescription, setCardDescription] = useState('');\n" + stateCode);


const fnCode = `
  const handleGenerateCardDescription = async () => {
    if (!description || !name) {
      alert("Please enter Product Name and Full Description first.");
      return;
    }
    setIsGeneratingCardDesc(true);
    try {
      const res = await fetch('/api/ai/generate-card-description', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${localStorage.getItem('adminToken')}\`
        },
        body: JSON.stringify({ name, category, description })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate description');
      setCardDescription(data.description);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsGeneratingCardDesc(false);
    }
  };
`;

code = code.replace("const handleSignOut = () => {", fnCode + "\n  const handleSignOut = () => {");


const oldUi = `<div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Card Description (Short)</label>
                  <p className="text-xs text-gray-500 mb-1">Shown only on product cards in the listing. If empty, the main description is used.</p>
                  <textarea 
                    value={cardDescription} onChange={e => setCardDescription(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none h-16"
                  />
                </div>`;

const newUi = `<div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">Card Description (Short)</label>
                    <button 
                      type="button" 
                      onClick={handleGenerateCardDescription} 
                      disabled={isGeneratingCardDesc}
                      className="text-xs flex items-center gap-1 text-purple-600 hover:text-purple-700 bg-purple-50 px-2 py-1 rounded disabled:opacity-50"
                    >
                      <Wand2 className="w-3 h-3" />
                      {isGeneratingCardDesc ? 'Generating...' : 'AI Generate'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mb-1">Shown only on product cards in the listing. If empty, the main description is used.</p>
                  <textarea 
                    value={cardDescription} onChange={e => setCardDescription(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none h-16"
                  />
                </div>`;

code = code.replace(oldUi, newUi);

fs.writeFileSync('src/pages/Admin.tsx', code);
