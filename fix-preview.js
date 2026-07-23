import fs from 'fs';
let content = fs.readFileSync('src/components/Shirt3DPreview.tsx', 'utf8');

const targetGroupStart = `<group dispose={null}>`;
const targetGroupEnd = `</group>`;

const originalGroup = `<group dispose={null}>
      {/* 1. Collar/Ribbing Mesh */}
      {nodes['Node-Mesh'] && (
        <mesh geometry={nodes['Node-Mesh'].geometry} castShadow receiveShadow>
          <meshStandardMaterial 
            ref={matRef0}
            color={shirtColor} 
            roughness={0.7} 
            metalness={0.02} 
            side={THREE.DoubleSide} 
          />
        </mesh>
      )}

      {/* 2. Main Shirt Body Mesh with Live Artwork Decals */}
      {nodes['Node-Mesh_1'] && (
        <mesh geometry={nodes['Node-Mesh_1'].geometry} castShadow receiveShadow>
          <meshStandardMaterial 
            ref={matRef1}
            color={shirtColor} 
            bumpMap={piqueMap || undefined} 
            bumpScale={0.0008} 
            roughness={0.65} 
            metalness={0.02} 
            side={THREE.DoubleSide} 
          />
          {frontFullArtwork?.previewUrl && (
            <SafeDecalArtwork 
              url={frontFullArtwork.previewUrl}
              position={[0, 0.52, 0.056]}
              rotation={[0, 0, 0]}
              baseScale={0.16}
            />
          )}
          {frontChestArtwork?.previewUrl && (
            <SafeDecalArtwork 
              url={frontChestArtwork.previewUrl}
              position={[0.045, 0.58, 0.054]}
              rotation={[0, 0, 0]}
              baseScale={0.042}
            />
          )}
          {backFullArtwork?.previewUrl && (
            <SafeDecalArtwork 
              url={backFullArtwork.previewUrl}
              position={[0, 0.52, -0.062]}
              rotation={[0, Math.PI, 0]}
              baseScale={0.16}
            />
          )}
          {sleeveLeftArtwork?.previewUrl && (
            <SafeDecalArtwork 
              url={sleeveLeftArtwork.previewUrl}
              position={[0.138, 0.598, -0.015]}
              rotation={[0, Math.PI / 2, 0]}
              baseScale={0.026}
            />
          )}
          {sleeveRightArtwork?.previewUrl && (
            <SafeDecalArtwork 
              url={sleeveRightArtwork.previewUrl}
              position={[-0.138, 0.598, -0.015]}
              rotation={[0, -Math.PI / 2, 0]}
              baseScale={0.026}
            />
          )}
        </mesh>
      )}

      {/* 3. Inner Label Area Mesh */}
      {nodes['Node-Mesh_2'] && (
        <mesh geometry={nodes['Node-Mesh_2'].geometry} castShadow receiveShadow>
          <meshStandardMaterial 
            ref={matRef2}
            color={shirtColor} 
            roughness={0.8} 
            metalness={0.02} 
            side={THREE.DoubleSide} 
          />
        </mesh>
      )}

      {/* 4. Additional Stitching/Details Mesh */}
      {nodes['Node-Mesh_3'] && (
        <mesh geometry={nodes['Node-Mesh_3'].geometry} castShadow receiveShadow>
          <meshStandardMaterial 
            ref={matRef3}
            color={shirtColor} 
            roughness={0.7} 
            metalness={0.02} 
            side={THREE.DoubleSide} 
          />
        </mesh>
      )}
    </group>`;

const start = content.indexOf(targetGroupStart);
const end = content.indexOf(targetGroupEnd, start) + targetGroupEnd.length;
if (start !== -1 && end !== -1) {
  content = content.substring(0, start) + originalGroup + content.substring(end);
  fs.writeFileSync('src/components/Shirt3DPreview.tsx', content);
  console.log('Restored');
} else {
  console.log('Not found');
}
