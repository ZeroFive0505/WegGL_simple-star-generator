"use strict";
const loc_aPosition = 1;
const VSHADER_SOURCE =
`#version 300 es
layout(location=${loc_aPosition}) in vec4 aPosition;
uniform mat4 uRotMatrix;
uniform mat4 uScaleMatrix;
uniform vec2 uOffSet;
void main() {
    gl_Position = aPosition * uScaleMatrix * uRotMatrix + vec4(uOffSet, 0, 0); 
}`;

const FSHADER_SOURCE =
`#version 300 es
precision mediump float;
out vec4 fColor;
uniform vec4 uColor;
void main() {
    fColor = uColor;
}`;


function main() {
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
  
  const loc_uOffSet = gl.getUniformLocation(gl.program, 'uOffSet');
  const loc_uColor = gl.getUniformLocation(gl.program, 'uColor');
  const loc_uRotMatrix = gl.getUniformLocation(gl.program, 'uRotMatrix');
  const loc_uScaleMatrix = gl.getUniformLocation(gl.program, 'uScaleMatrix');

  if(!loc_uOffSet)
  {
      console.log("Failed to load uOffSet uniform variable.");
      return;
  }

  if(!loc_uColor)
  {
      console.log("Failed to load uColor uniform variable.");
      return;
  }

  if(!loc_uRotMatrix)
  {
      console.log("Failed to load uModelMatrix uniform variable.");
      return;
  }

  if(!loc_uScaleMatrix)
  {
      console.log("Falied to load uScaleMatrix uniform variable.");
      return;
  }




  let n = initVertexBuffers(gl);

  if(n < 0)
  {
    console.log('Failed to set the positions of the vertices');
    return;
  }


  // Register function (event handler) to be called on a mouse press

  canvas.onmousedown = function(ev){ click(ev, gl, canvas) };

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);


  let tick = function() 
  {
    animate();  // Update the rotation angle
    draw(gl, loc_uRotMatrix, loc_uOffSet, loc_uColor, loc_uScaleMatrix);   // Draw
    requestAnimationFrame(tick, canvas); // Request that the browser calls tick
  };
  tick();
}


//These are the arrays for the attributes of the stars
const g_vertices = []; 
const g_angles = [];
const g_colors = [];
const g_ages = [];
const g_scale = [];

const ANGLE_STEP = -60;

let g_stars = 0;


let g_last = Date.now();


function click(ev, gl, canvas) 
{

  if(g_stars > 30)
    return;

  let x = ev.clientX; // x coordinate of a mouse pointer
  let y = ev.clientY; // y coordinate of a mouse pointer
  let rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);


  // Store the coordinates and color
  g_vertices.push([x,y]);
  g_angles.push(0);
  g_ages.push(Date.now());
  g_scale.push(1);
  
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
  g_stars++;
}


//Make the BO for making stars
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
  
  if(!posBuffer)
  {
    console.log('Failed to create the buffer object');
    return;
  }

  //Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
  //Write date into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  //Connect the assignment to a_Position variable
  gl.vertexAttribPointer(loc_aPosition, 2, gl.FLOAT, false, 0, 0);

  //Enable the assignment to a_Position variable
  gl.enableVertexAttribArray(loc_aPosition);

  return n;
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


  function draw(gl, loc_uModelMatrix, loc_uOffSet, loc_uColor, loc_uScaleMatrix) 
  {
    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);
    let rotMatrix = new Matrix4();
    let scaleMatrix = new Matrix4();
    
    // Draw the stars
    let len = g_vertices.length;
    for(let i = 0; i < len; i++) 
    {
        if((Date.now() - g_ages[i]) / 1000 > 3.5 ) // dissapear stars about 3.5 seconds after
          continue;


        let rgba = g_colors[i]; 
        rotMatrix.setRotate(g_angles[i], 0, 0, 1);
        scaleMatrix.setScale(g_scale[i], g_scale[i], 1);


        //Set the uniform variables
        gl.uniformMatrix4fv(loc_uModelMatrix, false, rotMatrix.elements);
        gl.uniformMatrix4fv(loc_uScaleMatrix, false, scaleMatrix.elements);
        gl.uniform2f(loc_uOffSet, g_vertices[i][0], g_vertices[i][1]);
        gl.uniform4f(loc_uColor, rgba[0], rgba[1], rgba[2], rgba[3]);


        gl.drawArrays(gl.TRIANGLE_FAN, 0, 9);


        //Reset matrices for the next star
        rotMatrix.setIdentity();
        scaleMatrix.setIdentity();
    }
  }
