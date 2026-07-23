import fs from 'fs';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { Blob, FileReader } from 'v8'; // Need polyfills?

// We are in node, GLTFExporter might need polyfills for canvas/window
