const fs = require('fs');
let code = fs.readFileSync('src/components/DesignEditor.tsx', 'utf8');

const target = `    // 3. Draw Transformation controls around selected layer`;
const replacement = `    // Draw Snap Lines
    if (snapLines.x !== undefined) {
      ctx.save();
      ctx.strokeStyle = "#a855f7"; // purple-500
      ctx.lineWidth = 1 / canvasScale;
      ctx.setLineDash([5 / canvasScale, 5 / canvasScale]);
      ctx.beginPath();
      ctx.moveTo(snapLines.x, 0);
      ctx.lineTo(snapLines.x, virtualHeight);
      ctx.stroke();
      ctx.restore();
    }
    if (snapLines.y !== undefined) {
      ctx.save();
      ctx.strokeStyle = "#a855f7";
      ctx.lineWidth = 1 / canvasScale;
      ctx.setLineDash([5 / canvasScale, 5 / canvasScale]);
      ctx.beginPath();
      ctx.moveTo(0, snapLines.y);
      ctx.lineTo(virtualWidth, snapLines.y);
      ctx.stroke();
      ctx.restore();
    }

    // 3. Draw Transformation controls around selected layer`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/DesignEditor.tsx', code);
