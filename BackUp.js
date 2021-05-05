"use strict";
const loc_aPosition = 0;
const loc_Color = 1;
const loc_OffSet = 2;
const loc_ModelMatrix = 3;
const VSHADER_SOURCE =
`#version 300 es
layout(location=${loc_ModelMatrix}) in mat4 ModelMatrix;
layout(location=${loc_aPosition}) in vec4 aPosition;
layout(location=${loc_Color}) in vec4 Color;
layout(location=${loc_OffSet}) in vec2 OffSet;

uniform mat4 viewProjection;

out vec4 v_color;

void main() {
    gl_Position = aPosition * viewProjection * ModelMatrix + vec4(OffSet, 0, 0);
    v_color = Color; 
}`;

// Fragment shader program
const FSHADER_SOURCE =
`#version 300 es
precision mediump float;
in vec4 v_color;
out vec4 fColor;
void main() {
    fColor = v_color;
}`;


function main() 
{
  // Retrieve <canvas> element
  let canvas = document.getElementById('webgl');
  
  // Get the rendering context for WebGL
  let gl = canvas.getContext("webgl2");
  if (!gl) 
  {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) 
  {
    console.log('Failed to intialize shaders.');
    return;
  }

  let {vao, n} = initVertexBuffers(gl);


  if(n < 0)
  {
    console.log('Failed to set the positions of the vertices');
    return;
  }

  const ModelMatrixBuffer = gl.createBuffer();

  const colorBuffer = gl.createBuffer();

  const offSetBuffer = gl.createBuffer();


  // Register function (event handler) to be called on a mouse press  
  canvas.onmousedown = function(ev)
  { 
    click(ev, gl, canvas, ModelMatrixBuffer, colorBuffer, offSetBuffer) 
    g_clicked = true;
  };

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);


  let tick = function() 
  {

    animate();
    render(gl, vao, ModelMatrixBuffer, MatrixData);
    requestAnimationFrame(tick, canvas); // Request that the browser calls tick
  
  };
  tick();
}


const g_offSets = [];  // The array for the position of Triangle with mouse click
const g_angles = [];
const g_colors = [];
const g_ages = [];
const g_scale = [];
const g_matrices = [];
const ANGLE_STEP = -60;
let g_last = Date.now();
let g_stars = 0;

let g_clicked = false;


let MatrixData;




function click(ev, gl, canvas, ModelMatrixBuffer, colorBuffer, offSetBuffer) 
{
  let x = ev.clientX; // x coordinate of a mouse pointer
  let y = ev.clientY; // y coordinate of a mouse pointer
  let rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  let offset = [2];
  offset[0] = x;
  offset[1] = y;
  // Store the coordinates and color
  g_offSets.push(offset);
  g_angles.push(0);
  g_ages.push(Date.now());
  g_scale.push(1);
  g_stars++;
  
  let randomPos = Math.floor(Math.random() * Math.floor(3));
  let rgba = [4];
  let randomColor = Math.random();

  for(let i = 0; i<4; i++)
  {
      rgba[i] = randomColor;
  }
  
  rgba[3] = 1.0;
  rgba[randomPos] = Math.random();
    
  g_colors.push(rgba);


  gl.bindBuffer(gl.ARRAY_BUFFER, ModelMatrixBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, g_stars * 16 * 4, gl.DYNAMIC_DRAW);


  for(let i = 0; i < 4; ++i)
  {
    gl.enableVertexAttribArray(loc_ModelMatrix + i);

    gl.vertexAttribPointer(loc_ModelMatrix + i, 4, gl.FLOAT, false, 64, i * 16);

    gl.vertexAttribDivisor(loc_ModelMatrix + i, 1);
  }
 
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(g_colors), gl.DYNAMIC_DRAW);
  
  gl.enableVertexAttribArray(loc_Color);
  gl.vertexAttribPointer(loc_Color, 4, gl.FLOAT, false, 0, 0);
  gl.vertexAttribDivisor(loc_Color, 1);

  gl.bindBuffer(gl.ARRAY_BUFFER, offSetBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(g_offSets), gl.DYNAMIC_DRAW);

  gl.enableVertexAttribArray(loc_OffSet);
  gl.vertexAttribPointer(loc_OffSet, 2, gl.FLOAT, false, 0, 0);
  gl.vertexAttribDivisor(loc_OffSet, 1);

  MatrixData = new Float32Array(g_stars * 16);

  for(let i = 0; i < g_stars; i++)
  {
    g_matrices.push(new Float32Array(MatrixData.buffer, i * 16 * 4, 16));
  }

}


function initVertexBuffers(gl)
{

  let vertices = new Float32Array([    
    0, -0.2,
    -0.3, -0.4,
    0.0, 0.5,
    0.3, -0.4,
    0.0, 0.5,
    0.0, 0.3,
    -0.4, 0.3,
    0.4, 0.3,
    0.0, 0.3,   
  ]);
  let n = 9;

  //Create a buffer Object
  let posBuffer = gl.createBuffer();
  let vao = gl.createVertexArray();

  
  if(!posBuffer)
  {
    console.log('Failed to create the buffer object');
    return;
  }

  gl.bindVertexArray(vao);

  //Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
  //Write date into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  //Connect the assignment to a_Position variable
  gl.vertexAttribPointer(loc_aPosition, 2, gl.FLOAT, false, 0, 0);

  //Enable the assignment to a_Position variable
  gl.enableVertexAttribArray(loc_aPosition);

  return {vao, n};
}


function render(gl, vao, ModelMatrixBufferer)
{

  if(!g_clicked)
    return;

  gl.clear(gl.COLOR_BUFFER_BIT);
  let rotMatrix = new Matrix4();
  let scaleMatrix = new Matrix4();
  let transMatrix = new Matrix4();
  transMatrix.setIdentity();
  rotMatrix.setIdentity();
  scaleMatrix.setIdentity();

  // g_matrices.forEach((mat, ndx) => 
  // {
  //   scaleMatrix.setScale(g_scale[ndx], g_scale[ndx], 1);
  //   mat = scaleMatrix.elements;
  //   rotMatrix.setRotate(g_angles[ndx], 0, 0, 1);
  //   mat = rotMatrix.elements;
  //   if(Date.now() - g_ages[ndx] / 1000 > 3.5)
  //   {
  //     transMatrix.setTranslate(1000, 1000, 1);
  //     mat = transMatrix.elements;
  //   }
  //   transMatrix.setIdentity();
  //   rotMatrix.setIdentity();
  //   scaleMatrix.setIdentity();
  // });

  gl.bindBuffer(gl.ARRAY_BUFFER, ModelMatrixBufferer);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, MatrixData);

  gl.bindVertexArray(vao);
  gl.useProgram(gl.program);

  const loc_viewProjection = gl.getUniformLocation(gl.program, 'viewProjection');

  let viewProjectionMat = new Matrix4();
  viewProjectionMat.setIdentity();

  gl.uniformMatrix4fv(loc_viewProjection, false, viewProjectionMat.elements);

  gl.drawArraysInstanced(gl.TRIANGLE_FAN, 0, 9, g_stars);
}



function animate() 
{
    // Calculate the elapsed time
    let now = Date.now();
    let elapsed = now - g_last;
    g_last = now;
    // Update the current rotation angle (adjusted by the elapsed time)
    for(let i = 0; i<g_angles.length; i++)
    {
        g_angles[i] = g_angles[i] + (ANGLE_STEP * elapsed) / 1000.0;
        g_angles[i] %= 360;
        g_scale[i] *= 0.99;
    }
}