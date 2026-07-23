const fs = require('fs');
let code = fs.readFileSync('src/components/DesignEditor.tsx', 'utf8');

const target = `    if (dragMode === "move") {
      setLayers(curr => curr.map(l => {
        if (l.id === selectedLayerId) {
          return {
            ...l,
            x: dragStartLayer.x + dx,
            y: dragStartLayer.y + dy
          };
        }
        return l;
      }));
    }`;

const replacement = `    if (dragMode === "move") {
      setLayers(curr => curr.map(l => {
        if (l.id === selectedLayerId) {
          let nx = dragStartLayer.x + dx;
          let ny = dragStartLayer.y + dy;
          let snapX = undefined;
          let snapY = undefined;
          
          const centerX = virtualWidth / 2;
          const centerY = virtualHeight / 2;
          
          if (Math.abs(nx - centerX) < 15) { nx = centerX; snapX = centerX; }
          if (Math.abs(ny - centerY) < 15) { ny = centerY; snapY = centerY; }
          
          setSnapLines({x: snapX, y: snapY});
          
          return {
            ...l,
            x: nx,
            y: ny
          };
        }
        return l;
      }));
    }`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/DesignEditor.tsx', code);
