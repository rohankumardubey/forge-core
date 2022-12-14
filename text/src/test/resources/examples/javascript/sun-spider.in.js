// 3D Cube Rotation
// http://www.speich.net/computer/moztesting/3d.htm
// Created by Simon Speich

var Q = new Array();
var MTrans = new Array();  // transformation matrix
var MQube = new Array();  // position information of qube
var I = new Array();      // entity matrix
var Origin = new Object();
var Testing = new Object();
var LoopTimer;

var DisplArea = new Object();
DisplArea.Width = 300;
DisplArea.Height = 300;

function DrawLine(From, To) {
  var x1 = From.V[0];
  var x2 = To.V[0];
  var y1 = From.V[1];
  var y2 = To.V[1];
  var dx = Math.abs(x2 - x1);
  var dy = Math.abs(y2 - y1);
  var x = x1;
  var y = y1;
  var IncX1, IncY1;
  var IncX2, IncY2;  
  var Den;
  var Num;
  var NumAdd;
  var NumPix;

  if (x2 >= x1) {  IncX1 = 1; IncX2 = 1;  }
  else { IncX1 = -1; IncX2 = -1; }
  if (y2 >= y1)  {  IncY1 = 1; IncY2 = 1; }
  else { IncY1 = -1; IncY2 = -1; }
  if (dx >= dy) {
    IncX1 = 0;
    IncY2 = 0;
    Den = dx;
    Num = dx / 2;
    NumAdd = dy;
    NumPix = dx;
  }
  else {
    IncX2 = 0;
    IncY1 = 0;
    Den = dy;
    Num = dy / 2;
    NumAdd = dx;
    NumPix = dy;
  }

  NumPix = Math.round(Q.LastPx + NumPix);

  var i = Q.LastPx;
  for (; i < NumPix; i++) {
    Num += NumAdd;
    if (Num >= Den) {
      Num -= Den;
      x += IncX1;
      y += IncY1;
    }
    x += IncX2;
    y += IncY2;
  }
  Q.LastPx = NumPix;
}

function CalcCross(V0, V1) {
  var Cross = new Array();
  Cross[0] = V0[1]*V1[2] - V0[2]*V1[1];
  Cross[1] = V0[2]*V1[0] - V0[0]*V1[2];
  Cross[2] = V0[0]*V1[1] - V0[1]*V1[0];
  return Cross;
}

function CalcNormal(V0, V1, V2) {
  var A = new Array();   var B = new Array(); 
  for (var i = 0; i < 3; i++) {
    A[i] = V0[i] - V1[i];
    B[i] = V2[i] - V1[i];
  }
  A = CalcCross(A, B);
  var Length = Math.sqrt(A[0]*A[0] + A[1]*A[1] + A[2]*A[2]); 
  for (var i = 0; i < 3; i++) A[i] = A[i] / Length;
  A[3] = 1;
  return A;
}

function CreateP(X,Y,Z) {
  this.V = [X,Y,Z,1];
}

// multiplies two matrices
function MMulti(M1, M2) {
  var M = [[],[],[],[]];
  var i = 0;
  var j = 0;
  for (; i < 4; i++) {
    j = 0;
    for (; j < 4; j++) M[i][j] = M1[i][0] * M2[0][j] + M1[i][1] * M2[1][j] + M1[i][2] * M2[2][j] + M1[i][3] * M2[3][j];
  }
  return M;
}

//multiplies matrix with vector
function VMulti(M, V) {
  var Vect = new Array();
  var i = 0;
  for (;i < 4; i++) Vect[i] = M[i][0] * V[0] + M[i][1] * V[1] + M[i][2] * V[2] + M[i][3] * V[3];
  return Vect;
}

function VMulti2(M, V) {
  var Vect = new Array();
  var i = 0;
  for (;i < 3; i++) Vect[i] = M[i][0] * V[0] + M[i][1] * V[1] + M[i][2] * V[2];
  return Vect;
}

// add to matrices
function MAdd(M1, M2) {
  var M = [[],[],[],[]];
  var i = 0;
  var j = 0;
  for (; i < 4; i++) {
    j = 0;
    for (; j < 4; j++) M[i][j] = M1[i][j] + M2[i][j];
  }
  return M;
}

function Translate(M, Dx, Dy, Dz) {
  var T = [
  [1,0,0,Dx],
  [0,1,0,Dy],
  [0,0,1,Dz],
  [0,0,0,1]
  ];
  return MMulti(T, M);
}

function RotateX(M, Phi) {
  var a = Phi;
  a *= Math.PI / 180;
  var Cos = Math.cos(a);
  var Sin = Math.sin(a);
  var R = [
  [1,0,0,0],
  [0,Cos,-Sin,0],
  [0,Sin,Cos,0],
  [0,0,0,1]
  ];
  return MMulti(R, M);
}

function RotateY(M, Phi) {
  var a = Phi;
  a *= Math.PI / 180;
  var Cos = Math.cos(a);
  var Sin = Math.sin(a);
  var R = [
  [Cos,0,Sin,0],
  [0,1,0,0],
  [-Sin,0,Cos,0],
  [0,0,0,1]
  ];
  return MMulti(R, M);
}

function RotateZ(M, Phi) {
  var a = Phi;
  a *= Math.PI / 180;
  var Cos = Math.cos(a);
  var Sin = Math.sin(a);
  var R = [
  [Cos,-Sin,0,0],
  [Sin,Cos,0,0],
  [0,0,1,0],   
  [0,0,0,1]
  ];
  return MMulti(R, M);
}

function DrawQube() {
  // calc current normals
  var CurN = new Array();
  var i = 5;
  Q.LastPx = 0;
  for (; i > -1; i--) CurN[i] = VMulti2(MQube, Q.Normal[i]);
  if (CurN[0][2] < 0) {
    if (!Q.Line[0]) { DrawLine(Q[0], Q[1]); Q.Line[0] = true; };
    if (!Q.Line[1]) { DrawLine(Q[1], Q[2]); Q.Line[1] = true; };
    if (!Q.Line[2]) { DrawLine(Q[2], Q[3]); Q.Line[2] = true; };
    if (!Q.Line[3]) { DrawLine(Q[3], Q[0]); Q.Line[3] = true; };
  }
  if (CurN[1][2] < 0) {
    if (!Q.Line[2]) { DrawLine(Q[3], Q[2]); Q.Line[2] = true; };
    if (!Q.Line[9]) { DrawLine(Q[2], Q[6]); Q.Line[9] = true; };
    if (!Q.Line[6]) { DrawLine(Q[6], Q[7]); Q.Line[6] = true; };
    if (!Q.Line[10]) { DrawLine(Q[7], Q[3]); Q.Line[10] = true; };
  }
  if (CurN[2][2] < 0) {
    if (!Q.Line[4]) { DrawLine(Q[4], Q[5]); Q.Line[4] = true; };
    if (!Q.Line[5]) { DrawLine(Q[5], Q[6]); Q.Line[5] = true; };
    if (!Q.Line[6]) { DrawLine(Q[6], Q[7]); Q.Line[6] = true; };
    if (!Q.Line[7]) { DrawLine(Q[7], Q[4]); Q.Line[7] = true; };
  }
  if (CurN[3][2] < 0) {
    if (!Q.Line[4]) { DrawLine(Q[4], Q[5]); Q.Line[4] = true; };
    if (!Q.Line[8]) { DrawLine(Q[5], Q[1]); Q.Line[8] = true; };
    if (!Q.Line[0]) { DrawLine(Q[1], Q[0]); Q.Line[0] = true; };
    if (!Q.Line[11]) { DrawLine(Q[0], Q[4]); Q.Line[11] = true; };
  }
  if (CurN[4][2] < 0) {
    if (!Q.Line[11]) { DrawLine(Q[4], Q[0]); Q.Line[11] = true; };
    if (!Q.Line[3]) { DrawLine(Q[0], Q[3]); Q.Line[3] = true; };
    if (!Q.Line[10]) { DrawLine(Q[3], Q[7]); Q.Line[10] = true; };
    if (!Q.Line[7]) { DrawLine(Q[7], Q[4]); Q.Line[7] = true; };
  }
  if (CurN[5][2] < 0) {
    if (!Q.Line[8]) { DrawLine(Q[1], Q[5]); Q.Line[8] = true; };
    if (!Q.Line[5]) { DrawLine(Q[5], Q[6]); Q.Line[5] = true; };
    if (!Q.Line[9]) { DrawLine(Q[6], Q[2]); Q.Line[9] = true; };
    if (!Q.Line[1]) { DrawLine(Q[2], Q[1]); Q.Line[1] = true; };
  }
  Q.Line = [false,false,false,false,false,false,false,false,false,false,false,false];
  Q.LastPx = 0;
}

function Loop() {
  if (Testing.LoopCount > Testing.LoopMax) return;
  var TestingStr = String(Testing.LoopCount);
  while (TestingStr.length < 3) TestingStr = "0" + TestingStr;
  MTrans = Translate(I, -Q[8].V[0], -Q[8].V[1], -Q[8].V[2]);
  MTrans = RotateX(MTrans, 1);
  MTrans = RotateY(MTrans, 3);
  MTrans = RotateZ(MTrans, 5);
  MTrans = Translate(MTrans, Q[8].V[0], Q[8].V[1], Q[8].V[2]);
  MQube = MMulti(MTrans, MQube);
  var i = 8;
  for (; i > -1; i--) {
    Q[i].V = VMulti(MTrans, Q[i].V);
  }
  DrawQube();
  Testing.LoopCount++;
  Loop();
}

function Init(CubeSize) {
  // init/reset vars
  Origin.V = [150,150,20,1];
  Testing.LoopCount = 0;
  Testing.LoopMax = 50;
  Testing.TimeMax = 0;
  Testing.TimeAvg = 0;
  Testing.TimeMin = 0;
  Testing.TimeTemp = 0;
  Testing.TimeTotal = 0;
  Testing.Init = false;

  // transformation matrix
  MTrans = [
  [1,0,0,0],
  [0,1,0,0],
  [0,0,1,0],
  [0,0,0,1]
  ];
  
  // position information of qube
  MQube = [
  [1,0,0,0],
  [0,1,0,0],
  [0,0,1,0],
  [0,0,0,1]
  ];
  
  // entity matrix
  I = [
  [1,0,0,0],
  [0,1,0,0],
  [0,0,1,0],
  [0,0,0,1]
  ];
  
  // create qube
  Q[0] = new CreateP(-CubeSize,-CubeSize, CubeSize);
  Q[1] = new CreateP(-CubeSize, CubeSize, CubeSize);
  Q[2] = new CreateP( CubeSize, CubeSize, CubeSize);
  Q[3] = new CreateP( CubeSize,-CubeSize, CubeSize);
  Q[4] = new CreateP(-CubeSize,-CubeSize,-CubeSize);
  Q[5] = new CreateP(-CubeSize, CubeSize,-CubeSize);
  Q[6] = new CreateP( CubeSize, CubeSize,-CubeSize);
  Q[7] = new CreateP( CubeSize,-CubeSize,-CubeSize);
  
  // center of gravity
  Q[8] = new CreateP(0, 0, 0);
  
  // anti-clockwise edge check
  Q.Edge = [[0,1,2],[3,2,6],[7,6,5],[4,5,1],[4,0,3],[1,5,6]];
  
  // calculate squad normals
  Q.Normal = new Array();
  for (var i = 0; i < Q.Edge.length; i++) Q.Normal[i] = CalcNormal(Q[Q.Edge[i][0]].V, Q[Q.Edge[i][1]].V, Q[Q.Edge[i][2]].V);
  
  // line drawn ?
  Q.Line = [false,false,false,false,false,false,false,false,false,false,false,false];
  
  // create line pixels
  Q.NumPx = 9 * 2 * CubeSize;
  for (var i = 0; i < Q.NumPx; i++) CreateP(0,0,0);
  
  MTrans = Translate(MTrans, Origin.V[0], Origin.V[1], Origin.V[2]);
  MQube = MMulti(MTrans, MQube);

  var i = 0;
  for (; i < 9; i++) {
    Q[i].V = VMulti(MTrans, Q[i].V);
  }
  DrawQube();
  Testing.Init = true;
  Loop();
}

for ( var i = 20; i <= 160; i *= 2 ) {
  Init(i);
}

Q = null;
MTrans = null;
MQube = null;
I = null;
Origin = null;
Testing = null;
LoopTime = null;
DisplArea = null;
/*
 * Copyright (C) 2007 Apple Inc.  All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE COMPUTER, INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE COMPUTER, INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. 
 */

var loops = 15
var nx = 120
var nz = 120

function morph(a, f) {
    var PI2nx = Math.PI * 8/nx
    var sin = Math.sin
    var f30 = -(50 * sin(f*Math.PI*2))
    
    for (var i = 0; i < nz; ++i) {
        for (var j = 0; j < nx; ++j) {
            a[3*(i*nx+j)+1]    = sin((j-1) * PI2nx ) * -f30
        }
    }
}

    
var a = Array()
for (var i=0; i < nx*nz*3; ++i) 
    a[i] = 0

for (var i = 0; i < loops; ++i) {
    morph(a, i/loops)
}

testOutput = 0;
for (var i = 0; i < nx; i++)
    testOutput += a[3*(i*nx+i)+1];
a = null;
/*
 * Copyright (C) 2007 Apple Inc.  All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE COMPUTER, INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE COMPUTER, INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. 
 */

function createVector(x,y,z) {
    return new Array(x,y,z);
}

function sqrLengthVector(self) {
    return self[0] * self[0] + self[1] * self[1] + self[2] * self[2];
}

function lengthVector(self) {
    return Math.sqrt(self[0] * self[0] + self[1] * self[1] + self[2] * self[2]);
}

function addVector(self, v) {
    self[0] += v[0];
    self[1] += v[1];
    self[2] += v[2];
    return self;
}

function subVector(self, v) {
    self[0] -= v[0];
    self[1] -= v[1];
    self[2] -= v[2];
    return self;
}

function scaleVector(self, scale) {
    self[0] *= scale;
    self[1] *= scale;
    self[2] *= scale;
    return self;
}

function normaliseVector(self) {
    var len = Math.sqrt(self[0] * self[0] + self[1] * self[1] + self[2] * self[2]);
    self[0] /= len;
    self[1] /= len;
    self[2] /= len;
    return self;
}

function add(v1, v2) {
    return new Array(v1[0] + v2[0], v1[1] + v2[1], v1[2] + v2[2]);
}

function sub(v1, v2) {
    return new Array(v1[0] - v2[0], v1[1] - v2[1], v1[2] - v2[2]);
}

function scalev(v1, v2) {
    return new Array(v1[0] * v2[0], v1[1] * v2[1], v1[2] * v2[2]);
}

function dot(v1, v2) {
    return v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
}

function scale(v, scale) {
    return [v[0] * scale, v[1] * scale, v[2] * scale];
}

function cross(v1, v2) {
    return [v1[1] * v2[2] - v1[2] * v2[1], 
            v1[2] * v2[0] - v1[0] * v2[2],
            v1[0] * v2[1] - v1[1] * v2[0]];

}

function normalise(v) {
    var len = lengthVector(v);
    return [v[0] / len, v[1] / len, v[2] / len];
}

function transformMatrix(self, v) {
    var vals = self;
    var x  = vals[0] * v[0] + vals[1] * v[1] + vals[2] * v[2] + vals[3];
    var y  = vals[4] * v[0] + vals[5] * v[1] + vals[6] * v[2] + vals[7];
    var z  = vals[8] * v[0] + vals[9] * v[1] + vals[10] * v[2] + vals[11];
    return [x, y, z];
}

function invertMatrix(self) {
    var temp = new Array(16);
    var tx = -self[3];
    var ty = -self[7];
    var tz = -self[11];
    for (h = 0; h < 3; h++) 
        for (v = 0; v < 3; v++) 
            temp[h + v * 4] = self[v + h * 4];
    for (i = 0; i < 11; i++)
        self[i] = temp[i];
    self[3] = tx * self[0] + ty * self[1] + tz * self[2];
    self[7] = tx * self[4] + ty * self[5] + tz * self[6];
    self[11] = tx * self[8] + ty * self[9] + tz * self[10];
    return self;
}


// Triangle intersection using barycentric coord method
function Triangle(p1, p2, p3) {
    var edge1 = sub(p3, p1);
    var edge2 = sub(p2, p1);
    var normal = cross(edge1, edge2);
    if (Math.abs(normal[0]) > Math.abs(normal[1]))
        if (Math.abs(normal[0]) > Math.abs(normal[2]))
            this.axis = 0; 
        else 
            this.axis = 2;
    else
        if (Math.abs(normal[1]) > Math.abs(normal[2])) 
            this.axis = 1;
        else 
            this.axis = 2;
    var u = (this.axis + 1) % 3;
    var v = (this.axis + 2) % 3;
    var u1 = edge1[u];
    var v1 = edge1[v];
    
    var u2 = edge2[u];
    var v2 = edge2[v];
    this.normal = normalise(normal);
    this.nu = normal[u] / normal[this.axis];
    this.nv = normal[v] / normal[this.axis];
    this.nd = dot(normal, p1) / normal[this.axis];
    var det = u1 * v2 - v1 * u2;
    this.eu = p1[u];
    this.ev = p1[v]; 
    this.nu1 = u1 / det;
    this.nv1 = -v1 / det;
    this.nu2 = v2 / det;
    this.nv2 = -u2 / det; 
    this.material = [0.7, 0.7, 0.7];
}

Triangle.prototype.intersect = function(orig, dir, near, far) {
    var u = (this.axis + 1) % 3;
    var v = (this.axis + 2) % 3;
    var d = dir[this.axis] + this.nu * dir[u] + this.nv * dir[v];
    var t = (this.nd - orig[this.axis] - this.nu * orig[u] - this.nv * orig[v]) / d;
    if (t < near || t > far)
        return null;
    var Pu = orig[u] + t * dir[u] - this.eu;
    var Pv = orig[v] + t * dir[v] - this.ev;
    var a2 = Pv * this.nu1 + Pu * this.nv1;
    if (a2 < 0) 
        return null;
    var a3 = Pu * this.nu2 + Pv * this.nv2;
    if (a3 < 0) 
        return null;

    if ((a2 + a3) > 1) 
        return null;
    return t;
}

function Scene(a_triangles) {
    this.triangles = a_triangles;
    this.lights = [];
    this.ambient = [0,0,0];
    this.background = [0.8,0.8,1];
}
var zero = new Array(0,0,0);

Scene.prototype.intersect = function(origin, dir, near, far) {
    var closest = null;
    for (i = 0; i < this.triangles.length; i++) {
        var triangle = this.triangles[i];   
        var d = triangle.intersect(origin, dir, near, far);
        if (d == null || d > far || d < near)
            continue;
        far = d;
        closest = triangle;
    }
    
    if (!closest)
        return [this.background[0],this.background[1],this.background[2]];
        
    var normal = closest.normal;
    var hit = add(origin, scale(dir, far)); 
    if (dot(dir, normal) > 0)
        normal = [-normal[0], -normal[1], -normal[2]];
    
    var colour = null;
    if (closest.shader) {
        colour = closest.shader(closest, hit, dir);
    } else {
        colour = closest.material;
    }
    
    // do reflection
    var reflected = null;
    if (colour.reflection > 0.001) {
        var reflection = addVector(scale(normal, -2*dot(dir, normal)), dir);
        reflected = this.intersect(hit, reflection, 0.0001, 1000000);
        if (colour.reflection >= 0.999999)
            return reflected;
    }
    
    var l = [this.ambient[0], this.ambient[1], this.ambient[2]];
    for (var i = 0; i < this.lights.length; i++) {
        var light = this.lights[i];
        var toLight = sub(light, hit);
        var distance = lengthVector(toLight);
        scaleVector(toLight, 1.0/distance);
        distance -= 0.0001;
        if (this.blocked(hit, toLight, distance))
            continue;
        var nl = dot(normal, toLight);
        if (nl > 0)
            addVector(l, scale(light.colour, nl));
    }
    l = scalev(l, colour);
    if (reflected) {
        l = addVector(scaleVector(l, 1 - colour.reflection), scaleVector(reflected, colour.reflection));
    }
    return l;
}

Scene.prototype.blocked = function(O, D, far) {
    var near = 0.0001;
    var closest = null;
    for (i = 0; i < this.triangles.length; i++) {
        var triangle = this.triangles[i];   
        var d = triangle.intersect(O, D, near, far);
        if (d == null || d > far || d < near)
            continue;
        return true;
    }
    
    return false;
}


// this camera code is from notes i made ages ago, it is from *somewhere* -- i cannot remember where
// that somewhere is
function Camera(origin, lookat, up) {
    var zaxis = normaliseVector(subVector(lookat, origin));
    var xaxis = normaliseVector(cross(up, zaxis));
    var yaxis = normaliseVector(cross(xaxis, subVector([0,0,0], zaxis)));
    var m = new Array(16);
    m[0] = xaxis[0]; m[1] = xaxis[1]; m[2] = xaxis[2];
    m[4] = yaxis[0]; m[5] = yaxis[1]; m[6] = yaxis[2];
    m[8] = zaxis[0]; m[9] = zaxis[1]; m[10] = zaxis[2];
    invertMatrix(m);
    m[3] = 0; m[7] = 0; m[11] = 0;
    this.origin = origin;
    this.directions = new Array(4);
    this.directions[0] = normalise([-0.7,  0.7, 1]);
    this.directions[1] = normalise([ 0.7,  0.7, 1]);
    this.directions[2] = normalise([ 0.7, -0.7, 1]);
    this.directions[3] = normalise([-0.7, -0.7, 1]);
    this.directions[0] = transformMatrix(m, this.directions[0]);
    this.directions[1] = transformMatrix(m, this.directions[1]);
    this.directions[2] = transformMatrix(m, this.directions[2]);
    this.directions[3] = transformMatrix(m, this.directions[3]);
}

Camera.prototype.generateRayPair = function(y) {
    rays = new Array(new Object(), new Object());
    rays[0].origin = this.origin;
    rays[1].origin = this.origin;
    rays[0].dir = addVector(scale(this.directions[0], y), scale(this.directions[3], 1 - y));
    rays[1].dir = addVector(scale(this.directions[1], y), scale(this.directions[2], 1 - y));
    return rays;
}

function renderRows(camera, scene, pixels, width, height, starty, stopy) {
    for (var y = starty; y < stopy; y++) {
        var rays = camera.generateRayPair(y / height);
        for (var x = 0; x < width; x++) {
            var xp = x / width;
            var origin = addVector(scale(rays[0].origin, xp), scale(rays[1].origin, 1 - xp));
            var dir = normaliseVector(addVector(scale(rays[0].dir, xp), scale(rays[1].dir, 1 - xp)));
            var l = scene.intersect(origin, dir);
            pixels[y][x] = l;
        }
    }
}

Camera.prototype.render = function(scene, pixels, width, height) {
    var cam = this;
    var row = 0;
    renderRows(cam, scene, pixels, width, height, 0, height);
}



function raytraceScene()
{
    var startDate = new Date().getTime();
    var numTriangles = 2 * 6;
    var triangles = new Array();//numTriangles);
    var tfl = createVector(-10,  10, -10);
    var tfr = createVector( 10,  10, -10);
    var tbl = createVector(-10,  10,  10);
    var tbr = createVector( 10,  10,  10);
    var bfl = createVector(-10, -10, -10);
    var bfr = createVector( 10, -10, -10);
    var bbl = createVector(-10, -10,  10);
    var bbr = createVector( 10, -10,  10);
    
    // cube!!!
    // front
    var i = 0;
    
    triangles[i++] = new Triangle(tfl, tfr, bfr);
    triangles[i++] = new Triangle(tfl, bfr, bfl);
    // back
    triangles[i++] = new Triangle(tbl, tbr, bbr);
    triangles[i++] = new Triangle(tbl, bbr, bbl);
    //        triangles[i-1].material = [0.7,0.2,0.2];
    //            triangles[i-1].material.reflection = 0.8;
    // left
    triangles[i++] = new Triangle(tbl, tfl, bbl);
    //            triangles[i-1].reflection = 0.6;
    triangles[i++] = new Triangle(tfl, bfl, bbl);
    //            triangles[i-1].reflection = 0.6;
    // right
    triangles[i++] = new Triangle(tbr, tfr, bbr);
    triangles[i++] = new Triangle(tfr, bfr, bbr);
    // top
    triangles[i++] = new Triangle(tbl, tbr, tfr);
    triangles[i++] = new Triangle(tbl, tfr, tfl);
    // bottom
    triangles[i++] = new Triangle(bbl, bbr, bfr);
    triangles[i++] = new Triangle(bbl, bfr, bfl);
    
    //Floor!!!!
    var green = createVector(0.0, 0.4, 0.0);
    var grey = createVector(0.4, 0.4, 0.4);
    grey.reflection = 1.0;
    var floorShader = function(tri, pos, view) {
        var x = ((pos[0]/32) % 2 + 2) % 2;
        var z = ((pos[2]/32 + 0.3) % 2 + 2) % 2;
        if (x < 1 != z < 1) {
            //in the real world we use the fresnel term...
            //    var angle = 1-dot(view, tri.normal);
            //   angle *= angle;
            //  angle *= angle;
            // angle *= angle;
            //grey.reflection = angle;
            return grey;
        } else 
            return green;
    }
    var ffl = createVector(-1000, -30, -1000);
    var ffr = createVector( 1000, -30, -1000);
    var fbl = createVector(-1000, -30,  1000);
    var fbr = createVector( 1000, -30,  1000);
    triangles[i++] = new Triangle(fbl, fbr, ffr);
    triangles[i-1].shader = floorShader;
    triangles[i++] = new Triangle(fbl, ffr, ffl);
    triangles[i-1].shader = floorShader;
    
    var _scene = new Scene(triangles);
    _scene.lights[0] = createVector(20, 38, -22);
    _scene.lights[0].colour = createVector(0.7, 0.3, 0.3);
    _scene.lights[1] = createVector(-23, 40, 17);
    _scene.lights[1].colour = createVector(0.7, 0.3, 0.3);
    _scene.lights[2] = createVector(23, 20, 17);
    _scene.lights[2].colour = createVector(0.7, 0.7, 0.7);
    _scene.ambient = createVector(0.1, 0.1, 0.1);
    //  _scene.background = createVector(0.7, 0.7, 1.0);
    
    var size = 30;
    var pixels = new Array();
    for (var y = 0; y < size; y++) {
        pixels[y] = new Array();
        for (var x = 0; x < size; x++) {
            pixels[y][x] = 0;
        }
    }

    var _camera = new Camera(createVector(-40, 40, 40), createVector(0, 0, 0), createVector(0, 1, 0));
    _camera.render(_scene, pixels, size, size);

    return pixels;
}

function arrayToCanvasCommands(pixels)
{
    var s = '<canvas id="renderCanvas" width="30px" height="30px"></canvas><scr' + 'ipt>\nvar pixels = [';
    var size = 30;
    for (var y = 0; y < size; y++) {
        s += "[";
        for (var x = 0; x < size; x++) {
            s += "[" + pixels[y][x] + "],";
        }
        s+= "],";
    }
    s += '];\n    var canvas = document.getElementById("renderCanvas").getContext("2d");\n\
\n\
\n\
    var size = 30;\n\
    canvas.fillStyle = "red";\n\
    canvas.fillRect(0, 0, size, size);\n\
    canvas.scale(1, -1);\n\
    canvas.translate(0, -size);\n\
\n\
    if (!canvas.setFillColor)\n\
        canvas.setFillColor = function(r, g, b, a) {\n\
            this.fillStyle = "rgb("+[Math.floor(r * 255), Math.floor(g * 255), Math.floor(b * 255)]+")";\n\
    }\n\
\n\
for (var y = 0; y < size; y++) {\n\
  for (var x = 0; x < size; x++) {\n\
    var l = pixels[y][x];\n\
    canvas.setFillColor(l[0], l[1], l[2], 1);\n\
    canvas.fillRect(x, y, 1, 1);\n\
  }\n\
}</scr' + 'ipt>';

    return s;
}

testOutput = arrayToCanvasCommands(raytraceScene());
/* The Great Computer Language Shootout
   http://shootout.alioth.debian.org/
   contributed by Isaac Gouy */

function TreeNode(left,right,item){
   this.left = left;
   this.right = right;
   this.item = item;
}

TreeNode.prototype.itemCheck = function(){
   if (this.left==null) return this.item;
   else return this.item + this.left.itemCheck() - this.right.itemCheck();
}

function bottomUpTree(item,depth){
   if (depth>0){
      return new TreeNode(
          bottomUpTree(2*item-1, depth-1)
         ,bottomUpTree(2*item, depth-1)
         ,item
      );
   }
   else {
      return new TreeNode(null,null,item);
   }
}

var ret;

for ( var n = 4; n <= 7; n += 1 ) {
    var minDepth = 4;
    var maxDepth = Math.max(minDepth + 2, n);
    var stretchDepth = maxDepth + 1;
    
    var check = bottomUpTree(0,stretchDepth).itemCheck();
    
    var longLivedTree = bottomUpTree(0,maxDepth);
    for (var depth=minDepth; depth<=maxDepth; depth+=2){
        var iterations = 1 << (maxDepth - depth + minDepth);

        check = 0;
        for (var i=1; i<=iterations; i++){
            check += bottomUpTree(i,depth).itemCheck();
            check += bottomUpTree(-i,depth).itemCheck();
        }
    }

    ret = longLivedTree.itemCheck();
}
/* The Great Computer Language Shootout
   http://shootout.alioth.debian.org/
   contributed by Isaac Gouy */

function fannkuch(n) {
   var check = 0;
   var perm = Array(n);
   var perm1 = Array(n);
   var count = Array(n);
   var maxPerm = Array(n);
   var maxFlipsCount = 0;
   var m = n - 1;

   for (var i = 0; i < n; i++) perm1[i] = i;
   var r = n;

   while (true) {
      // write-out the first 30 permutations
      if (check < 30){
         var s = "";
         for(var i=0; i<n; i++) s += (perm1[i]+1).toString();
         check++;
      }

      while (r != 1) { count[r - 1] = r; r--; }
      if (!(perm1[0] == 0 || perm1[m] == m)) {
         for (var i = 0; i < n; i++) perm[i] = perm1[i];

         var flipsCount = 0;
         var k;

         while (!((k = perm[0]) == 0)) {
            var k2 = (k + 1) >> 1;
            for (var i = 0; i < k2; i++) {
               var temp = perm[i]; perm[i] = perm[k - i]; perm[k - i] = temp;
            }
            flipsCount++;
         }

         if (flipsCount > maxFlipsCount) {
            maxFlipsCount = flipsCount;
            for (var i = 0; i < n; i++) maxPerm[i] = perm1[i];
         }
      }

      while (true) {
         if (r == n) return maxFlipsCount;
         var perm0 = perm1[0];
         var i = 0;
         while (i < r) {
            var j = i + 1;
            perm1[i] = perm1[j];
            i = j;
         }
         perm1[r] = perm0;

         count[r] = count[r] - 1;
         if (count[r] > 0) break;
         r++;
      }
   }
}

var n = 8;
var ret = fannkuch(n);

/* The Great Computer Language Shootout
   http://shootout.alioth.debian.org/
   contributed by Isaac Gouy */

var PI = 3.141592653589793;
var SOLAR_MASS = 4 * PI * PI;
var DAYS_PER_YEAR = 365.24;

function Body(x,y,z,vx,vy,vz,mass){
   this.x = x;
   this.y = y;
   this.z = z;
   this.vx = vx;
   this.vy = vy;
   this.vz = vz;
   this.mass = mass;
}

Body.prototype.offsetMomentum = function(px,py,pz) {
   this.vx = -px / SOLAR_MASS;
   this.vy = -py / SOLAR_MASS;
   this.vz = -pz / SOLAR_MASS;
   return this;
}

function Jupiter(){
   return new Body(
      4.84143144246472090e+00,
      -1.16032004402742839e+00,
      -1.03622044471123109e-01,
      1.66007664274403694e-03 * DAYS_PER_YEAR,
      7.69901118419740425e-03 * DAYS_PER_YEAR,
      -6.90460016972063023e-05 * DAYS_PER_YEAR,
      9.54791938424326609e-04 * SOLAR_MASS
   );
}

function Saturn(){
   return new Body(
      8.34336671824457987e+00,
      4.12479856412430479e+00,
      -4.03523417114321381e-01,
      -2.76742510726862411e-03 * DAYS_PER_YEAR,
      4.99852801234917238e-03 * DAYS_PER_YEAR,
      2.30417297573763929e-05 * DAYS_PER_YEAR,
      2.85885980666130812e-04 * SOLAR_MASS
   );
}

function Uranus(){
   return new Body(
      1.28943695621391310e+01,
      -1.51111514016986312e+01,
      -2.23307578892655734e-01,
      2.96460137564761618e-03 * DAYS_PER_YEAR,
      2.37847173959480950e-03 * DAYS_PER_YEAR,
      -2.96589568540237556e-05 * DAYS_PER_YEAR,
      4.36624404335156298e-05 * SOLAR_MASS
   );
}

function Neptune(){
   return new Body(
      1.53796971148509165e+01,
      -2.59193146099879641e+01,
      1.79258772950371181e-01,
      2.68067772490389322e-03 * DAYS_PER_YEAR,
      1.62824170038242295e-03 * DAYS_PER_YEAR,
      -9.51592254519715870e-05 * DAYS_PER_YEAR,
      5.15138902046611451e-05 * SOLAR_MASS
   );
}

function Sun(){
   return new Body(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, SOLAR_MASS);
}


function NBodySystem(bodies){
   this.bodies = bodies;
   var px = 0.0;
   var py = 0.0;
   var pz = 0.0;
   var size = this.bodies.length;
   for (var i=0; i<size; i++){
      var b = this.bodies[i];
      var m = b.mass;
      px += b.vx * m;
      py += b.vy * m;
      pz += b.vz * m;
   }
   this.bodies[0].offsetMomentum(px,py,pz);
}

NBodySystem.prototype.advance = function(dt){
   var dx, dy, dz, distance, mag;
   var size = this.bodies.length;

   for (var i=0; i<size; i++) {
      var bodyi = this.bodies[i];
      for (var j=i+1; j<size; j++) {
         var bodyj = this.bodies[j];
         dx = bodyi.x - bodyj.x;
         dy = bodyi.y - bodyj.y;
         dz = bodyi.z - bodyj.z;

         distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
         mag = dt / (distance * distance * distance);

         bodyi.vx -= dx * bodyj.mass * mag;
         bodyi.vy -= dy * bodyj.mass * mag;
         bodyi.vz -= dz * bodyj.mass * mag;

         bodyj.vx += dx * bodyi.mass * mag;
         bodyj.vy += dy * bodyi.mass * mag;
         bodyj.vz += dz * bodyi.mass * mag;
      }
   }

   for (var i=0; i<size; i++) {
      var body = this.bodies[i];
      body.x += dt * body.vx;
      body.y += dt * body.vy;
      body.z += dt * body.vz;
   }
}

NBodySystem.prototype.energy = function(){
   var dx, dy, dz, distance;
   var e = 0.0;
   var size = this.bodies.length;

   for (var i=0; i<size; i++) {
      var bodyi = this.bodies[i];

      e += 0.5 * bodyi.mass *
         ( bodyi.vx * bodyi.vx
         + bodyi.vy * bodyi.vy
         + bodyi.vz * bodyi.vz );

      for (var j=i+1; j<size; j++) {
         var bodyj = this.bodies[j];
         dx = bodyi.x - bodyj.x;
         dy = bodyi.y - bodyj.y;
         dz = bodyi.z - bodyj.z;

         distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
         e -= (bodyi.mass * bodyj.mass) / distance;
      }
   }
   return e;
}

var ret;

for ( var n = 3; n <= 24; n *= 2 ) {
    (function(){
        var bodies = new NBodySystem( Array(
           Sun(),Jupiter(),Saturn(),Uranus(),Neptune()
        ));
        var max = n * 100;
        
        ret = bodies.energy();
        for (var i=0; i<max; i++){
            bodies.advance(0.01);
        }
        ret = bodies.energy();
    })();
}
// The Great Computer Language Shootout
// http://shootout.alioth.debian.org/
//
// modified by Isaac Gouy

function pad(number,width){
   var s = number.toString();
   var prefixWidth = width - s.length;
   if (prefixWidth>0){
      for (var i=1; i<=prefixWidth; i++) s = " " + s;
   }
   return s;
}

function nsieve(m, isPrime){
   var i, k, count;

   for (i=2; i<=m; i++) { isPrime[i] = true; }
   count = 0;

   for (i=2; i<=m; i++){
      if (isPrime[i]) {
         for (k=i+i; k<=m; k+=i) isPrime[k] = false;
         count++;
      }
   }
   return count;
}

function sieve() {
    for (var i = 1; i <= 3; i++ ) {
        var m = (1<<i)*10000;
        var flags = Array(m+1);
        nsieve(m, flags);
    }
}

sieve();
// Copyright (c) 2004 by Arthur Langereis (arthur_ext at domain xfinitegames, tld com

// 1 op = 6 ANDs, 3 SHRs, 3 SHLs, 4 assigns, 2 ADDs
// O(1)
function fast3bitlookup(b) {
var c, bi3b = 0xE994; // 0b1110 1001 1001 0100; // 3 2 2 1  2 1 1 0
c  = 3 & (bi3b >> ((b << 1) & 14));
c += 3 & (bi3b >> ((b >> 2) & 14));
c += 3 & (bi3b >> ((b >> 5) & 6));
return c;

/*
lir4,0xE994; 9 instructions, no memory access, minimal register dependence, 6 shifts, 2 adds, 1 inline assign
rlwinmr5,r3,1,28,30
rlwinmr6,r3,30,28,30
rlwinmr7,r3,27,29,30
rlwnmr8,r4,r5,30,31
rlwnmr9,r4,r6,30,31
rlwnmr10,r4,r7,30,31
addr3,r8,r9
addr3,r3,r10
*/
}


function TimeFunc(func) {
var x, y, t;
for(var x=0; x<500; x++)
for(var y=0; y<256; y++) func(y);
}

TimeFunc(fast3bitlookup);
// Copyright (c) 2004 by Arthur Langereis (arthur_ext at domain xfinitegames, tld com)


// 1 op = 2 assigns, 16 compare/branches, 8 ANDs, (0-8) ADDs, 8 SHLs
// O(n)
function bitsinbyte(b) {
var m = 1, c = 0;
while(m<0x100) {
if(b & m) c++;
m <<= 1;
}
return c;
}

function TimeFunc(func) {
var x, y, t;
for(var x=0; x<350; x++)
for(var y=0; y<256; y++) func(y);
}

TimeFunc(bitsinbyte);
/*
 * Copyright (C) 2007 Apple Inc.  All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE COMPUTER, INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE COMPUTER, INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. 
 */

bitwiseAndValue = 4294967296;
for (var i = 0; i < 600000; i++)
    bitwiseAndValue = bitwiseAndValue & i;
// The Great Computer Language Shootout
//  http://shootout.alioth.debian.org
//
//  Contributed by Ian Osgood

function pad(n,width) {
  var s = n.toString();
  while (s.length < width) s = ' ' + s;
  return s;
}

function primes(isPrime, n) {
  var i, count = 0, m = 10000<<n, size = m+31>>5;

  for (i=0; i<size; i++) isPrime[i] = 0xffffffff;

  for (i=2; i<m; i++)
    if (isPrime[i>>5] & 1<<(i&31)) {
      for (var j=i+i; j<m; j+=i)
        isPrime[j>>5] &= ~(1<<(j&31));
      count++;
    }
}

function sieve() {
    for (var i = 4; i <= 4; i++) {
        var isPrime = new Array((10000<<i)+31>>5);
        primes(isPrime, i);
    }
}

sieve();
// The Computer Language Shootout
// http://shootout.alioth.debian.org/
// contributed by Isaac Gouy

function ack(m,n){
   if (m==0) { return n+1; }
   if (n==0) { return ack(m-1,1); }
   return ack(m-1, ack(m,n-1) );
}

function fib(n) {
    if (n < 2){ return 1; }
    return fib(n-2) + fib(n-1);
}

function tak(x,y,z) {
    if (y >= x) return z;
    return tak(tak(x-1,y,z), tak(y-1,z,x), tak(z-1,x,y));
}

for ( var i = 3; i <= 5; i++ ) {
    ack(3,i);
    fib(17.0+i);
    tak(3*i+3,2*i+2,i+1);
}
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

/*
 * AES Cipher function: encrypt 'input' with Rijndael algorithm
 *
 *   takes   byte-array 'input' (16 bytes)
 *           2D byte-array key schedule 'w' (Nr+1 x Nb bytes)
 *
 *   applies Nr rounds (10/12/14) using key schedule w for 'add round key' stage
 *
 *   returns byte-array encrypted value (16 bytes)
 */
function Cipher(input, w) {    // main Cipher function [??5.1]
  var Nb = 4;               // block size (in words): no of columns in state (fixed at 4 for AES)
  var Nr = w.length/Nb - 1; // no of rounds: 10/12/14 for 128/192/256-bit keys

  var state = [[],[],[],[]];  // initialise 4xNb byte-array 'state' with input [??3.4]
  for (var i=0; i<4*Nb; i++) state[i%4][Math.floor(i/4)] = input[i];

  state = AddRoundKey(state, w, 0, Nb);

  for (var round=1; round<Nr; round++) {
    state = SubBytes(state, Nb);
    state = ShiftRows(state, Nb);
    state = MixColumns(state, Nb);
    state = AddRoundKey(state, w, round, Nb);
  }

  state = SubBytes(state, Nb);
  state = ShiftRows(state, Nb);
  state = AddRoundKey(state, w, Nr, Nb);

  var output = new Array(4*Nb);  // convert state to 1-d array before returning [??3.4]
  for (var i=0; i<4*Nb; i++) output[i] = state[i%4][Math.floor(i/4)];
  return output;
}


function SubBytes(s, Nb) {    // apply SBox to state S [??5.1.1]
  for (var r=0; r<4; r++) {
    for (var c=0; c<Nb; c++) s[r][c] = Sbox[s[r][c]];
  }
  return s;
}


function ShiftRows(s, Nb) {    // shift row r of state S left by r bytes [??5.1.2]
  var t = new Array(4);
  for (var r=1; r<4; r++) {
    for (var c=0; c<4; c++) t[c] = s[r][(c+r)%Nb];  // shift into temp copy
    for (var c=0; c<4; c++) s[r][c] = t[c];         // and copy back
  }          // note that this will work for Nb=4,5,6, but not 7,8 (always 4 for AES):
  return s;  // see fp.gladman.plus.com/cryptography_technology/rijndael/aes.spec.311.pdf 
}


function MixColumns(s, Nb) {   // combine bytes of each col of state S [??5.1.3]
  for (var c=0; c<4; c++) {
    var a = new Array(4);  // 'a' is a copy of the current column from 's'
    var b = new Array(4);  // 'b' is a???{02} in GF(2^8)
    for (var i=0; i<4; i++) {
      a[i] = s[i][c];
      b[i] = s[i][c]&0x80 ? s[i][c]<<1 ^ 0x011b : s[i][c]<<1;
    }
    // a[n] ^ b[n] is a???{03} in GF(2^8)
    s[0][c] = b[0] ^ a[1] ^ b[1] ^ a[2] ^ a[3]; // 2*a0 + 3*a1 + a2 + a3
    s[1][c] = a[0] ^ b[1] ^ a[2] ^ b[2] ^ a[3]; // a0 * 2*a1 + 3*a2 + a3
    s[2][c] = a[0] ^ a[1] ^ b[2] ^ a[3] ^ b[3]; // a0 + a1 + 2*a2 + 3*a3
    s[3][c] = a[0] ^ b[0] ^ a[1] ^ a[2] ^ b[3]; // 3*a0 + a1 + a2 + 2*a3
  }
  return s;
}


function AddRoundKey(state, w, rnd, Nb) {  // xor Round Key into state S [??5.1.4]
  for (var r=0; r<4; r++) {
    for (var c=0; c<Nb; c++) state[r][c] ^= w[rnd*4+c][r];
  }
  return state;
}


function KeyExpansion(key) {  // generate Key Schedule (byte-array Nr+1 x Nb) from Key [??5.2]
  var Nb = 4;            // block size (in words): no of columns in state (fixed at 4 for AES)
  var Nk = key.length/4  // key length (in words): 4/6/8 for 128/192/256-bit keys
  var Nr = Nk + 6;       // no of rounds: 10/12/14 for 128/192/256-bit keys

  var w = new Array(Nb*(Nr+1));
  var temp = new Array(4);

  for (var i=0; i<Nk; i++) {
    var r = [key[4*i], key[4*i+1], key[4*i+2], key[4*i+3]];
    w[i] = r;
  }

  for (var i=Nk; i<(Nb*(Nr+1)); i++) {
    w[i] = new Array(4);
    for (var t=0; t<4; t++) temp[t] = w[i-1][t];
    if (i % Nk == 0) {
      temp = SubWord(RotWord(temp));
      for (var t=0; t<4; t++) temp[t] ^= Rcon[i/Nk][t];
    } else if (Nk > 6 && i%Nk == 4) {
      temp = SubWord(temp);
    }
    for (var t=0; t<4; t++) w[i][t] = w[i-Nk][t] ^ temp[t];
  }

  return w;
}

function SubWord(w) {    // apply SBox to 4-byte word w
  for (var i=0; i<4; i++) w[i] = Sbox[w[i]];
  return w;
}

function RotWord(w) {    // rotate 4-byte word w left by one byte
  w[4] = w[0];
  for (var i=0; i<4; i++) w[i] = w[i+1];
  return w;
}


// Sbox is pre-computed multiplicative inverse in GF(2^8) used in SubBytes and KeyExpansion [??5.1.1]
var Sbox =  [0x63,0x7c,0x77,0x7b,0xf2,0x6b,0x6f,0xc5,0x30,0x01,0x67,0x2b,0xfe,0xd7,0xab,0x76,
             0xca,0x82,0xc9,0x7d,0xfa,0x59,0x47,0xf0,0xad,0xd4,0xa2,0xaf,0x9c,0xa4,0x72,0xc0,
             0xb7,0xfd,0x93,0x26,0x36,0x3f,0xf7,0xcc,0x34,0xa5,0xe5,0xf1,0x71,0xd8,0x31,0x15,
             0x04,0xc7,0x23,0xc3,0x18,0x96,0x05,0x9a,0x07,0x12,0x80,0xe2,0xeb,0x27,0xb2,0x75,
             0x09,0x83,0x2c,0x1a,0x1b,0x6e,0x5a,0xa0,0x52,0x3b,0xd6,0xb3,0x29,0xe3,0x2f,0x84,
             0x53,0xd1,0x00,0xed,0x20,0xfc,0xb1,0x5b,0x6a,0xcb,0xbe,0x39,0x4a,0x4c,0x58,0xcf,
             0xd0,0xef,0xaa,0xfb,0x43,0x4d,0x33,0x85,0x45,0xf9,0x02,0x7f,0x50,0x3c,0x9f,0xa8,
             0x51,0xa3,0x40,0x8f,0x92,0x9d,0x38,0xf5,0xbc,0xb6,0xda,0x21,0x10,0xff,0xf3,0xd2,
             0xcd,0x0c,0x13,0xec,0x5f,0x97,0x44,0x17,0xc4,0xa7,0x7e,0x3d,0x64,0x5d,0x19,0x73,
             0x60,0x81,0x4f,0xdc,0x22,0x2a,0x90,0x88,0x46,0xee,0xb8,0x14,0xde,0x5e,0x0b,0xdb,
             0xe0,0x32,0x3a,0x0a,0x49,0x06,0x24,0x5c,0xc2,0xd3,0xac,0x62,0x91,0x95,0xe4,0x79,
             0xe7,0xc8,0x37,0x6d,0x8d,0xd5,0x4e,0xa9,0x6c,0x56,0xf4,0xea,0x65,0x7a,0xae,0x08,
             0xba,0x78,0x25,0x2e,0x1c,0xa6,0xb4,0xc6,0xe8,0xdd,0x74,0x1f,0x4b,0xbd,0x8b,0x8a,
             0x70,0x3e,0xb5,0x66,0x48,0x03,0xf6,0x0e,0x61,0x35,0x57,0xb9,0x86,0xc1,0x1d,0x9e,
             0xe1,0xf8,0x98,0x11,0x69,0xd9,0x8e,0x94,0x9b,0x1e,0x87,0xe9,0xce,0x55,0x28,0xdf,
             0x8c,0xa1,0x89,0x0d,0xbf,0xe6,0x42,0x68,0x41,0x99,0x2d,0x0f,0xb0,0x54,0xbb,0x16];

// Rcon is Round Constant used for the Key Expansion [1st col is 2^(r-1) in GF(2^8)] [??5.2]
var Rcon = [ [0x00, 0x00, 0x00, 0x00],
             [0x01, 0x00, 0x00, 0x00],
             [0x02, 0x00, 0x00, 0x00],
             [0x04, 0x00, 0x00, 0x00],
             [0x08, 0x00, 0x00, 0x00],
             [0x10, 0x00, 0x00, 0x00],
             [0x20, 0x00, 0x00, 0x00],
             [0x40, 0x00, 0x00, 0x00],
             [0x80, 0x00, 0x00, 0x00],
             [0x1b, 0x00, 0x00, 0x00],
             [0x36, 0x00, 0x00, 0x00] ]; 


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

/* 
 * Use AES to encrypt 'plaintext' with 'password' using 'nBits' key, in 'Counter' mode of operation
 *                           - see http://csrc.nist.gov/publications/nistpubs/800-38a/sp800-38a.pdf
 *   for each block
 *   - outputblock = cipher(counter, key)
 *   - cipherblock = plaintext xor outputblock
 */
function AESEncryptCtr(plaintext, password, nBits) {
  if (!(nBits==128 || nBits==192 || nBits==256)) return '';  // standard allows 128/192/256 bit keys

  // for this example script, generate the key by applying Cipher to 1st 16/24/32 chars of password; 
  // for real-world applications, a more secure approach would be to hash the password e.g. with SHA-1
  var nBytes = nBits/8;  // no bytes in key
  var pwBytes = new Array(nBytes);
  for (var i=0; i<nBytes; i++) pwBytes[i] = password.charCodeAt(i) & 0xff;
  var key = Cipher(pwBytes, KeyExpansion(pwBytes));
  key = key.concat(key.slice(0, nBytes-16));  // key is now 16/24/32 bytes long

  // initialise counter block (NIST SP800-38A ??B.2): millisecond time-stamp for nonce in 1st 8 bytes,
  // block counter in 2nd 8 bytes
  var blockSize = 16;  // block size fixed at 16 bytes / 128 bits (Nb=4) for AES
  var counterBlock = new Array(blockSize);  // block size fixed at 16 bytes / 128 bits (Nb=4) for AES
  var nonce = (new Date()).getTime();  // milliseconds since 1-Jan-1970

  // encode nonce in two stages to cater for JavaScript 32-bit limit on bitwise ops
  for (var i=0; i<4; i++) counterBlock[i] = (nonce >>> i*8) & 0xff;
  for (var i=0; i<4; i++) counterBlock[i+4] = (nonce/0x100000000 >>> i*8) & 0xff; 

  // generate key schedule - an expansion of the key into distinct Key Rounds for each round
  var keySchedule = KeyExpansion(key);

  var blockCount = Math.ceil(plaintext.length/blockSize);
  var ciphertext = new Array(blockCount);  // ciphertext as array of strings
  
  for (var b=0; b<blockCount; b++) {
    // set counter (block #) in last 8 bytes of counter block (leaving nonce in 1st 8 bytes)
    // again done in two stages for 32-bit ops
    for (var c=0; c<4; c++) counterBlock[15-c] = (b >>> c*8) & 0xff;
    for (var c=0; c<4; c++) counterBlock[15-c-4] = (b/0x100000000 >>> c*8)

    var cipherCntr = Cipher(counterBlock, keySchedule);  // -- encrypt counter block --
    
    // calculate length of final block:
    var blockLength = b<blockCount-1 ? blockSize : (plaintext.length-1)%blockSize+1;

    var ct = '';
    for (var i=0; i<blockLength; i++) {  // -- xor plaintext with ciphered counter byte-by-byte --
      var plaintextByte = plaintext.charCodeAt(b*blockSize+i);
      var cipherByte = plaintextByte ^ cipherCntr[i];
      ct += String.fromCharCode(cipherByte);
    }
    // ct is now ciphertext for this block

    ciphertext[b] = escCtrlChars(ct);  // escape troublesome characters in ciphertext
  }

  // convert the nonce to a string to go on the front of the ciphertext
  var ctrTxt = '';
  for (var i=0; i<8; i++) ctrTxt += String.fromCharCode(counterBlock[i]);
  ctrTxt = escCtrlChars(ctrTxt);

  // use '-' to separate blocks, use Array.join to concatenate arrays of strings for efficiency
  return ctrTxt + '-' + ciphertext.join('-');
}


/* 
 * Use AES to decrypt 'ciphertext' with 'password' using 'nBits' key, in Counter mode of operation
 *
 *   for each block
 *   - outputblock = cipher(counter, key)
 *   - cipherblock = plaintext xor outputblock
 */
function AESDecryptCtr(ciphertext, password, nBits) {
  if (!(nBits==128 || nBits==192 || nBits==256)) return '';  // standard allows 128/192/256 bit keys

  var nBytes = nBits/8;  // no bytes in key
  var pwBytes = new Array(nBytes);
  for (var i=0; i<nBytes; i++) pwBytes[i] = password.charCodeAt(i) & 0xff;
  var pwKeySchedule = KeyExpansion(pwBytes);
  var key = Cipher(pwBytes, pwKeySchedule);
  key = key.concat(key.slice(0, nBytes-16));  // key is now 16/24/32 bytes long

  var keySchedule = KeyExpansion(key);

  ciphertext = ciphertext.split('-');  // split ciphertext into array of block-length strings 

  // recover nonce from 1st element of ciphertext
  var blockSize = 16;  // block size fixed at 16 bytes / 128 bits (Nb=4) for AES
  var counterBlock = new Array(blockSize);
  var ctrTxt = unescCtrlChars(ciphertext[0]);
  for (var i=0; i<8; i++) counterBlock[i] = ctrTxt.charCodeAt(i);

  var plaintext = new Array(ciphertext.length-1);

  for (var b=1; b<ciphertext.length; b++) {
    // set counter (block #) in last 8 bytes of counter block (leaving nonce in 1st 8 bytes)
    for (var c=0; c<4; c++) counterBlock[15-c] = ((b-1) >>> c*8) & 0xff;
    for (var c=0; c<4; c++) counterBlock[15-c-4] = ((b/0x100000000-1) >>> c*8) & 0xff;

    var cipherCntr = Cipher(counterBlock, keySchedule);  // encrypt counter block

    ciphertext[b] = unescCtrlChars(ciphertext[b]);

    var pt = '';
    for (var i=0; i<ciphertext[b].length; i++) {
      // -- xor plaintext with ciphered counter byte-by-byte --
      var ciphertextByte = ciphertext[b].charCodeAt(i);
      var plaintextByte = ciphertextByte ^ cipherCntr[i];
      pt += String.fromCharCode(plaintextByte);
    }
    // pt is now plaintext for this block

    plaintext[b-1] = pt;  // b-1 'cos no initial nonce block in plaintext
  }

  return plaintext.join('');
}

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

function escCtrlChars(str) {  // escape control chars which might cause problems handling ciphertext
  return str.replace(/[\0\t\n\v\f\r\xa0'"!-]/g, function(c) { return '!' + c.charCodeAt(0) + '!'; });
}  // \xa0 to cater for bug in Firefox; include '-' to leave it free for use as a block marker

function unescCtrlChars(str) {  // unescape potentially problematic control characters
  return str.replace(/!\d\d?\d?!/g, function(c) { return String.fromCharCode(c.slice(1,-1)); });
}
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

/*
 * if escCtrlChars()/unescCtrlChars() still gives problems, use encodeBase64()/decodeBase64() instead
 */
var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

function encodeBase64(str) {  // http://tools.ietf.org/html/rfc4648
   var o1, o2, o3, h1, h2, h3, h4, bits, i=0, enc='';
   
   str = encodeUTF8(str);  // encode multi-byte chars into UTF-8 for byte-array

   do {  // pack three octets into four hexets
      o1 = str.charCodeAt(i++);
      o2 = str.charCodeAt(i++);
      o3 = str.charCodeAt(i++);
      
      bits = o1<<16 | o2<<8 | o3;
      
      h1 = bits>>18 & 0x3f;
      h2 = bits>>12 & 0x3f;
      h3 = bits>>6 & 0x3f;
      h4 = bits & 0x3f;
      
      // end of string? index to '=' in b64
      if (isNaN(o3)) h4 = 64;
      if (isNaN(o2)) h3 = 64;
      
      // use hexets to index into b64, and append result to encoded string
      enc += b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
   } while (i < str.length);
   
   return enc;
}

function decodeBase64(str) {
   var o1, o2, o3, h1, h2, h3, h4, bits, i=0, enc='';

   do {  // unpack four hexets into three octets using index points in b64
      h1 = b64.indexOf(str.charAt(i++));
      h2 = b64.indexOf(str.charAt(i++));
      h3 = b64.indexOf(str.charAt(i++));
      h4 = b64.indexOf(str.charAt(i++));
      
      bits = h1<<18 | h2<<12 | h3<<6 | h4;
      
      o1 = bits>>16 & 0xff;
      o2 = bits>>8 & 0xff;
      o3 = bits & 0xff;
      
      if (h3 == 64)      enc += String.fromCharCode(o1);
      else if (h4 == 64) enc += String.fromCharCode(o1, o2);
      else               enc += String.fromCharCode(o1, o2, o3);
   } while (i < str.length);

   return decodeUTF8(enc);  // decode UTF-8 byte-array back to Unicode
}

function encodeUTF8(str) {  // encode multi-byte string into utf-8 multiple single-byte characters 
  str = str.replace(
      /[\u0080-\u07ff]/g,  // U+0080 - U+07FF = 2-byte chars
      function(c) { 
        var cc = c.charCodeAt(0);
        return String.fromCharCode(0xc0 | cc>>6, 0x80 | cc&0x3f); }
    );
  str = str.replace(
      /[\u0800-\uffff]/g,  // U+0800 - U+FFFF = 3-byte chars
      function(c) { 
        var cc = c.charCodeAt(0); 
        return String.fromCharCode(0xe0 | cc>>12, 0x80 | cc>>6&0x3F, 0x80 | cc&0x3f); }
    );
  return str;
}

function decodeUTF8(str) {  // decode utf-8 encoded string back into multi-byte characters
  str = str.replace(
      /[\u00c0-\u00df][\u0080-\u00bf]/g,                 // 2-byte chars
      function(c) { 
        var cc = (c.charCodeAt(0)&0x1f)<<6 | c.charCodeAt(1)&0x3f;
        return String.fromCharCode(cc); }
    );
  str = str.replace(
      /[\u00e0-\u00ef][\u0080-\u00bf][\u0080-\u00bf]/g,  // 3-byte chars
      function(c) { 
        var cc = (c.charCodeAt(0)&0x0f)<<12 | (c.charCodeAt(1)&0x3f<<6) | c.charCodeAt(2)&0x3f; 
        return String.fromCharCode(cc); }
    );
  return str;
}


function byteArrayToHexStr(b) {  // convert byte array to hex string for displaying test vectors
  var s = '';
  for (var i=0; i<b.length; i++) s += b[i].toString(16) + ' ';
  return s;
}

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */


var plainText = "ROMEO: But, soft! what light through yonder window breaks?\n\
It is the east, and Juliet is the sun.\n\
Arise, fair sun, and kill the envious moon,\n\
Who is already sick and pale with grief,\n\
That thou her maid art far more fair than she:\n\
Be not her maid, since she is envious;\n\
Her vestal livery is but sick and green\n\
And none but fools do wear it; cast it off.\n\
It is my lady, O, it is my love!\n\
O, that she knew she were!\n\
She speaks yet she says nothing: what of that?\n\
Her eye discourses; I will answer it.\n\
I am too bold, 'tis not to me she speaks:\n\
Two of the fairest stars in all the heaven,\n\
Having some business, do entreat her eyes\n\
To twinkle in their spheres till they return.\n\
What if her eyes were there, they in her head?\n\
The brightness of her cheek would shame those stars,\n\
As daylight doth a lamp; her eyes in heaven\n\
Would through the airy region stream so bright\n\
That birds would sing and think it were not night.\n\
See, how she leans her cheek upon her hand!\n\
O, that I were a glove upon that hand,\n\
That I might touch that cheek!\n\
JULIET: Ay me!\n\
ROMEO: She speaks:\n\
O, speak again, bright angel! for thou art\n\
As glorious to this night, being o'er my head\n\
As is a winged messenger of heaven\n\
Unto the white-upturned wondering eyes\n\
Of mortals that fall back to gaze on him\n\
When he bestrides the lazy-pacing clouds\n\
And sails upon the bosom of the air.";

var password = "O Romeo, Romeo! wherefore art thou Romeo?";

var cipherText = AESEncryptCtr(plainText, password, 256);
var decryptedText = AESDecryptCtr(cipherText, password, 256);
/*
 * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
 * Digest Algorithm, as defined in RFC 1321.
 * Version 2.1 Copyright (C) Paul Johnston 1999 - 2002.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for more info.
 */

/*
 * Configurable variables. You may need to tweak these to be compatible with
 * the server-side, but the defaults work in most cases.
 */
var hexcase = 0;  /* hex output format. 0 - lowercase; 1 - uppercase        */
var b64pad  = ""; /* base-64 pad character. "=" for strict RFC compliance   */
var chrsz   = 8;  /* bits per input character. 8 - ASCII; 16 - Unicode      */

/*
 * These are the functions you'll usually want to call
 * They take string arguments and return either hex or base-64 encoded strings
 */
function hex_md5(s){ return binl2hex(core_md5(str2binl(s), s.length * chrsz));}
function b64_md5(s){ return binl2b64(core_md5(str2binl(s), s.length * chrsz));}
function str_md5(s){ return binl2str(core_md5(str2binl(s), s.length * chrsz));}
function hex_hmac_md5(key, data) { return binl2hex(core_hmac_md5(key, data)); }
function b64_hmac_md5(key, data) { return binl2b64(core_hmac_md5(key, data)); }
function str_hmac_md5(key, data) { return binl2str(core_hmac_md5(key, data)); }

/*
 * Perform a simple self-test to see if the VM is working
 */
function md5_vm_test()
{
  return hex_md5("abc") == "900150983cd24fb0d6963f7d28e17f72";
}

/*
 * Calculate the MD5 of an array of little-endian words, and a bit length
 */
function core_md5(x, len)
{
  /* append padding */
  x[len >> 5] |= 0x80 << ((len) % 32);
  x[(((len + 64) >>> 9) << 4) + 14] = len;

  var a =  1732584193;
  var b = -271733879;
  var c = -1732584194;
  var d =  271733878;

  for(var i = 0; i < x.length; i += 16)
  {
    var olda = a;
    var oldb = b;
    var oldc = c;
    var oldd = d;

    a = md5_ff(a, b, c, d, x[i+ 0], 7 , -680876936);
    d = md5_ff(d, a, b, c, x[i+ 1], 12, -389564586);
    c = md5_ff(c, d, a, b, x[i+ 2], 17,  606105819);
    b = md5_ff(b, c, d, a, x[i+ 3], 22, -1044525330);
    a = md5_ff(a, b, c, d, x[i+ 4], 7 , -176418897);
    d = md5_ff(d, a, b, c, x[i+ 5], 12,  1200080426);
    c = md5_ff(c, d, a, b, x[i+ 6], 17, -1473231341);
    b = md5_ff(b, c, d, a, x[i+ 7], 22, -45705983);
    a = md5_ff(a, b, c, d, x[i+ 8], 7 ,  1770035416);
    d = md5_ff(d, a, b, c, x[i+ 9], 12, -1958414417);
    c = md5_ff(c, d, a, b, x[i+10], 17, -42063);
    b = md5_ff(b, c, d, a, x[i+11], 22, -1990404162);
    a = md5_ff(a, b, c, d, x[i+12], 7 ,  1804603682);
    d = md5_ff(d, a, b, c, x[i+13], 12, -40341101);
    c = md5_ff(c, d, a, b, x[i+14], 17, -1502002290);
    b = md5_ff(b, c, d, a, x[i+15], 22,  1236535329);

    a = md5_gg(a, b, c, d, x[i+ 1], 5 , -165796510);
    d = md5_gg(d, a, b, c, x[i+ 6], 9 , -1069501632);
    c = md5_gg(c, d, a, b, x[i+11], 14,  643717713);
    b = md5_gg(b, c, d, a, x[i+ 0], 20, -373897302);
    a = md5_gg(a, b, c, d, x[i+ 5], 5 , -701558691);
    d = md5_gg(d, a, b, c, x[i+10], 9 ,  38016083);
    c = md5_gg(c, d, a, b, x[i+15], 14, -660478335);
    b = md5_gg(b, c, d, a, x[i+ 4], 20, -405537848);
    a = md5_gg(a, b, c, d, x[i+ 9], 5 ,  568446438);
    d = md5_gg(d, a, b, c, x[i+14], 9 , -1019803690);
    c = md5_gg(c, d, a, b, x[i+ 3], 14, -187363961);
    b = md5_gg(b, c, d, a, x[i+ 8], 20,  1163531501);
    a = md5_gg(a, b, c, d, x[i+13], 5 , -1444681467);
    d = md5_gg(d, a, b, c, x[i+ 2], 9 , -51403784);
    c = md5_gg(c, d, a, b, x[i+ 7], 14,  1735328473);
    b = md5_gg(b, c, d, a, x[i+12], 20, -1926607734);

    a = md5_hh(a, b, c, d, x[i+ 5], 4 , -378558);
    d = md5_hh(d, a, b, c, x[i+ 8], 11, -2022574463);
    c = md5_hh(c, d, a, b, x[i+11], 16,  1839030562);
    b = md5_hh(b, c, d, a, x[i+14], 23, -35309556);
    a = md5_hh(a, b, c, d, x[i+ 1], 4 , -1530992060);
    d = md5_hh(d, a, b, c, x[i+ 4], 11,  1272893353);
    c = md5_hh(c, d, a, b, x[i+ 7], 16, -155497632);
    b = md5_hh(b, c, d, a, x[i+10], 23, -1094730640);
    a = md5_hh(a, b, c, d, x[i+13], 4 ,  681279174);
    d = md5_hh(d, a, b, c, x[i+ 0], 11, -358537222);
    c = md5_hh(c, d, a, b, x[i+ 3], 16, -722521979);
    b = md5_hh(b, c, d, a, x[i+ 6], 23,  76029189);
    a = md5_hh(a, b, c, d, x[i+ 9], 4 , -640364487);
    d = md5_hh(d, a, b, c, x[i+12], 11, -421815835);
    c = md5_hh(c, d, a, b, x[i+15], 16,  530742520);
    b = md5_hh(b, c, d, a, x[i+ 2], 23, -995338651);

    a = md5_ii(a, b, c, d, x[i+ 0], 6 , -198630844);
    d = md5_ii(d, a, b, c, x[i+ 7], 10,  1126891415);
    c = md5_ii(c, d, a, b, x[i+14], 15, -1416354905);
    b = md5_ii(b, c, d, a, x[i+ 5], 21, -57434055);
    a = md5_ii(a, b, c, d, x[i+12], 6 ,  1700485571);
    d = md5_ii(d, a, b, c, x[i+ 3], 10, -1894986606);
    c = md5_ii(c, d, a, b, x[i+10], 15, -1051523);
    b = md5_ii(b, c, d, a, x[i+ 1], 21, -2054922799);
    a = md5_ii(a, b, c, d, x[i+ 8], 6 ,  1873313359);
    d = md5_ii(d, a, b, c, x[i+15], 10, -30611744);
    c = md5_ii(c, d, a, b, x[i+ 6], 15, -1560198380);
    b = md5_ii(b, c, d, a, x[i+13], 21,  1309151649);
    a = md5_ii(a, b, c, d, x[i+ 4], 6 , -145523070);
    d = md5_ii(d, a, b, c, x[i+11], 10, -1120210379);
    c = md5_ii(c, d, a, b, x[i+ 2], 15,  718787259);
    b = md5_ii(b, c, d, a, x[i+ 9], 21, -343485551);

    a = safe_add(a, olda);
    b = safe_add(b, oldb);
    c = safe_add(c, oldc);
    d = safe_add(d, oldd);
  }
  return Array(a, b, c, d);

}

/*
 * These functions implement the four basic operations the algorithm uses.
 */
function md5_cmn(q, a, b, x, s, t)
{
  return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s),b);
}
function md5_ff(a, b, c, d, x, s, t)
{
  return md5_cmn((b & c) | ((~b) & d), a, b, x, s, t);
}
function md5_gg(a, b, c, d, x, s, t)
{
  return md5_cmn((b & d) | (c & (~d)), a, b, x, s, t);
}
function md5_hh(a, b, c, d, x, s, t)
{
  return md5_cmn(b ^ c ^ d, a, b, x, s, t);
}
function md5_ii(a, b, c, d, x, s, t)
{
  return md5_cmn(c ^ (b | (~d)), a, b, x, s, t);
}

/*
 * Calculate the HMAC-MD5, of a key and some data
 */
function core_hmac_md5(key, data)
{
  var bkey = str2binl(key);
  if(bkey.length > 16) bkey = core_md5(bkey, key.length * chrsz);

  var ipad = Array(16), opad = Array(16);
  for(var i = 0; i < 16; i++)
  {
    ipad[i] = bkey[i] ^ 0x36363636;
    opad[i] = bkey[i] ^ 0x5C5C5C5C;
  }

  var hash = core_md5(ipad.concat(str2binl(data)), 512 + data.length * chrsz);
  return core_md5(opad.concat(hash), 512 + 128);
}

/*
 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
 * to work around bugs in some JS interpreters.
 */
function safe_add(x, y)
{
  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xFFFF);
}

/*
 * Bitwise rotate a 32-bit number to the left.
 */
function bit_rol(num, cnt)
{
  return (num << cnt) | (num >>> (32 - cnt));
}

/*
 * Convert a string to an array of little-endian words
 * If chrsz is ASCII, characters >255 have their hi-byte silently ignored.
 */
function str2binl(str)
{
  var bin = Array();
  var mask = (1 << chrsz) - 1;
  for(var i = 0; i < str.length * chrsz; i += chrsz)
    bin[i>>5] |= (str.charCodeAt(i / chrsz) & mask) << (i%32);
  return bin;
}

/*
 * Convert an array of little-endian words to a string
 */
function binl2str(bin)
{
  var str = "";
  var mask = (1 << chrsz) - 1;
  for(var i = 0; i < bin.length * 32; i += chrsz)
    str += String.fromCharCode((bin[i>>5] >>> (i % 32)) & mask);
  return str;
}

/*
 * Convert an array of little-endian words to a hex string.
 */
function binl2hex(binarray)
{
  var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
  var str = "";
  for(var i = 0; i < binarray.length * 4; i++)
  {
    str += hex_tab.charAt((binarray[i>>2] >> ((i%4)*8+4)) & 0xF) +
           hex_tab.charAt((binarray[i>>2] >> ((i%4)*8  )) & 0xF);
  }
  return str;
}

/*
 * Convert an array of little-endian words to a base-64 string
 */
function binl2b64(binarray)
{
  var tab = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var str = "";
  for(var i = 0; i < binarray.length * 4; i += 3)
  {
    var triplet = (((binarray[i   >> 2] >> 8 * ( i   %4)) & 0xFF) << 16)
                | (((binarray[i+1 >> 2] >> 8 * ((i+1)%4)) & 0xFF) << 8 )
                |  ((binarray[i+2 >> 2] >> 8 * ((i+2)%4)) & 0xFF);
    for(var j = 0; j < 4; j++)
    {
      if(i * 8 + j * 6 > binarray.length * 32) str += b64pad;
      else str += tab.charAt((triplet >> 6*(3-j)) & 0x3F);
    }
  }
  return str;
}

var plainText = "Rebellious subjects, enemies to peace,\n\
Profaners of this neighbour-stained steel,--\n\
Will they not hear? What, ho! you men, you beasts,\n\
That quench the fire of your pernicious rage\n\
With purple fountains issuing from your veins,\n\
On pain of torture, from those bloody hands\n\
Throw your mistemper'd weapons to the ground,\n\
And hear the sentence of your moved prince.\n\
Three civil brawls, bred of an airy word,\n\
By thee, old Capulet, and Montague,\n\
Have thrice disturb'd the quiet of our streets,\n\
And made Verona's ancient citizens\n\
Cast by their grave beseeming ornaments,\n\
To wield old partisans, in hands as old,\n\
Canker'd with peace, to part your canker'd hate:\n\
If ever you disturb our streets again,\n\
Your lives shall pay the forfeit of the peace.\n\
For this time, all the rest depart away:\n\
You Capulet; shall go along with me:\n\
And, Montague, come you this afternoon,\n\
To know our further pleasure in this case,\n\
To old Free-town, our common judgment-place.\n\
Once more, on pain of death, all men depart."

for (var i = 0; i <4; i++) {
    plainText += plainText;
}

var md5Output = hex_md5(plainText);
/*
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-1, as defined
 * in FIPS PUB 180-1
 * Version 2.1a Copyright Paul Johnston 2000 - 2002.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for details.
 */

/*
 * Configurable variables. You may need to tweak these to be compatible with
 * the server-side, but the defaults work in most cases.
 */
var hexcase = 0;  /* hex output format. 0 - lowercase; 1 - uppercase        */
var b64pad  = ""; /* base-64 pad character. "=" for strict RFC compliance   */
var chrsz   = 8;  /* bits per input character. 8 - ASCII; 16 - Unicode      */

/*
 * These are the functions you'll usually want to call
 * They take string arguments and return either hex or base-64 encoded strings
 */
function hex_sha1(s){return binb2hex(core_sha1(str2binb(s),s.length * chrsz));}
function b64_sha1(s){return binb2b64(core_sha1(str2binb(s),s.length * chrsz));}
function str_sha1(s){return binb2str(core_sha1(str2binb(s),s.length * chrsz));}
function hex_hmac_sha1(key, data){ return binb2hex(core_hmac_sha1(key, data));}
function b64_hmac_sha1(key, data){ return binb2b64(core_hmac_sha1(key, data));}
function str_hmac_sha1(key, data){ return binb2str(core_hmac_sha1(key, data));}

/*
 * Perform a simple self-test to see if the VM is working
 */
function sha1_vm_test()
{
  return hex_sha1("abc") == "a9993e364706816aba3e25717850c26c9cd0d89d";
}

/*
 * Calculate the SHA-1 of an array of big-endian words, and a bit length
 */
function core_sha1(x, len)
{
  /* append padding */
  x[len >> 5] |= 0x80 << (24 - len % 32);
  x[((len + 64 >> 9) << 4) + 15] = len;

  var w = Array(80);
  var a =  1732584193;
  var b = -271733879;
  var c = -1732584194;
  var d =  271733878;
  var e = -1009589776;

  for(var i = 0; i < x.length; i += 16)
  {
    var olda = a;
    var oldb = b;
    var oldc = c;
    var oldd = d;
    var olde = e;

    for(var j = 0; j < 80; j++)
    {
      if(j < 16) w[j] = x[i + j];
      else w[j] = rol(w[j-3] ^ w[j-8] ^ w[j-14] ^ w[j-16], 1);
      var t = safe_add(safe_add(rol(a, 5), sha1_ft(j, b, c, d)),
                       safe_add(safe_add(e, w[j]), sha1_kt(j)));
      e = d;
      d = c;
      c = rol(b, 30);
      b = a;
      a = t;
    }

    a = safe_add(a, olda);
    b = safe_add(b, oldb);
    c = safe_add(c, oldc);
    d = safe_add(d, oldd);
    e = safe_add(e, olde);
  }
  return Array(a, b, c, d, e);

}

/*
 * Perform the appropriate triplet combination function for the current
 * iteration
 */
function sha1_ft(t, b, c, d)
{
  if(t < 20) return (b & c) | ((~b) & d);
  if(t < 40) return b ^ c ^ d;
  if(t < 60) return (b & c) | (b & d) | (c & d);
  return b ^ c ^ d;
}

/*
 * Determine the appropriate additive constant for the current iteration
 */
function sha1_kt(t)
{
  return (t < 20) ?  1518500249 : (t < 40) ?  1859775393 :
         (t < 60) ? -1894007588 : -899497514;
}

/*
 * Calculate the HMAC-SHA1 of a key and some data
 */
function core_hmac_sha1(key, data)
{
  var bkey = str2binb(key);
  if(bkey.length > 16) bkey = core_sha1(bkey, key.length * chrsz);

  var ipad = Array(16), opad = Array(16);
  for(var i = 0; i < 16; i++)
  {
    ipad[i] = bkey[i] ^ 0x36363636;
    opad[i] = bkey[i] ^ 0x5C5C5C5C;
  }

  var hash = core_sha1(ipad.concat(str2binb(data)), 512 + data.length * chrsz);
  return core_sha1(opad.concat(hash), 512 + 160);
}

/*
 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
 * to work around bugs in some JS interpreters.
 */
function safe_add(x, y)
{
  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xFFFF);
}

/*
 * Bitwise rotate a 32-bit number to the left.
 */
function rol(num, cnt)
{
  return (num << cnt) | (num >>> (32 - cnt));
}

/*
 * Convert an 8-bit or 16-bit string to an array of big-endian words
 * In 8-bit function, characters >255 have their hi-byte silently ignored.
 */
function str2binb(str)
{
  var bin = Array();
  var mask = (1 << chrsz) - 1;
  for(var i = 0; i < str.length * chrsz; i += chrsz)
    bin[i>>5] |= (str.charCodeAt(i / chrsz) & mask) << (32 - chrsz - i%32);
  return bin;
}

/*
 * Convert an array of big-endian words to a string
 */
function binb2str(bin)
{
  var str = "";
  var mask = (1 << chrsz) - 1;
  for(var i = 0; i < bin.length * 32; i += chrsz)
    str += String.fromCharCode((bin[i>>5] >>> (32 - chrsz - i%32)) & mask);
  return str;
}

/*
 * Convert an array of big-endian words to a hex string.
 */
function binb2hex(binarray)
{
  var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
  var str = "";
  for(var i = 0; i < binarray.length * 4; i++)
  {
    str += hex_tab.charAt((binarray[i>>2] >> ((3 - i%4)*8+4)) & 0xF) +
           hex_tab.charAt((binarray[i>>2] >> ((3 - i%4)*8  )) & 0xF);
  }
  return str;
}

/*
 * Convert an array of big-endian words to a base-64 string
 */
function binb2b64(binarray)
{
  var tab = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var str = "";
  for(var i = 0; i < binarray.length * 4; i += 3)
  {
    var triplet = (((binarray[i   >> 2] >> 8 * (3 -  i   %4)) & 0xFF) << 16)
                | (((binarray[i+1 >> 2] >> 8 * (3 - (i+1)%4)) & 0xFF) << 8 )
                |  ((binarray[i+2 >> 2] >> 8 * (3 - (i+2)%4)) & 0xFF);
    for(var j = 0; j < 4; j++)
    {
      if(i * 8 + j * 6 > binarray.length * 32) str += b64pad;
      else str += tab.charAt((triplet >> 6*(3-j)) & 0x3F);
    }
  }
  return str;
}


var plainText = "Two households, both alike in dignity,\n\
In fair Verona, where we lay our scene,\n\
From ancient grudge break to new mutiny,\n\
Where civil blood makes civil hands unclean.\n\
From forth the fatal loins of these two foes\n\
A pair of star-cross'd lovers take their life;\n\
Whole misadventured piteous overthrows\n\
Do with their death bury their parents' strife.\n\
The fearful passage of their death-mark'd love,\n\
And the continuance of their parents' rage,\n\
Which, but their children's end, nought could remove,\n\
Is now the two hours' traffic of our stage;\n\
The which if you with patient ears attend,\n\
What here shall miss, our toil shall strive to mend.";

for (var i = 0; i <4; i++) {
    plainText += plainText;
}

var sha1Output = hex_sha1(plainText);
function arrayExists(array, x) {
    for (var i = 0; i < array.length; i++) {
        if (array[i] == x) return true;
    }
    return false;
}

Date.prototype.formatDate = function (input,time) {
    // formatDate :
    // a PHP date like function, for formatting date strings
    // See: http://www.php.net/date
    //
    // input : format string
    // time : epoch time (seconds, and optional)
    //
    // if time is not passed, formatting is based on 
    // the current "this" date object's set time.
    //
    // supported:
    // a, A, B, d, D, F, g, G, h, H, i, j, l (lowercase L), L, 
    // m, M, n, O, r, s, S, t, U, w, W, y, Y, z
    //
    // unsupported:
    // I (capital i), T, Z    

    var switches =    ["a", "A", "B", "d", "D", "F", "g", "G", "h", "H", 
                       "i", "j", "l", "L", "m", "M", "n", "O", "r", "s", 
                       "S", "t", "U", "w", "W", "y", "Y", "z"];
    var daysLong =    ["Sunday", "Monday", "Tuesday", "Wednesday", 
                       "Thursday", "Friday", "Saturday"];
    var daysShort =   ["Sun", "Mon", "Tue", "Wed", 
                       "Thu", "Fri", "Sat"];
    var monthsShort = ["Jan", "Feb", "Mar", "Apr",
                       "May", "Jun", "Jul", "Aug", "Sep",
                       "Oct", "Nov", "Dec"];
    var monthsLong =  ["January", "February", "March", "April",
                       "May", "June", "July", "August", "September",
                       "October", "November", "December"];
    var daysSuffix = ["st", "nd", "rd", "th", "th", "th", "th", // 1st - 7th
                      "th", "th", "th", "th", "th", "th", "th", // 8th - 14th
                      "th", "th", "th", "th", "th", "th", "st", // 15th - 21st
                      "nd", "rd", "th", "th", "th", "th", "th", // 22nd - 28th
                      "th", "th", "st"];                        // 29th - 31st

    function a() {
        // Lowercase Ante meridiem and Post meridiem
        return self.getHours() > 11? "pm" : "am";
    }
    function A() {
        // Uppercase Ante meridiem and Post meridiem
        return self.getHours() > 11? "PM" : "AM";
    }

    function B(){
        // Swatch internet time. code simply grabbed from ppk,
        // since I was feeling lazy:
        // http://www.xs4all.nl/~ppk/js/beat.html
        var off = (self.getTimezoneOffset() + 60)*60;
        var theSeconds = (self.getHours() * 3600) + 
                         (self.getMinutes() * 60) + 
                          self.getSeconds() + off;
        var beat = Math.floor(theSeconds/86.4);
        if (beat > 1000) beat -= 1000;
        if (beat < 0) beat += 1000;
        if ((""+beat).length == 1) beat = "00"+beat;
        if ((""+beat).length == 2) beat = "0"+beat;
        return beat;
    }
    
    function d() {
        // Day of the month, 2 digits with leading zeros
        return new String(self.getDate()).length == 1?
        "0"+self.getDate() : self.getDate();
    }
    function D() {
        // A textual representation of a day, three letters
        return daysShort[self.getDay()];
    }
    function F() {
        // A full textual representation of a month
        return monthsLong[self.getMonth()];
    }
    function g() {
        // 12-hour format of an hour without leading zeros
        return self.getHours() > 12? self.getHours()-12 : self.getHours();
    }
    function G() {
        // 24-hour format of an hour without leading zeros
        return self.getHours();
    }
    function h() {
        // 12-hour format of an hour with leading zeros
        if (self.getHours() > 12) {
          var s = new String(self.getHours()-12);
          return s.length == 1?
          "0"+ (self.getHours()-12) : self.getHours()-12;
        } else { 
          var s = new String(self.getHours());
          return s.length == 1?
          "0"+self.getHours() : self.getHours();
        }  
    }
    function H() {
        // 24-hour format of an hour with leading zeros
        return new String(self.getHours()).length == 1?
        "0"+self.getHours() : self.getHours();
    }
    function i() {
        // Minutes with leading zeros
        return new String(self.getMinutes()).length == 1? 
        "0"+self.getMinutes() : self.getMinutes(); 
    }
    function j() {
        // Day of the month without leading zeros
        return self.getDate();
    }    
    function l() {
        // A full textual representation of the day of the week
        return daysLong[self.getDay()];
    }
    function L() {
        // leap year or not. 1 if leap year, 0 if not.
        // the logic should match iso's 8601 standard.
        var y_ = Y();
        if (         
            (y_ % 4 == 0 && y_ % 100 != 0) ||
            (y_ % 4 == 0 && y_ % 100 == 0 && y_ % 400 == 0)
            ) {
            return 1;
        } else {
            return 0;
        }
    }
    function m() {
        // Numeric representation of a month, with leading zeros
        return self.getMonth() < 9?
        "0"+(self.getMonth()+1) : 
        self.getMonth()+1;
    }
    function M() {
        // A short textual representation of a month, three letters
        return monthsShort[self.getMonth()];
    }
    function n() {
        // Numeric representation of a month, without leading zeros
        return self.getMonth()+1;
    }
    function O() {
        // Difference to Greenwich time (GMT) in hours
        var os = Math.abs(self.getTimezoneOffset());
        var h = ""+Math.floor(os/60);
        var m = ""+(os%60);
        h.length == 1? h = "0"+h:1;
        m.length == 1? m = "0"+m:1;
        return self.getTimezoneOffset() < 0 ? "+"+h+m : "-"+h+m;
    }
    function r() {
        // RFC 822 formatted date
        var r; // result
        //  Thu    ,     21          Dec         2000
        r = D() + ", " + j() + " " + M() + " " + Y() +
        //        16     :    01     :    07          +0200
            " " + H() + ":" + i() + ":" + s() + " " + O();
        return r;
    }
    function S() {
        // English ordinal suffix for the day of the month, 2 characters
        return daysSuffix[self.getDate()-1];
    }
    function s() {
        // Seconds, with leading zeros
        return new String(self.getSeconds()).length == 1?
        "0"+self.getSeconds() : self.getSeconds();
    }
    function t() {

        // thanks to Matt Bannon for some much needed code-fixes here!
        var daysinmonths = [null,31,28,31,30,31,30,31,31,30,31,30,31];
        if (L()==1 && n()==2) return 29; // leap day
        return daysinmonths[n()];
    }
    function U() {
        // Seconds since the Unix Epoch (January 1 1970 00:00:00 GMT)
        return Math.round(self.getTime()/1000);
    }
    function W() {
        // Weeknumber, as per ISO specification:
        // http://www.cl.cam.ac.uk/~mgk25/iso-time.html
        
        // if the day is three days before newyears eve,
        // there's a chance it's "week 1" of next year.
        // here we check for that.
        var beforeNY = 364+L() - z();
        var afterNY  = z();
        var weekday = w()!=0?w()-1:6; // makes sunday (0), into 6.
        if (beforeNY <= 2 && weekday <= 2-beforeNY) {
            return 1;
        }
        // similarly, if the day is within threedays of newyears
        // there's a chance it belongs in the old year.
        var ny = new Date("January 1 " + Y() + " 00:00:00");
        var nyDay = ny.getDay()!=0?ny.getDay()-1:6;
        if (
            (afterNY <= 2) && 
            (nyDay >=4)  && 
            (afterNY >= (6-nyDay))
            ) {
            // Since I'm not sure we can just always return 53,
            // i call the function here again, using the last day
            // of the previous year, as the date, and then just
            // return that week.
            var prevNY = new Date("December 31 " + (Y()-1) + " 00:00:00");
            return prevNY.formatDate("W");
        }
        
        // week 1, is the week that has the first thursday in it.
        // note that this value is not zero index.
        if (nyDay <= 3) {
            // first day of the year fell on a thursday, or earlier.
            return 1 + Math.floor( ( z() + nyDay ) / 7 );
        } else {
            // first day of the year fell on a friday, or later.
            return 1 + Math.floor( ( z() - ( 7 - nyDay ) ) / 7 );
        }
    }
    function w() {
        // Numeric representation of the day of the week
        return self.getDay();
    }
    
    function Y() {
        // A full numeric representation of a year, 4 digits

        // we first check, if getFullYear is supported. if it
        // is, we just use that. ppks code is nice, but wont
        // work with dates outside 1900-2038, or something like that
        if (self.getFullYear) {
            var newDate = new Date("January 1 2001 00:00:00 +0000");
            var x = newDate .getFullYear();
            if (x == 2001) {              
                // i trust the method now
                return self.getFullYear();
            }
        }
        // else, do this:
        // codes thanks to ppk:
        // http://www.xs4all.nl/~ppk/js/introdate.html
        var x = self.getYear();
        var y = x % 100;
        y += (y < 38) ? 2000 : 1900;
        return y;
    }
    function y() {
        // A two-digit representation of a year
        var y = Y()+"";
        return y.substring(y.length-2,y.length);
    }
    function z() {
        // The day of the year, zero indexed! 0 through 366
        var t = new Date("January 1 " + Y() + " 00:00:00");
        var diff = self.getTime() - t.getTime();
        return Math.floor(diff/1000/60/60/24);
    }
        
    var self = this;
    if (time) {
        // save time
        var prevTime = self.getTime();
        self.setTime(time);
    }
    
    var ia = input.split("");
    var ij = 0;
    while (ia[ij]) {
        if (ia[ij] == "\\") {
            // this is our way of allowing users to escape stuff
            ia.splice(ij,1);
        } else {
            if (arrayExists(switches,ia[ij])) {
                ia[ij] = eval(ia[ij] + "()");
            }
        }
        ij++;
    }
    // reset time, back to what it was
    if (prevTime) {
        self.setTime(prevTime);
    }
    return ia.join("");
}

var date = new Date("1/1/2007 1:11:11");

for (i = 0; i < 500; ++i) {
    var shortFormat = date.formatDate("Y-m-d");
    var longFormat = date.formatDate("l, F d, Y g:i:s A");
    date.setTime(date.getTime() + 84266956);
}

/*
 * Copyright (C) 2004 Baron Schwartz <baron at sequent dot org>
 *
 * This program is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as published by the
 * Free Software Foundation, version 2.1.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE.  See the GNU Lesser General Public License for more
 * details.
 */

Date.parseFunctions = {count:0};
Date.parseRegexes = [];
Date.formatFunctions = {count:0};

Date.prototype.dateFormat = function(format) {
    if (Date.formatFunctions[format] == null) {
        Date.createNewFormat(format);
    }
    var func = Date.formatFunctions[format];
    return this[func]();
}

Date.createNewFormat = function(format) {
    var funcName = "format" + Date.formatFunctions.count++;
    Date.formatFunctions[format] = funcName;
    var code = "Date.prototype." + funcName + " = function(){return ";
    var special = false;
    var ch = '';
    for (var i = 0; i < format.length; ++i) {
        ch = format.charAt(i);
        if (!special && ch == "\\") {
            special = true;
        }
        else if (special) {
            special = false;
            code += "'" + String.escape(ch) + "' + ";
        }
        else {
            code += Date.getFormatCode(ch);
        }
    }
    eval(code.substring(0, code.length - 3) + ";}");
}

Date.getFormatCode = function(character) {
    switch (character) {
    case "d":
        return "String.leftPad(this.getDate(), 2, '0') + ";
    case "D":
        return "Date.dayNames[this.getDay()].substring(0, 3) + ";
    case "j":
        return "this.getDate() + ";
    case "l":
        return "Date.dayNames[this.getDay()] + ";
    case "S":
        return "this.getSuffix() + ";
    case "w":
        return "this.getDay() + ";
    case "z":
        return "this.getDayOfYear() + ";
    case "W":
        return "this.getWeekOfYear() + ";
    case "F":
        return "Date.monthNames[this.getMonth()] + ";
    case "m":
        return "String.leftPad(this.getMonth() + 1, 2, '0') + ";
    case "M":
        return "Date.monthNames[this.getMonth()].substring(0, 3) + ";
    case "n":
        return "(this.getMonth() + 1) + ";
    case "t":
        return "this.getDaysInMonth() + ";
    case "L":
        return "(this.isLeapYear() ? 1 : 0) + ";
    case "Y":
        return "this.getFullYear() + ";
    case "y":
        return "('' + this.getFullYear()).substring(2, 4) + ";
    case "a":
        return "(this.getHours() < 12 ? 'am' : 'pm') + ";
    case "A":
        return "(this.getHours() < 12 ? 'AM' : 'PM') + ";
    case "g":
        return "((this.getHours() %12) ? this.getHours() % 12 : 12) + ";
    case "G":
        return "this.getHours() + ";
    case "h":
        return "String.leftPad((this.getHours() %12) ? this.getHours() % 12 : 12, 2, '0') + ";
    case "H":
        return "String.leftPad(this.getHours(), 2, '0') + ";
    case "i":
        return "String.leftPad(this.getMinutes(), 2, '0') + ";
    case "s":
        return "String.leftPad(this.getSeconds(), 2, '0') + ";
    case "O":
        return "this.getGMTOffset() + ";
    case "T":
        return "this.getTimezone() + ";
    case "Z":
        return "(this.getTimezoneOffset() * -60) + ";
    default:
        return "'" + String.escape(character) + "' + ";
    }
}

Date.parseDate = function(input, format) {
    if (Date.parseFunctions[format] == null) {
        Date.createParser(format);
    }
    var func = Date.parseFunctions[format];
    return Date[func](input);
}

Date.createParser = function(format) {
    var funcName = "parse" + Date.parseFunctions.count++;
    var regexNum = Date.parseRegexes.length;
    var currentGroup = 1;
    Date.parseFunctions[format] = funcName;

    var code = "Date." + funcName + " = function(input){\n"
        + "var y = -1, m = -1, d = -1, h = -1, i = -1, s = -1;\n"
        + "var d = new Date();\n"
        + "y = d.getFullYear();\n"
        + "m = d.getMonth();\n"
        + "d = d.getDate();\n"
        + "var results = input.match(Date.parseRegexes[" + regexNum + "]);\n"
        + "if (results && results.length > 0) {"
    var regex = "";

    var special = false;
    var ch = '';
    for (var i = 0; i < format.length; ++i) {
        ch = format.charAt(i);
        if (!special && ch == "\\") {
            special = true;
        }
        else if (special) {
            special = false;
            regex += String.escape(ch);
        }
        else {
            obj = Date.formatCodeToRegex(ch, currentGroup);
            currentGroup += obj.g;
            regex += obj.s;
            if (obj.g && obj.c) {
                code += obj.c;
            }
        }
    }

    code += "if (y > 0 && m >= 0 && d > 0 && h >= 0 && i >= 0 && s >= 0)\n"
        + "{return new Date(y, m, d, h, i, s);}\n"
        + "else if (y > 0 && m >= 0 && d > 0 && h >= 0 && i >= 0)\n"
        + "{return new Date(y, m, d, h, i);}\n"
        + "else if (y > 0 && m >= 0 && d > 0 && h >= 0)\n"
        + "{return new Date(y, m, d, h);}\n"
        + "else if (y > 0 && m >= 0 && d > 0)\n"
        + "{return new Date(y, m, d);}\n"
        + "else if (y > 0 && m >= 0)\n"
        + "{return new Date(y, m);}\n"
        + "else if (y > 0)\n"
        + "{return new Date(y);}\n"
        + "}return null;}";

    Date.parseRegexes[regexNum] = new RegExp("^" + regex + "$");
    eval(code);
}

Date.formatCodeToRegex = function(character, currentGroup) {
    switch (character) {
    case "D":
        return {g:0,
        c:null,
        s:"(?:Sun|Mon|Tue|Wed|Thu|Fri|Sat)"};
    case "j":
    case "d":
        return {g:1,
            c:"d = parseInt(results[" + currentGroup + "], 10);\n",
            s:"(\\d{1,2})"};
    case "l":
        return {g:0,
            c:null,
            s:"(?:" + Date.dayNames.join("|") + ")"};
    case "S":
        return {g:0,
            c:null,
            s:"(?:st|nd|rd|th)"};
    case "w":
        return {g:0,
            c:null,
            s:"\\d"};
    case "z":
        return {g:0,
            c:null,
            s:"(?:\\d{1,3})"};
    case "W":
        return {g:0,
            c:null,
            s:"(?:\\d{2})"};
    case "F":
        return {g:1,
            c:"m = parseInt(Date.monthNumbers[results[" + currentGroup + "].substring(0, 3)], 10);\n",
            s:"(" + Date.monthNames.join("|") + ")"};
    case "M":
        return {g:1,
            c:"m = parseInt(Date.monthNumbers[results[" + currentGroup + "]], 10);\n",
            s:"(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)"};
    case "n":
    case "m":
        return {g:1,
            c:"m = parseInt(results[" + currentGroup + "], 10) - 1;\n",
            s:"(\\d{1,2})"};
    case "t":
        return {g:0,
            c:null,
            s:"\\d{1,2}"};
    case "L":
        return {g:0,
            c:null,
            s:"(?:1|0)"};
    case "Y":
        return {g:1,
            c:"y = parseInt(results[" + currentGroup + "], 10);\n",
            s:"(\\d{4})"};
    case "y":
        return {g:1,
            c:"var ty = parseInt(results[" + currentGroup + "], 10);\n"
                + "y = ty > Date.y2kYear ? 1900 + ty : 2000 + ty;\n",
            s:"(\\d{1,2})"};
    case "a":
        return {g:1,
            c:"if (results[" + currentGroup + "] == 'am') {\n"
                + "if (h == 12) { h = 0; }\n"
                + "} else { if (h < 12) { h += 12; }}",
            s:"(am|pm)"};
    case "A":
        return {g:1,
            c:"if (results[" + currentGroup + "] == 'AM') {\n"
                + "if (h == 12) { h = 0; }\n"
                + "} else { if (h < 12) { h += 12; }}",
            s:"(AM|PM)"};
    case "g":
    case "G":
    case "h":
    case "H":
        return {g:1,
            c:"h = parseInt(results[" + currentGroup + "], 10);\n",
            s:"(\\d{1,2})"};
    case "i":
        return {g:1,
            c:"i = parseInt(results[" + currentGroup + "], 10);\n",
            s:"(\\d{2})"};
    case "s":
        return {g:1,
            c:"s = parseInt(results[" + currentGroup + "], 10);\n",
            s:"(\\d{2})"};
    case "O":
        return {g:0,
            c:null,
            s:"[+-]\\d{4}"};
    case "T":
        return {g:0,
            c:null,
            s:"[A-Z]{3}"};
    case "Z":
        return {g:0,
            c:null,
            s:"[+-]\\d{1,5}"};
    default:
        return {g:0,
            c:null,
            s:String.escape(character)};
    }
}

Date.prototype.getTimezone = function() {
    return this.toString().replace(
        /^.*? ([A-Z]{3}) [0-9]{4}.*$/, "$1").replace(
        /^.*?\(([A-Z])[a-z]+ ([A-Z])[a-z]+ ([A-Z])[a-z]+\)$/, "$1$2$3");
}

Date.prototype.getGMTOffset = function() {
    return (this.getTimezoneOffset() > 0 ? "-" : "+")
        + String.leftPad(Math.floor(this.getTimezoneOffset() / 60), 2, "0")
        + String.leftPad(this.getTimezoneOffset() % 60, 2, "0");
}

Date.prototype.getDayOfYear = function() {
    var num = 0;
    Date.daysInMonth[1] = this.isLeapYear() ? 29 : 28;
    for (var i = 0; i < this.getMonth(); ++i) {
        num += Date.daysInMonth[i];
    }
    return num + this.getDate() - 1;
}

Date.prototype.getWeekOfYear = function() {
    // Skip to Thursday of this week
    var now = this.getDayOfYear() + (4 - this.getDay());
    // Find the first Thursday of the year
    var jan1 = new Date(this.getFullYear(), 0, 1);
    var then = (7 - jan1.getDay() + 4);
    document.write(then);
    return String.leftPad(((now - then) / 7) + 1, 2, "0");
}

Date.prototype.isLeapYear = function() {
    var year = this.getFullYear();
    return ((year & 3) == 0 && (year % 100 || (year % 400 == 0 && year)));
}

Date.prototype.getFirstDayOfMonth = function() {
    var day = (this.getDay() - (this.getDate() - 1)) % 7;
    return (day < 0) ? (day + 7) : day;
}

Date.prototype.getLastDayOfMonth = function() {
    var day = (this.getDay() + (Date.daysInMonth[this.getMonth()] - this.getDate())) % 7;
    return (day < 0) ? (day + 7) : day;
}

Date.prototype.getDaysInMonth = function() {
    Date.daysInMonth[1] = this.isLeapYear() ? 29 : 28;
    return Date.daysInMonth[this.getMonth()];
}

Date.prototype.getSuffix = function() {
    switch (this.getDate()) {
        case 1:
        case 21:
        case 31:
            return "st";
        case 2:
        case 22:
            return "nd";
        case 3:
        case 23:
            return "rd";
        default:
            return "th";
    }
}

String.escape = function(string) {
    return string.replace(/('|\\)/g, "\\$1");
}

String.leftPad = function (val, size, ch) {
    var result = new String(val);
    if (ch == null) {
        ch = " ";
    }
    while (result.length < size) {
        result = ch + result;
    }
    return result;
}

Date.daysInMonth = [31,28,31,30,31,30,31,31,30,31,30,31];
Date.monthNames =
   ["January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"];
Date.dayNames =
   ["Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"];
Date.y2kYear = 50;
Date.monthNumbers = {
    Jan:0,
    Feb:1,
    Mar:2,
    Apr:3,
    May:4,
    Jun:5,
    Jul:6,
    Aug:7,
    Sep:8,
    Oct:9,
    Nov:10,
    Dec:11};
Date.patterns = {
    ISO8601LongPattern:"Y-m-d H:i:s",
    ISO8601ShortPattern:"Y-m-d",
    ShortDatePattern: "n/j/Y",
    LongDatePattern: "l, F d, Y",
    FullDateTimePattern: "l, F d, Y g:i:s A",
    MonthDayPattern: "F d",
    ShortTimePattern: "g:i A",
    LongTimePattern: "g:i:s A",
    SortableDateTimePattern: "Y-m-d\\TH:i:s",
    UniversalSortableDateTimePattern: "Y-m-d H:i:sO",
    YearMonthPattern: "F, Y"};

var date = new Date("1/1/2007 1:11:11");

for (i = 0; i < 4000; ++i) {
    var shortFormat = date.dateFormat("Y-m-d");
    var longFormat = date.dateFormat("l, F d, Y g:i:s A");
    date.setTime(date.getTime() + 84266956);
}
/*
 * Copyright (C) Rich Moore.  All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY CONTRIBUTORS ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE COMPUTER, INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. 
 */

/////. Start CORDIC

var AG_CONST = 0.6072529350;

function FIXED(X)
{
  return X * 65536.0;
}

function FLOAT(X)
{
  return X / 65536.0;
}

function DEG2RAD(X)
{
  return 0.017453 * (X);
}

var Angles = [
  FIXED(45.0), FIXED(26.565), FIXED(14.0362), FIXED(7.12502),
  FIXED(3.57633), FIXED(1.78991), FIXED(0.895174), FIXED(0.447614),
  FIXED(0.223811), FIXED(0.111906), FIXED(0.055953),
  FIXED(0.027977) 
              ];


function cordicsincos() {
    var X;
    var Y;
    var TargetAngle;
    var CurrAngle;
    var Step;
 
    X = FIXED(AG_CONST);         /* AG_CONST * cos(0) */
    Y = 0;                       /* AG_CONST * sin(0) */

    TargetAngle = FIXED(28.027);
    CurrAngle = 0;
    for (Step = 0; Step < 12; Step++) {
        var NewX;
        if (TargetAngle > CurrAngle) {
            NewX = X - (Y >> Step);
            Y = (X >> Step) + Y;
            X = NewX;
            CurrAngle += Angles[Step];
        } else {
            NewX = X + (Y >> Step);
            Y = -(X >> Step) + Y;
            X = NewX;
            CurrAngle -= Angles[Step];
        }
    }
}

///// End CORDIC

function cordic( runs ) {
  var start = new Date();

  for ( var i = 0 ; i < runs ; i++ ) {
      cordicsincos();
  }

  var end = new Date();

  return end.getTime() - start.getTime();
}

cordic(25000);
// The Computer Language Shootout
// http://shootout.alioth.debian.org/
// contributed by Isaac Gouy

function partial(n){
    var a1 = a2 = a3 = a4 = a5 = a6 = a7 = a8 = a9 = 0.0;
    var twothirds = 2.0/3.0;
    var alt = -1.0;
    var k2 = k3 = sk = ck = 0.0;
    
    for (var k = 1; k <= n; k++){
        k2 = k*k;
        k3 = k2*k;
        sk = Math.sin(k);
        ck = Math.cos(k);
        alt = -alt;
        
        a1 += Math.pow(twothirds,k-1);
        a2 += Math.pow(k,-0.5);
        a3 += 1.0/(k*(k+1.0));
        a4 += 1.0/(k3 * sk*sk);
        a5 += 1.0/(k3 * ck*ck);
        a6 += 1.0/k;
        a7 += 1.0/k2;
        a8 += alt/k;
        a9 += alt/(2*k -1);
    }
}

for (var i = 1024; i <= 16384; i *= 2) {
    partial(i);
}

// The Great Computer Language Shootout
// http://shootout.alioth.debian.org/
//
// contributed by Ian Osgood

function A(i,j) {
  return 1/((i+j)*(i+j+1)/2+i+1);
}

function Au(u,v) {
  for (var i=0; i<u.length; ++i) {
    var t = 0;
    for (var j=0; j<u.length; ++j)
      t += A(i,j) * u[j];
    v[i] = t;
  }
}

function Atu(u,v) {
  for (var i=0; i<u.length; ++i) {
    var t = 0;
    for (var j=0; j<u.length; ++j)
      t += A(j,i) * u[j];
    v[i] = t;
  }
}

function AtAu(u,v,w) {
  Au(u,w);
  Atu(w,v);
}

function spectralnorm(n) {
  var i, u=[], v=[], w=[], vv=0, vBv=0;
  for (i=0; i<n; ++i) {
    u[i] = 1; v[i] = w[i] = 0;
  }
  for (i=0; i<10; ++i) {
    AtAu(u,v,w);
    AtAu(v,u,w);
  }
  for (i=0; i<n; ++i) {
    vBv += u[i]*v[i];
    vv  += v[i]*v[i];
  }
  return Math.sqrt(vBv/vv);
}

for (var i = 6; i <= 48; i *= 2) {
    spectralnorm(i);
}
// The Computer Language Shootout
// http://shootout.alioth.debian.org/
//
// contributed by Jesse Millikan
// Base on the Ruby version by jose fco. gonzalez

var l;
var dnaInput = ">ONE Homo sapiens alu\n\
GGCCGGGCGCGGTGGCTCACGCCTGTAATCCCAGCACTTTGGGAGGCCGAGGCGGGCGGA\n\
TCACCTGAGGTCAGGAGTTCGAGACCAGCCTGGCCAACATGGTGAAACCCCGTCTCTACT\n\
AAAAATACAAAAATTAGCCGGGCGTGGTGGCGCGCGCCTGTAATCCCAGCTACTCGGGAG\n\
GCTGAGGCAGGAGAATCGCTTGAACCCGGGAGGCGGAGGTTGCAGTGAGCCGAGATCGCG\n\
CCACTGCACTCCAGCCTGGGCGACAGAGCGAGACTCCGTCTCAAAAAGGCCGGGCGCGGT\n\
GGCTCACGCCTGTAATCCCAGCACTTTGGGAGGCCGAGGCGGGCGGATCACCTGAGGTCA\n\
GGAGTTCGAGACCAGCCTGGCCAACATGGTGAAACCCCGTCTCTACTAAAAATACAAAAA\n\
TTAGCCGGGCGTGGTGGCGCGCGCCTGTAATCCCAGCTACTCGGGAGGCTGAGGCAGGAG\n\
AATCGCTTGAACCCGGGAGGCGGAGGTTGCAGTGAGCCGAGATCGCGCCACTGCACTCCA\n\
GCCTGGGCGACAGAGCGAGACTCCGTCTCAAAAAGGCCGGGCGCGGTGGCTCACGCCTGT\n\
AATCCCAGCACTTTGGGAGGCCGAGGCGGGCGGATCACCTGAGGTCAGGAGTTCGAGACC\n\
AGCCTGGCCAACATGGTGAAACCCCGTCTCTACTAAAAATACAAAAATTAGCCGGGCGTG\n\
GTGGCGCGCGCCTGTAATCCCAGCTACTCGGGAGGCTGAGGCAGGAGAATCGCTTGAACC\n\
CGGGAGGCGGAGGTTGCAGTGAGCCGAGATCGCGCCACTGCACTCCAGCCTGGGCGACAG\n\
AGCGAGACTCCGTCTCAAAAAGGCCGGGCGCGGTGGCTCACGCCTGTAATCCCAGCACTT\n\
TGGGAGGCCGAGGCGGGCGGATCACCTGAGGTCAGGAGTTCGAGACCAGCCTGGCCAACA\n\
TGGTGAAACCCCGTCTCTACTAAAAATACAAAAATTAGCCGGGCGTGGTGGCGCGCGCCT\n\
GTAATCCCAGCTACTCGGGAGGCTGAGGCAGGAGAATCGCTTGAACCCGGGAGGCGGAGG\n\
TTGCAGTGAGCCGAGATCGCGCCACTGCACTCCAGCCTGGGCGACAGAGCGAGACTCCGT\n\
CTCAAAAAGGCCGGGCGCGGTGGCTCACGCCTGTAATCCCAGCACTTTGGGAGGCCGAGG\n\
CGGGCGGATCACCTGAGGTCAGGAGTTCGAGACCAGCCTGGCCAACATGGTGAAACCCCG\n\
TCTCTACTAAAAATACAAAAATTAGCCGGGCGTGGTGGCGCGCGCCTGTAATCCCAGCTA\n\
CTCGGGAGGCTGAGGCAGGAGAATCGCTTGAACCCGGGAGGCGGAGGTTGCAGTGAGCCG\n\
AGATCGCGCCACTGCACTCCAGCCTGGGCGACAGAGCGAGACTCCGTCTCAAAAAGGCCG\n\
GGCGCGGTGGCTCACGCCTGTAATCCCAGCACTTTGGGAGGCCGAGGCGGGCGGATCACC\n\
TGAGGTCAGGAGTTCGAGACCAGCCTGGCCAACATGGTGAAACCCCGTCTCTACTAAAAA\n\
TACAAAAATTAGCCGGGCGTGGTGGCGCGCGCCTGTAATCCCAGCTACTCGGGAGGCTGA\n\
GGCAGGAGAATCGCTTGAACCCGGGAGGCGGAGGTTGCAGTGAGCCGAGATCGCGCCACT\n\
GCACTCCAGCCTGGGCGACAGAGCGAGACTCCGTCTCAAAAAGGCCGGGCGCGGTGGCTC\n\
ACGCCTGTAATCCCAGCACTTTGGGAGGCCGAGGCGGGCGGATCACCTGAGGTCAGGAGT\n\
TCGAGACCAGCCTGGCCAACATGGTGAAACCCCGTCTCTACTAAAAATACAAAAATTAGC\n\
CGGGCGTGGTGGCGCGCGCCTGTAATCCCAGCTACTCGGGAGGCTGAGGCAGGAGAATCG\n\
CTTGAACCCGGGAGGCGGAGGTTGCAGTGAGCCGAGATCGCGCCACTGCACTCCAGCCTG\n\
GGCGACAGAGCGAGACTCCGTCTCAAAAAGGCCGGGCGCGGTGGCTCACGCCTGTAATCC\n\
CAGCACTTTGGGAGGCCGAGGCGGGCGGATCACCTGAGGTCAGGAGTTCGAGACCAGCCT\n\
GGCCAACATGGTGAAACCCCGTCTCTACTAAAAATACAAAAATTAGCCGGGCGTGGTGGC\n\
GCGCGCCTGTAATCCCAGCTACTCGGGAGGCTGAGGCAGGAGAATCGCTTGAACCCGGGA\n\
GGCGGAGGTTGCAGTGAGCCGAGATCGCGCCACTGCACTCCAGCCTGGGCGACAGAGCGA\n\
GACTCCGTCTCAAAAAGGCCGGGCGCGGTGGCTCACGCCTGTAATCCCAGCACTTTGGGA\n\
GGCCGAGGCGGGCGGATCACCTGAGGTCAGGAGTTCGAGACCAGCCTGGCCAACATGGTG\n\
AAACCCCGTCTCTACTAAAAATACAAAAATTAGCCGGGCGTGGTGGCGCGCGCCTGTAAT\n\
CCCAGCTACTCGGGAGGCTGAGGCAGGAGAATCGCTTGAACCCGGGAGGCGGAGGTTGCA\n\
GTGAGCCGAGATCGCGCCACTGCACTCCAGCCTGGGCGACAGAGCGAGACTCCGTCTCAA\n\
AAAGGCCGGGCGCGGTGGCTCACGCCTGTAATCCCAGCACTTTGGGAGGCCGAGGCGGGC\n\
GGATCACCTGAGGTCAGGAGTTCGAGACCAGCCTGGCCAACATGGTGAAACCCCGTCTCT\n\
ACTAAAAATACAAAAATTAGCCGGGCGTGGTGGCGCGCGCCTGTAATCCCAGCTACTCGG\n\
GAGGCTGAGGCAGGAGAATCGCTTGAACCCGGGAGGCGGAGGTTGCAGTGAGCCGAGATC\n\
GCGCCACTGCACTCCAGCCTGGGCGACAGAGCGAGACTCCGTCTCAAAAAGGCCGGGCGC\n\
GGTGGCTCACGCCTGTAATCCCAGCACTTTGGGAGGCCGAGGCGGGCGGATCACCTGAGG\n\
TCAGGAGTTCGAGACCAGCCTGGCCAACATGGTGAAACCCCGTCTCTACTAAAAATACAA\n\
AAATTAGCCGGGCGTGGTGGCGCGCGCCTGTAATCCCAGCTACTCGGGAGGCTGAGGCAG\n\
GAGAATCGCTTGAACCCGGGAGGCGGAGGTTGCAGTGAGCCGAGATCGCGCCACTGCACT\n\
CCAGCCTGGGCGACAGAGCGAGACTCCGTCTCAAAAAGGCCGGGCGCGGTGGCTCACGCC\n\
TGTAATCCCAGCACTTTGGGAGGCCGAGGCGGGCGGATCACCTGAGGTCAGGAGTTCGAG\n\
ACCAGCCTGGCCAACATGGTGAAACCCCGTCTCTACTAAAAATACAAAAATTAGCCGGGC\n\
GTGGTGGCGCGCGCCTGTAATCCCAGCTACTCGGGAGGCTGAGGCAGGAGAATCGCTTGA\n\
ACCCGGGAGGCGGAGGTTGCAGTGAGCCGAGATCGCGCCACTGCACTCCAGCCTGGGCGA\n\
CAGAGCGAGACTCCGTCTCAAAAAGGCCGGGCGCGGTGGCTCACGCCTGTAATCCCAGCA\n\
CTTTGGGAGGCCGAGGCGGGCGGATCACCTGAGGTCAGGAGTTCGAGACCAGCCTGGCCA\n\
ACATGGTGAAACCCCGTCTCTACTAAAAATACAAAAATTAGCCGGGCGTGGTGGCGCGCG\n\
CCTGTAATCCCAGCTACTCGGGAGGCTGAGGCAGGAGAATCGCTTGAACCCGGGAGGCGG\n\
AGGTTGCAGTGAGCCGAGATCGCGCCACTGCACTCCAGCCTGGGCGACAGAGCGAGACTC\n\
CGTCTCAAAAAGGCCGGGCGCGGTGGCTCACGCCTGTAATCCCAGCACTTTGGGAGGCCG\n\
AGGCGGGCGGATCACCTGAGGTCAGGAGTTCGAGACCAGCCTGGCCAACATGGTGAAACC\n\
CCGTCTCTACTAAAAATACAAAAATTAGCCGGGCGTGGTGGCGCGCGCCTGTAATCCCAG\n\
CTACTCGGGAGGCTGAGGCAGGAGAATCGCTTGAACCCGGGAGGCGGAGGTTGCAGTGAG\n\
CCGAGATCGCGCCACTGCACTCCAGCCTGGGCGACAGAGCGAGACTCCGTCTCAAAAAGG\n\
CCGGGCGCGGTGGCTCACGCCTGTAATCCCAGCACTTTGGGAGGCCGAGGCGGGCGGATC\n\
ACCTGAGGTCAGGAGTTCGAGACCAGCCTGGCCAACATGGTGAAACCCCGTCTCTACTAA\n\
AAATACAAAAATTAGCCGGGCGTGGTGGCGCGCGCCTGTAATCCCAGCTACTCGGGAGGC\n\
TGAGGCAGGAGAATCGCTTGAACCCGGGAGGCGGAGGTTGCAGTGAGCCGAGATCGCGCC\n\
ACTGCACTCCAGCCTGGGCGACAGAGCGAGACTCCGTCTCAAAAAGGCCGGGCGCGGTGG\n\
CTCACGCCTGTAATCCCAGCACTTTGGGAGGCCGAGGCGGGCGGATCACCTGAGGTCAGG\n\
AGTTCGAGACCAGCCTGGCCAACATGGTGAAACCCCGTCTCTACTAAAAATACAAAAATT\n\
AGCCGGGCGTGGTGGCGCGCGCCTGTAATCCCAGCTACTCGGGAGGCTGAGGCAGGAGAA\n\
TCGCTTGAACCCGGGAGGCGGAGGTTGCAGTGAGCCGAGATCGCGCCACTGCACTCCAGC\n\
CTGGGCGACAGAGCGAGACTCCGTCTCAAAAAGGCCGGGCGCGGTGGCTCACGCCTGTAA\n\
TCCCAGCACTTTGGGAGGCCGAGGCGGGCGGATCACCTGAGGTCAGGAGTTCGAGACCAG\n\
CCTGGCCAACATGGTGAAACCCCGTCTCTACTAAAAATACAAAAATTAGCCGGGCGTGGT\n\
GGCGCGCGCCTGTAATCCCAGCTACTCGGGAGGCTGAGGCAGGAGAATCGCTTGAACCCG\n\
GGAGGCGGAGGTTGCAGTGAGCCGAGATCGCGCCACTGCACTCCAGCCTGGGCGACAGAG\n\
CGAGACTCCGTCTCAAAAAGGCCGGGCGCGGTGGCTCACGCCTGTAATCCCAGCACTTTG\n\
GGAGGCCGAGGCGGGCGGATCACCTGAGGTCAGGAGTTCGAGACCAGCCTGGCCAACATG\n\
GTGAAACCCCGTCTCTACTAAAAATACAAAAATTAGCCGGGCGTGGTGGCGCGCGCCTGT\n\
AATCCCAGCTACTCGGGAGGCTGAGGCAGGAGAATCGCTTGAACCCGGGAGGCGGAGGTT\n\
GCAGTGAGCCGAGATCGCGCCACTGCACTCCAGCCTGGGCGACAGAGCGAGACTCCGTCT\n\
CAAAAAGGCCGGGCGCGGTGGCTCACGCCTGTAATCCCAGCACTTTGGGAGGCCGAGGCG\n\
GGCGGATCACCTGAGGTCAGGAGTTCGAGACCAGCCTGGCCAACATGGTGAAACCCCGTC\n\
TCTACTAAAAATACAAAAATTAGCCGGGCGTGGTGGCGCGCGCCTGTAATCCCAGCTACT\n\
CGGGAGGCTGAGGCAGGAGAATCGCTTGAACCCGGGAGGCGGAGGTTGCAGTGAGCCGAG\n\
ATCGCGCCACTGCACTCCAGCCTGGGCGACAGAGCGAGACTCCGTCTCAAAAAGGCCGGG\n\
CGCGGTGGCTCACGCCTGTAATCCCAGCACTTTGGGAGGCCGAGGCGGGCGGATCACCTG\n\
AGGTCAGGAGTTCGAGACCAGCCTGGCCAACATGGTGAAACCCCGTCTCTACTAAAAATA\n\
CAAAAATTAGCCGGGCGTGGTGGCGCGCGCCTGTAATCCCAGCTACTCGGGAGGCTGAGG\n\
CAGGAGAATCGCTTGAACCCGGGAGGCGGAGGTTGCAGTGAGCCGAGATCGCGCCACTGC\n\
ACTCCAGCCTGGGCGACAGAGCGAGACTCCGTCTCAAAAAGGCCGGGCGCGGTGGCTCAC\n\
GCCTGTAATCCCAGCACTTTGGGAGGCCGAGGCGGGCGGATCACCTGAGGTCAGGAGTTC\n\
GAGACCAGCCTGGCCAACATGGTGAAACCCCGTCTCTACTAAAAATACAAAAATTAGCCG\n\
GGCGTGGTGGCGCGCGCCTGTAATCCCAGCTACTCGGGAGGCTGAGGCAGGAGAATCGCT\n\
TGAACCCGGGAGGCGGAGGTTGCAGTGAGCCGAGATCGCGCCACTGCACTCCAGCCTGGG\n\
CGACAGAGCGAGACTCCGTCTCAAAAAGGCCGGGCGCGGTGGCTCACGCCTGTAATCCCA\n\
GCACTTTGGGAGGCCGAGGCGGGCGGATCACCTGAGGTCAGGAGTTCGAGACCAGCCTGG\n\
CCAACATGGTGAAACCCCGTCTCTACTAAAAATACAAAAATTAGCCGGGCGTGGTGGCGC\n\
GCGCCTGTAATCCCAGCTACTCGGGAGGCTGAGGCAGGAGAATCGCTTGAACCCGGGAGG\n\
CGGAGGTTGCAGTGAGCCGAGATCGCGCCACTGCACTCCAGCCTGGGCGACAGAGCGAGA\n\
CTCCGTCTCAAAAAGGCCGGGCGCGGTGGCTCACGCCTGTAATCCCAGCACTTTGGGAGG\n\
CCGAGGCGGGCGGATCACCTGAGGTCAGGAGTTCGAGACCAGCCTGGCCAACATGGTGAA\n\
ACCCCGTCTCTACTAAAAATACAAAAATTAGCCGGGCGTGGTGGCGCGCGCCTGTAATCC\n\
CAGCTACTCGGGAGGCTGAGGCAGGAGAATCGCTTGAACCCGGGAGGCGGAGGTTGCAGT\n\
GAGCCGAGATCGCGCCACTGCACTCCAGCCTGGGCGACAGAGCGAGACTCCGTCTCAAAA\n\
AGGCCGGGCGCGGTGGCTCACGCCTGTAATCCCAGCACTTTGGGAGGCCGAGGCGGGCGG\n\
ATCACCTGAGGTCAGGAGTTCGAGACCAGCCTGGCCAACATGGTGAAACCCCGTCTCTAC\n\
TAAAAATACAAAAATTAGCCGGGCGTGGTGGCGCGCGCCTGTAATCCCAGCTACTCGGGA\n\
GGCTGAGGCAGGAGAATCGCTTGAACCCGGGAGGCGGAGGTTGCAGTGAGCCGAGATCGC\n\
GCCACTGCACTCCAGCCTGGGCGACAGAGCGAGACTCCGTCTCAAAAAGGCCGGGCGCGG\n\
TGGCTCACGCCTGTAATCCCAGCACTTTGGGAGGCCGAGGCGGGCGGATCACCTGAGGTC\n\
AGGAGTTCGAGACCAGCCTGGCCAACATGGTGAAACCCCGTCTCTACTAAAAATACAAAA\n\
ATTAGCCGGGCGTGGTGGCGCGCGCCTGTAATCCCAGCTACTCGGGAGGCTGAGGCAGGA\n\
GAATCGCTTGAACCCGGGAGGCGGAGGTTGCAGTGAGCCGAGATCGCGCCACTGCACTCC\n\
AGCCTGGGCGACAGAGCGAGACTCCGTCTCAAAAAGGCCGGGCGCGGTGGCTCACGCCTG\n\
TAATCCCAGCACTTTGGGAGGCCGAGGCGGGCGGATCACCTGAGGTCAGGAGTTCGAGAC\n\
CAGCCTGGCCAACATGGTGAAACCCCGTCTCTACTAAAAATACAAAAATTAGCCGGGCGT\n\
GGTGGCGCGCGCCTGTAATCCCAGCTACTCGGGAGGCTGAGGCAGGAGAATCGCTTGAAC\n\
CCGGGAGGCGGAGGTTGCAGTGAGCCGAGATCGCGCCACTGCACTCCAGCCTGGGCGACA\n\
GAGCGAGACTCCGTCTCAAAAAGGCCGGGCGCGGTGGCTCACGCCTGTAATCCCAGCACT\n\
TTGGGAGGCCGAGGCGGGCGGATCACCTGAGGTCAGGAGTTCGAGACCAGCCTGGCCAAC\n\
ATGGTGAAACCCCGTCTCTACTAAAAATACAAAAATTAGCCGGGCGTGGTGGCGCGCGCC\n\
TGTAATCCCAGCTACTCGGGAGGCTGAGGCAGGAGAATCGCTTGAACCCGGGAGGCGGAG\n\
GTTGCAGTGAGCCGAGATCGCGCCACTGCACTCCAGCCTGGGCGACAGAGCGAGACTCCG\n\
TCTCAAAAAGGCCGGGCGCGGTGGCTCACGCCTGTAATCCCAGCACTTTGGGAGGCCGAG\n\
GCGGGCGGATCACCTGAGGTCAGGAGTTCGAGACCAGCCTGGCCAACATGGTGAAACCCC\n\
GTCTCTACTAAAAATACAAAAATTAGCCGGGCGTGGTGGCGCGCGCCTGTAATCCCAGCT\n\
ACTCGGGAGGCTGAGGCAGGAGAATCGCTTGAACCCGGGAGGCGGAGGTTGCAGTGAGCC\n\
GAGATCGCGCCACTGCACTCCAGCCTGGGCGACAGAGCGAGACTCCGTCTCAAAAAGGCC\n\
GGGCGCGGTGGCTCACGCCTGTAATCCCAGCACTTTGGGAGGCCGAGGCGGGCGGATCAC\n\
CTGAGGTCAGGAGTTCGAGACCAGCCTGGCCAACATGGTGAAACCCCGTCTCTACTAAAA\n\
ATACAAAAATTAGCCGGGCGTGGTGGCGCGCGCCTGTAATCCCAGCTACTCGGGAGGCTG\n\
AGGCAGGAGAATCGCTTGAACCCGGGAGGCGGAGGTTGCAGTGAGCCGAGATCGCGCCAC\n\
TGCACTCCAGCCTGGGCGACAGAGCGAGACTCCGTCTCAAAAAGGCCGGGCGCGGTGGCT\n\
CACGCCTGTAATCCCAGCACTTTGGGAGGCCGAGGCGGGCGGATCACCTGAGGTCAGGAG\n\
TTCGAGACCAGCCTGGCCAACATGGTGAAACCCCGTCTCTACTAAAAATACAAAAATTAG\n\
CCGGGCGTGGTGGCGCGCGCCTGTAATCCCAGCTACTCGGGAGGCTGAGGCAGGAGAATC\n\
GCTTGAACCCGGGAGGCGGAGGTTGCAGTGAGCCGAGATCGCGCCACTGCACTCCAGCCT\n\
GGGCGACAGAGCGAGACTCCGTCTCAAAAAGGCCGGGCGCGGTGGCTCACGCCTGTAATC\n\
CCAGCACTTTGGGAGGCCGAGGCGGGCGGATCACCTGAGGTCAGGAGTTCGAGACCAGCC\n\
TGGCCAACATGGTGAAACCCCGTCTCTACTAAAAATACAAAAATTAGCCGGGCGTGGTGG\n\
CGCGCGCCTGTAATCCCAGCTACTCGGGAGGCTGAGGCAGGAGAATCGCTTGAACCCGGG\n\
AGGCGGAGGTTGCAGTGAGCCGAGATCGCGCCACTGCACTCCAGCCTGGGCGACAGAGCG\n\
AGACTCCGTCTCAAAAAGGCCGGGCGCGGTGGCTCACGCCTGTAATCCCAGCACTTTGGG\n\
AGGCCGAGGCGGGCGGATCACCTGAGGTCAGGAGTTCGAGACCAGCCTGGCCAACATGGT\n\
GAAACCCCGTCTCTACTAAAAATACAAAAATTAGCCGGGCGTGGTGGCGCGCGCCTGTAA\n\
TCCCAGCTACTCGGGAGGCTGAGGCAGGAGAATCGCTTGAACCCGGGAGGCGGAGGTTGC\n\
AGTGAGCCGAGATCGCGCCACTGCACTCCAGCCTGGGCGACAGAGCGAGACTCCGTCTCA\n\
AAAAGGCCGGGCGCGGTGGCTCACGCCTGTAATCCCAGCACTTTGGGAGGCCGAGGCGGG\n\
CGGATCACCTGAGGTCAGGAGTTCGAGACCAGCCTGGCCAACATGGTGAAACCCCGTCTC\n\
TACTAAAAATACAAAAATTAGCCGGGCGTGGTGGCGCGCGCCTGTAATCCCAGCTACTCG\n\
GGAGGCTGAGGCAGGAGAATCGCTTGAACCCGGGAGGCGGAGGTTGCAGTGAGCCGAGAT\n\
CGCGCCACTGCACTCCAGCCTGGGCGACAGAGCGAGACTCCGTCTCAAAAAGGCCGGGCG\n\
CGGTGGCTCACGCCTGTAATCCCAGCACTTTGGGAGGCCGAGGCGGGCGGATCACCTGAG\n\
GTCAGGAGTTCGAGACCAGCCTGGCCAACATGGTGAAACCCCGTCTCTACTAAAAATACA\n\
AAAATTAGCCGGGCGTGGTGGCGCGCGCCTGTAATCCCAGCTACTCGGGAGGCTGAGGCA\n\
GGAGAATCGCTTGAACCCGGGAGGCGGAGGTTGCAGTGAGCCGAGATCGCGCCACTGCAC\n\
TCCAGCCTGGGCGACAGAGCGAGACTCCGTCTCAAAAAGGCCGGGCGCGGTGGCTCACGC\n\
CTGTAATCCCAGCACTTTGGGAGGCCGAGGCGGGCGGATCACCTGAGGTCAGGAGTTCGA\n\
GACCAGCCTGGCCAACATGGTGAAACCCCGTCTCTACTAAAAATACAAAAATTAGCCGGG\n\
CGTGGTGGCGCGCGCCTGTAATCCCAGCTACTCGGGAGGCTGAGGCAGGAGAATCGCTTG\n\
AACCCGGGAGGCGGAGGTTGCAGTGAGCCGAGATCGCGCCACTGCACTCCAGCCTGGGCG\n\
ACAGAGCGAGACTCCGTCTCAAAAAGGCCGGGCGCGGTGGCTCACGCCTGTAATCCCAGC\n\
ACTTTGGGAGGCCGAGGCGGGCGGATCACCTGAGGTCAGGAGTTCGAGACCAGCCTGGCC\n\
AACATGGTGAAACCCCGTCTCTACTAAAAATACAAAAATTAGCCGGGCGTGGTGGCGCGC\n\
GCCTGTAATCCCAGCTACTCGGGAGGCTGAGGCAGGAGAATCGCTTGAACCCGGGAGGCG\n\
GAGGTTGCAGTGAGCCGAGATCGCGCCACTGCACTCCAGCCTGGGCGACAGAGCGAGACT\n\
CCGTCTCAAAAAGGCCGGGCGCGGTGGCTCACGCCTGTAATCCCAGCACTTTGGGAGGCC\n\
GAGGCGGGCGGATCACCTGAGGTCAGGAGTTCGAGACCAGCCTGGCCAACATGGTGAAAC\n\
CCCGTCTCTACTAAAAATACAAAAATTAGCCGGGCGTGGTGGCGCGCGCCTGTAATCCCA\n\
GCTACTCGGGAGGCTGAGGCAGGAGAATCGCTTGAACCCGGGAGGCGGAGGTTGCAGTGA\n\
GCCGAGATCGCGCCACTGCACTCCAGCCTGGGCGACAGAGCGAGACTCCGTCTCAAAAAG\n\
GCCGGGCGCGGTGGCTCACGCCTGTAATCCCAGCACTTTGGGAGGCCGAGGCGGGCGGAT\n\
CACCTGAGGTCAGGAGTTCGAGACCAGCCTGGCCAACATGGTGAAACCCCGTCTCTACTA\n\
AAAATACAAAAATTAGCCGGGCGTGGTGGCGCGCGCCTGTAATCCCAGCTACTCGGGAGG\n\
CTGAGGCAGGAGAATCGCTTGAACCCGGGAGGCGGAGGTTGCAGTGAGCCGAGATCGCGC\n\
CACTGCACTCCAGCCTGGGCGACAGAGCGAGACTCCGTCTCAAAAAGGCCGGGCGCGGTG\n\
GCTCACGCCTGTAATCCCAGCACTTTGGGAGGCCGAGGCGGGCGGATCACCTGAGGTCAG\n\
GAGTTCGAGACCAGCCTGGCCAACATGGTGAAACCCCGTCTCTACTAAAAATACAAAAAT\n\
TAGCCGGGCGTGGTGGCGCGCGCCTGTAATCCCAGCTACTCGGGAGGCTGAGGCAGGAGA\n\
ATCGCTTGAACCCGGGAGGCGGAGGTTGCAGTGAGCCGAGATCGCGCCACTGCACTCCAG\n\
CCTGGGCGACAGAGCGAGACTCCGTCTCAAAAAGGCCGGGCGCGGTGGCTCACGCCTGTA\n\
ATCCCAGCACTTTGGGAGGCCGAGGCGGGCGGATCACCTGAGGTCAGGAGTTCGAGACCA\n\
GCCTGGCCAACATGGTGAAACCCCGTCTCTACTAAAAATACAAAAATTAGCCGGGCGTGG\n\
TGGCGCGCGCCTGTAATCCCAGCTACTCGGGAGGCTGAGGCAGGAGAATCGCTTGAACCC\n\
GGGAGGCGGAGGTTGCAGTGAGCCGAGATCGCGCCACTGCACTCCAGCCTGGGCGACAGA\n\
GCGAGACTCCGTCTCAAAAAGGCCGGGCGCGGTGGCTCACGCCTGTAATCCCAGCACTTT\n\
GGGAGGCCGAGGCGGGCGGATCACCTGAGGTCAGGAGTTCGAGACCAGCCTGGCCAACAT\n\
GGTGAAACCCCGTCTCTACTAAAAATACAAAAATTAGCCGGGCGTGGTGGCGCGCGCCTG\n\
TAATCCCAGCTACTCGGGAGGCTGAGGCAGGAGAATCGCTTGAACCCGGGAGGCGGAGGT\n\
TGCAGTGAGCCGAGATCGCGCCACTGCACTCCAGCCTGGGCGACAGAGCGAGACTCCGTC\n\
TCAAAAAGGCCGGGCGCGGTGGCTCACGCCTGTAATCCCAGCACTTTGGGAGGCCGAGGC\n\
GGGCGGATCACCTGAGGTCAGGAGTTCGAGACCAGCCTGGCCAACATGGTGAAACCCCGT\n\
CTCTACTAAAAATACAAAAATTAGCCGGGCGTGGTGGCGCGCGCCTGTAATCCCAGCTAC\n\
TCGGGAGGCTGAGGCAGGAGAATCGCTTGAACCCGGGAGGCGGAGGTTGCAGTGAGCCGA\n\
GATCGCGCCACTGCACTCCAGCCTGGGCGACAGAGCGAGACTCCGTCTCAAAAAGGCCGG\n\
GCGCGGTGGCTCACGCCTGTAATCCCAGCACTTTGGGAGGCCGAGGCGGGCGGATCACCT\n\
GAGGTCAGGAGTTCGAGACCAGCCTGGCCAACATGGTGAAACCCCGTCTCTACTAAAAAT\n\
ACAAAAATTAGCCGGGCGTGGTGGCGCGCGCCTGTAATCCCAGCTACTCGGGAGGCTGAG\n\
GCAGGAGAATCGCTTGAACCCGGGAGGCGGAGGTTGCAGTGAGCCGAGATCGCGCCACTG\n\
CACTCCAGCCTGGGCGACAGAGCGAGACTCCGTCTCAAAAAGGCCGGGCGCGGTGGCTCA\n\
CGCCTGTAATCCCAGCACTTTGGGAGGCCGAGGCGGGCGGATCACCTGAGGTCAGGAGTT\n\
CGAGACCAGCCTGGCCAACATGGTGAAACCCCGTCTCTACTAAAAATACAAAAATTAGCC\n\
GGGCGTGGTGGCGCGCGCCTGTAATCCCAGCTACTCGGGAGGCTGAGGCAGGAGAATCGC\n\
TTGAACCCGGGAGGCGGAGGTTGCAGTGAGCCGAGATCGCGCCACTGCACTCCAGCCTGG\n\
GCGACAGAGCGAGACTCCGTCTCAAAAAGGCCGGGCGCGGTGGCTCACGCCTGTAATCCC\n\
AGCACTTTGGGAGGCCGAGGCGGGCGGATCACCTGAGGTCAGGAGTTCGAGACCAGCCTG\n\
GCCAACATGGTGAAACCCCGTCTCTACTAAAAATACAAAAATTAGCCGGGCGTGGTGGCG\n\
CGCGCCTGTAATCCCAGCTACTCGGGAGGCTGAGGCAGGAGAATCGCTTGAACCCGGGAG\n\
GCGGAGGTTGCAGTGAGCCGAGATCGCGCCACTGCACTCCAGCCTGGGCGACAGAGCGAG\n\
ACTCCGTCTCAAAAAGGCCGGGCGCGGTGGCTCACGCCTGTAATCCCAGCACTTTGGGAG\n\
GCCGAGGCGGGCGGATCACCTGAGGTCAGGAGTTCGAGACCAGCCTGGCCAACATGGTGA\n\
AACCCCGTCTCTACTAAAAATACAAAAATTAGCCGGGCGTGGTGGCGCGCGCCTGTAATC\n\
CCAGCTACTCGGGAGGCTGAGGCAGGAGAATCGCTTGAACCCGGGAGGCGGAGGTTGCAG\n\
TGAGCCGAGATCGCGCCACTGCACTCCAGCCTGGGCGACAGAGCGAGACTCCGTCTCAAA\n\
AAGGCCGGGCGCGGTGGCTCACGCCTGTAATCCCAGCACTTTGGGAGGCCGAGGCGGGCG\n\
GATCACCTGAGGTCAGGAGTTCGAGACCAGCCTGGCCAACATGGTGAAACCCCGTCTCTA\n\
CTAAAAATACAAAAATTAGCCGGGCGTGGTGGCGCGCGCCTGTAATCCCAGCTACTCGGG\n\
AGGCTGAGGCAGGAGAATCGCTTGAACCCGGGAGGCGGAGGTTGCAGTGAGCCGAGATCG\n\
CGCCACTGCACTCCAGCCTGGGCGACAGAGCGAGACTCCGTCTCAAAAAGGCCGGGCGCG\n\
GTGGCTCACGCCTGTAATCCCAGCACTTTGGGAGGCCGAGGCGGGCGGATCACCTGAGGT\n\
CAGGAGTTCGAGACCAGCCTGGCCAACATGGTGAAACCCCGTCTCTACTAAAAATACAAA\n\
AATTAGCCGGGCGTGGTGGCGCGCGCCTGTAATCCCAGCTACTCGGGAGGCTGAGGCAGG\n\
AGAATCGCTTGAACCCGGGAGGCGGAGGTTGCAGTGAGCCGAGATCGCGCCACTGCACTC\n\
CAGCCTGGGCGACAGAGCGAGACTCCGTCTCAAAAAGGCCGGGCGCGGTGGCTCACGCCT\n\
GTAATCCCAGCACTTTGGGAGGCCGAGGCGGGCGGATCACCTGAGGTCAGGAGTTCGAGA\n\
CCAGCCTGGCCAACATGGTGAAACCCCGTCTCTACTAAAAATACAAAAATTAGCCGGGCG\n\
TGGTGGCGCGCGCCTGTAATCCCAGCTACTCGGGAGGCTGAGGCAGGAGAATCGCTTGAA\n\
CCCGGGAGGCGGAGGTTGCAGTGAGCCGAGATCGCGCCACTGCACTCCAGCCTGGGCGAC\n\
AGAGCGAGACTCCGTCTCAAAAAGGCCGGGCGCGGTGGCTCACGCCTGTAATCCCAGCAC\n\
TTTGGGAGGCCGAGGCGGGCGGATCACCTGAGGTCAGGAGTTCGAGACCAGCCTGGCCAA\n\
CATGGTGAAACCCCGTCTCTACTAAAAATACAAAAATTAGCCGGGCGTGGTGGCGCGCGC\n\
CTGTAATCCCAGCTACTCGGGAGGCTGAGGCAGGAGAATCGCTTGAACCCGGGAGGCGGA\n\
GGTTGCAGTGAGCCGAGATCGCGCCACTGCACTCCAGCCTGGGCGACAGAGCGAGACTCC\n\
GTCTCAAAAAGGCCGGGCGCGGTGGCTCACGCCTGTAATCCCAGCACTTTGGGAGGCCGA\n\
GGCGGGCGGATCACCTGAGGTCAGGAGTTCGAGACCAGCCTGGCCAACATGGTGAAACCC\n\
CGTCTCTACTAAAAATACAAAAATTAGCCGGGCGTGGTGGCGCGCGCCTGTAATCCCAGC\n\
TACTCGGGAGGCTGAGGCAGGAGAATCGCTTGAACCCGGGAGGCGGAGGTTGCAGTGAGC\n\
CGAGATCGCGCCACTGCACTCCAGCCTGGGCGACAGAGCGAGACTCCGTCTCAAAAAGGC\n\
CGGGCGCGGTGGCTCACGCCTGTAATCCCAGCACTTTGGGAGGCCGAGGCGGGCGGATCA\n\
CCTGAGGTCAGGAGTTCGAGACCAGCCTGGCCAACATGGTGAAACCCCGTCTCTACTAAA\n\
AATACAAAAATTAGCCGGGCGTGGTGGCGCGCGCCTGTAATCCCAGCTACTCGGGAGGCT\n\
GAGGCAGGAGAATCGCTTGAACCCGGGAGGCGGAGGTTGCAGTGAGCCGAGATCGCGCCA\n\
CTGCACTCCAGCCTGGGCGACAGAGCGAGACTCCGTCTCAAAAAGGCCGGGCGCGGTGGC\n\
TCACGCCTGTAATCCCAGCACTTTGGGAGGCCGAGGCGGGCGGATCACCTGAGGTCAGGA\n\
GTTCGAGACCAGCCTGGCCAACATGGTGAAACCCCGTCTCTACTAAAAATACAAAAATTA\n\
GCCGGGCGTGGTGGCGCGCGCCTGTAATCCCAGCTACTCGGGAGGCTGAGGCAGGAGAAT\n\
CGCTTGAACCCGGGAGGCGGAGGTTGCAGTGAGCCGAGATCGCGCCACTGCACTCCAGCC\n\
TGGGCGACAGAGCGAGACTCCGTCTCAAAAAGGCCGGGCGCGGTGGCTCACGCCTGTAAT\n\
CCCAGCACTTTGGGAGGCCGAGGCGGGCGGATCACCTGAGGTCAGGAGTTCGAGACCAGC\n\
CTGGCCAACATGGTGAAACCCCGTCTCTACTAAAAATACAAAAATTAGCCGGGCGTGGTG\n\
GCGCGCGCCTGTAATCCCAGCTACTCGGGAGGCTGAGGCAGGAGAATCGCTTGAACCCGG\n\
GAGGCGGAGGTTGCAGTGAGCCGAGATCGCGCCACTGCACTCCAGCCTGGGCGACAGAGC\n\
GAGACTCCGTCTCAAAAAGGCCGGGCGCGGTGGCTCACGCCTGTAATCCCAGCACTTTGG\n\
GAGGCCGAGGCGGGCGGATCACCTGAGGTCAGGAGTTCGAGACCAGCCTGGCCAACATGG\n\
TGAAACCCCGTCTCTACTAAAAATACAAAAATTAGCCGGGCGTGGTGGCGCGCGCCTGTA\n\
ATCCCAGCTACTCGGGAGGCTGAGGCAGGAGAATCGCTTGAACCCGGGAGGCGGAGGTTG\n\
CAGTGAGCCGAGATCGCGCCACTGCACTCCAGCCTGGGCGACAGAGCGAGACTCCGTCTC\n\
AAAAAGGCCGGGCGCGGTGGCTCACGCCTGTAATCCCAGCACTTTGGGAGGCCGAGGCGG\n\
GCGGATCACCTGAGGTCAGGAGTTCGAGACCAGCCTGGCCAACATGGTGAAACCCCGTCT\n\
CTACTAAAAATACAAAAATTAGCCGGGCGTGGTGGCGCGCGCCTGTAATCCCAGCTACTC\n\
GGGAGGCTGAGGCAGGAGAATCGCTTGAACCCGGGAGGCGGAGGTTGCAGTGAGCCGAGA\n\
TCGCGCCACTGCACTCCAGCCTGGGCGACAGAGCGAGACTCCGTCTCAAAAAGGCCGGGC\n\
GCGGTGGCTCACGCCTGTAATCCCAGCACTTTGGGAGGCCGAGGCGGGCGGATCACCTGA\n\
GGTCAGGAGTTCGAGACCAGCCTGGCCAACATGGTGAAACCCCGTCTCTACTAAAAATAC\n\
AAAAATTAGCCGGGCGTGGTGGCGCGCGCCTGTAATCCCAGCTACTCGGGAGGCTGAGGC\n\
AGGAGAATCGCTTGAACCCGGGAGGCGGAGGTTGCAGTGAGCCGAGATCGCGCCACTGCA\n\
CTCCAGCCTGGGCGACAGAGCGAGACTCCGTCTCAAAAAGGCCGGGCGCGGTGGCTCACG\n\
CCTGTAATCCCAGCACTTTGGGAGGCCGAGGCGGGCGGATCACCTGAGGTCAGGAGTTCG\n\
AGACCAGCCTGGCCAACATGGTGAAACCCCGTCTCTACTAAAAATACAAAAATTAGCCGG\n\
GCGTGGTGGCGCGCGCCTGTAATCCCAGCTACTCGGGAGGCTGAGGCAGGAGAATCGCTT\n\
GAACCCGGGAGGCGGAGGTTGCAGTGAGCCGAGATCGCGCCACTGCACTCCAGCCTGGGC\n\
GACAGAGCGAGACTCCGTCTCAAAAAGGCCGGGCGCGGTGGCTCACGCCTGTAATCCCAG\n\
CACTTTGGGAGGCCGAGGCGGGCGGATCACCTGAGGTCAGGAGTTCGAGACCAGCCTGGC\n\
CAACATGGTGAAACCCCGTCTCTACTAAAAATACAAAAATTAGCCGGGCGTGGTGGCGCG\n\
CGCCTGTAATCCCAGCTACTCGGGAGGCTGAGGCAGGAGAATCGCTTGAACCCGGGAGGC\n\
GGAGGTTGCAGTGAGCCGAGATCGCGCCACTGCACTCCAGCCTGGGCGACAGAGCGAGAC\n\
TCCGTCTCAAAAAGGCCGGGCGCGGTGGCTCACGCCTGTAATCCCAGCACTTTGGGAGGC\n\
CGAGGCGGGCGGATCACCTGAGGTCAGGAGTTCGAGACCAGCCTGGCCAACATGGTGAAA\n\
CCCCGTCTCTACTAAAAATACAAAAATTAGCCGGGCGTGGTGGCGCGCGCCTGTAATCCC\n\
AGCTACTCGGGAGGCTGAGGCAGGAGAATCGCTTGAACCCGGGAGGCGGAGGTTGCAGTG\n\
AGCCGAGATCGCGCCACTGCACTCCAGCCTGGGCGACAGAGCGAGACTCCGTCTCAAAAA\n\
GGCCGGGCGCGGTGGCTCACGCCTGTAATCCCAGCACTTTGGGAGGCCGAGGCGGGCGGA\n\
TCACCTGAGGTCAGGAGTTCGAGACCAGCCTGGCCAACATGGTGAAACCCCGTCTCTACT\n\
AAAAATACAAAAATTAGCCGGGCGTGGTGGCGCGCGCCTGTAATCCCAGCTACTCGGGAG\n\
GCTGAGGCAGGAGAATCGCTTGAACCCGGGAGGCGGAGGTTGCAGTGAGCCGAGATCGCG\n\
CCACTGCACTCCAGCCTGGGCGACAGAGCGAGACTCCGTCTCAAAAAGGCCGGGCGCGGT\n\
GGCTCACGCCTGTAATCCCAGCACTTTGGGAGGCCGAGGCGGGCGGATCACCTGAGGTCA\n\
GGAGTTCGAGACCAGCCTGGCCAACATGGTGAAACCCCGTCTCTACTAAAAATACAAAAA\n\
TTAGCCGGGCGTGGTGGCGCGCGCCTGTAATCCCAGCTACTCGGGAGGCTGAGGCAGGAG\n\
AATCGCTTGAACCCGGGAGGCGGAGGTTGCAGTGAGCCGAGATCGCGCCACTGCACTCCA\n\
GCCTGGGCGACAGAGCGAGACTCCGTCTCAAAAAGGCCGGGCGCGGTGGCTCACGCCTGT\n\
AATCCCAGCACTTTGGGAGGCCGAGGCGGGCGGATCACCTGAGGTCAGGAGTTCGAGACC\n\
AGCCTGGCCAACATGGTGAAACCCCGTCTCTACTAAAAATACAAAAATTAGCCGGGCGTG\n\
GTGGCGCGCGCCTGTAATCCCAGCTACTCGGGAGGCTGAGGCAGGAGAATCGCTTGAACC\n\
CGGGAGGCGGAGGTTGCAGTGAGCCGAGATCGCGCCACTGCACTCCAGCCTGGGCGACAG\n\
AGCGAGACTCCGTCTCAAAAAGGCCGGGCGCGGTGGCTCACGCCTGTAATCCCAGCACTT\n\
TGGGAGGCCGAGGCGGGCGGATCACCTGAGGTCAGGAGTTCGAGACCAGCCTGGCCAACA\n\
TGGTGAAACCCCGTCTCTACTAAAAATACAAAAATTAGCCGGGCGTGGTGGCGCGCGCCT\n\
GTAATCCCAGCTACTCGGGAGGCTGAGGCAGGAGAATCGCTTGAACCCGGGAGGCGGAGG\n\
TTGCAGTGAGCCGAGATCGCGCCACTGCACTCCAGCCTGGGCGACAGAGCGAGACTCCGT\n\
CTCAAAAAGGCCGGGCGCGGTGGCTCACGCCTGTAATCCCAGCACTTTGGGAGGCCGAGG\n\
CGGGCGGATCACCTGAGGTCAGGAGTTCGAGACCAGCCTGGCCAACATGGTGAAACCCCG\n\
TCTCTACTAAAAATACAAAAATTAGCCGGGCGTGGTGGCGCGCGCCTGTAATCCCAGCTA\n\
CTCGGGAGGCTGAGGCAGGAGAATCGCTTGAACCCGGGAGGCGGAGGTTGCAGTGAGCCG\n\
AGATCGCGCCACTGCACTCCAGCCTGGGCGACAGAGCGAGACTCCGTCTCAAAAAGGCCG\n\
GGCGCGGTGGCTCACGCCTGTAATCCCAGCACTTTGGGAGGCCGAGGCGGGCGGATCACC\n\
TGAGGTCAGGAGTTCGAGACCAGCCTGGCCAACATGGTGAAACCCCGTCTCTACTAAAAA\n\
TACAAAAATTAGCCGGGCGTGGTGGCGCGCGCCTGTAATCCCAGCTACTCGGGAGGCTGA\n\
GGCAGGAGAATCGCTTGAACCCGGGAGGCGGAGGTTGCAGTGAGCCGAGATCGCGCCACT\n\
GCACTCCAGCCTGGGCGACAGAGCGAGACTCCGTCTCAAAAAGGCCGGGCGCGGTGGCTC\n\
ACGCCTGTAATCCCAGCACTTTGGGAGGCCGAGGCGGGCGGATCACCTGAGGTCAGGAGT\n\
TCGAGACCAGCCTGGCCAACATGGTGAAACCCCGTCTCTACTAAAAATACAAAAATTAGC\n\
CGGGCGTGGTGGCGCGCGCCTGTAATCCCAGCTACTCGGGAGGCTGAGGCAGGAGAATCG\n\
CTTGAACCCGGGAGGCGGAGGTTGCAGTGAGCCGAGATCGCGCCACTGCACTCCAGCCTG\n\
GGCGACAGAGCGAGACTCCGTCTCAAAAAGGCCGGGCGCGGTGGCTCACGCCTGTAATCC\n\
CAGCACTTTGGGAGGCCGAGGCGGGCGGATCACCTGAGGTCAGGAGTTCGAGACCAGCCT\n\
GGCCAACATGGTGAAACCCCGTCTCTACTAAAAATACAAAAATTAGCCGGGCGTGGTGGC\n\
GCGCGCCTGTAATCCCAGCTACTCGGGAGGCTGAGGCAGGAGAATCGCTTGAACCCGGGA\n\
GGCGGAGGTTGCAGTGAGCCGAGATCGCGCCACTGCACTCCAGCCTGGGCGACAGAGCGA\n\
GACTCCGTCTCAAAAAGGCCGGGCGCGGTGGCTCACGCCTGTAATCCCAGCACTTTGGGA\n\
GGCCGAGGCGGGCGGATCACCTGAGGTCAGGAGTTCGAGACCAGCCTGGCCAACATGGTG\n\
AAACCCCGTCTCTACTAAAAATACAAAAATTAGCCGGGCGTGGTGGCGCGCGCCTGTAAT\n\
CCCAGCTACTCGGGAGGCTGAGGCAGGAGAATCGCTTGAACCCGGGAGGCGGAGGTTGCA\n\
GTGAGCCGAGATCGCGCCACTGCACTCCAGCCTGGGCGACAGAGCGAGACTCCGTCTCAA\n\
AAAGGCCGGGCGCGGTGGCTCACGCCTGTAATCCCAGCACTTTGGGAGGCCGAGGCGGGC\n\
GGATCACCTGAGGTCAGGAGTTCGAGACCAGCCTGGCCAACATGGTGAAACCCCGTCTCT\n\
ACTAAAAATACAAAAATTAGCCGGGCGTGGTGGCGCGCGCCTGTAATCCCAGCTACTCGG\n\
GAGGCTGAGGCAGGAGAATC\n\
>TWO IUB ambiguity codes\n\
cttBtatcatatgctaKggNcataaaSatgtaaaDcDRtBggDtctttataattcBgtcg\n\
tactDtDagcctatttSVHtHttKtgtHMaSattgWaHKHttttagacatWatgtRgaaa\n\
NtactMcSMtYtcMgRtacttctWBacgaaatatagScDtttgaagacacatagtVgYgt\n\
cattHWtMMWcStgttaggKtSgaYaaccWStcgBttgcgaMttBYatcWtgacaYcaga\n\
gtaBDtRacttttcWatMttDBcatWtatcttactaBgaYtcttgttttttttYaaScYa\n\
HgtgttNtSatcMtcVaaaStccRcctDaataataStcYtRDSaMtDttgttSagtRRca\n\
tttHatSttMtWgtcgtatSSagactYaaattcaMtWatttaSgYttaRgKaRtccactt\n\
tattRggaMcDaWaWagttttgacatgttctacaaaRaatataataaMttcgDacgaSSt\n\
acaStYRctVaNMtMgtaggcKatcttttattaaaaagVWaHKYagtttttatttaacct\n\
tacgtVtcVaattVMBcttaMtttaStgacttagattWWacVtgWYagWVRctDattBYt\n\
gtttaagaagattattgacVatMaacattVctgtBSgaVtgWWggaKHaatKWcBScSWa\n\
accRVacacaaactaccScattRatatKVtactatatttHttaagtttSKtRtacaaagt\n\
RDttcaaaaWgcacatWaDgtDKacgaacaattacaRNWaatHtttStgttattaaMtgt\n\
tgDcgtMgcatBtgcttcgcgaDWgagctgcgaggggVtaaScNatttacttaatgacag\n\
cccccacatYScaMgtaggtYaNgttctgaMaacNaMRaacaaacaKctacatagYWctg\n\
ttWaaataaaataRattagHacacaagcgKatacBttRttaagtatttccgatctHSaat\n\
actcNttMaagtattMtgRtgaMgcataatHcMtaBSaRattagttgatHtMttaaKagg\n\
YtaaBataSaVatactWtataVWgKgttaaaacagtgcgRatatacatVtHRtVYataSa\n\
KtWaStVcNKHKttactatccctcatgWHatWaRcttactaggatctataDtDHBttata\n\
aaaHgtacVtagaYttYaKcctattcttcttaataNDaaggaaaDYgcggctaaWSctBa\n\
aNtgctggMBaKctaMVKagBaactaWaDaMaccYVtNtaHtVWtKgRtcaaNtYaNacg\n\
gtttNattgVtttctgtBaWgtaattcaagtcaVWtactNggattctttaYtaaagccgc\n\
tcttagHVggaYtgtNcDaVagctctctKgacgtatagYcctRYHDtgBattDaaDgccK\n\
tcHaaStttMcctagtattgcRgWBaVatHaaaataYtgtttagMDMRtaataaggatMt\n\
ttctWgtNtgtgaaaaMaatatRtttMtDgHHtgtcattttcWattRSHcVagaagtacg\n\
ggtaKVattKYagactNaatgtttgKMMgYNtcccgSKttctaStatatNVataYHgtNa\n\
BKRgNacaactgatttcctttaNcgatttctctataScaHtataRagtcRVttacDSDtt\n\
aRtSatacHgtSKacYagttMHtWataggatgactNtatSaNctataVtttRNKtgRacc\n\
tttYtatgttactttttcctttaaacatacaHactMacacggtWataMtBVacRaSaatc\n\
cgtaBVttccagccBcttaRKtgtgcctttttRtgtcagcRttKtaaacKtaaatctcac\n\
aattgcaNtSBaaccgggttattaaBcKatDagttactcttcattVtttHaaggctKKga\n\
tacatcBggScagtVcacattttgaHaDSgHatRMaHWggtatatRgccDttcgtatcga\n\
aacaHtaagttaRatgaVacttagattVKtaaYttaaatcaNatccRttRRaMScNaaaD\n\
gttVHWgtcHaaHgacVaWtgttScactaagSgttatcttagggDtaccagWattWtRtg\n\
ttHWHacgattBtgVcaYatcggttgagKcWtKKcaVtgaYgWctgYggVctgtHgaNcV\n\
taBtWaaYatcDRaaRtSctgaHaYRttagatMatgcatttNattaDttaattgttctaa\n\
ccctcccctagaWBtttHtBccttagaVaatMcBHagaVcWcagBVttcBtaYMccagat\n\
gaaaaHctctaacgttagNWRtcggattNatcRaNHttcagtKttttgWatWttcSaNgg\n\
gaWtactKKMaacatKatacNattgctWtatctaVgagctatgtRaHtYcWcttagccaa\n\
tYttWttaWSSttaHcaaaaagVacVgtaVaRMgattaVcDactttcHHggHRtgNcctt\n\
tYatcatKgctcctctatVcaaaaKaaaagtatatctgMtWtaaaacaStttMtcgactt\n\
taSatcgDataaactaaacaagtaaVctaggaSccaatMVtaaSKNVattttgHccatca\n\
cBVctgcaVatVttRtactgtVcaattHgtaaattaaattttYtatattaaRSgYtgBag\n\
aHSBDgtagcacRHtYcBgtcacttacactaYcgctWtattgSHtSatcataaatataHt\n\
cgtYaaMNgBaatttaRgaMaatatttBtttaaaHHKaatctgatWatYaacttMctctt\n\
ttVctagctDaaagtaVaKaKRtaacBgtatccaaccactHHaagaagaaggaNaaatBW\n\
attccgStaMSaMatBttgcatgRSacgttVVtaaDMtcSgVatWcaSatcttttVatag\n\
ttactttacgatcaccNtaDVgSRcgVcgtgaacgaNtaNatatagtHtMgtHcMtagaa\n\
attBgtataRaaaacaYKgtRccYtatgaagtaataKgtaaMttgaaRVatgcagaKStc\n\
tHNaaatctBBtcttaYaBWHgtVtgacagcaRcataWctcaBcYacYgatDgtDHccta\n\
aagacYRcaggattHaYgtKtaatgcVcaataMYacccatatcacgWDBtgaatcBaata\n\
cKcttRaRtgatgaBDacggtaattaaYtataStgVHDtDctgactcaaatKtacaatgc\n\
gYatBtRaDatHaactgtttatatDttttaaaKVccYcaaccNcBcgHaaVcattHctcg\n\
attaaatBtatgcaaaaatYMctSactHatacgaWacattacMBgHttcgaatVaaaaca\n\
BatatVtctgaaaaWtctRacgBMaatSgRgtgtcgactatcRtattaScctaStagKga\n\
DcWgtYtDDWKRgRtHatRtggtcgaHgggcgtattaMgtcagccaBggWVcWctVaaat\n\
tcgNaatcKWagcNaHtgaaaSaaagctcYctttRVtaaaatNtataaccKtaRgtttaM\n\
tgtKaBtRtNaggaSattHatatWactcagtgtactaKctatttgRYYatKatgtccgtR\n\
tttttatttaatatVgKtttgtatgtNtataRatWYNgtRtHggtaaKaYtKSDcatcKg\n\
taaYatcSRctaVtSMWtVtRWHatttagataDtVggacagVcgKWagBgatBtaaagNc\n\
aRtagcataBggactaacacRctKgttaatcctHgDgttKHHagttgttaatgHBtatHc\n\
DaagtVaBaRccctVgtgDtacRHSctaagagcggWYaBtSaKtHBtaaactYacgNKBa\n\
VYgtaacttagtVttcttaatgtBtatMtMtttaattaatBWccatRtttcatagVgMMt\n\
agctStKctaMactacDNYgKYHgaWcgaHgagattacVgtttgtRaSttaWaVgataat\n\
gtgtYtaStattattMtNgWtgttKaccaatagNYttattcgtatHcWtctaaaNVYKKt\n\
tWtggcDtcgaagtNcagatacgcattaagaccWctgcagcttggNSgaNcHggatgtVt\n\
catNtRaaBNcHVagagaaBtaaSggDaatWaatRccaVgggStctDaacataKttKatt\n\
tggacYtattcSatcttagcaatgaVBMcttDattctYaaRgatgcattttNgVHtKcYR\n\
aatRKctgtaaacRatVSagctgtWacBtKVatctgttttKcgtctaaDcaagtatcSat\n\
aWVgcKKataWaYttcccSaatgaaaacccWgcRctWatNcWtBRttYaattataaNgac\n\
acaatagtttVNtataNaYtaatRaVWKtBatKagtaatataDaNaaaaataMtaagaaS\n\
tccBcaatNgaataWtHaNactgtcDtRcYaaVaaaaaDgtttRatctatgHtgttKtga\n\
aNSgatactttcgagWaaatctKaaDaRttgtggKKagcDgataaattgSaacWaVtaNM\n\
acKtcaDaaatttctRaaVcagNacaScRBatatctRatcctaNatWgRtcDcSaWSgtt\n\
RtKaRtMtKaatgttBHcYaaBtgatSgaSWaScMgatNtctcctatttctYtatMatMt\n\
RRtSaattaMtagaaaaStcgVgRttSVaScagtgDtttatcatcatacRcatatDctta\n\
tcatVRtttataaHtattcYtcaaaatactttgVctagtaaYttagatagtSYacKaaac\n\
gaaKtaaatagataatSatatgaaatSgKtaatVtttatcctgKHaatHattagaaccgt\n\
YaaHactRcggSBNgtgctaaBagBttgtRttaaattYtVRaaaattgtaatVatttctc\n\
ttcatgBcVgtgKgaHaaatattYatagWacNctgaaMcgaattStagWaSgtaaKagtt\n\
ttaagaDgatKcctgtaHtcatggKttVDatcaaggtYcgccagNgtgcVttttagagat\n\
gctaccacggggtNttttaSHaNtatNcctcatSaaVgtactgBHtagcaYggYVKNgta\n\
KBcRttgaWatgaatVtagtcgattYgatgtaatttacDacSctgctaaaStttaWMagD\n\
aaatcaVYctccgggcgaVtaaWtStaKMgDtttcaaMtVgBaatccagNaaatcYRMBg\n\
gttWtaaScKttMWtYataRaDBMaDataatHBcacDaaKDactaMgagttDattaHatH\n\
taYatDtattDcRNStgaatattSDttggtattaaNSYacttcDMgYgBatWtaMagact\n\
VWttctttgYMaYaacRgHWaattgRtaagcattctMKVStatactacHVtatgatcBtV\n\
NataaBttYtSttacKgggWgYDtgaVtYgatDaacattYgatggtRDaVDttNactaSa\n\
MtgNttaacaaSaBStcDctaccacagacgcaHatMataWKYtaYattMcaMtgSttDag\n\
cHacgatcaHttYaKHggagttccgatYcaatgatRaVRcaagatcagtatggScctata\n\
ttaNtagcgacgtgKaaWaactSgagtMYtcttccaKtStaacggMtaagNttattatcg\n\
tctaRcactctctDtaacWYtgaYaSaagaWtNtatttRacatgNaatgttattgWDDcN\n\
aHcctgaaHacSgaataaRaataMHttatMtgaSDSKatatHHaNtacagtccaYatWtc\n\
actaactatKDacSaStcggataHgYatagKtaatKagStaNgtatactatggRHacttg\n\
tattatgtDVagDVaRctacMYattDgtttYgtctatggtKaRSttRccRtaaccttaga\n\
gRatagSaaMaacgcaNtatgaaatcaRaagataatagatactcHaaYKBctccaagaRa\n\
BaStNagataggcgaatgaMtagaatgtcaKttaaatgtaWcaBttaatRcggtgNcaca\n\
aKtttScRtWtgcatagtttWYaagBttDKgcctttatMggNttattBtctagVtacata\n\
aaYttacacaaRttcYtWttgHcaYYtaMgBaBatctNgcDtNttacgacDcgataaSat\n\
YaSttWtcctatKaatgcagHaVaacgctgcatDtgttaSataaaaYSNttatagtaNYt\n\
aDaaaNtggggacttaBggcHgcgtNtaaMcctggtVtaKcgNacNtatVaSWctWtgaW\n\
cggNaBagctctgaYataMgaagatBSttctatacttgtgtKtaattttRagtDtacata\n\
tatatgatNHVgBMtKtaKaNttDHaagatactHaccHtcatttaaagttVaMcNgHata\n\
tKtaNtgYMccttatcaaNagctggacStttcNtggcaVtattactHaSttatgNMVatt\n\
MMDtMactattattgWMSgtHBttStStgatatRaDaagattttctatMtaaaaaggtac\n\
taaVttaSacNaatactgMttgacHaHRttgMacaaaatagttaatatWKRgacDgaRta\n\
tatttattatcYttaWtgtBRtWatgHaaattHataagtVaDtWaVaWtgStcgtMSgaS\n\
RgMKtaaataVacataatgtaSaatttagtcgaaHtaKaatgcacatcggRaggSKctDc\n\
agtcSttcccStYtccRtctctYtcaaKcgagtaMttttcRaYDttgttatctaatcata\n\
NctctgctatcaMatactataggDaHaaSttMtaDtcNatataattctMcStaaBYtaNa\n\
gatgtaatHagagSttgWHVcttatKaYgDctcttggtgttMcRaVgSgggtagacaata\n\
aDtaattSaDaNaHaBctattgNtaccaaRgaVtKNtaaYggHtaKKgHcatctWtctDt\n\
ttctttggSDtNtaStagttataaacaattgcaBaBWggHgcaaaBtYgctaatgaaatW\n\
cDcttHtcMtWWattBHatcatcaaatctKMagtDNatttWaBtHaaaNgMttaaStagt\n\
tctctaatDtcRVaYttgttMtRtgtcaSaaYVgSWDRtaatagctcagDgcWWaaaBaa\n\
RaBctgVgggNgDWStNaNBKcBctaaKtttDcttBaaggBttgaccatgaaaNgttttt\n\
tttatctatgttataccaaDRaaSagtaVtDtcaWatBtacattaWacttaSgtattggD\n\
gKaaatScaattacgWcagKHaaccaYcRcaRttaDttRtttHgaHVggcttBaRgtccc\n\
tDatKaVtKtcRgYtaKttacgtatBtStaagcaattaagaRgBagSaattccSWYttta\n\
ttVaataNctgHgttaaNBgcVYgtRtcccagWNaaaacaDNaBcaaaaRVtcWMgBagM\n\
tttattacgDacttBtactatcattggaaatVccggttRttcatagttVYcatYaSHaHc\n\
ttaaagcNWaHataaaRWtctVtRYtagHtaaaYMataHYtNBctNtKaatattStgaMc\n\
BtRgctaKtgcScSttDgYatcVtggaaKtaagatWccHccgKYctaNNctacaWctttt\n\
gcRtgtVcgaKttcMRHgctaHtVaataaDtatgKDcttatBtDttggNtacttttMtga\n\
acRattaaNagaactcaaaBBVtcDtcgaStaDctgaaaSgttMaDtcgttcaccaaaag\n\
gWtcKcgSMtcDtatgtttStaaBtatagDcatYatWtaaaBacaKgcaDatgRggaaYc\n\
taRtccagattDaWtttggacBaVcHtHtaacDacYgtaatataMagaatgHMatcttat\n\
acgtatttttatattacHactgttataMgStYaattYaccaattgagtcaaattaYtgta\n\
tcatgMcaDcgggtcttDtKgcatgWRtataatatRacacNRBttcHtBgcRttgtgcgt\n\
catacMtttBctatctBaatcattMttMYgattaaVYatgDaatVagtattDacaacDMa\n\
tcMtHcccataagatgBggaccattVWtRtSacatgctcaaggggYtttDtaaNgNtaaB\n\
atggaatgtctRtaBgBtcNYatatNRtagaacMgagSaSDDSaDcctRagtVWSHtVSR\n\
ggaacaBVaccgtttaStagaacaMtactccagtttVctaaRaaHttNcttagcaattta\n\
ttaatRtaaaatctaacDaBttggSagagctacHtaaRWgattcaaBtctRtSHaNtgta\n\
cattVcaHaNaagtataccacaWtaRtaaVKgMYaWgttaKggKMtKcgWatcaDatYtK\n\
SttgtacgaccNctSaattcDcatcttcaaaDKttacHtggttHggRRaRcaWacaMtBW\n\
VHSHgaaMcKattgtaRWttScNattBBatYtaNRgcggaagacHSaattRtttcYgacc\n\
BRccMacccKgatgaacttcgDgHcaaaaaRtatatDtatYVtttttHgSHaSaatagct\n\
NYtaHYaVYttattNtttgaaaYtaKttWtctaNtgagaaaNctNDctaaHgttagDcRt\n\
tatagccBaacgcaRBtRctRtggtaMYYttWtgataatcgaataattattataVaaaaa\n\
ttacNRVYcaaMacNatRttcKatMctgaagactaattataaYgcKcaSYaatMNctcaa\n\
cgtgatttttBacNtgatDccaattattKWWcattttatatatgatBcDtaaaagttgaa\n\
VtaHtaHHtBtataRBgtgDtaataMttRtDgDcttattNtggtctatctaaBcatctaR\n\
atgNacWtaatgaagtcMNaacNgHttatactaWgcNtaStaRgttaaHacccgaYStac\n\
aaaatWggaYaWgaattattcMaactcBKaaaRVNcaNRDcYcgaBctKaacaaaaaSgc\n\
tccYBBHYaVagaatagaaaacagYtctVccaMtcgtttVatcaatttDRtgWctagtac\n\
RttMctgtDctttcKtWttttataaatgVttgBKtgtKWDaWagMtaaagaaattDVtag\n\
gttacatcatttatgtcgMHaVcttaBtVRtcgtaYgBRHatttHgaBcKaYWaatcNSc\n\
tagtaaaaatttacaatcactSWacgtaatgKttWattagttttNaggtctcaagtcact\n\
attcttctaagKggaataMgtttcataagataaaaatagattatDgcBVHWgaBKttDgc\n\
atRHaagcaYcRaattattatgtMatatattgHDtcaDtcaaaHctStattaatHaccga\n\
cNattgatatattttgtgtDtRatagSacaMtcRtcattcccgacacSattgttKaWatt\n\
NHcaacttccgtttSRtgtctgDcgctcaaMagVtBctBMcMcWtgtaacgactctcttR\n\
ggRKSttgYtYatDccagttDgaKccacgVatWcataVaaagaataMgtgataaKYaaat\n\
cHDaacgataYctRtcYatcgcaMgtNttaBttttgatttaRtStgcaacaaaataccVg\n\
aaDgtVgDcStctatatttattaaaaRKDatagaaagaKaaYYcaYSgKStctccSttac\n\
agtcNactttDVttagaaagMHttRaNcSaRaMgBttattggtttaRMggatggcKDgWR\n\
tNaataataWKKacttcKWaaagNaBttaBatMHtccattaacttccccYtcBcYRtaga\n\
ttaagctaaYBDttaNtgaaaccHcaRMtKtaaHMcNBttaNaNcVcgVttWNtDaBatg\n\
ataaVtcWKcttRggWatcattgaRagHgaattNtatttctctattaattaatgaDaaMa\n\
tacgttgggcHaYVaaNaDDttHtcaaHtcVVDgBVagcMacgtgttaaBRNtatRtcag\n\
taagaggtttaagacaVaaggttaWatctccgtVtaDtcDatttccVatgtacNtttccg\n\
tHttatKgScBatgtVgHtYcWagcaKtaMYaaHgtaattaSaHcgcagtWNaatNccNN\n\
YcacgVaagaRacttctcattcccRtgtgtaattagcSttaaStWaMtctNNcSMacatt\n\
ataaactaDgtatWgtagtttaagaaaattgtagtNagtcaataaatttgatMMYactaa\n\
tatcggBWDtVcYttcDHtVttatacYaRgaMaacaStaatcRttttVtagaDtcacWat\n\
ttWtgaaaagaaagNRacDtttStVatBaDNtaactatatcBSMcccaSttccggaMatg\n\
attaaWatKMaBaBatttgataNctgttKtVaagtcagScgaaaDggaWgtgttttKtWt\n\
atttHaatgtagttcactaaKMagttSYBtKtaYgaactcagagRtatagtVtatcaaaW\n\
YagcgNtaDagtacNSaaYDgatBgtcgataacYDtaaactacagWDcYKaagtttatta\n\
gcatcgagttKcatDaattgattatDtcagRtWSKtcgNtMaaaaacaMttKcaWcaaSV\n\
MaaaccagMVtaMaDtMaHaBgaacataBBVtaatVYaNSWcSgNtDNaaKacacBttta\n\
tKtgtttcaaHaMctcagtaacgtcgYtactDcgcctaNgagagcYgatattttaaattt\n\
ccattttacatttDaaRctattttWctttacgtDatYtttcagacgcaaVttagtaaKaa\n\
aRtgVtccataBggacttatttgtttaWNtgttVWtaWNVDaattgtatttBaagcBtaa\n\
BttaaVatcHcaVgacattccNggtcgacKttaaaRtagRtctWagaYggtgMtataatM\n\
tgaaRttattttgWcttNtDRRgMDKacagaaaaggaaaRStcccagtYccVattaNaaK\n\
StNWtgacaVtagaagcttSaaDtcacaacgDYacWDYtgtttKatcVtgcMaDaSKStV\n\
cgtagaaWaKaagtttcHaHgMgMtctataagBtKaaaKKcactggagRRttaagaBaaN\n\
atVVcgRcKSttDaactagtSttSattgttgaaRYatggttVttaataaHttccaagDtg\n\
atNWtaagHtgcYtaactRgcaatgMgtgtRaatRaNaacHKtagactactggaatttcg\n\
ccataacgMctRgatgttaccctaHgtgWaYcactcacYaattcttaBtgacttaaacct\n\
gYgaWatgBttcttVttcgttWttMcNYgtaaaatctYgMgaaattacNgaHgaacDVVM\n\
tttggtHtctaaRgtacagacgHtVtaBMNBgattagcttaRcttacaHcRctgttcaaD\n\
BggttKaacatgKtttYataVaNattccgMcgcgtagtRaVVaattaKaatggttRgaMc\n\
agtatcWBttNtHagctaatctagaaNaaacaYBctatcgcVctBtgcaaagDgttVtga\n\
HtactSNYtaaNccatgtgDacgaVtDcgKaRtacDcttgctaagggcagMDagggtBWR\n\
tttSgccttttttaacgtcHctaVtVDtagatcaNMaVtcVacatHctDWNaataRgcgt\n\
aVHaggtaaaaSgtttMtattDgBtctgatSgtRagagYtctSaKWaataMgattRKtaa\n\
catttYcgtaacacattRWtBtcggtaaatMtaaacBatttctKagtcDtttgcBtKYYB\n\
aKttctVttgttaDtgattttcttccacttgSaaacggaaaNDaattcYNNaWcgaaYat\n\
tttMgcBtcatRtgtaaagatgaWtgaccaYBHgaatagataVVtHtttVgYBtMctaMt\n\
cctgaDcYttgtccaaaRNtacagcMctKaaaggatttacatgtttaaWSaYaKttBtag\n\
DacactagctMtttNaKtctttcNcSattNacttggaacaatDagtattRtgSHaataat\n\
gccVgacccgatactatccctgtRctttgagaSgatcatatcgDcagWaaHSgctYYWta\n\
tHttggttctttatVattatcgactaagtgtagcatVgtgHMtttgtttcgttaKattcM\n\
atttgtttWcaaStNatgtHcaaaDtaagBaKBtRgaBgDtSagtatMtaacYaatYtVc\n\
KatgtgcaacVaaaatactKcRgtaYtgtNgBBNcKtcttaccttKgaRaYcaNKtactt\n\
tgagSBtgtRagaNgcaaaNcacagtVtttHWatgttaNatBgtttaatNgVtctgaata\n\
tcaRtattcttttttttRaaKcRStctcggDgKagattaMaaaKtcaHacttaataataK\n\
taRgDtKVBttttcgtKaggHHcatgttagHggttNctcgtatKKagVagRaaaggaaBt\n\
NatttVKcRttaHctaHtcaaatgtaggHccaBataNaNaggttgcWaatctgatYcaaa\n\
HaatWtaVgaaBttagtaagaKKtaaaKtRHatMaDBtBctagcatWtatttgWttVaaa\n\
ScMNattRactttgtYtttaaaagtaagtMtaMaSttMBtatgaBtttaKtgaatgagYg\n\
tNNacMtcNRacMMHcttWtgtRtctttaacaacattattcYaMagBaacYttMatcttK\n\
cRMtgMNccattaRttNatHaHNaSaaHMacacaVaatacaKaSttHatattMtVatWga\n\
ttttttaYctttKttHgScWaacgHtttcaVaaMgaacagNatcgttaacaaaaagtaca\n\
HBNaattgttKtcttVttaaBtctgctacgBgcWtttcaggacacatMgacatcccagcg\n\
gMgaVKaBattgacttaatgacacacaaaaaatRKaaBctacgtRaDcgtagcVBaacDS\n\
BHaaaaSacatatacagacRNatcttNaaVtaaaataHattagtaaaaSWccgtatWatg\n\
gDttaactattgcccatcttHaSgYataBttBaactattBtcHtgatcaataSttaBtat\n\
KSHYttWggtcYtttBttaataccRgVatStaHaKagaatNtagRMNgtcttYaaSaact\n\
cagDSgagaaYtMttDtMRVgWKWtgMaKtKaDttttgactatacataatcNtatNaHat\n\
tVagacgYgatatatttttgtStWaaatctWaMgagaRttRatacgStgattcttaagaD\n\
taWccaaatRcagcagaaNKagtaaDggcgccBtYtagSBMtactaaataMataBSacRM\n\
gDgattMMgtcHtcaYDtRaDaacggttDaggcMtttatgttaNctaattaVacgaaMMt\n\
aatDccSgtattgaRtWWaccaccgagtactMcgVNgctDctaMScatagcgtcaactat\n\
acRacgHRttgctatttaatgaattataYKttgtaagWgtYttgcHgMtaMattWaWVta\n\
RgcttgYgttBHtYataSccStBtgtagMgtDtggcVaaSBaatagDttgBgtctttctc\n\
attttaNagtHKtaMWcYactVcgcgtatMVtttRacVagDaatcttgctBBcRDgcaac\n\
KttgatSKtYtagBMagaRtcgBattHcBWcaactgatttaatttWDccatttatcgagS\n\
KaWttataHactaHMttaatHtggaHtHagaatgtKtaaRactgtttMatacgatcaagD\n\
gatKaDctataMggtHDtggHacctttRtatcttYattttgacttgaaSaataaatYcgB\n\
aaaaccgNatVBttMacHaKaataagtatKgtcaagactcttaHttcggaattgttDtct\n\
aaccHttttWaaatgaaatataaaWattccYDtKtaaaacggtgaggWVtctattagtga\n\
ctattaagtMgtttaagcatttgSgaaatatccHaaggMaaaattttcWtatKctagDtY\n\
tMcctagagHcactttactatacaaacattaacttaHatcVMYattYgVgtMttaaRtga\n\
aataaDatcaHgtHHatKcDYaatcttMtNcgatYatgSaMaNtcttKcWataScKggta\n\
tcttacgcttWaaagNatgMgHtctttNtaacVtgttcMaaRatccggggactcMtttaY\n\
MtcWRgNctgNccKatcttgYDcMgattNYaRagatHaaHgKctcataRDttacatBatc\n\
cattgDWttatttaWgtcggagaaaaatacaatacSNtgggtttccttacSMaagBatta\n\
caMaNcactMttatgaRBacYcYtcaaaWtagctSaacttWgDMHgaggatgBVgcHaDt\n\
ggaactttggtcNatNgtaKaBcccaNtaagttBaacagtatacDYttcctNgWgcgSMc\n\
acatStctHatgRcNcgtacacaatRttMggaNKKggataaaSaYcMVcMgtaMaHtgat\n\
tYMatYcggtcttcctHtcDccgtgRatcattgcgccgatatMaaYaataaYSggatagc\n\
gcBtNtaaaScaKgttBgagVagttaKagagtatVaactaSacWactSaKatWccaKaaa\n\
atBKgaaKtDMattttgtaaatcRctMatcaaMagMttDgVatggMaaWgttcgaWatga\n\
aatttgRtYtattaWHKcRgctacatKttctaccaaHttRatctaYattaaWatVNccat\n\
NgagtcKttKataStRaatatattcctRWatDctVagttYDgSBaatYgttttgtVaatt\n\
taatagcagMatRaacttBctattgtMagagattaaactaMatVtHtaaatctRgaaaaa\n\
aaatttWacaacaYccYDSaattMatgaccKtaBKWBattgtcaagcHKaagttMMtaat\n\
ttcKcMagNaaKagattggMagaggtaatttYacatcWaaDgatMgKHacMacgcVaaca\n\
DtaDatatYggttBcgtatgWgaSatttgtagaHYRVacaRtctHaaRtatgaactaata\n\
tctSSBgggaaHMWtcaagatKgagtDaSatagttgattVRatNtctMtcSaagaSHaat\n\
aNataataRaaRgattctttaataaagWaRHcYgcatgtWRcttgaaggaMcaataBRaa\n\
ccagStaaacNtttcaatataYtaatatgHaDgcStcWttaacctaRgtYaRtataKtgM\n\
ttttatgactaaaatttacYatcccRWtttHRtattaaatgtttatatttgttYaatMca\n\
RcSVaaDatcgtaYMcatgtagacatgaaattgRtcaaYaaYtRBatKacttataccaNa\n\
aattVaBtctggacaagKaaYaaatatWtMtatcYaaVNtcgHaactBaagKcHgtctac\n\
aatWtaDtSgtaHcataHtactgataNctRgttMtDcDttatHtcgtacatcccaggStt\n\
aBgtcacacWtccNMcNatMVaVgtccDYStatMaccDatggYaRKaaagataRatttHK\n\
tSaaatDgataaacttaHgttgVBtcttVttHgDacgaKatgtatatNYataactctSat\n\
atatattgcHRRYttStggaactHgttttYtttaWtatMcttttctatctDtagVHYgMR\n\
BgtHttcctaatYRttKtaagatggaVRataKDctaMtKBNtMtHNtWtttYcVtattMc\n\
gRaacMcctNSctcatttaaagDcaHtYccSgatgcaatYaaaaDcttcgtaWtaattct\n\
cgttttScttggtaatctttYgtctaactKataHacctMctcttacHtKataacacagcN\n\
RatgKatttttSaaatRYcgDttaMRcgaaattactMtgcgtaagcgttatBtttttaat\n\
taagtNacatHgttcRgacKcBBtVgatKttcgaBaatactDRgtRtgaNacWtcacYtt\n\
aaKcgttctHaKttaNaMgWgWaggtctRgaKgWttSttBtDcNtgtttacaaatYcDRt\n\
gVtgcctattcNtctaaaDMNttttNtggctgagaVctDaacVtWccaagtaacacaNct\n\
gaScattccDHcVBatcgatgtMtaatBgHaatDctMYgagaatgYWKcctaatNaStHa\n\
aaKccgHgcgtYaaYtattgtStgtgcaaRtattaKatattagaWVtcaMtBagttatta\n\
gNaWHcVgcaattttDcMtgtaRHVYtHtctgtaaaaHVtMKacatcgNaatttMatatg\n\
ttgttactagWYtaRacgataKagYNKcattataNaRtgaacKaYgcaaYYacaNccHat\n\
MatDcNgtHttRaWttagaaDcaaaaaatagggtKDtStaDaRtaVtHWKNtgtattVct\n\
SVgRgataDaRaWataBgaagaaKtaataaYgDcaStaNgtaDaaggtattHaRaWMYaY\n\
aWtggttHYgagVtgtgcttttcaaDKcagVcgttagacNaaWtagtaataDttctggtt\n\
VcatcataaagtgKaaaNaMtaBBaattaatWaattgctHaVKaSgDaaVKaHtatatat\n\
HatcatSBagNgHtatcHYMHgttDgtaHtBttWatcgtttaRaattgStKgSKNWKatc\n\
agDtctcagatttctRtYtBatBgHHtKaWtgYBgacVVWaKtacKcDttKMaKaVcggt\n\
gttataagaataaHaatattagtataatMHgttYgaRttagtaRtcaaVatacggtcMcg\n\
agtaaRttacWgactKRYataaaagSattYaWgagatYagKagatgSaagKgttaatMgg\n\
tataatgttWYttatgagaaacctNVataatHcccKtDctcctaatactggctHggaSag\n\
gRtKHaWaattcgSatMatttagaggcYtctaMcgctcataSatatgRagacNaaDagga\n\
VBagaYttKtacNaKgtSYtagttggaWcatcWttaatctatgaVtcgtgtMtatcaYcg\n\
tRccaaYgDctgcMgtgtWgacWtgataacacgcgctBtgttaKtYDtatDcatcagKaV\n\
MctaatcttgVcaaRgcRMtDcgattaHttcaNatgaatMtactacVgtRgatggaWttt\n\
actaaKatgagSaaKggtaNtactVaYtaaKRagaacccacaMtaaMtKtatBcttgtaa\n\
WBtMctaataaVcDaaYtcRHBtcgttNtaaHatttBNgRStVDattBatVtaagttaYa\n\
tVattaagaBcacggtSgtVtatttaRattgatgtaHDKgcaatattKtggcctatgaWD\n\
KRYcggattgRctatNgatacaatMNttctgtcRBYRaaaHctNYattcHtaWcaattct\n\
BtMKtVgYataatMgYtcagcttMDataVtggRtKtgaatgccNcRttcaMtRgattaac\n\
attRcagcctHtWMtgtDRagaKaBtgDttYaaaaKatKgatctVaaYaacWcgcatagB\n\
VtaNtRtYRaggBaaBtgKgttacataagagcatgtRattccacttaccatRaaatgWgD\n\
aMHaYVgVtaSctatcgKaatatattaDgacccYagtgtaYNaaatKcagtBRgagtcca\n\
tgKgaaaccBgaagBtgSttWtacgatWHaYatcgatttRaaNRgcaNaKVacaNtDgat\n\
tgHVaatcDaagcgtatgcNttaDataatcSataaKcaataaHWataBtttatBtcaKtK\n\
tatagttaDgSaYctacaRatNtaWctSaatatttYaKaKtaccWtatcRagacttaYtt\n\
VcKgSDcgagaagatccHtaattctSttatggtKYgtMaHagVaBRatttctgtRgtcta\n\
tgggtaHKgtHacHtSYacgtacacHatacKaaBaVaccaDtatcSaataaHaagagaat\n\
ScagactataaRttagcaaVcaHataKgDacatWccccaagcaBgagWatctaYttgaaa\n\
tctVNcYtttWagHcgcgcDcVaaatgttKcHtNtcaatagtgtNRaactttttcaatgg\n\
WgBcgDtgVgtttctacMtaaataaaRggaaacWaHttaRtNtgctaaRRtVBctYtVta\n\
tDcattDtgaccYatagatYRKatNYKttNgcctagtaWtgaactaMVaacctgaStttc\n\
tgaKVtaaVaRKDttVtVctaDNtataaaDtccccaagtWtcgatcactDgYaBcatcct\n\
MtVtacDaaBtYtMaKNatNtcaNacgDatYcatcgcaRatWBgaacWttKttagYtaat\n\
tcggttgSWttttDWctttacYtatatWtcatDtMgtBttgRtVDggttaacYtacgtac\n\
atgaattgaaWcttMStaDgtatattgaDtcRBcattSgaaVBRgagccaaKtttcDgcg\n\
aSMtatgWattaKttWtgDBMaggBBttBaatWttRtgcNtHcgttttHtKtcWtagHSt\n\
aacagttgatatBtaWSaWggtaataaMttaKacDaatactcBttcaatatHttcBaaSa\n\
aatYggtaRtatNtHcaatcaHtagVtgtattataNggaMtcttHtNagctaaaggtaga\n\
YctMattNaMVNtcKtactBKcaHHcBttaSagaKacataYgctaKaYgttYcgacWVtt\n\
WtSagcaacatcccHaccKtcttaacgaKttcacKtNtacHtatatRtaaatacactaBt\n\
ttgaHaRttggttWtatYagcatYDatcggagagcWBataagRtacctataRKgtBgatg\n\
aDatataSttagBaHtaatNtaDWcWtgtaattacagKttcNtMagtattaNgtctcgtc\n\
ctcttBaHaKcKccgtRcaaYagSattaagtKataDatatatagtcDtaacaWHcaKttD\n\
gaaRcgtgYttgtcatatNtatttttatggccHtgDtYHtWgttatYaacaattcaWtat\n\
NgctcaaaSttRgctaatcaaatNatcgtttaBtNNVtgttataagcaaagattBacgtD\n\
atttNatttaaaDcBgtaSKgacgtagataatttcHMVNttgttBtDtgtaWKaaRMcKM\n\
tHtaVtagataWctccNNaSWtVaHatctcMgggDgtNHtDaDttatatVWttgttattt\n\
aacctttcacaaggaSaDcggttttttatatVtctgVtaacaStDVaKactaMtttaSNa\n\
gtgaaattaNacttSKctattcctctaSagKcaVttaagNaVcttaVaaRNaHaaHttat\n\
gtHttgtgatMccaggtaDcgaccgtWgtWMtttaHcRtattgScctatttKtaaccaag\n\
tYagaHgtWcHaatgccKNRtttagtMYSgaDatctgtgaWDtccMNcgHgcaaacNDaa\n\
aRaStDWtcaaaaHKtaNBctagBtgtattaactaattttVctagaatggcWSatMaccc\n\
ttHttaSgSgtgMRcatRVKtatctgaaaccDNatYgaaVHNgatMgHRtacttaaaRta\n\
tStRtDtatDttYatattHggaBcttHgcgattgaKcKtttcRataMtcgaVttWacatN\n\
catacctRataDDatVaWNcggttgaHtgtMacVtttaBHtgagVttMaataattatgtt\n\
cttagtttgtgcDtSatttgBtcaacHattaaBagVWcgcaSYttMgcttacYKtVtatc\n\
aYaKctgBatgcgggcYcaaaaacgNtctagKBtattatctttKtaVttatagtaYtRag\n\
NtaYataaVtgaatatcHgcaaRataHtacacatgtaNtgtcgYatWMatttgaactacR\n\
ctaWtWtatacaatctBatatgYtaagtatgtgtatSttactVatcttYtaBcKgRaSgg\n\
RaaaaatgcagtaaaWgtaRgcgataatcBaataccgtatttttccatcNHtatWYgatH\n\
SaaaDHttgctgtccHtggggcctaataatttttctatattYWtcattBtgBRcVttaVM\n\
RSgctaatMagtYtttaaaaatBRtcBttcaaVtaacagctccSaaSttKNtHtKYcagc\n\
agaaaccccRtttttaaDcDtaStatccaagcgctHtatcttaDRYgatDHtWcaaaBcW\n\
gKWHttHataagHacgMNKttMKHccaYcatMVaacgttaKgYcaVaaBtacgcaacttt\n\
MctaaHaatgtBatgagaSatgtatgSRgHgWaVWgataaatatttccKagVgataattW\n\
aHNcYggaaatgctHtKtaDtctaaagtMaatVDVactWtSaaWaaMtaHtaSKtcBRaN\n\
cttStggtBttacNagcatagRgtKtgcgaacaacBcgKaatgataagatgaaaattgta\n\
ctgcgggtccHHWHaaNacaBttNKtKtcaaBatatgctaHNgtKcDWgtttatNgVDHg\n\
accaacWctKaaggHttgaRgYaatHcaBacaatgagcaaattactgtaVaaYaDtagat\n\
tgagNKggtggtgKtWKaatacagDRtatRaMRtgattDggtcaaYRtatttNtagaDtc\n\
acaaSDctDtataatcgtactaHttatacaatYaacaaHttHatHtgcgatRRttNgcat\n\
SVtacWWgaaggagtatVMaVaaattScDDKNcaYBYaDatHgtctatBagcaacaagaa\n\
tgagaaRcataaKNaRtBDatcaaacgcattttttaaBtcSgtacaRggatgtMNaattg\n\
gatatWtgagtattaaaVctgcaYMtatgatttttYgaHtgtcttaagWBttHttgtctt\n\
attDtcgtatWtataataSgctaHagcDVcNtaatcaagtaBDaWaDgtttagYctaNcc\n\
DtaKtaHcttaataacccaRKtacaVaatNgcWRaMgaattatgaBaaagattVYaHMDc\n\
aDHtcRcgYtcttaaaWaaaVKgatacRtttRRKYgaatacaWVacVcRtatMacaBtac\n\
tggMataaattttHggNagSctacHgtBagcgtcgtgattNtttgatSaaggMttctttc\n\
ttNtYNagBtaaacaaatttMgaccttacataattgYtcgacBtVMctgStgMDtagtaR\n\
ctHtatgttcatatVRNWataDKatWcgaaaaagttaaaagcacgHNacgtaatctttMR\n\
tgacttttDacctataaacgaaatatgattagaactccSYtaBctttaataacWgaaaYa\n\
tagatgWttcatKtNgatttttcaagHtaYgaaRaDaagtaggagcttatVtagtctttc\n\
attaaaatcgKtattaRttacagVaDatgcatVgattgggtctttHVtagKaaRBtaHta\n\
aggccccaaaaKatggtttaMWgtBtaaacttcactttKHtcgatctccctaYaBacMgt\n\
cttBaBaNgcgaaacaatctagtHccHtKttcRtRVttccVctttcatacYagMVtMcag\n\
aMaaacaataBctgYtaatRaaagattaaccatVRatHtaRagcgcaBcgDttStttttc\n\
VtttaDtKgcaaWaaaaatSccMcVatgtKgtaKgcgatatgtagtSaaaDttatacaaa\n\
catYaRRcVRHctKtcgacKttaaVctaDaatgttMggRcWaacttttHaDaKaDaBctg\n\
taggcgtttaHBccatccattcNHtDaYtaataMttacggctNVaacDattgatatttta\n\
cVttSaattacaaRtataNDgacVtgaacataVRttttaDtcaaacataYDBtttaatBa\n\
DtttYDaDaMccMttNBttatatgagaaMgaNtattHccNataattcaHagtgaaggDga\n\
tgtatatatgYatgaStcataaBStWacgtcccataRMaaDattggttaaattcMKtctM\n\
acaBSactcggaatDDgatDgcWctaacaccgggaVcacWKVacggtaNatatacctMta\n\
tgatagtgcaKagggVaDtgtaacttggagtcKatatcgMcttRaMagcattaBRaStct\n\
YSggaHYtacaactMBaagDcaBDRaaacMYacaHaattagcattaaaHgcgctaaggSc\n\
cKtgaaKtNaBtatDDcKBSaVtgatVYaagVtctSgMctacgttaacWaaattctSgtD\n\
actaaStaaattgcagBBRVctaatatacctNttMcRggctttMttagacRaHcaBaacV\n\
KgaataHttttMgYgattcYaNRgttMgcVaaacaVVcDHaatttgKtMYgtatBtVVct\n\
WgVtatHtacaaHttcacgatagcagtaaNattBatatatttcVgaDagcggttMaagtc\n\
ScHagaaatgcYNggcgtttttMtStggtRatctacttaaatVVtBacttHNttttaRca\n\
aatcacagHgagagtMgatcSWaNRacagDtatactaaDKaSRtgattctccatSaaRtt\n\
aaYctacacNtaRtaactggatgaccYtacactttaattaattgattYgttcagDtNKtt\n\
agDttaaaaaaaBtttaaNaYWKMBaaaacVcBMtatWtgBatatgaacVtattMtYatM\n\
NYDKNcKgDttDaVtaaaatgggatttctgtaaatWtctcWgtVVagtcgRgacttcccc\n\
taDcacagcRcagagtgtWSatgtacatgttaaSttgtaaHcgatgggMagtgaacttat\n\
RtttaVcaccaWaMgtactaatSSaHtcMgaaYtatcgaaggYgggcgtgaNDtgttMNg\n\
aNDMtaattcgVttttaacatgVatgtWVMatatcaKgaaattcaBcctccWcttgaaWH\n\
tWgHtcgNWgaRgctcBgSgaattgcaaHtgattgtgNagtDttHHgBttaaWcaaWagc\n\
aSaHHtaaaVctRaaMagtaDaatHtDMtcVaWMtagSagcttHSattaacaaagtRacM\n\
tRtctgttagcMtcaBatVKtKtKacgagaSNatSactgtatatcBctgagVtYactgta\n\
aattaaaggcYgDHgtaacatSRDatMMccHatKgttaacgactKtgKagtcttcaaHRV\n\
tccttKgtSataatttacaactggatDNgaacttcaRtVaagDcaWatcBctctHYatHa\n\
DaaatttagYatSatccaWtttagaaatVaacBatHcatcgtacaatatcgcNYRcaata\n\
YaRaYtgattVttgaatgaVaactcRcaNStgtgtattMtgaggtNttBaDRcgaaaagc\n\
tNgBcWaWgtSaDcVtgVaatMKBtttcgtttctaaHctaaagYactgMtatBDtcStga\n\
ccgtSDattYaataHctgggaYYttcggttaWaatctggtRagWMaDagtaacBccacta\n\
cgHWMKaatgatWatcctgHcaBaSctVtcMtgtDttacctaVgatYcWaDRaaaaRtag\n\
atcgaMagtggaRaWctctgMgcWttaagKBRtaaDaaWtctgtaagYMttactaHtaat\n\
cttcataacggcacBtSgcgttNHtgtHccatgttttaaagtatcgaKtMttVcataYBB\n\
aKtaMVaVgtattNDSataHcagtWMtaggtaSaaKgttgBtVtttgttatcatKcgHac\n\
acRtctHatNVagSBgatgHtgaRaSgttRcctaacaaattDNttgacctaaYtBgaaaa\n\
tagttattactcttttgatgtNNtVtgtatMgtcttRttcatttgatgacacttcHSaaa\n\
ccaWWDtWagtaRDDVNacVaRatgttBccttaatHtgtaaacStcVNtcacaSRttcYa\n\
gacagaMMttttgMcNttBcgWBtactgVtaRttctccaaYHBtaaagaBattaYacgat\n\
ttacatctgtaaMKaRYtttttactaaVatWgctBtttDVttctggcDaHaggDaagtcg\n\
aWcaagtagtWttHtgKtVataStccaMcWcaagataagatcactctHatgtcYgaKcat\n\
cagatactaagNSStHcctRRNtattgtccttagttagMVgtatagactaactctVcaat\n\
MctgtttgtgttgccttatWgtaBVtttctggMcaaKgDWtcgtaaYStgSactatttHg\n\
atctgKagtagBtVacRaagRtMctatgggcaaaKaaaatacttcHctaRtgtDcttDat\n\
taggaaatttcYHaRaaBttaatggcacKtgctHVcaDcaaaVDaaaVcgMttgtNagcg\n\
taDWgtcgttaatDgKgagcSatatcSHtagtagttggtgtHaWtaHKtatagctgtVga\n\
ttaBVaatgaataagtaatVatSttaHctttKtttgtagttaccttaatcgtagtcctgB\n\
cgactatttVcMacHaaaggaatgDatggKtaHtgStatattaaSagctWcctccRtata\n\
BaDYcgttgcNaagaggatRaaaYtaWgNtSMcaatttactaacatttaaWttHtatBat\n\
tgtcgacaatNgattgcNgtMaaaKaBDattHacttggtRtttaYaacgVactBtaBaKt\n\
gBttatgVttgtVttcaatcWcNctDBaaBgaDHacBttattNtgtDtatttVSaaacag\n\
gatgcRatSgtaSaNtgBatagttcHBgcBBaaattaHgtDattatDaKaatBaaYaaMa\n\
ataaataKtttYtagtBgMatNcatgtttgaNagtgttgtgKaNaSagtttgaSMaYBca\n\
aaacDStagttVacaaaaactaaWttBaagtctgtgcgtMgtaattctcctacctcaNtt\n\
taaccaaaaVtBcacataacaccccBcWMtatVtggaatgaWtcaaWaaaaaaaaWtDta\n\
atatRcctDWtcctaccMtVVatKttaWaaKaaatataaagScHBagaggBaSMtaWaVt\n\
atattactSaaaKNaactatNatccttgaYctattcaaaVgatttYHcRagattttaSat\n\
aggttattcVtaaagaKgtattattKtRttNcggcRgtgtgtWYtaacHgKatKgatYta\n\
cYagDtWcHBDctctgRaYKaYagcactKcacSaRtBttttBHKcMtNtcBatttatttt\n\
tgSatVgaaagaWtcDtagDatatgMacaacRgatatatgtttgtKtNRaatatNatgYc\n\
aHtgHataacKtgagtagtaacYttaNccaaatHcacaacaVDtagtaYtccagcattNt\n\
acKtBtactaaagaBatVtKaaHBctgStgtBgtatgaSNtgDataaccctgtagcaBgt\n\
gatcttaDataStgaMaccaSBBgWagtacKcgattgaDgNNaaaacacagtSatBacKD\n\
gcgtataBKcatacactaSaatYtYcDaactHttcatRtttaatcaattataRtttgtaa\n\
gMcgNttcatcBtYBagtNWNMtSHcattcRctttttRWgaKacKttgggagBcgttcgc\n\
MaWHtaatactgtctctatttataVgtttaBScttttaBMaNaatMacactYtBMggtHa\n\
cMagtaRtctgcatttaHtcaaaatttgagKtgNtactBacaHtcgtatttctMaSRagc\n\
agttaatgtNtaaattgagagWcKtaNttagVtacgatttgaatttcgRtgtWcVatcgt\n\
taaDVctgtttBWgaccagaaagtcSgtVtatagaBccttttcctaaattgHtatcggRa\n\
ttttcaaggcYSKaagWaWtRactaaaacccBatMtttBaatYtaagaactSttcgaaSc\n\
aatagtattgaccaagtgttttctaacatgtttNVaatcaaagagaaaNattaaRtttta\n\
VaaaccgcaggNMtatattVctcaagaggaacgBgtttaacaagttcKcYaatatactaa\n\
ccBaaaSggttcNtattctagttRtBacgScVctcaatttaatYtaaaaaaatgSaatga\n\
tagaMBRatgRcMcgttgaWHtcaVYgaatYtaatctttYttatRaWtctgBtDcgatNa\n\
tcKaBaDgatgtaNatWKctccgatattaacattNaaacDatgBgttctgtDtaaaMggt\n\
gaBaSHataacgccSctaBtttaRBtcNHcDatcDcctagagtcRtaBgWttDRVHagat\n\
tYatgtatcWtaHtttYcattWtaaagtctNgtStggRNcgcggagSSaaagaaaatYcH\n\
DtcgctttaatgYcKBVSgtattRaYBaDaaatBgtatgaHtaaRaRgcaSWNtagatHa\n\
acttNctBtcaccatctMcatattccaSatttgcgaDagDgtatYtaaaVDtaagtttWV\n\
aagtagYatRttaagDcNgacKBcScagHtattatcDaDactaaaaaYgHttBcgaDttg\n\
gataaaKSRcBMaBcgaBSttcWtgNBatRaccgattcatttataacggHVtaattcaca\n\
agagVttaaRaatVVRKcgWtVgacctgDgYaaHaWtctttcacMagggatVgactagMa\n\
aataKaaNWagKatagNaaWtaaaatttgaattttatttgctaaVgaHatBatcaaBWcB\n\
gttcMatcgBaaNgttcgSNaggSaRtttgHtRtattaNttcDcatSaVttttcgaaaaa\n\
ttgHatctaRaggSaNatMDaaatDcacgattttagaHgHaWtYgattaatHNSttatMS\n\
gggNtcKtYatRggtttgtMWVtttaYtagcagBagHaYagttatatggtBacYcattaR\n\
SataBatMtttaaatctHcaaaSaaaagttNSaaWcWRccRtKaagtBWtcaaattSttM\n\
tattggaaaccttaacgttBtWatttatatWcDaatagattcctScacctaagggRaaYt\n\
aNaatgVtBcttaaBaacaMVaaattatStYgRcctgtactatcMcVKatttcgSgatRH\n\
MaaaHtagtaaHtVgcaaataatatcgKKtgccaatBNgaaWcVttgagttaKatagttc\n\
aggKDatDtattgaKaVcaKtaataDataataHSaHcattagttaatRVYcNaHtaRcaa\n\
ggtNHcgtcaaccaBaaagYtHWaaaRcKgaYaaDttgcWYtataRgaatatgtYtgcKt\n\
aNttWacatYHctRaDtYtattcBttttatcSataYaYgttWaRagcacHMgtttHtYtt\n\
YaatcggtatStttcgtRSattaaDaKMaatatactaNBaWgctacacYtgaYVgtgHta\n\
aaRaaRgHtagtWattataaaSDaaWtgMattatcgaaaagtaYRSaWtSgNtBgagcRY\n\
aMDtactaacttaWgtatctagacaagNtattHggataatYttYatcataDcgHgttBtt\n\
ctttVttgccgaaWtaaaacgKgtatctaaaaaNtccDtaDatBMaMggaatNKtatBaa\n\
atVtccRaHtaSacataHattgtttKVYattcataVaattWtcgtgMttcttKtgtctaa\n\
cVtatctatatBRataactcgKatStatattcatHHRttKtccaacgtgggtgRgtgaMt\n\
attattggctatcgtgacMtRcBDtcttgtactaatRHttttaagatcgVMDStattatY\n\
BtttDttgtBtNttgRcMtYtgBacHaWaBaatDKctaagtgaaactaatgRaaKgatcc\n\
aagNaaaatattaggWNtaagtatacttttKcgtcggSYtcttgRctataYcttatataa\n\
agtatattaatttataVaacacaDHatctatttttKYVatHRactttaBHccaWagtact\n\
BtcacgaVgcgttRtttttttSVgtSagtBaaattctgaHgactcttgMcattttagVta\n\
agaattHctHtcaDaaNtaacRggWatagttcgtSttgaDatcNgNagctagDgatcNtt\n\
KgttgtaDtctttRaaYStRatDtgMggactSttaDtagSaVtBDttgtDgccatcacaM\n\
attaaaMtNacaVcgSWcVaaDatcaHaatgaattaMtatccVtctBtaattgtWattat\n\
BRcWcaatgNNtactWYtDaKttaaatcactcagtRaaRgatggtKgcgccaaHgaggat\n\
StattYcaNMtcaBttacttatgagDaNtaMgaaWtgtttcttctaHtMNgttatctaWW\n\
atMtBtaaatagDVatgtBYtatcggcttaagacMRtaHScgatatYgRDtcattatSDa\n\
HggaaataNgaWSRRaaaBaatagBattaDctttgHWNttacaataaaaaaatacggttt\n\
gHgVtaHtWMttNtBtctagtMcgKMgHgYtataHaNagWtcaacYattaataYRgtaWK\n\
gaBctataaccgatttaHaNBRaRaMtccggtNgacMtctcatttgcaattcWgMactta\n\
caaDaaNtactWatVtttagccttMaatcagVaagtctVaaDaBtattaattaYtNaYtg\n\
gattaKtaKctYaMtattYgatattataatKtVgDcttatatNBtcgttgtStttttMag\n\
aggttaHYSttcKgtcKtDNtataagttataagSgttatDtRttattgttttSNggRtca\n\
aKMNatgaatattgtBWtaMacctgggYgaSgaagYataagattacgagaatBtggtRcV\n\
HtgYggaDgaYaKagWagctatagacgaaHgtWaNgacttHRatVaWacKYtgRVNgVcS\n\
gRWctacatcKSactctgWYtBggtataagcttNRttVtgRcaWaaatDMatYattaact\n\
ttcgaagRatSctgccttgcRKaccHtttSNVagtagHagBagttagaccaRtataBcca\n\
taatSHatRtcHagacBWatagcaMtacaRtgtgaaBatctKRtScttccaNaatcNgta\n\
atatWtcaMgactctBtWtaaNactHaaaaRctcgcatggctMcaaNtcagaaaaacaca\n\
gtggggWttRttagtaagaVctVMtcgaatcttcMaaaHcaHBttcgattatgtcaDagc\n\
YRtBtYcgacMgtDcagcgaNgttaataatagcagKYYtcgtaBtYctMaRtaRtDagaa\n\
aacacatgYaBttgattattcgaaNttBctSataaMataWRgaHtttccgtDgaYtatgg\n\
tDgHKgMtatttVtMtVagttaRatMattRagataaccctKctMtSttgaHagtcStcta\n\
tttccSagatgttccacgaggYNttHRacgattcDatatDcataaaatBBttatcgaHtN\n\
HaaatatDNaggctgaNcaaggagttBttMgRagVatBcRtaWgatgBtSgaKtcgHttt\n\
gaatcaaDaHttcSBgHcagtVaaSttDcagccgttNBtgttHagYtattctttRWaaVt\n\
SttcatatKaaRaaaNacaVtVctMtSDtDtRHRcgtaatgctcttaaatSacacaatcg\n\
HattcaWcttaaaatHaaatcNctWttaNMcMtaKctVtcctaagYgatgatcYaaaRac\n\
tctaRDaYagtaacgtDgaggaaatctcaaacatcaScttcKttNtaccatNtaNataca\n\
tttHaaDHgcaDatMWaaBttcRggctMaagctVYcacgatcaDttatYtaatcKatWat\n\
caatVYtNagatttgattgaYttttYgacttVtcKaRagaaaHVgDtaMatKYagagttN\n\
atWttaccNtYtcDWgSatgaRgtMatgKtcgacaagWtacttaagtcgKtgatccttNc\n\
ttatagMatHVggtagcgHctatagccctYttggtaattKNaacgaaYatatVctaataM\n\
aaaYtgVtcKaYtaataacagaatHcacVagatYWHttagaaSMaatWtYtgtaaagNaa\n\
acaVgaWtcacNWgataNttcaSagctMDaRttgNactaccgataMaaatgtttattDtc\n\
aagacgctDHYYatggttcaagccNctccttcMctttagacBtaaWtaWVHggaaaaNat\n\
ttaDtDtgctaaHHtMtatNtMtagtcatttgcaaaRatacagRHtatDNtgtDgaatVg\n\
tVNtcaaatYBMaaaagcaKgtgatgatMgWWMaHttttMgMagatDtataaattaacca\n\
actMtacataaattgRataatacgBtKtaataattRgtatDagDtcRDacctatRcagag\n\
cSHatNtcaScNtttggacNtaaggaccgtgKNttgttNcttgaaRgYgRtNtcagttBc\n\
ttttcHtKtgcttYaaNgYagtaaatgaatggWaMattBHtatctatSgtcYtgcHtaat\n\
tHgaaMtHcagaaSatggtatgccaHBtYtcNattWtgtNgctttaggtttgtWatNtgH\n\
tgcDttactttttttgcNtactKtWRaVcttcatagtgSNKaNccgaataaBttataata\n\
YtSagctttaaatSttggctaaKSaatRccgWHgagDttaaatcatgagMtcgagtVtaD\n\
ggaBtatttgDacataaacgtagYRagBWtgDStKDgatgaagttcattatttaKWcata\n\
aatWRgatataRgttRacaaNKttNtKagaaYaStaactScattattaacgatttaaatg\n\
DtaattagatHgaYataaactatggggatVHtgccgtNgatNYcaStRtagaccacWcaM\n\
tatRagHgVactYtWHtcttcatgatWgagaKggagtatgaWtDtVtNaNtcgYYgtaaa\n\
ctttaDtBactagtaDctatagtaatatttatatataacgHaaaRagKattSagttYtSt\n\
>THREE Homo sapiens frequency\n\
agagagacgatgaaaattaatcgtcaatacgctggcgaacactgagggggacccaatgct\n\
cttctcggtctaaaaaggaatgtgtcagaaattggtcagttcaaaagtagaccggatctt\n\
tgcggagaacaattcacggaacgtagcgttgggaaatatcctttctaccacacatcggat\n\
tttcgccctctcccattatttattgtgttctcacatagaattattgtttagacatccctc\n\
gttgtatggagagttgcccgagcgtaaaggcataatccatataccgccgggtgagtgacc\n\
tgaaattgtttttagttgggatttcgctatggattagcttacacgaagagattctaatgg\n\
tactataggataattataatgctgcgtggcgcagtacaccgttacaaacgtcgttcgcat\n\
atgtggctaacacggtgaaaatacctacatcgtatttgcaatttcggtcgtttcatagag\n\
cgcattgaattactcaaaaattatatatgttgattatttgattagactgcgtggaaagaa\n\
ggggtactcaagccatttgtaaaagctgcatctcgcttaagtttgagagcttacattagt\n\
ctatttcagtcttctaggaaatgtctgtgtgagtggttgtcgtccataggtcactggcat\n\
atgcgattcatgacatgctaaactaagaaagtagattactattaccggcatgcctaatgc\n\
gattgcactgctatgaaggtgcggacgtcgcgcccatgtagccctgataataccaatact\n\
tacatttggtcagcaattctgacattatacctagcacccataaatttactcagacttgag\n\
gacaggctcttggagtcgatcttctgtttgtatgcatgtgatcatatagatgaataagcg\n\
atgcgactagttagggcatagtatagatctgtgtatacagttcagctgaacgtccgcgag\n\
tggaagtacagctgagatctatcctaaaatgcaaccatatcgttcacacatgatatgaac\n\
ccagggggaaacattgagttcagttaaattggcagcgaatcccccaagaagaaggcggag\n\
tgacgttgaacgggcttatggtttttcagtacttcctccgtataagttgagcgaaatgta\n\
aacagaataatcgttgtgttaacaacattaaaatcgcggaatatgatgagaatacacagt\n\
gtgagcatttcacttgtaaaatatctttggtagaacttactttgctttaaatatgttaaa\n\
ccgatctaataatctacaaaacggtagattttgcctagcacattgcgtccttctctattc\n\
agatagaggcaatactcagaaggttttatccaaagcactgtgttgactaacctaagtttt\n\
agtctaataatcatgattgattataggtgccgtggactacatgactcgtccacaaataat\n\
acttagcagatcagcaattggccaagcacccgacttttatttaatggttgtgcaatagtc\n\
cagattcgtattcgggactctttcaaataatagtttcctggcatctaagtaagaaaagct\n\
cataaggaagcgatattatgacacgctcttccgccgctgttttgaaacttgagtattgct\n\
cgtccgaaattgagggtcacttcaaaatttactgagaagacgaagatcgactaaagttaa\n\
aatgctagtccacagttggtcaagttgaattcatccacgagttatatagctattttaatt\n\
tatagtcgagtgtacaaaaaacatccacaataagatttatcttagaataacaacccccgt\n\
atcatcgaaatcctccgttatggcctgactcctcgagcttatagcatttgtgctggcgct\n\
cttgccaggaacttgctcgcgaggtggtgacgagtgagatgatcagtttcattatgatga\n\
tacgattttatcgcgactagttaatcatcatagcaagtaaaatttgaattatgtcattat\n\
catgctccattaacaggttatttaattgatactgacgaaattttttcacaatgggttttc\n\
tagaatttaatatcagtaattgaagccttcataggggtcctactagtatcctacacgacg\n\
caggtccgcagtatcctggagggacgtgttactgattaaaagggtcaaaggaatgaaggc\n\
tcacaatgttacctgcttcaccatagtgagccgatgagttttacattagtactaaatccc\n\
aaatcatactttacgatgaggcttgctagcgctaaagagaatacatacaccaccacatag\n\
aattgttagcgatgatatcaaatagactcctggaagtgtcagggggaaactgttcaatat\n\
ttcgtccacaggactgaccaggcatggaaaagactgacgttggaaactataccatctcac\n\
gcccgacgcttcactaattgatgatccaaaaaatatagcccggattcctgattagcaaag\n\
ggttcacagagaaagatattatcgacgtatatcccaaaaaacagacgtaatgtgcatctt\n\
cgaatcgggatgaatacttgtatcataaaaatgtgacctctagtatacaggttaatgtta\n\
gtgatacacaatactcgtgggccatgggttctcaaataaaatgtaatattgcgtcgatca\n\
ctcacccacgtatttggtctaattatgttttatttagtgacaatccaatagataaccggt\n\
cctattaagggctatatttttagcgaccacgcgtttaaacaaaggattgtatgtagatgg\n\
taccagtttaattgccagtgggcaatcctaagcaaaatgagattctatcctaaagtttgg\n\
gcttgatataagatttcggatgtatgggttttataatcgttggagagctcaatcatgagc\n\
taatacatggatttcgctacctcaccgagagaccttgcatgaagaattctaaccaaaagt\n\
ttaataggccggattggattgagttaattaagaccttgttcagtcatagtaaaaaccctt\n\
aaattttaccgattgacaaagtgagcagtcgcaataccctatgcgaaacgcctcgatagt\n\
gactaggtatacaaggtttttgagttcctttgaaatagttaactaatttaaaattaatta\n\
acgacatggaaatcacagaacctaatgctttgtaggagttatttatgctgtttactgcct\n\
ctacaaccctaataaagcagtcctaagaatgaaacgcatcttttagttcagaaagtggta\n\
tccagggtggtcaatttaataaattcaacatcgggtctcaggatattcggtcatataatt\n\
tattaagggctcttcgagtcttactctgagtgaaattggaaacagtcatccttttcgttg\n\
tgaggcatcttacaccgctatcgatatacaatgcattccaccgcggtgtcccgtacacaa\n\
ggaaacttgttaccttggggatataagaaaactcacacgtctcattattaaactgagtac\n\
aatttttgcacgagaaagtaatgcaatacaatatgatgaaagccagctaatgaaaaggga\n\
tggaacgcacctcggatctgttgcactggattaaaatccgattatttttaaaaatattca\n\
gtgctagagcatatcaggtctacttttttatctggtatgtaaagcccacggagcgatagt\n\
gagatccttacgactcaacgaaaagttataacataactcccgttagccaaagcccaatcc\n\
cgattactgccctaccctaacgtctgccatctaaatatcgaacttgttatgatcaatgtg\n\
actacctcccaccctttccccttcatttgttccactggggataagctagcgttttcagaa\n\
tcaatgcaataagaatagccaattgtctcacttcatcagagctcttggcaattccaggcg\n\
ctacgtggttctggaatatattcatttttcaaatagtaatacgtttagtgttgctattgt\n\
ctacacgtttggatattacgttatgtgagcggacatcaatagttgtctaactctttagta\n\
agccagagatagcactcttagcgaatggataccatcttccataagtttagttaatagtcc\n\
gaaacaactgcttcgagcatatttgaacctccttgtaggcaaatagcctcttcaaagcaa\n\
tcttactaatagatagagtttgttttaagggactactagaaatgggacaatcttaatagt\n\
atgacctaaactgacatttaaagatatatccaggtggcaagcataaagatcattgcgcca\n\
cctccaccgtgggattacttatcagtcgatatcctatatgctaagtttgcgacggcagaa\n\
tacaaactaagctgagttgatgctaaccttacctatgataccccattggaccggttaaca\n\
gccctacttattccaaataaaagaacttttatgctgtagaagctattatagtgatgcctg\n\
gtaacttcagtatattaaaatgacacacatacgccatatagagctcctggaactttgaat\n\
aatgagcgaacttcgaagttgaagagcaagaaaccatatgtcacggttgcctaaagcccg\n\
gtaaccagacatgtgctatcattgatcattatcgaggttttcataaccttgacccattat\n\
cggctgtgcgcggacaagtacttaaatcactagtttcttcacctgcttatcggtaagaaa\n\
taaggttggcaaagaatcgcataagacggacgtagagccgcagcgttgtgcgagtccagg\n\
tgcatgcgcagcaataggattttaaattttgttccatttttaatttagccgtaaggatgt\n\
ccgtaaatgattgaaaattggattcaatctttgggcctatgctactggaacctgatcgac\n\
aaaatttcaaacatacgttaactccgaaagaccgtatttttgcggctagaatagtcagtc\n\
gcttggagccatataccttaccacttaaacgacgtgctcctgtagttgaaatataaacag\n\
aacacaaagactaccgatcatatcaactgaagatctttgtaactttgaggcgaagcaccc\n\
tcttcgagacaactaagagtaaagtaccgggcgccgcaaggagtcgattgggaccctaaa\n\
tcttgacgaattgctaagaggctcagagctaccactgtaatttctctagagcccataata\n\
aatgaacgatacatccgtaggtagcacctaagggattataatggaagccaaatgcagtta\n\
ataatattatatactggcgtacacgattcgacggatctctcacatagtgattcacgaccc\n\
ccccctttgattgacacagcgtcagcattttgcaagaacgatcttctgcatagggtgcgc\n\
caccgtaaggatgacgtcgaagctacaactgggtataatttaccatgcttccctgatgct\n\
gagtgcaatacactaagaatgagtttttaccccatatcaccagtatttgttctgttattg\n\
cgaagaaatggctatgctgagttggcgactaaagtcacccatcctttttattaggtaacc\n\
ccctcccttaaactaactgatttgctggagctgccctgcatacatatactttatcattta\n\
tggacgtccgtgacgcttattatccaccatagtcgatatgctacacggattcattaatgg\n\
atcgtaggagtttaagttatatttactaagatcggtctcggctactatcccgccttaccc\n\
ggcgctatttacggccatttttaatatattgacggtaattattcctatggtttcgaccgc\n\
acgtccttggacaagaaagaatggcaaaaaaaatgtaaaagaaaaaaaatattgagtccc\n\
taccatcatataaaaaatatgtgatgagtaacttgacgaaatgttagtggttattaaaga\n\
ctatctattacaccttttgttttctgtcgtagtatattaaagtctagaagccttacagga\n\
aaatcagggttatacagccgatactccgcagcatgaatcatcgaggaggtgtcctaccat\n\
cgcgccttgtaatcttgtctgtgtatactgtatttagaccttttatacaaagtaaatatc\n\
tcggctttatgtgattgggaggggcctactcaaacatgatgacttgacctaataatcact\n\
gtgcgggcgtcttatgactagctattccttgaaatccaccaccaaatggttaatatgtaa\n\
aaactttgacgatgaaacaaggtgaatgtgtagttactttgtgtaattagctgcgtcgag\n\
cattgcttgtaaaaccgtcaatcgcacacgttacttccataaaatttctacgaatacacc\n\
cttcttaaaaaaaacgtaggaattcacgagtttaacaaacgataactgtataaagtggaa\n\
gtccgaagaaagcagatgcccgaactactcgaagatgtttcgttttcttaaccatagggg\n\
cttcttaatggcccactacgcacattttgttcaagcccgagagggacatccccattacgg\n\
gagtattactaaaactgttccgtaatacgttcagcaagggatgaaaaaggccactgctca\n\
agttattgacgtgggagtattacatcggaagcctgaatcccacactatgatggtctgtac\n\
aggcctagggactgcgtctagacggtattaccggcttctaatcatacgatcgtgagtctt\n\
aacgggaagtaaggctcacacctaccccaaaccatttatctatgtaagtataaaattgtg\n\
cgtaagtgttcaaagtggacaataaagacgtggcaaaaacccccgcacataagccgcttt\n\
agatttcacaaataccaatgcggttaaaaacatccttgagtcgtacatacaccatactcg\n\
cgttaaacggatataacagaagataataaatccggatgtggagtcggtgtaactatagaa\n\
agccaagtgaaataatgcttaccagtcatttagctatacggctttcatttcatgtcaaga\n\
gggtggagtttgacctgtacagttgatatatcaccgatacttagaactcacctaaagcta\n\
aaattgctcgcagcgtgtaatccgcatattacaaacaatagatgggattcattatacata\n\
agacacgatgatctgctttttcaggttgcgagatgttgcctatcgtcaatcgagtcctgc\n\
cttacaccacttaaacaaaagtattgacagggaacctattttcgaggtattatatagtcc\n\
agcttgaatatcaatttgacagttaacctagtgaaaatcagtaagaggaaatacgccaca\n\
ttctccagtgaaattctacgggttatcgtctagtccaactatcaattataactcacgaga\n\
tataagtaaattctcgtacttggcctgatttttattatactttggatccttagtaaacag\n\
gaagggagaaaccttcaacgaaaaacactggattttgttttactctcaaagctcttatat\n\
gacggaaataccctgtcaagtcttaactttattactagactaatgaaatgggcttggggt\n\
ggccagaatcatagtacaatttagcggatacactattcggactttcctatcggctgtctg\n\
gttggataagtatggggactaataggctagacatacctatacttaaactatacaggcgtc\n\
atctatctctgcaactttggagttccctgatgttctcccgccctttgggttcacatcttc\n\
tataccgacacccctaataacgattagtttgtgggttagagtaaattaatacggttaata\n\
ttaatgtatcgttgaaaagctggtgtcgccaataaggtaaccggctaggcagagtatatg\n\
tcacgaagtataactaccctaatgataagctgtaggaataaaattaatgctgtctctaag\n\
cgaagagatatttccgactctgttttaatgacgaatctcattacttctgacttgcaaatg\n\
ttcaatatggcacggtttcacggcacctttgtgacgcatataatgaacttagaagattat\n\
aacgacggaactttatatgataatccgttacgattaaagaatctgttaaatatcataatg\n\
gcattcagttctagaccgtgcatcatggtaaacttactttctctgcatggcgacatacat\n\
ttcgctattcaaattcgcgtgtggttacacccactcgcacctttggaatattaagagaag\n\
atgatcagaaaatccattcgctcaatttttctgacgtacgtctaatttatcctaggagac\n\
aaatcgttttatgtctctcacatttttgaagaaaggttcgagagacaatactcaggtcct\n\
gaactgctagaagatactcggtggagcgtggcaacaatgaaaaactcgtgacataaatga\n\
atgatacttttccaagttcagttaagtgaatatgtttaacatacccggcttttcgatctt\n\
aagctgacgctggacgtgcgagtaatgtcagtctcttacatacactagtgactccaagtt\n\
tcgtcaaaaacgccccctcccttctcgagcccactcacgctatgtattgacgcgaacttg\n\
ttcgggatcagacttttcaggagttcggtcgcgtgtccctatgtgctaatatataagtta\n\
gatcgcattagatgctaatctgaatacttatagacgaccttcaacgagaacgggtaccac\n\
cttgaggctagagttaggtgtgaaacgacaggtagggacatataaaatttgagtgcggct\n\
ttagttaagggtttaattacctactcaaacatcacgctcgcgcccttcgtacgtaatcga\n\
ccatctagaggctaaggggactgtactaggtagtgattaatgatatcctagacgcacgtg\n\
ccttagatcttcagactctgatggtccgcgatcaccgtaattgtagtcctccaactcgat\n\
cactttgttggcgtcaaagaaattacgatatctaaatacttataatacaataaccaagga\n\
tgagaatgactcatcgcgttggagttatattgcttgaagttctatggaatgaaagcacgt\n\
tatctgccgtcccaatatctccagtgagctaattcattggacggtccactttgatcaatc\n\
cccgaggagatgttcggacactttagtctgtaacacttagcgttgagaccacgaacaatt\n\
gattactcagtcttgaaggtgttttccaaagttcattttaaataagactacgataggcct\n\
ttcctattgatataaactacccggctctgttgttcgtgtgagtcgtacttctctgtgttt\n\
ttctgattatagcaagattcgattcttagtgtaaacagcgatttttatttgacccgtcaa\n\
tgagaagcgcataggatctaagcaaaattatcaagttgtgccacaaggtaagatctttcc\n\
agttattgcaggtaggatgtatcccacgttgatagtatgaggtctgacgtcaactgtcta\n\
ggagagttgaccgcgtgcgggtacaccggatttgcatcgatgttgagaacgcagaactcc\n\
cactgtcgtggcggcgttcctgatatttagcaagaggcgttgataaagccctcatcatct\n\
agatctcgacctcatctgccctcttgctccatcattttctacacagactactttcctatc\n\
tacgttagtataattgctttctatcttagtatcatttagagcttctccgtcaacaggttc\n\
gtgctattaaagttagtacgaaagggacaacttgtagcaacgcatttaatcggttttcga\n\
ctacttcgcacaaaatcagataaagaagtttgtcattctattagacattgaattgcgcaa\n\
ttgacttgtaccacttatgatcgaacactgaatcaagactgtgattaactaaaatagaca\n\
agccactatatcaactaataaaaacgcccctggtggtcgaacatagttgactacaggata\n\
attaattggactggagccattacattctctacaatcgtatcacttcccaagtagacaact\n\
ttgaccttgtagtttcatgtacaaaaaaatgctttcgcaggagcacattggtagttcaat\n\
agtttcatgggaacctcttgagccgtcttctgtgggtgtgttcggatagtaggtactgat\n\
aaagtcgtgtcgctttcgatgagagggaattcaccggaaaacaccttggttaacaggata\n\
gtctatgtaaacttcgagacatgtttaagagttaccagcttaatccacggtgctctacta\n\
gtatcatcagctgtcttgcctcgcctagaaatatgcattctatcgttatcctatcaacgg\n\
ttgccgtactgagcagccttattgtggaagagtaatatataaatgtagtcttgtctttac\n\
gaagcagacgtaagtaataatgacttggaataccaaaactaaacatagtggattatcata\n\
ctcaagaactctccagataaataacagtttttacgatacgtcaccaatgagcttaaagat\n\
taggatcctcaaaactgatacaaacgctaattcatttgttattggatccagtatcagtta\n\
aactgaatggagtgaagattgtagaatgttgttctggcctcgcatggggtctaggtgata\n\
tacaatttctcatacttacacggtagtggaaatctgattctagcttcgtagctgactata\n\
ctcaaggaaccactgctcaaggtaggagactagttccgaccctacagtcaaagtggccga\n\
agcttaaactatagactagttgttaaatgctgatttcaagatatcatctatatacagttt\n\
ggacaattatgtgtgcgaaactaaaattcatgctattcagatggatttcacttatgcctt\n\
agaaacagatattgcccgagctcaatcaacagttttagccggaaacaatcgaagcatagg\n\
gacaatgtatcttttcctaaattgccatgtgcagatttctgagtgtcacgaagcgcataa\n\
tagaatcttgtgttgcctcaactcgttgaaaagtttaaaacaatcgcagcagtctttttg\n\
gggtctactgtgtgtttgcaaaataactgaaagaaacgcttgaacaactctgaagtagct\n\
cgagtactcattaaagtgtaacacattagtgaatatcggccaatgaaccaaacgcttccc\n\
ggtacgctatctctctcatcgggaggcgatgtgcaggttatctacgaaagcatcccttta\n\
cgttgagagtgtcgatgcatgaacctcattgtaacaatagcccagcaaattctcatacgt\n\
gcctcagggtccgggcgtactcctccatggaagggcgcgcatctagtgttataccaactc\n\
gctttttaactactatgctgtagttctacaggcatagtggccagtattttctaacttctc\n\
tggatagatgctctcactcctcatccatcacggcttcagtttacgtcttacttgcttgtt\n\
cagcaacggatggaggcattaagtatcttcactgttccctaaaattgctgttcaatatca\n\
aagtaaggacgatacagggaaagctcaagcacactcattgaatactgccccagttgcaac\n\
ctcacttaatctgacaaaaataatgactactctaagtgttgcggaagcagtctcttccac\n\
gagcttgtctgtatcacttcgtataggcatgtaactcgatagacacgaacaccgagtgag\n\
aaactatattcttgcttccgtgtgtgtgacaccaggtaattgatgcggatataagctgga\n\
gatcactcacgcccacacaaggcgctgctacctctttattccaatgtgtaagaatttgct\n\
aacttcatttctagaccgcagctttgcggtcataatttcacggtacggacccttgggtta\n\
gagacttgataacacacttcgcagtttccaccgcgcacatgttttagtggcttctaacat\n\
agaatttttgttgtgacataaagagtgcgtgggagacttgcccgaccgttaagccataat\n\
caattgaaagccccgtgagtcacatctaattggttgtactgcgcatttagctatccttta\n\
gctgactcgaagagattcgattcctaatataggttaattagatggctgccgcgcgaagta\n\
aaacgtgaaaaacgtagtgcgcagatctgcataactcgcgcttaattacttatgagtagt\n\
tccaagttcgctacgttatgagagagattggaattaagcaaatatgttttatggtgattt\n\
tgggatgagaaggactgctaagtacggctactaaacaaatttctaaaaccgccatctacc\n\
ttatcttggagacatttaagttgtatatgtcactagtctagcttttgtctgtgggacgcg\n\
ttctcggaatgagggaaatgcaagagccgattcatcaaatgcttatctaagaaagtagtg\n\
gactattacaccaagcacgaatgccagggaactgctttcttgctcaggacctcgcgacaa\n\
ggtaccccgcataagtcctagaattacatttggtcagcaatgctgacatttgaccgtgaa\n\
aacataattttaatcagaaggcagctcacccgcttgctctagatcttatctttgtatgaa\n\
tgtcagaatttactgcaatatccgttccgaatagtgagggcttagtatagttctctgtat\n\
acaggtcacatcaaactccccctgtcctagtacagctctgagctttaattaattgcatac\n\
atttccttcaatcatcagatgaaaacaccgcgaatcatgctcttctcgtatagggcaaga\n\
gaagcaacaaacaactagcccgactcacgttcatccgccgtatccttgttcagttcttac\n\
tccgtattaggtcagcgaaatctaatcagaataatcggtcgcgtatcaaaattaaaatcc\n\
cgcttgaggttgacaattaaaacgctgagcagttatcggctattagatagtggggtgaaa\n\
gtaattggctggaattatgttaaaacgtgatattaagctaaaatacgctacttgttgccg\n\
acctaattcagtcattcgatattcagttagagccaagaataacaagcttgtataaattga\n\
acggggtgcactaaacgatgtgttactctaatattcagcttggagtatacctgaaggcga\n\
attcatgtatcggccaataataagacgttgaagatcacaatttggactagcaaaagaagg\n\
tgatttatgcgtggggattgagtccactgtacgagtacggtctctggaaaattataggtt\n\
cagggaatataaggaagtaaagataattaccaagagatttttggtatcgctatgacccag\n\
aggtgttctaacgtctgttttgatccgcagaatttctgcctcaatgcatatttgacggac\n\
ttgaactagagcctctaaagttaaatggcgacgcaactgttcctaaacttcaattattac\n\
tactctttttttcctagggtattgtagaggccagtggacaaaataaatcaaatttaagat\n\
gtttcggacattaacatcccccgtagcatagaaatcatcagttatccaatctctcatcga\n\
gcttttacaatttctgctggcgctatggacagcatatgccgcgagacctccgcaagactc\n\
acttgatcactgtaagtatcttcattagaggttagagcctatagttaagctgctgaccta\n\
gtaaaattggtattttctaattttattgctcaagttaaaggttagtgaagggataatgac\n\
gttatttttgaacaatgggttgtattcaattttatatcacgaatggaacccttcattccc\n\
ggcataatactagacgacacgaacaagctccgatctatcagccaggcacgtgttaaggtt\n\
taattccggcaaaccaatgaagcatcaaaaggtgacctgatgcaacttagggtcacgatg\n\
agtttttcaggactacttattacctattaataagttaacatgagccttcataccccgtaa\n\
gacaatacatactccaccaattagaattctgagccatcttatctttttgtatcatcgaag\n\
ggtatggccgaataggttaattagttactcctaacgtctctacaggcatgcatttgacgc\n\
accttcgaaaatagtcaatctctcgccacacgcgtctagtatgcagcatcaaaaatatag\n\
tccacggtttccggattaccaaacgcggcaaagagaaacattgtatcgacggagataact\n\
taatacagaaggaaggggcatcttcgaatacggatgaataattctatctgtttattctga\n\
catcttgttttcaggttaatcttacgcattcaaatgacgcctgccccatgcgtgcgcaat\n\
tattttctaatattgacgagagcaatctcactccttttgggtctatttatgttttattga\n\
ggcacaagcctatacagaacaggtactattaaggccgtgagtgtgagactcaaaccgtgg\n\
aaacaaaggatgggttgttcttggtacaagttttagtgcatgtgggcaatccttaccaaa\n\
atcagatgctatccttaactttgggctgcatttaagatggcggttggaggcctgtgagaa\n\
tcctgcgtgtcatctttaatgaccgaattcatccatgtagattcagatcacacactcatt\n\
ccttgatgttgtctaaacaaaagttgttgtggacgcattggagggagttaagtaacaact\n\
tgggatcgcatacttataaaaattatatgttaaactttcacaaacgctgaagtccaaagt\n\
aactagcccaaacgcctcgagagtcactaggtattaatggtgtttgagttcctgtgaaat\n\
agtgttcgaaggtaaaatttatgtaccaaatcgaaagaacacttaataaggcttgcttgc\n\
acggaggtatgatgtttactgactctacaaccctaattttccagtacgtacattcattcc\n\
aataggttagttctcaaagtgctatacaggctcctcaattgatgatatgcttcagccgct\n\
ctatggatattagctcattttatttaggaagcccgcttagaggcttactatgagggaaat\n\
gccaaaatgtcatacttttcggtgtgtcccatatgacaccgctttacatagaatttgaat\n\
taaaacgcgctctcccgttcactaccatacttggtaccgtgcgcatattacatatagata\n\
taggatcattttttaaagctgtactaggtttgatcgacaatcttatgctatactatatga\n\
tgtaaccctcataatcaataccgatcgtacgatcctagcataggtggcaagcgattttat\n\
gccgattattgtgttaaatagtctgtgagtgtgattatcagggctacgttggtagagggg\n\
ttgtatagacctcgcacacattgtgacatacttaacaatatacgaaaactgatataataa\n\
atccccttacccaaacaccaatcccgttgaatcaactaccataacgtctcccatataaat\n\
tgcctacttgtttgcataaatctgaatacataacaccattgcaccttcttgtgttccaat\n\
cccgttaagattgccttgtcagatgatatgcaagaacaatagcatttgctagcaattatt\n\
aacagctcttcgaattgcctccacataacgcgggagggtatattttaatttggcaaatac\n\
taagtactgttggcgtcatatgctattaacggttggatattaagttatgtcagccgtaag\n\
caagagtgggcgaaatattttgttacccagtgagagcactcttagagtttggatacaata\n\
ggccatatgttgacttaagaggacgtaactacgccgtacaccattgttcaaccgacttct\n\
tggcaaatagaatcgtattagcaatcttaagaatagagacacgttcgtgttagggtatac\n\
tacaaatccgaaaatcttaagaggatcacctaaactgaaatttatacatatttcaacgtg\n\
gatagatttaacataattcagccacctccaacctgggagtaattttcagtagatttacta\n\
gatgattagtggcccaacgcacttgactatataagatctggggatcctaacctgacctat\n\
gagacaaaattggaaacgttaacagcccttatgtgtacaaagaaaagtaagttgttgctg\n\
ttcaacagatgatagtcatgacgcgtaacttcactatagtaaattgaaacaaatacgcaa\n\
tttagacagaatggtacggtcatgaatgacagtaattcgaagtgctagaccaacttaaaa\n\
taggtaaacgtgcccgaaaccccccttaacagaaagctgctatcatggtgcagtatcgac\n\
gtgttcagaaacttgtaacttttgagcaggtccgagcacatggaagtatatcacgtgttt\n\
ctgaaccggcttatccctaagatatatccgtcgcaaactttcgatttagtcccacgtaga\n\
gcccaagcgttgtgcgactccacgtgcatgcccagaaatacgagtttaaatttggttaca\n\
tggttaattttgaccgaagcatcgcactttatgattgataattggattcaatatgtcgcc\n\
ctatgcgaatgcaacatgatccacaatttggctataagacgtttaatccgtatcacactt\n\
tgtttgcggctagtatagtaacgcccgtgcaccaagagtcagtaacaattataagtactc\n\
cgcaggtacttcaaatataaaaactaatcaaacacgacccatatgatcatctgaagatat\n\
ttggaactttctcgacaaccaccctcgtactcaatacttacactaatcgacaggcacacg\n\
caacgtgtacagtcgcaccatattgagtcaagatttgcttagtggcgatgagcgtacacg\n\
cttatttctctagtcacaattagttatctacgagacatcacgagggagcaaataagcgat\n\
gttatggctacacataggcacgtatgaatatgatataagccagttaaacagtcgaaccat\n\
cgagcaaattctcatgcaccaacccacacgttgaggcacaaagagtaagctgtttgaatg\n\
taacttcttctgctgagcgggccccaacgtaaggatcaactagaagagaaaactcggtat\n\
tagtttaaatgcgtcacggagcatgagtgcatttcactaagaatgtctgtgtaaccaata\n\
taacatctatttgttatctgattgcctacttatggctttgcggtcgtggcgactaatgtc\n\
tccaatccttttgaggtcggtaccaactccctttaaattacgctgtgcaggctcatgcac\n\
tgcatacatatacggtagcaggtagggacctcacgcacccttattataatcaatagtagt\n\
tatcagtcaacgaggcaggaatgctgaggtcgaggtgttggtatattttctatgtgccgt\n\
ctaggcgactatcacgcattaccaggcgagatttaagccaattttgaatatagtcaacgt\n\
aatttttactatgggttccaccgaaacgccttgcacaactaagaatcccataaaatatcg\n\
atatcaaataaaagattgtgtcaataccttcatatatattttttcggttgactaacgtga\n\
actaaggttaggggttttgtatgtctatataggaaacagtttcttttctgtcctacttta\n\
gtaaagtcttcaagccttactccaaaatcacggtgattaagccgttactcagcagcatga\n\
ttctgcctgctcgggtcctaaaatccagccttgtaagagtcgctgtgtattagctaggga\n\
gacctttgttaaaaaggatatatcgcggcgggatgtgagtgcgtggcgcatactcaatct\n\
tcagctcgtgtcattataatatctctcccccacgcttttcactagatatgccgtgtaagc\n\
aaacaccttatgcttaatttcgaaaatattggtacttgaaaaaagctgtaggggtactta\n\
atgtctggtaggagatcaggagagaattgagtgtaaaaccgtaaagccctcacctgactt\n\
catgtaaatggcttagaagactccatgatttaataaatactacgaaggaaagactggatc\n\
taaagataactctagtaaggccaactcccttcaatgctgttgccagttataatccaagag\n\
ctgtccttttctgaaccatagcggcttctgaagcgaactagaagcaaagttggttctagc\n\
cagacagccacataccctgtacgggtgtattactaaaactggtccggtattagttcacca\n\
agggaggaattaggcaaaggatctaggtatgcaagtcggagtattacatccctaccctga\n\
atccatcaataggttcctctgtactggccttcgcaatgagtattcaaggttgtacagccg\n\
tataataataagatagtgactatgaacgggaagtaacccgctcaccttccccaaaacatt\n\
gttatatctaagtattaaagtctgccgtagtgttaatactcgaaaataaacaactggcaa\n\
attacaccgcacttaagccgcttttgatttatatttttccaatgcgcttttaaaaataat\n\
tcagtcctacatactaattaagacccttaaacggagatatcacaagttaagttttaacca\n\
tctcgactaggtggaactatagatacccaactcaatttatcattacctgtaatgttccta\n\
gaaggattgcatttcatgtcaagacggtggagtttcacagcgaaacttcagtgtgaacag\n\
attctgagaaatcacctaaacctattagtcagagcacccggttagaaccagttgtcaaaa\n\
aatagagcggttgcatgagacagaagtaacgatgagatccgttgtaacgttgagacatct\n\
ggcctatcgtcaatacagtcctcccttaaaaatatttttaaatactaggcaaacccaaca\n\
taggttagtcctatgtgatacgccacatggtatatcattttgtaacgttacctagggata\n\
atcaggaagtggaattacgcaaaagtagacagtgaaatgcttagggttatagtctagtcc\n\
aaagataaaggataaagcacgtcagagaactatattagccgaatgggaatcattgttagg\n\
agactgtggatcatgtctaaaaagcaacgcagaaacagtcatcgaaaaaatctcgttttt\n\
gtttgaatctaaaagagctttgatgaccgatagtacctgtatactagttactgtattacg\n\
tgtctaatgatttcggattggggtccccagaatcagacgtcattgtagacgattcaagtt\n\
taccaatttaatttcccagctctccttggagaactatcgccaataattgcagtcactttc\n\
cttttctgaaacgataaagccgtcagagttctctgcaacgttggacttacctgaggttct\n\
aacccactttcggttctaatagtagttaacgacacaacgaataacctttactgtggggct\n\
ttcacgatattttttcgcttattattaatggttacgtcataagctggtgtccaaattaag\n\
gttaccggcttcgcagagtagttgtatccaagtataacttccctaatcataagatcgagg\n\
tagaaaattaatgctgtctctaaccgaacagatatgtcccactatgtggtatggacgttg\n\
ctaattacttctgaagggaaattggtcattatggatacgtgtctaccatcaggtcggacg\n\
cagatatggttctgtcttcagttgatccaccgttctttataggataataactgacgatta\n\
aagattatggtaaatagattaagccaattctcttcttgtcagtgaagcatccttaactga\n\
cttgctctgcagcccctcatacatttagctattcaaagtaccggctcgtttcaaactctc\n\
ccacctttggaagaggttgtcaacttgataagtatatcatttacagcattttttcggacg\n\
tacctctaatgtttcattgcagaaaattagttttttctatcgcacattttgcaagtaacg\n\
ttagagacacaattatctgcgaatgaactgctagatctgacgaccgggagcctcgcaaat\n\
atcaaaaaagactgacatatatcaaggagtcgttgacaagtgctggtaagtcaattggtt\n\
tatctgtcccggcgtttcgatcttaagctgaccatgcacggcagagtaatgtcactctcg\n\
ttcttacaagtctgtctccaagggtcggcaaaaaagacccctccattctcgagcccactc\n\
acgatatgtagggacgacaacttgtgcggcttatgaattgtctggactgcgggcgagggt\n\
ccatatctccgaagttagaagggacatacctttagatgataagatcaattcttattgacg\n\
aaattcatccacaacggggaacaacttcaccctagacttacgtctgaaaagacacctagc\n\
gtcttataaaaggtcagtgccccgtttcgtaaggctggaattacctacgcaaacttaaac\n\
ctcgcgcccttccttacgtatcgacaagatagaggctatcgcgaatgtactacggaggca\n\
tgaatcatatactagaaccaagtgcctgtgatattaacaagatgatccgacgcgagcacc\n\
gtaattctaggcataaaactccagcaatttgggggccgaaaacaaatgacgttagctaat\n\
taattatatgacatgatcaaaggaggtcaatcacgcatcgagttcgacgtatattcattg\n\
aacttcgtgcgtttgaaagaaacttttatgaaggcaaaattgatcctgtctcctatttca\n\
tgcgtacctcctagttgataattccccgagcagtggttaggacacttttgtcggtatcaa\n\
gttccggtctcaaaacgtaaaattctgtaatctgtatggatggtctgtgaattagttaat\n\
ttttatgaagtcgtcgagacgcagttcctattgatttattctaaacggagatgtgcttcg\n\
tgggactcggaagtagatctgtgtttatgattattgctactttagatgctgactgttaac\n\
tccgtgttgtttttcaaccgtatatcacaaccgaattggatagaacctatagtttcaagt\n\
tctgccacaaggtatcatatttacagttagtgctggttgcttctttcaaacgtggtgagt\n\
ttgtgctatcacgtcaacggtagagctcagtggaccgagtgcgcgttcaaccctgttcca\n\
gagagggtgtgatagcacatataccacgctcgtcgaggcgttcatgatagtttgcaagag\n\
ccggtgttaaacacatattattattgttatccaactaatcggacctatgcataaagcatt\n\
gtctaaacagaataattgcctatatacggtagttttagtgatttatatcttagtatcagt\n\
tagagcttcgaactcttcaggttcctcatatttaacgttcttcgaaagcgaaaacttcta\n\
caaacgaatgtaagcggttttccaagtagtacctataaatcacagaaagatctgtctcag\n\
tatagttgaaatggtattcagctagtgacgtgtaccaattatcatagttcactcaagcaa\n\
gacgctcattaacgaatatagacaagacactatatcatataataaaaaagaacatggtgc\n\
tcgaacatagttgaattcaccatattgaaggggaatgctgacatgtaattcgctactaga\n\
cgatcaattccctacttgtcaaagttgaactggtacgttcttggaattaaatatgattgc\n\
gctggaccaaattgcgacttcttgagtttcagggcaaacgattgagccggaggatgtccg\n\
tctcttacctttcttgcttatgataaacgacggtccctgtacatcactgggaattctcag\n\
caaaaataattgggtaaatcgagactcgatgtattcggccacaaaggtgttagacgttaa\n\
agattattcaacggggcgataataggatcataaccggtatgcaagcgcattgaaagagcc\n\
atgagatccttatccgataaacgctgcacggtatgtgcagccttattgtcgatcacgaat\n\
ttataaatgtagtctgggctgtaagttgaagacctaagttataatgaagtgcaataccaa\n\
atcgattcatagtggattatcagactcaagatatctcctgataaattacagttgttaaga\n\
tacggataaaatgagatttaagattagcagcctctaatctgtttcaatcccgttggaatg\n\
tggtatgcgatcaaggttaagttaaaatcaagcctgtcttcagtcttgattcttgttctg\n\
ccatcgcatgcggtctacgtgagttaatatgtagcttacgttctagcttgtgctaatctg\n\
agtatagattcgtagaggaatattatcaagcttccacgcctcaacgtacgtgtattggtc\n\
acacaagacactaaaagtggaagtagcgtaaactatagtctagttgttaaatgctcagtt\n\
cttgttatattcgatatactcttggctaatttatgtctgagtatataaaattaatgatat\n\
taacttgcatttcacggatcccttagaaaaagattttgaccgagcgcattataaacggtt\n\
acaccgaatcaatagaagcatacccaatagctttctttgaatttattgcctgcgcaactt\n\
ggctgactctctagatccgaataattctatatggtcgtgacgaaactagttcattactgt\n\
ttaaaatgccaacatgtcttttgggccgataatggctctttgcaaaattactcaatgata\n\
cgattgatcaaagcggtagttgctagtggtagcatgtaagtctatcaaatgtctgattat\n\
ccgaaaatcttccaaaagagtccacgtaccatatctatctcatagcgacgcgaggggaac\n\
cttatctaactatcattccatttaccgggtgactctcgatgcaggatccgattgggataa\n\
attgcccagaaatggctcattcctgactaagggtaaggccgttctcagcaagggaacccc\n\
gcgaatctaggcttataccatctagattgttaactacttgcctgtagttctacagccata\n\
ctggacagttgtttctaaatgatcgggattcatgctagcactcctctgaatgcaccgcgt\n\
aagtttaactattacgtccgtgggcagataaggatggaggctgtatgtatcttaactgtt\n\
acctaatatggctggtaattatcaaagtaaggaccttaatgccatagcgctagcaatcgc\n\
tttgtatactgaccatgtgccaacctctcttaatctgtaaaatataatgtcttagctaac\n\
tgtggacgatcatgtctctgcctagagcttcgctgtatcaattcctatagccagcgtact\n\
agtgacacaacaacaccgtgtgagaaaagatattagtccttacgtctgtctctctacagc\n\
ttattgatgaggattgaacatggacatatagctccccctcaaaagcagatgctacctctt\n\
tattccattctcgaacatttgccgaacttaatttcgacaaacctgaggtcacgtcttaat\n\
ttatcggtaacgtcacgtccctttgagactggataaatatattaccaggggccaacgagc\n\
aattgttggaggcgcttctataatacaaggtgtcttgtcaaagaaagacggcgtgcgtct\n\
cgtgcaactcacttaaccaatattaatgtgaaacccccctctctcacatcttatgcggtg\n\
tactgccctggtacatttcctgtacaggactccaacagtgtagattcctaagatagctgt\n\
tggagttgcctcacgccagatcgaaaaactgaataaactagtgagctgagctgcagaaat\n\
accgcttaattacttatgactagttcaaagggacctacgtgatgtcagacattgcaagga\n\
agaaattaggtttgtgcgtcattttggctggactagcactccttacttcccctactattc\n\
aaatgtcgtaaacagcatgagacaggatcgtgctgacatttaaggtctattgggaacgag\n\
gctacctttggtcgcgcgctcgcgttctccgaatgaccgaaatgcatgagcacagtatgc\n\
aattgcttatagatctaaggtctggtcgttgaaaccaagcacgtaggcctgggaaatcag\n\
ttcttcctcagcaactacacaaaagcgtccaagcattagtacttgtagtaaatgtccgaa\n\
cctatgcgctcatttgaaagtcaaaaaatatttttaagcagtaggcacctaacccgattc\n\
ctctacttagtagctttctttgattctcagaattgactgcaatatcactgcacaattctg\n\
tgccattactagacttctctgtattaacgtctcatcttactaacactcgcctaggacaca\n\
tctgagagtgaagtatttcaatacatttactgaaatcttcagttctaaaatccccgaata\n\
aggctcttatcggtttggccaacacaagaaaaaaacttcttgcaccactcaccttcatac\n\
gcaggagcctggggaacttagtaataactatttcggcagacaaagcttataacaagttgc\n\
cggcgcgtataatatttaaaagaccccttgagctgctcaattaaaacgctcacctggtat\n\
aggctattagatagtgccgtcttagtaaggggcgggaattatcggataaactgatatttt\n\
gataaaataaccgacttgttcacgacataagtcactaaggagattttatctttctccaaa\n\
gtatatcttccttggataatttcaaagcgctgcaatttaagttctgttactagtttatgc\n\
tgctgggaggtgaccggaaggcgtagtaatctagaggcaaattataagaagttcatcata\n\
tcattttcgactacaaaaacaaggtgttgtatgccggcgcattgtgtaaactggacgagt\n\
accctagatggaaaattatacgttaagccaagatttcgatgtaatgataattacctacac\n\
atttttgctatccataggaacaagagctgttctataggctcgtggcatacgaacatttgc\n\
tgccgctatgaatattggaagctcttcaactacagactctattcttaattgccgtcgaaa\n\
atgggccgaatcggctattattaatactcggtttttccgaggggattgttgtcgacagtc\n\
gtaattattattaatattgatgttggtgaggtcatttaaatacaaccttgcagacaatga\n\
ataagggatccaatctctcatactccttttacaattgctcatgcccctatgcaaacctta\n\
tgccgccacacctccgcaactctctcttctgaactgtaagtagcttcattactggtttga\n\
gactatactgaagctgatgacattctaaaatggctattttcgaatgtgattcataatgtt\n\
tatcgtttgggatggcagaatcacgttatttttgatatagcccgggtattctattgtata\n\
gaacgtatgctacaagtcattccccgaagaagactagaagtaaacaacatgcgaccatcg\n\
ttaagccacgcaaggctgtagctttatttcccgataacctatcttccataaatagcggac\n\
agcaggatactgacgctcaacatcagtggttatggtctaatttttaacttttaataaggt\n\
aacttcagcaggcatacacagtaactctttaatttataatcaaattagaagtctgacact\n\
tcttatatttttctatcatccaacgcgatcgcccattagcttattgtgttactaataacg\n\
tatctaaaccaatccttttcaagctactgcctatattgtcaatatatacaaacaacagga\n\
tagtaggctgcttaaaaaatattgtcaaccgtgtacgctttacaatacccggaaatcaca\n\
aactttgtagacaacgagtgaaatttatacactacgaagggccagcgtacaagacccatg\n\
aattaggcgatatgtttattctgacatattggtttatccttaatctgtcgctgtaaaatg\n\
aagccgcccccatccctgcgaattttttttcgaagattcacgactgaaatataaatacgt\n\
ttggctatatttatgttggagggaggcaatagcctttactgttaaccgaagatttagcca\n\
gtgagtgtgacactaaaacactggaataaatgcaggcgttcttctgggtaaaaggtttag\n\
tcaatctcgcctataagttcatatagctctggatataattatctggcccatgcatttatc\n\
atggcgcttggtgccctgtgtgaagccggcctctcatattgaaggtccgaagtattccat\n\
gtacattaagatcactctctcattcatgcatcttggcttaacaaatctggttgtccaagc\n\
tttccaggcacgtatggtacaaattcggatcgaatacttataaaaatgatatgttaaact\n\
gtctaaaacgctcatctacaaagtaaagtgcactaaccaatagagtctcaagaccgtgta\n\
atgctggtgcactgaatgtgtaatacggttagaagggattagttatgttacaaatccatt\n\
gaaaacttaagaagcattgcgtgctcggagggtgcatcttttatcaagagactaacatta\n\
ttttcaacgacgtacatgctttacaatagggtacttatcaaacgccgagaaacgcgccta\n\
tagtgatgttatgattatgacccgatatccattggaccgaattttatgtaggttcccagc\n\
gtactcgcgtaatatctcggtattgccataatgtaatacttgtcggtctctcccagatga\n\
aaaagcgttacagagtatttcaatgaaaaacagcgcgcaacgtcaatacctttaggggta\n\
acggccgctgatttcatatagatatacgataagttggtatagctctactaggtggcatcc\n\
acaatcgttgcatttactatagctggttacaatcataatctataccgttccttacatact\n\
accatagcgggatagcgtttttttgccgttgattgggtttaagaggatgtcagtctcatt\n\
atatccgattcggtgggagagccgttgttttcaaatcgcacactttgtgacataatgtac\n\
aagataacaaaactgatataagatataaactgtcaatatcaccttgacacttgaatcaaa\n\
gtaaattaactcgcaaatataatttgactaattgggtgcagatttctcaattaataaaaa\n\
aatggcaccggatgggcttacaagccccttatcattcacttgtatcatgatttccaagaa\n\
caatagaatttgctagcaagtatgaacagagattcgaattgcatccacagtacgccggag\n\
cgtttattttaatgtggatatgacgatgtactgttggcggcatttgctagtaaccggtcc\n\
ttatttacgtagcgcacacgtaagcatgtctgggagaaatatggtggtacaatctcagag\n\
aaagattacagtttggtttaaataggacttatcgggtcggaagtggaacttaataagcag\n\
tacacaattgggcaacagacgtcttgcctattacaataggattacaatgcgttagatttc\n\
agacacgttcgtgtttggctattcgtcaattccctaaatagttagacgatcaactattat\n\
caaagtgattctttgttcatcctccattcatgtaacagatggcacactacgcataacgcc\n\
gaggaattttaacgagatttaagagagcagttcgggcacaacccacttgactttataaca\n\
gctcggcagcataaacggtaatatgtgacaaatttccaaacgttataagaacgtatgtgt\n\
acttagaaaactaagtggttcatgttcaacagatgtgacgcagcaagcctaacttatcta\n\
ttggttttgctataaaagaacaaagttacacagaatcctaagggcttgtttcacacttat\n\
gcctagtgcttcaccatcttaaaatagcgaaaccggcacgaatcaaaccttaaaacaatg\n\
cgcagatattggtgatggtgactccgggtatgataatggtaactgttgaccagcgcccac\n\
ctcatcgaagtatagaaagtggttaggataaggatgagaccgaacttatttccggccata\n\
actttagattttctacctagtacacaacatcagggcggacacgaaaccgccatcacatca\n\
tataccaggtttaatttgcttaatgggggaagtgtcaacgaaccttcgaactttagcagg\n\
catatggccattatatatggccccagagcagaatgctacagcagacaaaatttggattta\n\
tgtagtttaatacctatcaaacttggtgtgaccatacttgtctaacgacagtgcacaaag\n\
tgtaagttacaattattactactcagcagcttctgcaatgataaaatcttatcatacacg\n\
tcacatatgataatatctacttagggggaacgggctccacaacctacatagtactcaata\n\
cttacactattcgacaggcacaccaaacctgtacagtcccaaaagattgagtcaactttg\n\
cagtactgcagatcacagtaatagcttagttagcgagtcaaaattagttttctacgagac\n\
tgcacgaccgtgcaaatttccgatgtgttggctacaaatagcaacgtatgaatttgtttg\n\
aagccacgtaaactgtacaaccttagagataagtctcaggctactaaaaacacgttgtgg\n\
cactaacaggatcatggttgattcttacttattcggctgaccggcccaataagtaacctt\n\
caactagaacagaataatcgggagtagtttaattcagtcaaggtgcaggtctcattgtaa\n\
ctaacaagctctgtgtaaccaagttaaaatcgttttcttagcggattccctacttatgga\n\
tttgagctcgtccacaatattcgatacaagaagtttgtggtccgtaacaacgaaatttta\n\
attacgctgtgcagcctcatccaaggaattaatagaaggttgatggtaggctccgaacgc\n\
tccatgattataatcaagtggactgtgcagtaaacgaggaaggtatcctgacgtcgtggt\n\
gttcgtttttgttatttgtgccctatacgagtagataaaccatgaacagcacagtgtgaa\n\
cccatggttgattttaggctaccttatttttaatttccgttacacagaaacgaattccac\n\
aactaacatgccattaatttttcgatatcttataaaagatggtcgaaattcattcattta\n\
ttttttttcggttctcgaaagtcaactaagctgtcgcgttttgtttctctttagaggtaa\n\
aagtggctttgatctcctacgtttggatactagtcaaccattactccatttgatccgtga\n\
gtatcacctgtctaacatccagcattatgactcctcggcgaagaaaagacacacttctta\n\
gagtcgatgtgtattagctagggacacagttgtttaatacgatagtgagcccagggaggg\n\
cagtgcgtcccccagtagatttattcagctagtgtaagtataagatatctcacccacgag\n\
gttcaagtgatatgcagtcttagaataatacttatcctgaatttcgatattatgggtact\n\
tcaataatccgctagcgctactttatgtctcgttggacagcaggacacatggcagtctta\n\
aacactaaagacatcacctgaatgaatgtaatgggattacaagaatcaatgaggtattat\n\
atacgacgtaggaaactctggatatatacagtaatctagttacgccatcgcacttcattc\n\
ctctggaaacttagaagacatcagctgtacgtggaggaaccagacccccgtatgtagcca\n\
aatagaaccaaagttgcttatacaaacacacccaatgacaatggaccgctggagttcgta\n\
aactcggaacgtagtactgcacaaacccagcatttagcaataggagctacgtatgcaact\n\
cccacgtggtaataccttcaagctatcaatatataggtgcctagctaatcgcattcgcaa\n\
gcagtattcaagcttgtaaaccagtataataattacagaggctctatgaaacccaacttt\n\
ccagctaaaagtcccaattaaatggttatttcgtacttttaaagtcgcccgttctgttat\n\
tacgcgaattgattctactccaaaattaaacacaaattatcaaccgtttcatttatattt\n\
gtcaatgcagctgtttaaaataaggctctactaaattataattaagacacttattaccag\n\
atttctctagttaagtttgaaccagctcgactaccgcgaaagatacattcccttctctat\n\
ttttcagttcatctatgggtcagagaagcattgaatttattctattcaccctcgtcgttc\n\
acagcgaatcgtcagtgtgatcagtgtatgagaaatatcctaaaccgtttagtcagacca\n\
cacgcttagaacaagtggtctaaaaagactgccctggaaggagtaagaagtatacagctg\n\
atccggtgtatccttcagtcatctgccctatactaattacacgacgcaaggaaaaatagg\n\
tttattttctaggcaaacccttcataggtgactccgatgtgttacgaatcatgcttgaga\n\
atgtgctatcgttaccgacggataataacgatctccaatgaaccaaatgtagaatgtcta\n\
ttgattacccttttactattcgacttagagataggagatagaacctcagtgtactttttt\n\
agccgaatgggaatctttgggaggtgaatggccataaggtcgtaaatccaaccctcttaa\n\
agtcttccatattatatcgttgttcgtggaatcgataacagatttgttgacccatagtaa\n\
atgtatactagtttatgttgtaagtgtagattgttttccgattgccgtccaaactttatg\n\
tcgtaattgtagaccagtaaagttgaccaaggtaagtgcccagcgatcctgcgagatcga\n\
tcgccaatttttccagtcactgtaagtgtaggtttagataaagccgtatgagttatatca\n\
taagggcctcggaaagcagcttcgaaccaaagttcccttataatagtagtttaactataa\n\
aagtatatactggtctgtcgccctttcacgatttgttttaccggtttatgaagcgttacg\n\
tcattagagcggctccaatttaaggttaacggcttccatgtgtagttgtatacaaggata\n\
acttaaagtatctgttcagcgagctagttaagttatcctcgatagaacacaactcagagg\n\
tcccaagatcgggtttgcaacttgctaatttattctcaaggcaaattgggaattatcgat\n\
acctgtataccataaggtcgctcgatgtgatgcttatgtcttctggtgatcctaccttag\n\
ttagtgctgattaacggaacattaatgtttatcgttttgagatttagccaattctctgat\n\
tctaactcaagatgccttatctgacgtgctatgcagcccctaagtattttacattgtaat\n\
aggacacgctcctttaaaactcgccaaaaggtcgttgtggttctctactggttaactata\n\
taatttacagctttgttgagctagttcctctttggtttaagtcctcaatattagttggtt\n\
cgagcgataagttggctagttaccttagtcactatattagatccgaatgttatgcttcat\n\
ctgaagaccgccaccctccaaaatttcttttaagactcacttattgcaaggtgtaggtga\n\
attcggctcgtttctcaagtggtgtatctgtacacgagtttccatattttcatcaacagc\n\
caccgcacacttatgtcactctaggtattaaaagtcgctctacaaggggacgcaattaag\n\
aaacagacatgctagtcaaaaataaacatagcgaggcaccactaattcggccgcttatca\n\
atgggatgctctgcgcgagacgcgccagagctcagtagttagttcggacatacatttact\n\
tcagatgatcaattagttttctacaaatgcttactctaccccgaaaaaagtcaccagact\n\
cttacgtctctttagtatccttccgtcttatataaggtcagtcccccgtttcggtaccct\n\
ggaatttactaagaataatgaaacagcccccaaggacgtacgtttacaaatgatagacca\n\
gatcgcctagcttattccgacgcatgttgcatagaattgaaccaacggaatgtgagagta\n\
actagatgagccgaccacagcacccgtttgcgtcgcagaatacgcctgatagttcggcca\n\
cgaaatcatatgtcctttgagtattaagtatttgtaatgatcaatcgagctcaagcaagc\n\
ttacacttcctcggatattcagggaacttagtgcctttgaaagatacgttgatcaacgaa\n\
aaattgataatggctcatatggaatgcctacctcatagtgctgaattaacacagcactgc\n\
ggacctaacttttcgaggtttcaagttcacgtctcaaaacctaataggctggaatatgta\n\
gggatcctcggtgaatttgtgattgggtttgttgtagtactgaccaagtgaatattcttt\n\
ttttctaaaagcagatctgctgccgggcactacgaaggagatctctgtgtatcattattg\n\
cttcttgacatgatgactcttaaatcactgtgggtgtgcaaaacgatagcacaacccaat\n\
tcgatagtacatattgttgatacttcgcactaaaccgttcatatttaaaggttgtgctcc\n\
ttccttcgttaaatactggtgacttggtcctatctactattagctagacctctggggaac\n\
cacgcccccgtaaaacctgtgcaagagagggggtcatacatcttagacatcgcgcctcca\n\
ccagggaagcattgggtgattgaccaggtgtgtaacaaatatgattattcttatactaat\n\
attagcaaagatgcataatgatttgtattaaatgtataattgaattgataagggtctttt\n\
agtcagtgatagagtagtataaggtagacattagaactcttaaccggacgcagatttttc\n\
ggtcttagtaagccaattagtcgacaaaacaaggtaagagcggttactagtagtacctat\n\
aatgcactgaatcttcggtcgaagtatagttctaatgctatgcagattgtgacggcgaca\n\
aatgttcagacttatatcatgaaacaagctcttgtaagtattgacaaatgaaaagattga\n\
atatttttaaatacaaaatgcgcctacttattaggggaattaaccagattgaaggccaat\n\
cctcacatgtaatgagataatagacgataaatgaaattcttgtaatagttgaactgctac\n\
gtgatgggtattatatatgattgagatcctccaattgccgacgtcttgtcttgatgccca\n\
aaagattgtcaacgaggagctccctcgcgtacctgtcgtccgtatcataaacgacgcgac\n\
atgtacagcactccgaagtataagcaataataatgcgggtaatccagactagatcttttc\n\
ggactcaatgcggtttcacggtaaacatgattaataccggagagtagtcgagcttatcag\n\
cgatgcaagcgaattcattgtgccaggagatacgttgcagataaaaccggcaacgtatgt\n\
caacaagttttggcgatctcgttgtttgtattcgacgaggcgcgggaacttcaagaacta\n\
tcgtatattcaagtccattaccttttagtttcagactggtggagctgactaaagttatat\n\
catcattttgtacactggtttagttaacgataatttcagatttaacatgaccagacgata\n\
atcgctgtatatccagttggaatgtggtttgccagaaaggttaacttataatcaagcctc\n\
tcttcagtcttgattcgtcgtatcccatccattgcgctatacctcagtgtatttggagct\n\
gtagttataccgtgtgctaagatcagtagacatgacgagagcaatattatctaccttaca\n\
agcatcaacggacgtctagtcggaacaaaagactctaaaactcgaacttcaggttaatat\n\
actatagttctgtattcagcagttattcttatattcgatattatcttgcctattggatgt\n\
ctgactttagtatattaatcatagtatctgccatgtaaaggtgccagtactaaatctgtt\n\
tcacagtgcgaattataaacggttacaaccattaaagacaacaagaccctatagctttat\n\
ttgaattttgtcaatgcgcaacttggagctcgcgatacatcccaattagtctatagggtc\n\
gggacgattctacggcatttctggttataatgacaacatggattgtggcccgagaatcgc\n\
tctttcattaattaagcaatcattacagtcttataagcgctacttccgagtggtagcagg\n\
taactcgatataaggtcgcatgagccgaatagcttaaaaaacaggccaccgaacattgat\n\
agagaataccgaccacagcgcaacctttgattactttcattaaattgtacggctcactcg\n\
acatcaagcttaagattgcgataatgtgaactcaaatggatcagtactgaagaaccgtaa\n\
cccacttcgcagaaagcgtacccagagaagatacgctgttacaatatacagggtgaaatt\n\
attgcctgttcttcgtaaccatttcgccaaacttggttagaaatgatagccattcatgat\n\
agaaataagctgaatgataccagtatctttaactatgtagtcagggggaagataacgatg\n\
gtccatgtatgtttctgatatgtgacagtattggccgcgtaatttgctaacgaagctact\n\
taatgcctttgagcttcatatagatttctttaatcaaaatcggcaaaaagatagtatgag\n\
ctataatatatgctagtagagaactctggaccatcatctatatgaatactgattcgagcg\n\
tgcaattactttagcctgcgtactactgactctacaaaacactctgagataagtttgtag\n\
tcagtaagtcgctctctataaaccttttggatgaccattgtacagccacttatagatccc\n\
aataaatagcacaggagacagagtttttcaatgctcgatcatttgccgatagtattttcg\n\
tctaacctcagggcacctattatttgatacctaacctaacggccctttcacaatggagaa\n\
atatatgacatcgggacaaacacaaatggtgggtggccaggagatatgacatggtggcgt\n\
ctctaagaaacacggactccctctaggcaaactcacgtaaccaattttaatgtcaaacaa\n\
aacgctcgaaaagattttgccgtgtaatgacctggtacattgactggtcaggaatacatc\n\
actgtagttgccgtagtgtcctgttggtgttccatcaagacacatcgtataacgcaattt\n\
acgacggacatcagatcaagttatacagattatttaagtatcacgtgtgcattgggacat\n\
aagggatctcacacatgccttggaacatttttgctttgtgccgctttttcgctgcactac\n\
caatccttacttaccagtatattcaaaggtcgttaacagaatgagaaaggttagggctct\n\
aagttatcgtcgattgggatagacgagacatttgcgagcgccctccacggatacgaatct\n\
cccatatcaatgtgaactggatgctatgcagtttagttcttacgtctcctagtggtaaaa\n\
atcaaagtagcactcgcatagcagttattcagaacctaatacacaaaaccgtcaaacatt\n\
ttctaattctaggtatgggccgatcataggagctaaggtgaaactcataaatgttttgtt\n\
agatctagcatcctaaaaagatgcatatactgagtagctggcgtgcattctctcaattgt\n\
atcctttttaactgaactagtcggtcccatttcgtgactgagatctattaaccgataaga\n\
ttaataacactcgcattcgtatcagctcagagtgaagtttttcaataatttgactgatat\n\
attaacttctaaaataaccctttaagcctcggatccgtttcccaatcacatcaaaaattc\n\
ttattccaactatctacggattaacaacgtgcatggggatcgtagtaagaacttgttccg\n\
atcactttgagtatatcaagttgacggcccggttattattgaatagaaacattcacctgc\n\
taaattaaataccgcacatcggatacccgatttcagagggccgtcttactaagggcaggc\n\
tttgttcggtttaactgagatgttcattattttacagtatgcttcaactaatatgtaacg\n\
aaggacagtggatctgtctccatagtagatcttcagtcgtgaatttcataccgctcctat\n\
ttaagttcgcgttcgagttgttgatcatggcacgtgaaagcaacccctagtattctagac\n\
gaaaattttttctagttcatctgataatttgccaattcaaaaacaaccgctggtttcccg\n\
gcgcattctctaaaatggaagtcgaacctagagccattatttgtcggtaacccatgagtt\n\
ccttcttttcagaagttaatacactgtggtcctatacagaggaaaaacagcggttatata\n\
cgatcgtggcataacaacattggatcaagatagcaatttggctacctattctaattctca\n\
ctagattcggtattccactacaatatcggcagattaggattggatgaataatcggtgttt\n\
aagtccggttgcgtctccaatctcctaatttttattaatattgatcttggtgacctattg\n\
taaataaaaacttcaagactttgaataacggtgaaaagatagaagactcatttgaaaatg\n\
gatcatccacagatccaaacattagcaagacactaatccccaactagctattctgatcgc\n\
gatcgtgctgcagtactcctgtcacaatagtctgttcatgatctaattctttttgggctt\n\
tgttcgatggtgattcagaatctttatccggtcgcttccctgtagctactttgtggggat\n\
attgcccggggattatagggttgagatcgtttcctaaaagtatttaaaccaagtagactt\n\
caactaaactacatcagaacatcgtgaagacaccatacgcggtacctttatttaccgata\n\
acatttcttcaagaaataccggtaagcagcataatgaccctaaacagctcggggtatcgt\n\
cgtagttttaaattttatttaggttactgctcaaggaataaaaactaactatttaattta\n\
taataatattacaaggctcacactgattagatttgtctataagacttcgcgatcccccat\n\
taccggattgtcttaagaataaactagataaaccatgcattttctagataaggcctttag\n\
tctaattagatacaaaaaacacgatagttgcatccttaatttattgtgtcaaacctggaa\n\
ccttttaattacccgcaaatcactttatgtcgagactacctctgaaatttattatctacc\n\
taccgcatgaggacttgaaccatcttgtaggagttatgtttattagctaagattcgttta\n\
tcctgtagcggtccatgtatattcaacaagcaaaaagcactcagaattgtttttagttga\n\
gtcaagactgatatataaataagtttccctagttttttcgtggtgggacgatattgaatt\n\
gaatcttaaccgaagagtttcccactctgtcgcacaataatacacgccaatatttccagc\n\
cctgcttatgccttaatcggttactcaatctcccattgaagttcattttgatctgcatag\n\
aagtttcgggcccagccttttttctgccaccttcctccaagctctgtagacgcactctaa\n\
gattgatgctcacatgtattaattctacattaacataaatatataagtcatgcatcttcg\n\
agtaaaatatctggttctccaacatgtcctggcacgtatcgttataatgcccatacatgt\n\
agtattaaaatgattgggttaactggatattaagatcatcgaaattgtaaagtcaaatta\n\
acaatactgtctcaagaccgtgtattcctcgtgctcggaagggctattacgcttacttcc\n\
gttttggtatcttaatatgactttcaaaaattaagttgcagtgagtcctacctgcgtgca\n\
tcggttagcaagagtataaaagttgtttaaacgaactacttgctttacaataccggtcgt\n\
atatatcgccgtgaatccagaagattgtcttctttggattatcaaccgagatcctgtgga\n\
ccgatgttttgggaccttcacagaggactccaggtagagctcgcttttgcattaatctaa\n\
gaattgtacctctctaaaagatctaaaacagtgaatgtgtatttcatggaaaaacacaga\n\
gaaacgtaaattactttaggccgaaaggcacatgagttattatacatatacgagatggtg\n\
gtatacatcgaattcggggcatacactatagttgcattgtatttagctgctttaaataat\n\
atgatattaccttccttacataagacattaccggcataccctggttttcaacttgtgggg\n\
ctttttgacgatcgcactctcatttgatccgagtagggcggtgacccctgcttttcaaat\n\
acaaaaatttcgctatgaaggtaatagattacttttcgctgttatgatagaaacggtaaa\n\
tttaaaattgaaacttctagaaaagtaaagtaacgagaaatgattttgtgaataatgcgg\n\
tcatgattgcgcaagtaagaaaaaaaggcaaaaggatgcgcggaatagaaacttatcagt\n\
cacgggtatcttgatttcattcttcttgtcaattgccgacataggatgaaatcagattcc\n\
aatgcaatacacagtaacccccacccttgattgtaatgtcgatttgaagttgtacgcgtc\n\
gacgaagtggatagtatacgggccttttgtacggtgcgatcaactatgaatctcggcgag\n\
ttagatggtcgtacaatctcacacatagaggtcacttgcctgtaatgacgaattttcggc\n\
taggtactcgaactttattagaagtaaaaatgtgggcaaaagaaggattccattttacaa\n\
gacgattacaatgagttacatgtctctcaacgtagtctttccctagtagtctttgaacta\n\
tttaggtactccagaaaattttagcaaagggtttctgtgtgaatccgccattcatgttta\n\
tgatggaacaataagaataacgccctcgtatgttatcgacagtgaagtcagcagttcggc\n\
caaaaacatattcaatttagtacagatccccagaagttaagctaagtgctctaaaatggc\n\
ctaaacggttatcaaagtaggtctaattactatactaacgggtgcatcgtaataactgct\n\
gtcgatgcaacactatatgatagtgtcgttttgctatatatgtacaatgtgacaaagaag\n\
ccttagcgattcttgcaaacttaggacttcggattctcaatcttaaatgtccgaaaacgc\n\
aaagattcaaaaatttaatctatgagcagatatgcctgatggtgactacgcgtatgttaa\n\
ggctaaatgttgacaaccgcacacataatcgaactattgatagtcgggagcataaccagg\n\
tgaacgtactttgttcacgacatttattgacatgttctaaatacgtctcaaaatcacggc\n\
gcactagaaaacgcaatcaaatcattgtcctggtttaagggccgtaatgccggtagtgtc\n\
aaacttcatgagaactttagctggcttttggccagtatttagggaccaagagcactagcc\n\
ttaagctgaatattttgccatttatctactgttataactttaaaacttggtggcaccaga\n\
cttgtcgatacacacgcatcaatctgtaacgtaaaaggtttactaagaacaagcgtagga\n\
attgagtttatattatatttaaactaaaagatgatattagcttctgagggcgatagggct\n\
ccaaatcataaagaggaatatattattacacgattagaaacccacaacatacctcgaatc\n\
gcccaaaagtttgacgaaacttggcagtactccacatctcagtaatacagttgggagagt\n\
ctcaaatgttgttttattactcaatgaaccaccctcataatttcactgctgttccattaa\n\
atttgcaaacgatcatttgctttgaagaaacgtaaaatcgacaaaattacagataagtag\n\
atgcataataaaaaaaactgctcgctataacacgatcatcgtgcattcttacttaggagc\n\
atcacccgcacaataacgtaccttaaactacaacactattagaccgagtactgtaattca\n\
cgaaagctcaagctcgcattgtaaagaacttgctctctcgtaaaatgtgataatagtttg\n\
cggagaggattcaattattttccattgcacctactccactagattcgataaaagaaggtg\n\
gtcctcccttaaaaagaaatgttaagtaacatcggaaccataagcaaagcatgtaagtga\n\
accgtcatccttccctaagaaacataaaggtttttaataatgtcgactgtgaactataac\n\
tgcatcctttcctgacctactccggttccttgttgttatttctgaacgagaccagtagat\n\
aaacaatgtaaaccacagtgggtaccaatggtgcatgtgacgctaccgttgttttaagtg\n\
cccgtacaaacataagaagtcataatcttacttgaaattaattttgccttttattttttt\n\
tcaggctcgaaattaatgatttgttttttttgaccttctagttacgctaatatgcggtcg\n\
cctgtggtttctattgagtcctataacgggatgggatctaatacgtttggttactagtaa\n\
acaaggtataaatttgataccggagtatcaactgtataacatcaagctttatgactcata\n\
cgcgaagtaatgacacaaggctttcaggagatcgcgagtacagagccactaaggggtgta\n\
ttacgatagtgacaccaccgagcgcactcactccccaagtagatttatgatcctacgcta\n\
agtattagatatataaccaaagaggttctagtcagtgcaactcttagaataataattagc\n\
cggttttgcctttttaggcctaatgcaatattcagctagcccttatgtatctcgcgttcc\n\
acagcaccactcatggcacgcgtttaaactaatcaaatataatctatgaatgttatgcca\n\
gtacttgaataaatcaggttttttataagtccttgcatactctcgttatatactgttaga\n\
gtcttaccccatagaaattctttcatctgcaaacttagaagaattctcagctacggggag\n\
cataaagtccccaggatgttgacaaatacaacaaatgtggcttatacaaacactccatat\n\
gaaaatcgaaccctcgtggtagttttagccgaaccttgtacggataaatccctccatttt\n\
ccaatagcagatacctatcctactacctcgtggtattaaattaaagcttgaaatatagag\n\
ctgcatagcttatccaattcccaagcacgagtctaccgtcgtaaccacgatttgatttac\n\
agacgctagagcaaacccatctttaaacatataagtaaaaattaaagggtgagtgcgtac\n\
gtgtttactagcaacttcgcttattaagacaattgtttataagccataattaaaaacata\n\
tgttcaacaggttcattgatatttgtaattgcacaggtttttaataaggatctacgtaag\n\
tataatgaacaaactttttaccagagttatattctgtactttgaaaatgctcctctaccg\n\
ccttagagactttcaattagattttttgcagttaatctatgcgtaagtgaaccatgcaag\n\
ggatgcgattcaaccgcctcgtgctaaccctatcgtctgtctcataactgtaggtctaat\n\
ataattttcagttttcgaacacataaccctttgaaaatctgctatttaatgtctcacctg\n\
catgcactatcttctatactgctcagaacggctatacgtcactatgctccaagtgacgat\n\
ttaaacgaagcaaggaataataggtttattttagtgcaaaacaattaagtgcggactacg\n\
tgctctttacaataagccttgtgattgggctataggttaagtcccatattaacgatctcc\n\
aatgtacaaaatcgacaatcgctttgcattacccggttactagtcgaattacagatagct\n\
gttagatactcactctaattttggacaacaatcccaatcttggggtcgtctatcgcctga\n\
agctcgtaaatccttccatcttaaacgattacatattatagacttgttcggggtagagat\n\
atcacagttgtgcaaacattgtaaatcgatactagtttatgttggtagtctagttgcttt\n\
taccattccccgaaaaacttgatctactatttcgacaacagtaaacttgaactaggtaag\n\
tgaaaacagagaatgcctcatagtgccactatttgtccactatatgtaagtgtagcttta\n\
cataatccactatgactgagatcattacggcctaggaaagcagcgtagaaaaaaagggcc\n\
cggatattacgactgtaactataaaactagttactggtagcgcgccatgtatagatttgt\n\
tttaccggttgtggttgcgttaacgaatttcagccgcgaaaattgatccgttaaccagtc\n\
catctcgacttctataaaacgataaagtaaagttgatgttcagcctccttcttatggttg\n\
catcgagagtacactactcagtgggaaatagatcggggttcctacttcagattgtattat\n\
ctaggcaattgccgattgtgccatacctggataaaataagctacctacatgtgatgctta\n\
tctattatcgtcatactaccttagggtgtcctgttgaacgctacattaatctttagccgt\n\
ttgagatgttccaatggataggagtctaacgcatgatgaagtttaggaaggcagagcatc\n\
ccactaagtatgtgacagtgtatttcgaaacgagacgttataaatagaaaaaaggtcctt\n\
ctggttctattctgctgaactattgaatggaaagattggttgacctacgtactatttgct\n\
tgaagtcatcaatttgacggggtgagagacatatggtgcatactttacggactctatatt\n\
ttagatcagaagcttagcagtcttctctacaccccctcacgacataattgcttttaagaa\n\
tctatgtttgattcctctacgggaattcggatccgttcgcatgtgcggtttatctaaacc\n\
aggggacatatgttcagctaaagcatacgaacactttgctaactagacgtatgtatagta\n\
gctataaatcccgacgatatttacaaaaagaaatgagactcaaatatatacatagcgacc\n\
ctacacttattcgcaccctgatctaggcgatcctagcacccacacccgaaagtgagcact\n\
agtgtcttccgtattaaatttactgcagttgagattttagttgtctactaaggattactc\n\
taacccgtaataaggatcaagactcggtactagctttactatcattccctatgtgttttc\n\
ctaactcacaagggtacgtaccagcctatgtaattacaataatgataaagacacaaagga\n\
agtaactttacaaatgagtctccagttacactagcttagtccctcccatcttgctttgaa\n\
gtctaaatacgcaatctctgaggatatacagcagaagaacactcataacgttggagtcca\n\
agaattagactcatagggcccccaacatttaatatgtactgtgagtttgaaggtgttcta\n\
ttgttaattcctgctcttgatacatgacacgtactccgtgtttaaggcttcggactgact\n\
ttctttcataagttgagcaacgaaaatttcagaatcgataagttggattcactaactaat\n\
acggctgattgaaaactccactccggacctatatggtcgacctttatacgtaaccgatat\n\
aaaacttataggctggtatatcgagccttcctagcgcaatttcggatggggtttcttcta\n\
ctactcaacaacggaatagtctttgtttagtaaaccagagctcaggacgcccaatacgta\n\
ggagagcgctgtggagcatgtgtcattatggactggagcactcttaaatcactctgcgtg\n\
tgctaaacgatagatcataacatgtcctgagtaaattttcttgatacgtcgcaatatacc\n\
gttattagttaaacgttctcatccgtcatgcgtgaaatacggctgtcgtgctcagatata\n\
ctattagcgactcatctcgcctaacacgcacacgtataaactcggaatgactgccgctct\n\
tacatattagaaatacagactacaccacggaagcattgggtcattctcaaccgctgtata\n\
aaagatgattagtcttataataagattaccaaagaggcagaatcatgggtagtaaatcta\n\
ttattcaagtgattaccgtcgtgtaggcagggagtgaggacgagatggtactcaggacaa\n\
atattaaccggacgaagtggtttacgtcgtactttcactattagtagtaaatacaaggta\n\
acaccggggaatagtactaaatataatgatatctatcttcgggagaacgagtcgtctatt\n\
gctttgaacattctcaaggcgtaaaatgtgctgacttatagcatgatacaaccgattgtt\n\
acttttgtctattcaaaagattgaatagttttttatacaaaagccgcatacttatgacgg\n\
ctagtatacagtttcatcccctagcatcaatgctatggacagtattgaacttataggaaa\n\
ttcttctaatagggcaaatccgtcgtgatgcctattttttttcagtcacatcctcaaatg\n\
gcactagtattgtcgggatcccattaacaggctcaaccacgagctcacgcgaggacatgt\n\
agtccgtatctttaacgaagcgacagcgacagaactcccatggataaccaattataaggc\n\
ccgtaatcctctagacatcgtttaccaataaatccgctttctccgtaatcatgttgaata\n\
ccccagagtagtccagatgataaccgatgaaacacaagtctttctcaatgcacttacggt\n\
gaacttattaccgccaacgtagctcatcaaggttgcgacatctagttgtgtgtttgcgac\n\
gagcccagcgaacttcatcaactttcgtatattcaacgccttgtaattttactttaagac\n\
gcctggtgatgtagattcttagataatcagtttgttatcggctgtactttaccataattt\n\
cacaggtttcaggtcaagaagattatagctgtatatacagttccatgctcggtgcacaga\n\
aacgtgatcggataataatcaatcgcttatgtcgtctttaggcgtatccaatacatgccc\n\
cgataccgcagtgtatttcgacatgtaggtataccgtcgcatttgagctcgagtcaggac\n\
gtcagctagattagattccttaatagaatataccgacctctagtccgaactaaactatag\n\
ataacgccaacttcaggttaattgtctagtcgtctgtttgcagatgggattcttagatga\n\
gtgagtatcggccatattggttcgagcactttagtttttgatgcataggatatgcaatgt\n\
atagctgaaagtactttatctgtttcaaactcacattgattaaaccggtaaacctttaaa\n\
gactacaagaaaatattcagtgagggcaattttgtcaatcacaatcttccagctagagat\n\
acttcacaatttgtcttgaggctacgcaacattagacggattttcgcgttttattgaaat\n\
aatcgaggggcccaagagtatccatagttcattttgtaagatttctttacaggcttatta\n\
cagcttcttcagactcctacatgcttacgagttatatgctagcatgtgaacaatagatta\n\
atatacaggaaaacgtacattgagagagatgaccctacacagcgcaaccgttgagtactt\n\
tcattaaagggtaacgctctcgagacagcatccttaagatggccttattgtcaaatcatt\n\
tgcagaagtacgcaagatccctaaccaacgtagaagaatccctacaaacacatgagacgc\n\
ggtgaaaatagacagggtgttagtattcaatcttcggagtatcaatttcgccaatcttgg\n\
tgagaaagcataccctttcttcagagaaagaagatcaatcataacactatctttaacgag\n\
gtacgcacgcgcatcattacctgcctccatggatctttaggatagcggaaagtattggca\n\
gcgtattgtgatttcgttcctactttatcaatttcacattcatatacatgtcttttatca\n\
aaatcgccaataagataggatgagctatattagatgctagtagagttcgcgccaacatca\n\
tcgataggaatactcaggacagcgtgataggacttttcaatccctaatactctctataat\n\
tataactctctcttaagtttggaggcagtaacgcgctctatataatcagtttgctgcacc\n\
attcttcagcctctgatacatacaaataaattccacagcagtaagagggtttaattgaga\n\
catcttgggaacttaggattttactctaacatcaccgaaacgattattggataccgtacc\n\
taaacgaactttctcaaggcagtaatataggacatccgcaataacacaaatgctgcctcc\n\
ccaggagttatgtcttcctggaggctatatcttacacccactcactataggcaaactaaa\n\
gtttaaatgttgattgtctaaaaaaaagatagataagagttggccggcgtagcacatgcg\n\
aaagtgaatcgtaagctataattctctggacttgaagttctgtcctgttcctctgcaaga\n\
aacaaacttcctttaaagctatttacgacgcacatctcagcaagttataaacatgttgga\n\
agtttctagtcggaattcccaaagaacggatctatctaatgcattcctacatttttcctg\n\
tctgccgatggtgccatcctattcaaagaatttcttaaaagtagattaaatgggactttt\n\
aacaatgagtaaccttacgcctctaagggttcctcgagtgccatacaccagtcaggtccg\n\
agccacatacacggagaacattctaacatagcattctcaactcgatcatttgcaggttac\n\
ttctttcctatcctagtgctaaaaatcatacttgcaatcccatagcacggattaagaacc\n\
taagaaacaattcagtaaaacatgttcgaattcttggtatgggaacatcattgcagctat\n\
ggtctaacgcattaatgtttgggtacatcttccatcatataaacaggaagagtctgacga\n\
cagggagtgcttgcgatcatgtctatcattgtgaaatcaaattgtagctcacatgtcgtc\n\
tatgagagcgtgtatccgataagatttagaaaaatagaagtcgtataagatctcactgaa\n\
cttttgaatgaatgtgaagcatatatgatctgctttaataaaactttatccataggatac\n\
gtttccaaatcaattcaataattattagtcaaaatagataaggatgaacaacctgaaggc\n\
cgatcggacgtagaaagtggtcccatcactttgagttgatattgttgaaccacacgttat\n\
tatggttttcaaacagtctcaggatattgtatatacagataatccgataccagttgtctg\n\
acgcccctcttacgtaccccaccctttgtgacgtttaaagcagttgttcagtattttaaa\n\
ctaggcggcaactaatttggaaagaagcacagtggatatgtctaaattcttgttattcag\n\
gcctgaatttaatacaccgcatagttaacttcgcggtagagttgttcatcatgcctcctc\n\
taagctaccacttctatgatacaccaatagttgttctacggaatctgataattggccaag\n\
tcataaacttccgctgcgttcaacccccttgctcgaatatccaactcgaaaagacagcct\n\
tttggtgtccggaacaaatcagttacttcttttctgatgttaattctctgtggtcagata\n\
cagaccaaaaactccgcggatttaccatcctccaagaacaaatttgcatcaacatagcat\n\
tttggctacatattctaagtctcaatagtttaggttttcaactacattatcccaacatta\n\
ggattggaggaataatagctgggtaagtccccttgcgtctacaatcgactattttttatg\n\
aatatgcttctgccgcacctatggttattaaaaaagtcatgactttgaagaaccctgaaa\n\
agatagatgaatcaggtgtaatggcagcagccaaagagcatataattagcaacactctaa\n\
gaacattatagatatgatgatagcgatcgtcatgatgttatccggtcacaatagtagctt\n\
catcagctaattcgttttgccagtggtgacttgcgctggaagaatcgttatacggtccct\n\
tccctcttgatacggtgggggcttattcaaccgcgtggattgggttgtcatacttgcatt\n\
aaacgatgtaaaccatctagtagtcaactatactaaatcacaaaatagtgatcaatacat\n\
acccgcttcatggttttaaccatttaattgattaaagatattccgctaagaaccattatc\n\
tacctaaactgatcgccgtatcctagtagtttgaaatttgatgtaccgtaatgatcaacg\n\
aagtaaaacgttatattgtatgtagaataataggtcttggagctaaatgatgtgattggt\n\
agtgaagacttacccttacaactttaccggtttctcggaagaatatactagagaatcaat\n\
gcatgggctacataagcactttagtctaatgagataaaaaatacacgagtcttccatcat\n\
gaattttttgtcgaaaaactcgaacctggtaatttaaaccatatatctttatgtcgtcaa\n\
taactctcatatgttttatataacttcccaatcacgacttgtaactgcttgttcgactga\n\
gctgtttgagctatgaggccgggatccggttgagctacatctatttgctacaagaaaaat\n\
gaaagcacatttgttgggagttctggctacactcatagagaaataagtggcccgagtggg\n\
tgcggcctgcctccatattcaagtgtatcttaaaccaagtggttccaacgctcgcgctaa\n\
agaattaaagcctttatttcctccacggagtagcccgtaatccggttcgaaagagaccat\n\
tgaagttaattttcatatccagtgaagtttaggcacaagcatgtgttctgccacatgcct\n\
caaagcgctcttcaaccaagatatgattcatcctaacttcgatgaatgcgtctgtaacat\n\
aaatatagaaggaatgattcggcgagttaattttcgccttctccaacatggcatccctac\n\
gttcgttataaggaccatacatgtaggttttaaaggtttgcggttaatcgatatttacat\n\
catagaaattctatagtcaaatttacaagactctagatactcactcgttgcagccggcta\n\
ggaagcgctttgtaccttacttcccttttcgttgcgtaatatgaatttcatatagtaagt\n\
tcaaggcactcatacctccgtgaagagggtagatagactattaaagttgtttaatagtac\n\
gtattgatggaaatgacccgtaggagatttaccactcaatccacaagattcgctgctgtg\n\
cattatcaaaacagtgcatgtcgaaacatgggttgggtccttcaaacacgaatccaggta\n\
gagatacctttgcaattttt\n";

dnaInput = dnaInput + dnaInput + dnaInput;

var ilen, clen,
 seqs = [
  /agggtaaa|tttaccct/ig,
  /[cgt]gggtaaa|tttaccc[acg]/ig,
  /a[act]ggtaaa|tttacc[agt]t/ig,
  /ag[act]gtaaa|tttac[agt]ct/ig,
  /agg[act]taaa|ttta[agt]cct/ig,
  /aggg[acg]aaa|ttt[cgt]ccct/ig,
  /agggt[cgt]aa|tt[acg]accct/ig,
  /agggta[cgt]a|t[acg]taccct/ig,
  /agggtaa[cgt]|[acg]ttaccct/ig],
 subs = {
  B: '(c|g|t)', D: '(a|g|t)', H: '(a|c|t)', K: '(g|t)',
  M: '(a|c)', N: '(a|c|g|t)', R: '(a|g)', S: '(c|t)',
  V: '(a|c|g)', W: '(a|t)', Y: '(c|t)' }

ilen = dnaInput.length;

// There is no in-place substitution
dnaInput = dnaInput.replace(/>.*\n|\n/g,"")
clen = dnaInput.length

var dnaOutputString;

for(i in seqs)
    dnaOutputString += seqs[i].source + " " + (dnaInput.match(seqs[i]) || []).length + "\n";
 // match returns null if no matches, so replace with empty

for(k in subs)
 dnaInput = dnaInput.replace(k, subs[k]) // FIXME: Would like this to be a global substitution in a future version of SunSpider.
 // search string, replacement string, flags
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Mozilla XML-RPC Client component.
 *
 * The Initial Developer of the Original Code is
 * Digital Creations 2, Inc.
 * Portions created by the Initial Developer are Copyright (C) 2000
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Martijn Pieters <mj@digicool.com> (original author)
 *   Samuel Sieb <samuel@sieb.net>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

// From: http://lxr.mozilla.org/mozilla/source/extensions/xml-rpc/src/nsXmlRpcClient.js#956

/* Convert data (an array of integers) to a Base64 string. */
var toBase64Table = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
var base64Pad = '=';

function toBase64(data) {
    var result = '';
    var length = data.length;
    var i;
    // Convert every three bytes to 4 ascii characters.
    for (i = 0; i < (length - 2); i += 3) {
        result += toBase64Table[data[i] >> 2];
        result += toBase64Table[((data[i] & 0x03) << 4) + (data[i+1] >> 4)];
        result += toBase64Table[((data[i+1] & 0x0f) << 2) + (data[i+2] >> 6)];
        result += toBase64Table[data[i+2] & 0x3f];
    }

    // Convert the remaining 1 or 2 bytes, pad out to 4 characters.
    if (length%3) {
        i = length - (length%3);
        result += toBase64Table[data[i] >> 2];
        if ((length%3) == 2) {
            result += toBase64Table[((data[i] & 0x03) << 4) + (data[i+1] >> 4)];
            result += toBase64Table[(data[i+1] & 0x0f) << 2];
            result += base64Pad;
        } else {
            result += toBase64Table[(data[i] & 0x03) << 4];
            result += base64Pad + base64Pad;
        }
    }

    return result;
}

/* Convert Base64 data to a string */
var toBinaryTable = [
    -1,-1,-1,-1, -1,-1,-1,-1, -1,-1,-1,-1, -1,-1,-1,-1,
    -1,-1,-1,-1, -1,-1,-1,-1, -1,-1,-1,-1, -1,-1,-1,-1,
    -1,-1,-1,-1, -1,-1,-1,-1, -1,-1,-1,62, -1,-1,-1,63,
    52,53,54,55, 56,57,58,59, 60,61,-1,-1, -1, 0,-1,-1,
    -1, 0, 1, 2,  3, 4, 5, 6,  7, 8, 9,10, 11,12,13,14,
    15,16,17,18, 19,20,21,22, 23,24,25,-1, -1,-1,-1,-1,
    -1,26,27,28, 29,30,31,32, 33,34,35,36, 37,38,39,40,
    41,42,43,44, 45,46,47,48, 49,50,51,-1, -1,-1,-1,-1
];

function base64ToString(data) {
    var result = '';
    var leftbits = 0; // number of bits decoded, but yet to be appended
    var leftdata = 0; // bits decoded, but yet to be appended

    // Convert one by one.
    for (var i = 0; i < data.length; i++) {
        var c = toBinaryTable[data.charCodeAt(i) & 0x7f];
        var padding = (data[i] == base64Pad);
        // Skip illegal characters and whitespace
        if (c == -1) continue;
        
        // Collect data into leftdata, update bitcount
        leftdata = (leftdata << 6) | c;
        leftbits += 6;

        // If we have 8 or more bits, append 8 bits to the result
        if (leftbits >= 8) {
            leftbits -= 8;
            // Append if not padding.
            if (!padding)
                result += String.fromCharCode((leftdata >> leftbits) & 0xff);
            leftdata &= (1 << leftbits) - 1;
        }
    }

    // If there are any bits left, the base64 string was corrupted
    if (leftbits)
        throw Components.Exception('Corrupted base64 string');

    return result;
}

var str = "";

for ( var i = 0; i < 8192; i++ )
        str += String.fromCharCode( (25 * Math.random()) + 97 );

for ( var i = 8192; i <= 16384; i *= 2 ) {

    var base64;

    base64 = toBase64(str);
    base64ToString(base64);

    // Double the string
    str += str;
}

toBinaryTable = null;
// The Great Computer Language Shootout
//  http://shootout.alioth.debian.org
//
//  Contributed by Ian Osgood

var last = 42, A = 3877, C = 29573, M = 139968;

function rand(max) {
  last = (last * A + C) % M;
  return max * last / M;
}

var ALU =
  "GGCCGGGCGCGGTGGCTCACGCCTGTAATCCCAGCACTTTGG" +
  "GAGGCCGAGGCGGGCGGATCACCTGAGGTCAGGAGTTCGAGA" +
  "CCAGCCTGGCCAACATGGTGAAACCCCGTCTCTACTAAAAAT" +
  "ACAAAAATTAGCCGGGCGTGGTGGCGCGCGCCTGTAATCCCA" +
  "GCTACTCGGGAGGCTGAGGCAGGAGAATCGCTTGAACCCGGG" +
  "AGGCGGAGGTTGCAGTGAGCCGAGATCGCGCCACTGCACTCC" +
  "AGCCTGGGCGACAGAGCGAGACTCCGTCTCAAAAA";

var IUB = {
  a:0.27, c:0.12, g:0.12, t:0.27,
  B:0.02, D:0.02, H:0.02, K:0.02,
  M:0.02, N:0.02, R:0.02, S:0.02,
  V:0.02, W:0.02, Y:0.02
}

var HomoSap = {
  a: 0.3029549426680,
  c: 0.1979883004921,
  g: 0.1975473066391,
  t: 0.3015094502008
}

function makeCumulative(table) {
  var last = null;
  for (var c in table) {
    if (last) table[c] += table[last];
    last = c;
  }
}

function fastaRepeat(n, seq) {
  var seqi = 0, lenOut = 60;
  while (n>0) {
    if (n<lenOut) lenOut = n;
    if (seqi + lenOut < seq.length) {
      ret = seq.substring(seqi, seqi+lenOut);
      seqi += lenOut;
    } else {
      var s = seq.substring(seqi);
      seqi = lenOut - s.length;
      ret = s + seq.substring(0, seqi);
    }
    n -= lenOut;
  }
}

function fastaRandom(n, table) {
  var line = new Array(60);
  makeCumulative(table);
  while (n>0) {
    if (n<line.length) line = new Array(n);
    for (var i=0; i<line.length; i++) {
      var r = rand(1);
      for (var c in table) {
        if (r < table[c]) {
          line[i] = c;
          break;
        }
      }
    }
    ret = line.join('');
    n -= line.length;
  }
}

var ret;

var count = 7;
ret = fastaRepeat(2*count*100000, ALU);
ret = fastaRandom(3*count*1000, IUB);
ret = fastaRandom(5*count*1000, HomoSap);


/*
 * Copyright (C) 2007 Apple Inc.  All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE COMPUTER, INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE COMPUTER, INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. 
 */

/*
    Portions from:
    json.js
    2007-10-10

    Public Domain
*/

// This test parses a JSON string giving tag names and popularity, and
// generates html markup for a "tagcloud" view.

if (!Object.prototype.toJSONString) {

    Array.prototype.toJSONString = function (w) {
        var a = [],     // The array holding the partial texts.
            i,          // Loop counter.
            l = this.length,
            v;          // The value to be stringified.

        for (i = 0; i < l; i += 1) {
            v = this[i];
            switch (typeof v) {
            case 'object':

                if (v && typeof v.toJSONString === 'function') {
                    a.push(v.toJSONString(w));
                } else {
                    a.push('null');
                }
                break;

            case 'string':
            case 'number':
            case 'boolean':
                a.push(v.toJSONString());
                break;
            default:
                a.push('null');
            }
        }

        return '[' + a.join(',') + ']';
    };


    Boolean.prototype.toJSONString = function () {
        return String(this);
    };


    Date.prototype.toJSONString = function () {

        function f(n) {

            return n < 10 ? '0' + n : n;
        }

        return '"' + this.getUTCFullYear()   + '-' +
                   f(this.getUTCMonth() + 1) + '-' +
                   f(this.getUTCDate())      + 'T' +
                   f(this.getUTCHours())     + ':' +
                   f(this.getUTCMinutes())   + ':' +
                   f(this.getUTCSeconds())   + 'Z"';
    };


    Number.prototype.toJSONString = function () {

        return isFinite(this) ? String(this) : 'null';
    };


    Object.prototype.toJSONString = function (w) {
        var a = [],     // The array holding the partial texts.
            k,          // The current key.
            i,          // The loop counter.
            v;          // The current value.

        if (w) {
            for (i = 0; i < w.length; i += 1) {
                k = w[i];
                if (typeof k === 'string') {
                    v = this[k];
                    switch (typeof v) {
                    case 'object':

                        if (v) {
                            if (typeof v.toJSONString === 'function') {
                                a.push(k.toJSONString() + ':' +
                                       v.toJSONString(w));
                            }
                        } else {
                            a.push(k.toJSONString() + ':null');
                        }
                        break;

                    case 'string':
                    case 'number':
                    case 'boolean':
                        a.push(k.toJSONString() + ':' + v.toJSONString());

                    }
                }
            }
        } else {

            for (k in this) {
                if (typeof k === 'string' &&
                        Object.prototype.hasOwnProperty.apply(this, [k])) {
                    v = this[k];
                    switch (typeof v) {
                    case 'object':

                        if (v) {
                            if (typeof v.toJSONString === 'function') {
                                a.push(k.toJSONString() + ':' +
                                       v.toJSONString());
                            }
                        } else {
                            a.push(k.toJSONString() + ':null');
                        }
                        break;

                    case 'string':
                    case 'number':
                    case 'boolean':
                        a.push(k.toJSONString() + ':' + v.toJSONString());

                    }
                }
            }
        }

        return '{' + a.join(',') + '}';
    };


    (function (s) {

        var m = {
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        };


        s.parseJSON = function (filter) {
            var j;

            function walk(k, v) {
                var i, n;
                if (v && typeof v === 'object') {
                    for (i in v) {
                        if (Object.prototype.hasOwnProperty.apply(v, [i])) {
                            n = walk(i, v[i]);
                            if (n !== undefined) {
                                v[i] = n;
                            }
                        }
                    }
                }
                return filter(k, v);
            }

            if (/^[\],:{}\s]*$/.test(this.replace(/\\./g, '@').
                    replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(:?[eE][+\-]?\d+)?/g, ']').
                    replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

                j = eval('(' + this + ')');

                return typeof filter === 'function' ? walk('', j) : j;
            }

            throw new SyntaxError('parseJSON');
        };


        s.toJSONString = function () {

            if (/["\\\x00-\x1f]/.test(this)) {
                return '"' + this.replace(/[\x00-\x1f\\"]/g, function (a) {
                    var c = m[a];
                    if (c) {
                        return c;
                    }
                    c = a.charCodeAt();
                    return '\\u00' + Math.floor(c / 16).toString(16) +
                                               (c % 16).toString(16);
                }) + '"';
            }
            return '"' + this + '"';
        };
    })(String.prototype);
}

var tagInfoJSON = '[\n  {\n    \"tag\": "titillation",\n    \"popularity\": 4294967296\n  },\n  {\n    \"tag\": "foamless",\n    \"popularity\": 1257718401\n  },\n  {\n    \"tag\": "snarler",\n    \"popularity\": 613166183\n  },\n  {\n    \"tag\": "multangularness",\n    \"popularity\": 368304452\n  },\n  {\n    \"tag\": "Fesapo unventurous",\n    \"popularity\": 248026512\n  },\n  {\n    \"tag\": "esthesioblast",\n    \"popularity\": 179556755\n  },\n  {\n    \"tag\": "echeneidoid",\n    \"popularity\": 136641578\n  },\n  {\n    \"tag\": "embryoctony",\n    \"popularity\": 107852576\n  },\n  {\n    \"tag\": "undilatory",\n    \"popularity\": 87537981\n  },\n  {\n    \"tag\": "predisregard",\n    \"popularity\": 72630939\n  },\n  {\n    \"tag\": "allergenic",\n    \"popularity\": 61345190\n  },\n  {\n    \"tag\": "uncloudy",\n    \"popularity\": 52580571\n  },\n  {\n    \"tag\": "unforeseeably",\n    \"popularity\": 45628109\n  },\n  {\n    \"tag\": "sturniform",\n    \"popularity\": 40013489\n  },\n  {\n    \"tag\": "anesthetize",\n    \"popularity\": 35409226\n  },\n  {\n    \"tag\": "ametabolia",\n    \"popularity\": 31583050\n  },\n  {\n    \"tag\": "angiopathy",\n    \"popularity\": 28366350\n  },\n  {\n    \"tag\": "sultanaship",\n    \"popularity\": 25634218\n  },\n  {\n    \"tag\": "Frenchwise",\n    \"popularity\": 23292461\n  },\n  {\n    \"tag\": "cerviconasal",\n    \"popularity\": 21268909\n  },\n  {\n    \"tag\": "mercurialness",\n    \"popularity\": 19507481\n  },\n  {\n    \"tag\": "glutelin venditate",\n    \"popularity\": 17964042\n  },\n  {\n    \"tag\": "acred overblack",\n    \"popularity\": 16603454\n  },\n  {\n    \"tag\": "Atik",\n    \"popularity\": 15397451\n  },\n  {\n    \"tag\": "puncturer",\n    \"popularity\": 14323077\n  },\n  {\n    \"tag\": "pukatea",\n    \"popularity\": 13361525\n  },\n  {\n    \"tag\": "suberize",\n    \"popularity\": 12497261\n  },\n  {\n    \"tag\": "Godfrey",\n    \"popularity\": 11717365\n  },\n  {\n    \"tag\": "tetraptote",\n    \"popularity\": 11011011\n  },\n  {\n    \"tag\": "lucidness",\n    \"popularity\": 10369074\n  },\n  {\n    \"tag\": "tartness",\n    \"popularity\": 9783815\n  },\n  {\n    \"tag\": "axfetch",\n    \"popularity\": 9248634\n  },\n  {\n    \"tag\": "preacquittal",\n    \"popularity\": 8757877\n  },\n  {\n    \"tag\": "matris",\n    \"popularity\": 8306671\n  },\n  {\n    \"tag\": "hyphenate",\n    \"popularity\": 7890801\n  },\n  {\n    \"tag\": "semifabulous",\n    \"popularity\": 7506606\n  },\n  {\n    \"tag\": "oppressiveness",\n    \"popularity\": 7150890\n  },\n  {\n    \"tag\": "Protococcales",\n    \"popularity\": 6820856\n  },\n  {\n    \"tag\": "unpreventive",\n    \"popularity\": 6514045\n  },\n  {\n    \"tag\": "Cordia",\n    \"popularity\": 6228289\n  },\n  {\n    \"tag\": "Wakamba leaflike",\n    \"popularity\": 5961668\n  },\n  {\n    \"tag\": "dacryoma",\n    \"popularity\": 5712480\n  },\n  {\n    \"tag\": "inguinal",\n    \"popularity\": 5479211\n  },\n  {\n    \"tag\": "responseless",\n    \"popularity\": 5260507\n  },\n  {\n    \"tag\": "supplementarily",\n    \"popularity\": 5055158\n  },\n  {\n    \"tag\": "emu",\n    \"popularity\": 4862079\n  },\n  {\n    \"tag\": "countermeet",\n    \"popularity\": 4680292\n  },\n  {\n    \"tag\": "purrer",\n    \"popularity\": 4508918\n  },\n  {\n    \"tag\": "Corallinaceae",\n    \"popularity\": 4347162\n  },\n  {\n    \"tag\": "speculum",\n    \"popularity\": 4194304\n  },\n  {\n    \"tag\": "crimpness",\n    \"popularity\": 4049690\n  },\n  {\n    \"tag\": "antidetonant",\n    \"popularity\": 3912727\n  },\n  {\n    \"tag\": "topeewallah",\n    \"popularity\": 3782875\n  },\n  {\n    \"tag\": "fidalgo ballant",\n    \"popularity\": 3659640\n  },\n  {\n    \"tag\": "utriculose",\n    \"popularity\": 3542572\n  },\n  {\n    \"tag\": "testata",\n    \"popularity\": 3431259\n  },\n  {\n    \"tag\": "beltmaking",\n    \"popularity\": 3325322\n  },\n  {\n    \"tag\": "necrotype",\n    \"popularity\": 3224413\n  },\n  {\n    \"tag\": "ovistic",\n    \"popularity\": 3128215\n  },\n  {\n    \"tag\": "swindlership",\n    \"popularity\": 3036431\n  },\n  {\n    \"tag\": "augustal",\n    \"popularity\": 2948792\n  },\n  {\n    \"tag\": "Titoist",\n    \"popularity\": 2865047\n  },\n  {\n    \"tag\": "trisoctahedral",\n    \"popularity\": 2784963\n  },\n  {\n    \"tag\": "sequestrator",\n    \"popularity\": 2708327\n  },\n  {\n    \"tag\": "sideburns",\n    \"popularity\": 2634939\n  },\n  {\n    \"tag\": "paraphrasia",\n    \"popularity\": 2564616\n  },\n  {\n    \"tag\": "graminology unbay",\n    \"popularity\": 2497185\n  },\n  {\n    \"tag\": "acaridomatium emargination",\n    \"popularity\": 2432487\n  },\n  {\n    \"tag\": "roofward",\n    \"popularity\": 2370373\n  },\n  {\n    \"tag\": "lauder",\n    \"popularity\": 2310705\n  },\n  {\n    \"tag\": "subjunctive",\n    \"popularity\": 2253354\n  },\n  {\n    \"tag\": "subelongate",\n    \"popularity\": 2198199\n  },\n  {\n    \"tag\": "guacimo",\n    \"popularity\": 2145128\n  },\n  {\n    \"tag\": "cockade",\n    \"popularity\": 2094033\n  },\n  {\n    \"tag\": "misgauge",\n    \"popularity\": 2044818\n  },\n  {\n    \"tag\": "unexpensive",\n    \"popularity\": 1997388\n  },\n  {\n    \"tag\": "chebel",\n    \"popularity\": 1951657\n  },\n  {\n    \"tag\": "unpursuing",\n    \"popularity\": 1907543\n  },\n  {\n    \"tag\": "kilobar",\n    \"popularity\": 1864969\n  },\n  {\n    \"tag\": "obsecration",\n    \"popularity\": 1823863\n  },\n  {\n    \"tag\": "nacarine",\n    \"popularity\": 1784157\n  },\n  {\n    \"tag\": "spirituosity",\n    \"popularity\": 1745787\n  },\n  {\n    \"tag\": "movableness deity",\n    \"popularity\": 1708692\n  },\n  {\n    \"tag\": "exostracism",\n    \"popularity\": 1672816\n  },\n  {\n    \"tag\": "archipterygium",\n    \"popularity\": 1638104\n  },\n  {\n    \"tag\": "monostrophic",\n    \"popularity\": 1604506\n  },\n  {\n    \"tag\": "gynecide",\n    \"popularity\": 1571974\n  },\n  {\n    \"tag\": "gladden",\n    \"popularity\": 1540462\n  },\n  {\n    \"tag\": "throughbred",\n    \"popularity\": 1509927\n  },\n  {\n    \"tag\": "groper",\n    \"popularity\": 1480329\n  },\n  {\n    \"tag\": "Xenosaurus",\n    \"popularity\": 1451628\n  },\n  {\n    \"tag\": "photoetcher",\n    \"popularity\": 1423788\n  },\n  {\n    \"tag\": "glucosid",\n    \"popularity\": 1396775\n  },\n  {\n    \"tag\": "Galtonian",\n    \"popularity\": 1370555\n  },\n  {\n    \"tag\": "mesosporic",\n    \"popularity\": 1345097\n  },\n  {\n    \"tag\": "theody",\n    \"popularity\": 1320370\n  },\n  {\n    \"tag\": "zaffer",\n    \"popularity\": 1296348\n  },\n  {\n    \"tag\": "probiology",\n    \"popularity\": 1273003\n  },\n  {\n    \"tag\": "rhizomic",\n    \"popularity\": 1250308\n  },\n  {\n    \"tag\": "superphosphate",\n    \"popularity\": 1228240\n  },\n  {\n    \"tag\": "Hippolytan",\n    \"popularity\": 1206776\n  },\n  {\n    \"tag\": "garget",\n    \"popularity\": 1185892\n  },\n  {\n    \"tag\": "diploplacula",\n    \"popularity\": 1165568\n  },\n  {\n    \"tag\": "orohydrographical",\n    \"popularity\": 1145785\n  },\n  {\n    \"tag\": "enhypostatize",\n    \"popularity\": 1126521\n  },\n  {\n    \"tag\": "polisman",\n    \"popularity\": 1107759\n  },\n  {\n    \"tag\": "acetometer",\n    \"popularity\": 1089482\n  },\n  {\n    \"tag\": "unsnatched",\n    \"popularity\": 1071672\n  },\n  {\n    \"tag\": "yabber",\n    \"popularity\": 1054313\n  },\n  {\n    \"tag\": "demiwolf",\n    \"popularity\": 1037390\n  },\n  {\n    \"tag\": "chromascope",\n    \"popularity\": 1020888\n  },\n  {\n    \"tag\": "seamanship",\n    \"popularity\": 1004794\n  },\n  {\n    \"tag\": "nonfenestrated",\n    \"popularity\": 989092\n  },\n  {\n    \"tag\": "hydrophytism",\n    \"popularity\": 973771\n  },\n  {\n    \"tag\": "dotter",\n    \"popularity\": 958819\n  },\n  {\n    \"tag\": "thermoperiodism",\n    \"popularity\": 944222\n  },\n  {\n    \"tag\": "unlawyerlike",\n    \"popularity\": 929970\n  },\n  {\n    \"tag\": "enantiomeride citywards",\n    \"popularity\": 916052\n  },\n  {\n    \"tag\": "unmetallurgical",\n    \"popularity\": 902456\n  },\n  {\n    \"tag\": "prickled",\n    \"popularity\": 889174\n  },\n  {\n    \"tag\": "strangerwise manioc",\n    \"popularity\": 876195\n  },\n  {\n    \"tag\": "incisorial",\n    \"popularity\": 863510\n  },\n  {\n    \"tag\": "irrationalize",\n    \"popularity\": 851110\n  },\n  {\n    \"tag\": "nasology",\n    \"popularity\": 838987\n  },\n  {\n    \"tag\": "fatuism",\n    \"popularity\": 827131\n  },\n  {\n    \"tag\": "Huk",\n    \"popularity\": 815535\n  },\n  {\n    \"tag\": "properispomenon",\n    \"popularity\": 804192\n  },\n  {\n    \"tag\": "unpummelled",\n    \"popularity\": 793094\n  },\n  {\n    \"tag\": "technographically",\n    \"popularity\": 782233\n  },\n  {\n    \"tag\": "underfurnish",\n    \"popularity\": 771603\n  },\n  {\n    \"tag\": "sinter",\n    \"popularity\": 761198\n  },\n  {\n    \"tag\": "lateroanterior",\n    \"popularity\": 751010\n  },\n  {\n    \"tag\": "nonpersonification",\n    \"popularity\": 741034\n  },\n  {\n    \"tag\": "Sitophilus",\n    \"popularity\": 731264\n  },\n  {\n    \"tag\": "unstudded overexerted",\n    \"popularity\": 721694\n  },\n  {\n    \"tag\": "tracheation",\n    \"popularity\": 712318\n  },\n  {\n    \"tag\": "thirteenth begloze",\n    \"popularity\": 703131\n  },\n  {\n    \"tag\": "bespice",\n    \"popularity\": 694129\n  },\n  {\n    \"tag\": "doppia",\n    \"popularity\": 685305\n  },\n  {\n    \"tag\": "unadorned",\n    \"popularity\": 676656\n  },\n  {\n    \"tag\": "dovelet engraff",\n    \"popularity\": 668176\n  },\n  {\n    \"tag\": "diphyozooid",\n    \"popularity\": 659862\n  },\n  {\n    \"tag\": "mure",\n    \"popularity\": 651708\n  },\n  {\n    \"tag\": "Tripitaka",\n    \"popularity\": 643710\n  },\n  {\n    \"tag\": "Billjim",\n    \"popularity\": 635865\n  },\n  {\n    \"tag\": "pyramidical",\n    \"popularity\": 628169\n  },\n  {\n    \"tag\": "circumlocutionist",\n    \"popularity\": 620617\n  },\n  {\n    \"tag\": "slapstick",\n    \"popularity\": 613207\n  },\n  {\n    \"tag\": "preobedience",\n    \"popularity\": 605934\n  },\n  {\n    \"tag\": "unfriarlike",\n    \"popularity\": 598795\n  },\n  {\n    \"tag\": "microchromosome",\n    \"popularity\": 591786\n  },\n  {\n    \"tag\": "Orphicism",\n    \"popularity\": 584905\n  },\n  {\n    \"tag\": "peel",\n    \"popularity\": 578149\n  },\n  {\n    \"tag\": "obediential",\n    \"popularity\": 571514\n  },\n  {\n    \"tag\": "Peripatidea",\n    \"popularity\": 564997\n  },\n  {\n    \"tag\": "undoubtful",\n    \"popularity\": 558596\n  },\n  {\n    \"tag\": "lodgeable",\n    \"popularity\": 552307\n  },\n  {\n    \"tag\": "pustulated woodchat",\n    \"popularity\": 546129\n  },\n  {\n    \"tag\": "antepast",\n    \"popularity\": 540057\n  },\n  {\n    \"tag\": "sagittoid matrimoniously",\n    \"popularity\": 534091\n  },\n  {\n    \"tag\": "Albizzia",\n    \"popularity\": 528228\n  },\n  {\n    \"tag\": "Elateridae unnewness",\n    \"popularity\": 522464\n  },\n  {\n    \"tag\": "convertingness",\n    \"popularity\": 516798\n  },\n  {\n    \"tag\": "Pelew",\n    \"popularity\": 511228\n  },\n  {\n    \"tag\": "recapitulation",\n    \"popularity\": 505751\n  },\n  {\n    \"tag\": "shack",\n    \"popularity\": 500365\n  },\n  {\n    \"tag\": "unmellowed",\n    \"popularity\": 495069\n  },\n  {\n    \"tag\": "pavis capering",\n    \"popularity\": 489859\n  },\n  {\n    \"tag\": "fanfare",\n    \"popularity\": 484735\n  },\n  {\n    \"tag\": "sole",\n    \"popularity\": 479695\n  },\n  {\n    \"tag\": "subarcuate",\n    \"popularity\": 474735\n  },\n  {\n    \"tag\": "multivious",\n    \"popularity\": 469856\n  },\n  {\n    \"tag\": "squandermania",\n    \"popularity\": 465054\n  },\n  {\n    \"tag\": "scintle",\n    \"popularity\": 460329\n  },\n  {\n    \"tag\": "hash chirognomic",\n    \"popularity\": 455679\n  },\n  {\n    \"tag\": "linseed",\n    \"popularity\": 451101\n  },\n  {\n    \"tag\": "redoubtable",\n    \"popularity\": 446596\n  },\n  {\n    \"tag\": "poachy reimpact",\n    \"popularity\": 442160\n  },\n  {\n    \"tag\": "limestone",\n    \"popularity\": 437792\n  },\n  {\n    \"tag\": "serranid",\n    \"popularity\": 433492\n  },\n  {\n    \"tag\": "pohna",\n    \"popularity\": 429258\n  },\n  {\n    \"tag\": "warwolf",\n    \"popularity\": 425088\n  },\n  {\n    \"tag\": "ruthenous",\n    \"popularity\": 420981\n  },\n  {\n    \"tag\": "dover",\n    \"popularity\": 416935\n  },\n  {\n    \"tag\": "deuteroalbumose",\n    \"popularity\": 412950\n  },\n  {\n    \"tag\": "pseudoprophetic",\n    \"popularity\": 409025\n  },\n  {\n    \"tag\": "dissoluteness",\n    \"popularity\": 405157\n  },\n  {\n    \"tag\": "preinvention",\n    \"popularity\": 401347\n  },\n  {\n    \"tag\": "swagbellied",\n    \"popularity\": 397592\n  },\n  {\n    \"tag\": "Ophidia",\n    \"popularity\": 393892\n  },\n  {\n    \"tag\": "equanimity",\n    \"popularity\": 390245\n  },\n  {\n    \"tag\": "troutful",\n    \"popularity\": 386651\n  },\n  {\n    \"tag\": "uke",\n    \"popularity\": 383108\n  },\n  {\n    \"tag\": "preacquaint",\n    \"popularity\": 379616\n  },\n  {\n    \"tag\": "shoq",\n    \"popularity\": 376174\n  },\n  {\n    \"tag\": "yox",\n    \"popularity\": 372780\n  },\n  {\n    \"tag\": "unelemental",\n    \"popularity\": 369434\n  },\n  {\n    \"tag\": "Yavapai",\n    \"popularity\": 366134\n  },\n  {\n    \"tag\": "joulean",\n    \"popularity\": 362880\n  },\n  {\n    \"tag\": "dracontine",\n    \"popularity\": 359672\n  },\n  {\n    \"tag\": "hardmouth",\n    \"popularity\": 356507\n  },\n  {\n    \"tag\": "sylvanize",\n    \"popularity\": 353386\n  },\n  {\n    \"tag\": "intraparenchymatous meadowbur",\n    \"popularity\": 350308\n  },\n  {\n    \"tag\": "uncharily",\n    \"popularity\": 347271\n  },\n  {\n    \"tag\": "redtab flexibly",\n    \"popularity\": 344275\n  },\n  {\n    \"tag\": "centervelic",\n    \"popularity\": 341319\n  },\n  {\n    \"tag\": "unravellable",\n    \"popularity\": 338403\n  },\n  {\n    \"tag\": "infortunately",\n    \"popularity\": 335526\n  },\n  {\n    \"tag\": "cannel",\n    \"popularity\": 332687\n  },\n  {\n    \"tag\": "oxyblepsia",\n    \"popularity\": 329885\n  },\n  {\n    \"tag\": "Damon",\n    \"popularity\": 327120\n  },\n  {\n    \"tag\": "etherin",\n    \"popularity\": 324391\n  },\n  {\n    \"tag\": "luminal",\n    \"popularity\": 321697\n  },\n  {\n    \"tag\": "interrogatorily presbyte",\n    \"popularity\": 319038\n  },\n  {\n    \"tag\": "hemiclastic",\n    \"popularity\": 316414\n  },\n  {\n    \"tag\": "poh flush",\n    \"popularity\": 313823\n  },\n  {\n    \"tag\": "Psoroptes",\n    \"popularity\": 311265\n  },\n  {\n    \"tag\": "dispirit",\n    \"popularity\": 308740\n  },\n  {\n    \"tag\": "nashgab",\n    \"popularity\": 306246\n  },\n  {\n    \"tag\": "Aphidiinae",\n    \"popularity\": 303784\n  },\n  {\n    \"tag\": "rhapsody nonconstruction",\n    \"popularity\": 301353\n  },\n  {\n    \"tag\": "Osmond",\n    \"popularity\": 298952\n  },\n  {\n    \"tag\": "Leonis",\n    \"popularity\": 296581\n  },\n  {\n    \"tag\": "Lemnian",\n    \"popularity\": 294239\n  },\n  {\n    \"tag\": "acetonic gnathonic",\n    \"popularity\": 291926\n  },\n  {\n    \"tag\": "surculus",\n    \"popularity\": 289641\n  },\n  {\n    \"tag\": "diagonally",\n    \"popularity\": 287384\n  },\n  {\n    \"tag\": "counterpenalty",\n    \"popularity\": 285154\n  },\n  {\n    \"tag\": "Eugenie",\n    \"popularity\": 282952\n  },\n  {\n    \"tag\": "hornbook",\n    \"popularity\": 280776\n  },\n  {\n    \"tag\": "miscoin",\n    \"popularity\": 278626\n  },\n  {\n    \"tag\": "admi",\n    \"popularity\": 276501\n  },\n  {\n    \"tag\": "Tarmac",\n    \"popularity\": 274402\n  },\n  {\n    \"tag\": "inexplicable",\n    \"popularity\": 272328\n  },\n  {\n    \"tag\": "rascallion",\n    \"popularity\": 270278\n  },\n  {\n    \"tag\": "dusterman",\n    \"popularity\": 268252\n  },\n  {\n    \"tag\": "osteostomous unhoroscopic",\n    \"popularity\": 266250\n  },\n  {\n    \"tag\": "spinibulbar",\n    \"popularity\": 264271\n  },\n  {\n    \"tag\": "phototelegraphically",\n    \"popularity\": 262315\n  },\n  {\n    \"tag\": "Manihot",\n    \"popularity\": 260381\n  },\n  {\n    \"tag\": "neighborhood",\n    \"popularity\": 258470\n  },\n  {\n    \"tag\": "Vincetoxicum",\n    \"popularity\": 256581\n  },\n  {\n    \"tag\": "khirka",\n    \"popularity\": 254713\n  },\n  {\n    \"tag\": "conscriptive",\n    \"popularity\": 252866\n  },\n  {\n    \"tag\": "synechthran",\n    \"popularity\": 251040\n  },\n  {\n    \"tag\": "Guttiferales",\n    \"popularity\": 249235\n  },\n  {\n    \"tag\": "roomful",\n    \"popularity\": 247450\n  },\n  {\n    \"tag\": "germinal",\n    \"popularity\": 245685\n  },\n  {\n    \"tag\": "untraitorous",\n    \"popularity\": 243939\n  },\n  {\n    \"tag\": "nondissenting",\n    \"popularity\": 242213\n  },\n  {\n    \"tag\": "amotion",\n    \"popularity\": 240506\n  },\n  {\n    \"tag\": "badious",\n    \"popularity\": 238817\n  },\n  {\n    \"tag\": "sumpit",\n    \"popularity\": 237147\n  },\n  {\n    \"tag\": "ectozoic",\n    \"popularity\": 235496\n  },\n  {\n    \"tag\": "elvet",\n    \"popularity\": 233862\n  },\n  {\n    \"tag\": "underclerk",\n    \"popularity\": 232246\n  },\n  {\n    \"tag\": "reticency",\n    \"popularity\": 230647\n  },\n  {\n    \"tag\": "neutroclusion",\n    \"popularity\": 229065\n  },\n  {\n    \"tag\": "unbelieving",\n    \"popularity\": 227500\n  },\n  {\n    \"tag\": "histogenetic",\n    \"popularity\": 225952\n  },\n  {\n    \"tag\": "dermamyiasis",\n    \"popularity\": 224421\n  },\n  {\n    \"tag\": "telenergy",\n    \"popularity\": 222905\n  },\n  {\n    \"tag\": "axiomatic",\n    \"popularity\": 221406\n  },\n  {\n    \"tag\": "undominoed",\n    \"popularity\": 219922\n  },\n  {\n    \"tag\": "periosteoma",\n    \"popularity\": 218454\n  },\n  {\n    \"tag\": "justiciaryship",\n    \"popularity\": 217001\n  },\n  {\n    \"tag\": "autoluminescence",\n    \"popularity\": 215563\n  },\n  {\n    \"tag\": "osmous",\n    \"popularity\": 214140\n  },\n  {\n    \"tag\": "borgh",\n    \"popularity\": 212731\n  },\n  {\n    \"tag\": "bedebt",\n    \"popularity\": 211337\n  },\n  {\n    \"tag\": "considerableness adenoidism",\n    \"popularity\": 209957\n  },\n  {\n    \"tag\": "sailorizing",\n    \"popularity\": 208592\n  },\n  {\n    \"tag\": "Montauk",\n    \"popularity\": 207240\n  },\n  {\n    \"tag\": "Bridget",\n    \"popularity\": 205901\n  },\n  {\n    \"tag\": "Gekkota",\n    \"popularity\": 204577\n  },\n  {\n    \"tag\": "subcorymbose",\n    \"popularity\": 203265\n  },\n  {\n    \"tag\": "undersap",\n    \"popularity\": 201967\n  },\n  {\n    \"tag\": "poikilothermic",\n    \"popularity\": 200681\n  },\n  {\n    \"tag\": "enneatical",\n    \"popularity\": 199409\n  },\n  {\n    \"tag\": "martinetism",\n    \"popularity\": 198148\n  },\n  {\n    \"tag\": "sustanedly",\n    \"popularity\": 196901\n  },\n  {\n    \"tag\": "declaration",\n    \"popularity\": 195665\n  },\n  {\n    \"tag\": "myringoplasty",\n    \"popularity\": 194442\n  },\n  {\n    \"tag\": "Ginkgo",\n    \"popularity\": 193230\n  },\n  {\n    \"tag\": "unrecurrent",\n    \"popularity\": 192031\n  },\n  {\n    \"tag\": "proprecedent",\n    \"popularity\": 190843\n  },\n  {\n    \"tag\": "roadman",\n    \"popularity\": 189666\n  },\n  {\n    \"tag\": "elemin",\n    \"popularity\": 188501\n  },\n  {\n    \"tag\": "maggot",\n    \"popularity\": 187347\n  },\n  {\n    \"tag\": "alitrunk",\n    \"popularity\": 186204\n  },\n  {\n    \"tag\": "introspection",\n    \"popularity\": 185071\n  },\n  {\n    \"tag\": "batiker",\n    \"popularity\": 183950\n  },\n  {\n    \"tag\": "backhatch oversettle",\n    \"popularity\": 182839\n  },\n  {\n    \"tag\": "thresherman",\n    \"popularity\": 181738\n  },\n  {\n    \"tag\": "protemperance",\n    \"popularity\": 180648\n  },\n  {\n    \"tag\": "undern",\n    \"popularity\": 179568\n  },\n  {\n    \"tag\": "tweeg",\n    \"popularity\": 178498\n  },\n  {\n    \"tag\": "crosspath",\n    \"popularity\": 177438\n  },\n  {\n    \"tag\": "Tangaridae",\n    \"popularity\": 176388\n  },\n  {\n    \"tag\": "scrutation",\n    \"popularity\": 175348\n  },\n  {\n    \"tag\": "piecemaker",\n    \"popularity\": 174317\n  },\n  {\n    \"tag\": "paster",\n    \"popularity\": 173296\n  },\n  {\n    \"tag\": "unpretendingness",\n    \"popularity\": 172284\n  },\n  {\n    \"tag\": "inframundane",\n    \"popularity\": 171281\n  },\n  {\n    \"tag\": "kiblah",\n    \"popularity\": 170287\n  },\n  {\n    \"tag\": "playwrighting",\n    \"popularity\": 169302\n  },\n  {\n    \"tag\": "gonepoiesis snowslip",\n    \"popularity\": 168326\n  },\n  {\n    \"tag\": "hoodwise",\n    \"popularity\": 167359\n  },\n  {\n    \"tag\": "postseason",\n    \"popularity\": 166401\n  },\n  {\n    \"tag\": "equivocality",\n    \"popularity\": 165451\n  },\n  {\n    \"tag\": "Opiliaceae nuclease",\n    \"popularity\": 164509\n  },\n  {\n    \"tag\": "sextipara",\n    \"popularity\": 163576\n  },\n  {\n    \"tag\": "weeper",\n    \"popularity\": 162651\n  },\n  {\n    \"tag\": "frambesia",\n    \"popularity\": 161735\n  },\n  {\n    \"tag\": "answerable",\n    \"popularity\": 160826\n  },\n  {\n    \"tag\": "Trichosporum",\n    \"popularity\": 159925\n  },\n  {\n    \"tag\": "cajuputol",\n    \"popularity\": 159033\n  },\n  {\n    \"tag\": "pleomorphous",\n    \"popularity\": 158148\n  },\n  {\n    \"tag\": "aculeolate",\n    \"popularity\": 157270\n  },\n  {\n    \"tag\": "wherever",\n    \"popularity\": 156400\n  },\n  {\n    \"tag\": "collapse",\n    \"popularity\": 155538\n  },\n  {\n    \"tag\": "porky",\n    \"popularity\": 154683\n  },\n  {\n    \"tag\": "perule",\n    \"popularity\": 153836\n  },\n  {\n    \"tag\": "Nevada",\n    \"popularity\": 152996\n  },\n  {\n    \"tag\": "conalbumin",\n    \"popularity\": 152162\n  },\n  {\n    \"tag\": "tsunami",\n    \"popularity\": 151336\n  },\n  {\n    \"tag\": "Gulf",\n    \"popularity\": 150517\n  },\n  {\n    \"tag\": "hertz",\n    \"popularity\": 149705\n  },\n  {\n    \"tag\": "limmock",\n    \"popularity\": 148900\n  },\n  {\n    \"tag\": "Tartarize",\n    \"popularity\": 148101\n  },\n  {\n    \"tag\": "entosphenoid",\n    \"popularity\": 147310\n  },\n  {\n    \"tag\": "ibis",\n    \"popularity\": 146524\n  },\n  {\n    \"tag\": "unyeaned",\n    \"popularity\": 145746\n  },\n  {\n    \"tag\": "tritural",\n    \"popularity\": 144973\n  },\n  {\n    \"tag\": "hundredary",\n    \"popularity\": 144207\n  },\n  {\n    \"tag\": "stolonlike",\n    \"popularity\": 143448\n  },\n  {\n    \"tag\": "chorister",\n    \"popularity\": 142694\n  },\n  {\n    \"tag\": "mismove",\n    \"popularity\": 141947\n  },\n  {\n    \"tag\": "Andine",\n    \"popularity\": 141206\n  },\n  {\n    \"tag\": "Annette proneur escribe",\n    \"popularity\": 140471\n  },\n  {\n    \"tag\": "exoperidium",\n    \"popularity\": 139742\n  },\n  {\n    \"tag\": "disedge",\n    \"popularity\": 139019\n  },\n  {\n    \"tag\": "hypochloruria",\n    \"popularity\": 138302\n  },\n  {\n    \"tag\": "prepupa",\n    \"popularity\": 137590\n  },\n  {\n    \"tag\": "assent",\n    \"popularity\": 136884\n  },\n  {\n    \"tag\": "hydrazobenzene",\n    \"popularity\": 136184\n  },\n  {\n    \"tag\": "emballonurid",\n    \"popularity\": 135489\n  },\n  {\n    \"tag\": "roselle",\n    \"popularity\": 134800\n  },\n  {\n    \"tag\": "unifiedly",\n    \"popularity\": 134117\n  },\n  {\n    \"tag\": "clang",\n    \"popularity\": 133439\n  },\n  {\n    \"tag\": "acetolytic",\n    \"popularity\": 132766\n  },\n  {\n    \"tag\": "cladodont",\n    \"popularity\": 132098\n  },\n  {\n    \"tag\": "recoast",\n    \"popularity\": 131436\n  },\n  {\n    \"tag\": "celebrated tydie Eocarboniferous",\n    \"popularity\": 130779\n  },\n  {\n    \"tag\": "superconsciousness",\n    \"popularity\": 130127\n  },\n  {\n    \"tag\": "soberness",\n    \"popularity\": 129480\n  },\n  {\n    \"tag\": "panoramist",\n    \"popularity\": 128838\n  },\n  {\n    \"tag\": "Orbitolina",\n    \"popularity\": 128201\n  },\n  {\n    \"tag\": "overlewd",\n    \"popularity\": 127569\n  },\n  {\n    \"tag\": "demiquaver",\n    \"popularity\": 126942\n  },\n  {\n    \"tag\": "kamelaukion",\n    \"popularity\": 126319\n  },\n  {\n    \"tag\": "flancard",\n    \"popularity\": 125702\n  },\n  {\n    \"tag\": "tricuspid",\n    \"popularity\": 125089\n  },\n  {\n    \"tag\": "bepelt",\n    \"popularity\": 124480\n  },\n  {\n    \"tag\": "decuplet",\n    \"popularity\": 123877\n  },\n  {\n    \"tag\": "Rockies",\n    \"popularity\": 123278\n  },\n  {\n    \"tag\": "unforgeability",\n    \"popularity\": 122683\n  },\n  {\n    \"tag\": "mocha",\n    \"popularity\": 122093\n  },\n  {\n    \"tag\": "scrunge",\n    \"popularity\": 121507\n  },\n  {\n    \"tag\": "delighter",\n    \"popularity\": 120926\n  },\n  {\n    \"tag\": "willey Microtinae",\n    \"popularity\": 120349\n  },\n  {\n    \"tag\": "unhuntable",\n    \"popularity\": 119777\n  },\n  {\n    \"tag\": "historically",\n    \"popularity\": 119208\n  },\n  {\n    \"tag\": "vicegerentship",\n    \"popularity\": 118644\n  },\n  {\n    \"tag\": "hemangiosarcoma",\n    \"popularity\": 118084\n  },\n  {\n    \"tag\": "harpago",\n    \"popularity\": 117528\n  },\n  {\n    \"tag\": "unionoid",\n    \"popularity\": 116976\n  },\n  {\n    \"tag\": "wiseman",\n    \"popularity\": 116429\n  },\n  {\n    \"tag\": "diclinism",\n    \"popularity\": 115885\n  },\n  {\n    \"tag\": "Maud",\n    \"popularity\": 115345\n  },\n  {\n    \"tag\": "scaphocephalism",\n    \"popularity\": 114809\n  },\n  {\n    \"tag\": "obtenebration",\n    \"popularity\": 114277\n  },\n  {\n    \"tag\": "cymar predreadnought",\n    \"popularity\": 113749\n  },\n  {\n    \"tag\": "discommend",\n    \"popularity\": 113225\n  },\n  {\n    \"tag\": "crude",\n    \"popularity\": 112704\n  },\n  {\n    \"tag\": "upflash",\n    \"popularity\": 112187\n  },\n  {\n    \"tag\": "saltimbank",\n    \"popularity\": 111674\n  },\n  {\n    \"tag\": "posthysterical",\n    \"popularity\": 111165\n  },\n  {\n    \"tag\": "trample",\n    \"popularity\": 110659\n  },\n  {\n    \"tag\": "ungirthed",\n    \"popularity\": 110157\n  },\n  {\n    \"tag\": "unshakable",\n    \"popularity\": 109658\n  },\n  {\n    \"tag\": "hepatocystic",\n    \"popularity\": 109163\n  },\n  {\n    \"tag\": "psammophyte",\n    \"popularity\": 108671\n  },\n  {\n    \"tag\": "millionfold",\n    \"popularity\": 108183\n  },\n  {\n    \"tag\": "outtaste",\n    \"popularity\": 107698\n  },\n  {\n    \"tag\": "poppycockish",\n    \"popularity\": 107217\n  },\n  {\n    \"tag\": "viduine",\n    \"popularity\": 106739\n  },\n  {\n    \"tag\": "pleasureman",\n    \"popularity\": 106264\n  },\n  {\n    \"tag\": "cholesterolemia",\n    \"popularity\": 105792\n  },\n  {\n    \"tag\": "hostlerwife",\n    \"popularity\": 105324\n  },\n  {\n    \"tag\": "figure undergrass",\n    \"popularity\": 104859\n  },\n  {\n    \"tag\": "bedrape",\n    \"popularity\": 104398\n  },\n  {\n    \"tag\": "nuttishness",\n    \"popularity\": 103939\n  },\n  {\n    \"tag\": "fow",\n    \"popularity\": 103484\n  },\n  {\n    \"tag\": "rachianesthesia",\n    \"popularity\": 103031\n  },\n  {\n    \"tag\": "recruitable",\n    \"popularity\": 102582\n  },\n  {\n    \"tag\": "semianatomical Oenotheraceae",\n    \"popularity\": 102136\n  },\n  {\n    \"tag\": "extracapsular",\n    \"popularity\": 101693\n  },\n  {\n    \"tag\": "unsigneted",\n    \"popularity\": 101253\n  },\n  {\n    \"tag\": "fissural",\n    \"popularity\": 100816\n  },\n  {\n    \"tag\": "ayous",\n    \"popularity\": 100381\n  },\n  {\n    \"tag\": "crestfallenness odontograph",\n    \"popularity\": 99950\n  },\n  {\n    \"tag\": "monopodium",\n    \"popularity\": 99522\n  },\n  {\n    \"tag\": "germfree",\n    \"popularity\": 99096\n  },\n  {\n    \"tag\": "dauphin",\n    \"popularity\": 98673\n  },\n  {\n    \"tag\": "nonagesimal",\n    \"popularity\": 98254\n  },\n  {\n    \"tag\": "waterchat",\n    \"popularity\": 97836\n  },\n  {\n    \"tag\": "Entelodon",\n    \"popularity\": 97422\n  },\n  {\n    \"tag\": "semischolastic",\n    \"popularity\": 97010\n  },\n  {\n    \"tag\": "somata",\n    \"popularity\": 96602\n  },\n  {\n    \"tag\": "expositorily",\n    \"popularity\": 96195\n  },\n  {\n    \"tag\": "bass",\n    \"popularity\": 95792\n  },\n  {\n    \"tag\": "calorimetry",\n    \"popularity\": 95391\n  },\n  {\n    \"tag\": "entireness",\n    \"popularity\": 94993\n  },\n  {\n    \"tag\": "ratline soppiness",\n    \"popularity\": 94597\n  },\n  {\n    \"tag\": "shor",\n    \"popularity\": 94204\n  },\n  {\n    \"tag\": "coprecipitation",\n    \"popularity\": 93813\n  },\n  {\n    \"tag\": "unblushingly",\n    \"popularity\": 93425\n  },\n  {\n    \"tag\": "macarize",\n    \"popularity\": 93040\n  },\n  {\n    \"tag\": "scruplesomeness",\n    \"popularity\": 92657\n  },\n  {\n    \"tag\": "offsaddle",\n    \"popularity\": 92276\n  },\n  {\n    \"tag\": "hypertragical",\n    \"popularity\": 91898\n  },\n  {\n    \"tag\": "uncassock loined",\n    \"popularity\": 91522\n  },\n  {\n    \"tag\": "interlobate",\n    \"popularity\": 91149\n  },\n  {\n    \"tag\": "releasor orrisroot stoloniferously",\n    \"popularity\": 90778\n  },\n  {\n    \"tag\": "elementoid",\n    \"popularity\": 90410\n  },\n  {\n    \"tag\": "Lentilla",\n    \"popularity\": 90043\n  },\n  {\n    \"tag\": "distressing",\n    \"popularity\": 89679\n  },\n  {\n    \"tag\": "hydrodrome",\n    \"popularity\": 89318\n  },\n  {\n    \"tag\": "Jeannette",\n    \"popularity\": 88958\n  },\n  {\n    \"tag\": "Kuli",\n    \"popularity\": 88601\n  },\n  {\n    \"tag\": "taxinomist",\n    \"popularity\": 88246\n  },\n  {\n    \"tag\": "southwestwardly",\n    \"popularity\": 87894\n  },\n  {\n    \"tag\": "polyparia",\n    \"popularity\": 87543\n  },\n  {\n    \"tag\": "exmeridian",\n    \"popularity\": 87195\n  },\n  {\n    \"tag\": "splenius regimentaled",\n    \"popularity\": 86849\n  },\n  {\n    \"tag\": "Sphaeropsidaceae",\n    \"popularity\": 86505\n  },\n  {\n    \"tag\": "unbegun",\n    \"popularity\": 86163\n  },\n  {\n    \"tag\": "something",\n    \"popularity\": 85823\n  },\n  {\n    \"tag\": "contaminable nonexpulsion",\n    \"popularity\": 85486\n  },\n  {\n    \"tag\": "douser",\n    \"popularity\": 85150\n  },\n  {\n    \"tag\": "prostrike",\n    \"popularity\": 84817\n  },\n  {\n    \"tag\": "worky",\n    \"popularity\": 84485\n  },\n  {\n    \"tag\": "folliful",\n    \"popularity\": 84156\n  },\n  {\n    \"tag\": "prioracy",\n    \"popularity\": 83828\n  },\n  {\n    \"tag\": "undermentioned",\n    \"popularity\": 83503\n  },\n  {\n    \"tag\": "Judaica",\n    \"popularity\": 83179\n  },\n  {\n    \"tag\": "multifarious",\n    \"popularity\": 82858\n  },\n  {\n    \"tag\": "poogye",\n    \"popularity\": 82538\n  },\n  {\n    \"tag\": "Sparganium",\n    \"popularity\": 82221\n  },\n  {\n    \"tag\": "thurrock",\n    \"popularity\": 81905\n  },\n  {\n    \"tag\": "outblush",\n    \"popularity\": 81591\n  },\n  {\n    \"tag\": "Strophanthus supraordination",\n    \"popularity\": 81279\n  },\n  {\n    \"tag\": "gingerroot",\n    \"popularity\": 80969\n  },\n  {\n    \"tag\": "unconscient",\n    \"popularity\": 80661\n  },\n  {\n    \"tag\": "unconstitutionally",\n    \"popularity\": 80354\n  },\n  {\n    \"tag\": "plaguily",\n    \"popularity\": 80050\n  },\n  {\n    \"tag\": "waterily equatorwards",\n    \"popularity\": 79747\n  },\n  {\n    \"tag\": "nondeposition",\n    \"popularity\": 79446\n  },\n  {\n    \"tag\": "dronishly",\n    \"popularity\": 79147\n  },\n  {\n    \"tag\": "gateado",\n    \"popularity\": 78849\n  },\n  {\n    \"tag\": "dislink",\n    \"popularity\": 78553\n  },\n  {\n    \"tag\": "Joceline",\n    \"popularity\": 78259\n  },\n  {\n    \"tag\": "amphiboliferous",\n    \"popularity\": 77967\n  },\n  {\n    \"tag\": "bushrope",\n    \"popularity\": 77676\n  },\n  {\n    \"tag\": "plumicorn sulphosalicylic",\n    \"popularity\": 77387\n  },\n  {\n    \"tag\": "nonefficiency",\n    \"popularity\": 77100\n  },\n  {\n    \"tag\": "hieroscopy",\n    \"popularity\": 76815\n  },\n  {\n    \"tag\": "causativeness",\n    \"popularity\": 76531\n  },\n  {\n    \"tag\": "swird paleoeremology",\n    \"popularity\": 76249\n  },\n  {\n    \"tag\": "camphoric",\n    \"popularity\": 75968\n  },\n  {\n    \"tag\": "retaining",\n    \"popularity\": 75689\n  },\n  {\n    \"tag\": "thyreoprotein",\n    \"popularity\": 75411\n  },\n  {\n    \"tag\": "carbona",\n    \"popularity\": 75136\n  },\n  {\n    \"tag\": "protectively",\n    \"popularity\": 74861\n  },\n  {\n    \"tag\": "mosasaur",\n    \"popularity\": 74589\n  },\n  {\n    \"tag\": "reciprocator",\n    \"popularity\": 74317\n  },\n  {\n    \"tag\": "detentive",\n    \"popularity\": 74048\n  },\n  {\n    \"tag\": "supravital",\n    \"popularity\": 73780\n  },\n  {\n    \"tag\": "Vespertilionidae",\n    \"popularity\": 73513\n  },\n  {\n    \"tag\": "parka",\n    \"popularity\": 73248\n  },\n  {\n    \"tag\": "pickaway",\n    \"popularity\": 72984\n  },\n  {\n    \"tag\": "oleaceous",\n    \"popularity\": 72722\n  },\n  {\n    \"tag\": "anticogitative",\n    \"popularity\": 72462\n  },\n  {\n    \"tag\": "woe",\n    \"popularity\": 72203\n  },\n  {\n    \"tag\": "skeuomorph",\n    \"popularity\": 71945\n  },\n  {\n    \"tag\": "helpmeet",\n    \"popularity\": 71689\n  },\n  {\n    \"tag\": "Hexactinellida brickmaking",\n    \"popularity\": 71434\n  },\n  {\n    \"tag\": "resink",\n    \"popularity\": 71180\n  },\n  {\n    \"tag\": "diluter",\n    \"popularity\": 70928\n  },\n  {\n    \"tag\": "micromicron",\n    \"popularity\": 70677\n  },\n  {\n    \"tag\": "parentage",\n    \"popularity\": 70428\n  },\n  {\n    \"tag\": "galactorrhoea",\n    \"popularity\": 70180\n  },\n  {\n    \"tag\": "gey",\n    \"popularity\": 69934\n  },\n  {\n    \"tag\": "gesticulatory",\n    \"popularity\": 69689\n  },\n  {\n    \"tag\": "wergil",\n    \"popularity\": 69445\n  },\n  {\n    \"tag\": "Lecanora",\n    \"popularity\": 69202\n  },\n  {\n    \"tag\": "malanders karst",\n    \"popularity\": 68961\n  },\n  {\n    \"tag\": "vibetoite",\n    \"popularity\": 68721\n  },\n  {\n    \"tag\": "unrequitedness",\n    \"popularity\": 68483\n  },\n  {\n    \"tag\": "outwash",\n    \"popularity\": 68245\n  },\n  {\n    \"tag\": "unsacred",\n    \"popularity\": 68009\n  },\n  {\n    \"tag\": "unabetted dividend",\n    \"popularity\": 67775\n  },\n  {\n    \"tag\": "untraveling",\n    \"popularity\": 67541\n  },\n  {\n    \"tag\": "thermobattery",\n    \"popularity\": 67309\n  },\n  {\n    \"tag\": "polypragmist",\n    \"popularity\": 67078\n  },\n  {\n    \"tag\": "irrefutableness",\n    \"popularity\": 66848\n  },\n  {\n    \"tag\": "remiges",\n    \"popularity\": 66620\n  },\n  {\n    \"tag\": "implode",\n    \"popularity\": 66393\n  },\n  {\n    \"tag\": "superfluousness",\n    \"popularity\": 66166\n  },\n  {\n    \"tag\": "croakily unalleviated",\n    \"popularity\": 65942\n  },\n  {\n    \"tag\": "edicule",\n    \"popularity\": 65718\n  },\n  {\n    \"tag\": "entophytous",\n    \"popularity\": 65495\n  },\n  {\n    \"tag\": "benefactorship Toryish",\n    \"popularity\": 65274\n  },\n  {\n    \"tag\": "pseudoamateurish",\n    \"popularity\": 65054\n  },\n  {\n    \"tag\": "flueless Iguanodontoidea snipnose",\n    \"popularity\": 64835\n  },\n  {\n    \"tag\": "zealotical Zamicrus interpole",\n    \"popularity\": 64617\n  },\n  {\n    \"tag\": "whereabout",\n    \"popularity\": 64401\n  },\n  {\n    \"tag\": "benzazide",\n    \"popularity\": 64185\n  },\n  {\n    \"tag\": "pokeweed",\n    \"popularity\": 63971\n  },\n  {\n    \"tag\": "calamitoid",\n    \"popularity\": 63757\n  },\n  {\n    \"tag\": "sporozoal",\n    \"popularity\": 63545\n  },\n  {\n    \"tag\": "physcioid Welshwoman",\n    \"popularity\": 63334\n  },\n  {\n    \"tag\": "wanting",\n    \"popularity\": 63124\n  },\n  {\n    \"tag\": "unencumbering",\n    \"popularity\": 62915\n  },\n  {\n    \"tag\": "Tupi",\n    \"popularity\": 62707\n  },\n  {\n    \"tag\": "potbank",\n    \"popularity\": 62501\n  },\n  {\n    \"tag\": "bulked",\n    \"popularity\": 62295\n  },\n  {\n    \"tag\": "uparise",\n    \"popularity\": 62090\n  },\n  {\n    \"tag\": "Sudra",\n    \"popularity\": 61887\n  },\n  {\n    \"tag\": "hyperscrupulosity",\n    \"popularity\": 61684\n  },\n  {\n    \"tag\": "subterraneously unmaid",\n    \"popularity\": 61483\n  },\n  {\n    \"tag\": "poisonousness",\n    \"popularity\": 61282\n  },\n  {\n    \"tag\": "phare",\n    \"popularity\": 61083\n  },\n  {\n    \"tag\": "dicynodont",\n    \"popularity\": 60884\n  },\n  {\n    \"tag\": "chewer",\n    \"popularity\": 60687\n  },\n  {\n    \"tag\": "uliginous",\n    \"popularity\": 60490\n  },\n  {\n    \"tag\": "tinman",\n    \"popularity\": 60295\n  },\n  {\n    \"tag\": "coconut",\n    \"popularity\": 60100\n  },\n  {\n    \"tag\": "phryganeoid",\n    \"popularity\": 59907\n  },\n  {\n    \"tag\": "bismillah",\n    \"popularity\": 59714\n  },\n  {\n    \"tag\": "tautomeric",\n    \"popularity\": 59523\n  },\n  {\n    \"tag\": "jerquer",\n    \"popularity\": 59332\n  },\n  {\n    \"tag\": "Dryopithecinae",\n    \"popularity\": 59143\n  },\n  {\n    \"tag\": "ghizite",\n    \"popularity\": 58954\n  },\n  {\n    \"tag\": "unliveable",\n    \"popularity\": 58766\n  },\n  {\n    \"tag\": "craftsmaster",\n    \"popularity\": 58579\n  },\n  {\n    \"tag\": "semiscenic",\n    \"popularity\": 58394\n  },\n  {\n    \"tag\": "danaid",\n    \"popularity\": 58209\n  },\n  {\n    \"tag\": "flawful",\n    \"popularity\": 58025\n  },\n  {\n    \"tag\": "risibleness",\n    \"popularity\": 57841\n  },\n  {\n    \"tag\": "Muscovite",\n    \"popularity\": 57659\n  },\n  {\n    \"tag\": "snaringly",\n    \"popularity\": 57478\n  },\n  {\n    \"tag\": "brilliantwise",\n    \"popularity\": 57297\n  },\n  {\n    \"tag\": "plebeity",\n    \"popularity\": 57118\n  },\n  {\n    \"tag\": "historicalness",\n    \"popularity\": 56939\n  },\n  {\n    \"tag\": "piecemeal",\n    \"popularity\": 56761\n  },\n  {\n    \"tag\": "maxillipedary",\n    \"popularity\": 56584\n  },\n  {\n    \"tag\": "Hypenantron",\n    \"popularity\": 56408\n  },\n  {\n    \"tag\": "quaintness avigate",\n    \"popularity\": 56233\n  },\n  {\n    \"tag\": "ave",\n    \"popularity\": 56059\n  },\n  {\n    \"tag\": "mediaevally",\n    \"popularity\": 55885\n  },\n  {\n    \"tag\": "brucite",\n    \"popularity\": 55712\n  },\n  {\n    \"tag\": "Schwendenerian",\n    \"popularity\": 55541\n  },\n  {\n    \"tag\": "julole",\n    \"popularity\": 55370\n  },\n  {\n    \"tag\": "palaeolith",\n    \"popularity\": 55199\n  },\n  {\n    \"tag\": "cotyledonary",\n    \"popularity\": 55030\n  },\n  {\n    \"tag\": "rond",\n    \"popularity\": 54861\n  },\n  {\n    \"tag\": "boomster tassoo",\n    \"popularity\": 54694\n  },\n  {\n    \"tag\": "cattishly",\n    \"popularity\": 54527\n  },\n  {\n    \"tag\": "tonguefence",\n    \"popularity\": 54360\n  },\n  {\n    \"tag\": "hexastylar triskele",\n    \"popularity\": 54195\n  },\n  {\n    \"tag\": "ariot",\n    \"popularity\": 54030\n  },\n  {\n    \"tag\": "intarsist",\n    \"popularity\": 53867\n  },\n  {\n    \"tag\": "Oscines",\n    \"popularity\": 53704\n  },\n  {\n    \"tag\": "Spaniolize",\n    \"popularity\": 53541\n  },\n  {\n    \"tag\": "smellfungus",\n    \"popularity\": 53380\n  },\n  {\n    \"tag\": "redisplay",\n    \"popularity\": 53219\n  },\n  {\n    \"tag\": "phosphene",\n    \"popularity\": 53059\n  },\n  {\n    \"tag\": "phycomycete",\n    \"popularity\": 52900\n  },\n  {\n    \"tag\": "prophetic",\n    \"popularity\": 52741\n  },\n  {\n    \"tag\": "overtrustful",\n    \"popularity\": 52584\n  },\n  {\n    \"tag\": "pinitol",\n    \"popularity\": 52427\n  },\n  {\n    \"tag\": "asthmatic",\n    \"popularity\": 52270\n  },\n  {\n    \"tag\": "convulsive",\n    \"popularity\": 52115\n  },\n  {\n    \"tag\": "draughtswoman",\n    \"popularity\": 51960\n  },\n  {\n    \"tag\": "unetymologizable",\n    \"popularity\": 51806\n  },\n  {\n    \"tag\": "centrarchoid",\n    \"popularity\": 51652\n  },\n  {\n    \"tag\": "mesioincisal",\n    \"popularity\": 51500\n  },\n  {\n    \"tag\": "transbaikal",\n    \"popularity\": 51348\n  },\n  {\n    \"tag\": "silveriness",\n    \"popularity\": 51196\n  },\n  {\n    \"tag\": "costotomy",\n    \"popularity\": 51046\n  },\n  {\n    \"tag\": "caracore",\n    \"popularity\": 50896\n  },\n  {\n    \"tag\": "depotentiation",\n    \"popularity\": 50747\n  },\n  {\n    \"tag\": "glossoepiglottidean",\n    \"popularity\": 50598\n  },\n  {\n    \"tag\": "upswell",\n    \"popularity\": 50450\n  },\n  {\n    \"tag\": "flecnodal",\n    \"popularity\": 50303\n  },\n  {\n    \"tag\": "coventrate",\n    \"popularity\": 50157\n  },\n  {\n    \"tag\": "duchesse",\n    \"popularity\": 50011\n  },\n  {\n    \"tag\": "excisemanship trophied",\n    \"popularity\": 49866\n  },\n  {\n    \"tag\": "cytinaceous",\n    \"popularity\": 49721\n  },\n  {\n    \"tag\": "assuringly",\n    \"popularity\": 49577\n  },\n  {\n    \"tag\": "unconducted upliftitis",\n    \"popularity\": 49434\n  },\n  {\n    \"tag\": "rachicentesis",\n    \"popularity\": 49292\n  },\n  {\n    \"tag\": "antiangular",\n    \"popularity\": 49150\n  },\n  {\n    \"tag\": "advisal",\n    \"popularity\": 49008\n  },\n  {\n    \"tag\": "birdcatcher",\n    \"popularity\": 48868\n  },\n  {\n    \"tag\": "secularistic",\n    \"popularity\": 48728\n  },\n  {\n    \"tag\": "grandeeism superinformal",\n    \"popularity\": 48588\n  },\n  {\n    \"tag\": "unapprehension",\n    \"popularity\": 48449\n  },\n  {\n    \"tag\": "excipulum",\n    \"popularity\": 48311\n  },\n  {\n    \"tag\": "decimole",\n    \"popularity\": 48174\n  },\n  {\n    \"tag\": "semidrachm",\n    \"popularity\": 48037\n  },\n  {\n    \"tag\": "uvulotome",\n    \"popularity\": 47901\n  },\n  {\n    \"tag\": "Lemaneaceae",\n    \"popularity\": 47765\n  },\n  {\n    \"tag\": "corrade",\n    \"popularity\": 47630\n  },\n  {\n    \"tag\": "Kuroshio",\n    \"popularity\": 47495\n  },\n  {\n    \"tag\": "Araliophyllum",\n    \"popularity\": 47361\n  },\n  {\n    \"tag\": "victoriousness cardiosphygmograph",\n    \"popularity\": 47228\n  },\n  {\n    \"tag\": "reinvent",\n    \"popularity\": 47095\n  },\n  {\n    \"tag\": "Macrotolagus",\n    \"popularity\": 46963\n  },\n  {\n    \"tag\": "strenuousness",\n    \"popularity\": 46831\n  },\n  {\n    \"tag\": "deviability",\n    \"popularity\": 46700\n  },\n  {\n    \"tag\": "phyllospondylous",\n    \"popularity\": 46570\n  },\n  {\n    \"tag\": "bisect rudderhole",\n    \"popularity\": 46440\n  },\n  {\n    \"tag\": "crownwork",\n    \"popularity\": 46311\n  },\n  {\n    \"tag\": "Ascalabota",\n    \"popularity\": 46182\n  },\n  {\n    \"tag\": "prostatomyomectomy",\n    \"popularity\": 46054\n  },\n  {\n    \"tag\": "neurosyphilis",\n    \"popularity\": 45926\n  },\n  {\n    \"tag\": "tabloid scraplet",\n    \"popularity\": 45799\n  },\n  {\n    \"tag\": "nonmedullated servility",\n    \"popularity\": 45673\n  },\n  {\n    \"tag\": "melopoeic practicalization",\n    \"popularity\": 45547\n  },\n  {\n    \"tag\": "nonrhythmic",\n    \"popularity\": 45421\n  },\n  {\n    \"tag\": "deplorer",\n    \"popularity\": 45296\n  },\n  {\n    \"tag\": "Ophion",\n    \"popularity\": 45172\n  },\n  {\n    \"tag\": "subprioress",\n    \"popularity\": 45048\n  },\n  {\n    \"tag\": "semiregular",\n    \"popularity\": 44925\n  },\n  {\n    \"tag\": "praelection",\n    \"popularity\": 44802\n  },\n  {\n    \"tag\": "discinct",\n    \"popularity\": 44680\n  },\n  {\n    \"tag\": "preplace",\n    \"popularity\": 44558\n  },\n  {\n    \"tag\": "paternoster",\n    \"popularity\": 44437\n  },\n  {\n    \"tag\": "suboccipital",\n    \"popularity\": 44316\n  },\n  {\n    \"tag\": "Teutophil",\n    \"popularity\": 44196\n  },\n  {\n    \"tag\": "tracheole",\n    \"popularity\": 44076\n  },\n  {\n    \"tag\": "subsmile",\n    \"popularity\": 43957\n  },\n  {\n    \"tag\": "nonapostatizing",\n    \"popularity\": 43839\n  },\n  {\n    \"tag\": "cleidotomy",\n    \"popularity\": 43720\n  },\n  {\n    \"tag\": "hingle",\n    \"popularity\": 43603\n  },\n  {\n    \"tag\": "jocoque",\n    \"popularity\": 43486\n  },\n  {\n    \"tag\": "trundler notidanian",\n    \"popularity\": 43369\n  },\n  {\n    \"tag\": "strangling misdaub",\n    \"popularity\": 43253\n  },\n  {\n    \"tag\": "noncancellable",\n    \"popularity\": 43137\n  },\n  {\n    \"tag\": "lavabo",\n    \"popularity\": 43022\n  },\n  {\n    \"tag\": "lanterloo",\n    \"popularity\": 42907\n  },\n  {\n    \"tag\": "uncitizenly",\n    \"popularity\": 42793\n  },\n  {\n    \"tag\": "autoturning",\n    \"popularity\": 42679\n  },\n  {\n    \"tag\": "Haganah",\n    \"popularity\": 42566\n  },\n  {\n    \"tag\": "Glecoma",\n    \"popularity\": 42453\n  },\n  {\n    \"tag\": "membered",\n    \"popularity\": 42341\n  },\n  {\n    \"tag\": "consuetudinal",\n    \"popularity\": 42229\n  },\n  {\n    \"tag\": "gatehouse",\n    \"popularity\": 42117\n  },\n  {\n    \"tag\": "tetherball",\n    \"popularity\": 42006\n  },\n  {\n    \"tag\": "counterrevolutionist numismatical",\n    \"popularity\": 41896\n  },\n  {\n    \"tag\": "pagehood plateiasmus",\n    \"popularity\": 41786\n  },\n  {\n    \"tag\": "pelterer",\n    \"popularity\": 41676\n  },\n  {\n    \"tag\": "splenemphraxis",\n    \"popularity\": 41567\n  },\n  {\n    \"tag\": "Crypturidae",\n    \"popularity\": 41458\n  },\n  {\n    \"tag\": "caboodle",\n    \"popularity\": 41350\n  },\n  {\n    \"tag\": "Filaria",\n    \"popularity\": 41242\n  },\n  {\n    \"tag\": "noninvincibility",\n    \"popularity\": 41135\n  },\n  {\n    \"tag\": "preadvertisement",\n    \"popularity\": 41028\n  },\n  {\n    \"tag\": "bathrobe",\n    \"popularity\": 40921\n  },\n  {\n    \"tag\": "nitrifier",\n    \"popularity\": 40815\n  },\n  {\n    \"tag\": "furthermore",\n    \"popularity\": 40709\n  },\n  {\n    \"tag\": "recrate",\n    \"popularity\": 40604\n  },\n  {\n    \"tag\": "inexist",\n    \"popularity\": 40499\n  },\n  {\n    \"tag\": "Mocoan",\n    \"popularity\": 40395\n  },\n  {\n    \"tag\": "forint",\n    \"popularity\": 40291\n  },\n  {\n    \"tag\": "cardiomyoliposis",\n    \"popularity\": 40187\n  },\n  {\n    \"tag\": "channeling",\n    \"popularity\": 40084\n  },\n  {\n    \"tag\": "quebrachine",\n    \"popularity\": 39981\n  },\n  {\n    \"tag\": "magistery",\n    \"popularity\": 39879\n  },\n  {\n    \"tag\": "koko",\n    \"popularity\": 39777\n  },\n  {\n    \"tag\": "nobilify",\n    \"popularity\": 39676\n  },\n  {\n    \"tag\": "articulate taprooted",\n    \"popularity\": 39575\n  },\n  {\n    \"tag\": "cardiotonic Nicaragua",\n    \"popularity\": 39474\n  },\n  {\n    \"tag\": "assertiveness",\n    \"popularity\": 39374\n  },\n  {\n    \"tag\": "springtail",\n    \"popularity\": 39274\n  },\n  {\n    \"tag\": "spontoon",\n    \"popularity\": 39174\n  },\n  {\n    \"tag\": "plesiobiosis",\n    \"popularity\": 39075\n  },\n  {\n    \"tag\": "rooinek",\n    \"popularity\": 38976\n  },\n  {\n    \"tag\": "hairif falsehood",\n    \"popularity\": 38878\n  },\n  {\n    \"tag\": "synodally",\n    \"popularity\": 38780\n  },\n  {\n    \"tag\": "biodynamics",\n    \"popularity\": 38683\n  },\n  {\n    \"tag\": "trickling",\n    \"popularity\": 38585\n  },\n  {\n    \"tag\": "oxfly daystar",\n    \"popularity\": 38489\n  },\n  {\n    \"tag\": "epicycloidal",\n    \"popularity\": 38392\n  },\n  {\n    \"tag\": "shorthand",\n    \"popularity\": 38296\n  },\n  {\n    \"tag\": "herpolhode",\n    \"popularity\": 38201\n  },\n  {\n    \"tag\": "polysynthesism",\n    \"popularity\": 38105\n  },\n  {\n    \"tag\": "cany",\n    \"popularity\": 38010\n  },\n  {\n    \"tag\": "sideage",\n    \"popularity\": 37916\n  },\n  {\n    \"tag\": "strainableness",\n    \"popularity\": 37822\n  },\n  {\n    \"tag\": "superformidable",\n    \"popularity\": 37728\n  },\n  {\n    \"tag\": "slendang",\n    \"popularity\": 37634\n  },\n  {\n    \"tag\": "impropriation",\n    \"popularity\": 37541\n  },\n  {\n    \"tag\": "ficklehearted",\n    \"popularity\": 37449\n  },\n  {\n    \"tag\": "wintrify",\n    \"popularity\": 37356\n  },\n  {\n    \"tag\": "geomorphogenist",\n    \"popularity\": 37264\n  },\n  {\n    \"tag\": "smuggleable",\n    \"popularity\": 37173\n  },\n  {\n    \"tag\": "delapsion",\n    \"popularity\": 37081\n  },\n  {\n    \"tag\": "projective",\n    \"popularity\": 36990\n  },\n  {\n    \"tag\": "unglue exfoliation",\n    \"popularity\": 36900\n  },\n  {\n    \"tag\": "Acerae",\n    \"popularity\": 36810\n  },\n  {\n    \"tag\": "unstaged",\n    \"popularity\": 36720\n  },\n  {\n    \"tag\": "ranal",\n    \"popularity\": 36630\n  },\n  {\n    \"tag\": "worrier",\n    \"popularity\": 36541\n  },\n  {\n    \"tag\": "unhid",\n    \"popularity\": 36452\n  },\n  {\n    \"tag\": "adequation",\n    \"popularity\": 36363\n  },\n  {\n    \"tag\": "strongylid Sokotri",\n    \"popularity\": 36275\n  },\n  {\n    \"tag\": "fumingly",\n    \"popularity\": 36187\n  },\n  {\n    \"tag\": "gynosporangium phaenogenetic",\n    \"popularity\": 36100\n  },\n  {\n    \"tag\": "uniunguiculate",\n    \"popularity\": 36012\n  },\n  {\n    \"tag\": "prudelike",\n    \"popularity\": 35926\n  },\n  {\n    \"tag\": "seminomata",\n    \"popularity\": 35839\n  },\n  {\n    \"tag\": "trinklet",\n    \"popularity\": 35753\n  },\n  {\n    \"tag\": "risorial",\n    \"popularity\": 35667\n  },\n  {\n    \"tag\": "pericardiocentesis",\n    \"popularity\": 35581\n  },\n  {\n    \"tag\": "filmist",\n    \"popularity\": 35496\n  },\n  {\n    \"tag\": "Nana",\n    \"popularity\": 35411\n  },\n  {\n    \"tag\": "cynipoid",\n    \"popularity\": 35326\n  },\n  {\n    \"tag\": "cteniform",\n    \"popularity\": 35242\n  },\n  {\n    \"tag\": "semiflex",\n    \"popularity\": 35158\n  },\n  {\n    \"tag\": "solstitially",\n    \"popularity\": 35074\n  },\n  {\n    \"tag\": "Algarsife",\n    \"popularity\": 34991\n  },\n  {\n    \"tag\": "noncriminal",\n    \"popularity\": 34908\n  },\n  {\n    \"tag\": "compassion",\n    \"popularity\": 34825\n  },\n  {\n    \"tag\": "Buddhic",\n    \"popularity\": 34743\n  },\n  {\n    \"tag\": "vellicative dactylically hotfoot",\n    \"popularity\": 34661\n  },\n  {\n    \"tag\": "chicory",\n    \"popularity\": 34579\n  },\n  {\n    \"tag\": "transperitoneally",\n    \"popularity\": 34497\n  },\n  {\n    \"tag\": "pennae",\n    \"popularity\": 34416\n  },\n  {\n    \"tag\": "Flamandize",\n    \"popularity\": 34335\n  },\n  {\n    \"tag\": "underviewer",\n    \"popularity\": 34254\n  },\n  {\n    \"tag\": "assoil",\n    \"popularity\": 34174\n  },\n  {\n    \"tag\": "saccharobacillus",\n    \"popularity\": 34094\n  },\n  {\n    \"tag\": "biacetylene",\n    \"popularity\": 34014\n  },\n  {\n    \"tag\": "mouchardism",\n    \"popularity\": 33935\n  },\n  {\n    \"tag\": "anisomeric",\n    \"popularity\": 33856\n  },\n  {\n    \"tag\": "digestive",\n    \"popularity\": 33777\n  },\n  {\n    \"tag\": "darlingly",\n    \"popularity\": 33698\n  },\n  {\n    \"tag\": "liman",\n    \"popularity\": 33620\n  },\n  {\n    \"tag\": "soldanrie",\n    \"popularity\": 33542\n  },\n  {\n    \"tag\": "sully",\n    \"popularity\": 33464\n  },\n  {\n    \"tag\": "brightsmith",\n    \"popularity\": 33387\n  },\n  {\n    \"tag\": "inwrap antiliturgist ureterocervical",\n    \"popularity\": 33309\n  },\n  {\n    \"tag\": "discommodity",\n    \"popularity\": 33232\n  },\n  {\n    \"tag\": "typical aggrandizer",\n    \"popularity\": 33156\n  },\n  {\n    \"tag\": "xenogeny",\n    \"popularity\": 33079\n  },\n  {\n    \"tag\": "uncountrified",\n    \"popularity\": 33003\n  },\n  {\n    \"tag\": "Podarge",\n    \"popularity\": 32928\n  },\n  {\n    \"tag\": "uninterviewed",\n    \"popularity\": 32852\n  },\n  {\n    \"tag\": "underprior",\n    \"popularity\": 32777\n  },\n  {\n    \"tag\": "leiomyomatous",\n    \"popularity\": 32702\n  },\n  {\n    \"tag\": "postdysenteric",\n    \"popularity\": 32627\n  },\n  {\n    \"tag\": "Fusicladium",\n    \"popularity\": 32553\n  },\n  {\n    \"tag\": "Dulcinea",\n    \"popularity\": 32478\n  },\n  {\n    \"tag\": "interspersion",\n    \"popularity\": 32404\n  },\n  {\n    \"tag\": "preobligate",\n    \"popularity\": 32331\n  },\n  {\n    \"tag\": "subaggregate",\n    \"popularity\": 32257\n  },\n  {\n    \"tag\": "grammarianism",\n    \"popularity\": 32184\n  },\n  {\n    \"tag\": "palikar",\n    \"popularity\": 32111\n  },\n  {\n    \"tag\": "facileness",\n    \"popularity\": 32039\n  },\n  {\n    \"tag\": "deuterofibrinose",\n    \"popularity\": 31966\n  },\n  {\n    \"tag\": "pseudesthesia",\n    \"popularity\": 31894\n  },\n  {\n    \"tag\": "sedimentary",\n    \"popularity\": 31822\n  },\n  {\n    \"tag\": "typewrite",\n    \"popularity\": 31751\n  },\n  {\n    \"tag\": "immemorable",\n    \"popularity\": 31679\n  },\n  {\n    \"tag\": "Myrtus",\n    \"popularity\": 31608\n  },\n  {\n    \"tag\": "hauchecornite",\n    \"popularity\": 31537\n  },\n  {\n    \"tag\": "galleylike",\n    \"popularity\": 31467\n  },\n  {\n    \"tag\": "thimber",\n    \"popularity\": 31396\n  },\n  {\n    \"tag\": "Hegelianism",\n    \"popularity\": 31326\n  },\n  {\n    \"tag\": "strig",\n    \"popularity\": 31256\n  },\n  {\n    \"tag\": "skyre",\n    \"popularity\": 31187\n  },\n  {\n    \"tag\": "eupepticism",\n    \"popularity\": 31117\n  },\n  {\n    \"tag\": "eponymism",\n    \"popularity\": 31048\n  },\n  {\n    \"tag\": "flunkeyhood",\n    \"popularity\": 30979\n  },\n  {\n    \"tag\": "Abama",\n    \"popularity\": 30911\n  },\n  {\n    \"tag\": "adiadochokinesis",\n    \"popularity\": 30842\n  },\n  {\n    \"tag\": "spendthrifty",\n    \"popularity\": 30774\n  },\n  {\n    \"tag\": "chalcedony",\n    \"popularity\": 30706\n  },\n  {\n    \"tag\": "authorism",\n    \"popularity\": 30638\n  },\n  {\n    \"tag\": "nasturtium",\n    \"popularity\": 30571\n  },\n  {\n    \"tag\": "Acanthocereus",\n    \"popularity\": 30504\n  },\n  {\n    \"tag\": "uncollapsible",\n    \"popularity\": 30437\n  },\n  {\n    \"tag\": "excursionist",\n    \"popularity\": 30370\n  },\n  {\n    \"tag\": "fogbow",\n    \"popularity\": 30303\n  },\n  {\n    \"tag\": "overlie",\n    \"popularity\": 30237\n  },\n  {\n    \"tag\": "velours",\n    \"popularity\": 30171\n  },\n  {\n    \"tag\": "zoodendria madrigal stagbush",\n    \"popularity\": 30105\n  },\n  {\n    \"tag\": "imi",\n    \"popularity\": 30039\n  },\n  {\n    \"tag\": "cojudge",\n    \"popularity\": 29974\n  },\n  {\n    \"tag\": "depurate argal",\n    \"popularity\": 29909\n  },\n  {\n    \"tag\": "unrecognition",\n    \"popularity\": 29844\n  },\n  {\n    \"tag\": "paunchful",\n    \"popularity\": 29779\n  },\n  {\n    \"tag\": "invalued",\n    \"popularity\": 29714\n  },\n  {\n    \"tag\": "probang",\n    \"popularity\": 29650\n  },\n  {\n    \"tag\": "chetvert",\n    \"popularity\": 29586\n  },\n  {\n    \"tag\": "enactable",\n    \"popularity\": 29522\n  },\n  {\n    \"tag\": "detoxicate adhibit",\n    \"popularity\": 29458\n  },\n  {\n    \"tag\": "kullaite",\n    \"popularity\": 29395\n  },\n  {\n    \"tag\": "undazzling",\n    \"popularity\": 29332\n  },\n  {\n    \"tag\": "excalation",\n    \"popularity\": 29269\n  },\n  {\n    \"tag\": "sievings",\n    \"popularity\": 29206\n  },\n  {\n    \"tag\": "disenthral",\n    \"popularity\": 29143\n  },\n  {\n    \"tag\": "disinterestedly",\n    \"popularity\": 29081\n  },\n  {\n    \"tag\": "stanner",\n    \"popularity\": 29018\n  },\n  {\n    \"tag\": "recapitulative",\n    \"popularity\": 28956\n  },\n  {\n    \"tag\": "objectivist",\n    \"popularity\": 28895\n  },\n  {\n    \"tag\": "hypermetropia",\n    \"popularity\": 28833\n  },\n  {\n    \"tag\": "incumbency",\n    \"popularity\": 28772\n  },\n  {\n    \"tag\": "protegee",\n    \"popularity\": 28711\n  },\n  {\n    \"tag\": "zealotic",\n    \"popularity\": 28650\n  },\n  {\n    \"tag\": "predebit",\n    \"popularity\": 28589\n  },\n  {\n    \"tag\": "cupolar",\n    \"popularity\": 28528\n  },\n  {\n    \"tag\": "unattributed",\n    \"popularity\": 28468\n  },\n  {\n    \"tag\": "louisine",\n    \"popularity\": 28408\n  },\n  {\n    \"tag\": "illustrate",\n    \"popularity\": 28348\n  },\n  {\n    \"tag\": "inofficiousness",\n    \"popularity\": 28288\n  },\n  {\n    \"tag\": "Americawards",\n    \"popularity\": 28228\n  },\n  {\n    \"tag\": "foreflap",\n    \"popularity\": 28169\n  },\n  {\n    \"tag\": "eruditeness",\n    \"popularity\": 28110\n  },\n  {\n    \"tag\": "copiopsia",\n    \"popularity\": 28051\n  },\n  {\n    \"tag\": "sporuliferous",\n    \"popularity\": 27992\n  },\n  {\n    \"tag\": "muttering",\n    \"popularity\": 27934\n  },\n  {\n    \"tag\": "prepsychology adrip",\n    \"popularity\": 27875\n  },\n  {\n    \"tag\": "unfriendly",\n    \"popularity\": 27817\n  },\n  {\n    \"tag\": "sulphanilic",\n    \"popularity\": 27759\n  },\n  {\n    \"tag\": "Coelococcus",\n    \"popularity\": 27701\n  },\n  {\n    \"tag\": "undoubtfulness",\n    \"popularity\": 27643\n  },\n  {\n    \"tag\": "flaringly",\n    \"popularity\": 27586\n  },\n  {\n    \"tag\": "unordain",\n    \"popularity\": 27529\n  },\n  {\n    \"tag\": "fratchety",\n    \"popularity\": 27472\n  },\n  {\n    \"tag\": "decadentism dolefully",\n    \"popularity\": 27415\n  },\n  {\n    \"tag\": "synthronus",\n    \"popularity\": 27358\n  },\n  {\n    \"tag\": "maiid",\n    \"popularity\": 27301\n  },\n  {\n    \"tag\": "rhinobyon",\n    \"popularity\": 27245\n  },\n  {\n    \"tag\": "Didynamia",\n    \"popularity\": 27189\n  },\n  {\n    \"tag\": "millionairedom",\n    \"popularity\": 27133\n  },\n  {\n    \"tag\": "mulierine",\n    \"popularity\": 27077\n  },\n  {\n    \"tag\": "Mayo",\n    \"popularity\": 27021\n  },\n  {\n    \"tag\": "perceivedness",\n    \"popularity\": 26966\n  },\n  {\n    \"tag\": "unadoration",\n    \"popularity\": 26911\n  },\n  {\n    \"tag\": "regraft",\n    \"popularity\": 26856\n  },\n  {\n    \"tag\": "witch",\n    \"popularity\": 26801\n  },\n  {\n    \"tag\": "ungrow",\n    \"popularity\": 26746\n  },\n  {\n    \"tag\": "glossopharyngeus",\n    \"popularity\": 26691\n  },\n  {\n    \"tag\": "unstirrable",\n    \"popularity\": 26637\n  },\n  {\n    \"tag\": "synodsman",\n    \"popularity\": 26583\n  },\n  {\n    \"tag\": "placentalian",\n    \"popularity\": 26529\n  },\n  {\n    \"tag\": "corpulently",\n    \"popularity\": 26475\n  },\n  {\n    \"tag\": "photochromoscope",\n    \"popularity\": 26421\n  },\n  {\n    \"tag\": "indusiate retinasphaltum chokestrap",\n    \"popularity\": 26368\n  },\n  {\n    \"tag\": "murdrum",\n    \"popularity\": 26314\n  },\n  {\n    \"tag\": "belatedness",\n    \"popularity\": 26261\n  },\n  {\n    \"tag\": "Cochin",\n    \"popularity\": 26208\n  },\n  {\n    \"tag\": "Leonist",\n    \"popularity\": 26155\n  },\n  {\n    \"tag\": "keeker confined",\n    \"popularity\": 26102\n  },\n  {\n    \"tag\": "unintellectual",\n    \"popularity\": 26050\n  },\n  {\n    \"tag\": "nymphaline bait",\n    \"popularity\": 25997\n  },\n  {\n    \"tag\": "sarcosporidiosis",\n    \"popularity\": 25945\n  },\n  {\n    \"tag\": "catawamptiously",\n    \"popularity\": 25893\n  },\n  {\n    \"tag\": "outshame",\n    \"popularity\": 25841\n  },\n  {\n    \"tag\": "animalism",\n    \"popularity\": 25790\n  },\n  {\n    \"tag\": "epithalamial",\n    \"popularity\": 25738\n  },\n  {\n    \"tag\": "ganner",\n    \"popularity\": 25687\n  },\n  {\n    \"tag\": "desilicify",\n    \"popularity\": 25635\n  },\n  {\n    \"tag\": "dandyism",\n    \"popularity\": 25584\n  },\n  {\n    \"tag\": "hyleg",\n    \"popularity\": 25533\n  },\n  {\n    \"tag\": "photophysical",\n    \"popularity\": 25483\n  },\n  {\n    \"tag\": "underload",\n    \"popularity\": 25432\n  },\n  {\n    \"tag\": "unintrusive",\n    \"popularity\": 25382\n  },\n  {\n    \"tag\": "succinamic",\n    \"popularity\": 25331\n  },\n  {\n    \"tag\": "matchy",\n    \"popularity\": 25281\n  },\n  {\n    \"tag\": "concordal",\n    \"popularity\": 25231\n  },\n  {\n    \"tag\": "exteriority",\n    \"popularity\": 25181\n  },\n  {\n    \"tag\": "sterculiad",\n    \"popularity\": 25132\n  },\n  {\n    \"tag\": "sulfoxylic",\n    \"popularity\": 25082\n  },\n  {\n    \"tag\": "oversubscription",\n    \"popularity\": 25033\n  },\n  {\n    \"tag\": "chiasmic",\n    \"popularity\": 24984\n  },\n  {\n    \"tag\": "pseudoparthenogenesis",\n    \"popularity\": 24935\n  },\n  {\n    \"tag\": "indorse",\n    \"popularity\": 24886\n  },\n  {\n    \"tag\": "Krishnaite",\n    \"popularity\": 24837\n  },\n  {\n    \"tag\": "calcinize",\n    \"popularity\": 24788\n  },\n  {\n    \"tag\": "rhodium",\n    \"popularity\": 24740\n  },\n  {\n    \"tag\": "tragopan",\n    \"popularity\": 24692\n  },\n  {\n    \"tag\": "overwhelmingly",\n    \"popularity\": 24643\n  },\n  {\n    \"tag\": "procidence accorporate",\n    \"popularity\": 24595\n  },\n  {\n    \"tag\": "polemize speelless",\n    \"popularity\": 24548\n  },\n  {\n    \"tag\": "radiocarpal goran",\n    \"popularity\": 24500\n  },\n  {\n    \"tag\": "counteroffer Pelodytes",\n    \"popularity\": 24452\n  },\n  {\n    \"tag\": "lionhearted",\n    \"popularity\": 24405\n  },\n  {\n    \"tag\": "paramastoid",\n    \"popularity\": 24358\n  },\n  {\n    \"tag\": "murine",\n    \"popularity\": 24310\n  },\n  {\n    \"tag\": "woodbined",\n    \"popularity\": 24263\n  },\n  {\n    \"tag\": "packthread",\n    \"popularity\": 24217\n  },\n  {\n    \"tag\": "citreous",\n    \"popularity\": 24170\n  },\n  {\n    \"tag\": "unfallaciously",\n    \"popularity\": 24123\n  },\n  {\n    \"tag\": "tentwork reincarnadine",\n    \"popularity\": 24077\n  },\n  {\n    \"tag\": "verminousness",\n    \"popularity\": 24030\n  },\n  {\n    \"tag\": "sillometer",\n    \"popularity\": 23984\n  },\n  {\n    \"tag\": "jointy",\n    \"popularity\": 23938\n  },\n  {\n    \"tag\": "streptolysin",\n    \"popularity\": 23892\n  },\n  {\n    \"tag\": "Florentinism",\n    \"popularity\": 23847\n  },\n  {\n    \"tag\": "monosomatous",\n    \"popularity\": 23801\n  },\n  {\n    \"tag\": "capsulociliary",\n    \"popularity\": 23756\n  },\n  {\n    \"tag\": "organum",\n    \"popularity\": 23710\n  },\n  {\n    \"tag\": "overtly",\n    \"popularity\": 23665\n  },\n  {\n    \"tag\": "ophthalmoscopical",\n    \"popularity\": 23620\n  },\n  {\n    \"tag\": "supposititiously",\n    \"popularity\": 23575\n  },\n  {\n    \"tag\": "radiochemistry",\n    \"popularity\": 23530\n  },\n  {\n    \"tag\": "flaxtail",\n    \"popularity\": 23486\n  },\n  {\n    \"tag\": "pretympanic",\n    \"popularity\": 23441\n  },\n  {\n    \"tag\": "auscultation",\n    \"popularity\": 23397\n  },\n  {\n    \"tag\": "hairdresser",\n    \"popularity\": 23352\n  },\n  {\n    \"tag\": "chaffless",\n    \"popularity\": 23308\n  },\n  {\n    \"tag\": "polioencephalitis",\n    \"popularity\": 23264\n  },\n  {\n    \"tag\": "axolotl",\n    \"popularity\": 23220\n  },\n  {\n    \"tag\": "smous",\n    \"popularity\": 23177\n  },\n  {\n    \"tag\": "morgen disenamour toothed",\n    \"popularity\": 23133\n  },\n  {\n    \"tag\": "chaiseless",\n    \"popularity\": 23089\n  },\n  {\n    \"tag\": "frugally",\n    \"popularity\": 23046\n  },\n  {\n    \"tag\": "combustive antievolutionist cinenegative",\n    \"popularity\": 23003\n  },\n  {\n    \"tag\": "malacolite",\n    \"popularity\": 22960\n  },\n  {\n    \"tag\": "borne",\n    \"popularity\": 22917\n  },\n  {\n    \"tag\": "mercaptole",\n    \"popularity\": 22874\n  },\n  {\n    \"tag\": "judicatory",\n    \"popularity\": 22831\n  },\n  {\n    \"tag\": "noctivagation",\n    \"popularity\": 22789\n  },\n  {\n    \"tag\": "synthete",\n    \"popularity\": 22746\n  },\n  {\n    \"tag\": "tomboyism",\n    \"popularity\": 22704\n  },\n  {\n    \"tag\": "serranoid",\n    \"popularity\": 22661\n  },\n  {\n    \"tag\": "impostorism",\n    \"popularity\": 22619\n  },\n  {\n    \"tag\": "flagellosis Talitha",\n    \"popularity\": 22577\n  },\n  {\n    \"tag\": "pseudoviscous",\n    \"popularity\": 22535\n  },\n  {\n    \"tag\": "Galleriidae",\n    \"popularity\": 22494\n  },\n  {\n    \"tag\": "undulation didelph Comintern",\n    \"popularity\": 22452\n  },\n  {\n    \"tag\": "triangulopyramidal",\n    \"popularity\": 22411\n  },\n  {\n    \"tag\": "middlings",\n    \"popularity\": 22369\n  },\n  {\n    \"tag\": "piperazin",\n    \"popularity\": 22328\n  },\n  {\n    \"tag\": "endostitis",\n    \"popularity\": 22287\n  },\n  {\n    \"tag\": "swordlike",\n    \"popularity\": 22246\n  },\n  {\n    \"tag\": "forthwith",\n    \"popularity\": 22205\n  },\n  {\n    \"tag\": "menaceful",\n    \"popularity\": 22164\n  },\n  {\n    \"tag\": "explantation defective",\n    \"popularity\": 22123\n  },\n  {\n    \"tag\": "arrear",\n    \"popularity\": 22083\n  },\n  {\n    \"tag\": "engraft",\n    \"popularity\": 22042\n  },\n  {\n    \"tag\": "revolunteer",\n    \"popularity\": 22002\n  },\n  {\n    \"tag\": "foliaceous",\n    \"popularity\": 21962\n  },\n  {\n    \"tag\": "pseudograph",\n    \"popularity\": 21922\n  },\n  {\n    \"tag\": "maenaite",\n    \"popularity\": 21882\n  },\n  {\n    \"tag\": "interfinger",\n    \"popularity\": 21842\n  },\n  {\n    \"tag\": "macroscopically",\n    \"popularity\": 21802\n  },\n  {\n    \"tag\": "bluewood",\n    \"popularity\": 21762\n  },\n  {\n    \"tag\": "chikara",\n    \"popularity\": 21723\n  },\n  {\n    \"tag\": "reprehension diazeuxis nickelous",\n    \"popularity\": 21683\n  },\n  {\n    \"tag\": "vacuation",\n    \"popularity\": 21644\n  },\n  {\n    \"tag\": "Sartish",\n    \"popularity\": 21605\n  },\n  {\n    \"tag\": "pseudogyny",\n    \"popularity\": 21566\n  },\n  {\n    \"tag\": "friedcake",\n    \"popularity\": 21527\n  },\n  {\n    \"tag\": "thraw",\n    \"popularity\": 21488\n  },\n  {\n    \"tag\": "bifid",\n    \"popularity\": 21449\n  },\n  {\n    \"tag\": "truthlessly",\n    \"popularity\": 21411\n  },\n  {\n    \"tag\": "lungy",\n    \"popularity\": 21372\n  },\n  {\n    \"tag\": "fluoborite",\n    \"popularity\": 21334\n  },\n  {\n    \"tag\": "anthropolithic",\n    \"popularity\": 21295\n  },\n  {\n    \"tag\": "coachee straw",\n    \"popularity\": 21257\n  },\n  {\n    \"tag\": "dehorner Grecize",\n    \"popularity\": 21219\n  },\n  {\n    \"tag\": "spondylopyosis",\n    \"popularity\": 21181\n  },\n  {\n    \"tag\": "institutionary",\n    \"popularity\": 21143\n  },\n  {\n    \"tag\": "agentry",\n    \"popularity\": 21105\n  },\n  {\n    \"tag\": "musing bietle",\n    \"popularity\": 21068\n  },\n  {\n    \"tag\": "cormophyte",\n    \"popularity\": 21030\n  },\n  {\n    \"tag\": "semielliptic",\n    \"popularity\": 20993\n  },\n  {\n    \"tag\": "ependytes",\n    \"popularity\": 20955\n  },\n  {\n    \"tag\": "coachmaster",\n    \"popularity\": 20918\n  },\n  {\n    \"tag\": "overexuberant",\n    \"popularity\": 20881\n  },\n  {\n    \"tag\": "selectable",\n    \"popularity\": 20844\n  },\n  {\n    \"tag\": "saclike",\n    \"popularity\": 20807\n  },\n  {\n    \"tag\": "mullion",\n    \"popularity\": 20770\n  },\n  {\n    \"tag\": "pantheonize prevalency",\n    \"popularity\": 20733\n  },\n  {\n    \"tag\": "trophosperm",\n    \"popularity\": 20697\n  },\n  {\n    \"tag\": "paraphrasist",\n    \"popularity\": 20660\n  },\n  {\n    \"tag\": "undercarry",\n    \"popularity\": 20624\n  },\n  {\n    \"tag\": "thallogenic",\n    \"popularity\": 20587\n  },\n  {\n    \"tag\": "bulgy forbid",\n    \"popularity\": 20551\n  },\n  {\n    \"tag\": "proliquor gratulatory",\n    \"popularity\": 20515\n  },\n  {\n    \"tag\": "booker",\n    \"popularity\": 20479\n  },\n  {\n    \"tag\": "wizen",\n    \"popularity\": 20443\n  },\n  {\n    \"tag\": "synchondrosially",\n    \"popularity\": 20407\n  },\n  {\n    \"tag\": "herbless",\n    \"popularity\": 20371\n  },\n  {\n    \"tag\": "arfvedsonite",\n    \"popularity\": 20336\n  },\n  {\n    \"tag\": "Neuroptera",\n    \"popularity\": 20300\n  },\n  {\n    \"tag\": "fingerstone",\n    \"popularity\": 20265\n  },\n  {\n    \"tag\": "Odontoglossae",\n    \"popularity\": 20229\n  },\n  {\n    \"tag\": "transmigrator",\n    \"popularity\": 20194\n  },\n  {\n    \"tag\": "Dehaites",\n    \"popularity\": 20159\n  },\n  {\n    \"tag\": "Molinist",\n    \"popularity\": 20124\n  },\n  {\n    \"tag\": "novelistic",\n    \"popularity\": 20089\n  },\n  {\n    \"tag\": "astelic",\n    \"popularity\": 20054\n  },\n  {\n    \"tag\": "pyelometry",\n    \"popularity\": 20019\n  },\n  {\n    \"tag\": "pigmentation",\n    \"popularity\": 19984\n  },\n  {\n    \"tag\": "epinaos",\n    \"popularity\": 19950\n  },\n  {\n    \"tag\": "outdare",\n    \"popularity\": 19915\n  },\n  {\n    \"tag\": "Funje philaristocracy",\n    \"popularity\": 19881\n  },\n  {\n    \"tag\": "keddah",\n    \"popularity\": 19846\n  },\n  {\n    \"tag\": "axoidean",\n    \"popularity\": 19812\n  },\n  {\n    \"tag\": "ovule",\n    \"popularity\": 19778\n  },\n  {\n    \"tag\": "solidify",\n    \"popularity\": 19744\n  },\n  {\n    \"tag\": "noncelestial",\n    \"popularity\": 19710\n  },\n  {\n    \"tag\": "overmultiplication",\n    \"popularity\": 19676\n  },\n  {\n    \"tag\": "hexatetrahedron",\n    \"popularity\": 19642\n  },\n  {\n    \"tag\": "pliciform",\n    \"popularity\": 19609\n  },\n  {\n    \"tag\": "zimbalon",\n    \"popularity\": 19575\n  },\n  {\n    \"tag\": "annexational",\n    \"popularity\": 19542\n  },\n  {\n    \"tag\": "eurhodol",\n    \"popularity\": 19508\n  },\n  {\n    \"tag\": "yark",\n    \"popularity\": 19475\n  },\n  {\n    \"tag\": "illegality nitroalizarin",\n    \"popularity\": 19442\n  },\n  {\n    \"tag\": "quadratum",\n    \"popularity\": 19409\n  },\n  {\n    \"tag\": "saccharine",\n    \"popularity\": 19376\n  },\n  {\n    \"tag\": "unemploy",\n    \"popularity\": 19343\n  },\n  {\n    \"tag\": "uniclinal unipotent",\n    \"popularity\": 19310\n  },\n  {\n    \"tag\": "turbo",\n    \"popularity\": 19277\n  },\n  {\n    \"tag\": "sybarism",\n    \"popularity\": 19244\n  },\n  {\n    \"tag\": "motacilline",\n    \"popularity\": 19212\n  },\n  {\n    \"tag\": "weaselly",\n    \"popularity\": 19179\n  },\n  {\n    \"tag\": "plastid",\n    \"popularity\": 19147\n  },\n  {\n    \"tag\": "wasting",\n    \"popularity\": 19114\n  },\n  {\n    \"tag\": "begrime fluting",\n    \"popularity\": 19082\n  },\n  {\n    \"tag\": "Nephilinae",\n    \"popularity\": 19050\n  },\n  {\n    \"tag\": "disregardance",\n    \"popularity\": 19018\n  },\n  {\n    \"tag\": "Shakerlike",\n    \"popularity\": 18986\n  },\n  {\n    \"tag\": "uniped",\n    \"popularity\": 18954\n  },\n  {\n    \"tag\": "knap",\n    \"popularity\": 18922\n  },\n  {\n    \"tag\": "electivism undergardener",\n    \"popularity\": 18890\n  },\n  {\n    \"tag\": "hulverheaded",\n    \"popularity\": 18858\n  },\n  {\n    \"tag\": "unruptured",\n    \"popularity\": 18827\n  },\n  {\n    \"tag\": "solemnize credently",\n    \"popularity\": 18795\n  },\n  {\n    \"tag\": "pentastomoid possessingly",\n    \"popularity\": 18764\n  },\n  {\n    \"tag\": "octose",\n    \"popularity\": 18733\n  },\n  {\n    \"tag\": "psithurism indefensibility",\n    \"popularity\": 18701\n  },\n  {\n    \"tag\": "torrentuous cyanometer subcrenate",\n    \"popularity\": 18670\n  },\n  {\n    \"tag\": "photoplaywright tapaculo",\n    \"popularity\": 18639\n  },\n  {\n    \"tag\": "univalence",\n    \"popularity\": 18608\n  },\n  {\n    \"tag\": "Porthetria",\n    \"popularity\": 18577\n  },\n  {\n    \"tag\": "funambulo",\n    \"popularity\": 18546\n  },\n  {\n    \"tag\": "pedion",\n    \"popularity\": 18515\n  },\n  {\n    \"tag\": "horticulturally",\n    \"popularity\": 18485\n  },\n  {\n    \"tag\": "marennin",\n    \"popularity\": 18454\n  },\n  {\n    \"tag\": "horselaugh",\n    \"popularity\": 18423\n  },\n  {\n    \"tag\": "semiexecutive",\n    \"popularity\": 18393\n  },\n  {\n    \"tag\": "Monopteridae",\n    \"popularity\": 18363\n  },\n  {\n    \"tag\": "commonable",\n    \"popularity\": 18332\n  },\n  {\n    \"tag\": "dreariment",\n    \"popularity\": 18302\n  },\n  {\n    \"tag\": "disbud",\n    \"popularity\": 18272\n  },\n  {\n    \"tag\": "monocled",\n    \"popularity\": 18242\n  },\n  {\n    \"tag\": "hurlbarrow",\n    \"popularity\": 18212\n  },\n  {\n    \"tag\": "opiateproof",\n    \"popularity\": 18182\n  },\n  {\n    \"tag\": "Fahrenheit",\n    \"popularity\": 18152\n  },\n  {\n    \"tag\": "writhed",\n    \"popularity\": 18122\n  },\n  {\n    \"tag\": "Volstead",\n    \"popularity\": 18093\n  },\n  {\n    \"tag\": "yesternight",\n    \"popularity\": 18063\n  },\n  {\n    \"tag\": "readmittance",\n    \"popularity\": 18033\n  },\n  {\n    \"tag\": "reiterable",\n    \"popularity\": 18004\n  },\n  {\n    \"tag\": "triquetral",\n    \"popularity\": 17975\n  },\n  {\n    \"tag\": "guillotinement",\n    \"popularity\": 17945\n  },\n  {\n    \"tag\": "repermission",\n    \"popularity\": 17916\n  },\n  {\n    \"tag\": "assishly",\n    \"popularity\": 17887\n  },\n  {\n    \"tag\": "daidle",\n    \"popularity\": 17858\n  },\n  {\n    \"tag\": "prismatoid",\n    \"popularity\": 17829\n  },\n  {\n    \"tag\": "irreptitious",\n    \"popularity\": 17800\n  },\n  {\n    \"tag\": "sourdeline",\n    \"popularity\": 17771\n  },\n  {\n    \"tag\": "Austrian",\n    \"popularity\": 17742\n  },\n  {\n    \"tag\": "psychorrhagic",\n    \"popularity\": 17713\n  },\n  {\n    \"tag\": "Monumbo",\n    \"popularity\": 17685\n  },\n  {\n    \"tag\": "cloiochoanitic",\n    \"popularity\": 17656\n  },\n  {\n    \"tag\": "hant",\n    \"popularity\": 17628\n  },\n  {\n    \"tag\": "roily pulldown",\n    \"popularity\": 17599\n  },\n  {\n    \"tag\": "recongratulation",\n    \"popularity\": 17571\n  },\n  {\n    \"tag\": "Peking",\n    \"popularity\": 17543\n  },\n  {\n    \"tag\": "erdvark",\n    \"popularity\": 17514\n  },\n  {\n    \"tag\": "antimnemonic",\n    \"popularity\": 17486\n  },\n  {\n    \"tag\": "noncapillarity",\n    \"popularity\": 17458\n  },\n  {\n    \"tag\": "irrepressive",\n    \"popularity\": 17430\n  },\n  {\n    \"tag\": "Petromyzontes",\n    \"popularity\": 17402\n  },\n  {\n    \"tag\": "piscatorially",\n    \"popularity\": 17374\n  },\n  {\n    \"tag\": "cholesterosis",\n    \"popularity\": 17346\n  },\n  {\n    \"tag\": "denunciate",\n    \"popularity\": 17319\n  },\n  {\n    \"tag\": "unmetalled",\n    \"popularity\": 17291\n  },\n  {\n    \"tag\": "Tigris enruin",\n    \"popularity\": 17263\n  },\n  {\n    \"tag\": "anaspalin",\n    \"popularity\": 17236\n  },\n  {\n    \"tag\": "monodromy",\n    \"popularity\": 17208\n  },\n  {\n    \"tag\": "Canichanan",\n    \"popularity\": 17181\n  },\n  {\n    \"tag\": "mesolabe",\n    \"popularity\": 17154\n  },\n  {\n    \"tag\": "trichothallic overcunningness",\n    \"popularity\": 17127\n  },\n  {\n    \"tag\": "spinsterishly",\n    \"popularity\": 17099\n  },\n  {\n    \"tag\": "sensilla",\n    \"popularity\": 17072\n  },\n  {\n    \"tag\": "wifelkin",\n    \"popularity\": 17045\n  },\n  {\n    \"tag\": "suppositionless",\n    \"popularity\": 17018\n  },\n  {\n    \"tag\": "irksomeness",\n    \"popularity\": 16991\n  },\n  {\n    \"tag\": "sanbenito",\n    \"popularity\": 16964\n  },\n  {\n    \"tag\": "nonstatement",\n    \"popularity\": 16938\n  },\n  {\n    \"tag\": "phenoloid",\n    \"popularity\": 16911\n  },\n  {\n    \"tag\": "Steinberger",\n    \"popularity\": 16884\n  },\n  {\n    \"tag\": "replicated boom",\n    \"popularity\": 16858\n  },\n  {\n    \"tag\": "sciomachiology",\n    \"popularity\": 16831\n  },\n  {\n    \"tag\": "starwise",\n    \"popularity\": 16805\n  },\n  {\n    \"tag\": "prerich",\n    \"popularity\": 16778\n  },\n  {\n    \"tag\": "unspawned",\n    \"popularity\": 16752\n  },\n  {\n    \"tag\": "unindentable",\n    \"popularity\": 16726\n  },\n  {\n    \"tag\": "stromatic",\n    \"popularity\": 16700\n  },\n  {\n    \"tag\": "fetishize",\n    \"popularity\": 16673\n  },\n  {\n    \"tag\": "dihydroxy",\n    \"popularity\": 16647\n  },\n  {\n    \"tag\": "precaudal",\n    \"popularity\": 16621\n  },\n  {\n    \"tag\": "Madagascar",\n    \"popularity\": 16595\n  },\n  {\n    \"tag\": "repinement",\n    \"popularity\": 16570\n  },\n  {\n    \"tag\": "noncathedral wenzel",\n    \"popularity\": 16544\n  },\n  {\n    \"tag\": "corollike",\n    \"popularity\": 16518\n  },\n  {\n    \"tag\": "pubes unamortization",\n    \"popularity\": 16492\n  },\n  {\n    \"tag\": "brickcroft",\n    \"popularity\": 16467\n  },\n  {\n    \"tag\": "intertrabecular",\n    \"popularity\": 16441\n  },\n  {\n    \"tag\": "formulaic",\n    \"popularity\": 16416\n  },\n  {\n    \"tag\": "arienzo",\n    \"popularity\": 16390\n  },\n  {\n    \"tag\": "Mazzinian",\n    \"popularity\": 16365\n  },\n  {\n    \"tag\": "wallowishly",\n    \"popularity\": 16339\n  },\n  {\n    \"tag\": "sysselman",\n    \"popularity\": 16314\n  },\n  {\n    \"tag\": "seligmannite",\n    \"popularity\": 16289\n  },\n  {\n    \"tag\": "harlequinery",\n    \"popularity\": 16264\n  },\n  {\n    \"tag\": "zucchetto",\n    \"popularity\": 16239\n  },\n  {\n    \"tag\": "malonyl",\n    \"popularity\": 16214\n  },\n  {\n    \"tag\": "patwari",\n    \"popularity\": 16189\n  },\n  {\n    \"tag\": "neoholmia venturesomeness",\n    \"popularity\": 16164\n  },\n  {\n    \"tag\": "Dehwar",\n    \"popularity\": 16139\n  },\n  {\n    \"tag\": "fetiferous",\n    \"popularity\": 16114\n  },\n  {\n    \"tag\": "chromatophore",\n    \"popularity\": 16090\n  },\n  {\n    \"tag\": "reregistration",\n    \"popularity\": 16065\n  },\n  {\n    \"tag\": "alienor",\n    \"popularity\": 16040\n  },\n  {\n    \"tag\": "Hexagynia",\n    \"popularity\": 16016\n  },\n  {\n    \"tag\": "cerebrotonia",\n    \"popularity\": 15991\n  },\n  {\n    \"tag\": "deedbox",\n    \"popularity\": 15967\n  },\n  {\n    \"tag\": "staab",\n    \"popularity\": 15943\n  },\n  {\n    \"tag\": "uratemia",\n    \"popularity\": 15918\n  },\n  {\n    \"tag\": "flaunt",\n    \"popularity\": 15894\n  },\n  {\n    \"tag\": "bogy",\n    \"popularity\": 15870\n  },\n  {\n    \"tag\": "subcartilaginous",\n    \"popularity\": 15846\n  },\n  {\n    \"tag\": "protonephridial",\n    \"popularity\": 15822\n  },\n  {\n    \"tag\": "Boswellia",\n    \"popularity\": 15798\n  },\n  {\n    \"tag\": "relaxant untiaraed protoepiphyte",\n    \"popularity\": 15774\n  },\n  {\n    \"tag\": "nesslerization",\n    \"popularity\": 15750\n  },\n  {\n    \"tag\": "precession",\n    \"popularity\": 15726\n  },\n  {\n    \"tag\": "peat",\n    \"popularity\": 15702\n  },\n  {\n    \"tag\": "unbit",\n    \"popularity\": 15678\n  },\n  {\n    \"tag\": "snailish",\n    \"popularity\": 15655\n  },\n  {\n    \"tag\": "porismatical",\n    \"popularity\": 15631\n  },\n  {\n    \"tag\": "hooflike",\n    \"popularity\": 15608\n  },\n  {\n    \"tag\": "resuppose phene cranic",\n    \"popularity\": 15584\n  },\n  {\n    \"tag\": "peptonization kipskin",\n    \"popularity\": 15561\n  },\n  {\n    \"tag\": "birdstone",\n    \"popularity\": 15537\n  },\n  {\n    \"tag\": "empty inferoanterior",\n    \"popularity\": 15514\n  },\n  {\n    \"tag\": "androtauric",\n    \"popularity\": 15491\n  },\n  {\n    \"tag\": "triamide",\n    \"popularity\": 15467\n  },\n  {\n    \"tag\": "showmanry",\n    \"popularity\": 15444\n  },\n  {\n    \"tag\": "doing",\n    \"popularity\": 15421\n  },\n  {\n    \"tag\": "bouchaleen",\n    \"popularity\": 15398\n  },\n  {\n    \"tag\": "precollude",\n    \"popularity\": 15375\n  },\n  {\n    \"tag\": "finger",\n    \"popularity\": 15352\n  },\n  {\n    \"tag\": "limnetic intermessenger",\n    \"popularity\": 15329\n  },\n  {\n    \"tag\": "uncharitable picrotoxic",\n    \"popularity\": 15306\n  },\n  {\n    \"tag\": "nationalizer Phasmidae",\n    \"popularity\": 15283\n  },\n  {\n    \"tag\": "laughingstock",\n    \"popularity\": 15261\n  },\n  {\n    \"tag\": "nondeferential",\n    \"popularity\": 15238\n  },\n  {\n    \"tag\": "uproariously",\n    \"popularity\": 15215\n  },\n  {\n    \"tag\": "manzanilla",\n    \"popularity\": 15193\n  },\n  {\n    \"tag\": "khahoon",\n    \"popularity\": 15170\n  },\n  {\n    \"tag\": "olericulturally longshanks",\n    \"popularity\": 15148\n  },\n  {\n    \"tag\": "enthusiastically methionic",\n    \"popularity\": 15125\n  },\n  {\n    \"tag\": "pobs",\n    \"popularity\": 15103\n  },\n  {\n    \"tag\": "tricarpellate",\n    \"popularity\": 15081\n  },\n  {\n    \"tag\": "souterrain",\n    \"popularity\": 15058\n  },\n  {\n    \"tag\": "tethelin",\n    \"popularity\": 15036\n  },\n  {\n    \"tag\": "tartle",\n    \"popularity\": 15014\n  },\n  {\n    \"tag\": "tidelike",\n    \"popularity\": 14992\n  },\n  {\n    \"tag\": "cosmoramic",\n    \"popularity\": 14970\n  },\n  {\n    \"tag\": "pretardiness",\n    \"popularity\": 14948\n  },\n  {\n    \"tag\": "insoul",\n    \"popularity\": 14926\n  },\n  {\n    \"tag\": "anthroxan",\n    \"popularity\": 14904\n  },\n  {\n    \"tag\": "jilter",\n    \"popularity\": 14882\n  },\n  {\n    \"tag\": "pectinibranchian trematode",\n    \"popularity\": 14860\n  },\n  {\n    \"tag\": "Renaissancist",\n    \"popularity\": 14838\n  },\n  {\n    \"tag\": "imaginant",\n    \"popularity\": 14817\n  },\n  {\n    \"tag\": "supercensure",\n    \"popularity\": 14795\n  },\n  {\n    \"tag\": "festilogy",\n    \"popularity\": 14773\n  },\n  {\n    \"tag\": "regression",\n    \"popularity\": 14752\n  },\n  {\n    \"tag\": "mesobregmate languorously",\n    \"popularity\": 14730\n  },\n  {\n    \"tag\": "unsupernaturalized",\n    \"popularity\": 14709\n  },\n  {\n    \"tag\": "boobyish",\n    \"popularity\": 14687\n  },\n  {\n    \"tag\": "scopolamine",\n    \"popularity\": 14666\n  },\n  {\n    \"tag\": "reamputation unchristianly",\n    \"popularity\": 14645\n  },\n  {\n    \"tag\": "cuneatic",\n    \"popularity\": 14623\n  },\n  {\n    \"tag\": "heathberry",\n    \"popularity\": 14602\n  },\n  {\n    \"tag\": "hate",\n    \"popularity\": 14581\n  },\n  {\n    \"tag\": "redeemableness",\n    \"popularity\": 14560\n  },\n  {\n    \"tag\": "damasse",\n    \"popularity\": 14539\n  },\n  {\n    \"tag\": "thrillsome",\n    \"popularity\": 14518\n  },\n  {\n    \"tag\": "disseverment",\n    \"popularity\": 14497\n  },\n  {\n    \"tag\": "underbishopric Ostyak",\n    \"popularity\": 14476\n  },\n  {\n    \"tag\": "Exoascales",\n    \"popularity\": 14455\n  },\n  {\n    \"tag\": "soiled",\n    \"popularity\": 14434\n  },\n  {\n    \"tag\": "Cain",\n    \"popularity\": 14413\n  },\n  {\n    \"tag\": "mismanageable arenae",\n    \"popularity\": 14392\n  },\n  {\n    \"tag\": "manducate unhinderably",\n    \"popularity\": 14372\n  },\n  {\n    \"tag\": "peregrin",\n    \"popularity\": 14351\n  },\n  {\n    \"tag\": "musicianly",\n    \"popularity\": 14330\n  },\n  {\n    \"tag\": "aln",\n    \"popularity\": 14310\n  },\n  {\n    \"tag\": "intercentrum",\n    \"popularity\": 14289\n  },\n  {\n    \"tag\": "roothold",\n    \"popularity\": 14269\n  },\n  {\n    \"tag\": "jane aneurism",\n    \"popularity\": 14248\n  },\n  {\n    \"tag\": "insinuatively forefeel phytolatrous",\n    \"popularity\": 14228\n  },\n  {\n    \"tag\": "kanchil",\n    \"popularity\": 14208\n  },\n  {\n    \"tag\": "Austrophile",\n    \"popularity\": 14187\n  },\n  {\n    \"tag\": "unterrorized",\n    \"popularity\": 14167\n  },\n  {\n    \"tag\": "admeasure",\n    \"popularity\": 14147\n  },\n  {\n    \"tag\": "electrodissolution",\n    \"popularity\": 14127\n  },\n  {\n    \"tag\": "unweddedly",\n    \"popularity\": 14107\n  },\n  {\n    \"tag\": "unannoying",\n    \"popularity\": 14087\n  },\n  {\n    \"tag\": "uningenuous",\n    \"popularity\": 14067\n  },\n  {\n    \"tag\": "omnibenevolent",\n    \"popularity\": 14047\n  },\n  {\n    \"tag\": "commissure",\n    \"popularity\": 14027\n  },\n  {\n    \"tag\": "tellureted",\n    \"popularity\": 14007\n  },\n  {\n    \"tag\": "suffragan",\n    \"popularity\": 13987\n  },\n  {\n    \"tag\": "sphaeriaceous",\n    \"popularity\": 13967\n  },\n  {\n    \"tag\": "unfearing",\n    \"popularity\": 13947\n  },\n  {\n    \"tag\": "stentoriousness precounsellor",\n    \"popularity\": 13928\n  },\n  {\n    \"tag\": "haemaspectroscope",\n    \"popularity\": 13908\n  },\n  {\n    \"tag\": "teras",\n    \"popularity\": 13888\n  },\n  {\n    \"tag\": "pulicine",\n    \"popularity\": 13869\n  },\n  {\n    \"tag\": "colicystopyelitis",\n    \"popularity\": 13849\n  },\n  {\n    \"tag\": "Physalia",\n    \"popularity\": 13830\n  },\n  {\n    \"tag\": "Saxicolidae",\n    \"popularity\": 13810\n  },\n  {\n    \"tag\": "peritonital",\n    \"popularity\": 13791\n  },\n  {\n    \"tag\": "dysphotic",\n    \"popularity\": 13771\n  },\n  {\n    \"tag\": "unabandoned",\n    \"popularity\": 13752\n  },\n  {\n    \"tag\": "rashful",\n    \"popularity\": 13733\n  },\n  {\n    \"tag\": "goodyness Manobo",\n    \"popularity\": 13714\n  },\n  {\n    \"tag\": "glaring",\n    \"popularity\": 13694\n  },\n  {\n    \"tag\": "horrorful",\n    \"popularity\": 13675\n  },\n  {\n    \"tag\": "intercepting",\n    \"popularity\": 13656\n  },\n  {\n    \"tag\": "semifine",\n    \"popularity\": 13637\n  },\n  {\n    \"tag\": "Gaypoo",\n    \"popularity\": 13618\n  },\n  {\n    \"tag\": "Metrosideros",\n    \"popularity\": 13599\n  },\n  {\n    \"tag\": "thoracicolumbar",\n    \"popularity\": 13580\n  },\n  {\n    \"tag\": "unserried",\n    \"popularity\": 13561\n  },\n  {\n    \"tag\": "keeperess cauterization",\n    \"popularity\": 13542\n  },\n  {\n    \"tag\": "administrant",\n    \"popularity\": 13523\n  },\n  {\n    \"tag\": "unpropitiatedness",\n    \"popularity\": 13505\n  },\n  {\n    \"tag\": "pensileness",\n    \"popularity\": 13486\n  },\n  {\n    \"tag\": "quinaldic unreceivable",\n    \"popularity\": 13467\n  },\n  {\n    \"tag\": "Carnaria",\n    \"popularity\": 13448\n  },\n  {\n    \"tag\": "azothionium wurrus",\n    \"popularity\": 13430\n  },\n  {\n    \"tag\": "mistresshood",\n    \"popularity\": 13411\n  },\n  {\n    \"tag\": "Savara",\n    \"popularity\": 13393\n  },\n  {\n    \"tag\": "dasyurine",\n    \"popularity\": 13374\n  },\n  {\n    \"tag\": "superideal",\n    \"popularity\": 13356\n  },\n  {\n    \"tag\": "Parisianize",\n    \"popularity\": 13337\n  },\n  {\n    \"tag\": "underearth",\n    \"popularity\": 13319\n  },\n  {\n    \"tag\": "athrogenic",\n    \"popularity\": 13301\n  },\n  {\n    \"tag\": "communicate",\n    \"popularity\": 13282\n  },\n  {\n    \"tag\": "denervation enworthed",\n    \"popularity\": 13264\n  },\n  {\n    \"tag\": "subbromide",\n    \"popularity\": 13246\n  },\n  {\n    \"tag\": "stenocoriasis",\n    \"popularity\": 13228\n  },\n  {\n    \"tag\": "facetiousness",\n    \"popularity\": 13209\n  },\n  {\n    \"tag\": "twaddling",\n    \"popularity\": 13191\n  },\n  {\n    \"tag\": "tetartoconid",\n    \"popularity\": 13173\n  },\n  {\n    \"tag\": "audiophile",\n    \"popularity\": 13155\n  },\n  {\n    \"tag\": "fustigate",\n    \"popularity\": 13137\n  },\n  {\n    \"tag\": "Sorbian cacophonia",\n    \"popularity\": 13119\n  },\n  {\n    \"tag\": "fondish",\n    \"popularity\": 13101\n  },\n  {\n    \"tag\": "endomastoiditis",\n    \"popularity\": 13084\n  },\n  {\n    \"tag\": "sniptious",\n    \"popularity\": 13066\n  },\n  {\n    \"tag\": "glochidiate",\n    \"popularity\": 13048\n  },\n  {\n    \"tag\": "polycarboxylic",\n    \"popularity\": 13030\n  },\n  {\n    \"tag\": "stamp",\n    \"popularity\": 13012\n  },\n  {\n    \"tag\": "tritonymph endotoxoid",\n    \"popularity\": 12995\n  },\n  {\n    \"tag\": "wolfskin",\n    \"popularity\": 12977\n  },\n  {\n    \"tag\": "oncosimeter",\n    \"popularity\": 12959\n  },\n  {\n    \"tag\": "outward",\n    \"popularity\": 12942\n  },\n  {\n    \"tag\": "circumscribed",\n    \"popularity\": 12924\n  },\n  {\n    \"tag\": "autohemolytic",\n    \"popularity\": 12907\n  },\n  {\n    \"tag\": "isorhamnose",\n    \"popularity\": 12889\n  },\n  {\n    \"tag\": "monarchomachic",\n    \"popularity\": 12872\n  },\n  {\n    \"tag\": "phaenomenon",\n    \"popularity\": 12855\n  },\n  {\n    \"tag\": "angiopressure",\n    \"popularity\": 12837\n  },\n  {\n    \"tag\": "similarize",\n    \"popularity\": 12820\n  },\n  {\n    \"tag\": "unseeable",\n    \"popularity\": 12803\n  },\n  {\n    \"tag\": "Toryize",\n    \"popularity\": 12785\n  },\n  {\n    \"tag\": "fruitling",\n    \"popularity\": 12768\n  },\n  {\n    \"tag\": "axle",\n    \"popularity\": 12751\n  },\n  {\n    \"tag\": "priestal cocked",\n    \"popularity\": 12734\n  },\n  {\n    \"tag\": "serotoxin",\n    \"popularity\": 12717\n  },\n  {\n    \"tag\": "unmovably",\n    \"popularity\": 12700\n  },\n  {\n    \"tag\": "darbha",\n    \"popularity\": 12683\n  },\n  {\n    \"tag\": "Mongolize",\n    \"popularity\": 12666\n  },\n  {\n    \"tag\": "clusteringly",\n    \"popularity\": 12649\n  },\n  {\n    \"tag\": "tendence",\n    \"popularity\": 12632\n  },\n  {\n    \"tag\": "foziness",\n    \"popularity\": 12615\n  },\n  {\n    \"tag\": "brickkiln lithify",\n    \"popularity\": 12598\n  },\n  {\n    \"tag\": "unpriest",\n    \"popularity\": 12581\n  },\n  {\n    \"tag\": "convincer",\n    \"popularity\": 12564\n  },\n  {\n    \"tag\": "mornlike",\n    \"popularity\": 12548\n  },\n  {\n    \"tag\": "overaddiction ostentatiousness",\n    \"popularity\": 12531\n  },\n  {\n    \"tag\": "diffusively moccasin pendom",\n    \"popularity\": 12514\n  },\n  {\n    \"tag\": "boose",\n    \"popularity\": 12498\n  },\n  {\n    \"tag\": "myonosus",\n    \"popularity\": 12481\n  },\n  {\n    \"tag\": "handsome",\n    \"popularity\": 12464\n  },\n  {\n    \"tag\": "paroxysmic",\n    \"popularity\": 12448\n  },\n  {\n    \"tag\": "Ulidian",\n    \"popularity\": 12431\n  },\n  {\n    \"tag\": "heartache",\n    \"popularity\": 12415\n  },\n  {\n    \"tag\": "torporize",\n    \"popularity\": 12398\n  },\n  {\n    \"tag\": "hippish",\n    \"popularity\": 12382\n  },\n  {\n    \"tag\": "stigmal militation",\n    \"popularity\": 12366\n  },\n  {\n    \"tag\": "matmaker",\n    \"popularity\": 12349\n  },\n  {\n    \"tag\": "marantaceous bivoluminous",\n    \"popularity\": 12333\n  },\n  {\n    \"tag\": "Uraniidae",\n    \"popularity\": 12317\n  },\n  {\n    \"tag\": "risper",\n    \"popularity\": 12301\n  },\n  {\n    \"tag\": "tintinnabulation",\n    \"popularity\": 12284\n  },\n  {\n    \"tag\": "tributorian",\n    \"popularity\": 12268\n  },\n  {\n    \"tag\": "ashamedly",\n    \"popularity\": 12252\n  },\n  {\n    \"tag\": "Macrourus",\n    \"popularity\": 12236\n  },\n  {\n    \"tag\": "Chora",\n    \"popularity\": 12220\n  },\n  {\n    \"tag\": "caul",\n    \"popularity\": 12204\n  },\n  {\n    \"tag\": "exsector",\n    \"popularity\": 12188\n  },\n  {\n    \"tag\": "acutish",\n    \"popularity\": 12172\n  },\n  {\n    \"tag\": "amphichrome",\n    \"popularity\": 12156\n  },\n  {\n    \"tag\": "guarder",\n    \"popularity\": 12140\n  },\n  {\n    \"tag\": "sculpturally",\n    \"popularity\": 12124\n  },\n  {\n    \"tag\": "benightmare",\n    \"popularity\": 12108\n  },\n  {\n    \"tag\": "chucky",\n    \"popularity\": 12093\n  },\n  {\n    \"tag\": "Venetian",\n    \"popularity\": 12077\n  },\n  {\n    \"tag\": "autotheater",\n    \"popularity\": 12061\n  },\n  {\n    \"tag\": "planarioid",\n    \"popularity\": 12045\n  },\n  {\n    \"tag\": "handkerchiefful",\n    \"popularity\": 12030\n  },\n  {\n    \"tag\": "fuliginousness potentize",\n    \"popularity\": 12014\n  },\n  {\n    \"tag\": "pantheum",\n    \"popularity\": 11998\n  },\n  {\n    \"tag\": "heavyweight",\n    \"popularity\": 11983\n  },\n  {\n    \"tag\": "unbrick",\n    \"popularity\": 11967\n  },\n  {\n    \"tag\": "duomachy",\n    \"popularity\": 11952\n  },\n  {\n    \"tag\": "polyphyodont",\n    \"popularity\": 11936\n  },\n  {\n    \"tag\": "hibernacle",\n    \"popularity\": 11921\n  },\n  {\n    \"tag\": "undistend",\n    \"popularity\": 11905\n  },\n  {\n    \"tag\": "hystericky",\n    \"popularity\": 11890\n  },\n  {\n    \"tag\": "paleolimnology",\n    \"popularity\": 11875\n  },\n  {\n    \"tag\": "cedarware",\n    \"popularity\": 11859\n  },\n  {\n    \"tag\": "overwrested",\n    \"popularity\": 11844\n  },\n  {\n    \"tag\": "Syriacism",\n    \"popularity\": 11829\n  },\n  {\n    \"tag\": "pretan",\n    \"popularity\": 11813\n  },\n  {\n    \"tag\": "formant",\n    \"popularity\": 11798\n  },\n  {\n    \"tag\": "pharmacopoeist Fedia",\n    \"popularity\": 11783\n  },\n  {\n    \"tag\": "exorcist eerisome",\n    \"popularity\": 11768\n  },\n  {\n    \"tag\": "separation",\n    \"popularity\": 11753\n  },\n  {\n    \"tag\": "infancy",\n    \"popularity\": 11738\n  },\n  {\n    \"tag\": "ecrasite",\n    \"popularity\": 11723\n  },\n  {\n    \"tag\": "propolize",\n    \"popularity\": 11708\n  },\n  {\n    \"tag\": "uncram phyllin",\n    \"popularity\": 11693\n  },\n  {\n    \"tag\": "thymopathy",\n    \"popularity\": 11678\n  },\n  {\n    \"tag\": "omniscient",\n    \"popularity\": 11663\n  },\n  {\n    \"tag\": "coussinet hazer",\n    \"popularity\": 11648\n  },\n  {\n    \"tag\": "contributiveness",\n    \"popularity\": 11633\n  },\n  {\n    \"tag\": "septifluous",\n    \"popularity\": 11618\n  },\n  {\n    \"tag\": "halfness",\n    \"popularity\": 11603\n  },\n  {\n    \"tag\": "tocher",\n    \"popularity\": 11589\n  },\n  {\n    \"tag\": "monotonist",\n    \"popularity\": 11574\n  },\n  {\n    \"tag\": "headchair",\n    \"popularity\": 11559\n  },\n  {\n    \"tag\": "everywhence",\n    \"popularity\": 11544\n  },\n  {\n    \"tag\": "gerate",\n    \"popularity\": 11530\n  },\n  {\n    \"tag\": "unrepellent",\n    \"popularity\": 11515\n  },\n  {\n    \"tag\": "inidoneous",\n    \"popularity\": 11500\n  },\n  {\n    \"tag\": "Rifi",\n    \"popularity\": 11486\n  },\n  {\n    \"tag\": "unstop",\n    \"popularity\": 11471\n  },\n  {\n    \"tag\": "conformer",\n    \"popularity\": 11457\n  },\n  {\n    \"tag\": "vivisectionally",\n    \"popularity\": 11442\n  },\n  {\n    \"tag\": "nonfinishing",\n    \"popularity\": 11428\n  },\n  {\n    \"tag\": "tyranness",\n    \"popularity\": 11413\n  },\n  {\n    \"tag\": "shepherdage havoc",\n    \"popularity\": 11399\n  },\n  {\n    \"tag\": "coronale",\n    \"popularity\": 11385\n  },\n  {\n    \"tag\": "airmarker",\n    \"popularity\": 11370\n  },\n  {\n    \"tag\": "subpanel",\n    \"popularity\": 11356\n  },\n  {\n    \"tag\": "conciliation",\n    \"popularity\": 11342\n  },\n  {\n    \"tag\": "supergun",\n    \"popularity\": 11327\n  },\n  {\n    \"tag\": "photoheliography",\n    \"popularity\": 11313\n  },\n  {\n    \"tag\": "cacosmia",\n    \"popularity\": 11299\n  },\n  {\n    \"tag\": "caressant",\n    \"popularity\": 11285\n  },\n  {\n    \"tag\": "swivet",\n    \"popularity\": 11270\n  },\n  {\n    \"tag\": "coddler",\n    \"popularity\": 11256\n  },\n  {\n    \"tag\": "rakehellish",\n    \"popularity\": 11242\n  },\n  {\n    \"tag\": "recohabitation",\n    \"popularity\": 11228\n  },\n  {\n    \"tag\": "postillator",\n    \"popularity\": 11214\n  },\n  {\n    \"tag\": "receipt",\n    \"popularity\": 11200\n  },\n  {\n    \"tag\": "nonconformistical",\n    \"popularity\": 11186\n  },\n  {\n    \"tag\": "unglorified",\n    \"popularity\": 11172\n  },\n  {\n    \"tag\": "unordinariness",\n    \"popularity\": 11158\n  },\n  {\n    \"tag\": "tetrahydroxy",\n    \"popularity\": 11144\n  },\n  {\n    \"tag\": "haploperistomic corporeity",\n    \"popularity\": 11130\n  },\n  {\n    \"tag\": "varical",\n    \"popularity\": 11117\n  },\n  {\n    \"tag\": "pilferment",\n    \"popularity\": 11103\n  },\n  {\n    \"tag\": "reverentially playcraft",\n    \"popularity\": 11089\n  },\n  {\n    \"tag\": "unretentive",\n    \"popularity\": 11075\n  },\n  {\n    \"tag\": "readiness",\n    \"popularity\": 11061\n  },\n  {\n    \"tag\": "thermomagnetism",\n    \"popularity\": 11048\n  },\n  {\n    \"tag\": "spotless",\n    \"popularity\": 11034\n  },\n  {\n    \"tag\": "semishrubby",\n    \"popularity\": 11020\n  },\n  {\n    \"tag\": "metrotomy",\n    \"popularity\": 11007\n  },\n  {\n    \"tag\": "hocker",\n    \"popularity\": 10993\n  },\n  {\n    \"tag\": "anecdotal",\n    \"popularity\": 10979\n  },\n  {\n    \"tag\": "tetrabelodont",\n    \"popularity\": 10966\n  },\n  {\n    \"tag\": "Ramillied",\n    \"popularity\": 10952\n  },\n  {\n    \"tag\": "sympatheticism",\n    \"popularity\": 10939\n  },\n  {\n    \"tag\": "kiskatom",\n    \"popularity\": 10925\n  },\n  {\n    \"tag\": "concyclically",\n    \"popularity\": 10912\n  },\n  {\n    \"tag\": "tunicless",\n    \"popularity\": 10899\n  },\n  {\n    \"tag\": "formalistic",\n    \"popularity\": 10885\n  },\n  {\n    \"tag\": "thermacogenesis",\n    \"popularity\": 10872\n  },\n  {\n    \"tag\": "multimotored",\n    \"popularity\": 10858\n  },\n  {\n    \"tag\": "inversive",\n    \"popularity\": 10845\n  },\n  {\n    \"tag\": "Jatki",\n    \"popularity\": 10832\n  },\n  {\n    \"tag\": "highest",\n    \"popularity\": 10818\n  },\n  {\n    \"tag\": "rubidic",\n    \"popularity\": 10805\n  },\n  {\n    \"tag\": "acranial",\n    \"popularity\": 10792\n  },\n  {\n    \"tag\": "pulvinulus",\n    \"popularity\": 10779\n  },\n  {\n    \"tag\": "nattiness",\n    \"popularity\": 10766\n  },\n  {\n    \"tag\": "antisimoniacal",\n    \"popularity\": 10752\n  },\n  {\n    \"tag\": "tetanize",\n    \"popularity\": 10739\n  },\n  {\n    \"tag\": "spectrophobia",\n    \"popularity\": 10726\n  },\n  {\n    \"tag\": "monopolitical",\n    \"popularity\": 10713\n  },\n  {\n    \"tag\": "teallite",\n    \"popularity\": 10700\n  },\n  {\n    \"tag\": "alicyclic interpellator",\n    \"popularity\": 10687\n  },\n  {\n    \"tag\": "nonsynthesized",\n    \"popularity\": 10674\n  },\n  {\n    \"tag\": "wheelwrighting",\n    \"popularity\": 10661\n  },\n  {\n    \"tag\": "pelliculate",\n    \"popularity\": 10648\n  },\n  {\n    \"tag\": "Euphyllopoda",\n    \"popularity\": 10635\n  },\n  {\n    \"tag\": "graver",\n    \"popularity\": 10622\n  },\n  {\n    \"tag\": "automorph",\n    \"popularity\": 10609\n  },\n  {\n    \"tag\": "underhanded",\n    \"popularity\": 10597\n  },\n  {\n    \"tag\": "causal",\n    \"popularity\": 10584\n  },\n  {\n    \"tag\": "odoom",\n    \"popularity\": 10571\n  },\n  {\n    \"tag\": "apodictical",\n    \"popularity\": 10558\n  },\n  {\n    \"tag\": "foundery",\n    \"popularity\": 10545\n  },\n  {\n    \"tag\": "unneighbored",\n    \"popularity\": 10533\n  },\n  {\n    \"tag\": "woolshearing",\n    \"popularity\": 10520\n  },\n  {\n    \"tag\": "boschveld",\n    \"popularity\": 10507\n  },\n  {\n    \"tag\": "unhardened lipopod",\n    \"popularity\": 10495\n  },\n  {\n    \"tag\": "unenriching",\n    \"popularity\": 10482\n  },\n  {\n    \"tag\": "spak",\n    \"popularity\": 10469\n  },\n  {\n    \"tag\": "yogasana",\n    \"popularity\": 10457\n  },\n  {\n    \"tag\": "depoetize",\n    \"popularity\": 10444\n  },\n  {\n    \"tag\": "parousiamania",\n    \"popularity\": 10432\n  },\n  {\n    \"tag\": "longlegs",\n    \"popularity\": 10419\n  },\n  {\n    \"tag\": "gelatinizability",\n    \"popularity\": 10407\n  },\n  {\n    \"tag\": "edeology",\n    \"popularity\": 10394\n  },\n  {\n    \"tag\": "sodwork",\n    \"popularity\": 10382\n  },\n  {\n    \"tag\": "somnambule",\n    \"popularity\": 10369\n  },\n  {\n    \"tag\": "antiquing",\n    \"popularity\": 10357\n  },\n  {\n    \"tag\": "intaker",\n    \"popularity\": 10344\n  },\n  {\n    \"tag\": "Gerberia",\n    \"popularity\": 10332\n  },\n  {\n    \"tag\": "preadmit",\n    \"popularity\": 10320\n  },\n  {\n    \"tag\": "bullhorn",\n    \"popularity\": 10307\n  },\n  {\n    \"tag\": "sororal",\n    \"popularity\": 10295\n  },\n  {\n    \"tag\": "phaeophyceous",\n    \"popularity\": 10283\n  },\n  {\n    \"tag\": "omphalopsychite",\n    \"popularity\": 10271\n  },\n  {\n    \"tag\": "substantious",\n    \"popularity\": 10258\n  },\n  {\n    \"tag\": "undemonstratively",\n    \"popularity\": 10246\n  },\n  {\n    \"tag\": "corallike blackit",\n    \"popularity\": 10234\n  },\n  {\n    \"tag\": "amoebous",\n    \"popularity\": 10222\n  },\n  {\n    \"tag\": "Polypodium",\n    \"popularity\": 10210\n  },\n  {\n    \"tag\": "blodite",\n    \"popularity\": 10198\n  },\n  {\n    \"tag\": "hordarian",\n    \"popularity\": 10186\n  },\n  {\n    \"tag\": "nonmoral",\n    \"popularity\": 10174\n  },\n  {\n    \"tag\": "dredgeful",\n    \"popularity\": 10162\n  },\n  {\n    \"tag\": "nourishingly",\n    \"popularity\": 10150\n  },\n  {\n    \"tag\": "seamy",\n    \"popularity\": 10138\n  },\n  {\n    \"tag\": "vara",\n    \"popularity\": 10126\n  },\n  {\n    \"tag\": "incorruptibleness",\n    \"popularity\": 10114\n  },\n  {\n    \"tag\": "manipulator",\n    \"popularity\": 10102\n  },\n  {\n    \"tag\": "chromodiascope uncountably",\n    \"popularity\": 10090\n  },\n  {\n    \"tag\": "typhemia",\n    \"popularity\": 10078\n  },\n  {\n    \"tag\": "Smalcaldic",\n    \"popularity\": 10066\n  },\n  {\n    \"tag\": "precontrive",\n    \"popularity\": 10054\n  },\n  {\n    \"tag\": "sowarry",\n    \"popularity\": 10042\n  },\n  {\n    \"tag\": "monopodic",\n    \"popularity\": 10031\n  },\n  {\n    \"tag\": "recodify",\n    \"popularity\": 10019\n  },\n  {\n    \"tag\": "phosphowolframic rimple",\n    \"popularity\": 10007\n  },\n  {\n    \"tag\": "triconch",\n    \"popularity\": 9995\n  },\n  {\n    \"tag\": "pycnodontoid",\n    \"popularity\": 9984\n  },\n  {\n    \"tag\": "bradyspermatism",\n    \"popularity\": 9972\n  },\n  {\n    \"tag\": "extensionist",\n    \"popularity\": 9960\n  },\n  {\n    \"tag\": "characterize",\n    \"popularity\": 9949\n  },\n  {\n    \"tag\": "anatreptic proteolytic",\n    \"popularity\": 9937\n  },\n  {\n    \"tag\": "waterboard",\n    \"popularity\": 9925\n  },\n  {\n    \"tag\": "allopathically",\n    \"popularity\": 9914\n  },\n  {\n    \"tag\": "arithmetician",\n    \"popularity\": 9902\n  },\n  {\n    \"tag\": "subsist",\n    \"popularity\": 9891\n  },\n  {\n    \"tag\": "Islamitish",\n    \"popularity\": 9879\n  },\n  {\n    \"tag\": "biddy",\n    \"popularity\": 9868\n  },\n  {\n    \"tag\": "reverberation",\n    \"popularity\": 9856\n  },\n  {\n    \"tag\": "Zaporogue",\n    \"popularity\": 9845\n  },\n  {\n    \"tag\": "soapberry",\n    \"popularity\": 9833\n  },\n  {\n    \"tag\": "physiognomics",\n    \"popularity\": 9822\n  },\n  {\n    \"tag\": "hospitalization",\n    \"popularity\": 9810\n  },\n  {\n    \"tag\": "dissembler",\n    \"popularity\": 9799\n  },\n  {\n    \"tag\": "festinate",\n    \"popularity\": 9788\n  },\n  {\n    \"tag\": "angiectopia",\n    \"popularity\": 9776\n  },\n  {\n    \"tag\": "Pulicidae",\n    \"popularity\": 9765\n  },\n  {\n    \"tag\": "beslimer",\n    \"popularity\": 9754\n  },\n  {\n    \"tag\": "nontreaty",\n    \"popularity\": 9743\n  },\n  {\n    \"tag\": "unhaggled",\n    \"popularity\": 9731\n  },\n  {\n    \"tag\": "catfall",\n    \"popularity\": 9720\n  },\n  {\n    \"tag\": "stola",\n    \"popularity\": 9709\n  },\n  {\n    \"tag\": "pataco",\n    \"popularity\": 9698\n  },\n  {\n    \"tag\": "ontologistic",\n    \"popularity\": 9686\n  },\n  {\n    \"tag\": "aerosphere",\n    \"popularity\": 9675\n  },\n  {\n    \"tag\": "deobstruent",\n    \"popularity\": 9664\n  },\n  {\n    \"tag\": "threepence",\n    \"popularity\": 9653\n  },\n  {\n    \"tag\": "cyprinoid",\n    \"popularity\": 9642\n  },\n  {\n    \"tag\": "overbank",\n    \"popularity\": 9631\n  },\n  {\n    \"tag\": "prostyle",\n    \"popularity\": 9620\n  },\n  {\n    \"tag\": "photoactivation",\n    \"popularity\": 9609\n  },\n  {\n    \"tag\": "homothetic",\n    \"popularity\": 9598\n  },\n  {\n    \"tag\": "roguedom",\n    \"popularity\": 9587\n  },\n  {\n    \"tag\": "underschool",\n    \"popularity\": 9576\n  },\n  {\n    \"tag\": "tractility",\n    \"popularity\": 9565\n  },\n  {\n    \"tag\": "gardenin",\n    \"popularity\": 9554\n  },\n  {\n    \"tag\": "Micromastictora",\n    \"popularity\": 9543\n  },\n  {\n    \"tag\": "gossypine",\n    \"popularity\": 9532\n  },\n  {\n    \"tag\": "amylodyspepsia",\n    \"popularity\": 9521\n  },\n  {\n    \"tag\": "Luciana",\n    \"popularity\": 9510\n  },\n  {\n    \"tag\": "meetly nonfisherman",\n    \"popularity\": 9500\n  },\n  {\n    \"tag\": "backhanded",\n    \"popularity\": 9489\n  },\n  {\n    \"tag\": "decrustation",\n    \"popularity\": 9478\n  },\n  {\n    \"tag\": "pinrail",\n    \"popularity\": 9467\n  },\n  {\n    \"tag\": "Mahori",\n    \"popularity\": 9456\n  },\n  {\n    \"tag\": "unsizable",\n    \"popularity\": 9446\n  },\n  {\n    \"tag\": "disawa",\n    \"popularity\": 9435\n  },\n  {\n    \"tag\": "launderability inconsidered",\n    \"popularity\": 9424\n  },\n  {\n    \"tag\": "unclassical",\n    \"popularity\": 9414\n  },\n  {\n    \"tag\": "inobtrusiveness",\n    \"popularity\": 9403\n  },\n  {\n    \"tag\": "sialogenous",\n    \"popularity\": 9392\n  },\n  {\n    \"tag\": "sulphonamide",\n    \"popularity\": 9382\n  },\n  {\n    \"tag\": "diluvion",\n    \"popularity\": 9371\n  },\n  {\n    \"tag\": "deuteranope",\n    \"popularity\": 9361\n  },\n  {\n    \"tag\": "addition",\n    \"popularity\": 9350\n  },\n  {\n    \"tag\": "bockeret",\n    \"popularity\": 9339\n  },\n  {\n    \"tag\": "unidentified",\n    \"popularity\": 9329\n  },\n  {\n    \"tag\": "caryatic",\n    \"popularity\": 9318\n  },\n  {\n    \"tag\": "misattribution",\n    \"popularity\": 9308\n  },\n  {\n    \"tag\": "outray",\n    \"popularity\": 9297\n  },\n  {\n    \"tag\": "areometrical",\n    \"popularity\": 9287\n  },\n  {\n    \"tag\": "antilogism",\n    \"popularity\": 9277\n  },\n  {\n    \"tag\": "inadjustable",\n    \"popularity\": 9266\n  },\n  {\n    \"tag\": "byssus",\n    \"popularity\": 9256\n  },\n  {\n    \"tag\": "trun",\n    \"popularity\": 9245\n  },\n  {\n    \"tag\": "thereology",\n    \"popularity\": 9235\n  },\n  {\n    \"tag\": "extort",\n    \"popularity\": 9225\n  },\n  {\n    \"tag\": "bumpkin",\n    \"popularity\": 9214\n  },\n  {\n    \"tag\": "sulphobenzide",\n    \"popularity\": 9204\n  },\n  {\n    \"tag\": "hydrogeology",\n    \"popularity\": 9194\n  },\n  {\n    \"tag\": "nidulariaceous",\n    \"popularity\": 9183\n  },\n  {\n    \"tag\": "propodiale",\n    \"popularity\": 9173\n  },\n  {\n    \"tag\": "fierily",\n    \"popularity\": 9163\n  },\n  {\n    \"tag\": "aerotonometry",\n    \"popularity\": 9153\n  },\n  {\n    \"tag\": "pelobatid oversuperstitious",\n    \"popularity\": 9142\n  },\n  {\n    \"tag\": "restringent",\n    \"popularity\": 9132\n  },\n  {\n    \"tag\": "tetrapodic",\n    \"popularity\": 9122\n  },\n  {\n    \"tag\": "heroicness Vendidad",\n    \"popularity\": 9112\n  },\n  {\n    \"tag\": "Sphingurus",\n    \"popularity\": 9102\n  },\n  {\n    \"tag\": "sclerote",\n    \"popularity\": 9092\n  },\n  {\n    \"tag\": "unkeyed",\n    \"popularity\": 9082\n  },\n  {\n    \"tag\": "superparliamentary",\n    \"popularity\": 9072\n  },\n  {\n    \"tag\": "hetericism",\n    \"popularity\": 9061\n  },\n  {\n    \"tag\": "hucklebone",\n    \"popularity\": 9051\n  },\n  {\n    \"tag\": "yojan",\n    \"popularity\": 9041\n  },\n  {\n    \"tag\": "bossed",\n    \"popularity\": 9031\n  },\n  {\n    \"tag\": "spiderwork",\n    \"popularity\": 9021\n  },\n  {\n    \"tag\": "millfeed dullery",\n    \"popularity\": 9011\n  },\n  {\n    \"tag\": "adnoun",\n    \"popularity\": 9001\n  },\n  {\n    \"tag\": "mesometric",\n    \"popularity\": 8992\n  },\n  {\n    \"tag\": "doublehandedness",\n    \"popularity\": 8982\n  },\n  {\n    \"tag\": "suppurant",\n    \"popularity\": 8972\n  },\n  {\n    \"tag\": "Berlinize",\n    \"popularity\": 8962\n  },\n  {\n    \"tag\": "sontag",\n    \"popularity\": 8952\n  },\n  {\n    \"tag\": "biplane",\n    \"popularity\": 8942\n  },\n  {\n    \"tag\": "insula",\n    \"popularity\": 8932\n  },\n  {\n    \"tag\": "unbrand",\n    \"popularity\": 8922\n  },\n  {\n    \"tag\": "Basilosaurus",\n    \"popularity\": 8913\n  },\n  {\n    \"tag\": "prenomination",\n    \"popularity\": 8903\n  },\n  {\n    \"tag\": "untextual",\n    \"popularity\": 8893\n  },\n  {\n    \"tag\": "coleslaw",\n    \"popularity\": 8883\n  },\n  {\n    \"tag\": "langsyne",\n    \"popularity\": 8874\n  },\n  {\n    \"tag\": "impede",\n    \"popularity\": 8864\n  },\n  {\n    \"tag\": "irrigator",\n    \"popularity\": 8854\n  },\n  {\n    \"tag\": "deflocculation",\n    \"popularity\": 8844\n  },\n  {\n    \"tag\": "narghile",\n    \"popularity\": 8835\n  },\n  {\n    \"tag\": "unguardedly ebenaceous",\n    \"popularity\": 8825\n  },\n  {\n    \"tag\": "conversantly subocular",\n    \"popularity\": 8815\n  },\n  {\n    \"tag\": "hydroponic",\n    \"popularity\": 8806\n  },\n  {\n    \"tag\": "anthropopsychism",\n    \"popularity\": 8796\n  },\n  {\n    \"tag\": "panoptic",\n    \"popularity\": 8787\n  },\n  {\n    \"tag\": "insufferable",\n    \"popularity\": 8777\n  },\n  {\n    \"tag\": "salema",\n    \"popularity\": 8768\n  },\n  {\n    \"tag\": "Myriapoda",\n    \"popularity\": 8758\n  },\n  {\n    \"tag\": "regarrison",\n    \"popularity\": 8748\n  },\n  {\n    \"tag\": "overlearned",\n    \"popularity\": 8739\n  },\n  {\n    \"tag\": "ultraroyalist conventical bureaucratical",\n    \"popularity\": 8729\n  },\n  {\n    \"tag\": "epicaridan",\n    \"popularity\": 8720\n  },\n  {\n    \"tag\": "poetastress",\n    \"popularity\": 8711\n  },\n  {\n    \"tag\": "monophthalmus",\n    \"popularity\": 8701\n  },\n  {\n    \"tag\": "simnel",\n    \"popularity\": 8692\n  },\n  {\n    \"tag\": "compotor",\n    \"popularity\": 8682\n  },\n  {\n    \"tag\": "hydrolase",\n    \"popularity\": 8673\n  },\n  {\n    \"tag\": "attemptless",\n    \"popularity\": 8663\n  },\n  {\n    \"tag\": "visceroptosis",\n    \"popularity\": 8654\n  },\n  {\n    \"tag\": "unpreparedly",\n    \"popularity\": 8645\n  },\n  {\n    \"tag\": "mastage",\n    \"popularity\": 8635\n  },\n  {\n    \"tag\": "preinfluence",\n    \"popularity\": 8626\n  },\n  {\n    \"tag\": "Siwan",\n    \"popularity\": 8617\n  },\n  {\n    \"tag\": "ceratotheca belvedere",\n    \"popularity\": 8607\n  },\n  {\n    \"tag\": "disenablement",\n    \"popularity\": 8598\n  },\n  {\n    \"tag\": "nine",\n    \"popularity\": 8589\n  },\n  {\n    \"tag\": "spellingdown abridgment",\n    \"popularity\": 8580\n  },\n  {\n    \"tag\": "twilightless",\n    \"popularity\": 8571\n  },\n  {\n    \"tag\": "overflow",\n    \"popularity\": 8561\n  },\n  {\n    \"tag\": "mismeasurement",\n    \"popularity\": 8552\n  },\n  {\n    \"tag\": "nawabship",\n    \"popularity\": 8543\n  },\n  {\n    \"tag\": "Phrynosoma",\n    \"popularity\": 8534\n  },\n  {\n    \"tag\": "unanticipatingly",\n    \"popularity\": 8525\n  },\n  {\n    \"tag\": "blankite",\n    \"popularity\": 8516\n  },\n  {\n    \"tag\": "role",\n    \"popularity\": 8506\n  },\n  {\n    \"tag\": "peperine edelweiss",\n    \"popularity\": 8497\n  },\n  {\n    \"tag\": "unhysterical",\n    \"popularity\": 8488\n  },\n  {\n    \"tag\": "attentiveness",\n    \"popularity\": 8479\n  },\n  {\n    \"tag\": "scintillant",\n    \"popularity\": 8470\n  },\n  {\n    \"tag\": "stenostomatous",\n    \"popularity\": 8461\n  },\n  {\n    \"tag\": "pectinite",\n    \"popularity\": 8452\n  },\n  {\n    \"tag\": "herring",\n    \"popularity\": 8443\n  },\n  {\n    \"tag\": "interroom",\n    \"popularity\": 8434\n  },\n  {\n    \"tag\": "laccol",\n    \"popularity\": 8425\n  },\n  {\n    \"tag\": "unpartably kylite",\n    \"popularity\": 8416\n  },\n  {\n    \"tag\": "spirivalve",\n    \"popularity\": 8407\n  },\n  {\n    \"tag\": "hoosegow",\n    \"popularity\": 8398\n  },\n  {\n    \"tag\": "doat",\n    \"popularity\": 8389\n  },\n  {\n    \"tag\": "amphibian",\n    \"popularity\": 8380\n  },\n  {\n    \"tag\": "exposit",\n    \"popularity\": 8371\n  },\n  {\n    \"tag\": "canopy",\n    \"popularity\": 8363\n  },\n  {\n    \"tag\": "houndlike",\n    \"popularity\": 8354\n  },\n  {\n    \"tag\": "spikebill",\n    \"popularity\": 8345\n  },\n  {\n    \"tag\": "wiseacre pyrotechnic",\n    \"popularity\": 8336\n  },\n  {\n    \"tag\": "confessingly woodman",\n    \"popularity\": 8327\n  },\n  {\n    \"tag\": "overside",\n    \"popularity\": 8318\n  },\n  {\n    \"tag\": "oftwhiles",\n    \"popularity\": 8310\n  },\n  {\n    \"tag\": "Musophagidae",\n    \"popularity\": 8301\n  },\n  {\n    \"tag\": "slumberer",\n    \"popularity\": 8292\n  },\n  {\n    \"tag\": "leiotrichy",\n    \"popularity\": 8283\n  },\n  {\n    \"tag\": "Mantispidae",\n    \"popularity\": 8275\n  },\n  {\n    \"tag\": "perceptually",\n    \"popularity\": 8266\n  },\n  {\n    \"tag\": "biller",\n    \"popularity\": 8257\n  },\n  {\n    \"tag\": "eudaemonical",\n    \"popularity\": 8249\n  },\n  {\n    \"tag\": "underfiend",\n    \"popularity\": 8240\n  },\n  {\n    \"tag\": "impartible",\n    \"popularity\": 8231\n  },\n  {\n    \"tag\": "saxicavous",\n    \"popularity\": 8223\n  },\n  {\n    \"tag\": "yapster",\n    \"popularity\": 8214\n  },\n  {\n    \"tag\": "aliseptal",\n    \"popularity\": 8205\n  },\n  {\n    \"tag\": "omniparient",\n    \"popularity\": 8197\n  },\n  {\n    \"tag\": "nishiki",\n    \"popularity\": 8188\n  },\n  {\n    \"tag\": "yuzluk",\n    \"popularity\": 8180\n  },\n  {\n    \"tag\": "solderer",\n    \"popularity\": 8171\n  },\n  {\n    \"tag\": "Pinna",\n    \"popularity\": 8162\n  },\n  {\n    \"tag\": "reinterfere",\n    \"popularity\": 8154\n  },\n  {\n    \"tag\": "superepic",\n    \"popularity\": 8145\n  },\n  {\n    \"tag\": "ronquil",\n    \"popularity\": 8137\n  },\n  {\n    \"tag\": "bratstvo",\n    \"popularity\": 8128\n  },\n  {\n    \"tag\": "Thea",\n    \"popularity\": 8120\n  },\n  {\n    \"tag\": "hermaphroditical",\n    \"popularity\": 8111\n  },\n  {\n    \"tag\": "enlief",\n    \"popularity\": 8103\n  },\n  {\n    \"tag\": "Jesuate",\n    \"popularity\": 8095\n  },\n  {\n    \"tag\": "gaysome",\n    \"popularity\": 8086\n  },\n  {\n    \"tag\": "iliohypogastric",\n    \"popularity\": 8078\n  },\n  {\n    \"tag\": "regardance",\n    \"popularity\": 8069\n  },\n  {\n    \"tag\": "cumulately",\n    \"popularity\": 8061\n  },\n  {\n    \"tag\": "haustorial nucleolocentrosome",\n    \"popularity\": 8053\n  },\n  {\n    \"tag\": "cosmocrat",\n    \"popularity\": 8044\n  },\n  {\n    \"tag\": "onyxitis",\n    \"popularity\": 8036\n  },\n  {\n    \"tag\": "Cabinda",\n    \"popularity\": 8028\n  },\n  {\n    \"tag\": "coresort",\n    \"popularity\": 8019\n  },\n  {\n    \"tag\": "drusy preformant",\n    \"popularity\": 8011\n  },\n  {\n    \"tag\": "piningly",\n    \"popularity\": 8003\n  },\n  {\n    \"tag\": "bootlessly",\n    \"popularity\": 7994\n  },\n  {\n    \"tag\": "talari",\n    \"popularity\": 7986\n  },\n  {\n    \"tag\": "amidoacetal",\n    \"popularity\": 7978\n  },\n  {\n    \"tag\": "pschent",\n    \"popularity\": 7970\n  },\n  {\n    \"tag\": "consumptional scarer titivate",\n    \"popularity\": 7962\n  },\n  {\n    \"tag\": "Anserinae",\n    \"popularity\": 7953\n  },\n  {\n    \"tag\": "flaunter",\n    \"popularity\": 7945\n  },\n  {\n    \"tag\": "reindeer",\n    \"popularity\": 7937\n  },\n  {\n    \"tag\": "disparage",\n    \"popularity\": 7929\n  },\n  {\n    \"tag\": "superheat",\n    \"popularity\": 7921\n  },\n  {\n    \"tag\": "Chromatium",\n    \"popularity\": 7912\n  },\n  {\n    \"tag\": "Tina",\n    \"popularity\": 7904\n  },\n  {\n    \"tag\": "rededicatory",\n    \"popularity\": 7896\n  },\n  {\n    \"tag\": "nontransient",\n    \"popularity\": 7888\n  },\n  {\n    \"tag\": "Phocaean brinkless",\n    \"popularity\": 7880\n  },\n  {\n    \"tag\": "ventriculose",\n    \"popularity\": 7872\n  },\n  {\n    \"tag\": "upplough",\n    \"popularity\": 7864\n  },\n  {\n    \"tag\": "succorless",\n    \"popularity\": 7856\n  },\n  {\n    \"tag\": "hayrake",\n    \"popularity\": 7848\n  },\n  {\n    \"tag\": "merriness amorphia",\n    \"popularity\": 7840\n  },\n  {\n    \"tag\": "merycism",\n    \"popularity\": 7832\n  },\n  {\n    \"tag\": "checkrow",\n    \"popularity\": 7824\n  },\n  {\n    \"tag\": "scry",\n    \"popularity\": 7816\n  },\n  {\n    \"tag\": "obvolve",\n    \"popularity\": 7808\n  },\n  {\n    \"tag\": "orchard",\n    \"popularity\": 7800\n  },\n  {\n    \"tag\": "isomerize",\n    \"popularity\": 7792\n  },\n  {\n    \"tag\": "competitrix",\n    \"popularity\": 7784\n  },\n  {\n    \"tag\": "unbannered",\n    \"popularity\": 7776\n  },\n  {\n    \"tag\": "undoctrined",\n    \"popularity\": 7768\n  },\n  {\n    \"tag\": "theologian",\n    \"popularity\": 7760\n  },\n  {\n    \"tag\": "nebby",\n    \"popularity\": 7752\n  },\n  {\n    \"tag\": "Cardiazol",\n    \"popularity\": 7745\n  },\n  {\n    \"tag\": "phagedenic",\n    \"popularity\": 7737\n  },\n  {\n    \"tag\": "nostalgic",\n    \"popularity\": 7729\n  },\n  {\n    \"tag\": "orthodoxy",\n    \"popularity\": 7721\n  },\n  {\n    \"tag\": "oversanguine",\n    \"popularity\": 7713\n  },\n  {\n    \"tag\": "lish",\n    \"popularity\": 7705\n  },\n  {\n    \"tag\": "ketogenic",\n    \"popularity\": 7698\n  },\n  {\n    \"tag\": "syndicalize",\n    \"popularity\": 7690\n  },\n  {\n    \"tag\": "leeftail",\n    \"popularity\": 7682\n  },\n  {\n    \"tag\": "bulbomedullary",\n    \"popularity\": 7674\n  },\n  {\n    \"tag\": "reletter",\n    \"popularity\": 7667\n  },\n  {\n    \"tag\": "bitterly",\n    \"popularity\": 7659\n  },\n  {\n    \"tag\": "participatory",\n    \"popularity\": 7651\n  },\n  {\n    \"tag\": "baldberry",\n    \"popularity\": 7643\n  },\n  {\n    \"tag\": "prowaterpower",\n    \"popularity\": 7636\n  },\n  {\n    \"tag\": "lexicographical",\n    \"popularity\": 7628\n  },\n  {\n    \"tag\": "Anisodactyli",\n    \"popularity\": 7620\n  },\n  {\n    \"tag\": "amphipodous",\n    \"popularity\": 7613\n  },\n  {\n    \"tag\": "triglandular",\n    \"popularity\": 7605\n  },\n  {\n    \"tag\": "xanthopsin",\n    \"popularity\": 7597\n  },\n  {\n    \"tag\": "indefinitude",\n    \"popularity\": 7590\n  },\n  {\n    \"tag\": "bookworm",\n    \"popularity\": 7582\n  },\n  {\n    \"tag\": "suffocative",\n    \"popularity\": 7574\n  },\n  {\n    \"tag\": "uncongested tyrant",\n    \"popularity\": 7567\n  },\n  {\n    \"tag\": "alow harmoniously Pamir",\n    \"popularity\": 7559\n  },\n  {\n    \"tag\": "monander",\n    \"popularity\": 7552\n  },\n  {\n    \"tag\": "bagatelle",\n    \"popularity\": 7544\n  },\n  {\n    \"tag\": "membranology",\n    \"popularity\": 7537\n  },\n  {\n    \"tag\": "parturifacient",\n    \"popularity\": 7529\n  },\n  {\n    \"tag\": "excitovascular",\n    \"popularity\": 7522\n  },\n  {\n    \"tag\": "homopolar",\n    \"popularity\": 7514\n  },\n  {\n    \"tag\": "phobiac",\n    \"popularity\": 7507\n  },\n  {\n    \"tag\": "clype",\n    \"popularity\": 7499\n  },\n  {\n    \"tag\": "unsubversive",\n    \"popularity\": 7492\n  },\n  {\n    \"tag\": "bostrychoidal scorpionwort",\n    \"popularity\": 7484\n  },\n  {\n    \"tag\": "biliteralism",\n    \"popularity\": 7477\n  },\n  {\n    \"tag\": "dentatocostate",\n    \"popularity\": 7469\n  },\n  {\n    \"tag\": "Pici",\n    \"popularity\": 7462\n  },\n  {\n    \"tag\": "sideritic",\n    \"popularity\": 7454\n  },\n  {\n    \"tag\": "syntaxis",\n    \"popularity\": 7447\n  },\n  {\n    \"tag\": "ingest",\n    \"popularity\": 7440\n  },\n  {\n    \"tag\": "rigmarolish",\n    \"popularity\": 7432\n  },\n  {\n    \"tag\": "ocreaceous",\n    \"popularity\": 7425\n  },\n  {\n    \"tag\": "hyperbrachyskelic",\n    \"popularity\": 7418\n  },\n  {\n    \"tag\": "basophobia",\n    \"popularity\": 7410\n  },\n  {\n    \"tag\": "substantialness",\n    \"popularity\": 7403\n  },\n  {\n    \"tag\": "agglutinoid",\n    \"popularity\": 7396\n  },\n  {\n    \"tag\": "longleaf",\n    \"popularity\": 7388\n  },\n  {\n    \"tag\": "electroengraving",\n    \"popularity\": 7381\n  },\n  {\n    \"tag\": "laparoenterotomy",\n    \"popularity\": 7374\n  },\n  {\n    \"tag\": "oxalylurea",\n    \"popularity\": 7366\n  },\n  {\n    \"tag\": "unattaintedly",\n    \"popularity\": 7359\n  },\n  {\n    \"tag\": "pennystone",\n    \"popularity\": 7352\n  },\n  {\n    \"tag\": "Plumbaginaceae",\n    \"popularity\": 7345\n  },\n  {\n    \"tag\": "horntip",\n    \"popularity\": 7337\n  },\n  {\n    \"tag\": "begrudge",\n    \"popularity\": 7330\n  },\n  {\n    \"tag\": "bechignoned",\n    \"popularity\": 7323\n  },\n  {\n    \"tag\": "hologonidium",\n    \"popularity\": 7316\n  },\n  {\n    \"tag\": "Pulian",\n    \"popularity\": 7309\n  },\n  {\n    \"tag\": "gratulation",\n    \"popularity\": 7301\n  },\n  {\n    \"tag\": "Sebright",\n    \"popularity\": 7294\n  },\n  {\n    \"tag\": "coinstantaneous emotionally",\n    \"popularity\": 7287\n  },\n  {\n    \"tag\": "thoracostracan",\n    \"popularity\": 7280\n  },\n  {\n    \"tag\": "saurodont",\n    \"popularity\": 7273\n  },\n  {\n    \"tag\": "coseat",\n    \"popularity\": 7266\n  },\n  {\n    \"tag\": "irascibility",\n    \"popularity\": 7259\n  },\n  {\n    \"tag\": "occlude",\n    \"popularity\": 7251\n  },\n  {\n    \"tag\": "metallurgist",\n    \"popularity\": 7244\n  },\n  {\n    \"tag\": "extraviolet",\n    \"popularity\": 7237\n  },\n  {\n    \"tag\": "clinic",\n    \"popularity\": 7230\n  },\n  {\n    \"tag\": "skater",\n    \"popularity\": 7223\n  },\n  {\n    \"tag\": "linguistic",\n    \"popularity\": 7216\n  },\n  {\n    \"tag\": "attacheship",\n    \"popularity\": 7209\n  },\n  {\n    \"tag\": "Rachianectes",\n    \"popularity\": 7202\n  },\n  {\n    \"tag\": "foliolose",\n    \"popularity\": 7195\n  },\n  {\n    \"tag\": "claudetite",\n    \"popularity\": 7188\n  },\n  {\n    \"tag\": "aphidian scratching",\n    \"popularity\": 7181\n  },\n  {\n    \"tag\": "Carida",\n    \"popularity\": 7174\n  },\n  {\n    \"tag\": "tiepin polymicroscope",\n    \"popularity\": 7167\n  },\n  {\n    \"tag\": "telpherage",\n    \"popularity\": 7160\n  },\n  {\n    \"tag\": "meek",\n    \"popularity\": 7153\n  },\n  {\n    \"tag\": "swiftness",\n    \"popularity\": 7146\n  },\n  {\n    \"tag\": "gentes",\n    \"popularity\": 7139\n  },\n  {\n    \"tag\": "uncommemorated",\n    \"popularity\": 7132\n  },\n  {\n    \"tag\": "Lazarus",\n    \"popularity\": 7125\n  },\n  {\n    \"tag\": "redivive",\n    \"popularity\": 7119\n  },\n  {\n    \"tag\": "nonfebrile",\n    \"popularity\": 7112\n  },\n  {\n    \"tag\": "nymphet",\n    \"popularity\": 7105\n  },\n  {\n    \"tag\": "areologically",\n    \"popularity\": 7098\n  },\n  {\n    \"tag\": "undonkey",\n    \"popularity\": 7091\n  },\n  {\n    \"tag\": "projecting",\n    \"popularity\": 7084\n  },\n  {\n    \"tag\": "pinnigrade",\n    \"popularity\": 7077\n  },\n  {\n    \"tag\": "butylation",\n    \"popularity\": 7071\n  },\n  {\n    \"tag\": "philologistic lenticle",\n    \"popularity\": 7064\n  },\n  {\n    \"tag\": "nooky",\n    \"popularity\": 7057\n  },\n  {\n    \"tag\": "incestuousness",\n    \"popularity\": 7050\n  },\n  {\n    \"tag\": "palingenetically",\n    \"popularity\": 7043\n  },\n  {\n    \"tag\": "mitochondria",\n    \"popularity\": 7037\n  },\n  {\n    \"tag\": "truthify",\n    \"popularity\": 7030\n  },\n  {\n    \"tag\": "titanyl",\n    \"popularity\": 7023\n  },\n  {\n    \"tag\": "bestride",\n    \"popularity\": 7016\n  },\n  {\n    \"tag\": "chende",\n    \"popularity\": 7010\n  },\n  {\n    \"tag\": "Chaucerian monophote",\n    \"popularity\": 7003\n  },\n  {\n    \"tag\": "cutback",\n    \"popularity\": 6996\n  },\n  {\n    \"tag\": "unpatiently",\n    \"popularity\": 6989\n  },\n  {\n    \"tag\": "subvitreous",\n    \"popularity\": 6983\n  },\n  {\n    \"tag\": "organizable",\n    \"popularity\": 6976\n  },\n  {\n    \"tag\": "anniverse uncomprehensible",\n    \"popularity\": 6969\n  },\n  {\n    \"tag\": "hyalescence",\n    \"popularity\": 6963\n  },\n  {\n    \"tag\": "amniochorial",\n    \"popularity\": 6956\n  },\n  {\n    \"tag\": "Corybantian",\n    \"popularity\": 6949\n  },\n  {\n    \"tag\": "genocide Scaphitidae",\n    \"popularity\": 6943\n  },\n  {\n    \"tag\": "accordionist",\n    \"popularity\": 6936\n  },\n  {\n    \"tag\": "becheck",\n    \"popularity\": 6930\n  },\n  {\n    \"tag\": "overproduce",\n    \"popularity\": 6923\n  },\n  {\n    \"tag\": "unmaniac frijolillo",\n    \"popularity\": 6916\n  },\n  {\n    \"tag\": "multisulcated",\n    \"popularity\": 6910\n  },\n  {\n    \"tag\": "wennebergite",\n    \"popularity\": 6903\n  },\n  {\n    \"tag\": "tautousious mowth",\n    \"popularity\": 6897\n  },\n  {\n    \"tag\": "marigold",\n    \"popularity\": 6890\n  },\n  {\n    \"tag\": "affray",\n    \"popularity\": 6884\n  },\n  {\n    \"tag\": "nonidolatrous",\n    \"popularity\": 6877\n  },\n  {\n    \"tag\": "aphrasia",\n    \"popularity\": 6871\n  },\n  {\n    \"tag\": "muddlingly",\n    \"popularity\": 6864\n  },\n  {\n    \"tag\": "clear",\n    \"popularity\": 6858\n  },\n  {\n    \"tag\": "Clitoria",\n    \"popularity\": 6851\n  },\n  {\n    \"tag\": "apportionment underwaist",\n    \"popularity\": 6845\n  },\n  {\n    \"tag\": "kodakist",\n    \"popularity\": 6838\n  },\n  {\n    \"tag\": "Momotidae",\n    \"popularity\": 6832\n  },\n  {\n    \"tag\": "cryptovalency",\n    \"popularity\": 6825\n  },\n  {\n    \"tag\": "floe",\n    \"popularity\": 6819\n  },\n  {\n    \"tag\": "aphagia",\n    \"popularity\": 6812\n  },\n  {\n    \"tag\": "brontograph",\n    \"popularity\": 6806\n  },\n  {\n    \"tag\": "tubulous",\n    \"popularity\": 6799\n  },\n  {\n    \"tag\": "unhorse",\n    \"popularity\": 6793\n  },\n  {\n    \"tag\": "chlordane",\n    \"popularity\": 6787\n  },\n  {\n    \"tag\": "colloquy brochan",\n    \"popularity\": 6780\n  },\n  {\n    \"tag\": "sloosh",\n    \"popularity\": 6774\n  },\n  {\n    \"tag\": "battered",\n    \"popularity\": 6767\n  },\n  {\n    \"tag\": "monocularity pluriguttulate",\n    \"popularity\": 6761\n  },\n  {\n    \"tag\": "chiastoneury",\n    \"popularity\": 6755\n  },\n  {\n    \"tag\": "Sanguinaria",\n    \"popularity\": 6748\n  },\n  {\n    \"tag\": "confessionary",\n    \"popularity\": 6742\n  },\n  {\n    \"tag\": "enzymic",\n    \"popularity\": 6736\n  },\n  {\n    \"tag\": "cord",\n    \"popularity\": 6729\n  },\n  {\n    \"tag\": "oviducal",\n    \"popularity\": 6723\n  },\n  {\n    \"tag\": "crozzle outsea",\n    \"popularity\": 6717\n  },\n  {\n    \"tag\": "balladical",\n    \"popularity\": 6710\n  },\n  {\n    \"tag\": "uncollectibleness",\n    \"popularity\": 6704\n  },\n  {\n    \"tag\": "predorsal",\n    \"popularity\": 6698\n  },\n  {\n    \"tag\": "reauthenticate",\n    \"popularity\": 6692\n  },\n  {\n    \"tag\": "ravissant",\n    \"popularity\": 6685\n  },\n  {\n    \"tag\": "advantageousness",\n    \"popularity\": 6679\n  },\n  {\n    \"tag\": "rung",\n    \"popularity\": 6673\n  },\n  {\n    \"tag\": "duncedom",\n    \"popularity\": 6667\n  },\n  {\n    \"tag\": "hematolite",\n    \"popularity\": 6660\n  },\n  {\n    \"tag\": "thisness",\n    \"popularity\": 6654\n  },\n  {\n    \"tag\": "mapau",\n    \"popularity\": 6648\n  },\n  {\n    \"tag\": "Hecatic",\n    \"popularity\": 6642\n  },\n  {\n    \"tag\": "meningoencephalocele",\n    \"popularity\": 6636\n  },\n  {\n    \"tag\": "confection sorra",\n    \"popularity\": 6630\n  },\n  {\n    \"tag\": "unsedate",\n    \"popularity\": 6623\n  },\n  {\n    \"tag\": "meningocerebritis",\n    \"popularity\": 6617\n  },\n  {\n    \"tag\": "biopsychological",\n    \"popularity\": 6611\n  },\n  {\n    \"tag\": "clavicithern",\n    \"popularity\": 6605\n  },\n  {\n    \"tag\": "resun",\n    \"popularity\": 6599\n  },\n  {\n    \"tag\": "bayamo",\n    \"popularity\": 6593\n  },\n  {\n    \"tag\": "seeableness",\n    \"popularity\": 6587\n  },\n  {\n    \"tag\": "hypsidolichocephalism",\n    \"popularity\": 6581\n  },\n  {\n    \"tag\": "salivous",\n    \"popularity\": 6574\n  },\n  {\n    \"tag\": "neumatize",\n    \"popularity\": 6568\n  },\n  {\n    \"tag\": "stree",\n    \"popularity\": 6562\n  },\n  {\n    \"tag\": "markshot",\n    \"popularity\": 6556\n  },\n  {\n    \"tag\": "phraseologically",\n    \"popularity\": 6550\n  },\n  {\n    \"tag\": "yealing",\n    \"popularity\": 6544\n  },\n  {\n    \"tag\": "puggy",\n    \"popularity\": 6538\n  },\n  {\n    \"tag\": "sexadecimal",\n    \"popularity\": 6532\n  },\n  {\n    \"tag\": "unofficerlike",\n    \"popularity\": 6526\n  },\n  {\n    \"tag\": "curiosa",\n    \"popularity\": 6520\n  },\n  {\n    \"tag\": "pedomotor",\n    \"popularity\": 6514\n  },\n  {\n    \"tag\": "astrally",\n    \"popularity\": 6508\n  },\n  {\n    \"tag\": "prosomatic",\n    \"popularity\": 6502\n  },\n  {\n    \"tag\": "bulletheaded",\n    \"popularity\": 6496\n  },\n  {\n    \"tag\": "fortuned",\n    \"popularity\": 6490\n  },\n  {\n    \"tag\": "pixy",\n    \"popularity\": 6484\n  },\n  {\n    \"tag\": "protectrix",\n    \"popularity\": 6478\n  },\n  {\n    \"tag\": "arthritical",\n    \"popularity\": 6472\n  },\n  {\n    \"tag\": "coction",\n    \"popularity\": 6466\n  },\n  {\n    \"tag\": "Anthropos",\n    \"popularity\": 6460\n  },\n  {\n    \"tag\": "runer",\n    \"popularity\": 6454\n  },\n  {\n    \"tag\": "prenotify",\n    \"popularity\": 6449\n  },\n  {\n    \"tag\": "microspheric gastroparalysis",\n    \"popularity\": 6443\n  },\n  {\n    \"tag\": "Jovicentrical",\n    \"popularity\": 6437\n  },\n  {\n    \"tag\": "ceratopsid",\n    \"popularity\": 6431\n  },\n  {\n    \"tag\": "Theodoric",\n    \"popularity\": 6425\n  },\n  {\n    \"tag\": "Pactolus",\n    \"popularity\": 6419\n  },\n  {\n    \"tag\": "spawning",\n    \"popularity\": 6413\n  },\n  {\n    \"tag\": "nonconfidential",\n    \"popularity\": 6407\n  },\n  {\n    \"tag\": "halotrichite infumate",\n    \"popularity\": 6402\n  },\n  {\n    \"tag\": "undiscriminatingly",\n    \"popularity\": 6396\n  },\n  {\n    \"tag\": "unexasperated",\n    \"popularity\": 6390\n  },\n  {\n    \"tag\": "isoeugenol",\n    \"popularity\": 6384\n  },\n  {\n    \"tag\": "pressboard",\n    \"popularity\": 6378\n  },\n  {\n    \"tag\": "unshrew",\n    \"popularity\": 6372\n  },\n  {\n    \"tag\": "huffingly",\n    \"popularity\": 6367\n  },\n  {\n    \"tag\": "wagaun",\n    \"popularity\": 6361\n  },\n  {\n    \"tag\": "squirt Philistine",\n    \"popularity\": 6355\n  },\n  {\n    \"tag\": "kryptic",\n    \"popularity\": 6349\n  },\n  {\n    \"tag\": "paraform",\n    \"popularity\": 6344\n  },\n  {\n    \"tag\": "preverify",\n    \"popularity\": 6338\n  },\n  {\n    \"tag\": "dalar",\n    \"popularity\": 6332\n  },\n  {\n    \"tag\": "interdictor appraisingly",\n    \"popularity\": 6326\n  },\n  {\n    \"tag\": "chipped",\n    \"popularity\": 6321\n  },\n  {\n    \"tag\": "Pteropoda",\n    \"popularity\": 6315\n  },\n  {\n    \"tag\": "Bohairic",\n    \"popularity\": 6309\n  },\n  {\n    \"tag\": "felting",\n    \"popularity\": 6303\n  },\n  {\n    \"tag\": "compurgatorial",\n    \"popularity\": 6298\n  },\n  {\n    \"tag\": "unclead",\n    \"popularity\": 6292\n  },\n  {\n    \"tag\": "stockish",\n    \"popularity\": 6286\n  },\n  {\n    \"tag\": "mulligatawny",\n    \"popularity\": 6281\n  },\n  {\n    \"tag\": "Monotheletism",\n    \"popularity\": 6275\n  },\n  {\n    \"tag\": "lutanist",\n    \"popularity\": 6269\n  },\n  {\n    \"tag\": "gluttonize",\n    \"popularity\": 6264\n  },\n  {\n    \"tag\": "hackneyed",\n    \"popularity\": 6258\n  },\n  {\n    \"tag\": "yield",\n    \"popularity\": 6253\n  },\n  {\n    \"tag\": "sulphonamido",\n    \"popularity\": 6247\n  },\n  {\n    \"tag\": "granulative",\n    \"popularity\": 6241\n  },\n  {\n    \"tag\": "swingy",\n    \"popularity\": 6236\n  },\n  {\n    \"tag\": "Desmidiales",\n    \"popularity\": 6230\n  },\n  {\n    \"tag\": "tootlish",\n    \"popularity\": 6224\n  },\n  {\n    \"tag\": "unsatisfiedly",\n    \"popularity\": 6219\n  },\n  {\n    \"tag\": "burucha",\n    \"popularity\": 6213\n  },\n  {\n    \"tag\": "premeditatingly",\n    \"popularity\": 6208\n  },\n  {\n    \"tag\": "cowrie",\n    \"popularity\": 6202\n  },\n  {\n    \"tag\": "pleurolysis",\n    \"popularity\": 6197\n  },\n  {\n    \"tag\": "nationalist",\n    \"popularity\": 6191\n  },\n  {\n    \"tag\": "Pholadacea",\n    \"popularity\": 6186\n  },\n  {\n    \"tag\": "anakrousis",\n    \"popularity\": 6180\n  },\n  {\n    \"tag\": "proctorial",\n    \"popularity\": 6175\n  },\n  {\n    \"tag\": "cavillation",\n    \"popularity\": 6169\n  },\n  {\n    \"tag\": "cervicobregmatic",\n    \"popularity\": 6163\n  },\n  {\n    \"tag\": "interspecific",\n    \"popularity\": 6158\n  },\n  {\n    \"tag\": "Teutonity",\n    \"popularity\": 6152\n  },\n  {\n    \"tag\": "snakeholing",\n    \"popularity\": 6147\n  },\n  {\n    \"tag\": "balcony",\n    \"popularity\": 6142\n  },\n  {\n    \"tag\": "latchless",\n    \"popularity\": 6136\n  },\n  {\n    \"tag\": "Mithraea",\n    \"popularity\": 6131\n  },\n  {\n    \"tag\": "pseudepigraph",\n    \"popularity\": 6125\n  },\n  {\n    \"tag\": "flosser",\n    \"popularity\": 6120\n  },\n  {\n    \"tag\": "kotyle",\n    \"popularity\": 6114\n  },\n  {\n    \"tag\": "outdo",\n    \"popularity\": 6109\n  },\n  {\n    \"tag\": "interclerical",\n    \"popularity\": 6103\n  },\n  {\n    \"tag\": "aurar",\n    \"popularity\": 6098\n  },\n  {\n    \"tag\": "apophyseal",\n    \"popularity\": 6093\n  },\n  {\n    \"tag\": "Miro",\n    \"popularity\": 6087\n  },\n  {\n    \"tag\": "Priscillian",\n    \"popularity\": 6082\n  },\n  {\n    \"tag\": "alluvia",\n    \"popularity\": 6076\n  },\n  {\n    \"tag\": "exordize",\n    \"popularity\": 6071\n  },\n  {\n    \"tag\": "breakage",\n    \"popularity\": 6066\n  },\n  {\n    \"tag\": "unclosable",\n    \"popularity\": 6060\n  },\n  {\n    \"tag\": "monocondylous",\n    \"popularity\": 6055\n  },\n  {\n    \"tag\": "dyarchy",\n    \"popularity\": 6050\n  },\n  {\n    \"tag\": "subchelate",\n    \"popularity\": 6044\n  },\n  {\n    \"tag\": "hearsay",\n    \"popularity\": 6039\n  },\n  {\n    \"tag\": "prestigiously",\n    \"popularity\": 6034\n  },\n  {\n    \"tag\": "unimuscular",\n    \"popularity\": 6028\n  },\n  {\n    \"tag\": "lingwort",\n    \"popularity\": 6023\n  },\n  {\n    \"tag\": "jealous",\n    \"popularity\": 6018\n  },\n  {\n    \"tag\": "artilleryman",\n    \"popularity\": 6012\n  },\n  {\n    \"tag\": "phantasmagorially",\n    \"popularity\": 6007\n  },\n  {\n    \"tag\": "stagnum",\n    \"popularity\": 6002\n  },\n  {\n    \"tag\": "organotropism shatteringly",\n    \"popularity\": 5997\n  },\n  {\n    \"tag\": "Mytilus Hebraist",\n    \"popularity\": 5991\n  },\n  {\n    \"tag\": "returf",\n    \"popularity\": 5986\n  },\n  {\n    \"tag\": "townfolk",\n    \"popularity\": 5981\n  },\n  {\n    \"tag\": "propitiative",\n    \"popularity\": 5976\n  },\n  {\n    \"tag\": "Anita unsullied",\n    \"popularity\": 5970\n  },\n  {\n    \"tag\": "bandoleered",\n    \"popularity\": 5965\n  },\n  {\n    \"tag\": "cubby",\n    \"popularity\": 5960\n  },\n  {\n    \"tag\": "Hexanchus",\n    \"popularity\": 5955\n  },\n  {\n    \"tag\": "circuminsular",\n    \"popularity\": 5949\n  },\n  {\n    \"tag\": "chamberletted eumycete",\n    \"popularity\": 5944\n  },\n  {\n    \"tag\": "secure",\n    \"popularity\": 5939\n  },\n  {\n    \"tag\": "Edwardean",\n    \"popularity\": 5934\n  },\n  {\n    \"tag\": "strenth",\n    \"popularity\": 5929\n  },\n  {\n    \"tag\": "exhaustless",\n    \"popularity\": 5923\n  },\n  {\n    \"tag\": "electioneerer",\n    \"popularity\": 5918\n  },\n  {\n    \"tag\": "estoile",\n    \"popularity\": 5913\n  },\n  {\n    \"tag\": "redden",\n    \"popularity\": 5908\n  },\n  {\n    \"tag\": "solicitee",\n    \"popularity\": 5903\n  },\n  {\n    \"tag\": "nonpatented",\n    \"popularity\": 5898\n  },\n  {\n    \"tag\": "lemming",\n    \"popularity\": 5893\n  },\n  {\n    \"tag\": "marled subalate",\n    \"popularity\": 5887\n  },\n  {\n    \"tag\": "premial horizonward",\n    \"popularity\": 5882\n  },\n  {\n    \"tag\": "nonrefueling",\n    \"popularity\": 5877\n  },\n  {\n    \"tag\": "rupturewort",\n    \"popularity\": 5872\n  },\n  {\n    \"tag\": "unfed",\n    \"popularity\": 5867\n  },\n  {\n    \"tag\": "empanelment",\n    \"popularity\": 5862\n  },\n  {\n    \"tag\": "isoosmosis",\n    \"popularity\": 5857\n  },\n  {\n    \"tag\": "jipijapa",\n    \"popularity\": 5852\n  },\n  {\n    \"tag\": "Fiji",\n    \"popularity\": 5847\n  },\n  {\n    \"tag\": "interferant",\n    \"popularity\": 5842\n  },\n  {\n    \"tag\": "reconstitution",\n    \"popularity\": 5837\n  },\n  {\n    \"tag\": "dockyardman",\n    \"popularity\": 5832\n  },\n  {\n    \"tag\": "dolichopodous",\n    \"popularity\": 5826\n  },\n  {\n    \"tag\": "whiteworm",\n    \"popularity\": 5821\n  },\n  {\n    \"tag\": "atheistically",\n    \"popularity\": 5816\n  },\n  {\n    \"tag\": "nonconcern",\n    \"popularity\": 5811\n  },\n  {\n    \"tag\": "scarabaeidoid",\n    \"popularity\": 5806\n  },\n  {\n    \"tag\": "triumviri",\n    \"popularity\": 5801\n  },\n  {\n    \"tag\": "rakit",\n    \"popularity\": 5796\n  },\n  {\n    \"tag\": "leecheater",\n    \"popularity\": 5791\n  },\n  {\n    \"tag\": "Arthrostraca",\n    \"popularity\": 5786\n  },\n  {\n    \"tag\": "upknit",\n    \"popularity\": 5781\n  },\n  {\n    \"tag\": "tymbalon",\n    \"popularity\": 5776\n  },\n  {\n    \"tag\": "inventurous",\n    \"popularity\": 5771\n  },\n  {\n    \"tag\": "perradiate",\n    \"popularity\": 5766\n  },\n  {\n    \"tag\": "seer",\n    \"popularity\": 5762\n  },\n  {\n    \"tag\": "Auricularia",\n    \"popularity\": 5757\n  },\n  {\n    \"tag\": "wettish exclusivity",\n    \"popularity\": 5752\n  },\n  {\n    \"tag\": "arteriosympathectomy",\n    \"popularity\": 5747\n  },\n  {\n    \"tag\": "tunlike",\n    \"popularity\": 5742\n  },\n  {\n    \"tag\": "cephalocercal",\n    \"popularity\": 5737\n  },\n  {\n    \"tag\": "meaninglessness",\n    \"popularity\": 5732\n  },\n  {\n    \"tag\": "fountful",\n    \"popularity\": 5727\n  },\n  {\n    \"tag\": "appraisement",\n    \"popularity\": 5722\n  },\n  {\n    \"tag\": "geniculated",\n    \"popularity\": 5717\n  },\n  {\n    \"tag\": "rotator",\n    \"popularity\": 5712\n  },\n  {\n    \"tag\": "foremarch biography",\n    \"popularity\": 5707\n  },\n  {\n    \"tag\": "arid",\n    \"popularity\": 5703\n  },\n  {\n    \"tag\": "inapprehensible",\n    \"popularity\": 5698\n  },\n  {\n    \"tag\": "chlorosulphonic",\n    \"popularity\": 5693\n  },\n  {\n    \"tag\": "braguette",\n    \"popularity\": 5688\n  },\n  {\n    \"tag\": "panophthalmitis",\n    \"popularity\": 5683\n  },\n  {\n    \"tag\": "pro objurgatorily",\n    \"popularity\": 5678\n  },\n  {\n    \"tag\": "zooplasty",\n    \"popularity\": 5673\n  },\n  {\n    \"tag\": "Terebratulidae",\n    \"popularity\": 5669\n  },\n  {\n    \"tag\": "Mahran",\n    \"popularity\": 5664\n  },\n  {\n    \"tag\": "anthologize merocele",\n    \"popularity\": 5659\n  },\n  {\n    \"tag\": "firecracker chiropractic",\n    \"popularity\": 5654\n  },\n  {\n    \"tag\": "tenorist",\n    \"popularity\": 5649\n  },\n  {\n    \"tag\": "amphitene",\n    \"popularity\": 5645\n  },\n  {\n    \"tag\": "silverbush toadstone",\n    \"popularity\": 5640\n  },\n  {\n    \"tag\": "entozoological",\n    \"popularity\": 5635\n  },\n  {\n    \"tag\": "trustlessness",\n    \"popularity\": 5630\n  },\n  {\n    \"tag\": "reassay",\n    \"popularity\": 5625\n  },\n  {\n    \"tag\": "chrysalides",\n    \"popularity\": 5621\n  },\n  {\n    \"tag\": "truncation",\n    \"popularity\": 5616\n  },\n  {\n    \"tag\": "unwavered mausoleal",\n    \"popularity\": 5611\n  },\n  {\n    \"tag\": "unserrated",\n    \"popularity\": 5606\n  },\n  {\n    \"tag\": "frampler",\n    \"popularity\": 5602\n  },\n  {\n    \"tag\": "celestial",\n    \"popularity\": 5597\n  },\n  {\n    \"tag\": "depreter",\n    \"popularity\": 5592\n  },\n  {\n    \"tag\": "retaliate",\n    \"popularity\": 5588\n  },\n  {\n    \"tag\": "decempunctate",\n    \"popularity\": 5583\n  },\n  {\n    \"tag\": "submitter",\n    \"popularity\": 5578\n  },\n  {\n    \"tag\": "phenothiazine",\n    \"popularity\": 5573\n  },\n  {\n    \"tag\": "hobbledehoyish",\n    \"popularity\": 5569\n  },\n  {\n    \"tag\": "erraticness",\n    \"popularity\": 5564\n  },\n  {\n    \"tag\": "ovariodysneuria",\n    \"popularity\": 5559\n  },\n  {\n    \"tag\": "puja",\n    \"popularity\": 5555\n  },\n  {\n    \"tag\": "cesspool",\n    \"popularity\": 5550\n  },\n  {\n    \"tag\": "sonation",\n    \"popularity\": 5545\n  },\n  {\n    \"tag\": "moggan",\n    \"popularity\": 5541\n  },\n  {\n    \"tag\": "overjutting",\n    \"popularity\": 5536\n  },\n  {\n    \"tag\": "cohobate",\n    \"popularity\": 5531\n  },\n  {\n    \"tag\": "Distoma",\n    \"popularity\": 5527\n  },\n  {\n    \"tag\": "Plectognathi",\n    \"popularity\": 5522\n  },\n  {\n    \"tag\": "dumple caliphate",\n    \"popularity\": 5517\n  },\n  {\n    \"tag\": "shiko",\n    \"popularity\": 5513\n  },\n  {\n    \"tag\": "downness",\n    \"popularity\": 5508\n  },\n  {\n    \"tag\": "whippletree",\n    \"popularity\": 5504\n  },\n  {\n    \"tag\": "nymphaeum",\n    \"popularity\": 5499\n  },\n  {\n    \"tag\": "there trest",\n    \"popularity\": 5494\n  },\n  {\n    \"tag\": "psychrometer",\n    \"popularity\": 5490\n  },\n  {\n    \"tag\": "pyelograph",\n    \"popularity\": 5485\n  },\n  {\n    \"tag\": "unsalvable",\n    \"popularity\": 5481\n  },\n  {\n    \"tag\": "bescreen",\n    \"popularity\": 5476\n  },\n  {\n    \"tag\": "cushy",\n    \"popularity\": 5471\n  },\n  {\n    \"tag\": "plicatolobate",\n    \"popularity\": 5467\n  },\n  {\n    \"tag\": "lakie",\n    \"popularity\": 5462\n  },\n  {\n    \"tag\": "anthropodeoxycholic",\n    \"popularity\": 5458\n  },\n  {\n    \"tag\": "resatisfaction",\n    \"popularity\": 5453\n  },\n  {\n    \"tag\": "unravelment unaccidental",\n    \"popularity\": 5449\n  },\n  {\n    \"tag\": "telewriter monogeneous",\n    \"popularity\": 5444\n  },\n  {\n    \"tag\": "unsabred",\n    \"popularity\": 5440\n  },\n  {\n    \"tag\": "startlingly",\n    \"popularity\": 5435\n  },\n  {\n    \"tag\": "Aralia",\n    \"popularity\": 5431\n  },\n  {\n    \"tag\": "alamonti",\n    \"popularity\": 5426\n  },\n  {\n    \"tag\": "Franklinization",\n    \"popularity\": 5422\n  },\n  {\n    \"tag\": "parliament",\n    \"popularity\": 5417\n  },\n  {\n    \"tag\": "schoolkeeper",\n    \"popularity\": 5413\n  },\n  {\n    \"tag\": "nonsociety",\n    \"popularity\": 5408\n  },\n  {\n    \"tag\": "parenthetic",\n    \"popularity\": 5404\n  },\n  {\n    \"tag\": "stog",\n    \"popularity\": 5399\n  },\n  {\n    \"tag\": "Pristipomidae",\n    \"popularity\": 5395\n  },\n  {\n    \"tag\": "exocarp",\n    \"popularity\": 5390\n  },\n  {\n    \"tag\": "monaxonial",\n    \"popularity\": 5386\n  },\n  {\n    \"tag\": "tramroad",\n    \"popularity\": 5381\n  },\n  {\n    \"tag\": "hookah",\n    \"popularity\": 5377\n  },\n  {\n    \"tag\": "saccharonic",\n    \"popularity\": 5372\n  },\n  {\n    \"tag\": "perimetrium",\n    \"popularity\": 5368\n  },\n  {\n    \"tag\": "libelluloid",\n    \"popularity\": 5364\n  },\n  {\n    \"tag\": "overrunningly",\n    \"popularity\": 5359\n  },\n  {\n    \"tag\": "untwister",\n    \"popularity\": 5355\n  },\n  {\n    \"tag\": "ninnyhammer",\n    \"popularity\": 5350\n  },\n  {\n    \"tag\": "metranate",\n    \"popularity\": 5346\n  },\n  {\n    \"tag\": "sarcoblast",\n    \"popularity\": 5341\n  },\n  {\n    \"tag\": "porkish",\n    \"popularity\": 5337\n  },\n  {\n    \"tag\": "chauvinistic",\n    \"popularity\": 5333\n  },\n  {\n    \"tag\": "sexagesimal",\n    \"popularity\": 5328\n  },\n  {\n    \"tag\": "hematogenic",\n    \"popularity\": 5324\n  },\n  {\n    \"tag\": "selfpreservatory",\n    \"popularity\": 5320\n  },\n  {\n    \"tag\": "myelauxe",\n    \"popularity\": 5315\n  },\n  {\n    \"tag\": "triply",\n    \"popularity\": 5311\n  },\n  {\n    \"tag\": "metaphysicous",\n    \"popularity\": 5306\n  },\n  {\n    \"tag\": "vitrinoid",\n    \"popularity\": 5302\n  },\n  {\n    \"tag\": "glabellae",\n    \"popularity\": 5298\n  },\n  {\n    \"tag\": "moonlighter",\n    \"popularity\": 5293\n  },\n  {\n    \"tag\": "monotheistically epexegetical",\n    \"popularity\": 5289\n  },\n  {\n    \"tag\": "pseudolateral",\n    \"popularity\": 5285\n  },\n  {\n    \"tag\": "heptamethylene",\n    \"popularity\": 5280\n  },\n  {\n    \"tag\": "salvadora",\n    \"popularity\": 5276\n  },\n  {\n    \"tag\": "unjovial diphenylthiourea",\n    \"popularity\": 5272\n  },\n  {\n    \"tag\": "thievishness",\n    \"popularity\": 5268\n  },\n  {\n    \"tag\": "unridable",\n    \"popularity\": 5263\n  },\n  {\n    \"tag\": "underhandedly",\n    \"popularity\": 5259\n  },\n  {\n    \"tag\": "fungiform",\n    \"popularity\": 5255\n  },\n  {\n    \"tag\": "scruffle",\n    \"popularity\": 5250\n  },\n  {\n    \"tag\": "preindisposition",\n    \"popularity\": 5246\n  },\n  {\n    \"tag\": "Amadis",\n    \"popularity\": 5242\n  },\n  {\n    \"tag\": "Culex",\n    \"popularity\": 5238\n  },\n  {\n    \"tag\": "churning",\n    \"popularity\": 5233\n  },\n  {\n    \"tag\": "imperite",\n    \"popularity\": 5229\n  },\n  {\n    \"tag\": "levorotation",\n    \"popularity\": 5225\n  },\n  {\n    \"tag\": "barbate",\n    \"popularity\": 5221\n  },\n  {\n    \"tag\": "knotwort",\n    \"popularity\": 5216\n  },\n  {\n    \"tag\": "gypsiferous",\n    \"popularity\": 5212\n  },\n  {\n    \"tag\": "tourmalinic",\n    \"popularity\": 5208\n  },\n  {\n    \"tag\": "helleboric",\n    \"popularity\": 5204\n  },\n  {\n    \"tag\": "pneumograph",\n    \"popularity\": 5199\n  },\n  {\n    \"tag\": "Peltigeraceae",\n    \"popularity\": 5195\n  },\n  {\n    \"tag\": "busine",\n    \"popularity\": 5191\n  },\n  {\n    \"tag\": "Ailuridae",\n    \"popularity\": 5187\n  },\n  {\n    \"tag\": "azotate",\n    \"popularity\": 5183\n  },\n  {\n    \"tag\": "unlikable",\n    \"popularity\": 5178\n  },\n  {\n    \"tag\": "sloyd",\n    \"popularity\": 5174\n  },\n  {\n    \"tag\": "biblioclasm",\n    \"popularity\": 5170\n  },\n  {\n    \"tag\": "Seres",\n    \"popularity\": 5166\n  },\n  {\n    \"tag\": "unaccurateness",\n    \"popularity\": 5162\n  },\n  {\n    \"tag\": "scrollwise",\n    \"popularity\": 5157\n  },\n  {\n    \"tag\": "flandowser",\n    \"popularity\": 5153\n  },\n  {\n    \"tag\": "unblackened",\n    \"popularity\": 5149\n  },\n  {\n    \"tag\": "schistosternia",\n    \"popularity\": 5145\n  },\n  {\n    \"tag\": "fuse",\n    \"popularity\": 5141\n  },\n  {\n    \"tag\": "narthecal",\n    \"popularity\": 5137\n  },\n  {\n    \"tag\": "Cueva",\n    \"popularity\": 5133\n  },\n  {\n    \"tag\": "appositeness",\n    \"popularity\": 5128\n  },\n  {\n    \"tag\": "proindustrial",\n    \"popularity\": 5124\n  },\n  {\n    \"tag\": "dermatorrhoea",\n    \"popularity\": 5120\n  },\n  {\n    \"tag\": "oxyurous tendential",\n    \"popularity\": 5116\n  },\n  {\n    \"tag\": "isopurpurin",\n    \"popularity\": 5112\n  },\n  {\n    \"tag\": "impose",\n    \"popularity\": 5108\n  },\n  {\n    \"tag\": "wordsmanship",\n    \"popularity\": 5104\n  },\n  {\n    \"tag\": "saturator",\n    \"popularity\": 5100\n  },\n  {\n    \"tag\": "Nordicity",\n    \"popularity\": 5096\n  },\n  {\n    \"tag\": "interaccuse",\n    \"popularity\": 5092\n  },\n  {\n    \"tag\": "acridinic",\n    \"popularity\": 5087\n  },\n  {\n    \"tag\": "scholion",\n    \"popularity\": 5083\n  },\n  {\n    \"tag\": "pseudoaconitine",\n    \"popularity\": 5079\n  },\n  {\n    \"tag\": "doctorial",\n    \"popularity\": 5075\n  },\n  {\n    \"tag\": "Etchimin",\n    \"popularity\": 5071\n  },\n  {\n    \"tag\": "oliviform",\n    \"popularity\": 5067\n  },\n  {\n    \"tag\": "Pele",\n    \"popularity\": 5063\n  },\n  {\n    \"tag\": "Chiromantis Progymnasium",\n    \"popularity\": 5059\n  },\n  {\n    \"tag\": "toxosis",\n    \"popularity\": 5055\n  },\n  {\n    \"tag\": "spadilla",\n    \"popularity\": 5051\n  },\n  {\n    \"tag\": "Actinopterygii",\n    \"popularity\": 5047\n  },\n  {\n    \"tag\": "untiring",\n    \"popularity\": 5043\n  },\n  {\n    \"tag\": "butyral",\n    \"popularity\": 5039\n  },\n  {\n    \"tag\": "Gymnoderinae",\n    \"popularity\": 5035\n  },\n  {\n    \"tag\": "testudo",\n    \"popularity\": 5031\n  },\n  {\n    \"tag\": "frigorify",\n    \"popularity\": 5027\n  },\n  {\n    \"tag\": "aliency",\n    \"popularity\": 5023\n  },\n  {\n    \"tag\": "jargon",\n    \"popularity\": 5019\n  },\n  {\n    \"tag\": "counterservice",\n    \"popularity\": 5015\n  },\n  {\n    \"tag\": "isostrychnine",\n    \"popularity\": 5011\n  },\n  {\n    \"tag\": "tellership",\n    \"popularity\": 5007\n  },\n  {\n    \"tag\": "miscegenetic",\n    \"popularity\": 5003\n  },\n  {\n    \"tag\": "sorcer",\n    \"popularity\": 4999\n  },\n  {\n    \"tag\": "tilewright",\n    \"popularity\": 4995\n  },\n  {\n    \"tag\": "cyanoplastid",\n    \"popularity\": 4991\n  },\n  {\n    \"tag\": "fluxionally",\n    \"popularity\": 4987\n  },\n  {\n    \"tag\": "proudhearted",\n    \"popularity\": 4983\n  },\n  {\n    \"tag\": "blithely",\n    \"popularity\": 4979\n  },\n  {\n    \"tag\": "jestproof",\n    \"popularity\": 4975\n  },\n  {\n    \"tag\": "jestwise",\n    \"popularity\": 4971\n  },\n  {\n    \"tag\": "nonassimilable",\n    \"popularity\": 4967\n  },\n  {\n    \"tag\": "compurgation",\n    \"popularity\": 4964\n  },\n  {\n    \"tag\": "unhate",\n    \"popularity\": 4960\n  },\n  {\n    \"tag\": "haplodonty",\n    \"popularity\": 4956\n  },\n  {\n    \"tag\": "cardholder",\n    \"popularity\": 4952\n  },\n  {\n    \"tag\": "rainlight megohmmeter overstout",\n    \"popularity\": 4948\n  },\n  {\n    \"tag\": "itchless",\n    \"popularity\": 4944\n  },\n  {\n    \"tag\": "begiggle",\n    \"popularity\": 4940\n  },\n  {\n    \"tag\": "chromatosphere",\n    \"popularity\": 4936\n  },\n  {\n    \"tag\": "typicality",\n    \"popularity\": 4932\n  },\n  {\n    \"tag\": "overgrown",\n    \"popularity\": 4928\n  },\n  {\n    \"tag\": "envolume",\n    \"popularity\": 4925\n  },\n  {\n    \"tag\": "pachycholia",\n    \"popularity\": 4921\n  },\n  {\n    \"tag\": "passageable",\n    \"popularity\": 4917\n  },\n  {\n    \"tag\": "pathopoiesis",\n    \"popularity\": 4913\n  },\n  {\n    \"tag\": "overbreak",\n    \"popularity\": 4909\n  },\n  {\n    \"tag\": "satyric",\n    \"popularity\": 4905\n  },\n  {\n    \"tag\": "unaudited",\n    \"popularity\": 4901\n  },\n  {\n    \"tag\": "whimble",\n    \"popularity\": 4898\n  },\n  {\n    \"tag\": "pressureless",\n    \"popularity\": 4894\n  },\n  {\n    \"tag\": "Selene",\n    \"popularity\": 4890\n  },\n  {\n    \"tag\": "slithery",\n    \"popularity\": 4886\n  },\n  {\n    \"tag\": "nondisfigurement",\n    \"popularity\": 4882\n  },\n  {\n    \"tag\": "overdelicious",\n    \"popularity\": 4878\n  },\n  {\n    \"tag\": "Perca",\n    \"popularity\": 4875\n  },\n  {\n    \"tag\": "Palladium",\n    \"popularity\": 4871\n  },\n  {\n    \"tag\": "insagacity",\n    \"popularity\": 4867\n  },\n  {\n    \"tag\": "peristoma",\n    \"popularity\": 4863\n  },\n  {\n    \"tag\": "uncreativeness",\n    \"popularity\": 4859\n  },\n  {\n    \"tag\": "incomparability surfboarding",\n    \"popularity\": 4856\n  },\n  {\n    \"tag\": "bacillar",\n    \"popularity\": 4852\n  },\n  {\n    \"tag\": "ulcerative",\n    \"popularity\": 4848\n  },\n  {\n    \"tag\": "stychomythia",\n    \"popularity\": 4844\n  },\n  {\n    \"tag\": "sesma somatics nonentry",\n    \"popularity\": 4840\n  },\n  {\n    \"tag\": "unsepulchred",\n    \"popularity\": 4837\n  },\n  {\n    \"tag\": "cephalanthium",\n    \"popularity\": 4833\n  },\n  {\n    \"tag\": "Asiaticization",\n    \"popularity\": 4829\n  },\n  {\n    \"tag\": "killeen",\n    \"popularity\": 4825\n  },\n  {\n    \"tag\": "Pseudococcus",\n    \"popularity\": 4822\n  },\n  {\n    \"tag\": "untractable",\n    \"popularity\": 4818\n  },\n  {\n    \"tag\": "apolegamic",\n    \"popularity\": 4814\n  },\n  {\n    \"tag\": "hyperpnea",\n    \"popularity\": 4810\n  },\n  {\n    \"tag\": "martyrolatry",\n    \"popularity\": 4807\n  },\n  {\n    \"tag\": "Sarmatic",\n    \"popularity\": 4803\n  },\n  {\n    \"tag\": "nonsurface",\n    \"popularity\": 4799\n  },\n  {\n    \"tag\": "adjoined",\n    \"popularity\": 4796\n  },\n  {\n    \"tag\": "vasiform",\n    \"popularity\": 4792\n  },\n  {\n    \"tag\": "tastelessness",\n    \"popularity\": 4788\n  },\n  {\n    \"tag\": "rumbo",\n    \"popularity\": 4784\n  },\n  {\n    \"tag\": "subdititious",\n    \"popularity\": 4781\n  },\n  {\n    \"tag\": "reparticipation",\n    \"popularity\": 4777\n  },\n  {\n    \"tag\": "Yorkshireism",\n    \"popularity\": 4773\n  },\n  {\n    \"tag\": "outcrow",\n    \"popularity\": 4770\n  },\n  {\n    \"tag\": "casserole",\n    \"popularity\": 4766\n  },\n  {\n    \"tag\": "semideltaic",\n    \"popularity\": 4762\n  },\n  {\n    \"tag\": "freemason",\n    \"popularity\": 4759\n  },\n  {\n    \"tag\": "catkin",\n    \"popularity\": 4755\n  },\n  {\n    \"tag\": "conscient",\n    \"popularity\": 4751\n  },\n  {\n    \"tag\": "reliably",\n    \"popularity\": 4748\n  },\n  {\n    \"tag\": "Telembi",\n    \"popularity\": 4744\n  },\n  {\n    \"tag\": "hide",\n    \"popularity\": 4740\n  },\n  {\n    \"tag\": "social",\n    \"popularity\": 4737\n  },\n  {\n    \"tag\": "ichneutic",\n    \"popularity\": 4733\n  },\n  {\n    \"tag\": "polypotome blouse pentagrammatic",\n    \"popularity\": 4729\n  },\n  {\n    \"tag\": "airdrome pesthole",\n    \"popularity\": 4726\n  },\n  {\n    \"tag\": "unportended",\n    \"popularity\": 4722\n  },\n  {\n    \"tag\": "sheerly",\n    \"popularity\": 4719\n  },\n  {\n    \"tag\": "acardiac",\n    \"popularity\": 4715\n  },\n  {\n    \"tag\": "fetor",\n    \"popularity\": 4711\n  },\n  {\n    \"tag\": "storax",\n    \"popularity\": 4708\n  },\n  {\n    \"tag\": "syndactylic",\n    \"popularity\": 4704\n  },\n  {\n    \"tag\": "otiatrics",\n    \"popularity\": 4700\n  },\n  {\n    \"tag\": "range",\n    \"popularity\": 4697\n  },\n  {\n    \"tag\": "branchway",\n    \"popularity\": 4693\n  },\n  {\n    \"tag\": "beatific",\n    \"popularity\": 4690\n  },\n  {\n    \"tag\": "Rugosa",\n    \"popularity\": 4686\n  },\n  {\n    \"tag\": "rafty",\n    \"popularity\": 4682\n  },\n  {\n    \"tag\": "gapy",\n    \"popularity\": 4679\n  },\n  {\n    \"tag\": "heterocercal",\n    \"popularity\": 4675\n  },\n  {\n    \"tag\": "actinopterygious",\n    \"popularity\": 4672\n  },\n  {\n    \"tag\": "glauconite",\n    \"popularity\": 4668\n  },\n  {\n    \"tag\": "limbless priest",\n    \"popularity\": 4665\n  },\n  {\n    \"tag\": "chrysene",\n    \"popularity\": 4661\n  },\n  {\n    \"tag\": "isentropic",\n    \"popularity\": 4658\n  },\n  {\n    \"tag\": "lairdess",\n    \"popularity\": 4654\n  },\n  {\n    \"tag\": "butterhead choliambic",\n    \"popularity\": 4650\n  },\n  {\n    \"tag\": "hexaseme",\n    \"popularity\": 4647\n  },\n  {\n    \"tag\": "treeify",\n    \"popularity\": 4643\n  },\n  {\n    \"tag\": "coronetted fructify",\n    \"popularity\": 4640\n  },\n  {\n    \"tag\": "admiralty",\n    \"popularity\": 4636\n  },\n  {\n    \"tag\": "Flosculariidae",\n    \"popularity\": 4633\n  },\n  {\n    \"tag\": "limaceous",\n    \"popularity\": 4629\n  },\n  {\n    \"tag\": "subterconscious",\n    \"popularity\": 4626\n  },\n  {\n    \"tag\": "stayless",\n    \"popularity\": 4622\n  },\n  {\n    \"tag\": "psha",\n    \"popularity\": 4619\n  },\n  {\n    \"tag\": "Mediterraneanize",\n    \"popularity\": 4615\n  },\n  {\n    \"tag\": "impenetrably",\n    \"popularity\": 4612\n  },\n  {\n    \"tag\": "Myrmeleonidae",\n    \"popularity\": 4608\n  },\n  {\n    \"tag\": "germander",\n    \"popularity\": 4605\n  },\n  {\n    \"tag\": "Buri",\n    \"popularity\": 4601\n  },\n  {\n    \"tag\": "papyrotamia",\n    \"popularity\": 4598\n  },\n  {\n    \"tag\": "Toxylon",\n    \"popularity\": 4594\n  },\n  {\n    \"tag\": "batatilla",\n    \"popularity\": 4591\n  },\n  {\n    \"tag\": "fabella assumer",\n    \"popularity\": 4587\n  },\n  {\n    \"tag\": "macromethod",\n    \"popularity\": 4584\n  },\n  {\n    \"tag\": "Blechnum",\n    \"popularity\": 4580\n  },\n  {\n    \"tag\": "pantography",\n    \"popularity\": 4577\n  },\n  {\n    \"tag\": "seminovel",\n    \"popularity\": 4574\n  },\n  {\n    \"tag\": "disembarrassment",\n    \"popularity\": 4570\n  },\n  {\n    \"tag\": "bushmaking",\n    \"popularity\": 4567\n  },\n  {\n    \"tag\": "neurosis",\n    \"popularity\": 4563\n  },\n  {\n    \"tag\": "Animalia",\n    \"popularity\": 4560\n  },\n  {\n    \"tag\": "Bernice",\n    \"popularity\": 4556\n  },\n  {\n    \"tag\": "wisen",\n    \"popularity\": 4553\n  },\n  {\n    \"tag\": "subhymenium",\n    \"popularity\": 4549\n  },\n  {\n    \"tag\": "esophagomycosis",\n    \"popularity\": 4546\n  },\n  {\n    \"tag\": "wireworks",\n    \"popularity\": 4543\n  },\n  {\n    \"tag\": "Sabellidae",\n    \"popularity\": 4539\n  },\n  {\n    \"tag\": "fustianish",\n    \"popularity\": 4536\n  },\n  {\n    \"tag\": "professively",\n    \"popularity\": 4532\n  },\n  {\n    \"tag\": "overcorruptly",\n    \"popularity\": 4529\n  },\n  {\n    \"tag\": "overcreep",\n    \"popularity\": 4526\n  },\n  {\n    \"tag\": "Castilloa",\n    \"popularity\": 4522\n  },\n  {\n    \"tag\": "forelady Georgie",\n    \"popularity\": 4519\n  },\n  {\n    \"tag\": "outsider",\n    \"popularity\": 4515\n  },\n  {\n    \"tag\": "Enukki",\n    \"popularity\": 4512\n  },\n  {\n    \"tag\": "gypsy",\n    \"popularity\": 4509\n  },\n  {\n    \"tag\": "Passamaquoddy",\n    \"popularity\": 4505\n  },\n  {\n    \"tag\": "reposit",\n    \"popularity\": 4502\n  },\n  {\n    \"tag\": "overtenderness",\n    \"popularity\": 4499\n  },\n  {\n    \"tag\": "keratome",\n    \"popularity\": 4495\n  },\n  {\n    \"tag\": "interclavicular hypermonosyllable Susanna",\n    \"popularity\": 4492\n  },\n  {\n    \"tag\": "mispropose",\n    \"popularity\": 4489\n  },\n  {\n    \"tag\": "Membranipora",\n    \"popularity\": 4485\n  },\n  {\n    \"tag\": "lampad",\n    \"popularity\": 4482\n  },\n  {\n    \"tag\": "header",\n    \"popularity\": 4479\n  },\n  {\n    \"tag\": "triseriate",\n    \"popularity\": 4475\n  },\n  {\n    \"tag\": "distrainment",\n    \"popularity\": 4472\n  },\n  {\n    \"tag\": "staphyloplastic",\n    \"popularity\": 4469\n  },\n  {\n    \"tag\": "outscour",\n    \"popularity\": 4465\n  },\n  {\n    \"tag\": "tallowmaking",\n    \"popularity\": 4462\n  },\n  {\n    \"tag\": "plugger",\n    \"popularity\": 4459\n  },\n  {\n    \"tag\": "fashionize",\n    \"popularity\": 4455\n  },\n  {\n    \"tag\": "puzzle",\n    \"popularity\": 4452\n  },\n  {\n    \"tag\": "imbrue",\n    \"popularity\": 4449\n  },\n  {\n    \"tag\": "osteoblast",\n    \"popularity\": 4445\n  },\n  {\n    \"tag\": "Hydrocores",\n    \"popularity\": 4442\n  },\n  {\n    \"tag\": "Lutra",\n    \"popularity\": 4439\n  },\n  {\n    \"tag\": "upridge scarfy",\n    \"popularity\": 4435\n  },\n  {\n    \"tag\": "ancon taffle",\n    \"popularity\": 4432\n  },\n  {\n    \"tag\": "impest",\n    \"popularity\": 4429\n  },\n  {\n    \"tag\": "uncollatedness",\n    \"popularity\": 4426\n  },\n  {\n    \"tag\": "hypersensitize",\n    \"popularity\": 4422\n  },\n  {\n    \"tag\": "autographically",\n    \"popularity\": 4419\n  },\n  {\n    \"tag\": "louther",\n    \"popularity\": 4416\n  },\n  {\n    \"tag\": "Ollie",\n    \"popularity\": 4413\n  },\n  {\n    \"tag\": "recompensate",\n    \"popularity\": 4409\n  },\n  {\n    \"tag\": "Shan",\n    \"popularity\": 4406\n  },\n  {\n    \"tag\": "brachycnemic",\n    \"popularity\": 4403\n  },\n  {\n    \"tag\": "Carinatae",\n    \"popularity\": 4399\n  },\n  {\n    \"tag\": "geotherm",\n    \"popularity\": 4396\n  },\n  {\n    \"tag\": "sawback",\n    \"popularity\": 4393\n  },\n  {\n    \"tag\": "Novatianist",\n    \"popularity\": 4390\n  },\n  {\n    \"tag\": "reapproach",\n    \"popularity\": 4387\n  },\n  {\n    \"tag\": "myelopoietic",\n    \"popularity\": 4383\n  },\n  {\n    \"tag\": "cyanin",\n    \"popularity\": 4380\n  },\n  {\n    \"tag\": "unsmutted",\n    \"popularity\": 4377\n  },\n  {\n    \"tag\": "nonpapist",\n    \"popularity\": 4374\n  },\n  {\n    \"tag\": "transbaikalian",\n    \"popularity\": 4370\n  },\n  {\n    \"tag\": "connately",\n    \"popularity\": 4367\n  },\n  {\n    \"tag\": "tenderize iterance",\n    \"popularity\": 4364\n  },\n  {\n    \"tag\": "hydrostatical",\n    \"popularity\": 4361\n  },\n  {\n    \"tag\": "unflag",\n    \"popularity\": 4358\n  },\n  {\n    \"tag\": "translate",\n    \"popularity\": 4354\n  },\n  {\n    \"tag\": "Scorzonera",\n    \"popularity\": 4351\n  },\n  {\n    \"tag\": "uncomforted",\n    \"popularity\": 4348\n  },\n  {\n    \"tag\": "risser varied",\n    \"popularity\": 4345\n  },\n  {\n    \"tag\": "plumbate",\n    \"popularity\": 4342\n  },\n  {\n    \"tag\": "Usneaceae",\n    \"popularity\": 4338\n  },\n  {\n    \"tag\": "fohat",\n    \"popularity\": 4335\n  },\n  {\n    \"tag\": "slagging",\n    \"popularity\": 4332\n  },\n  {\n    \"tag\": "superserious",\n    \"popularity\": 4329\n  },\n  {\n    \"tag\": "theocracy",\n    \"popularity\": 4326\n  },\n  {\n    \"tag\": "valonia",\n    \"popularity\": 4323\n  },\n  {\n    \"tag\": "Sapindales",\n    \"popularity\": 4319\n  },\n  {\n    \"tag\": "palaeozoologist",\n    \"popularity\": 4316\n  },\n  {\n    \"tag\": "yalb",\n    \"popularity\": 4313\n  },\n  {\n    \"tag\": "unviewed",\n    \"popularity\": 4310\n  },\n  {\n    \"tag\": "polyarteritis",\n    \"popularity\": 4307\n  },\n  {\n    \"tag\": "vectorial",\n    \"popularity\": 4304\n  },\n  {\n    \"tag\": "skimpingly",\n    \"popularity\": 4301\n  },\n  {\n    \"tag\": "athort",\n    \"popularity\": 4297\n  },\n  {\n    \"tag\": "tribofluorescence",\n    \"popularity\": 4294\n  },\n  {\n    \"tag\": "benzonitrol",\n    \"popularity\": 4291\n  },\n  {\n    \"tag\": "swiller subobtuse subjacency",\n    \"popularity\": 4288\n  },\n  {\n    \"tag\": "uncompassed",\n    \"popularity\": 4285\n  },\n  {\n    \"tag\": "cacochymia",\n    \"popularity\": 4282\n  },\n  {\n    \"tag\": "commensalist butadiene",\n    \"popularity\": 4279\n  },\n  {\n    \"tag\": "culpable",\n    \"popularity\": 4276\n  },\n  {\n    \"tag\": "contributive",\n    \"popularity\": 4273\n  },\n  {\n    \"tag\": "attemperately",\n    \"popularity\": 4269\n  },\n  {\n    \"tag\": "spelt",\n    \"popularity\": 4266\n  },\n  {\n    \"tag\": "exoneration",\n    \"popularity\": 4263\n  },\n  {\n    \"tag\": "antivivisectionist",\n    \"popularity\": 4260\n  },\n  {\n    \"tag\": "granitification",\n    \"popularity\": 4257\n  },\n  {\n    \"tag\": "palladize",\n    \"popularity\": 4254\n  },\n  {\n    \"tag\": "marksmanship",\n    \"popularity\": 4251\n  },\n  {\n    \"tag\": "bullydom",\n    \"popularity\": 4248\n  },\n  {\n    \"tag\": "spirality",\n    \"popularity\": 4245\n  },\n  {\n    \"tag\": "caliginous",\n    \"popularity\": 4242\n  },\n  {\n    \"tag\": "reportedly",\n    \"popularity\": 4239\n  },\n  {\n    \"tag\": "polyad",\n    \"popularity\": 4236\n  },\n  {\n    \"tag\": "arthroempyesis",\n    \"popularity\": 4233\n  },\n  {\n    \"tag\": "semibay facultatively",\n    \"popularity\": 4229\n  },\n  {\n    \"tag\": "metastatically",\n    \"popularity\": 4226\n  },\n  {\n    \"tag\": "prophetically",\n    \"popularity\": 4223\n  },\n  {\n    \"tag\": "Linguatula elapid",\n    \"popularity\": 4220\n  },\n  {\n    \"tag\": "pyknatom",\n    \"popularity\": 4217\n  },\n  {\n    \"tag\": "centimeter",\n    \"popularity\": 4214\n  },\n  {\n    \"tag\": "mensurate",\n    \"popularity\": 4211\n  },\n  {\n    \"tag\": "migraine",\n    \"popularity\": 4208\n  },\n  {\n    \"tag\": "pentagamist",\n    \"popularity\": 4205\n  },\n  {\n    \"tag\": "querken",\n    \"popularity\": 4202\n  },\n  {\n    \"tag\": "ambulance",\n    \"popularity\": 4199\n  },\n  {\n    \"tag\": "Stokavian",\n    \"popularity\": 4196\n  },\n  {\n    \"tag\": "malvasian",\n    \"popularity\": 4193\n  },\n  {\n    \"tag\": "uncouthsome",\n    \"popularity\": 4190\n  },\n  {\n    \"tag\": "readable",\n    \"popularity\": 4187\n  },\n  {\n    \"tag\": "enlodge",\n    \"popularity\": 4184\n  },\n  {\n    \"tag\": "plasterwise Appendiculariidae perspectograph",\n    \"popularity\": 4181\n  },\n  {\n    \"tag\": "inkweed",\n    \"popularity\": 4178\n  },\n  {\n    \"tag\": "streep",\n    \"popularity\": 4175\n  },\n  {\n    \"tag\": "diadelphian cultured",\n    \"popularity\": 4172\n  },\n  {\n    \"tag\": "hymenopterous",\n    \"popularity\": 4169\n  },\n  {\n    \"tag\": "unexorableness",\n    \"popularity\": 4166\n  },\n  {\n    \"tag\": "cascaron",\n    \"popularity\": 4163\n  },\n  {\n    \"tag\": "undaintiness",\n    \"popularity\": 4160\n  },\n  {\n    \"tag\": "Curtana",\n    \"popularity\": 4157\n  },\n  {\n    \"tag\": "scurvied",\n    \"popularity\": 4154\n  },\n  {\n    \"tag\": "molluscoidal",\n    \"popularity\": 4151\n  },\n  {\n    \"tag\": "yurt",\n    \"popularity\": 4148\n  },\n  {\n    \"tag\": "deciduitis",\n    \"popularity\": 4145\n  },\n  {\n    \"tag\": "creephole",\n    \"popularity\": 4142\n  },\n  {\n    \"tag\": "quatrefeuille",\n    \"popularity\": 4139\n  },\n  {\n    \"tag\": "bicapitate adenomatome",\n    \"popularity\": 4136\n  },\n  {\n    \"tag\": "damassin",\n    \"popularity\": 4134\n  },\n  {\n    \"tag\": "planching",\n    \"popularity\": 4131\n  },\n  {\n    \"tag\": "dashedly inferential",\n    \"popularity\": 4128\n  },\n  {\n    \"tag\": "lobe",\n    \"popularity\": 4125\n  },\n  {\n    \"tag\": "Hyrachyus",\n    \"popularity\": 4122\n  },\n  {\n    \"tag\": "knab",\n    \"popularity\": 4119\n  },\n  {\n    \"tag\": "discohexaster",\n    \"popularity\": 4116\n  },\n  {\n    \"tag\": "malign",\n    \"popularity\": 4113\n  },\n  {\n    \"tag\": "pedagoguism",\n    \"popularity\": 4110\n  },\n  {\n    \"tag\": "shrubbery",\n    \"popularity\": 4107\n  },\n  {\n    \"tag\": "undershrub",\n    \"popularity\": 4104\n  },\n  {\n    \"tag\": "bureaucrat",\n    \"popularity\": 4101\n  },\n  {\n    \"tag\": "pantaleon",\n    \"popularity\": 4098\n  },\n  {\n    \"tag\": "mesoventral",\n    \"popularity\": 4096\n  }]';

var log2 = Math.log(2);
var tagInfo = tagInfoJSON.parseJSON(function(a, b) { if (a == "popularity") { return Math.log(b) / log2; } else {return b; } });

function makeTagCloud(tagInfo)
{
    var output = '<div class="tagCloud" style="width: 100%">';

    tagInfo.sort(function(a, b) { if (a.tag < b.tag) { return -1; } else if (a.tag == b.tag) { return 0; } else return 1; });

    for (var i = 0; i < tagInfo.length; i++) {
        var tag = tagInfo[i].tag;

        var validates = true;
        for (var j = 0; j < tag.length; j++) {
            var ch = tag.charCodeAt(j);
            if (ch < 0x20 || ch >= 0x7f) {
                validates = false;
                break;
            }
        }

        if (!validates)
            continue;

        var url = "http://example.com/tag/" + tag.replace(" ", "").toLowerCase();
        var popularity = tagInfo[i].popularity;
        var color = 'rgb(' + Math.floor(255 * (popularity - 12) / 20) + ', 0, 255)';
        output += ' <a href="' + url + '" style="font-size: ' + popularity + 'px; color: ' + color + '">' + tag + '</a> \n';
    }

    output += '</div>';
    output.replace(" ", "&nbsp;");

    return output;
}

var tagcloud = makeTagCloud(tagInfo);
tagInfo = null;
// This test case unpacks the compressed code for the MochiKit,
// jQuery, Dojo and Prototype JavaScript libraries.

/***
    MochiKit.MochiKit 1.3.1 : PACKED VERSION
    THIS FILE IS AUTOMATICALLY GENERATED.  If creating patches, please
    diff against the source tree, not this file.

    See <http://mochikit.com/> for documentation, downloads, license, etc.

    (c) 2005 Bob Ippolito.  All rights Reserved.
***/

for (var i = 0; i < 2; i++) {

var decompressedMochiKit = function(p,a,c,k,e,d){e=function(c){return(c<a?"":e(parseInt(c/a)))+((c=c%a)>35?String.fromCharCode(c+29):c.toString(36))};if(!''.replace(/^/,String)){while(c--)d[e(c)]=k[c]||e(c);k=[function(e){return d[e]}];e=function(){return'\\w+'};c=1};while(c--)if(k[c])p=p.replace(new RegExp('\\b'+e(c)+'\\b','g'),k[c]);return p}('if(H(1q)!="L"){1q.2X("B.J")}if(H(B)=="L"){B={}}if(H(B.J)=="L"){B.J={}}B.J.1Y="1.3.1";B.J.1r="B.J";B.J.2l=G(7V,vR){if(7V===O){7V={}}R(u i=1;i<M.K;i++){u o=M[i];if(H(o)!="L"&&o!==O){R(u k in o){7V[k]=o[k]}}}F 7V};B.J.2l(B.J,{1K:G(){F"["+D.1r+" "+D.1Y+"]"},1l:G(){F D.1K()},4f:G(n){if(M.K===0){n=1}F G(){F n++}},4L:G(mw){u me=M.2U;if(M.K==1){me.1U=mw;F Y me()}},bg:G(vQ){u X=[];u m=B.J;u aw=m.1R(O,M);1M(aw.K){u o=aw.2P();if(o&&H(o)=="3n"&&H(o.K)=="2y"){R(u i=o.K-1;i>=0;i--){aw.e9(o[i])}}N{X.1c(o)}}F X},1R:G(7U,1i,av){if(!av){av=0}if(1i){u l=1i.K;if(H(l)!="2y"){if(H(B.15)!="L"){1i=B.15.2G(1i);l=1i.K}N{14 Y 3p("au 2E an at-as 3W B.15 2E ar")}}if(!7U){7U=[]}R(u i=av;i<l;i++){7U.1c(1i[i])}}F 7U},8Z:G(5g,1i){if(5g===O){5g={}}R(u i=1;i<M.K;i++){u o=M[i];if(H(o)!="L"&&o!==O){R(u k in o){u v=o[k];if(H(5g[k])=="3n"&&H(v)=="3n"){M.2U(5g[k],v)}N{5g[k]=v}}}}F 5g},lO:G(6c,1i){if(6c===O){6c={}}R(u i=1;i<M.K;i++){u o=M[i];R(u k in o){if(!(k in 6c)){6c[k]=o[k]}}}F 6c},lN:G(1i){u fj=[];R(u mv in 1i){fj.1c(mv)}F fj},lM:G(1i){u fh=[];u e;R(u fi in 1i){u v;1f{v=1i[fi]}1e(e){2V}fh.1c([fi,v])}F fh},jq:G(fg,ff,fe){fe.1U=Y B.J.5a(fg.1r+"."+ff);fg[ff]=fe},4i:{7L:G(a){F!!a},vP:G(a){F!a},eE:G(a){F a},2E:G(a){F~a},vO:G(a){F-a},vN:G(a,b){F a+b},vM:G(a,b){F a-b},4u:G(a,b){F a/b},vL:G(a,b){F a%b},vK:G(a,b){F a*b},3W:G(a,b){F a&b},or:G(a,b){F a|b},vJ:G(a,b){F a^b},vI:G(a,b){F a<<b},vH:G(a,b){F a>>b},vG:G(a,b){F a>>>b},eq:G(a,b){F a==b},ne:G(a,b){F a!=b},gt:G(a,b){F a>b},ge:G(a,b){F a>=b},lt:G(a,b){F a<b},le:G(a,b){F a<=b},vF:G(a,b){F B.J.2f(a,b)===0},vE:G(a,b){F B.J.2f(a,b)!==0},vD:G(a,b){F B.J.2f(a,b)==1},vC:G(a,b){F B.J.2f(a,b)!=-1},vB:G(a,b){F B.J.2f(a,b)==-1},vA:G(a,b){F B.J.2f(a,b)!=1},vz:G(a,b){F a&&b},vy:G(a,b){F a||b},vx:G(a,b){F b in a}},24:G(mu){F G(){F D[mu].1w(D,M)}},lL:G(mt){F G(a9){F a9[mt]}},66:G(){u fd={};R(u i=0;i<M.K;i++){u 6b=M[i];fd[6b]=6b}F G(){R(u i=0;i<M.K;i++){if(!(H(M[i])in fd)){F 1m}}F 1h}},lJ:G(){R(u i=0;i<M.K;i++){if(M[i]!==O){F 1m}}F 1h},lK:G(){R(u i=0;i<M.K;i++){u o=M[i];if(!(H(o)=="L"||o===O)){F 1m}}F 1h},lI:G(1i){F!B.J.7e.1w(D,M)},7e:G(1i){R(u i=0;i<M.K;i++){u o=M[i];if(!(o&&o.K)){F 1m}}F 1h},3A:G(){R(u i=0;i<M.K;i++){u o=M[i];u 6b=H(o);if((6b!="3n"&&!(6b=="G"&&H(o.vw)=="G"))||o===O||H(o.K)!="2y"){F 1m}}F 1h},eN:G(){R(u i=0;i<M.K;i++){u o=M[i];if(H(o)!="3n"||o===O||H(o.9P)!="G"){F 1m}}F 1h},lH:G(fn){if(fn===O){F B.J.1R(O,M,1)}u fc=[];R(u i=1;i<M.K;i++){fc.1c(fn(M[i]))}F fc},2r:G(fn,1g){u m=B.J;u 6a=B.15;u fb=m.3A;if(M.K<=2){if(!fb(1g)){if(6a){1g=6a.2G(1g);if(fn===O){F 1g}}N{14 Y 3p("au 2E an at-as 3W B.15 2E ar")}}if(fn===O){F m.1R(O,1g)}u 69=[];R(u i=0;i<1g.K;i++){69.1c(fn(1g[i]))}F 69}N{if(fn===O){fn=7o}u 7T=O;R(i=1;i<M.K;i++){if(!fb(M[i])){if(6a){F 6a.2G(6a.4c.1w(O,M))}N{14 Y 3p("au 2E an at-as 3W B.15 2E ar")}}u l=M[i].K;if(7T===O||7T>l){7T=l}}69=[];R(i=0;i<7T;i++){u fa=[];R(u j=1;j<M.K;j++){fa.1c(M[j][i])}69.1c(fn.1w(D,fa))}F 69}},lG:G(fn){u f9=[];if(fn===O){fn=B.J.4i.7L}R(u i=1;i<M.K;i++){u o=M[i];if(fn(o)){f9.1c(o)}}F f9},47:G(fn,1g,7S){u aq=[];u m=B.J;if(!m.3A(1g)){if(B.15){1g=B.15.2G(1g)}N{14 Y 3p("au 2E an at-as 3W B.15 2E ar")}}if(fn===O){fn=m.4i.7L}if(H(7o.1U.47)=="G"){F 7o.1U.47.cz(1g,fn,7S)}N{if(H(7S)=="L"||7S===O){R(u i=0;i<1g.K;i++){u o=1g[i];if(fn(o)){aq.1c(o)}}}N{R(i=0;i<1g.K;i++){o=1g[i];if(fn.cz(7S,o)){aq.1c(o)}}}}F aq},mq:G(7R){F G(){hd(M.K){3j 0:F 7R();3j 1:F 7R(M[0]);3j 2:F 7R(M[0],M[1]);3j 3:F 7R(M[0],M[1],M[2])}u f8=[];R(u i=0;i<M.K;i++){f8.1c("M["+i+"]")}F dB("(1A("+f8.2b(",")+"))")}},lv:G(mr,ms){u m=B.J;F m.1O.1w(D,m.1R([ms,mr],M,2))},1O:G(3c,4o){if(H(3c)=="1n"){3c=4o[3c]}u ao=3c.f5;u 5f=3c.am;u f6=3c.f7;u m=B.J;if(H(3c)=="G"&&H(3c.1w)=="L"){3c=m.mq(3c)}if(H(ao)!="G"){ao=3c}if(H(4o)!="L"){f6=4o}if(H(5f)=="L"){5f=[]}N{5f=5f.9T()}m.1R(5f,M,2);u 7Q=G(){u ap=M;u me=M.2U;if(me.am.K>0){ap=m.2o(me.am,ap)}u 4o=me.f7;if(!4o){4o=D}F me.f5.1w(4o,ap)};7Q.f7=f6;7Q.f5=ao;7Q.am=5f;F 7Q},lF:G(7P){u mp=B.J.1O;R(u k in 7P){u f4=7P[k];if(H(f4)=="G"){7P[k]=mp(f4,7P)}}},5u:G(mo,mn,ml,mk){B.J.ae.5M(mo,mn,ml,mk)},mj:{"5L":1h,"1n":1h,"2y":1h},2f:G(a,b){if(a==b){F 0}u f3=(H(a)=="L"||a===O);u f2=(H(b)=="L"||b===O);if(f3&&f2){F 0}N{if(f3){F-1}N{if(f2){F 1}}}u m=B.J;u f1=m.mj;if(!(H(a)in f1&&H(b)in f1)){1f{F m.ae.3C(a,b)}1e(e){if(e!=m.4d){14 e}}}if(a<b){F-1}N{if(a>b){F 1}}u f0=m.U;14 Y 3p(f0(a)+" 3W "+f0(b)+" 9v 2E be vv")},eM:G(a,b){F B.J.2f(a.9P(),b.9P())},eL:G(a,b){u mi=B.J.2f;u 7O=a.K;u al=0;if(7O>b.K){al=1;7O=b.K}N{if(7O<b.K){al=-1}}R(u i=0;i<7O;i++){u 4j=mi(a[i],b[i]);if(4j){F 4j}}F al},7M:G(mh,mg,mf,md){B.J.ad.5M(mh,mg,mf,md)},U:G(o){if(H(o)=="L"){F"L"}N{if(o===O){F"O"}}1f{if(H(o.1K)=="G"){F o.1K()}N{if(H(o.U)=="G"&&o.U!=M.2U){F o.U()}}F B.J.ad.3C(o)}1e(e){if(H(o.1r)=="1n"&&(o.1l==cZ.1U.1l||o.1l==vu.1U.1l)){F o.1r}}1f{u eZ=(o+"")}1e(e){F"["+H(o)+"]"}if(H(o)=="G"){o=eZ.23(/^\\s+/,"");u 5n=o.2A("{");if(5n!=-1){o=o.3H(0,5n)+"{...}"}}F eZ},eK:G(o){u m=B.J;F"["+m.2r(m.U,o).2b(", ")+"]"},ac:G(o){F("\\""+o.23(/(["\\\\])/g,"\\\\$1")+"\\"").23(/[\\f]/g,"\\\\f").23(/[\\b]/g,"\\\\b").23(/[\\n]/g,"\\\\n").23(/[\\t]/g,"\\\\t").23(/[\\r]/g,"\\\\r")},eJ:G(o){F o+""},ly:G(mc,mb,ma,m9){B.J.ab.5M(mc,mb,ma,m9)},lx:G(){F dB("("+M[0]+")")},lz:G(o){u 5e=H(o);if(5e=="L"){F"L"}N{if(5e=="2y"||5e=="5L"){F o+""}N{if(o===O){F"O"}}}u m=B.J;u eY=m.ac;if(5e=="1n"){F eY(o)}u me=M.2U;u 3S;if(H(o.m8)=="G"){3S=o.m8();if(o!==3S){F me(3S)}}if(H(o.m7)=="G"){3S=o.m7();if(o!==3S){F me(3S)}}if(5e!="G"&&H(o.K)=="2y"){u X=[];R(u i=0;i<o.K;i++){u 2i=me(o[i]);if(H(2i)!="1n"){2i="L"}X.1c(2i)}F"["+X.2b(", ")+"]"}1f{3S=m.ab.3C(o);F me(3S)}1e(e){if(e!=m.4d){14 e}}if(5e=="G"){F O}X=[];R(u k in o){u ak;if(H(k)=="2y"){ak="\\""+k+"\\""}N{if(H(k)=="1n"){ak=eY(k)}N{2V}}2i=me(o[k]);if(H(2i)!="1n"){2V}X.1c(ak+":"+2i)}F"{"+X.2b(", ")+"}"},lE:G(a,b){F(B.J.2f(a,b)===0)},lD:G(eX,4n){if(eX.K!=4n.K){F 1m}F(B.J.2f(eX,4n)===0)},2o:G(){u eW=[];u m6=B.J.1R;R(u i=0;i<M.K;i++){m6(eW,M[i])}F eW},eR:G(2h){u m=B.J;u eU=m.2f;if(M.K==1){F G(a,b){F eU(a[2h],b[2h])}}u eV=m.1R(O,M);F G(a,b){u aj=0;R(u i=0;(aj===0)&&(i<eV.K);i++){u 2h=eV[i];aj=eU(a[2h],b[2h])}F aj}},lC:G(2h){u m5=B.J.eR.1w(D,M);F G(a,b){F m5(b,a)}},2z:G(m4){u m=B.J;F m.1O.1w(D,m.1R([m4,L],M,1))},67:G(m0,1g){if(1g.K===0){F O}u ai=1g[0];u m3=B.J.2f;R(u i=1;i<1g.K;i++){u o=1g[i];if(m3(o,ai)==m0){ai=o}}F ai},lB:G(){F B.J.67(1,M)},lA:G(){F B.J.67(-1,M)},bi:G(1g,lY,lZ,3B){if(H(3B)=="L"||3B===O){3B=1g.K}R(u i=(lZ||0);i<3B;i++){if(1g[i]===lY){F i}}F-1},eO:G(1g,lW,lX,3B){if(H(3B)=="L"||3B===O){3B=1g.K}u 4j=B.J.2f;R(u i=(lX||0);i<3B;i++){if(4j(1g[i],lW)===0){F i}}F-1},d4:G(1j,lV){u ah=[1j];u lU=B.J.1R;1M(ah.K){u X=lV(ah.2P());if(X){lU(ah,X)}}},3f:G(ag){u 2w=ag.1r;if(H(2w)=="L"){2w=""}N{2w=2w+"."}R(u 1b in ag){u o=ag[1b];if(H(o)=="G"&&H(o.1r)=="L"){1f{o.1r=2w+1b}1e(e){}}}},dw:G(3s,68){if(H(B.S)!="L"&&M.K==1&&(H(3s)=="1n"||(H(3s.3T)!="L"&&3s.3T>0))){u kv=B.S.d5(3s);3s=kv[0];68=kv[1]}N{if(M.K==1){u o=3s;3s=[];68=[];R(u k in o){u v=o[k];if(H(v)!="G"){3s.1c(k);68.1c(v)}}}}u W=[];u lT=28.2a(3s.K,68.K);u eT=B.J.af;R(u i=0;i<lT;i++){v=68[i];if(H(v)!="L"&&v!==O){W.1c(eT(3s[i])+"="+eT(v))}}F W.2b("&")},lw:G(lS,lQ){u 7N=lS.23(/\\+/g,"%20").2R("&");u o={};u 5d;if(H(lR)!="L"){5d=lR}N{5d=vt}if(lQ){R(u i=0;i<7N.K;i++){u 2n=7N[i].2R("=");u 1b=5d(2n[0]);u 4n=o[1b];if(!(4n 2C 7o)){4n=[];o[1b]=4n}4n.1c(5d(2n[1]))}}N{R(i=0;i<7N.K;i++){2n=7N[i].2R("=");o[5d(2n[0])]=5d(2n[1])}}F o}});B.J.4a=G(){D.4m=[]};B.J.4a.1U={5M:G(1b,eS,3y,lP){if(lP){D.4m.e9([1b,eS,3y])}N{D.4m.1c([1b,eS,3y])}},3C:G(){R(u i=0;i<D.4m.K;i++){u 2n=D.4m[i];if(2n[1].1w(D,M)){F 2n[2].1w(D,M)}}14 B.J.4d},vs:G(1b){R(u i=0;i<D.4m.K;i++){u 2n=D.4m[i];if(2n[0]==1b){D.4m.4y(i,1);F 1h}}F 1m}};B.J.1z=["4f","4L","1R","2l","8Z","lO","lN","lM","5a","4i","24","lL","66","lo","ln","lK","lJ","lI","7e","3A","eN","lH","2r","lG","47","1O","lF","4d","4a","5u","2f","7M","U","lE","lD","2o","eR","lC","2z","lm","67","lp","eI","lB","lA","d4","ll","af","dw","lz","ly","lx","lw","eO","bi","bg","lv"];B.J.1W=["3f","ae","ad","ab","eM","eL","eK","ac","eJ"];B.J.2Y=G(lu,eP){if(H(B.eQ)=="L"){B.eQ=(B.3d||(H(1x)=="L"&&H(1q)=="L"))}if(!B.eQ){F}u 1p=eP.2k[":1p"];R(u i=0;i<1p.K;i++){lu[1p[i]]=eP[1p[i]]}};B.J.2d=G(){u m=D;m.vr=m.24;m.vq=m.eO;if(H(ls)!="L"){m.af=G(lr){F ls(lr).23(/\\\'/g,"%27")}}N{m.af=G(lq){F vp(lq).23(/\\+/g,"%2B").23(/\\"/g,"%22").W.23(/\\\'/g,"%27")}}m.5a=G(1b){D.43=1b;D.1b=1b};m.5a.1U=Y 2x();m.2l(m.5a.1U,{U:G(){if(D.43&&D.43!=D.1b){F D.1b+"("+m.U(D.43)+")"}N{F D.1b+"()"}},1l:m.24("U")});m.4d=Y m.5a("B.J.4d");m.lp=m.2z(m.67,1);m.eI=m.2z(m.67,-1);m.lo=m.66("G");m.ln=m.66("L");m.lm=m.2z(m.2l,O);m.ll=m.2z(m.2r,O);m.ae=Y m.4a();m.5u("vo",m.eN,m.eM);m.5u("ej",m.3A,m.eL);m.ad=Y m.4a();m.7M("ej",m.3A,m.eK);m.7M("1n",m.66("1n"),m.ac);m.7M("vn",m.66("2y","5L"),m.eJ);m.ab=Y m.4a();u 1p=m.2o(m.1z,m.1W);m.2k={":3e":m.2o(m.1W),":1p":1p};m.3f(D)};B.J.2d();if(!B.3d){2f=B.J.2f}B.J.2Y(D,B.J);if(H(1q)!="L"){1q.2X("B.15");1q.2M("B.J")}if(H(1x)!="L"){1x.26("B.J",[])}1f{if(H(B.J)=="L"){14""}}1e(e){14"B.15 3F on B.J!"}if(H(B.15)=="L"){B.15={}}B.15.1r="B.15";B.15.1Y="1.3.1";B.J.2l(B.15,{1K:G(){F"["+D.1r+" "+D.1Y+"]"},1l:G(){F D.1K()},9W:G(1b,lk,lj,lh){B.15.9Y.5M(1b,lk,lj,lh)},1Q:G(3R,lg){u I=B.15;if(M.K==2){F I.9Z(G(a){F a!=lg},3R)}if(H(3R.1a)=="G"){F 3R}N{if(H(3R.1Q)=="G"){F 3R.1Q()}}1f{F I.9Y.3C(3R)}1e(e){u m=B.J;if(e==m.4d){e=Y 3p(H(3R)+": "+m.U(3R)+" is 2E vm")}14 e}},eu:G(n){if(!n){n=0}u m=B.J;F{U:G(){F"eu("+n+")"},1l:m.24("U"),1a:m.4f(n)}},et:G(p){u I=B.15;u m=B.J;u 1g=[];u lf=I.1Q(p);F{U:G(){F"et(...)"},1l:m.24("U"),1a:G(){1f{u W=lf.1a();1g.1c(W);F W}1e(e){if(e!=I.25){14 e}if(1g.K===0){D.1a=G(){14 I.25}}N{u i=-1;D.1a=G(){i=(i+1)%1g.K;F 1g[i]}}F D.1a()}}}},7b:G(Q,n){u m=B.J;if(H(n)=="L"){F{U:G(){F"7b("+m.U(Q)+")"},1l:m.24("U"),1a:G(){F Q}}}F{U:G(){F"7b("+m.U(Q)+", "+n+")"},1l:m.24("U"),1a:G(){if(n<=0){14 B.15.25}n-=1;F Q}}},1a:G(ld){F ld.1a()},es:G(p,q){u m=B.J;u 1a=B.15.1a;u lc=m.2r(1Q,M);F{U:G(){F"es(...)"},1l:m.24("U"),1a:G(){F m.2r(1a,lc)}}},a1:G(3b,1V){u m=B.J;1V=B.15.1Q(1V);if(3b===O){3b=m.4i.7L}F{U:G(){F"a1(...)"},1l:m.24("U"),1a:G(){1M(1h){u W=1V.1a();if(3b(W)){F W}}F L}}},a0:G(3b,1V){u m=B.J;1V=B.15.1Q(1V);if(3b===O){3b=m.4i.7L}F{U:G(){F"a0(...)"},1l:m.24("U"),1a:G(){1M(1h){u W=1V.1a();if(!3b(W)){F W}}F L}}},er:G(1V){u I=B.15;u m=B.J;1V=I.1Q(1V);u 5c=0;u 2J=0;u 3a=1;u i=-1;if(M.K==2){2J=M[1]}N{if(M.K==3){5c=M[1];2J=M[2]}N{5c=M[1];2J=M[2];3a=M[3]}}F{U:G(){F"er("+["...",5c,2J,3a].2b(", ")+")"},1l:m.24("U"),1a:G(){u W;1M(i<5c){W=1V.1a();i++}if(5c>=2J){14 I.25}5c+=3a;F W}}},4c:G(aa,p,q){u m=B.J;u I=B.15;u lb=m.2r(I.1Q,m.1R(O,M,1));u 2r=m.2r;u 1a=I.1a;F{U:G(){F"4c(...)"},1l:m.24("U"),1a:G(){F aa.1w(D,2r(1a,lb))}}},ep:G(aa,1V,I){1V=B.15.1Q(1V);u m=B.J;F{U:G(){F"ep(...)"},1l:m.24("U"),1a:G(){F aa.1w(I,1V.1a())}}},55:G(p,q){u I=B.15;u m=B.J;if(M.K==1){F I.1Q(M[0])}u 64=m.2r(I.1Q,M);F{U:G(){F"55(...)"},1l:m.24("U"),1a:G(){1M(64.K>1){1f{F 64[0].1a()}1e(e){if(e!=I.25){14 e}64.2P()}}if(64.K==1){u a9=64.2P();D.1a=m.1O("1a",a9);F D.1a()}14 I.25}}},9Z:G(3b,1V){u I=B.15;1V=I.1Q(1V);F{U:G(){F"9Z(...)"},1l:B.J.24("U"),1a:G(){u W=1V.1a();if(!3b(W)){D.1a=G(){14 I.25};D.1a()}F W}}},eo:G(3b,1V){1V=B.15.1Q(1V);u m=B.J;u 1O=m.1O;F{"U":G(){F"eo(...)"},"1l":m.24("U"),"1a":G(){1M(1h){u W=1V.1a();if(!3b(W)){2K}}D.1a=1O("1a",1V);F W}}},a7:G(63,2u,la){2u.62[63]=-1;u m=B.J;u l9=m.eI;F{U:G(){F"en("+63+", ...)"},1l:m.24("U"),1a:G(){u W;u i=2u.62[63];if(i==2u.29){W=la.1a();2u.a8.1c(W);2u.29+=1;2u.62[63]+=1}N{W=2u.a8[i-2u.2a];2u.62[63]+=1;if(i==2u.2a&&l9(2u.62)!=2u.2a){2u.2a+=1;2u.a8.2P()}}F W}}},en:G(a6,n){u W=[];u 2u={"62":[],"a8":[],"29":-1,"2a":-1};if(M.K==1){n=2}u I=B.15;a6=I.1Q(a6);u a7=I.a7;R(u i=0;i<n;i++){W.1c(a7(i,2u,a6))}F W},2G:G(4l){u m=B.J;if(H(4l.9T)=="G"){F 4l.9T()}N{if(m.3A(4l)){F m.2o(4l)}}u I=B.15;4l=I.1Q(4l);u W=[];1f{1M(1h){W.1c(4l.1a())}}1e(e){if(e!=I.25){14 e}F W}F L},7H:G(fn,7K,l8){u i=0;u x=l8;u I=B.15;7K=I.1Q(7K);if(M.K<3){1f{x=7K.1a()}1e(e){if(e==I.25){e=Y 3p("7H() of vl vk vj no vi 3m")}14 e}i++}1f{1M(1h){x=fn(x,7K.1a())}}1e(e){if(e!=I.25){14 e}}F x},7I:G(){u 4k=0;u 2J=0;u 3a=1;if(M.K==1){2J=M[0]}N{if(M.K==2){4k=M[0];2J=M[1]}N{if(M.K==3){4k=M[0];2J=M[1];3a=M[2]}N{14 Y 3p("7I() vh 1, 2, or 3 M!")}}}if(3a===0){14 Y 3p("7I() 3a 5p 2E be 0")}F{1a:G(){if((3a>0&&4k>=2J)||(3a<0&&4k<=2J)){14 B.15.25}u W=4k;4k+=3a;F W},U:G(){F"7I("+[4k,2J,3a].2b(", ")+")"},1l:B.J.24("U")}},l0:G(a5,l7){u x=l7||0;u I=B.15;a5=I.1Q(a5);1f{1M(1h){x+=a5.1a()}}1e(e){if(e!=I.25){14 e}}F x},em:G(a4){u I=B.15;a4=I.1Q(a4);1f{1M(1h){a4.1a()}}1e(e){if(e!=I.25){14 e}}},9a:G(7J,1A,I){u m=B.J;if(M.K>2){1A=m.1O(1A,I)}if(m.3A(7J)){1f{R(u i=0;i<7J.K;i++){1A(7J[i])}}1e(e){if(e!=B.15.25){14 e}}}N{I=B.15;I.em(I.4c(1A,7J))}},kZ:G(l6,1A){u I=B.15;1f{I.a0(1A,l6).1a();F 1m}1e(e){if(e!=I.25){14 e}F 1h}},kY:G(l5,4j){u W=B.15.2G(l5);if(M.K==1){4j=B.J.2f}W.iz(4j);F W},kX:G(l4){u W=B.15.2G(l4);W.vg();F W},kW:G(l3,1A){u I=B.15;1f{I.a1(1A,l3).1a();F 1h}1e(e){if(e!=I.25){14 e}F 1m}},kV:G(1g,5b){if(B.J.3A(5b)){R(u i=0;i<5b.K;i++){1g.1c(5b[i])}}N{u I=B.15;5b=I.1Q(5b);1f{1M(1h){1g.1c(5b.1a())}}1e(e){if(e!=I.25){14 e}}}F 1g},ek:G(a3,eH){u m=B.J;u I=B.15;if(M.K<2){eH=m.4i.eE}a3=I.1Q(a3);u pk=L;u k=L;u v;G eF(){v=a3.1a();k=eH(v)}G l2(){u 7j=v;v=L;F 7j}u eG=1h;F{U:G(){F"ek(...)"},1a:G(){1M(k==pk){eF();if(eG){eG=1m;2K}}pk=k;F[k,{1a:G(){if(v==L){eF()}if(k!=pk){14 I.25}F l2()}}]}}},kU:G(a2,eD){u m=B.J;u I=B.15;if(M.K<2){eD=m.4i.eE}a2=I.1Q(a2);u ey=[];u eA=1h;u ez;1M(1h){1f{u eB=a2.1a();u 2h=eD(eB)}1e(e){if(e==I.25){2K}14 e}if(eA||2h!=ez){u eC=[];ey.1c([2h,eC])}eC.1c(eB);eA=1m;ez=2h}F ey},9X:G(ex){u i=0;F{U:G(){F"9X(...)"},1l:B.J.24("U"),1a:G(){if(i>=ex.K){14 B.15.25}F ex[i++]}}},eh:G(ew){F(ew&&H(ew.ei)=="G")},9V:G(l1){F{U:G(){F"9V(...)"},1l:B.J.24("U"),1a:G(){u W=l1.ei();if(W===O||W===L){14 B.15.25}F W}}}});B.15.1W=["9Y","9X","eh","9V",];B.15.1z=["25","9W","1Q","eu","et","7b","1a","es","a1","a0","er","4c","ep","55","9Z","eo","en","2G","7H","7I","l0","em","9a","kZ","kY","kX","kW","kV","ek","kU"];B.15.2d=G(){u m=B.J;D.25=Y m.5a("25");D.9Y=Y m.4a();D.9W("ej",m.3A,D.9X);D.9W("ei",D.eh,D.9V);D.2k={":3e":D.1z,":1p":m.2o(D.1z,D.1W)};m.3f(D)};B.15.2d();if(!B.3d){7H=B.15.7H}B.J.2Y(D,B.15);if(H(1q)!="L"){1q.2X("B.1H");1q.2M("B.J")}if(H(1x)!="L"){1x.26("B.J",[])}1f{if(H(B.J)=="L"){14""}}1e(e){14"B.1H 3F on B.J!"}if(H(B.1H)=="L"){B.1H={}}B.1H.1r="B.1H";B.1H.1Y="1.3.1";B.1H.1K=G(){F"["+D.1r+" "+D.1Y+"]"};B.1H.1l=G(){F D.1K()};B.1H.1z=["5C","49","7A","kR","2L","5Z","kG","ch","kE","kC"];B.1H.1W=["ef","e8","e7"];B.1H.49=G(1P,kT,3z){D.1P=1P;D.3N=kT;D.3z=3z;D.vf=Y 3Q()};B.1H.49.1U={U:G(){u m=B.J;F"49("+m.2r(m.U,[D.1P,D.3N,D.3z]).2b(", ")+")"},1l:B.J.24("U")};B.J.2l(B.1H,{ef:G(7F){u I=B.1H;if(H(7F)=="1n"){7F=I.5C[7F]}F G(1t){u 7G=1t.3N;if(H(7G)=="1n"){7G=I.5C[7G]}F 7G>=7F}},e8:G(){u kS=B.1H.49;R(u i=0;i<M.K;i++){if(!(M[i]2C kS)){F 1m}}F 1h},e7:G(a,b){F B.J.2f([a.3N,a.3z],[b.3N,b.3z])},kR:G(1t){cq("1P: "+1t.1P+"\\ve: "+1t.3N+"\\vd: "+1t.3z.2b(" "))}});B.1H.7A=G(7E){D.4f=0;if(H(7E)=="L"||7E===O){7E=-1}D.ec=7E;D.4h=[];D.7C={};D.e5=1m};B.1H.7A.1U={vc:G(){D.4h.4y(0,D.4h.K)},kK:G(1t){if(H(2O)!="L"&&2O.eg&&2O.eg.5Z){2O.eg.5Z(1t)}N{if(H(7h)!="L"&&7h.kQ){7h.kQ(1t)}N{if(H(5X)=="G"){5X(1t)}}}},kL:G(1t){R(u k in D.7C){u 2n=D.7C[k];if(2n.kO!=k||(2n[0]&&!2n[0](1t))){2V}2n[1](1t)}},hE:G(ee,7D,kP){if(H(7D)=="1n"){7D=B.1H.ef(7D)}u ed=[7D,kP];ed.kO=ee;D.7C[ee]=ed},c9:G(kN){gi D.7C[kN]},kH:G(kM,vb){u 1t=Y B.1H.49(D.4f,kM,B.J.1R(O,M,1));D.4h.1c(1t);D.kL(1t);if(D.e5){D.kK(1t.3N+": "+1t.3z.2b(" "))}D.4f+=1;1M(D.ec>=0&&D.4h.K>D.ec){D.4h.2P()}},c8:G(9U){u ea=0;if(!(H(9U)=="L"||9U===O)){ea=28.29(0,D.4h.K-9U)}F D.4h.9T(ea)},kJ:G(7B){if(H(7B)=="L"||7B===O){7B=30}u 9S=D.c8(7B);if(9S.K){u 1g=2r(G(m){F"\\n  ["+m.1P+"] "+m.3N+": "+m.3z.2b(" ")},9S);1g.e9("va "+9S.K+" v9:");F 1g.2b("")}F""},v8:G(kI){if(H(B.1I)=="L"){cq(D.kJ())}N{B.1I.bY(kI||1m)}}};B.1H.2d=G(){D.5C={8M:40,8L:50,8K:30,8J:20,8I:10};u m=B.J;m.5u("49",D.e8,D.e7);u 61=m.2z;u e6=D.7A;u 60=e6.1U.kH;m.2l(D.7A.1U,{kF:61(60,"8I"),5Z:61(60,"8J"),dE:61(60,"8M"),kD:61(60,"8L"),kB:61(60,"8K")});u I=D;u 5Y=G(1b){F G(){I.2L[1b].1w(I.2L,M)}};D.5Z=5Y("5Z");D.kG=5Y("dE");D.ch=5Y("kF");D.kE=5Y("kD");D.kC=5Y("kB");D.2L=Y e6();D.2L.e5=1h;D.2k={":3e":D.1z,":1p":m.2o(D.1z,D.1W)};m.3f(D)};if(H(5X)=="L"&&H(2v)!="L"&&2v.kA&&H(kz)!="L"){5X=G(){5X.3G=M;u ev=2v.kA("v7");ev.v6("5X",1m,1h);kz(ev)}}B.1H.2d();B.J.2Y(D,B.1H);if(H(1q)!="L"){1q.2X("B.1D")}if(H(B)=="L"){B={}}if(H(B.1D)=="L"){B.1D={}}B.1D.1r="B.1D";B.1D.1Y="1.3.1";B.1D.1K=G(){F"["+D.1r+" "+D.1Y+"]"};B.1D.1l=G(){F D.1K()};B.1D.ks=G(1y){1y=1y+"";if(H(1y)!="1n"||1y.K===0){F O}u 7z=1y.2R("-");if(7z.K===0){F O}F Y 3Q(7z[0],7z[1]-1,7z[2])};B.1D.ky=/(\\d{4,})(?:-(\\d{1,2})(?:-(\\d{1,2})(?:[T ](\\d{1,2}):(\\d{1,2})(?::(\\d{1,2})(?:\\.(\\d+))?)?(?:(Z)|([+-])(\\d{1,2})(?::(\\d{1,2}))?)?)?)?)?/;B.1D.kr=G(1y){1y=1y+"";if(H(1y)!="1n"||1y.K===0){F O}u X=1y.3C(B.1D.ky);if(H(X)=="L"||X===O){F O}u 5W,7y,7x,9R,2a,9Q,7w;5W=3w(X[1],10);if(H(X[2])=="L"||X[2]===""){F Y 3Q(5W)}7y=3w(X[2],10)-1;7x=3w(X[3],10);if(H(X[4])=="L"||X[4]===""){F Y 3Q(5W,7y,7x)}9R=3w(X[4],10);2a=3w(X[5],10);9Q=(H(X[6])!="L"&&X[6]!=="")?3w(X[6],10):0;if(H(X[7])!="L"&&X[7]!==""){7w=28.ha(c5*4M("0."+X[7]))}N{7w=0}if((H(X[8])=="L"||X[8]==="")&&(H(X[9])=="L"||X[9]==="")){F Y 3Q(5W,7y,7x,9R,2a,9Q,7w)}u 58;if(H(X[9])!="L"&&X[9]!==""){58=3w(X[10],10)*v5;if(H(X[11])!="L"&&X[11]!==""){58+=3w(X[11],10)*kw}if(X[9]=="-"){58=-58}}N{58=0}F Y 3Q(3Q.v4(5W,7y,7x,9R,2a,9Q,7w)-58)};B.1D.dY=G(2g,kx){if(H(2g)=="L"||2g===O){F O}u hh=2g.v3();u mm=2g.v2();u ss=2g.v1();u 1g=[((kx&&(hh<10))?"0"+hh:hh),((mm<10)?"0"+mm:mm),((ss<10)?"0"+ss:ss)];F 1g.2b(":")};B.1D.kq=G(2g,7v){if(H(2g)=="L"||2g===O){F O}u ku=7v?"T":" ";u kt=7v?"Z":"";if(7v){2g=Y 3Q(2g.9P()+(2g.v0()*kw))}F B.1D.dX(2g)+ku+B.1D.dY(2g,7v)+kt};B.1D.dX=G(2g){if(H(2g)=="L"||2g===O){F O}u e4=B.1D.e3;F[2g.dZ(),e4(2g.e1()+1),e4(2g.e0())].2b("-")};B.1D.kp=G(d){d=d+"";if(H(d)!="1n"||d.K===0){F O}u a=d.2R("/");F Y 3Q(a[2],a[0]-1,a[1])};B.1D.e3=G(n){F(n>9)?n:"0"+n};B.1D.ko=G(d){if(H(d)=="L"||d===O){F O}u e2=B.1D.e3;F[e2(d.e1()+1),e2(d.e0()),d.dZ()].2b("/")};B.1D.kn=G(d){if(H(d)=="L"||d===O){F O}F[d.e1()+1,d.e0(),d.dZ()].2b("/")};B.1D.1z=["ks","kr","dY","kq","dX","kp","ko","kn"];B.1D.1W=[];B.1D.2k={":3e":B.1D.1z,":1p":B.1D.1z};B.1D.2d=G(){u 2w=D.1r+".";R(u k in D){u o=D[k];if(H(o)=="G"&&H(o.1r)=="L"){1f{o.1r=2w+k}1e(e){}}}};B.1D.2d();if(H(B.J)!="L"){B.J.2Y(D,B.1D)}N{(G(km,dW){if((H(1x)=="L"&&H(1q)=="L")||(H(B.3d)=="5L"&&B.3d)){u 1p=dW.2k[":1p"];R(u i=0;i<1p.K;i++){km[1p[i]]=dW[1p[i]]}}})(D,B.1D)}if(H(1q)!="L"){1q.2X("B.1s")}if(H(B)=="L"){B={}}if(H(B.1s)=="L"){B.1s={}}B.1s.1r="B.1s";B.1s.1Y="1.3.1";B.1s.1K=G(){F"["+D.1r+" "+D.1Y+"]"};B.1s.1l=G(){F D.1K()};B.1s.ke=G(kl,kk,kj,ki,kh,dV,kg,9N,kf){F G(1P){1P=4M(1P);if(H(1P)=="L"||1P===O||k8(1P)){F kl}u 9L=kk;u 9K=kj;if(1P<0){1P=-1P}N{9L=9L.23(/-/,"")}u me=M.2U;u 9M=B.1s.dJ(ki);if(kh){1P=1P*3k;9K=9M.9y+9K}1P=B.1s.dK(1P,dV);u 9O=1P.2R(/\\./);u 3r=9O[0];u 3P=(9O.K==1)?"":9O[1];u X="";1M(3r.K<kg){3r="0"+3r}if(9N){1M(3r.K>9N){u i=3r.K-9N;X=9M.9A+3r.2W(i,3r.K)+X;3r=3r.2W(0,i)}}X=3r+X;if(dV>0){1M(3P.K<kf){3P=3P+"0"}X=X+9M.9z+3P}F 9L+X+9K}};B.1s.k5=G(9J,9H,9G){if(H(9H)=="L"){9H=""}u 3q=9J.3C(/((?:[0#]+,)?[0#]+)(?:\\.([0#]+))?(%)?/);if(!3q){14 3p("uZ uY")}u 7u=9J.3H(0,3q.c6);u kd=9J.3H(3q.c6+3q[0].K);if(7u.uX(/-/)==-1){7u=7u+"-"}u 9I=3q[1];u 3P=(H(3q[2])=="1n"&&3q[2]!="")?3q[2]:"";u kc=(H(3q[3])=="1n"&&3q[3]!="");u dU=9I.2R(/,/);u 9F;if(H(9G)=="L"){9G="dG"}if(dU.K==1){9F=O}N{9F=dU[1].K}u ka=9I.K-9I.23(/0/g,"").K;u k9=3P.K-3P.23(/0/g,"").K;u kb=3P.K;u W=B.1s.ke(9H,7u,kd,9G,kc,kb,ka,9F,k9);u m=B.J;if(m){u fn=M.2U;u 3G=m.2o(M);W.U=G(){F[I.1r,"(",2r(m.U,3G).2b(", "),")"].2b("")}}F W};B.1s.dJ=G(4g){if(H(4g)=="L"||4g===O){4g="dG"}if(H(4g)=="1n"){u W=B.1s.5V[4g];if(H(W)=="1n"){W=M.2U(W);B.1s.5V[4g]=W}F W}N{F 4g}};B.1s.k4=G(dT,9E){if(9E){u X=dT/9E;if(!k8(X)){F B.1s.9B(dT/9E)}}F"0"};B.1s.9B=G(dS){u dR=(dS<0?"-":"");u s=28.8B(28.uW(dS)*3k).1l();if(s=="0"){F s}if(s.K<3){1M(s.3Z(s.K-1)=="0"){s=s.2W(0,s.K-1)}F dR+"0."+s}u 5E=dR+s.2W(0,s.K-2);u 7t=s.2W(s.K-2,s.K);if(7t=="uV"){F 5E}N{if(7t.3Z(1)=="0"){F 5E+"."+7t.3Z(0)}N{F 5E+"."+7t}}};B.1s.dI=G(1y,dQ){1y=1y+"";if(H(1y)!="1n"){F O}if(!dQ){F 1y.23(/^\\s+/,"")}N{F 1y.23(Y 8V("^["+dQ+"]+"),"")}};B.1s.dH=G(1y,dP){1y=1y+"";if(H(1y)!="1n"){F O}if(!dP){F 1y.23(/\\s+$/,"")}N{F 1y.23(Y 8V("["+dP+"]+$"),"")}};B.1s.k2=G(1y,dO){u I=B.1s;F I.dH(I.dI(1y,dO),dO)};B.1s.dL=G(9D,9C){9D=28.8B(9D*28.dN(10,9C));u X=(9D*28.dN(10,-9C)).6I(9C);if(X.3Z(0)=="."){X="0"+X}F X};B.1s.dK=G(k7,dM){F B.1s.dL(k7+0.5*28.dN(10,-dM),dM)};B.1s.k3=G(k6){F B.1s.9B(3k*k6)+"%"};B.1s.1z=["dL","dK","k5","dJ","k4","9B","k3","dI","dH","k2"];B.1s.5V={k1:{9A:",",9z:".",9y:"%"},uU:{9A:".",9z:",",9y:"%"},uT:{9A:" ",9z:",",9y:"%"},"dG":"k1"};B.1s.1W=[];B.1s.2k={":1p":B.1s.1z,":3e":B.1s.1z};B.1s.2d=G(){u 2w=D.1r+".";u k,v,o;R(k in D.5V){o=D.5V[k];if(H(o)=="3n"){o.U=G(){F D.1r};o.1r=2w+"5V."+k}}R(k in D){o=D[k];if(H(o)=="G"&&H(o.1r)=="L"){1f{o.1r=2w+k}1e(e){}}}};B.1s.2d();if(H(B.J)!="L"){B.J.2Y(D,B.1s)}N{(G(k0,dF){if((H(1x)=="L"&&H(1q)=="L")||(H(B.3d)=="5L"&&B.3d)){u 1p=dF.2k[":1p"];R(u i=0;i<1p.K;i++){k0[1p[i]]=dF[1p[i]]}}})(D,B.1s)}if(H(1q)!="L"){1q.2X("B.1k");1q.2M("B.J")}if(H(1x)!="L"){1x.26("B.J",[])}1f{if(H(B.J)=="L"){14""}}1e(e){14"B.1k 3F on B.J!"}if(H(B.1k)=="L"){B.1k={}}B.1k.1r="B.1k";B.1k.1Y="1.3.1";B.1k.1K=G(){F"["+D.1r+" "+D.1Y+"]"};B.1k.1l=G(){F D.1K()};B.1k.2t=G(jZ){D.55=[];D.id=D.7n();D.2H=-1;D.54=0;D.53=[O,O];D.7m=jZ;D.7l=1m;D.7r=1m};B.1k.2t.1U={U:G(){u 7s;if(D.2H==-1){7s="uS"}N{if(D.2H===0){7s="uR"}N{7s="dE"}}F"2t("+D.id+", "+7s+")"},1l:B.J.24("U"),7n:B.J.4f(),jY:G(){u I=B.1k;if(D.2H==-1){if(D.7m){D.7m(D)}N{D.7l=1h}if(D.2H==-1){D.52(Y I.di(D))}}N{if((D.2H===0)&&(D.53[0]2C I.2t)){D.53[0].jY()}}},jQ:G(){D.54++},jX:G(){D.54--;if((D.54===0)&&(D.2H>=0)){D.9u()}},jR:G(X){D.9x(X);D.jX()},9x:G(X){D.2H=((X 2C 2x)?1:0);D.53[D.2H]=X;D.9u()},dD:G(){if(D.2H!=-1){if(!D.7l){14 Y B.1k.dj(D)}D.7l=1m;F}},3o:G(X){D.dD();if(X 2C B.1k.2t){14 Y 2x("2t jW 9v aB be 7r if jV jU jT jS of a 3o")}D.9x(X)},52:G(X){D.dD();u I=B.1k;if(X 2C I.2t){14 Y 2x("2t jW 9v aB be 7r if jV jU jT jS of a 3o")}if(!(X 2C 2x)){X=Y I.9p(X)}D.9x(X)},jP:G(fn){if(M.K>1){fn=B.J.2z.1w(O,M)}F D.9w(fn,fn)},5Q:G(fn){if(M.K>1){fn=B.J.2z.1w(O,M)}F D.9w(fn,O)},jA:G(fn){if(M.K>1){fn=B.J.2z.1w(O,M)}F D.9w(O,fn)},9w:G(cb,eb){if(D.7r){14 Y 2x("uQ uP 9v 2E be re-uO")}D.55.1c([cb,eb]);if(D.2H>=0){D.9u()}F D},9u:G(){u dC=D.55;u 56=D.2H;u X=D.53[56];u I=D;u cb=O;1M(dC.K>0&&D.54===0){u 2n=dC.2P();u f=2n[56];if(f===O){2V}1f{X=f(X);56=((X 2C 2x)?1:0);if(X 2C B.1k.2t){cb=G(X){I.jR(X)};D.jQ()}}1e(3O){56=1;if(!(3O 2C 2x)){3O=Y B.1k.9p(3O)}X=3O}}D.2H=56;D.53[56]=X;if(cb&&D.54){X.jP(cb);X.7r=1h}}};B.J.2l(B.1k,{dk:G(){F dB("("+M[0].jN+")")},dp:G(uN){u d=Y B.1k.2t();d.3o.1w(d,M);F d},9q:G(uM){u d=Y B.1k.2t();d.52.1w(d,M);F d},do:G(){u I=M.2U;if(!I.7q){u dy=[G(){F Y 7q()},G(){F Y dA("jO.dz")},G(){F Y dA("uL.dz")},G(){F Y dA("jO.dz.4.0")},G(){14 Y B.1k.dh("uK uJ 2E uI 7q")}];R(u i=0;i<dy.K;i++){u 1A=dy[i];1f{I.7q=1A;F 1A()}1e(e){}}}F I.7q()},dx:G(){},jK:G(d){if(D.uH==4){1f{D.5T=O}1e(e){1f{D.5T=B.1k.dx}1e(e){}}u 5U=O;1f{5U=D.jm;if(!5U&&B.J.7e(D.jN)){5U=jM}}1e(e){}if(5U==hQ||5U==jM){d.3o(D)}N{u 3O=Y B.1k.dg(D,"uG uF");if(3O.2y){d.52(3O)}N{d.52(3O)}}}},jL:G(2s){1f{2s.5T=O}1e(e){1f{2s.5T=B.1k.dx}1e(e){}}2s.uE()},dl:G(2s,7p){if(H(7p)=="L"||7p===O){7p=""}u m=B.J;u I=B.1k;u d=Y I.2t(m.2z(I.jL,2s));1f{2s.5T=m.1O(I.jK,2s,d);2s.uD(7p)}1e(e){1f{2s.5T=O}1e(uC){}d.52(e)}F d},dn:G(5F){u I=B.1k;u 2s=I.do();if(M.K>1){u m=B.J;u qs=m.dw.1w(O,m.1R(O,M,1));if(qs){5F+="?"+qs}}2s.cp("uB",5F,1h);F I.dl(2s)},jv:G(5F){u I=B.1k;u d=I.dn.1w(I,M);d=d.5Q(I.dk);F d},dm:G(jJ,dv){u d=Y B.1k.2t();u m=B.J;if(H(dv)!="L"){d.5Q(G(){F dv})}u jI=uA(m.1O("3o",d),28.8B(jJ*c5));d.7m=G(){1f{uz(jI)}1e(e){}};F d},ju:G(jH,1A){u m=B.J;u jG=m.2z.1w(m,m.1R(O,M,1));F B.1k.dm(jH).5Q(G(X){F jG()})}});B.1k.5O=G(){D.5S=[];D.4e=1m;D.id=D.7n()};B.1k.5O.1U={bX:B.1k.5O,uy:G(){d=Y B.1k.2t();if(D.4e){D.5S.1c(d)}N{D.4e=1h;d.3o(D)}F d},jF:G(){if(!D.4e){14 3p("ux to jF an jE 5O")}D.4e=1m;if(D.5S.K>0){D.4e=1h;D.5S.2P().3o(D)}},7n:B.J.4f(),U:G(){u 9t;if(D.4e){9t="4e, "+D.5S.K+" 5S"}N{9t="jE"}F"5O("+D.id+", "+9t+")"},1l:B.J.24("U")};B.1k.7i=G(2G,du,jC,jB,jD){D.2G=2G;D.9r=Y 7o(D.2G.K);D.55=[];D.id=D.7n();D.2H=-1;D.54=0;D.53=[O,O];D.7m=jD;D.7l=1m;if(D.2G.K===0&&!du){D.3o(D.9r)}D.dr=0;D.jz=du;D.jy=jC;D.jx=jB;u 9s=0;B.J.2r(B.J.1O(G(d){d.5Q(B.J.1O(D.dt,D),9s,1h);d.jA(B.J.1O(D.dt,D),9s,1m);9s+=1},D),D.2G)};B.J.2l(B.1k.7i.1U,B.1k.2t.1U);B.J.2l(B.1k.7i.1U,{dt:G(ds,7k,5R){D.9r[ds]=[7k,5R];D.dr+=1;if(D.2H!==0){if(7k&&D.jz){D.3o([ds,5R])}N{if(!7k&&D.jy){D.52(5R)}N{if(D.dr==D.2G.K){D.3o(D.9r)}}}}if(!7k&&D.jx){5R=O}F 5R}});B.1k.jt=G(jw){u d=Y B.1k.7i(jw,1m,1h,1m);d.5Q(G(dq){u 7j=[];R(u i=0;i<dq.K;i++){7j.1c(dq[i][1])}F 7j});F d};B.1k.jr=G(1A){u I=B.1k;u 5P;1f{u r=1A.1w(O,B.J.1R([],M,1));if(r 2C I.2t){5P=r}N{if(r 2C 2x){5P=I.9q(r)}N{5P=I.dp(r)}}}1e(e){5P=I.9q(e)}F 5P};B.1k.1z=["dj","di","dh","9p","dg","2t","dp","9q","do","dn","jv","dm","ju","dl","5O","7i","jt","jr"];B.1k.1W=["dk"];B.1k.2d=G(){u m=B.J;u ne=m.2z(m.jq,D);ne("dj",G(jp){D.jo=jp});ne("di",G(jn){D.jo=jn});ne("dh",G(1t){D.43=1t});ne("9p",G(1t){D.43=1t});ne("dg",G(2s,1t){D.2s=2s;D.43=1t;1f{D.2y=2s.jm}1e(e){}});D.2k={":3e":D.1z,":1p":m.2o(D.1z,D.1W)};m.3f(D)};B.1k.2d();B.J.2Y(D,B.1k);if(H(1q)!="L"){1q.2X("B.S");1q.2M("B.15")}if(H(1x)!="L"){1x.26("B.15",[])}1f{if(H(B.15)=="L"){14""}}1e(e){14"B.S 3F on B.15!"}if(H(B.S)=="L"){B.S={}}B.S.1r="B.S";B.S.1Y="1.3.1";B.S.1K=G(){F"["+D.1r+" "+D.1Y+"]"};B.S.1l=G(){F D.1K()};B.S.1z=["d5","cr","b9","95","94","j3","9k","cX","cw","iT","iV","4X","9j","iQ","hS","cs","ia","i9","i8","i7","i6","i5","i4","hV","i3","i2","i1","cu","hW","ct","i0","hZ","hY","hX","P","io","il","ik","ij","cm","ih","ii","ig","ie","ic","cv","8d","A","6m","ib","1E","$","4q","aH","cO","cN","iM","5G","iK","9d","9e","iH","iD","9c","iB","cG","97","hU","hT","iw","jh","jb","j6","j5","jk","jl"];B.S.1W=["9b"];B.S.5N=G(w,h){D.w=w;D.h=h};B.S.5N.1U.U=G(){u U=B.J.U;F"{w: "+U(D.w)+", h: "+U(D.h)+"}"};B.S.5t=G(x,y){D.x=x;D.y=y};B.S.5t.1U.U=G(){u U=B.J.U;F"{x: "+U(D.x)+", y: "+U(D.y)+"}"};B.S.5t.1U.1l=G(){F D.U()};B.J.2l(B.S,{jl:G(Q,o){Q=B.S.1E(Q);B.S.4X(Q,{"1T":{"9o":o,"-hL-9o":o,"-uw-9o":o,"47":" uv(9o="+(o*3k)+")"}})},jk:G(){u d=Y B.S.5N();u w=B.S.3X;u b=B.S.1Z.5s;if(w.jj){d.w=w.jj;d.h=w.uu}N{if(b.dd.9n){d.w=b.dd.9n;d.h=b.dd.ji}N{if(b&&b.9n){d.w=b.9n;d.h=b.ji}}}F d},jh:G(Q){u I=B.S;if(H(Q.w)=="2y"||H(Q.h)=="2y"){F Y I.5N(Q.w||0,Q.h||0)}Q=I.1E(Q);if(!Q){F L}if(I.4q(Q,"3u")!="98"){F Y I.5N(Q.jg||0,Q.ci||0)}u s=Q.1T;u je=s.dc;u jf=s.6P;s.dc="fR";s.6P="j8";s.3u="";u jd=Q.jg;u jc=Q.ci;s.3u="98";s.6P=jf;s.dc=je;F Y I.5N(jd,jc)},jb:G(Q,4Z){u I=B.S;Q=I.1E(Q);if(!Q){F L}u c=Y I.5t(0,0);if(Q.x&&Q.y){c.x+=Q.x||0;c.y+=Q.y||0;F c}N{if(Q.3t===O||I.4q(Q,"3u")=="98"){F L}}u 51=O;u 2j=O;u d=B.S.1Z;u de=d.7Z;u b=d.5s;if(Q.ja){51=Q.ja();c.x+=51.2I+(de.6y||b.6y)-(de.8q||b.8q);c.y+=51.3D+(de.4C||b.4C)-(de.8p||b.8p)}N{if(d.j9){51=d.j9(Q);c.x+=51.x;c.y+=51.y}N{if(Q.8g){c.x+=Q.db;c.y+=Q.da;2j=Q.8g;if(2j!=Q){1M(2j){c.x+=2j.db;c.y+=2j.da;2j=2j.8g}}u ua=ut.us.8G();if((H(7h)!="L"&&4M(7h.ur())<9)||(ua.2A("uq")!=-1&&I.4q(Q,"6P")=="j8")){c.x-=b.db;c.y-=b.da}}}}if(H(4Z)!="L"){4Z=M.2U(4Z);if(4Z){c.x-=(4Z.x||0);c.y-=(4Z.y||0)}}if(Q.3t){2j=Q.3t}N{2j=O}1M(2j&&2j.j7!="uo"&&2j.j7!="co"){c.x-=2j.6y;c.y-=2j.4C;if(2j.3t){2j=2j.3t}N{2j=O}}F c},j6:G(Q,d9,7g){Q=B.S.1E(Q);if(H(7g)=="L"){7g="px"}B.S.4X(Q,{"1T":{"5A":d9.w+7g,"3V":d9.h+7g}})},j5:G(Q,d8,7f){Q=B.S.1E(Q);if(H(7f)=="L"){7f="px"}B.S.4X(Q,{"1T":{"2I":d8.x+7f,"3D":d8.y+7f}})},cr:G(){F B.S.3X},b9:G(){F B.S.1Z},95:G(2m,1A){u I=B.S;u d6=I.1Z;u d7=I.un;u W;1f{I.3X=2m;I.1Z=2m.2v;W=1A()}1e(e){I.3X=d7;I.1Z=d6;14 e}I.3X=d7;I.1Z=d6;F W},d5:G(Q){u 7d=[];u 7c=[];u m=B.J;u I=B.S;if(H(Q)=="L"||Q===O){Q=I.1Z}N{Q=I.1E(Q)}m.d4(Q,G(Q){u 1b=Q.1b;if(m.7e(1b)){u 4Y=Q.cD;if(4Y=="cv"&&(Q.1J=="um"||Q.1J=="uk")&&!Q.ip){F O}if(4Y=="ct"){if(Q.j4>=0){u 9m=Q.1S[Q.j4];7d.1c(1b);7c.1c((9m.3m)?9m.3m:9m.7X);F O}7d.1c(1b);7c.1c("");F O}if(4Y=="cu"||4Y=="P"||4Y=="8d"||4Y=="6m"){F Q.5h}7d.1c(1b);7c.1c(Q.3m||"");F O}F Q.5h});F[7d,7c]},94:G(1N,1A){u I=B.S;u d3=I.1Z;u W;1f{I.1Z=1N;W=1A()}1e(e){I.1Z=d3;14 e}I.1Z=d3;F W},j3:G(1b,j2,3y,j1){B.S.9b.5M(1b,j2,3y,j1)},9k:G(1j,7a){u im=B.15;u I=B.S;u 1Q=im.1Q;u iY=im.7b;u 4c=im.4c;u iX=I.9b;u iZ=I.9k;u iW=B.J.4d;1M(1h){if(H(1j)=="L"||1j===O){F O}if(H(1j.3T)!="L"&&1j.3T>0){F 1j}if(H(1j)=="2y"||H(1j)=="5L"){1j=1j.1l()}if(H(1j)=="1n"){F I.1Z.4S(1j)}if(H(1j.j0)=="G"){1j=1j.j0(7a);2V}if(H(1j)=="G"){1j=1j(7a);2V}u 9l=O;1f{9l=1Q(1j)}1e(e){}if(9l){F 4c(iZ,9l,iY(7a))}1f{1j=iX.3C(1j,7a);2V}1e(e){if(e!=iW){14 e}}F I.1Z.4S(1j.1l())}F L},iV:G(1j,79,iU){u o={};o[79]=iU;1f{F B.S.4X(1j,o)}1e(e){}F O},iT:G(1j,79){u I=B.S;u d2=I.4U.99[79];1j=I.1E(1j);1f{if(d2){F 1j[d2]}F 1j.fm(79)}1e(e){}F O},4X:G(1j,5K){u Q=1j;u I=B.S;if(H(1j)=="1n"){Q=I.1E(1j)}if(5K){u d0=B.J.8Z;if(I.4U.6X){R(u k in 5K){u v=5K[k];if(H(v)=="3n"&&H(Q[k])=="3n"){d0(Q[k],v)}N{if(k.2W(0,2)=="on"){if(H(v)=="1n"){v=Y cZ(v)}Q[k]=v}N{Q.4p(k,v)}}}}N{u iS=I.4U.99;R(k in 5K){v=5K[k];u d1=iS[k];if(k=="1T"&&H(v)=="1n"){Q.1T.3x=v}N{if(H(d1)=="1n"){Q[d1]=v}N{if(H(Q[k])=="3n"&&H(v)=="3n"){d0(Q[k],v)}N{if(k.2W(0,2)=="on"){if(H(v)=="1n"){v=Y cZ(v)}Q[k]=v}N{Q.4p(k,v)}}}}}}}F Q},9j:G(1j){u Q=1j;u I=B.S;if(H(1j)=="1n"){Q=I.1E(1j)}u 78=[I.9k(B.J.1R(O,M,1),Q)];u iR=B.J.2o;1M(78.K){u n=78.2P();if(H(n)=="L"||n===O){}N{if(H(n.3T)=="2y"){Q.2c(n)}N{78=iR(n,78)}}}F Q},iQ:G(1j){u Q=1j;u I=B.S;if(H(1j)=="1n"){Q=I.1E(1j);M[0]=Q}u cY;1M((cY=Q.6n)){Q.6S(cY)}if(M.K<2){F Q}N{F I.9j.1w(D,M)}},cX:G(1b,4b){u Q;u I=B.S;u m=B.J;if(H(4b)=="1n"||H(4b)=="2y"){u 3G=m.1R([1b,O],M,1);F M.2U.1w(D,3G)}if(H(1b)=="1n"){if(4b&&"1b"in 4b&&!I.4U.6X){1b=("<"+1b+" 1b=\\""+I.9c(4b.1b)+"\\">")}Q=I.1Z.2S(1b)}N{Q=1b}if(4b){I.4X(Q,4b)}if(M.K<=2){F Q}N{u 3G=m.1R([Q],M,2);F I.9j.1w(D,3G)}},cw:G(){u m=B.J;F m.2z.1w(D,m.1R([B.S.cX],M))},cs:G(5J,1d){u I=B.S;5J=I.1E(5J);u cW=5J.3t;if(1d){1d=I.1E(1d);cW.uj(1d,5J)}N{cW.6S(5J)}F 1d},1E:G(id){u I=B.S;if(M.K==1){F((H(id)=="1n")?I.1Z.hN(id):id)}N{F B.J.2r(I.1E,M)}},4q:G(iP,cV,cU){if(M.K==2){cU=cV}u I=B.S;u el=I.1E(iP);u 77=I.1Z;if(!el||el==77){F L}if(el.iO){F el.iO[cV]}if(H(77.5k)=="L"){F L}if(77.5k===O){F L}u 9i=77.5k.g4(el,O);if(H(9i)=="L"||9i===O){F L}F 9i.6q(cU)},aH:G(76,9g,4W){u I=B.S;if(H(76)=="L"||76===O){76="*"}if(H(4W)=="L"||4W===O){4W=I.1Z}4W=I.1E(4W);u 9h=(4W.fr(76)||I.1Z.1p);if(H(9g)=="L"||9g===O){F B.J.1R(O,9h)}u cR=[];R(u i=0;i<9h.K;i++){u cS=9h[i];u cT=cS.3M.2R(" ");R(u j=0;j<cT.K;j++){if(cT[j]==9g){cR.1c(cS);2K}}}F cR},iN:G(5I,9f){u W=G(){u cQ=M.2U.5H;R(u i=0;i<cQ.K;i++){if(cQ[i].1w(D,M)===1m){2K}}if(9f){1f{D[5I]=O}1e(e){}}};W.5H=[];F W},cO:G(cP,5I,1A,9f){u I=B.S;u 4V=cP[5I];u 75=4V;if(!(H(4V)=="G"&&H(4V.5H)=="3n"&&4V.5H!==O)){75=I.iN(5I,9f);if(H(4V)=="G"){75.5H.1c(4V)}cP[5I]=75}75.5H.1c(1A)},cN:G(1A){u I=B.S;I.cO(I.3X,"gh",1A,1h)},iM:G(74){u I=B.S;I.cN(G(){74=I.1E(74);if(74){74.ui()}})},5G:G(iL,cM){u I=B.S;u 1i=I.1E(iL);if(I.4U.6X){1i.4p("iq",cM)}N{1i.4p("3M",cM)}},iK:G(cL){u I=B.S;R(u i=1;i<M.K;i++){u 1i=I.1E(M[i]);if(!I.9d(1i,cL)){I.9e(1i,cL)}}},9d:G(iJ,73){u I=B.S;u 1i=I.1E(iJ);u 2F=1i.3M;if(2F.K===0){I.5G(1i,73);F 1h}if(2F==73){F 1m}u cK=1i.3M.2R(" ");R(u i=0;i<cK.K;i++){if(cK[i]==73){F 1m}}I.5G(1i,2F+" "+73);F 1h},9e:G(iI,cJ){u I=B.S;u 1i=I.1E(iI);u 2F=1i.3M;if(2F.K===0){F 1m}if(2F==cJ){I.5G(1i,"");F 1h}u 72=1i.3M.2R(" ");R(u i=0;i<72.K;i++){if(72[i]==cJ){72.4y(i,1);I.5G(1i,72.2b(" "));F 1h}}F 1m},iH:G(iG,iF,iE){u 1i=B.S.1E(iG);u X=B.S.9e(1i,iF);if(X){B.S.9d(1i,iE)}F X},iD:G(iC,uh){u 1i=B.S.1E(iC);u cI=1i.3M.2R(" ");R(u i=1;i<M.K;i++){u cH=1m;R(u j=0;j<cI.K;j++){if(cI[j]==M[i]){cH=1h;2K}}if(!cH){F 1m}}F 1h},9c:G(s){F s.23(/&/g,"&ug;").23(/"/g,"&uf;").23(/</g,"&lt;").23(/>/g,"&gt;")},iB:G(2q){F B.S.cG(2q).2b("")},cG:G(2q,1g){if(H(1g)=="L"||1g===O){1g=[]}u 70=[2q];u I=B.S;u cB=I.9c;u iA=I.4U;1M(70.K){2q=70.hP();if(H(2q)=="1n"){1g.1c(2q)}N{if(2q.3T==1){1g.1c("<"+2q.cD.8G());u 71=[];u cF=iA(2q);R(u i=0;i<cF.K;i++){u a=cF[i];71.1c([" ",a.1b,"=\\"",cB(a.3m),"\\""])}71.iz();R(i=0;i<71.K;i++){u cE=71[i];R(u j=0;j<cE.K;j++){1g.1c(cE[j])}}if(2q.ue()){1g.1c(">");70.1c("</"+2q.cD.8G()+">");u cC=2q.5h;R(i=cC.K-1;i>=0;i--){70.1c(cC[i])}}N{1g.1c("/>")}}N{if(2q.3T==3){1g.1c(cB(2q.iv))}}}}F 1g},97:G(ix,cA){u m=B.J;u iy=m.1R(O,M,1);B.15.9a(m.47(O,m.2r(B.S.1E,iy)),G(cA){cA.1T.3u=ix})},iw:G(1j,iu){u W=[];(G(1j){u cn=1j.5h;if(cn){R(u i=0;i<cn.K;i++){M.2U.cz(D,cn[i])}}u cy=1j.iv;if(H(cy)=="1n"){W.1c(cy)}})(B.S.1E(1j));if(iu){F W}N{F W.2b("")}},2d:G(2m){u m=B.J;D.1Z=2v;D.3X=2m;D.9b=Y m.4a();u 6Z=D.1Z.2S("cj");u 2T;if(6Z&&6Z.6Y&&6Z.6Y.K>0){u it=m.47;2T=G(1j){F it(2T.ir,1j.6Y)};2T.cx={};B.15.9a(6Z.6Y,G(a){2T.cx[a.1b]=a.3m});2T.ir=G(a){F(2T.cx[a.1b]!=a.3m)};2T.6X=1m;2T.99={"iq":"3M","ip":"ud","uc":"ub","R":"u9"}}N{2T=G(1j){F 1j.6Y};2T.6X=1h;2T.99={}}D.4U=2T;u 1C=D.cw;D.io=1C("ul");D.il=1C("ol");D.ik=1C("li");D.ij=1C("td");D.cm=1C("tr");D.ii=1C("u8");D.ih=1C("u7");D.ig=1C("u6");D.ie=1C("u5");D.ic=1C("th");D.cv=1C("ck");D.8d=1C("cj");D.A=1C("a");D.6m=1C("4u");D.ib=1C("u4");D.ia=1C("2e");D.i9=1C("tt");D.i8=1C("4O");D.i7=1C("h1");D.i6=1C("h2");D.i5=1C("h3");D.i4=1C("br");D.i3=1C("hr");D.i2=1C("u3");D.i1=1C("u2");D.cu=1C("u1");D.P=1C("p");D.ct=1C("u0");D.i0=1C("hJ");D.hZ=1C("tZ");D.hY=1C("tY");D.hX=1C("tX");D.hW=1C("tW");D.hV=1C("tV");D.hU=m.2z(D.97,"98");D.hT=m.2z(D.97,"8c");D.hS=D.cs;D.$=D.1E;D.2k={":3e":D.1z,":1p":m.2o(D.1z,D.1W)};m.3f(D)}});B.S.2d(((H(2O)=="L")?D:2O));if(!B.3d){95=B.S.95;94=B.S.94}B.J.2Y(D,B.S);if(H(1q)!="L"){1q.2X("B.1I");1q.2M("B.1H");1q.2M("B.J")}if(H(1x)!="L"){1x.26("B.1H",[]);1x.26("B.J",[])}1f{if(H(B.J)=="L"||H(B.1H)=="L"){14""}}1e(e){14"B.1I 3F on B.J 3W B.1H!"}if(H(B.1I)=="L"){B.1I={}}B.1I.1r="B.1I";B.1I.1Y="1.3.1";B.1I.1K=G(){F"["+D.1r+" "+D.1Y+"]"};B.1I.1l=G(){F D.1K()};B.1I.bY=G(6W){u m=B.1I;6W=!(!6W);if(m.3l&&m.3l.8Q!=6W){m.3l.hA();m.3l=O}if(!m.3l||m.3l.8P){m.3l=Y m.1I(6W,B.1H.2L)}F m.3l};B.1I.1I=G(4R,6V){if(H(6V)=="L"||6V===O){6V=B.1H.2L}D.2L=6V;u tU=B.J.2l;u c3=B.J.8Z;u 1O=B.J.1O;u hM=B.J.4L;u 2m=2O;u 6U="tT";if(H(B.S)!="L"){2m=B.S.cr()}if(!4R){u 5F=2m.tS.tR.2R("?")[0].23(/[:\\/.><&]/g,"hR");u 1b=6U+"hR"+5F;u 5D=2m.cp("",1b,"tQ,tP,3V=hQ");if(!5D){cq("tO tN to cp tM 2O tL to hP-up tK.");F L}5D.2v.fl("<!tJ co tI \\"-//tH//tG co 4.0 tF//tE\\" "+"\\"fq://fp.tD.fo/cm/tC/tB.tA\\">"+"<hO><5E><8Y>[B.1I]</8Y></5E>"+"<5s></5s></hO>");5D.2v.hG();5D.2v.8Y+=" "+2m.2v.8Y;2m=5D}u 1N=2m.2v;D.1N=1N;u 21=1N.hN(6U);u c4=!!21;if(21&&H(21.5B)!="L"){21.5B.2L=D.2L;21.5B.6K();F 21.5B}if(c4){u cl;1M((cl=21.6n)){21.6S(cl)}}N{21=1N.2S("4u");21.id=6U}21.5B=D;u 8T=1N.2S("ck");u 8S=1N.2S("ck");u 6O=1N.2S("2e");u 6N=1N.2S("2e");u 6M=1N.2S("2e");u 6L=1N.2S("2e");u 3L=1N.2S("4u");u 42=1N.2S("4u");u 8U=6U+"tz";D.8N=hM(D.8N);u 4T=[];u 6R=O;u cf=G(1t){u 6T=1t.3N;if(H(6T)=="2y"){6T=B.1H.5C[6T]}F 6T};u cd=G(1t){F 1t.3z.2b(" ")};u ca=1O(G(1t){u 8W=cf(1t);u 7X=cd(1t);u c=D.8N[8W];u p=1N.2S("cj");p.3M="B-49 B-5C-"+8W;p.1T.3x="ty: 2N; 4F-8X: -hL-4O-3y; 4F-8X: -o-4O-3y; 4F-8X: 4O-3y; 4F-8X: 4O-tx; hK-3y: 2K-hK; 3y-hJ: tw; 3U: "+c;p.2c(1N.4S(8W+": "+7X));42.2c(p);42.2c(1N.2S("br"));if(3L.ci>3L.hI){3L.4C=0}N{3L.4C=3L.hI}},D);u hD=G(1t){4T[4T.K]=1t;ca(1t)};u hF=G(){u cg,ce;1f{cg=Y 8V(8T.3m);ce=Y 8V(8S.3m)}1e(e){ch("2x in 47 tv: "+e.43);F O}F G(1t){F(cg.hH(cf(1t))&&ce.hH(cd(1t)))}};u cc=G(){1M(42.6n){42.6S(42.6n)}};u hB=G(){4T=[];cc()};u bZ=1O(G(){if(D.8P){F}D.8P=1h;if(B.1I.3l==D){B.1I.3l=O}D.2L.c9(8U);21.5B=O;if(4R){21.3t.6S(21)}N{D.2m.hG()}},D);u c7=G(){cc();R(u i=0;i<4T.K;i++){u 1t=4T[i];if(6R===O||6R(1t)){ca(1t)}}};D.6K=G(){6R=hF();c7();D.2L.c9(8U);D.2L.hE(8U,6R,hD)};u c0=1O(G(){4T=D.2L.c8();c7()},D);u c2=1O(G(6Q){6Q=6Q||2O.6D;2h=6Q.6w||6Q.8t;if(2h==13){D.6K()}},D);u 31="3u: 8c; z-c6: c5; 2I: 2N; 6f: 2N; 6P: tu; 5A: 3k%; he-3U: 4F; c1: "+D.8O;if(4R){31+="; 3V: ts; 3E-3D: fO 8a 8y"}N{31+="; 3V: 3k%;"}21.1T.3x=31;if(!c4){1N.5s.2c(21)}31={"3x":"5A: 33%; 3u: 8Q; c1: "+D.8O};c3(8T,{"3m":"8L|8M|8K|8J|8I","hC":c2,"1T":31});21.2c(8T);c3(8S,{"3m":".*","hC":c2,"1T":31});21.2c(8S);31="5A: 8%; 3u:8Q; c1: "+D.8O;6O.2c(1N.4S("tq"));6O.8R=1O("6K",D);6O.1T.3x=31;21.2c(6O);6N.2c(1N.4S("tp"));6N.8R=c0;6N.1T.3x=31;21.2c(6N);6M.2c(1N.4S("tn"));6M.8R=hB;6M.1T.3x=31;21.2c(6M);6L.2c(1N.4S("tm"));6L.8R=bZ;6L.1T.3x=31;21.2c(6L);3L.1T.3x="fS: tk; 5A: 3k%";42.1T.3x="5A: 3k%; 3V: "+(4R?"tj":"3k%");3L.2c(42);21.2c(3L);D.6K();c0();if(4R){D.2m=L}N{D.2m=2m}D.8Q=4R;D.hA=bZ;D.8P=1m;F D};B.1I.1I.1U={"8O":"ti tg,tf-te","8N":{"8M":"1v","8L":"gU","8K":"1F","8J":"8y","8I":"bx"}};B.1I.1W=["1I"];B.1I.1z=["bY"];B.1I.2d=G(){D.2k={":3e":D.1z,":1p":B.J.2o(D.1z,D.1W)};B.J.3f(D);B.1I.3l=O};B.1I.2d();B.J.2Y(D,B.1I);if(H(1q)!="L"){1q.2X("B.V");1q.2M("B.J")}if(H(1x)!="L"){1x.26("B.J",[])}1f{if(H(B.J)=="L"){14""}}1e(e){14"B.V 3F on B.J"}if(H(B.V)=="L"){B.V={}}B.V.1r="B.V";B.V.1Y="1.3.1";B.V.1K=G(){F"["+D.1r+" "+D.1Y+"]"};B.V.1l=G(){F D.1K()};B.V.V=G(1v,hz,1F,6J){if(H(6J)=="L"||6J===O){6J=1}D.1B={r:1v,g:hz,b:1F,a:6J}};B.V.V.1U={bX:B.V.V,tc:G(hy){u 1B=D.1B;u m=B.V;F m.V.3Y(1B.r,1B.g,1B.b,hy)},tb:G(1o){u 1G=D.41();1G.h=1o;u m=B.V;F m.V.4H(1G)},ta:G(hx){u 1G=D.41();1G.s=hx;u m=B.V;F m.V.4H(1G)},t9:G(hw){u 1G=D.41();1G.l=hw;u m=B.V;F m.V.4H(1G)},t8:G(hv){u 1G=D.41();1G.l=28.29(1G.l-hv,0);u m=B.V;F m.V.4H(1G)},t7:G(hu){u 1G=D.41();1G.l=28.2a(1G.l+hu,1);u m=B.V;F m.V.4H(1G)},fJ:G(ht,5z){if(H(5z)=="L"||5z===O){5z=0.5}u sf=1-5z;u s=D.1B;u d=ht.1B;u df=5z;F B.V.V.3Y((s.r*sf)+(d.r*df),(s.g*sf)+(d.g*df),(s.b*sf)+(d.b*df),(s.a*sf)+(d.a*df))},h4:G(hs){u a=D.6r();u b=hs.6r();F B.J.2f([a.r,a.g,a.b,a.a],[b.r,b.g,b.b,b.a])},hq:G(){F D.41().b>0.5},t6:G(){F(!D.hq())},t5:G(){u c=D.41();u 2Z=B.V.6F;u W=D.ho;if(!W){u 5y=(2Z(c.h,bF).6I(0)+","+2Z(c.s,3k).hp(4)+"%"+","+2Z(c.l,3k).hp(4)+"%");u a=c.a;if(a>=1){a=1;W="1G("+5y+")"}N{if(a<=0){a=0}W="t4("+5y+","+a+")"}D.ho=W}F W},hl:G(){u c=D.1B;u 2Z=B.V.6F;u W=D.hn;if(!W){u 5y=(2Z(c.r,3h).6I(0)+","+2Z(c.g,3h).6I(0)+","+2Z(c.b,3h).6I(0));if(c.a!=1){W="t3("+5y+","+c.a+")"}N{W="1B("+5y+")"}D.hn=W}F W},6r:G(){F B.J.4L(D.1B)},t2:G(){u m=B.V;u c=D.1B;u 2Z=B.V.6F;u W=D.hm;if(!W){W=("#"+m.6E(2Z(c.r,3h))+m.6E(2Z(c.g,3h))+m.6E(2Z(c.b,3h)));D.hm=W}F W},t1:G(){u 2Q=D.2Q;u c=D.1B;if(H(2Q)=="L"||2Q===O){2Q=B.V.bA(D.1B);D.2Q=2Q}F B.J.4L(2Q)},41:G(){u 1G=D.1G;u c=D.1B;if(H(1G)=="L"||1G===O){1G=B.V.bC(D.1B);D.1G=1G}F B.J.4L(1G)},1l:G(){F D.hl()},U:G(){u c=D.1B;u hk=[c.r,c.g,c.b,c.a];F D.bX.1r+"("+hk.2b(", ")+")"}};B.J.2l(B.V.V,{3Y:G(1v,bW,1F,8H){u hj=B.V.V;if(M.K==1){u 1B=1v;1v=1B.r;bW=1B.g;1F=1B.b;if(H(1B.a)=="L"){8H=L}N{8H=1B.a}}F Y hj(1v,bW,1F,8H)},4H:G(1o,t0,sZ,sY){u m=B.V;F m.V.3Y(m.bB.1w(m,M))},sX:G(1o,sW,sV,sU){u m=B.V;F m.V.3Y(m.bz.1w(m,M))},hi:G(1b){u 8F=B.V.V;if(1b.3Z(0)=="\\""){1b=1b.3H(1,1b.K-2)}u bV=8F.by[1b.8G()];if(H(bV)=="1n"){F 8F.bT(bV)}N{if(1b=="aP"){F 8F.sT()}}F O},8f:G(4Q){u I=B.V.V;u bU=4Q.3H(0,3);if(bU=="1B"){F I.h9(4Q)}N{if(bU=="1G"){F I.h8(4Q)}N{if(4Q.3Z(0)=="#"){F I.bT(4Q)}}}F I.hi(4Q)},bT:G(4P){if(4P.3Z(0)=="#"){4P=4P.2W(1)}u 8E=[];u i,5x;if(4P.K==3){R(i=0;i<3;i++){5x=4P.3H(i,1);8E.1c(3w(5x+5x,16)/3h)}}N{R(i=0;i<6;i+=2){5x=4P.3H(i,2);8E.1c(3w(5x,16)/3h)}}u bS=B.V.V;F bS.3Y.1w(bS,8E)},bG:G(4O,hf,hg,4N){if(4N.2A(4O)===0){4N=4N.2W(4N.2A("(",3)+1,4N.K-1)}u bR=4N.2R(/\\s*,\\s*/);u bP=[];R(u i=0;i<bR.K;i++){u c=bR[i];u 2i;u bQ=c.2W(c.K-3);if(c.3Z(c.K-1)=="%"){2i=0.bE*4M(c.2W(0,c.K-1))}N{if(bQ=="sS"){2i=4M(c)/bF}N{if(bQ=="sR"){2i=4M(c)/(28.sQ*2)}N{2i=hg[i]*4M(c)}}}bP.1c(2i)}F D[hf].1w(D,bP)},bN:G(Q,sP,sO){u d=B.S;u 2F=B.V.V;R(Q=d.1E(Q);Q;Q=Q.3t){u bO=d.4q.1w(d,M);if(!bO){2V}u 8D=2F.8f(bO);if(!8D){2K}if(8D.6r().a>0){F 8D}}F O},ba:G(Q){u 2F=B.V.V;F 2F.bN(Q,"aZ","he-3U")||2F.sN()},sM:G(Q){u 2F=B.V.V;F 2F.bN(Q,"3U","3U")||2F.sL()},sK:G(){F B.J.4L(B.V.V.by)}});B.J.2l(B.V,{6F:G(v,8C){v*=8C;if(v<0){F 0}N{if(v>8C){F 8C}N{F v}}},hc:G(n1,n2,1o){if(1o>6){1o-=6}N{if(1o<0){1o+=6}}u 2i;if(1o<1){2i=n1+(n2-n1)*1o}N{if(1o<3){2i=n2}N{if(1o<4){2i=n1+(n2-n1)*(4-1o)}N{2i=n1}}}F 2i},bz:G(1o,5w,3i,bM){if(M.K==1){u 2Q=1o;1o=2Q.h;5w=2Q.s;3i=2Q.v;bM=2Q.a}u 1v;u 3K;u 1F;if(5w===0){1v=0;3K=0;1F=0}N{u i=28.8B(1o*6);u f=(1o*6)-i;u p=3i*(1-5w);u q=3i*(1-(5w*f));u t=3i*(1-(5w*(1-f)));hd(i){3j 1:1v=q;3K=3i;1F=p;2K;3j 2:1v=p;3K=3i;1F=t;2K;3j 3:1v=p;3K=q;1F=3i;2K;3j 4:1v=t;3K=p;1F=3i;2K;3j 5:1v=3i;3K=p;1F=q;2K;3j 6:3j 0:1v=3i;3K=t;1F=p;2K}}F{r:1v,g:3K,b:1F,a:bM}},bB:G(1o,5v,3v,bL){if(M.K==1){u 1G=1o;1o=1G.h;5v=1G.s;3v=1G.l;bL=1G.a}u 1v;u 8A;u 1F;if(5v===0){1v=3v;8A=3v;1F=3v}N{u m2;if(3v<=0.5){m2=3v*(1+5v)}N{m2=3v+5v-(3v*5v)}u m1=(2*3v)-m2;u f=B.V.hc;u h6=1o*6;1v=f(m1,m2,h6+2);8A=f(m1,m2,h6);1F=f(m1,m2,h6-2)}F{r:1v,g:8A,b:1F,a:bL}},bA:G(1v,4K,1F,bK){if(M.K==1){u 1B=1v;1v=1B.r;4K=1B.g;1F=1B.b;bK=1B.a}u 29=28.29(28.29(1v,4K),1F);u 2a=28.2a(28.2a(1v,4K),1F);u 1o;u 8z;u hb=29;if(2a==29){1o=0;8z=0}N{u 6H=(29-2a);8z=6H/29;if(1v==29){1o=(4K-1F)/6H}N{if(4K==29){1o=2+((1F-1v)/6H)}N{1o=4+((1v-4K)/6H)}}1o/=6;if(1o<0){1o+=1}if(1o>1){1o-=1}}F{h:1o,s:8z,v:hb,a:bK}},bC:G(1v,4J,1F,bI){if(M.K==1){u 1B=1v;1v=1B.r;4J=1B.g;1F=1B.b;bI=1B.a}u 29=28.29(1v,28.29(4J,1F));u 2a=28.2a(1v,28.2a(4J,1F));u 1o;u 6G;u bJ=(29+2a)/2;u 4I=29-2a;if(4I===0){1o=0;6G=0}N{if(bJ<=0.5){6G=4I/(29+2a)}N{6G=4I/(2-29-2a)}if(1v==29){1o=(4J-1F)/4I}N{if(4J==29){1o=2+((1F-1v)/4I)}N{1o=4+((1v-4J)/4I)}}1o/=6;if(1o<0){1o+=1}if(1o>1){1o-=1}}F{h:1o,s:6G,l:bJ,a:bI}},6E:G(1P){1P=28.ha(1P);u bH=1P.1l(16);if(1P<16){F"0"+bH}F bH},2d:G(){u m=B.J;D.V.h9=m.1O(D.V.bG,D.V,"1B","3Y",[1/3h,1/3h,1/3h,1]);D.V.h8=m.1O(D.V.bG,D.V,"1G","4H",[1/bF,0.bE,0.bE,1]);u 4G=1/3;u bD={8y:[0,0,0],1F:[0,0,1],gY:[0.6,0.4,0.2],gX:[0,1,1],sJ:[4G,4G,4G],gR:[0.5,0.5,0.5],bx:[0,1,0],sI:[2*4G,2*4G,2*4G],gN:[1,0,1],gL:[1,0.5,0],gK:[0.5,0,0.5],1v:[1,0,0],aP:[0,0,0,0],4F:[1,1,1],gI:[1,1,0]};u h7=G(1b,r,g,b,a){u W=D.3Y(r,g,b,a);D[1b]=G(){F W};F W};R(u k in bD){u 1b=k+"V";u h5=m.2o([h7,D.V,1b],bD[k]);D.V[1b]=m.1O.1w(O,h5)}u h0=G(){R(u i=0;i<M.K;i++){if(!(M[i]2C V)){F 1m}}F 1h};u gZ=G(a,b){F a.h4(b)};m.3f(D);m.5u(D.V.1r,h0,gZ);D.2k={":3e":D.1z,":1p":m.2o(D.1z,D.1W)}}});B.V.1z=["V"];B.V.1W=["6F","bC","bB","bA","bz","6E"];B.V.2d();B.J.2Y(D,B.V);B.V.V.by={sH:"#sG",sF:"#sE",sD:"#gW",sC:"#sB",sA:"#sz",sy:"#sx",sw:"#sv",8y:"#su",st:"#sr",1F:"#sq",sp:"#so",gY:"#sn",sm:"#sl",sk:"#sj",si:"#sh",sg:"#se",sd:"#sc",sb:"#sa",s9:"#s8",s7:"#s6",gX:"#gW",s5:"#s4",s3:"#s2",s1:"#s0",rZ:"#gV",rY:"#rX",rW:"#gV",rV:"#rU",rT:"#rS",rR:"#rQ",rP:"#rO",rN:"#rM",gU:"#rL",rK:"#rJ",rI:"#rH",rG:"#rF",rE:"#gT",rD:"#gT",rC:"#rB",rA:"#rz",ry:"#rx",rw:"#rv",ru:"#gS",rt:"#gS",rs:"#rr",rq:"#rp",ro:"#rn",rm:"#rl",rk:"#gM",rj:"#ri",rh:"#rg",rf:"#rd",rc:"#rb",gR:"#gQ",bx:"#ra",r9:"#r8",r7:"#gQ",r6:"#r5",r4:"#r3",r2:"#r1",r0:"#qZ",qY:"#qX",qW:"#qV",qU:"#qT",qS:"#qR",qQ:"#qP",qO:"#qN",qM:"#qL",qK:"#qJ",qI:"#qH",qG:"#qF",qE:"#gP",qD:"#qC",qB:"#gP",qA:"#qz",qy:"#qx",qw:"#qv",qu:"#qt",qr:"#gO",qq:"#gO",qp:"#qo",qn:"#qm",ql:"#qk",qj:"#qi",qh:"#qg",gN:"#gM",qf:"#qe",qd:"#qc",qb:"#qa",q9:"#q8",q7:"#q6",q5:"#q4",q3:"#q2",q1:"#q0",pZ:"#pY",pX:"#pW",pV:"#pU",pT:"#pS",pR:"#pQ",pP:"#pO",pN:"#pM",pL:"#pK",pJ:"#pI",pH:"#pG",pF:"#pE",gL:"#pD",pC:"#pB",pA:"#pz",py:"#pw",pv:"#pu",pt:"#ps",pr:"#pq",pp:"#po",pn:"#pm",pl:"#pj",pi:"#ph",pg:"#pf",pe:"#pd",gK:"#pc",1v:"#pb",pa:"#p9",p8:"#p7",p6:"#p5",p4:"#p3",p2:"#p1",p0:"#oZ",oY:"#oX",oW:"#oV",oU:"#oT",oS:"#oR",oQ:"#oP",oO:"#gJ",oN:"#gJ",oM:"#oL",oK:"#oJ",oI:"#oH",oG:"#oF",oE:"#oD",oC:"#oB",oA:"#oz",oy:"#ox",ow:"#ov",ou:"#ot",4F:"#os",oq:"#op",gI:"#oo",om:"#ok"};if(H(1q)!="L"){1q.2X("B.1u");1q.2M("B.J");1q.2M("B.S")}if(H(1x)!="L"){1x.26("B.J",[]);1x.26("B.S",[])}1f{if(H(B.J)=="L"){14""}}1e(e){14"B.1u 3F on B.J!"}1f{if(H(B.S)=="L"){14""}}1e(e){14"B.1u 3F on B.S!"}if(H(B.1u)=="L"){B.1u={}}B.1u.1r="B.1u";B.1u.1Y="1.3.1";B.1u.4x=[];B.1u.bq=G(1d,e){D.1L=e||2O.6D;D.gH=1d};B.J.2l(B.1u.bq.1U,{1K:G(){u U=B.J.U;u 1y="{6D(): "+U(D.6D())+", 1d(): "+U(D.1d())+", 1J(): "+U(D.1J())+", 8x(): "+U(D.8x())+", 4E(): "+"{8w: "+U(D.4E().8w)+", 8v: "+U(D.4E().8v)+", 8u: "+U(D.4E().8u)+", 2P: "+U(D.4E().2P)+", bw: "+U(D.4E().bw)+"}";if(D.1J()&&D.1J().2A("2h")===0){1y+=", 2h(): {3J: "+U(D.2h().3J)+", 1n: "+U(D.2h().1n)+"}"}if(D.1J()&&(D.1J().2A("3I")===0||D.1J().2A("gE")!=-1||D.1J()=="gD")){1y+=", 3I(): {4D: "+U(D.3I().4D)+", 6A: "+U(D.3I().6A);if(D.1J()!="gC"){1y+=", 2e: {2I: "+U(D.3I().2e.2I)+", 6v: "+U(D.3I().2e.6v)+", 3g: "+U(D.3I().2e.3g)+"}}"}N{1y+="}"}}if(D.1J()=="gG"||D.1J()=="gF"){1y+=", 6C(): "+U(D.6C())}1y+="}";F 1y},1l:G(){F D.1K()},1d:G(){F D.gH},6D:G(){F D.1L},1J:G(){F D.1L.1J||L},8x:G(){F D.1L.8x||D.1L.oj},6C:G(){if(D.1J()=="gG"){F(D.1L.6C||D.1L.aW)}N{if(D.1J()=="gF"){F(D.1L.6C||D.1L.oi)}}F L},4E:G(){u m={};m.8w=D.1L.oh;m.8v=D.1L.og;m.8u=D.1L.oe||1m;m.2P=D.1L.od;m.bw=m.8w||m.8v||m.2P||m.8u;F m},2h:G(){u k={};if(D.1J()&&D.1J().2A("2h")===0){if(D.1J()=="oc"||D.1J()=="ob"){k.3J=D.1L.8t;k.1n=(B.1u.5r[k.3J]||"oa");F k}N{if(D.1J()=="o9"){k.3J=0;k.1n="";if(H(D.1L.6B)!="L"&&D.1L.6B!==0&&!B.1u.bv[D.1L.6B]){k.3J=D.1L.6B;k.1n=bu.bt(k.3J)}N{if(D.1L.8t&&H(D.1L.6B)=="L"){k.3J=D.1L.8t;k.1n=bu.bt(k.3J)}}F k}}}F L},3I:G(){u m={};u e=D.1L;if(D.1J()&&(D.1J().2A("3I")===0||D.1J().2A("gE")!=-1||D.1J()=="gD")){m.6A=Y B.S.5t(0,0);if(e.6z||e.6x){m.6A.x=(!e.6z||e.6z<0)?0:e.6z;m.6A.y=(!e.6x||e.6x<0)?0:e.6x}m.4D=Y B.S.5t(0,0);if(e.8s||e.8r){m.4D.x=(!e.8s||e.8s<0)?0:e.8s;m.4D.y=(!e.8r||e.8r<0)?0:e.8r}N{u de=B.S.1Z.7Z;u b=B.S.1Z.5s;m.4D.x=e.6z+(de.6y||b.6y)-(de.8q||b.8q);m.4D.y=e.6x+(de.4C||b.4C)-(de.8p||b.8p)}if(D.1J()!="gC"){m.2e={};m.2e.2I=1m;m.2e.3g=1m;m.2e.6v=1m;if(e.6w){m.2e.2I=(e.6w==1);m.2e.6v=(e.6w==2);m.2e.3g=(e.6w==3)}N{m.2e.2I=!!(e.2e&1);m.2e.3g=!!(e.2e&2);m.2e.6v=!!(e.2e&4)}}F m}F L},2J:G(){D.8o();D.8n()},8o:G(){if(D.1L.8o){D.1L.8o()}N{D.1L.o8=1h}},8n:G(){if(D.1L.8n){D.1L.8n()}N{D.1L.o7=1m}}});B.1u.bv={3:"gz",o6:"gA",o5:"gy",o4:"gx",o3:"gw",o2:"gv",o1:"gu",o0:"gs",nZ:"gr",nY:"gq",nX:"gp",nW:"go"};R(i=gB;i<=nV;i++){B.1u.bv[i]="gk"+(i-gB+1)}B.1u.5r={8:"nU",9:"nT",12:"gA",13:"gz",16:"nS",17:"nR",18:"nQ",19:"nP",20:"nO",27:"nN",32:"nM",33:"gy",34:"gx",35:"gw",36:"gv",37:"gu",38:"gs",39:"gr",40:"gq",44:"nL",45:"gp",46:"go",59:"gn",91:"nK",92:"nJ",93:"nI",nH:"nG",nF:"nE",nD:"nC-gm",nB:"nA",nz:"ny",nx:"nw",nv:"nu",nt:"gn",ns:"nr",nq:"np",nn:"nm-gm",nl:"nk",nj:"ni",nh:"ng",nf:"nd",nc:"nb",na:"n9",n8:"n7"};R(u i=48;i<=57;i++){B.1u.5r[i]="gl"+(i-48)}R(i=65;i<=90;i++){B.1u.5r[i]="gl"+bu.bt(i)}R(i=96;i<=n6;i++){B.1u.5r[i]="n5"+(i-96)}R(i=gj;i<=n4;i++){B.1u.5r[i]="gk"+(i-gj+1)}B.J.2l(B.1u,{1K:G(){F"["+D.1r+" "+D.1Y+"]"},1l:G(){F D.1K()},g7:G(){u I=B.1u;u bs=I.4x;R(u i=0;i<bs.K;i++){I.6t(bs[i])}gi I.4x;1f{2O.gh=L}1e(e){}1f{2O.g8=L}1e(e){}},gb:G(1d,1A,1i,gg){u E=B.1u.bq;if(!gg){F B.J.1O(1A,1i)}1i=1i||1d;if(H(1A)=="1n"){F G(gf){1i[1A].1w(1i,[Y E(1d,gf)])}}N{F G(gd){1A.1w(1i,[Y E(1d,gd)])}}},6s:G(1d,2D,5q,4B){1d=B.S.1E(1d);u I=B.1u;if(H(2D)!="1n"){14 Y 2x("\'2D\' 5p be a 1n")}u 1i=O;u 1A=O;if(H(4B)!="L"){1i=5q;1A=4B;if(H(4B)=="1n"){if(H(5q[4B])!="G"){14 Y 2x("\'bp\' 5p be a G on \'gc\'")}}N{if(H(4B)!="G"){14 Y 2x("\'bp\' 5p be a G or 1n")}}}N{if(H(5q)!="G"){14 Y 2x("\'gc\' 5p be a G if \'bp\' is 2E n3")}N{1A=5q}}if(H(1i)=="L"||1i===O){1i=1d}u bm=!!(1d.bo||1d.bn);u 8m=I.gb(1d,1A,1i,bm);if(1d.bo){1d.bo(2D.3H(2),8m,1m)}N{if(1d.bn){1d.bn(2D,8m)}}u bk=[1d,2D,8m,bm,5q,4B];I.4x.1c(bk);F bk},6t:G(6u){if(!6u[3]){F}u 1d=6u[0];u 2D=6u[1];u bj=6u[2];if(1d.ga){1d.ga(2D.3H(2),bj,1m)}N{if(1d.g9){1d.g9(2D,bj)}N{14 Y 2x("\'1d\' 5p be a S n0")}}},8j:G(bh){u I=B.1u;u 5o=I.4x;u m=B.J;if(M.K>1){u 1d=B.S.1E(M[0]);u 2D=M[1];u 1i=M[2];u 1A=M[3];R(u i=5o.K-1;i>=0;i--){u o=5o[i];if(o[0]===1d&&o[1]===2D&&o[4]===1i&&o[5]===1A){I.6t(o);5o.4y(i,1);F 1h}}}N{u 5n=m.bi(5o,bh);if(5n>=0){I.6t(bh);5o.4y(5n,1);F 1h}}F 1m},8i:G(1d,2D){1d=B.S.1E(1d);u m=B.J;u 8l=m.bg(m.1R(O,M,1));u I=B.1u;u bd=I.6t;u 4z=I.4x;if(8l.K===0){R(u i=4z.K-1;i>=0;i--){u 4A=4z[i];if(4A[0]===1d){bd(4A);4z.4y(i,1)}}}N{u bf={};R(u i=0;i<8l.K;i++){bf[8l[i]]=1h}R(u i=4z.K-1;i>=0;i--){u 4A=4z[i];if(4A[0]===1d&&4A[1]in bf){bd(4A);4z.4y(i,1)}}}},8h:G(1d,2D){u bc=B.1u.4x;1d=B.S.1E(1d);u 3G=B.J.1R(O,M,2);u 5m=[];R(u i=0;i<bc.K;i++){u 8k=bc[i];if(8k[0]===1d&&8k[1]===2D){1f{8k[2].1w(1d,3G)}1e(e){5m.1c(e)}}}if(5m.K==1){14 5m[0]}N{if(5m.K>1){u e=Y 2x("mZ bb mY in mX \'2D\', mW bb mV");e.bb=5m;14 e}}}});B.1u.1W=[];B.1u.1z=["6s","8j","8h","8i"];B.1u.2d=G(2m){u m=B.J;D.1Z=2v;D.3X=2m;1f{D.6s(2O,"g8",D.g7)}1e(e){}D.2k={":3e":D.1z,":1p":m.2o(D.1z,D.1W)};m.3f(D)};B.1u.2d(D);if(!B.3d){6s=B.1u.6s;8j=B.1u.8j;8i=B.1u.8i;8h=B.1u.8h}B.J.2Y(D,B.1u);if(H(1q)!="L"){1q.2X("B.1X");1q.2M("B.J");1q.2M("B.S");1q.2M("B.V")}if(H(1x)!="L"){1x.26("B.J",[]);1x.26("B.S",[]);1x.26("B.V",[])}1f{if(H(B.J)=="L"||H(B.S)=="L"||H(B.V)=="L"){14""}}1e(e){14"B.1X 3F on B.J, B.S 3W B.V!"}if(H(B.1X)=="L"){B.1X={}}B.1X.1r="B.1X";B.1X.1Y="1.3.1";B.1X.1K=G(){F"["+D.1r+" "+D.1Y+"]"};B.1X.1l=G(){F D.1K()};B.1X.aI=G(e,g6){e=B.S.1E(e);D.fN(g6);if(D.1S.fL){e=D.g5(e)}u 4w=D.1S.3U;u C=B.V.V;if(D.1S.3U=="aW"){4w=C.ba(e)}N{if(!(4w 2C C)){4w=C.8f(4w)}}D.82=(4w.6r().a<=0);u 5l=D.1S.aV;if(D.1S.aV=="fM"){5l=C.ba(e.8g)}N{if(!(5l 2C C)){5l=C.8f(5l)}}D.g3(e,4w,5l)};B.1X.aI.1U={g5:G(e){u mU=e.3t;u 1N=B.S.b9();if(H(1N.5k)=="L"||1N.5k===O){F e}u 4v=1N.5k.g4(e,O);if(H(4v)=="L"||4v===O){F e}u b8=B.S.6m({"1T":{3u:"8c",mT:4v.6q("6p-3D"),85:4v.6q("6p-3g"),mS:4v.6q("6p-6f"),86:4v.6q("6p-2I"),6p:"2N"}});b8.6o=e.6o;e.6o="";e.2c(b8);F e},g3:G(e,b7,8e){if(D.1S.3E){D.g2(e,8e)}if(D.fy()){D.fX(e,b7,8e)}if(D.fx()){D.fV(e,b7,8e)}},g2:G(el,g1){u b6="6l 8a "+D.aQ(g1);u g0="3E-2I: "+b6;u fZ="3E-3g: "+b6;u fY="1T=\'"+g0+";"+fZ+"\'";el.6o="<4u "+fY+">"+el.6o+"</4u>"},fX:G(el,fW,b5){u b4=D.b1(b5);R(u i=0;i<D.1S.89;i++){b4.2c(D.b0(fW,b5,i,"3D"))}el.1T.mR=0;el.mQ(b4,el.6n)},fV:G(el,fU,b3){u b2=D.b1(b3);R(u i=(D.1S.89-1);i>=0;i--){b2.2c(D.b0(fU,b3,i,"6f"))}el.1T.mP=0;el.2c(b2)},b1:G(fT){u 2q=B.S;F 2q.6m({1T:{aZ:fT.1l()}})},b0:G(aY,fQ,n,aX){u 6k=B.S.8d();u 2p=6k.1T;2p.aZ=aY.1l();2p.3u="8c";2p.3V="6l";2p.fS="fR";2p.mO="6l";u 8b=D.aQ(aY,fQ);if(D.1S.3E&&n===0){2p.mN="8a";2p.mM="6l";2p.84="2N";2p.83="2N";2p.mL="2N";2p.3V="2N";2p.fP=8b.1l()}N{if(8b){2p.fP=8b.1l();2p.mK="8a";2p.mJ="2N 6l"}}if(!D.1S.4r&&(n==(D.1S.89-1))){2p.3V="fO"}D.fI(6k,n,aX);D.fG(6k,n,aX);F 6k},fN:G(fK){D.1S={6g:"1p",3U:"aW",aV:"fM",5j:1h,3E:1m,4r:1m,fL:1m};B.J.2l(D.1S,fK);D.1S.89=(D.1S.4r?2:4)},aL:G(){u 88=D.1S.6g;if(D.6h(88,"1p","3D")){F""}u aU=(88.2A("tl")!=-1);u aT=(88.2A("tr")!=-1);if(aU&&aT){F""}if(aU){F"2I"}if(aT){F"3g"}F""},aK:G(){u 87=D.1S.6g;if(D.6h(87,"1p","6f")){F""}u aS=(87.2A("bl")!=-1);u aR=(87.2A("br")!=-1);if(aS&&aR){F""}if(aS){F"2I"}if(aR){F"3g"}F""},aQ:G(aN,aO){if(aN=="aP"){F aO}N{if(D.1S.3E){F D.1S.3E}N{if(D.1S.5j){F aO.fJ(aN)}}}F""},fI:G(el,n,fH){u 6j=D.fE(n)+"px";u aM=(fH=="3D"?D.aL():D.aK());u 4t=el.1T;if(aM=="2I"){4t.86=6j;4t.85="2N"}N{if(aM=="3g"){4t.85=6j;4t.86="2N"}N{4t.86=6j;4t.85=6j}}},fG:G(el,n,fF){u 6i=D.fz(n)+"px";u aJ=(fF=="3D"?D.aL():D.aK());u 4s=el.1T;if(aJ=="2I"){4s.84=6i;4s.83="2N"}N{if(aJ=="3g"){4s.83=6i;4s.84="2N"}N{4s.84=6i;4s.83=6i}}},fE:G(n){if(D.82){F 0}u o=D.1S;if(o.4r&&o.5j){u fD=[1,0];F fD[n]}N{if(o.4r){u fC=[2,1];F fC[n]}N{if(o.5j){u fB=[3,2,1,0];F fB[n]}N{u fA=[5,3,2,1];F fA[n]}}}},fz:G(n){u o=D.1S;u 5i;if(o.4r&&(o.5j||D.82)){F 1}N{if(o.4r){5i=[1,0]}N{if(o.5j){5i=[2,1,1,1]}N{if(o.3E){5i=[0,2,0,0]}N{if(D.82){5i=[5,3,2,1]}N{F 0}}}}}F 5i[n]},6h:G(1y){R(u i=1;i<M.K;i++){if(1y.2A(M[i])!=-1){F 1h}}F 1m},fy:G(){F D.6h(D.1S.6g,"1p","3D","tl","tr")},fx:G(){F D.6h(D.1S.6g,"1p","6f","bl","br")},mI:G(el){F(el.5h.K==1&&el.5h[0].3T==3)}};B.1X.aF=G(e,fw){Y B.1X.aI(e,fw)};B.1X.fs=G(fv,fu,ft){u aG=B.S.aH(fv,fu);R(u i=0;i<aG.K;i++){B.1X.aF(aG[i],ft)}};B.1X.V=B.V.V;B.1X.mH=B.S.4q;B.1X.2d=G(){u m=B.J;m.3f(D);D.2k={":3e":D.1z,":1p":m.2o(D.1z,D.1W)}};B.1X.1z=["aF","fs"];B.1X.1W=[];B.1X.2d();B.J.2Y(D,B.1X);if(H(B)=="L"){B={}}if(H(B.B)=="L"){B.B={}}B.B.1r="B.B";B.B.1Y="1.3.1";B.B.1K=G(){F"["+D.1r+" "+D.1Y+"]"};B.B.1l=G(){F D.1K()};B.B.aA=["J","15","1H","1D","1s","1k","S","1I","V","1u","1X"];if(H(1x)!="L"||H(1q)!="L"){if(H(1q)!="L"){1q.2X("B.B");1q.2M("B.*")}if(H(1x)!="L"){1x.26("B.J",[]);1x.26("B.15",[]);1x.26("B.1H",[]);1x.26("B.1D",[]);1x.26("B.1s",[]);1x.26("B.1k",[]);1x.26("B.S",[]);1x.26("B.1I",[]);1x.26("B.V",[]);1x.26("B.1u",[]);1x.26("B.1X",[])}(G(){u 6e=B.J.1R;u I=B.B;u aE=I.aA;u aD=[];u aC=[];u 81={};u i,k,m,1p;R(i=0;i<aE.K;i++){m=B[aE[i]];6e(aD,m.1z);6e(aC,m.1W);R(k in m.2k){81[k]=6e(81[k],m.2k[k])}1p=m.2k[":1p"];if(!1p){1p=6e(O,m.1z,m.1W)}u j;R(j=0;j<1p.K;j++){k=1p[j];I[k]=m[k]}}I.1z=aD;I.1W=aC;I.2k=81}())}N{if(H(B.3d)=="L"){B.3d=1h}(G(){u 80=2v.fr("7W");u ay="fq://fp.mG.fo/mF/mE/mD.is.aB.mC";u 2w=O;u ax=O;u az={};u i;R(i=0;i<80.K;i++){u 1d=80[i].fm("1d");if(!1d){2V}az[1d]=1h;if(1d.3C(/B.js$/)){2w=1d.2W(0,1d.mB("B.js"));ax=80[i]}}if(2w===O){F}u 6d=B.B.aA;R(u i=0;i<6d.K;i++){if(B[6d[i]]){2V}u 7Y=2w+6d[i]+".js";if(7Y in az){2V}if(2v.7Z&&2v.7Z.mA==ay){u s=2v.mz(ay,"7W");s.4p("id","my"+2w+6d[i]);s.4p("1d",7Y);s.4p("1J","mx/x-fk");ax.3t.2c(s)}N{2v.fl("<7W 1d=\\""+7Y+"\\" 1J=\\"7X/fk\\"></7W>")}}})()}',62,1976,'||||||||||||||||||||||||||||||var|||||||MochiKit||this||return|function|typeof|self|Base|length|undefined|arguments|else|null||elem|for|DOM||repr|Color|rval|res|new||||||throw|Iter|||||next|name|push|src|catch|try|lst|true|obj|node|Async|toString|false|string|hue|all|dojo|NAME|Format|msg|Signal|red|apply|JSAN|str|EXPORT|func|rgb|_425|DateTime|getElement|blue|hsl|Logging|LoggingPane|type|__repr__|_event|while|doc|bind|num|iter|extend|options|style|prototype|seq|EXPORT_OK|Visual|VERSION|_document||_434||replace|forwardCall|StopIteration|use||Math|max|min|join|appendChild|__new__|button|compare|date|key|val|_329|EXPORT_TAGS|update|win|pair|concat|_596|dom|map|req|Deferred|sync|document|base|Error|number|partial|indexOf||instanceof|sig|not|cls|list|fired|left|stop|break|logger|require|0px|window|shift|hsv|split|createElement|_423|callee|continue|substring|provide|_exportSymbols|ccc||_464|||||||||step|pred|_51|__compat__|common|nameFunctions|right|255|_517|case|100|_loggingPane|value|object|callback|TypeError|_251|_246|_113|parentNode|display|_522|parseInt|cssText|wrap|info|isArrayLike|end|match|top|border|depends|args|substr|mouse|code|_519|_443|className|level|err|frac|Date|_135|_85|nodeType|color|height|and|_window|fromRGB|charAt||asHSL|_444|message||||filter||LogMessage|AdapterRegistry|_366|imap|NotFound|locked|counter|_262|_messages|operator|cmp|_165|_161|pairs|arr|_52|setAttribute|computedStyle|compact|_614|_610|div|_576|_572|_observers|splice|_565|_566|_555|scrollTop|page|modifier|white|_541|fromHSL|_539|_535|_528|clone|parseFloat|_505|pre|_499|_497|_427|createTextNode|_446|attributeArray|_388|_379|updateNodeAttributes|_341|_326||box|errback|results|paused|chain|_285||ofs||NamedError|_175|_147|_122|_83|_54|_17|childNodes|_619|blend|defaultView|_574|_569|idx|_562|must|_554|_specialKeys|body|Coordinates|registerComparator|_521|_516|hex|mid|_478|width|loggingPane|LogLevel|nwin|head|url|setElementClass|callStack|path|dest|_359|boolean|register|Dimensions|DeferredLock|_313|addCallback|_310|waiting|onreadystatechange|_290|LOCALE|year|printfire|_214|log|_213|_211|pos|_155|_153||typeMatcher|listMinMax|_114|_40|itr|typ|_19|_634|_625|bottom|corners|_hasString|_612|_608|_595|1px|DIV|firstChild|innerHTML|padding|getPropertyValue|asRGB|connect|_disconnect|_559|middle|which|clientY|scrollLeft|clientX|client|charCode|relatedTarget|event|toColorPart|clampColorComponent|_537|_534|toFixed|_468|buildAndApplyFilter|_442|_441|_440|_439|position|_463|_447|removeChild|_449|uid|_428|_426|compliant|attributes|_422|_409|_412|_400|_395|_390|_389|_377|_375|_363|attr|ctx|repeat|_340|_339|isNotEmpty|_335|_333|opera|DeferredList|ret|_309|silentlyCancelled|canceller|_nextId|Array|_293|XMLHttpRequest|chained|_281|tail|_252|_225|msec|day|month|iso|Logger|_208|listeners|_200|_198|_194|_196|reduce|range|_169|_162|truth|registerRepr|_121|_70|_58|_56|_47|_45|_41|_13|_1|script|text|uri|documentElement|_630|_629|isTransparent|borderRightWidth|borderLeftWidth|marginRight|marginLeft|_602|_599|numSlices|solid|_597|block|SPAN|_579|fromString|offsetParent|signal|disconnectAll|disconnect|_570|_563|_557|preventDefault|stopPropagation|clientTop|clientLeft|pageY|pageX|keyCode|meta|ctrl|alt|target|black|_532|_524|floor|_513|_512|_500|_495|toLowerCase|_487|DEBUG|INFO|WARNING|FATAL|ERROR|colorTable|logFont|closed|inline|onclick|_438|_437|_445|RegExp|_452|space|title|updatetree|||||withDocument|withWindow||setDisplayForElement|none|renames|forEach|domConverters|escapeHTML|addElementClass|removeElementClass|once|_378|_380|_376|appendChildNodes|coerceToDOM|_355|opt|clientWidth|opacity|GenericError|fail|resultList|_307|_301|_fire|can|addCallbacks|_resback|percent|decimal|separator|twoDigitFloat|_274|_273|_264|_257|_250|_249|_254|_248|_243|_242|fmt|_240|_245|getTime|sec|hour|_209|slice|_206|iterateNextIter|registerIteratorFactory|arrayLikeIter|iteratorRegistry|takewhile|ifilterfalse|ifilter|_181|_176|_168|_166|_159|_tee|deque|arg|fun|jsonRegistry|reprString|reprRegistry|comparatorRegistry|urlEncode|_110|_108|cur|_95|_87|_71|im_preargs||_53|_57|_46|present|like|array|Argument|_15|_12|_632|_631|_633|SUBMODULES|only|_628|_627|_626|roundElement|_624|getElementsByTagAndClassName|_RoundCorners|_613|_whichSideBottom|_whichSideTop|_609|_605|_606|transparent|_borderColor|_604|_603|_601|_600|bgColor|fromElement|_594|_592|backgroundColor|_createCornerSlice|_createCorner|_590|_589|_587|_586|_581|_578|_577|currentDocument|fromBackground|errors|_568|_564||sigs|flattenArguments|_561|findIdentical|_560|_558||_556|attachEvent|addEventListener|funcOrStr|Event||_548|fromCharCode|String|_specialMacKeys|any|green|_namedColors|hsvToRGB|rgbToHSV|hslToRGB|rgbToHSL|_542|01|360|_fromColorString|_540|_536|_538|_529|_523|_518|fromComputedStyle|_511|_507|_508|_506|_501|fromHexString|_498|_496|_486|__class__|createLoggingPane|_459|_461|font|_462|_430|_435|1000|index|_460|getMessages|removeListener|_451||_457|_450|infore|_448|_456|logDebug|offsetHeight|span|input|_436|TR||HTML|open|alert|currentWindow|swapDOM|SELECT|FORM|INPUT|createDOMFunc|ignoreAttr|_421|call|_417|_410|_415|nodeName|_414|_413|emitHTML|good|_406|_399|_397|_393|_392|addLoadEvent|addToCallStack|_387|_386|_381|_382|_383|_373|_372|_369|createDOM|_365|Function|_360|_362|_358|_344|nodeWalk|formContents|_337|_338|_334|_332|offsetTop|offsetLeft|visibility|parentElement|||XMLHttpRequestError|BrowserComplianceError|CancelledError|AlreadyCalledError|evalJSONRequest|sendXMLHttpRequest|wait|doSimpleXMLHttpRequest|getXMLHttpRequest|succeed|_312|finishedCount|_308|_cbDeferred|_303|_297|queryString|_nothing|_289|XMLHTTP|ActiveXObject|eval|_284|_check|error|_279|default|rstrip|lstrip|formatLocale|roundToFixed|truncToFixed|_276|pow|_272|_271|_270|sign|_265|_263|tmp|_238|_232|toISODate|toISOTime|getFullYear|getDate|getMonth|_230|_padTwo|_228|useNativeConsole|_212|compareLogMessage|isLogMessage|unshift|_207||maxSize|_202|_199|logLevelAtLeast|console|hasIterateNext|iterateNext|arrayLike|groupby||exhaust|tee|dropwhile|applymap||islice|izip|cycle|count||_189|_188|_183|_185|_184|_186|_187|_182|identity|fetch|_180|_177|listMin|reprNumber|reprArrayLike|compareArrayLike|compareDateLike|isDateLike|findValue|_128|__export__|keyComparator|_124|_118|_93|_94|_90|_88|_84|_77|_68|_67|_66|_65|_60|im_func|_55|im_self|_48|_44|_42|_39|_36|_33|_27|_26|_25|_22|_24|_20|javascript|write|getAttribute||org|www|http|getElementsByTagName|roundClass|_623|_622|_621|_620|_isBottomRounded|_isTopRounded|_borderSize|_618|_617|_616|_615|_marginSize|_611|_setBorder|_607|_setMargin|blendedColor|_598|__unstable__wrapElement|fromParent|_setOptions|2px|borderColor|_593|hidden|overflow|_591|_588|_roundBottomCorners|_585|_roundTopCorners|_584|_583|_582|_580|_renderBorder|_roundCornersImpl|getComputedStyle|_doWrap|_571|_unloadCache|onunload|detachEvent|removeEventListener|_listener|objOrFunc|_552||_551|_549|onload|delete|112|KEY_F|KEY_|MINUS|KEY_SEMICOLON|KEY_DELETE|KEY_INSERT|KEY_ARROW_DOWN|KEY_ARROW_RIGHT|KEY_ARROW_UP||KEY_ARROW_LEFT|KEY_HOME|KEY_END|KEY_PAGE_DOWN|KEY_PAGE_UP|KEY_ENTER|KEY_NUM_PAD_CLEAR|63236|mousemove|contextmenu|click|mouseout|mouseover|_src|yellow|708090|purple|orange|ff00ff|magenta|778899|d3d3d3|808080|gray|696969|2f4f4f|darkred|a9a9a9|00ffff|cyan|brown|_547|_546||||compareRGB|_545||_543|fromHSLString|fromRGBString|round|_533|_hslValue|switch|background|_503|_504||fromName|_488|col|toRGBString|_hexString|_rgbString|_hslString|toPrecision|isLight||_481|_477|_476|_475|_474|_473|_469|_466|closePane|_458|onkeypress|_454|addListener|_455|close|test|scrollHeight|option|word|moz|_431|getElementById|html|pop|200|_|removeElement|showElement|hideElement|CANVAS|STRONG|FIELDSET|LEGEND|OPTGROUP|OPTION|TEXTAREA|LABEL|HR|BR|H3|H2|H1|PRE|TT|BUTTON|IMG|TH||TABLE||TFOOT|THEAD|TBODY|TD|LI|OL|||UL|checked|class|ignoreAttrFilter||_424|_419|nodeValue|scrapeText|_416|_418|sort|_411|toHTML|_404|hasElementClass|_403|_402|_401|swapElementClass|_398|_394|toggleElementClass|_391|focusOnLoad|_newCallStack|currentStyle|_371|replaceChildNodes|_364|_361|getNodeAttribute|_357|setNodeAttribute|_354|_352|_350|_353|toDOM|_346|_345|registerDOMConverter|selectedIndex|setElementPosition|setElementDimensions|tagName|absolute|getBoxObjectFor|getBoundingClientRect|elementPosition|_325|_324|_322|_323|offsetWidth|elementDimensions|clientHeight|innerWidth|getViewportDimensions|setOpacity|status|_317|deferred|_316|_newNamedError|maybeDeferred||gatherResults|callLater|loadJSONDoc|_311|consumeErrors|fireOnOneErrback|fireOnOneCallback|addErrback|_305|_304|_306|unlocked|release|_300|_299|_298|_296|_xhr_onreadystatechange|_xhr_canceller|304|responseText|Msxml2|addBoth|_pause|_continue|result|the|are|they|instances|_unpause|cancel|_280|_278|en_US|strip|percentFormat|twoDigitAverage|numberFormatter|_277|_275|isNaN|_259|_258|_260|_255|_253|_numberFormatter|_241|_239|_237|_236|_235|_234|_233|_231|toAmericanDate|toPaddedAmericanDate|americanDate|toISOTimestamp|isoTimestamp|isoDate|foot|sep||60000|_221|_isoRegexp|dispatchEvent|createEvent|warning|logWarning|fatal|logFatal|debug|logError|baseLog|_210|getMessageText|logToConsole|dispatchListeners|_204|_203|ident|_201|postError|alertListener|_197|_192|groupby_as_array|iextend|some|reversed|sorted|every|sum|_190|eat|_174|_173|_172|_171|_167|_163|_158|_157|_151|_144|_141||_139|_136|_134||_133|_132|zip|merge|isUndefined|isCallable|listMax|_131|_130|encodeURIComponent||_127|method|parseQueryString|evalJSON|registerJSON|serializeJSON|objMin|objMax|reverseKeyComparator|arrayEqual|objEqual|bindMethods|xfilter|xmap|isEmpty|isNull|isUndefinedOrNull|itemgetter|items|keys|setdefault|_126|_120|decodeURIComponent|_119|len|_109|_107|_104|_105|_101|_102|_98|||_100|_97|_96|_91|json|__json__|_82|_81|_80|_79|_76||_75|_74|_73|_69|_primitives|_64|_63||_62|_61|_59|_wrapDumbFunction|_49|_50|_31|_30|_21|_7|application|MochiKit_|createElementNS|namespaceURI|lastIndexOf|xul|there|gatekeeper|keymaster|mozilla|getElementsComputedStyle|_hasSingleTextChild|borderWidth|borderStyle|borderBottomWidth|borderTopWidth|borderTopStyle|fontSize|paddingBottom|insertBefore|paddingTop|marginBottom|marginTop|_575|property|see|handling|thrown|Multiple|element|||given|123|KEY_NUM_PAD_|105|KEY_APOSTROPHE|222|KEY_RIGHT_SQUARE_BRACKET|221|KEY_REVERSE_SOLIDUS|220|KEY_LEFT_SQUARE_BRACKET||219|KEY_GRAVE_ACCENT|192|KEY_SOLIDUS|191|KEY_FULL_STOP|190|KEY_HYPHEN|189||KEY_COMMA|188|KEY_EQUALS_SIGN|187|186|KEY_SCROLL_LOCK|145|KEY_NUM_LOCK|144|KEY_NUM_PAD_SOLIDUS|111|KEY_NUM_PAD_FULL_STOP|110|KEY_NUM_PAD_HYPHEN|109|KEY_NUM_PAD_PLUS_SIGN|107|KEY_NUM_PAD_ASTERISK|106|KEY_SELECT|KEY_WINDOWS_RIGHT|KEY_WINDOWS_LEFT|KEY_PRINT_SCREEN|KEY_SPACEBAR|KEY_ESCAPE|KEY_CAPS_LOCK|KEY_PAUSE|KEY_ALT|KEY_CTRL|KEY_SHIFT|KEY_TAB|KEY_BACKSPACE|63242|63272|63302|63233|63235|63232|63234|63273|63275|63277|63276|63289|returnValue|cancelBubble|keypress|KEY_UNKNOWN|keyup|keydown|shiftKey|metaKey||ctrlKey|altKey|toElement|srcElement|9acd32||yellowgreen||ffff00|f5f5f5|whitesmoke||ffffff|f5deb3|wheat|ee82ee|violet|40e0d0|turquoise|ff6347|tomato|d8bfd8|thistle|008080|teal|d2b48c|tan|4682b4|steelblue|00ff7f|springgreen|fffafa|snow|slategrey|slategray|6a5acd|slateblue|87ceeb|skyblue|c0c0c0|silver|a0522d|sienna|fff5ee|seashell|2e8b57|seagreen|f4a460|sandybrown|fa8072|salmon|8b4513|saddlebrown|4169e1|royalblue|bc8f8f|rosybrown|ff0000|800080|b0e0e6|powderblue|dda0dd|plum|ffc0cb|pink|cd853f||peru|ffdab9|peachpuff|ffefd5|papayawhip|db7093|palevioletred|afeeee|paleturquoise|98fb98|palegreen|eee8aa||palegoldenrod|da70d6|orchid|ff4500|orangered|ffa500|6b8e23|olivedrab|808000|olive|fdf5e6|oldlace|000080|navy|ffdead|navajowhite|ffe4b5|moccasin|ffe4e1|mistyrose|f5fffa|mintcream|191970|midnightblue|c71585|mediumvioletred|48d1cc|mediumturquoise|00fa9a|mediumspringgreen|7b68ee|mediumslateblue|3cb371|mediumseagreen|9370db|mediumpurple|ba55d3|mediumorchid|0000cd|mediumblue|66cdaa|mediumaquamarine|800000|maroon|faf0e6|linen|32cd32|limegreen|00ff00|lime|ffffe0|lightyellow|b0c4de|lightsteelblue|lightslategrey|lightslategray||87cefa|lightskyblue|20b2aa|lightseagreen|ffa07a|lightsalmon|ffb6c1|lightpink|lightgrey|90ee90|lightgreen|lightgray|fafad2|lightgoldenrodyellow|e0ffff|lightcyan|f08080|lightcoral|add8e6|lightblue|fffacd|lemonchiffon|7cfc00|lawngreen|fff0f5|lavenderblush|e6e6fa|lavender|f0e68c|khaki|fffff0|ivory|4b0082|indigo|cd5c5c|indianred|ff69b4|hotpink|f0fff0|honeydew|grey|adff2f|greenyellow|008000|daa520|goldenrod|ffd700||gold|f8f8ff|ghostwhite|dcdcdc|gainsboro|fuchsia|228b22|forestgreen|fffaf0|floralwhite|b22222|firebrick|1e90ff|dodgerblue|dimgrey|dimgray|00bfff|deepskyblue|ff1493|deeppink|9400d3|darkviolet|00ced1|darkturquoise|darkslategrey|darkslategray|483d8b|darkslateblue|8fbc8f|darkseagreen|e9967a|darksalmon|8b0000|9932cc|darkorchid|ff8c00|darkorange|556b2f|darkolivegreen|8b008b|darkmagenta|bdb76b|darkkhaki|darkgrey|006400|darkgreen|darkgray|b8860b|darkgoldenrod|008b8b|darkcyan|00008b|darkblue|dc143c|crimson|fff8dc|cornsilk|6495ed|cornflowerblue|ff7f50|coral|d2691e||chocolate|7fff00|chartreuse|5f9ea0|cadetblue|deb887|burlywood|a52a2a|8a2be2|blueviolet|0000ff|ffebcd||blanchedalmond|000000|ffe4c4|bisque|f5f5dc|beige|f0ffff|azure|7fffd4|aquamarine|aqua|faebd7|antiquewhite|f0f8ff|aliceblue|lightGray|darkGray|namedColors|blackColor|fromText|whiteColor|_510|_509|PI|rad|deg|transparentColor|_494|_493|_492|fromHSV|_491|_490|_489|asHSV|toHexString|rgba|hsla|toHSLString|isDark|lighterColorWithLevel|darkerColorWithLevel|colorWithLightness|colorWithSaturation|colorWithHue|colorWithAlpha||serif|sans|Verdana||8pt|8em|auto||Close|Clear||Load|Filter||10em||fixed|regex|emergency|line|margin|_Listener|dtd|loose|html4|w3|EN|Transitional|DTD|W3C|PUBLIC|DOCTYPE|blocking|due|debugging|able|Not|resizable|dependent|href|location|_MochiKit_LoggingPane|_429|canvas|strong|fieldset|legend|optgroup|select|form|textarea|label|img|table|tfoot|thead|tbody|htmlFor||useMap|usemap|defaultChecked|hasChildNodes|quot|amp|_405|focus|replaceChild|checkbox||radio|_win|BODY||safari|version|userAgent|navigator|innerHeight|alpha|khtml|Tried|acquire|clearTimeout|setTimeout|GET|ignore|send|abort|failed|Request|readyState|support|does|Browser|Microsoft|_288|_287|used|Deferreds|Chained|success|unfired|fr_FR|de_DE|00|abs|search|pattern|Invalid|getTimezoneOffset|getSeconds|getMinutes|getHours|UTC|3600000|initEvent|Events|debuggingBookmarklet|MESSAGES|LAST|_205|clear|ninfo|nlevel|timestamp|reverse|takes|initial|with|sequence|empty|iterable|numbers|dateLike|escape|find|forward|unregister|unescape|Object|compared|item|contains|logor|logand|cle|clt|cge|cgt|cne|ceq|zrshift|rshift|lshift|xor|mul|mod|sub|add|neg|lognot|_9|_2'.split('|'),0,{})


/*
 * jQuery 1.2.1 - New Wave Javascript
 *
 * Copyright (c) 2007 John Resig (jquery.com)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * $Date: 2007-09-16 23:42:06 -0400 (Sun, 16 Sep 2007) $
 * $Rev: 3353 $
 */

var decompressedJQuery = function(p,a,c,k,e,r){e=function(c){return(c<a?'':e(parseInt(c/a)))+((c=c%a)>35?String.fromCharCode(c+29):c.toString(36))};if(!''.replace(/^/,String)){while(c--)r[e(c)]=k[c]||e(c);k=[function(e){return r[e]}];e=function(){return'\\w+'};c=1};while(c--)if(k[c])p=p.replace(new RegExp('\\b'+e(c)+'\\b','g'),k[c]);return p}('(G(){9(1m E!="W")H w=E;H E=18.15=G(a,b){I 6 7u E?6.5N(a,b):1u E(a,b)};9(1m $!="W")H D=$;18.$=E;H u=/^[^<]*(<(.|\\s)+>)[^>]*$|^#(\\w+)$/;E.1b=E.3A={5N:G(c,a){c=c||U;9(1m c=="1M"){H m=u.2S(c);9(m&&(m[1]||!a)){9(m[1])c=E.4D([m[1]],a);J{H b=U.3S(m[3]);9(b)9(b.22!=m[3])I E().1Y(c);J{6[0]=b;6.K=1;I 6}J c=[]}}J I 1u E(a).1Y(c)}J 9(E.1n(c))I 1u E(U)[E.1b.2d?"2d":"39"](c);I 6.6v(c.1c==1B&&c||(c.4c||c.K&&c!=18&&!c.1y&&c[0]!=W&&c[0].1y)&&E.2h(c)||[c])},4c:"1.2.1",7Y:G(){I 6.K},K:0,21:G(a){I a==W?E.2h(6):6[a]},2o:G(a){H b=E(a);b.4Y=6;I b},6v:G(a){6.K=0;1B.3A.1a.16(6,a);I 6},N:G(a,b){I E.N(6,a,b)},4I:G(a){H b=-1;6.N(G(i){9(6==a)b=i});I b},1x:G(f,d,e){H c=f;9(f.1c==3X)9(d==W)I 6.K&&E[e||"1x"](6[0],f)||W;J{c={};c[f]=d}I 6.N(G(a){L(H b 1i c)E.1x(e?6.R:6,b,E.1e(6,c[b],e,a,b))})},17:G(b,a){I 6.1x(b,a,"3C")},2g:G(e){9(1m e!="5i"&&e!=S)I 6.4n().3g(U.6F(e));H t="";E.N(e||6,G(){E.N(6.3j,G(){9(6.1y!=8)t+=6.1y!=1?6.6x:E.1b.2g([6])})});I t},5m:G(b){9(6[0])E(b,6[0].3H).6u().3d(6[0]).1X(G(){H a=6;1W(a.1w)a=a.1w;I a}).3g(6);I 6},8m:G(a){I 6.N(G(){E(6).6q().5m(a)})},8d:G(a){I 6.N(G(){E(6).5m(a)})},3g:G(){I 6.3z(1q,Q,1,G(a){6.58(a)})},6j:G(){I 6.3z(1q,Q,-1,G(a){6.3d(a,6.1w)})},6g:G(){I 6.3z(1q,P,1,G(a){6.12.3d(a,6)})},50:G(){I 6.3z(1q,P,-1,G(a){6.12.3d(a,6.2q)})},2D:G(){I 6.4Y||E([])},1Y:G(t){H b=E.1X(6,G(a){I E.1Y(t,a)});I 6.2o(/[^+>] [^+>]/.14(t)||t.1g("..")>-1?E.4V(b):b)},6u:G(e){H f=6.1X(G(){I 6.67?E(6.67)[0]:6.4R(Q)});H d=f.1Y("*").4O().N(G(){9(6[F]!=W)6[F]=S});9(e===Q)6.1Y("*").4O().N(G(i){H c=E.M(6,"2P");L(H a 1i c)L(H b 1i c[a])E.1j.1f(d[i],a,c[a][b],c[a][b].M)});I f},1E:G(t){I 6.2o(E.1n(t)&&E.2W(6,G(b,a){I t.16(b,[a])})||E.3m(t,6))},5V:G(t){I 6.2o(t.1c==3X&&E.3m(t,6,Q)||E.2W(6,G(a){I(t.1c==1B||t.4c)?E.2A(a,t)<0:a!=t}))},1f:G(t){I 6.2o(E.1R(6.21(),t.1c==3X?E(t).21():t.K!=W&&(!t.11||E.11(t,"2Y"))?t:[t]))},3t:G(a){I a?E.3m(a,6).K>0:P},7c:G(a){I 6.3t("."+a)},3i:G(b){9(b==W){9(6.K){H c=6[0];9(E.11(c,"24")){H e=c.4Z,a=[],Y=c.Y,2G=c.O=="24-2G";9(e<0)I S;L(H i=2G?e:0,33=2G?e+1:Y.K;i<33;i++){H d=Y[i];9(d.26){H b=E.V.1h&&!d.9V["1Q"].9L?d.2g:d.1Q;9(2G)I b;a.1a(b)}}I a}J I 6[0].1Q.1p(/\\r/g,"")}}J I 6.N(G(){9(b.1c==1B&&/4k|5j/.14(6.O))6.2Q=(E.2A(6.1Q,b)>=0||E.2A(6.2H,b)>=0);J 9(E.11(6,"24")){H a=b.1c==1B?b:[b];E("9h",6).N(G(){6.26=(E.2A(6.1Q,a)>=0||E.2A(6.2g,a)>=0)});9(!a.K)6.4Z=-1}J 6.1Q=b})},4o:G(a){I a==W?(6.K?6[0].3O:S):6.4n().3g(a)},6H:G(a){I 6.50(a).28()},6E:G(i){I 6.2J(i,i+1)},2J:G(){I 6.2o(1B.3A.2J.16(6,1q))},1X:G(b){I 6.2o(E.1X(6,G(a,i){I b.2O(a,i,a)}))},4O:G(){I 6.1f(6.4Y)},3z:G(f,d,g,e){H c=6.K>1,a;I 6.N(G(){9(!a){a=E.4D(f,6.3H);9(g<0)a.8U()}H b=6;9(d&&E.11(6,"1I")&&E.11(a[0],"4m"))b=6.4l("1K")[0]||6.58(U.5B("1K"));E.N(a,G(){H a=c?6.4R(Q):6;9(!5A(0,a))e.2O(b,a)})})}};G 5A(i,b){H a=E.11(b,"1J");9(a){9(b.3k)E.3G({1d:b.3k,3e:P,1V:"1J"});J E.5f(b.2g||b.6s||b.3O||"");9(b.12)b.12.3b(b)}J 9(b.1y==1)E("1J",b).N(5A);I a}E.1k=E.1b.1k=G(){H c=1q[0]||{},a=1,2c=1q.K,5e=P;9(c.1c==8o){5e=c;c=1q[1]||{}}9(2c==1){c=6;a=0}H b;L(;a<2c;a++)9((b=1q[a])!=S)L(H i 1i b){9(c==b[i])6r;9(5e&&1m b[i]==\'5i\'&&c[i])E.1k(c[i],b[i]);J 9(b[i]!=W)c[i]=b[i]}I c};H F="15"+(1u 3D()).3B(),6p=0,5c={};E.1k({8a:G(a){18.$=D;9(a)18.15=w;I E},1n:G(a){I!!a&&1m a!="1M"&&!a.11&&a.1c!=1B&&/G/i.14(a+"")},4a:G(a){I a.2V&&!a.1G||a.37&&a.3H&&!a.3H.1G},5f:G(a){a=E.36(a);9(a){9(18.6l)18.6l(a);J 9(E.V.1N)18.56(a,0);J 3w.2O(18,a)}},11:G(b,a){I b.11&&b.11.27()==a.27()},1L:{},M:G(c,d,b){c=c==18?5c:c;H a=c[F];9(!a)a=c[F]=++6p;9(d&&!E.1L[a])E.1L[a]={};9(b!=W)E.1L[a][d]=b;I d?E.1L[a][d]:a},30:G(c,b){c=c==18?5c:c;H a=c[F];9(b){9(E.1L[a]){2E E.1L[a][b];b="";L(b 1i E.1L[a])1T;9(!b)E.30(c)}}J{2a{2E c[F]}29(e){9(c.53)c.53(F)}2E E.1L[a]}},N:G(a,b,c){9(c){9(a.K==W)L(H i 1i a)b.16(a[i],c);J L(H i=0,48=a.K;i<48;i++)9(b.16(a[i],c)===P)1T}J{9(a.K==W)L(H i 1i a)b.2O(a[i],i,a[i]);J L(H i=0,48=a.K,3i=a[0];i<48&&b.2O(3i,i,3i)!==P;3i=a[++i]){}}I a},1e:G(c,b,d,e,a){9(E.1n(b))b=b.2O(c,[e]);H f=/z-?4I|7T-?7Q|1r|69|7P-?1H/i;I b&&b.1c==4W&&d=="3C"&&!f.14(a)?b+"2T":b},1o:{1f:G(b,c){E.N((c||"").2l(/\\s+/),G(i,a){9(!E.1o.3K(b.1o,a))b.1o+=(b.1o?" ":"")+a})},28:G(b,c){b.1o=c!=W?E.2W(b.1o.2l(/\\s+/),G(a){I!E.1o.3K(c,a)}).66(" "):""},3K:G(t,c){I E.2A(c,(t.1o||t).3s().2l(/\\s+/))>-1}},2k:G(e,o,f){L(H i 1i o){e.R["3r"+i]=e.R[i];e.R[i]=o[i]}f.16(e,[]);L(H i 1i o)e.R[i]=e.R["3r"+i]},17:G(e,p){9(p=="1H"||p=="2N"){H b={},42,41,d=["7J","7I","7G","7F"];E.N(d,G(){b["7C"+6]=0;b["7B"+6+"5Z"]=0});E.2k(e,b,G(){9(E(e).3t(\':3R\')){42=e.7A;41=e.7w}J{e=E(e.4R(Q)).1Y(":4k").5W("2Q").2D().17({4C:"1P",2X:"4F",19:"2Z",7o:"0",1S:"0"}).5R(e.12)[0];H a=E.17(e.12,"2X")||"3V";9(a=="3V")e.12.R.2X="7g";42=e.7e;41=e.7b;9(a=="3V")e.12.R.2X="3V";e.12.3b(e)}});I p=="1H"?42:41}I E.3C(e,p)},3C:G(h,j,i){H g,2w=[],2k=[];G 3n(a){9(!E.V.1N)I P;H b=U.3o.3Z(a,S);I!b||b.4y("3n")==""}9(j=="1r"&&E.V.1h){g=E.1x(h.R,"1r");I g==""?"1":g}9(j.1t(/4u/i))j=y;9(!i&&h.R[j])g=h.R[j];J 9(U.3o&&U.3o.3Z){9(j.1t(/4u/i))j="4u";j=j.1p(/([A-Z])/g,"-$1").2p();H d=U.3o.3Z(h,S);9(d&&!3n(h))g=d.4y(j);J{L(H a=h;a&&3n(a);a=a.12)2w.4w(a);L(a=0;a<2w.K;a++)9(3n(2w[a])){2k[a]=2w[a].R.19;2w[a].R.19="2Z"}g=j=="19"&&2k[2w.K-1]!=S?"2s":U.3o.3Z(h,S).4y(j)||"";L(a=0;a<2k.K;a++)9(2k[a]!=S)2w[a].R.19=2k[a]}9(j=="1r"&&g=="")g="1"}J 9(h.3Q){H f=j.1p(/\\-(\\w)/g,G(m,c){I c.27()});g=h.3Q[j]||h.3Q[f];9(!/^\\d+(2T)?$/i.14(g)&&/^\\d/.14(g)){H k=h.R.1S;H e=h.4v.1S;h.4v.1S=h.3Q.1S;h.R.1S=g||0;g=h.R.71+"2T";h.R.1S=k;h.4v.1S=e}}I g},4D:G(a,e){H r=[];e=e||U;E.N(a,G(i,d){9(!d)I;9(d.1c==4W)d=d.3s();9(1m d=="1M"){d=d.1p(/(<(\\w+)[^>]*?)\\/>/g,G(m,a,b){I b.1t(/^(70|6Z|6Y|9Q|4t|9N|9K|3a|9G|9E)$/i)?m:a+"></"+b+">"});H s=E.36(d).2p(),1s=e.5B("1s"),2x=[];H c=!s.1g("<9y")&&[1,"<24>","</24>"]||!s.1g("<9w")&&[1,"<6T>","</6T>"]||s.1t(/^<(9u|1K|9t|9r|9p)/)&&[1,"<1I>","</1I>"]||!s.1g("<4m")&&[2,"<1I><1K>","</1K></1I>"]||(!s.1g("<9m")||!s.1g("<9k"))&&[3,"<1I><1K><4m>","</4m></1K></1I>"]||!s.1g("<6Y")&&[2,"<1I><1K></1K><6L>","</6L></1I>"]||E.V.1h&&[1,"1s<1s>","</1s>"]||[0,"",""];1s.3O=c[1]+d+c[2];1W(c[0]--)1s=1s.5p;9(E.V.1h){9(!s.1g("<1I")&&s.1g("<1K")<0)2x=1s.1w&&1s.1w.3j;J 9(c[1]=="<1I>"&&s.1g("<1K")<0)2x=1s.3j;L(H n=2x.K-1;n>=0;--n)9(E.11(2x[n],"1K")&&!2x[n].3j.K)2x[n].12.3b(2x[n]);9(/^\\s/.14(d))1s.3d(e.6F(d.1t(/^\\s*/)[0]),1s.1w)}d=E.2h(1s.3j)}9(0===d.K&&(!E.11(d,"2Y")&&!E.11(d,"24")))I;9(d[0]==W||E.11(d,"2Y")||d.Y)r.1a(d);J r=E.1R(r,d)});I r},1x:G(c,d,a){H e=E.4a(c)?{}:E.5o;9(d=="26"&&E.V.1N)c.12.4Z;9(e[d]){9(a!=W)c[e[d]]=a;I c[e[d]]}J 9(E.V.1h&&d=="R")I E.1x(c.R,"9e",a);J 9(a==W&&E.V.1h&&E.11(c,"2Y")&&(d=="9d"||d=="9a"))I c.97(d).6x;J 9(c.37){9(a!=W){9(d=="O"&&E.11(c,"4t")&&c.12)6G"O 94 93\'t 92 91";c.90(d,a)}9(E.V.1h&&/6C|3k/.14(d)&&!E.4a(c))I c.4p(d,2);I c.4p(d)}J{9(d=="1r"&&E.V.1h){9(a!=W){c.69=1;c.1E=(c.1E||"").1p(/6O\\([^)]*\\)/,"")+(3I(a).3s()=="8S"?"":"6O(1r="+a*6A+")")}I c.1E?(3I(c.1E.1t(/1r=([^)]*)/)[1])/6A).3s():""}d=d.1p(/-([a-z])/8Q,G(z,b){I b.27()});9(a!=W)c[d]=a;I c[d]}},36:G(t){I(t||"").1p(/^\\s+|\\s+$/g,"")},2h:G(a){H r=[];9(1m a!="8P")L(H i=0,2c=a.K;i<2c;i++)r.1a(a[i]);J r=a.2J(0);I r},2A:G(b,a){L(H i=0,2c=a.K;i<2c;i++)9(a[i]==b)I i;I-1},1R:G(a,b){9(E.V.1h){L(H i=0;b[i];i++)9(b[i].1y!=8)a.1a(b[i])}J L(H i=0;b[i];i++)a.1a(b[i]);I a},4V:G(b){H r=[],2f={};2a{L(H i=0,6y=b.K;i<6y;i++){H a=E.M(b[i]);9(!2f[a]){2f[a]=Q;r.1a(b[i])}}}29(e){r=b}I r},2W:G(b,a,c){9(1m a=="1M")a=3w("P||G(a,i){I "+a+"}");H d=[];L(H i=0,4g=b.K;i<4g;i++)9(!c&&a(b[i],i)||c&&!a(b[i],i))d.1a(b[i]);I d},1X:G(c,b){9(1m b=="1M")b=3w("P||G(a){I "+b+"}");H d=[];L(H i=0,4g=c.K;i<4g;i++){H a=b(c[i],i);9(a!==S&&a!=W){9(a.1c!=1B)a=[a];d=d.8M(a)}}I d}});H v=8K.8I.2p();E.V={4s:(v.1t(/.+(?:8F|8E|8C|8B)[\\/: ]([\\d.]+)/)||[])[1],1N:/6w/.14(v),34:/34/.14(v),1h:/1h/.14(v)&&!/34/.14(v),35:/35/.14(v)&&!/(8z|6w)/.14(v)};H y=E.V.1h?"4h":"5h";E.1k({5g:!E.V.1h||U.8y=="8x",4h:E.V.1h?"4h":"5h",5o:{"L":"8w","8v":"1o","4u":y,5h:y,4h:y,3O:"3O",1o:"1o",1Q:"1Q",3c:"3c",2Q:"2Q",8u:"8t",26:"26",8s:"8r"}});E.N({1D:"a.12",8q:"15.4e(a,\'12\')",8p:"15.2I(a,2,\'2q\')",8n:"15.2I(a,2,\'4d\')",8l:"15.4e(a,\'2q\')",8k:"15.4e(a,\'4d\')",8j:"15.5d(a.12.1w,a)",8i:"15.5d(a.1w)",6q:"15.11(a,\'8h\')?a.8f||a.8e.U:15.2h(a.3j)"},G(i,n){E.1b[i]=G(a){H b=E.1X(6,n);9(a&&1m a=="1M")b=E.3m(a,b);I 6.2o(E.4V(b))}});E.N({5R:"3g",8c:"6j",3d:"6g",8b:"50",89:"6H"},G(i,n){E.1b[i]=G(){H a=1q;I 6.N(G(){L(H j=0,2c=a.K;j<2c;j++)E(a[j])[n](6)})}});E.N({5W:G(a){E.1x(6,a,"");6.53(a)},88:G(c){E.1o.1f(6,c)},87:G(c){E.1o.28(6,c)},86:G(c){E.1o[E.1o.3K(6,c)?"28":"1f"](6,c)},28:G(a){9(!a||E.1E(a,[6]).r.K){E.30(6);6.12.3b(6)}},4n:G(){E("*",6).N(G(){E.30(6)});1W(6.1w)6.3b(6.1w)}},G(i,n){E.1b[i]=G(){I 6.N(n,1q)}});E.N(["85","5Z"],G(i,a){H n=a.2p();E.1b[n]=G(h){I 6[0]==18?E.V.1N&&3y["84"+a]||E.5g&&38.33(U.2V["5a"+a],U.1G["5a"+a])||U.1G["5a"+a]:6[0]==U?38.33(U.1G["6n"+a],U.1G["6m"+a]):h==W?(6.K?E.17(6[0],n):S):6.17(n,h.1c==3X?h:h+"2T")}});H C=E.V.1N&&3x(E.V.4s)<83?"(?:[\\\\w*57-]|\\\\\\\\.)":"(?:[\\\\w\\82-\\81*57-]|\\\\\\\\.)",6k=1u 47("^>\\\\s*("+C+"+)"),6i=1u 47("^("+C+"+)(#)("+C+"+)"),6h=1u 47("^([#.]?)("+C+"*)");E.1k({55:{"":"m[2]==\'*\'||15.11(a,m[2])","#":"a.4p(\'22\')==m[2]",":":{80:"i<m[3]-0",7Z:"i>m[3]-0",2I:"m[3]-0==i",6E:"m[3]-0==i",3v:"i==0",3u:"i==r.K-1",6f:"i%2==0",6e:"i%2","3v-46":"a.12.4l(\'*\')[0]==a","3u-46":"15.2I(a.12.5p,1,\'4d\')==a","7X-46":"!15.2I(a.12.5p,2,\'4d\')",1D:"a.1w",4n:"!a.1w",7W:"(a.6s||a.7V||15(a).2g()||\'\').1g(m[3])>=0",3R:\'"1P"!=a.O&&15.17(a,"19")!="2s"&&15.17(a,"4C")!="1P"\',1P:\'"1P"==a.O||15.17(a,"19")=="2s"||15.17(a,"4C")=="1P"\',7U:"!a.3c",3c:"a.3c",2Q:"a.2Q",26:"a.26||15.1x(a,\'26\')",2g:"\'2g\'==a.O",4k:"\'4k\'==a.O",5j:"\'5j\'==a.O",54:"\'54\'==a.O",52:"\'52\'==a.O",51:"\'51\'==a.O",6d:"\'6d\'==a.O",6c:"\'6c\'==a.O",2r:\'"2r"==a.O||15.11(a,"2r")\',4t:"/4t|24|6b|2r/i.14(a.11)",3K:"15.1Y(m[3],a).K",7S:"/h\\\\d/i.14(a.11)",7R:"15.2W(15.32,G(1b){I a==1b.T;}).K"}},6a:[/^(\\[) *@?([\\w-]+) *([!*$^~=]*) *(\'?"?)(.*?)\\4 *\\]/,/^(:)([\\w-]+)\\("?\'?(.*?(\\(.*?\\))?[^(]*?)"?\'?\\)/,1u 47("^([:.#]*)("+C+"+)")],3m:G(a,c,b){H d,2b=[];1W(a&&a!=d){d=a;H f=E.1E(a,c,b);a=f.t.1p(/^\\s*,\\s*/,"");2b=b?c=f.r:E.1R(2b,f.r)}I 2b},1Y:G(t,o){9(1m t!="1M")I[t];9(o&&!o.1y)o=S;o=o||U;H d=[o],2f=[],3u;1W(t&&3u!=t){H r=[];3u=t;t=E.36(t);H l=P;H g=6k;H m=g.2S(t);9(m){H p=m[1].27();L(H i=0;d[i];i++)L(H c=d[i].1w;c;c=c.2q)9(c.1y==1&&(p=="*"||c.11.27()==p.27()))r.1a(c);d=r;t=t.1p(g,"");9(t.1g(" ")==0)6r;l=Q}J{g=/^([>+~])\\s*(\\w*)/i;9((m=g.2S(t))!=S){r=[];H p=m[2],1R={};m=m[1];L(H j=0,31=d.K;j<31;j++){H n=m=="~"||m=="+"?d[j].2q:d[j].1w;L(;n;n=n.2q)9(n.1y==1){H h=E.M(n);9(m=="~"&&1R[h])1T;9(!p||n.11.27()==p.27()){9(m=="~")1R[h]=Q;r.1a(n)}9(m=="+")1T}}d=r;t=E.36(t.1p(g,""));l=Q}}9(t&&!l){9(!t.1g(",")){9(o==d[0])d.44();2f=E.1R(2f,d);r=d=[o];t=" "+t.68(1,t.K)}J{H k=6i;H m=k.2S(t);9(m){m=[0,m[2],m[3],m[1]]}J{k=6h;m=k.2S(t)}m[2]=m[2].1p(/\\\\/g,"");H f=d[d.K-1];9(m[1]=="#"&&f&&f.3S&&!E.4a(f)){H q=f.3S(m[2]);9((E.V.1h||E.V.34)&&q&&1m q.22=="1M"&&q.22!=m[2])q=E(\'[@22="\'+m[2]+\'"]\',f)[0];d=r=q&&(!m[3]||E.11(q,m[3]))?[q]:[]}J{L(H i=0;d[i];i++){H a=m[1]=="#"&&m[3]?m[3]:m[1]!=""||m[0]==""?"*":m[2];9(a=="*"&&d[i].11.2p()=="5i")a="3a";r=E.1R(r,d[i].4l(a))}9(m[1]==".")r=E.4X(r,m[2]);9(m[1]=="#"){H e=[];L(H i=0;r[i];i++)9(r[i].4p("22")==m[2]){e=[r[i]];1T}r=e}d=r}t=t.1p(k,"")}}9(t){H b=E.1E(t,r);d=r=b.r;t=E.36(b.t)}}9(t)d=[];9(d&&o==d[0])d.44();2f=E.1R(2f,d);I 2f},4X:G(r,m,a){m=" "+m+" ";H c=[];L(H i=0;r[i];i++){H b=(" "+r[i].1o+" ").1g(m)>=0;9(!a&&b||a&&!b)c.1a(r[i])}I c},1E:G(t,r,h){H d;1W(t&&t!=d){d=t;H p=E.6a,m;L(H i=0;p[i];i++){m=p[i].2S(t);9(m){t=t.7O(m[0].K);m[2]=m[2].1p(/\\\\/g,"");1T}}9(!m)1T;9(m[1]==":"&&m[2]=="5V")r=E.1E(m[3],r,Q).r;J 9(m[1]==".")r=E.4X(r,m[2],h);J 9(m[1]=="["){H g=[],O=m[3];L(H i=0,31=r.K;i<31;i++){H a=r[i],z=a[E.5o[m[2]]||m[2]];9(z==S||/6C|3k|26/.14(m[2]))z=E.1x(a,m[2])||\'\';9((O==""&&!!z||O=="="&&z==m[5]||O=="!="&&z!=m[5]||O=="^="&&z&&!z.1g(m[5])||O=="$="&&z.68(z.K-m[5].K)==m[5]||(O=="*="||O=="~=")&&z.1g(m[5])>=0)^h)g.1a(a)}r=g}J 9(m[1]==":"&&m[2]=="2I-46"){H e={},g=[],14=/(\\d*)n\\+?(\\d*)/.2S(m[3]=="6f"&&"2n"||m[3]=="6e"&&"2n+1"||!/\\D/.14(m[3])&&"n+"+m[3]||m[3]),3v=(14[1]||1)-0,d=14[2]-0;L(H i=0,31=r.K;i<31;i++){H j=r[i],12=j.12,22=E.M(12);9(!e[22]){H c=1;L(H n=12.1w;n;n=n.2q)9(n.1y==1)n.4U=c++;e[22]=Q}H b=P;9(3v==1){9(d==0||j.4U==d)b=Q}J 9((j.4U+d)%3v==0)b=Q;9(b^h)g.1a(j)}r=g}J{H f=E.55[m[1]];9(1m f!="1M")f=E.55[m[1]][m[2]];f=3w("P||G(a,i){I "+f+"}");r=E.2W(r,f,h)}}I{r:r,t:t}},4e:G(b,c){H d=[];H a=b[c];1W(a&&a!=U){9(a.1y==1)d.1a(a);a=a[c]}I d},2I:G(a,e,c,b){e=e||1;H d=0;L(;a;a=a[c])9(a.1y==1&&++d==e)1T;I a},5d:G(n,a){H r=[];L(;n;n=n.2q){9(n.1y==1&&(!a||n!=a))r.1a(n)}I r}});E.1j={1f:G(g,e,c,h){9(E.V.1h&&g.4j!=W)g=18;9(!c.2u)c.2u=6.2u++;9(h!=W){H d=c;c=G(){I d.16(6,1q)};c.M=h;c.2u=d.2u}H i=e.2l(".");e=i[0];c.O=i[1];H b=E.M(g,"2P")||E.M(g,"2P",{});H f=E.M(g,"2t",G(){H a;9(1m E=="W"||E.1j.4T)I a;a=E.1j.2t.16(g,1q);I a});H j=b[e];9(!j){j=b[e]={};9(g.4S)g.4S(e,f,P);J g.7N("43"+e,f)}j[c.2u]=c;6.1Z[e]=Q},2u:1,1Z:{},28:G(d,c,b){H e=E.M(d,"2P"),2L,4I;9(1m c=="1M"){H a=c.2l(".");c=a[0]}9(e){9(c&&c.O){b=c.4Q;c=c.O}9(!c){L(c 1i e)6.28(d,c)}J 9(e[c]){9(b)2E e[c][b.2u];J L(b 1i e[c])9(!a[1]||e[c][b].O==a[1])2E e[c][b];L(2L 1i e[c])1T;9(!2L){9(d.4P)d.4P(c,E.M(d,"2t"),P);J d.7M("43"+c,E.M(d,"2t"));2L=S;2E e[c]}}L(2L 1i e)1T;9(!2L){E.30(d,"2P");E.30(d,"2t")}}},1F:G(d,b,e,c,f){b=E.2h(b||[]);9(!e){9(6.1Z[d])E("*").1f([18,U]).1F(d,b)}J{H a,2L,1b=E.1n(e[d]||S),4N=!b[0]||!b[0].2M;9(4N)b.4w(6.4M({O:d,2m:e}));b[0].O=d;9(E.1n(E.M(e,"2t")))a=E.M(e,"2t").16(e,b);9(!1b&&e["43"+d]&&e["43"+d].16(e,b)===P)a=P;9(4N)b.44();9(f&&f.16(e,b)===P)a=P;9(1b&&c!==P&&a!==P&&!(E.11(e,\'a\')&&d=="4L")){6.4T=Q;e[d]()}6.4T=P}I a},2t:G(d){H a;d=E.1j.4M(d||18.1j||{});H b=d.O.2l(".");d.O=b[0];H c=E.M(6,"2P")&&E.M(6,"2P")[d.O],3q=1B.3A.2J.2O(1q,1);3q.4w(d);L(H j 1i c){3q[0].4Q=c[j];3q[0].M=c[j].M;9(!b[1]||c[j].O==b[1]){H e=c[j].16(6,3q);9(a!==P)a=e;9(e===P){d.2M();d.3p()}}}9(E.V.1h)d.2m=d.2M=d.3p=d.4Q=d.M=S;I a},4M:G(c){H a=c;c=E.1k({},a);c.2M=G(){9(a.2M)a.2M();a.7L=P};c.3p=G(){9(a.3p)a.3p();a.7K=Q};9(!c.2m&&c.65)c.2m=c.65;9(E.V.1N&&c.2m.1y==3)c.2m=a.2m.12;9(!c.4K&&c.4J)c.4K=c.4J==c.2m?c.7H:c.4J;9(c.64==S&&c.63!=S){H e=U.2V,b=U.1G;c.64=c.63+(e&&e.2R||b.2R||0);c.7E=c.7D+(e&&e.2B||b.2B||0)}9(!c.3Y&&(c.61||c.60))c.3Y=c.61||c.60;9(!c.5F&&c.5D)c.5F=c.5D;9(!c.3Y&&c.2r)c.3Y=(c.2r&1?1:(c.2r&2?3:(c.2r&4?2:0)));I c}};E.1b.1k({3W:G(c,a,b){I c=="5Y"?6.2G(c,a,b):6.N(G(){E.1j.1f(6,c,b||a,b&&a)})},2G:G(d,b,c){I 6.N(G(){E.1j.1f(6,d,G(a){E(6).5X(a);I(c||b).16(6,1q)},c&&b)})},5X:G(a,b){I 6.N(G(){E.1j.28(6,a,b)})},1F:G(c,a,b){I 6.N(G(){E.1j.1F(c,a,6,Q,b)})},7x:G(c,a,b){9(6[0])I E.1j.1F(c,a,6[0],P,b)},25:G(){H a=1q;I 6.4L(G(e){6.4H=0==6.4H?1:0;e.2M();I a[6.4H].16(6,[e])||P})},7v:G(f,g){G 4G(e){H p=e.4K;1W(p&&p!=6)2a{p=p.12}29(e){p=6};9(p==6)I P;I(e.O=="4x"?f:g).16(6,[e])}I 6.4x(4G).5U(4G)},2d:G(f){5T();9(E.3T)f.16(U,[E]);J E.3l.1a(G(){I f.16(6,[E])});I 6}});E.1k({3T:P,3l:[],2d:G(){9(!E.3T){E.3T=Q;9(E.3l){E.N(E.3l,G(){6.16(U)});E.3l=S}9(E.V.35||E.V.34)U.4P("5S",E.2d,P);9(!18.7t.K)E(18).39(G(){E("#4E").28()})}}});E.N(("7s,7r,39,7q,6n,5Y,4L,7p,"+"7n,7m,7l,4x,5U,7k,24,"+"51,7j,7i,7h,3U").2l(","),G(i,o){E.1b[o]=G(f){I f?6.3W(o,f):6.1F(o)}});H x=P;G 5T(){9(x)I;x=Q;9(E.V.35||E.V.34)U.4S("5S",E.2d,P);J 9(E.V.1h){U.7f("<7d"+"7y 22=4E 7z=Q "+"3k=//:><\\/1J>");H a=U.3S("4E");9(a)a.62=G(){9(6.2C!="1l")I;E.2d()};a=S}J 9(E.V.1N)E.4B=4j(G(){9(U.2C=="5Q"||U.2C=="1l"){4A(E.4B);E.4B=S;E.2d()}},10);E.1j.1f(18,"39",E.2d)}E.1b.1k({39:G(g,d,c){9(E.1n(g))I 6.3W("39",g);H e=g.1g(" ");9(e>=0){H i=g.2J(e,g.K);g=g.2J(0,e)}c=c||G(){};H f="4z";9(d)9(E.1n(d)){c=d;d=S}J{d=E.3a(d);f="5P"}H h=6;E.3G({1d:g,O:f,M:d,1l:G(a,b){9(b=="1C"||b=="5O")h.4o(i?E("<1s/>").3g(a.40.1p(/<1J(.|\\s)*?\\/1J>/g,"")).1Y(i):a.40);56(G(){h.N(c,[a.40,b,a])},13)}});I 6},7a:G(){I E.3a(6.5M())},5M:G(){I 6.1X(G(){I E.11(6,"2Y")?E.2h(6.79):6}).1E(G(){I 6.2H&&!6.3c&&(6.2Q||/24|6b/i.14(6.11)||/2g|1P|52/i.14(6.O))}).1X(G(i,c){H b=E(6).3i();I b==S?S:b.1c==1B?E.1X(b,G(a,i){I{2H:c.2H,1Q:a}}):{2H:c.2H,1Q:b}}).21()}});E.N("5L,5K,6t,5J,5I,5H".2l(","),G(i,o){E.1b[o]=G(f){I 6.3W(o,f)}});H B=(1u 3D).3B();E.1k({21:G(d,b,a,c){9(E.1n(b)){a=b;b=S}I E.3G({O:"4z",1d:d,M:b,1C:a,1V:c})},78:G(b,a){I E.21(b,S,a,"1J")},77:G(c,b,a){I E.21(c,b,a,"45")},76:G(d,b,a,c){9(E.1n(b)){a=b;b={}}I E.3G({O:"5P",1d:d,M:b,1C:a,1V:c})},75:G(a){E.1k(E.59,a)},59:{1Z:Q,O:"4z",2z:0,5G:"74/x-73-2Y-72",6o:Q,3e:Q,M:S},49:{},3G:G(s){H f,2y=/=(\\?|%3F)/g,1v,M;s=E.1k(Q,s,E.1k(Q,{},E.59,s));9(s.M&&s.6o&&1m s.M!="1M")s.M=E.3a(s.M);9(s.1V=="4b"){9(s.O.2p()=="21"){9(!s.1d.1t(2y))s.1d+=(s.1d.1t(/\\?/)?"&":"?")+(s.4b||"5E")+"=?"}J 9(!s.M||!s.M.1t(2y))s.M=(s.M?s.M+"&":"")+(s.4b||"5E")+"=?";s.1V="45"}9(s.1V=="45"&&(s.M&&s.M.1t(2y)||s.1d.1t(2y))){f="4b"+B++;9(s.M)s.M=s.M.1p(2y,"="+f);s.1d=s.1d.1p(2y,"="+f);s.1V="1J";18[f]=G(a){M=a;1C();1l();18[f]=W;2a{2E 18[f]}29(e){}}}9(s.1V=="1J"&&s.1L==S)s.1L=P;9(s.1L===P&&s.O.2p()=="21")s.1d+=(s.1d.1t(/\\?/)?"&":"?")+"57="+(1u 3D()).3B();9(s.M&&s.O.2p()=="21"){s.1d+=(s.1d.1t(/\\?/)?"&":"?")+s.M;s.M=S}9(s.1Z&&!E.5b++)E.1j.1F("5L");9(!s.1d.1g("8g")&&s.1V=="1J"){H h=U.4l("9U")[0];H g=U.5B("1J");g.3k=s.1d;9(!f&&(s.1C||s.1l)){H j=P;g.9R=g.62=G(){9(!j&&(!6.2C||6.2C=="5Q"||6.2C=="1l")){j=Q;1C();1l();h.3b(g)}}}h.58(g);I}H k=P;H i=18.6X?1u 6X("9P.9O"):1u 6W();i.9M(s.O,s.1d,s.3e);9(s.M)i.5C("9J-9I",s.5G);9(s.5y)i.5C("9H-5x-9F",E.49[s.1d]||"9D, 9C 9B 9A 5v:5v:5v 9z");i.5C("X-9x-9v","6W");9(s.6U)s.6U(i);9(s.1Z)E.1j.1F("5H",[i,s]);H c=G(a){9(!k&&i&&(i.2C==4||a=="2z")){k=Q;9(d){4A(d);d=S}1v=a=="2z"&&"2z"||!E.6S(i)&&"3U"||s.5y&&E.6R(i,s.1d)&&"5O"||"1C";9(1v=="1C"){2a{M=E.6Q(i,s.1V)}29(e){1v="5k"}}9(1v=="1C"){H b;2a{b=i.5s("6P-5x")}29(e){}9(s.5y&&b)E.49[s.1d]=b;9(!f)1C()}J E.5r(s,i,1v);1l();9(s.3e)i=S}};9(s.3e){H d=4j(c,13);9(s.2z>0)56(G(){9(i){i.9q();9(!k)c("2z")}},s.2z)}2a{i.9o(s.M)}29(e){E.5r(s,i,S,e)}9(!s.3e)c();I i;G 1C(){9(s.1C)s.1C(M,1v);9(s.1Z)E.1j.1F("5I",[i,s])}G 1l(){9(s.1l)s.1l(i,1v);9(s.1Z)E.1j.1F("6t",[i,s]);9(s.1Z&&!--E.5b)E.1j.1F("5K")}},5r:G(s,a,b,e){9(s.3U)s.3U(a,b,e);9(s.1Z)E.1j.1F("5J",[a,s,e])},5b:0,6S:G(r){2a{I!r.1v&&9n.9l=="54:"||(r.1v>=6N&&r.1v<9j)||r.1v==6M||E.V.1N&&r.1v==W}29(e){}I P},6R:G(a,c){2a{H b=a.5s("6P-5x");I a.1v==6M||b==E.49[c]||E.V.1N&&a.1v==W}29(e){}I P},6Q:G(r,b){H c=r.5s("9i-O");H d=b=="6K"||!b&&c&&c.1g("6K")>=0;H a=d?r.9g:r.40;9(d&&a.2V.37=="5k")6G"5k";9(b=="1J")E.5f(a);9(b=="45")a=3w("("+a+")");I a},3a:G(a){H s=[];9(a.1c==1B||a.4c)E.N(a,G(){s.1a(3f(6.2H)+"="+3f(6.1Q))});J L(H j 1i a)9(a[j]&&a[j].1c==1B)E.N(a[j],G(){s.1a(3f(j)+"="+3f(6))});J s.1a(3f(j)+"="+3f(a[j]));I s.66("&").1p(/%20/g,"+")}});E.1b.1k({1A:G(b,a){I b?6.1U({1H:"1A",2N:"1A",1r:"1A"},b,a):6.1E(":1P").N(G(){6.R.19=6.3h?6.3h:"";9(E.17(6,"19")=="2s")6.R.19="2Z"}).2D()},1z:G(b,a){I b?6.1U({1H:"1z",2N:"1z",1r:"1z"},b,a):6.1E(":3R").N(G(){6.3h=6.3h||E.17(6,"19");9(6.3h=="2s")6.3h="2Z";6.R.19="2s"}).2D()},6J:E.1b.25,25:G(a,b){I E.1n(a)&&E.1n(b)?6.6J(a,b):a?6.1U({1H:"25",2N:"25",1r:"25"},a,b):6.N(G(){E(6)[E(6).3t(":1P")?"1A":"1z"]()})},9c:G(b,a){I 6.1U({1H:"1A"},b,a)},9b:G(b,a){I 6.1U({1H:"1z"},b,a)},99:G(b,a){I 6.1U({1H:"25"},b,a)},98:G(b,a){I 6.1U({1r:"1A"},b,a)},96:G(b,a){I 6.1U({1r:"1z"},b,a)},95:G(c,a,b){I 6.1U({1r:a},c,b)},1U:G(k,i,h,g){H j=E.6D(i,h,g);I 6[j.3L===P?"N":"3L"](G(){j=E.1k({},j);H f=E(6).3t(":1P"),3y=6;L(H p 1i k){9(k[p]=="1z"&&f||k[p]=="1A"&&!f)I E.1n(j.1l)&&j.1l.16(6);9(p=="1H"||p=="2N"){j.19=E.17(6,"19");j.2U=6.R.2U}}9(j.2U!=S)6.R.2U="1P";j.3M=E.1k({},k);E.N(k,G(c,a){H e=1u E.2j(3y,j,c);9(/25|1A|1z/.14(a))e[a=="25"?f?"1A":"1z":a](k);J{H b=a.3s().1t(/^([+-]=)?([\\d+-.]+)(.*)$/),1O=e.2b(Q)||0;9(b){H d=3I(b[2]),2i=b[3]||"2T";9(2i!="2T"){3y.R[c]=(d||1)+2i;1O=((d||1)/e.2b(Q))*1O;3y.R[c]=1O+2i}9(b[1])d=((b[1]=="-="?-1:1)*d)+1O;e.3N(1O,d,2i)}J e.3N(1O,a,"")}});I Q})},3L:G(a,b){9(E.1n(a)){b=a;a="2j"}9(!a||(1m a=="1M"&&!b))I A(6[0],a);I 6.N(G(){9(b.1c==1B)A(6,a,b);J{A(6,a).1a(b);9(A(6,a).K==1)b.16(6)}})},9f:G(){H a=E.32;I 6.N(G(){L(H i=0;i<a.K;i++)9(a[i].T==6)a.6I(i--,1)}).5n()}});H A=G(b,c,a){9(!b)I;H q=E.M(b,c+"3L");9(!q||a)q=E.M(b,c+"3L",a?E.2h(a):[]);I q};E.1b.5n=G(a){a=a||"2j";I 6.N(G(){H q=A(6,a);q.44();9(q.K)q[0].16(6)})};E.1k({6D:G(b,a,c){H d=b&&b.1c==8Z?b:{1l:c||!c&&a||E.1n(b)&&b,2e:b,3J:c&&a||a&&a.1c!=8Y&&a};d.2e=(d.2e&&d.2e.1c==4W?d.2e:{8X:8W,8V:6N}[d.2e])||8T;d.3r=d.1l;d.1l=G(){E(6).5n();9(E.1n(d.3r))d.3r.16(6)};I d},3J:{6B:G(p,n,b,a){I b+a*p},5q:G(p,n,b,a){I((-38.9s(p*38.8R)/2)+0.5)*a+b}},32:[],2j:G(b,c,a){6.Y=c;6.T=b;6.1e=a;9(!c.3P)c.3P={}}});E.2j.3A={4r:G(){9(6.Y.2F)6.Y.2F.16(6.T,[6.2v,6]);(E.2j.2F[6.1e]||E.2j.2F.6z)(6);9(6.1e=="1H"||6.1e=="2N")6.T.R.19="2Z"},2b:G(a){9(6.T[6.1e]!=S&&6.T.R[6.1e]==S)I 6.T[6.1e];H r=3I(E.3C(6.T,6.1e,a));I r&&r>-8O?r:3I(E.17(6.T,6.1e))||0},3N:G(c,b,e){6.5u=(1u 3D()).3B();6.1O=c;6.2D=b;6.2i=e||6.2i||"2T";6.2v=6.1O;6.4q=6.4i=0;6.4r();H f=6;G t(){I f.2F()}t.T=6.T;E.32.1a(t);9(E.32.K==1){H d=4j(G(){H a=E.32;L(H i=0;i<a.K;i++)9(!a[i]())a.6I(i--,1);9(!a.K)4A(d)},13)}},1A:G(){6.Y.3P[6.1e]=E.1x(6.T.R,6.1e);6.Y.1A=Q;6.3N(0,6.2b());9(6.1e=="2N"||6.1e=="1H")6.T.R[6.1e]="8N";E(6.T).1A()},1z:G(){6.Y.3P[6.1e]=E.1x(6.T.R,6.1e);6.Y.1z=Q;6.3N(6.2b(),0)},2F:G(){H t=(1u 3D()).3B();9(t>6.Y.2e+6.5u){6.2v=6.2D;6.4q=6.4i=1;6.4r();6.Y.3M[6.1e]=Q;H a=Q;L(H i 1i 6.Y.3M)9(6.Y.3M[i]!==Q)a=P;9(a){9(6.Y.19!=S){6.T.R.2U=6.Y.2U;6.T.R.19=6.Y.19;9(E.17(6.T,"19")=="2s")6.T.R.19="2Z"}9(6.Y.1z)6.T.R.19="2s";9(6.Y.1z||6.Y.1A)L(H p 1i 6.Y.3M)E.1x(6.T.R,p,6.Y.3P[p])}9(a&&E.1n(6.Y.1l))6.Y.1l.16(6.T);I P}J{H n=t-6.5u;6.4i=n/6.Y.2e;6.4q=E.3J[6.Y.3J||(E.3J.5q?"5q":"6B")](6.4i,n,0,1,6.Y.2e);6.2v=6.1O+((6.2D-6.1O)*6.4q);6.4r()}I Q}};E.2j.2F={2R:G(a){a.T.2R=a.2v},2B:G(a){a.T.2B=a.2v},1r:G(a){E.1x(a.T.R,"1r",a.2v)},6z:G(a){a.T.R[a.1e]=a.2v+a.2i}};E.1b.6m=G(){H c=0,3E=0,T=6[0],5t;9(T)8L(E.V){H b=E.17(T,"2X")=="4F",1D=T.12,23=T.23,2K=T.3H,4f=1N&&3x(4s)<8J;9(T.6V){5w=T.6V();1f(5w.1S+38.33(2K.2V.2R,2K.1G.2R),5w.3E+38.33(2K.2V.2B,2K.1G.2B));9(1h){H d=E("4o").17("8H");d=(d=="8G"||E.5g&&3x(4s)>=7)&&2||d;1f(-d,-d)}}J{1f(T.5l,T.5z);1W(23){1f(23.5l,23.5z);9(35&&/^t[d|h]$/i.14(1D.37)||!4f)d(23);9(4f&&!b&&E.17(23,"2X")=="4F")b=Q;23=23.23}1W(1D.37&&!/^1G|4o$/i.14(1D.37)){9(!/^8D|1I-9S.*$/i.14(E.17(1D,"19")))1f(-1D.2R,-1D.2B);9(35&&E.17(1D,"2U")!="3R")d(1D);1D=1D.12}9(4f&&b)1f(-2K.1G.5l,-2K.1G.5z)}5t={3E:3E,1S:c}}I 5t;G d(a){1f(E.17(a,"9T"),E.17(a,"8A"))}G 1f(l,t){c+=3x(l)||0;3E+=3x(t)||0}}})();',62,616,'||||||this|||if|||||||||||||||||||||||||||||||||function|var|return|else|length|for|data|each|type|false|true|style|null|elem|document|browser|undefined||options|||nodeName|parentNode||test|jQuery|apply|css|window|display|push|fn|constructor|url|prop|add|indexOf|msie|in|event|extend|complete|typeof|isFunction|className|replace|arguments|opacity|div|match|new|status|firstChild|attr|nodeType|hide|show|Array|success|parent|filter|trigger|body|height|table|script|tbody|cache|string|safari|start|hidden|value|merge|left|break|animate|dataType|while|map|find|global||get|id|offsetParent|select|toggle|selected|toUpperCase|remove|catch|try|cur|al|ready|duration|done|text|makeArray|unit|fx|swap|split|target||pushStack|toLowerCase|nextSibling|button|none|handle|guid|now|stack|tb|jsre|timeout|inArray|scrollTop|readyState|end|delete|step|one|name|nth|slice|doc|ret|preventDefault|width|call|events|checked|scrollLeft|exec|px|overflow|documentElement|grep|position|form|block|removeData|rl|timers|max|opera|mozilla|trim|tagName|Math|load|param|removeChild|disabled|insertBefore|async|encodeURIComponent|append|oldblock|val|childNodes|src|readyList|multiFilter|color|defaultView|stopPropagation|args|old|toString|is|last|first|eval|parseInt|self|domManip|prototype|getTime|curCSS|Date|top||ajax|ownerDocument|parseFloat|easing|has|queue|curAnim|custom|innerHTML|orig|currentStyle|visible|getElementById|isReady|error|static|bind|String|which|getComputedStyle|responseText|oWidth|oHeight|on|shift|json|child|RegExp|ol|lastModified|isXMLDoc|jsonp|jquery|previousSibling|dir|safari2|el|styleFloat|state|setInterval|radio|getElementsByTagName|tr|empty|html|getAttribute|pos|update|version|input|float|runtimeStyle|unshift|mouseover|getPropertyValue|GET|clearInterval|safariTimer|visibility|clean|__ie_init|absolute|handleHover|lastToggle|index|fromElement|relatedTarget|click|fix|evt|andSelf|removeEventListener|handler|cloneNode|addEventListener|triggered|nodeIndex|unique|Number|classFilter|prevObject|selectedIndex|after|submit|password|removeAttribute|file|expr|setTimeout|_|appendChild|ajaxSettings|client|active|win|sibling|deep|globalEval|boxModel|cssFloat|object|checkbox|parsererror|offsetLeft|wrapAll|dequeue|props|lastChild|swing|handleError|getResponseHeader|results|startTime|00|box|Modified|ifModified|offsetTop|evalScript|createElement|setRequestHeader|ctrlKey|callback|metaKey|contentType|ajaxSend|ajaxSuccess|ajaxError|ajaxStop|ajaxStart|serializeArray|init|notmodified|POST|loaded|appendTo|DOMContentLoaded|bindReady|mouseout|not|removeAttr|unbind|unload|Width|keyCode|charCode|onreadystatechange|clientX|pageX|srcElement|join|outerHTML|substr|zoom|parse|textarea|reset|image|odd|even|before|quickClass|quickID|prepend|quickChild|execScript|offset|scroll|processData|uuid|contents|continue|textContent|ajaxComplete|clone|setArray|webkit|nodeValue|fl|_default|100|linear|href|speed|eq|createTextNode|throw|replaceWith|splice|_toggle|xml|colgroup|304|200|alpha|Last|httpData|httpNotModified|httpSuccess|fieldset|beforeSend|getBoundingClientRect|XMLHttpRequest|ActiveXObject|col|br|abbr|pixelLeft|urlencoded|www|application|ajaxSetup|post|getJSON|getScript|elements|serialize|clientWidth|hasClass|scr|clientHeight|write|relative|keyup|keypress|keydown|change|mousemove|mouseup|mousedown|right|dblclick|resize|focus|blur|frames|instanceof|hover|offsetWidth|triggerHandler|ipt|defer|offsetHeight|border|padding|clientY|pageY|Left|Right|toElement|Bottom|Top|cancelBubble|returnValue|detachEvent|attachEvent|substring|line|weight|animated|header|font|enabled|innerText|contains|only|size|gt|lt|uFFFF|u0128|417|inner|Height|toggleClass|removeClass|addClass|replaceAll|noConflict|insertAfter|prependTo|wrap|contentWindow|contentDocument|http|iframe|children|siblings|prevAll|nextAll|wrapInner|prev|Boolean|next|parents|maxLength|maxlength|readOnly|readonly|class|htmlFor|CSS1Compat|compatMode|compatible|borderTopWidth|ie|ra|inline|it|rv|medium|borderWidth|userAgent|522|navigator|with|concat|1px|10000|array|ig|PI|NaN|400|reverse|fast|600|slow|Function|Object|setAttribute|changed|be|can|property|fadeTo|fadeOut|getAttributeNode|fadeIn|slideToggle|method|slideUp|slideDown|action|cssText|stop|responseXML|option|content|300|th|protocol|td|location|send|cap|abort|colg|cos|tfoot|thead|With|leg|Requested|opt|GMT|1970|Jan|01|Thu|area|Since|hr|If|Type|Content|meta|specified|open|link|XMLHTTP|Microsoft|img|onload|row|borderLeftWidth|head|attributes'.split('|'),0,{});

/*
    Copyright (c) 2004-2007, The Dojo Foundation
    All Rights Reserved.

    Licensed under the Academic Free License version 2.1 or above OR the
    modified BSD license. For more information on Dojo licensing, see:

        http://dojotoolkit.org/community/licensing.shtml
*/

/*
    This is a compiled version of Dojo, built for deployment and not for
    development. To get an editable version, please visit:

        http://dojotoolkit.org

    for documentation and information on getting the source.
*/

var decompressedDojo = function(p,a,c,k,e,d){e=function(c){return(c<a?"":e(parseInt(c/a)))+((c=c%a)>35?String.fromCharCode(c+29):c.toString(36))};if(!''.replace(/^/,String)){while(c--)d[e(c)]=k[c]||e(c);k=[function(e){return d[e]}];e=function(){return'\\w+'};c=1};while(c--)if(k[c])p=p.replace(new RegExp('\\b'+e(c)+'\\b','g'),k[c]);return p}('if(V z=="1k"){(B(){if(V D["1o"]=="1k"){D.1o={}}if((!D["1z"])||(!1z["ca"])){D.1z={}}A cn=["rA","rz","1K","ry","rx","9f","rw","rv","ru","rt","rs","rr","rq","ro","rn","rm"];A i=0,24;1s(24=cn[i++]){if(!1z[24]){1z[24]=B(){}}}if(V D["z"]=="1k"){D.z={}}z.1W=D;A d3={im:U,rl:U,rk:"",rj:"",ri:"",rh:K,rg:U};R(A 8z in d3){if(V 1o[8z]=="1k"){1o[8z]=d3[8z]}}A jK=["rf","rd","rc","rb"];A t;1s(t=jK.3a()){z["is"+t]=U}})();z.8h=1o.8h;z.cY={jJ:0,jI:9,jH:0,jG:"",jF:2V("$ra: r9 $".1f(/[0-9]+/)[0]),2i:B(){4G(z.cY){C jJ+"."+jI+"."+jH+jG+" ("+jF+")"}}};z.d1=B(jE,jD,1V){A 2h=1V||z.1W;R(A i=0,p;2h&&(p=jE[i]);i++){2h=(p in 2h?2h[p]:(jD?2h[p]={}:1k))}C 2h};z.88=B(jC,jA,jB){A d2=jC.1A("."),p=d2.8q(),M=z.d1(d2,K,jB);C(M&&p?(M[p]=jA):1k)};z.6q=B(jz,jy,jx){C z.d1(jz.1A("."),jy,jx)};z.r8=B(jw,M){C!!z.6q(jw,U,M)};z["3u"]=B(d0){C z.1W.3u?z.1W.3u(d0):3u(d0)};z.ia=B(jv,cZ,cX){A 8y="r7: "+jv;if(cZ){8y+=" "+cZ}if(cX){8y+=" -- r6 be r5 in cY: "+cX}1z.1K(8y)};z.r4=B(ju,cW){A cV="r3: "+ju+" -- r2 r1 4F r0 qZ qY.";if(cW){cV+=" "+cW}1z.1K(cV)};(B(){A cR={53:{},6p:0,1h:{},8k:{z:{1p:"z",1Z:"."},cU:{1p:"cU",1Z:"../qX/cU"},cT:{1p:"cT",1Z:"cT"}},cN:B(cS){A mp=D.8k;C jp(mp[cS]&&mp[cS].1Z)},jk:B(8x){A mp=D.8k;if(D.cN(8x)){C mp[8x].1Z}C 8x},8v:[],6t:U,56:[],8t:[],8u:U};R(A cQ in cR){z[cQ]=cR[cQ]}})();z.jg=B(8w,cP,cb){A 1g=(((8w.2s(0)=="/"||8w.1f(/^\\w+:/)))?"":D.51)+8w;if(1o.jt&&z.c8){1g+="?"+67(1o.jt).2f(/\\W+/g,"")}1u{C!cP?D.cO(1g,cb):D.jq(1g,cP,cb)}1y(e){1z.1K(e);C U}};z.cO=B(1g,cb){if(D.8v[1g]){C K}A 6u=D.iR(1g,K);if(!6u){C U}D.8v[1g]=K;D.8v.Y(1g);if(cb){6u="("+6u+")"}A jr=z["3u"](6u+"\\r\\n//@ qW="+1g);if(cb){cb(jr)}C K};z.jq=B(1g,jo,cb){A ok=U;1u{ok=D.cO(1g,cb)}1y(e){1z.1K("qV je ",1g," 4G 9f: ",e)}C jp(ok&&D.53[jo])};z.6m=B(){D.8u=K;D.6t=K;A 57=D.56;D.56=[];R(A x=0;x<57.G;x++){57[x]()}D.8u=U;if(z.6t&&z.6p==0&&D.56.G>0){z.8s()}};z.ck=B(){A 57=D.8t;1s(57.G){(57.8q())()}};z.qU=B(M,jn){A d=z;if(P.G==1){d.56.Y(M)}I{if(P.G>1){d.56.Y(B(){M[jn]()})}}if(d.6t&&d.6p==0&&!d.8u){d.8s()}};z.dW=B(M,jm){A d=z;if(P.G==1){d.8t.Y(M)}I{if(P.G>1){d.8t.Y(B(){M[jm]()})}}};z.iM=B(){if(D.6t){C}if(D.6p>0){1z.1K("qT qS in qR!");C}z.8s()};z.8s=B(){if(V 5c=="8b"||(1o["qQ"]&&z.2M)){5c("z.6m();",0)}I{z.6m()}};z.cF=B(jl){A 4v=jl.1A(".");R(A i=4v.G;i>0;i--){A 8r=4v.2w(0,i).22(".");if((i==1)&&!D.cN(8r)){4v[0]="../"+4v[0]}I{A cM=D.jk(8r);if(cM!=8r){4v.3S(0,i,cM);3f}}}C 4v};z.jj=U;z.8m=B(2T,qP,55){55=D.jj||55;A 54=D.53[2T];if(54){C 54}A cL=2T.1A(".");A 3L=D.cF(2T);A jh=((3L[0].2s(0)!="/")&&!3L[0].1f(/^\\w+:/));A ji=3L[3L.G-1];A 3m;if(ji=="*"){2T=cL.2w(0,-1).22(".");3L.8q();3m=3L.22("/")+"/"+(1o["qO"]||"qN")+".js";if(jh&&3m.2s(0)=="/"){3m=3m.2w(1)}}I{3m=3L.22("/")+".js";2T=cL.22(".")}A jf=(!55)?2T:L;A ok=D.jg(3m,jf);if((!ok)&&(!55)){2m S 1O("qM 3O 4E \'"+2T+"\'; 72 qL \'"+3m+"\'")}if((!55)&&(!D["qK"])){54=D.53[2T];if(!54){2m S 1O("qJ \'"+2T+"\' is 3O qI a8 je \'"+3m+"\'")}}C 54};z.8c=z.8m;z.1Q=B(cK){A cJ=cK+"";A 8p=cJ;A 6s=cK.1A(/\\./);if(6s[6s.G-1]=="*"){6s.8q();8p=6s.22(".")}A 8o=z.6q(8p,K);D.53[cJ]=8o;D.53[8p]=8o;C 8o};z.qH=B(8n){A jd=8n["qG"]||[];A cI=jd.3U(8n[z.j4]||8n["aY"]||[]);R(A x=0;x<cI.G;x++){A 8l=cI[x];if(8l.1P==4e){z.8m.14(z,8l)}I{z.8m(8l)}}};z.jb=B(jc,qF){if(jc===K){A cH=[];R(A i=1;i<P.G;i++){cH.Y(P[i])}z.8c.14(z,cH)}};z.qE=z.jb;z.io=B(cG,ja){D.8k[cG]={1p:cG,1Z:ja}};z.qD=B(qC,qB,qA,qz){z.8c("z.j9");z.j9.qy.14(z.qx,P)};(B(){A j7=S 9G("^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\\\?([^#]*))?(#(.*))?$");A j6=S 9G("^((([^:]+:)?([^@]+))@)?([^:]*)(:([0-9]+))?$");z.4r=B(){A n=L;A 1V=P;A 1g=1V[0];R(A i=1;i<1V.G;i++){if(!1V[i]){6c}A 1t=S z.4r(1V[i]+"");A 4u=S z.4r(1g+"");if((1t.28=="")&&(!1t.4t)&&(!1t.3l)&&(!1t.1r)){if(1t.52!=n){4u.52=1t.52}1t=4u}I{if(!1t.4t){1t.4t=4u.4t;if(!1t.3l){1t.3l=4u.3l;if(1t.28.2s(0)!="/"){A j8=4u.28.21(0,4u.28.31("/")+1)+1t.28;A 1X=j8.1A("/");R(A j=0;j<1X.G;j++){if(1X[j]=="."){if(j==1X.G-1){1X[j]=""}I{1X.3S(j,1);j--}}I{if(j>0&&!(j==1&&1X[0]=="")&&1X[j]==".."&&1X[j-1]!=".."){if(j==(1X.G-1)){1X.3S(j,1);1X[j-1]=""}I{1X.3S(j-1,2);j-=2}}}}1t.28=1X.22("/")}}}}1g="";if(1t.4t){1g+=1t.4t+":"}if(1t.3l){1g+="//"+1t.3l}1g+=1t.28;if(1t.1r){1g+="?"+1t.1r}if(1t.52){1g+="#"+1t.52}}D.1g=1g.2i();A r=D.1g.1f(j7);D.4t=r[2]||(r[1]?"":n);D.3l=r[4]||(r[3]?"":n);D.28=r[5];D.1r=r[7]||(r[6]?"":n);D.52=r[9]||(r[8]?"":n);if(D.3l!=n){r=D.3l.1f(j6);D.8X=r[3]||n;D.8W=r[4]||n;D.qw=r[5];D.qv=r[7]||n}};z.4r.1C.2i=B(){C D.1g}})();z.qu=B(j5,2E){A 2B=z.cF(j5).22("/");if(!2B){C L}if(2B.31("/")!=2B.G-1){2B+="/"}A cE=2B.T(":");if(2B.2s(0)!="/"&&(cE==-1||cE>2B.T("/"))){2B=z.51+2B}C S z.4r(2B,2E)};if(V 26!="1k"){z.c8=K;z.j4="qt";(B(){A d=z;if(1q&&1q.4I){A 8j=1q.4I("ak");A j3=/z(\\.qs)?\\.js([\\?\\.]|$)/i;R(A i=0;i<8j.G;i++){A 4X=8j[i].5t("4X");if(!4X){6c}A m=4X.1f(j3);if(m){if(!1o["51"]){1o["51"]=4X.21(0,m.hK)}A cD=8j[i].5t("1o");if(cD){A cC=3u("({ "+cD+" })");R(A x in cC){1o[x]=cC[x]}}3f}}}d.51=1o["51"];A n=cq;A 8i=n.iL;A 4Z=n.qr;A 6r=2k(4Z);d.2M=(8i.T("qq")>=0)?6r:0;d.6B=(4Z.T("qo")>=0)||(4Z.T("j2")>=0)?6r:0;d.3o=(4Z.T("j2")>=0)?6r:0;A j1=8i.T("qn");d.gu=d.7B=((j1>=0)&&(!d.6B))?6r:0;d.j0=0;d.1l=0;d.iV=0;1u{if(d.7B){d.j0=2k(8i.1A("qm/")[1].1A(" ")[0])}if((1q.gx)&&(!d.2M)){d.1l=2k(4Z.1A("qk ")[1].1A(";")[0])}}1y(e){}if(z.1l&&(26.8f.cu==="9q:")){1o.iT=K}d.iX=B(){A 2A;A qj;A cB=d.6q("cz.cy");if(cB){C cB}if(V iZ!="1k"){2A=S iZ()}I{if(d.1l){1u{2A=S 9j("qi.qh")}1y(e){}}I{if(cq.qg["8Z/x-iY"]){2A=1q.a9("8b");2A.cA("Z","8Z/x-iY");2A.cA("3n",0);2A.cA("58",0);2A.1c.gq="7C";1q.5K.4c(2A)}}}if(!2A){C L}z.88("cz.cy.qf",2A);C z.6q("cz.cy")};A iW=d.iX();if(iW){d.iV=K}A cm=1q["aX"];d.qe=(cm=="aW")||(cm=="gr")||(d.1l<6);d.8h=1o.8h||(d.1l?n.qd:n.qc).1M();d.qb=1z.1K;d.cx=["iU.8g","em.8g","iU.8g.4.0"];d.9b=B(){A 4s=L;A cv=L;if(!z.1l||!1o.iT){1u{4s=S qa()}1y(e){}}if(!4s){R(A i=0;i<3;++i){A cw=z.cx[i];1u{4s=S 9j(cw)}1y(e){cv=e}if(4s){z.cx=[cw];3f}}}if(!4s){2m S 1O("8g 3O q9: "+cv)}C 4s};d.8Y=B(iS){A 4Y=iS.3N||0;C((4Y>=q8)&&(4Y<q7))||(4Y==q6)||(4Y==q5)||(!4Y&&(8f.cu=="9q:"||8f.cu=="q4:"))};A cs=1q.4I("q3");A iQ=(cs&&cs.G>0);d.iR=B(1g,iP){A 3K=D.9b();if(!iQ&&z.4r){1g=(S z.4r(26.8f,1g)).2i()}3K.dL("dD",1g,U);1u{3K.dI(L);if(!d.8Y(3K)){A 1G=1O("q2 4F 4E "+1g+" 3N:"+3K.3N);1G.3N=3K.3N;1G.2G=3K.2G;2m 1G}}1y(e){if(iP){C L}2m e}C 3K.2G}})();z.iO=U;z.6o=B(e){z.iO=K;A cr=(e&&e.Z)?e.Z.1M():"4E";if(P.2O.iN||(cr!="q1"&&cr!="4E")){C}P.2O.iN=K;if(V z["8e"]!="1k"){dX(z.8e);63 z.8e}if(z.6p==0){z.iM()}};if(1q.66){if(z.2M||(z.7B&&(1o["q0"]===K))){1q.66("pZ",z.6o,L)}26.66("4E",z.6o,L)}if(/(pY|pX)/i.6Z(cq.iL)){z.8e=dN(B(){if(/6m|iJ/.6Z(1q.6F)){z.6o()}},10)}(B(){A 3g=26;A 8d=B(cp,fp){A iK=3g[cp]||B(){};3g[cp]=B(){fp.14(3g,P);iK.14(3g,P)}};if(z.1l){1q.fJ("<iI"+"iH pW 4X=\\"//:\\" "+"pV=\\"if(D.6F==\'iJ\'){z.6o();}\\">"+"</iI"+"iH>");A co=K;8d("iG",B(){3g.5c(B(){co=U},0)});8d("pU",B(){if(co){z.ck()}});1u{1q.pT.2P("v","pS:pR-pQ-pP:pO");1q.pN().pM("v\\\\:*","pL:2E(#aY#pK)")}1y(e){}}I{8d("iG",B(){z.ck()})}})();z.pJ=B(){};z.1e=26["1q"]||L;z.3E=B(){C z.1e.3E||z.1e.4I("3E")[0]};z.ch=B(iF,iE){z.1W=iF;z.1e=iE};z.cf=B(4q,6n,iD){if((6n)&&((V 4q=="3c")||(4q 1N 67))){4q=6n[4q]}C(6n?4q.14(6n,iD||[]):4q())};z.pI=B(cj,iC,iB,iA){A cg;A iz=z.1W;A iy=z.1e;1u{z.ch(cj,cj.1q);cg=z.cf(iC,iB,iA)}ir{z.ch(iz,iy)}C cg};z.pH=B(ix,iw,iv,iu){A ce;A ip=z.1e;1u{z.1e=ix;ce=z.cf(iw,iv,iu)}ir{z.1e=ip}C ce};if(1o["cd"]){R(A cc in 1o["cd"]){z.io(cc,1o["cd"][cc])}}}if(1o.im){if(!1z.ca){z.8c("z.pG.ca")}}}if(!z.1h["z.X.c9"]){z.1h["z.X.c9"]=K;z.1Q("z.X.c9");z.1R=B(it){C(V it=="3c"||it 1N 67)};z.2l=B(it){C(it&&it 1N 4e||V it=="6a"||((V z["1H"]!="1k")&&(it 1N z.1H)))};if(z.c8&&z.3o){z.1Y=B(it){if((V(it)=="B")&&(it=="[8b 1H]")){C U}C(V it=="B"||it 1N bI)}}I{z.1Y=B(it){C(V it=="B"||it 1N bI)}}z.ib=B(it){if(V it=="1k"){C U}C(it===L||V it=="8b"||z.2l(it)||z.1Y(it))};z.pF=B(it){A d=z;if((!it)||(V it=="1k")){C U}if(d.1R(it)){C U}if(d.1Y(it)){C U}if(d.2l(it)){C K}if((it.5w)&&(it.5w.1M()=="3R")){C U}if(pE(it.G)){C K}C U};z.pD=B(it){if(!it){C U}C!z.1Y(it)&&/\\{\\s*\\[il 5h\\]\\s*\\}/.6Z(67(it))};z.c7=B(M,4W){A 8a={};R(A x in 4W){if((V 8a[x]=="1k")||(8a[x]!=4W[x])){M[x]=4W[x]}}if(z.1l){A p=4W.2i;if((V(p)=="B")&&(p!=M.2i)&&(p!=8a.2i)&&(p!="\\pC 2i() {\\n    [il 5h]\\n}\\n")){M.2i=4W.2i}}C M};z.1x=B(M,pB){R(A i=1,l=P.G;i<l;i++){z.c7(M,P[i])}C M};z.4M=B(c6,pA){R(A i=1,l=P.G;i<l;i++){z.c7(c6.1C,P[i])}C c6};z.ig=B(c5,89){A ij=z.4d(P,2);A ik=z.1R(89);C B(){A ih=z.4d(P);A f=(ik?(c5||z.1W)[89]:89);C(f)&&(f.14(c5||D,ij.3U(ih)))}};z.2p=B(2z,3k){if(P.G>2){C z.ig.14(z,P)}if(!3k){3k=2z;2z=L}if(z.1R(3k)){2z=2z||z.1W;if(!2z[3k]){2m(["z.2p: ie[\\"",3k,"\\"] is L (ie=\\"",2z,"\\")"].22(""))}C B(){C 2z[3k].14(2z,P||[])}}I{C(!2z?3k:B(){C 3k.14(2z,P||[])})}};z.6j=B(M,c3){B c4(){};c4.1C=M;A c2=S c4();if(c3){z.1x(c2,c3)}C c2};z.7X=B(pz){A Q=[L];C z.2p.14(z,Q.3U(z.4d(P)))};z.4d=B(M,ic){A Q=[];R(A x=ic||0;x<M.G;x++){Q.Y(M[x])}C Q};z.c1=B(o){if(!o){C o}if(z.2l(o)){A r=[];R(A i=0;i<o.G;++i){r.Y(z.c1(o[i]))}C r}I{if(z.ib(o)){if(o.2t&&o.a7){C o.a7(K)}I{A r=S o.1P();R(A i in o){if(!(i in r)||r[i]!=o[i]){r[i]=z.c1(o[i])}}C r}}}C o};z.7g=B(2H){C 2H.2f(/^\\s\\s*/,"").2f(/\\s\\s*$/,"")}}if(!z.1h["z.X.2r"]){z.1h["z.X.2r"]=K;z.1Q("z.X.2r");z.2r=B(6l,4p,3j){if(z.1Y(3j)||(P.G>3)){z.ia("z.2r: R 9P \'"+6l+"\' py pw B as \'1P\' pv pu of as a pt i3.","","1.0");A c=3j;3j=P[3]||{};3j.1P=c}A dd=P.2O,4V=L;if(z.2l(4p)){4V=4p;4p=4V.3a()}if(4V){R(A i=0,m;i<4V.G;i++){m=4V[i];if(!m){2m("ps #"+i+" 4F pr of "+6l+" is L. pq\'s pp a po pl is 3O 6m.")}4p=dd.6j(4p,m)}}A i9=(3j||0).1P,6k=dd.6j(4p),fn;R(A i in 3j){if(z.1Y(fn=3j[i])&&(!0[i])){fn.i4=i}}z.4M(6k,{4o:6l,bY:i9,bZ:L},3j||0);6k.1C.1P=6k;C z.88(6l,6k)};z.1x(z.2r,{6j:B(c0,i8){A bp=(c0||0).1C,mp=(i8||0).1C;A 2S=z.2r.i7();z.1x(2S,{84:bp,1x:mp});if(c0){2S.1C=z.6j(bp)}z.4M(2S,z.2r.i6,mp||0,{bY:L});2S.1C.1P=2S;2S.1C.4o=(bp||0).4o+"pk"+(mp||0).4o;z.88(2S.1C.4o,2S);C 2S},i7:B(){C B(){D.i5(P)}},i6:{i5:B(86){A c=86.2O,s=c.84,ct=s&&s.1P,m=c.1x,87=m&&m.1P,a=86,ii,fn;if(a[0]){if((fn=a[0]["bZ"])){a=fn.14(D,a)||a}}if(fn=c.1C.bZ){a=fn.14(D,a)||a}if(ct&&ct.14){ct.14(D,a)}if(87&&87.14){87.14(D,a)}if(ii=c.1C.bY){ii.14(D,86)}},bX:B(85){A c=D.1P,p,m;1s(c){p=c.84;m=c.1x;if(m==85||(m 1N 85.1P)){C p}if(m&&(m=m.bX(85))){C m}c=p&&p.1P}},6h:B(83,82,bW,6i){A p=bW,c,m,f;do{c=p.1P;m=c.1x;if(m&&(m=D.6h(83,82,m,6i))){C m}if((f=p[83])&&(6i==(f==82))){C p}p=c.84}1s(p);C!6i&&(p=D.bX(bW))&&D.6h(83,82,p,6i)},bU:B(2R,4U,bV){A a=P;if(!z.1R(a[0])){bV=4U;4U=2R;2R=4U.2O.i4}A c=4U.2O,p=D.1P.1C,a=bV||4U,fn,mp;if(D[2R]!=c||p[2R]==c){mp=D.6h(2R,c,p,K);if(!mp){2m(D.4o+": 1p i3 (\\""+2R+"\\") 4F bU pj 1f 2O (2r.js)")}p=D.6h(2R,c,mp,U)}fn=p&&p[2R];if(!fn){1z.1K(mp.4o+": no bU \\""+2R+"\\" ph pg (2r.js)");C}C fn.14(D,a)}}})}if(!z.1h["z.X.2c"]){z.1h["z.X.2c"]=K;z.1Q("z.X.2c");z.3i={i2:B(){C B(){A ap=4e.1C,c=P.2O,ls=c.2b,t=c.5V;A r=t&&t.14(D,P);R(A i in ls){if(!(i in ap)){ls[i].14(D,P)}}C r}},2P:B(6g,bT,i1){6g=6g||z.1W;A f=6g[bT];if(!f||!f.2b){A d=z.3i.i2();d.5V=f;d.2b=[];f=6g[bT]=d}C f.2b.Y(i1)},3J:B(i0,hZ,bS){A f=(i0||z.1W)[hZ];if(f&&f.2b&&bS--){63 f.2b[bS]}}};z.2c=B(M,pd,pc,pa,p9){A a=P,F=[],i=0;F.Y(z.1R(a[0])?L:a[i++],a[i++]);A a1=a[i+1];F.Y(z.1R(a1)||z.1Y(a1)?a[i++]:L,a[i++]);R(A l=a.G;i<l;i++){F.Y(a[i])}C z.by.14(D,F)};z.by=B(M,bR,hY,hX){A l=z.3i,h=l.2P(M,bR,z.2p(hY,hX));C[M,bR,h,l]};z.p8=B(6f){if(6f&&6f[0]!==1k){z.bv.14(D,6f);63 6f[0]}};z.bv=B(M,hV,hU,hW){hW.3J(M,hV,hU)};z.80={};z.p7=B(bQ,hT,hS){C[bQ,z.3i.2P(z.80,bQ,z.2p(hT,hS))]};z.p6=B(81){if(81){z.3i.3J(z.80,81[0],81[1])}};z.hQ=B(hR,F){A f=z.80[hR];(f)&&(f.14(D,F||[]))};z.p5=B(hP,M,bP){A pf=B(){z.hQ(hP,P)};C(bP)?z.2c(M,bP,pf):z.2c(M,pf)}}if(!z.1h["z.X.30"]){z.1h["z.X.30"]=K;z.1Q("z.X.30");z.30=B(hO){D.bM=[];D.id=D.hN();D.2y=-1;D.3M=0;D.4R=[L,L];D.bO=hO;D.7Z=U};z.4M(z.30,{hN:(B(){A n=1;C B(){C n++}})(),4C:B(){if(D.2y==-1){if(D.bO){D.bO(D)}I{D.7Z=K}if(D.2y==-1){A 1G=S 1O("30 p4");1G.dY="4C";D.5i(1G)}}I{if((D.2y==0)&&(D.4R[0]1N z.30)){D.4R[0].4C()}}},7V:B(1v){D.2y=((1v 1N 1O)?1:0);D.4R[D.2y]=1v;D.7U()},bN:B(){if(D.2y!=-1){if(!D.7Z){2m S 1O("p3 p2!")}D.7Z=U;C}},dM:B(1v){D.bN();D.7V(1v)},5i:B(1v){D.bN();if(!(1v 1N 1O)){1v=S 1O(1v)}D.7V(1v)},9e:B(cb,4T){A 6e=z.2p(cb,4T);if(P.G>2){6e=z.7X(6e,P,2)}C D.5k(6e,6e)},ef:B(cb,4T){A 7Y=z.2p(cb,4T);if(P.G>2){7Y=z.7X(7Y,P,2)}C D.5k(7Y,L)},ed:B(cb,4T){A 7W=z.2p(cb,4T);if(P.G>2){7W=z.7X(7W,P,2)}C D.5k(L,7W)},5k:B(cb,eb){D.bM.Y([cb,eb]);if(D.2y>=0){D.7U()}C D},7U:B(){A bL=D.bM;A 4n=D.2y;A 1v=D.4R[4n];A 4S=D;A cb=L;1s((bL.G>0)&&(D.3M==0)){A f=bL.3a()[4n];if(!f){6c}1u{1v=f(1v);4n=((1v 1N 1O)?1:0);if(1v 1N z.30){cb=B(1v){4S.7V(1v);4S.3M--;if((4S.3M==0)&&(4S.2y>=0)){4S.7U()}};D.3M++}}1y(1G){1z.1K(1G);4n=1;1v=1G}}D.2y=4n;D.4R[4n]=1v;if((cb)&&(D.3M)){1v.9e(cb)}}})}if(!z.1h["z.X.2e"]){z.1h["z.X.2e"]=K;z.1Q("z.X.2e");z.5m=B(2e){1u{C 3u("("+2e+")")}1y(e){1z.1K(e);C 2e}};z.bK=B(2H){C("\\""+2H.2f(/(["\\\\])/g,"\\\\$1")+"\\"").2f(/[\\f]/g,"\\\\f").2f(/[\\b]/g,"\\\\b").2f(/[\\n]/g,"\\\\n").2f(/[\\t]/g,"\\\\t").2f(/[\\r]/g,"\\\\r")};z.hM="\\t";z.eq=B(it,4l,4P){4P=4P||"";A 4k=(4l?4P+z.hM:"");A 6b=(4l?"\\n":"");A 4Q=V(it);if(4Q=="1k"){C"1k"}I{if((4Q=="4J")||(4Q=="p1")){C it+""}I{if(it===L){C"L"}}}if(4Q=="3c"){C z.bK(it)}A 6d=P.2O;A 4m;if(V it.hL=="B"){4m=it.hL();if(it!==4m){C 6d(4m,4l,4k)}}if(V it.2e=="B"){4m=it.2e();if(it!==4m){C 6d(4m,4l,4k)}}if(z.2l(it)){A 1v=[];R(A i=0;i<it.G;i++){A 1U=6d(it[i],4l,4k);if(V(1U)!="3c"){1U="1k"}1v.Y(6b+4k+1U)}C"["+1v.22(", ")+6b+4P+"]"}if(4Q=="B"){C L}A bJ=[];R(A 1i in it){A 7T;if(V(1i)=="4J"){7T="\\""+1i+"\\""}I{if(V(1i)=="3c"){7T=z.bK(1i)}I{6c}}1U=6d(it[1i],4l,4k);if(V(1U)!="3c"){6c}bJ.Y(6b+4k+7T+": "+1U)}C"{"+bJ.22(", ")+6b+4P+"}"}}if(!z.1h["z.X.6a"]){z.1h["z.X.6a"]=K;z.1Q("z.X.6a");(B(){A 69=B(Q,M,cb){C[(z.1R(Q)?Q.1A(""):Q),(M||z.1W),(z.1R(cb)?(S bI("1m","hK","6a",cb)):cb)]};z.1x(z,{T:B(bH,hH,hI,hJ){A i=0,2q=1,1d=bH.G;if(hJ){i=1d-1;2q=1d=-1}R(i=hI||i;i!=1d;i+=2q){if(bH[i]==hH){C i}}C-1},31:B(hG,hF,hE){C z.T(hG,hF,hE,K)},1n:B(Q,hD,M){if(!Q||!Q.G){C}A 1I=69(Q,M,hD);Q=1I[0];R(A i=0,l=1I[0].G;i<l;i++){1I[2].2d(1I[1],Q[i],i,Q)}},bE:B(bF,Q,hC,M){A 1I=69(Q,M,hC);Q=1I[0];R(A i=0,l=Q.G;i<l;i++){A bG=!!1I[2].2d(1I[1],Q[i],i,Q);if(bF^bG){C bG}}C bF},ah:B(Q,hB,hA){C D.bE(K,Q,hB,hA)},ag:B(Q,hz,hy){C D.bE(U,Q,hz,hy)},23:B(Q,7t,M){A 1I=69(Q,M,7t);Q=1I[0];A bD=((P[3])?(S P[3]()):[]);R(A i=0;i<Q.G;++i){bD.Y(1I[2].2d(1I[1],Q[i],i,Q))}C bD},3T:B(Q,hx,M){A 1I=69(Q,M,hx);Q=1I[0];A bC=[];R(A i=0;i<Q.G;i++){if(1I[2].2d(1I[1],Q[i],i,Q)){bC.Y(Q[i])}}C bC}})})()}if(!z.1h["z.X.1J"]){z.1h["z.X.1J"]=K;z.1Q("z.X.1J");z.1J=B(bB){if(bB){D.hw(bB)}};z.1J.hp={p0:[0,0,0],oZ:[60,60,60],oY:[2j,2j,2j],oX:[1T,1T,1T],oW:[2j,0,0],oV:[1T,0,0],oU:[2j,0,2j],oT:[1T,0,1T],oS:[0,2j,0],oR:[0,1T,0],oQ:[2j,2j,0],oP:[1T,1T,0],oO:[0,0,2j],oN:[0,0,1T],oM:[0,2j,2j],oL:[0,1T,1T]};z.4M(z.1J,{r:1T,g:1T,b:1T,a:1,bz:B(r,g,b,a){A t=D;t.r=r;t.g=g;t.b=b;t.a=a},hw:B(2Q){A d=z;if(d.1R(2Q)){d.hq(2Q,D)}I{if(d.2l(2Q)){d.7P(2Q,D)}I{D.bz(2Q.r,2Q.g,2Q.b,2Q.a);if(!(2Q 1N d.1J)){D.7Q()}}}C D},7Q:B(){C D},oK:B(){A t=D;C[t.r,t.g,t.b]},oJ:B(){A t=D;C[t.r,t.g,t.b,t.a]},oI:B(){A Q=z.23(["r","g","b"],B(x){A s=D[x].2i(16);C s.G<2?"0"+s:s},D);C"#"+Q.22("")},8F:B(hv){A t=D,7S=t.r+", "+t.g+", "+t.b;C(hv?"hs("+7S+", "+t.a:"7S("+7S)+")"},2i:B(){C D.8F(K)}});z.d8=B(bA,1d,hu,M){A d=z,t=M||S z.1J();d.1n(["r","g","b","a"],B(x){t[x]=bA[x]+(1d[x]-bA[x])*hu;if(x!="a"){t[x]=2Y.oH(t[x])}});C t.7Q()};z.ho=B(ht,M){A m=ht.1M().1f(/^hs?\\(([\\s\\.,0-9]+)\\)/);C m&&z.7P(m[1].1A(/\\s*,\\s*/),M)};z.hn=B(4j,M){A d=z,t=M||S d.1J(),7R=(4j.G==4)?4:8,hr=(1<<7R)-1;4j=2V("oG"+4j.3b(1));if(2L(4j)){C L}d.1n(["b","g","r"],B(x){A c=4j&hr;4j>>=7R;t[x]=7R==4?17*c:c});t.a=1;C t};z.7P=B(a,M){A t=M||S z.1J();t.bz(2V(a[0]),2V(a[1]),2V(a[2]),2V(a[3]));if(2L(t.a)){t.a=1}C t.7Q()};z.hq=B(2H,M){A a=z.1J.hp[2H];C a&&z.7P(a,M)||z.ho(2H,M)||z.hn(2H,M)}}if(!z.1h["z.X"]){z.1h["z.X"]=K;z.1Q("z.X")}if(!z.1h["z.X.5Z"]){z.1h["z.X.5Z"]=K;z.1Q("z.X.5Z");(B(){A 1j=z.b2={2P:B(E,68,fp){if(!E){C}68=1j.4O(68);fp=1j.7G(68,fp);E.66(68,fp,U);C fp},3J:B(E,hm,hl){(E)&&(E.oF(1j.4O(hm),hl,U))},4O:B(1p){C(1p.2w(0,2)=="on"?1p.2w(2):1p)},7G:B(1p,fp){C(1p!="4b"?fp:B(e){C fp.2d(D,1j.4i(e,D))})},4i:B(H,oE){4w(H.Z){2X"4b":1j.7K(H);3f}C H},7K:B(H){H.oD=(H.3h?67.oC(H.3h):"")}};z.oB=B(H,hk){C 1j.4i(H,hk)};z.gY=B(H){H.7J();H.7I()};A 7O=z.3i;z.by=B(M,bx,hh,hg,hi){A hj=M&&(M.2t||M.oA||M.66);A bw=!hj?0:(!hi?1:2),l=[z.3i,1j,7O][bw];A h=l.2P(M,bx,z.2p(hh,hg));C[M,bx,h,bw]};z.bv=B(M,he,hd,hf){([z.3i,1j,7O][hf]).3J(M,he,hd)};z.5W={oz:8,gV:9,oy:12,ox:13,ow:16,ov:17,ou:18,gG:19,ot:20,os:27,or:32,b5:33,b4:34,gE:35,gF:36,b7:37,b9:38,b6:39,b8:40,gD:45,8S:46,oq:47,oo:91,om:92,ol:93,oj:96,oi:97,oh:98,og:99,oe:6D,od:oc,ob:oa,o9:o8,o7:o6,o5:o4,o3:bi,o2:o1,o0:nZ,nY:nX,nW:nV,nU:bk,gS:nT,gR:nS,gQ:nR,gP:nQ,gO:nP,gN:nO,gM:nN,gL:nM,gK:nL,gJ:nK,gI:nJ,gH:nI,nH:nG,nF:nE,nD:nC,gB:nB,gC:nA};if(z.1l){bf=B(e,5h){1u{C(e.3I=5h)}1y(e){C 0}};A 61=z.3i;if(!1o.nz){7O=61=z.gy={b3:[],2P:B(64,bu,hc){64=64||z.1W;A f=64[bu];if(!f||!f.2b){A d=z.gz();d.5V=f&&(7M.Y(f)-1);d.2b=[];f=64[bu]=d}C f.2b.Y(7M.Y(hc)-1)},3J:B(hb,ha,7N){A f=(hb||z.1W)[ha],l=f&&f.2b;if(f&&l&&7N--){63 7M[l[7N]];63 l[7N]}}};A 7M=61.b3}z.1x(1j,{2P:B(E,62,fp){if(!E){C}62=1j.4O(62);if(62=="h3"){A kd=E.bs;if(!kd||!kd.2b||!kd.h9){1j.2P(E,"bs",1j.h4);E.bs.h9=K}}C 61.2P(E,62,1j.7G(fp))},3J:B(E,h8,h7){61.3J(E,1j.4O(h8),h7)},4O:B(7L){C(7L.2w(0,2)!="on"?"on"+7L:7L)},ny:B(){},4i:B(H,4N){if(!H){A w=(4N)&&((4N.aD||4N.1q||4N).nx)||26;H=w.5Z}if(!H){C(H)}H.5V=H.br;H.bh=(4N||H.br);H.nw=H.nv;H.nu=H.nr;A bq=H.br,1e=(bq&&bq.aD)||1q;A bn=((z.1l<6)||(1e["aX"]=="aW"))?1e.3E:1e.5K;A bm=z.aB();H.nq=H.np+z.aH(bn.5I||0)-bm.x;H.nn=H.nm+(bn.5G||0)-bm.y;if(H.Z=="fk"){H.h6=H.nl}if(H.Z=="fj"){H.h6=H.nk}H.7I=1j.bc;H.7J=1j.ba;C 1j.h5(H)},h5:B(H){4w(H.Z){2X"4b":A c=("3h"in H?H.3h:H.3I);if(c==10){c=0;H.3I=13}I{if(c==13||c==27){c=0}I{if(c==3){c=99}}}H.3h=c;1j.7K(H);3f}C H},gZ:{bi:42,bk:47,h2:59,nj:43,ni:44,nh:45,ng:46,nf:47,60:96,h1:91,nb:92,na:93,h0:39},h4:B(H){A kp=H.bh.h3;if(!kp||!kp.2b){C}A k=H.3I;A bj=(k!=13)&&(k!=32)&&(k!=27)&&(k<48||k>90)&&(k<96||k>bk)&&(k<h2||k>60)&&(k<h1||k>h0);if(bj||H.5Y){A c=(bj?0:k);if(H.5Y){if(k==3||k==13){C}I{if(c>95&&c<bi){c-=48}I{if((!H.5X)&&(c>=65&&c<=90)){c+=32}I{c=1j.gZ[c]||c}}}}A 2x=1j.7H(H,{Z:"4b",2x:K,3h:c});kp.2d(H.bh,2x);H.bg=2x.bg;H.bd=2x.bd;bf(H,2x.3I)}},bc:B(){D.bg=K},ba:B(){D.n9=D.3I;if(D.5Y){bf(D,0)}D.bd=U}});z.gY=B(H){H=H||26.5Z;1j.bc.2d(H);1j.ba.2d(H)}}1j.7H=B(H,gX){A 2x=z.1x({},H,gX);1j.7K(2x);2x.7J=B(){H.7J()};2x.7I=B(){H.7I()};C 2x};if(z.2M){z.1x(1j,{4i:B(H,n8){4w(H.Z){2X"4b":A c=H.n7;if(c==3){c=99}c=((c<41)&&(!H.5X)?0:c);if((H.5Y)&&(!H.5X)&&(c>=65)&&(c<=90)){c+=32}C 1j.7H(H,{3h:c})}C H}})}if(z.3o){z.1x(1j,{4i:B(H,n6){4w(H.Z){2X"4b":A c=H.3h,s=H.5X,k=H.3I;k=k||gA[H.gW]||0;if(H.gW=="n5"){c=0}I{if((H.5Y)&&(c>0)&&(c<27)){c+=96}I{if(c==z.5W.gU){c=z.5W.gV;s=K}I{c=(c>=32&&c<gT?c:0)}}}C 1j.7H(H,{3h:c,5X:s,3I:k})}C H}});z.1x(z.5W,{gU:25,b9:gT,b8:n4,b7:n3,b6:n2,gS:n1,gR:n0,gQ:mZ,gP:mY,gO:mX,gN:mW,gM:mV,gL:mU,gK:mT,gJ:mS,gI:mR,gH:mQ,gG:mP,8S:mO,gF:mN,gE:mM,b5:mL,b4:mK,gD:mJ,mI:mH,gC:mG,gB:mF});A dk=z.5W,gA={"mE":dk.b9,"mD":dk.b8,"mC":dk.b7,"mB":dk.b6,"mA":dk.b5,"mz":dk.b4}}})();if(z.1l){z.gz=B(){C B(){A ap=4e.1C,h=z.gy.b3,c=P.2O,ls=c.2b,t=h[c.5V];A r=t&&t.14(D,P);R(A i in ls){if(!(i in ap)){h[ls[i]].14(D,P)}}C r}};z.b2.7G=B(fp){A f=z.b2.4i;C B(e){C fp.2d(D,f(e,D))}}}}if(!z.1h["z.X.b1"]){z.1h["z.X.b1"]=K;z.1Q("z.X.b1");1u{1q.my("mx",U,K)}1y(e){}if(z.1l||z.2M){z.1D=B(id,1e){if(z.1R(id)){A b0=(1e||z.1e);A 11=b0.gv(id);if((11)&&(11.gw.id.1Z==id)){C 11}I{A 5U=b0.gx[id];if(!5U){C}if(!5U.G){C 5U}A i=0;1s(11=5U[i++]){if(11.gw.id.1Z==id){C 11}}}}I{C id}}}I{z.1D=B(id,1e){if(z.1R(id)){C(1e||z.1e).gv(id)}I{C id}}}(B(){A 5T=L;z.mw=B(E){E=z.1D(E);1u{if(!5T){5T=1q.a9("mv")}5T.4c(E.1L?E.1L.fs(E):E);5T.9L=""}1y(e){}};z.mu=B(E,7F){1u{E=z.1D(E);7F=z.1D(7F);1s(E){if(E===7F){C K}E=E.1L}}1y(e){}C U};z.mt=B(E,5S){E=z.1D(E);if(z.gu){E.1c.ms=(5S)?"dg":"7C"}I{if(z.6B){E.1c.mr=(5S)?"8K":"7C"}I{if(z.1l){E.gs=(5S)?"":"on";z.1r("*",E).1n(B(gt){gt.gs=(5S)?"":"on"})}}}};A 5R=B(E,4h){4h.1L.mq(E,4h);C K};A aZ=B(E,4h){A pn=4h.1L;if(4h==pn.fm){pn.4c(E)}I{C 5R(E,4h.71)}C K};z.5E=B(E,2a,3H){if((!E)||(!2a)||(V 3H=="1k")){C U}E=z.1D(E);2a=z.1D(2a);if(V 3H=="4J"){A cn=2a.3W;if(((3H==0)&&(cn.G==0))||(cn.G==3H)){2a.4c(E);C K}if(3H==0){C 5R(E,2a.5A)}C aZ(E,cn[3H-1])}4w(3H.1M()){2X"mo":C 5R(E,2a);2X"a8":C aZ(E,2a);2X"9M":if(2a.5A){C 5R(E,2a.5A)}I{2a.4c(E);C K}3f;aY:2a.4c(E);C K}};z.aP="5g-3G";if(z.1l){A aV=1q.aX;z.aP=(aV=="aW")||(aV=="gr")||(z.1l<6)?"g5-3G":"5g-3G"}A 1E,dv=1q.mn;if(z.3o){1E=B(E){A s=dv.3F(E,L);if(!s&&E.1c){E.1c.gq="";s=dv.3F(E,L)}C s||{}}}I{if(z.1l){1E=B(E){C E.gn}}I{1E=B(E){C dv.3F(E,L)}}}z.3F=1E;if(!z.1l){z.4g=B(mm,gp){C 2k(gp)||0}}I{z.4g=B(go,2N){if(!2N){C 0}if(2N=="ml"){C 4}if(2N.2w&&(2N.2w(-2)=="px")){C 2k(2N)}4G(go){A gm=1c.2g;A gl=aU.2g;aU.2g=gn.2g;1u{1c.2g=2N;2N=1c.mk}1y(e){2N=0}1c.2g=gm;aU.2g=gl}C 2N}}z.ge=(z.1l?B(E){1u{C(E.mj.mi.2W/6D)}1y(e){C 1}}:B(E){C z.3F(E).2W});z.gf=(z.1l?B(E,7D){if(7D==1){E.1c.7E=E.1c.7E.2f(/gk:[^;]*;/i,"");if(E.gj.1M()=="gi"){z.1r("> gh",E).1n(B(i){i.1c.7E=i.1c.7E.2f(/gk:[^;]*;/i,"")})}}I{A o="mh(mg="+(7D*6D)+")";E.1c.3T=o}if(E.gj.1M()=="gi"){z.1r("> gh",E).1n(B(i){i.1c.3T=o})}C 7D}:B(E,gg){C E.1c.2W=gg});A 5Q={3n:K,58:K,2g:K,5J:K};A gd=B(E,Z,5P){Z=Z.1M();if(5Q[Z]===K){C z.4g(E,5P)}I{if(5Q[Z]===U){C 5P}I{if((Z.T("mf")>=0)||(Z.T("md")>=0)||(Z.T("3n")>=0)||(Z.T("58")>=0)||(Z.T("5q")>=0)||(Z.T("mc")>=0)||(Z.T("ma")>=0)){5Q[Z]=K;C z.4g(E,5P)}I{5Q[Z]=U;C 5P}}}};z.1c=B(E,5O,aT){A n=z.1D(E),F=P.G,op=(5O=="2W");if(F==3){C op?z.gf(n,aT):n.1c[5O]=aT}if(F==2&&op){C z.ge(n)}A s=z.3F(n);C(F==1)?s:gd(n,5O,s[5O])};z.7A=B(n,gc){A s=gc||1E(n),px=z.4g,l=px(n,s.m9),t=px(n,s.m8);C{l:l,t:t,w:l+px(n,s.m7),h:t+px(n,s.m6)}};z.5N=B(n,gb){A ne="7C",px=z.4g,s=gb||1E(n),bl=(s.m5!=ne?px(n,s.m4):0),bt=(s.m3!=ne?px(n,s.m2):0);C{l:bl,t:bt,w:bl+(s.m1!=ne?px(n,s.m0):0),h:bt+(s.lZ!=ne?px(n,s.lY):0)}};z.aN=B(n,ga){A s=ga||1E(n),p=z.7A(n,s),b=z.5N(n,s);C{l:p.l+b.l,t:p.t+b.t,w:p.w+b.w,h:p.h+b.h}};z.aM=B(n,g9){A s=g9||1E(n),px=z.4g,l=px(n,s.lX),t=px(n,s.lW),r=px(n,s.lV),b=px(n,s.lU);if(z.3o&&(s.ax!="fU")){r=l}C{l:l,t:t,w:l+r,h:t+b}};z.au=B(E,g8){A s=g8||1E(E),me=z.aM(E,s);A l=E.fT-me.l,t=E.fS-me.t;if(z.7B){A aS=2k(s.2g),aR=2k(s.5J);if(!2L(aS)&&!2L(aR)){l=aS,t=aR}I{A p=E.1L;if(p&&p.1c){A aQ=1E(p);if(aQ.lT!="lS"){A be=z.5N(p,aQ);l+=be.l,t+=be.t}}}}I{if(z.2M){A p=E.1L;if(p){A be=z.5N(p);l-=be.l,t-=be.t}}}C{l:l,t:t,w:E.6v+me.w,h:E.8D+me.h}};z.aK=B(E,g7){A s=g7||1E(E),pe=z.7A(E,s),be=z.5N(E,s),w=E.aF,h;if(!w){w=E.6v,h=E.8D}I{h=E.lR,be.w=be.h=0}if(z.2M){pe.l+=be.l;pe.t+=be.t}C{l:pe.l,t:pe.t,w:w-pe.w-be.w,h:h-pe.h-be.h}};z.lQ=B(E,g6){A s=g6||1E(E),pe=z.7A(E,s),cb=z.aK(E,s);C{l:cb.l-pe.l,t:cb.t-pe.t,w:cb.w+pe.w,h:cb.h+pe.h}};z.aL=B(E,l,t,w,h,u){u=u||"px";4G(E.1c){if(!2L(l)){2g=l+u}if(!2L(t)){5J=t+u}if(w>=0){3n=w+u}if(h>=0){58=h+u}}};z.aO=B(E){A n=E.5w;C(z.aP=="g5-3G")||(n=="lP")||(n=="lO")};z.fX=B(E,7z,7y,g4){A bb=z.aO(E);if(bb){A pb=z.aN(E,g4);if(7z>=0){7z+=pb.w}if(7y>=0){7y+=pb.h}}z.aL(E,g3,g3,7z,7y)};z.fY=B(E,g1,g0,5M,5L,g2){A s=g2||z.3F(E);A bb=z.aO(E),pb=bb?fZ:z.aN(E,s),mb=z.aM(E,s);if(5M>=0){5M=2Y.5q(5M-pb.w-mb.w,0)}if(5L>=0){5L=2Y.5q(5L-pb.h-mb.h,0)}z.aL(E,g1,g0,5M,5L)};A fZ={l:0,t:0,w:0,h:0};z.lN=B(E,3G){A n=z.1D(E),s=1E(n),b=3G;C!b?z.au(n,s):z.fY(n,b.l,b.t,b.w,b.h,s)};z.lM=B(E,3G){A n=z.1D(E),s=1E(n),b=3G;C!b?z.aK(n,s):z.fX(n,b.w,b.h,s)};A 5H=B(E,1a){if(!(E=(E||0).1L)){C 0}A 1U,aJ=0,2h=z.3E();1s(E&&E.1c){if(1E(E).ax=="lL"){C 0}1U=E[1a];if(1U){aJ+=1U-0;if(E==2h){3f}}E=E.1L}C aJ};z.fQ=B(){A 2h=z.3E();A 3g=z.1W;A de=z.1e.5K;C{y:(3g.lK||de.5G||2h.5G||0),x:(3g.lJ||z.aH(de.5I)||2h.5I||0)}};z.aG=B(){C V z.aI=="1k"?(z.aI=z.3F(z.3E()).lI=="lH"):z.aI};z.aB=B(){A de=z.1e.5K;if(z.1l>=7){C{x:de.aC().2g,y:de.aC().5J}}I{C{x:z.aG()||26.am==26?de.fW:de.6v-de.aF-de.fW,y:de.lG}}};z.aH=B(aE){if(z.1l&&!z.aG()){A de=z.1e.5K;C aE+de.aF-de.lF}C aE};z.fP=B(E,aw){A ay=E.aD;A J={x:0,y:0};A 7w=U;A db=z.3E();if(z.1l){A aA=E.aC();A az=z.aB();J.x=aA.2g-az.x;J.y=aA.5J-az.y}I{if(ay["fV"]){A bo=ay.fV(E);J.x=bo.x-5H(E,"5I");J.y=bo.y-5H(E,"5G")}I{if(E["fR"]){7w=K;A 7x;if(z.3o&&(1E(E).ax=="fU")&&(E.1L==db)){7x=db}I{7x=db.1L}if(E.1L!=db){A nd=E;if(z.2M){nd=db}J.x-=5H(nd,"5I");J.y-=5H(nd,"5G")}A 4f=E;do{A n=4f["fT"];if(!z.2M||n>0){J.x+=2L(n)?0:n}A m=4f["fS"];J.y+=2L(m)?0:m;4f=4f.fR}1s((4f!=7x)&&4f)}I{if(E["x"]&&E["y"]){J.x+=2L(E.x)?0:E.x;J.y+=2L(E.y)?0:E.y}}}}if(7w||aw){A av=z.fQ();A m=7w?(!aw?-1:0):1;J.y+=m*av.y;J.x+=m*av.x}C J};z.af=B(E,fO){A n=z.1D(E),s=1E(n),mb=z.au(n,s);A at=z.fP(n,fO);mb.x=at.x;mb.y=at.y;C mb}})();z.fL=B(E,fN){C((" "+E.3A+" ").T(" "+fN+" ")>=0)};z.7s=B(E,ar){A 7v=E.3A;if((" "+7v+" ").T(" "+ar+" ")<0){E.3A=7v+(7v?" ":"")+ar}};z.7r=B(E,fM){A t=z.7g((" "+E.3A+" ").2f(" "+fM+" "," "));if(E.3A!=t){E.3A=t}};z.lE=B(E,aq,7u){if(V 7u=="1k"){7u=!z.fL(E,aq)}z[7u?"7s":"7r"](E,aq)}}if(!z.1h["z.X.1H"]){z.1h["z.X.1H"]=K;z.1Q("z.X.1H");(B(){A d=z;z.1H=B(){A F=P;if((F.G==1)&&(V F[0]=="4J")){D.G=eK(F[0])}I{if(F.G){d.1n(F,B(i){D.Y(i)},D)}}};z.1H.1C=S 4e;if(d.1l){A fK=B(al){C("A a2 = am."+al+"; "+"A ap = 4e.1C; "+"A ao = a2.1C; "+"R(A x in ao){ ap[x] = ao[x]; } "+"am."+al+" = 4e; ")};A fI=fK("z.1H");A aj=26.lD();aj.1q.fJ("<ak>"+fI+"</ak>");aj.lC(1,1,1,1)}z.4M(z.1H,{T:B(fH,fG){C d.T(D,fH,fG)},31:B(lB,lA){A aa=d.4d(P);aa.ae(D);C d.31.14(d,aa)},ah:B(fF,fE){C d.ah(D,fF,fE)},ag:B(fD,fC){C d.ag(D,fD,fC)},1n:B(fB,fA){d.1n(D,fB,fA);C D},23:B(7t,M){C d.23(D,7t,M,d.1H)},af:B(){C d.23(D,d.af)},1c:B(lz,ly){A aa=d.4d(P);aa.ae(D[0]);A s=d.1c.14(d,aa);C(P.G>1)?D:s},lx:B(lw,lv){A aa=d.4d(P);aa.ae(L);A s=D.23(B(i){aa[0]=i;C d.1c.14(d,aa)});C(P.G>1)?D:s},7s:B(fz){C D.1n(B(i){z.7s(i,fz)})},7r:B(fy){C D.1n(B(i){z.7r(i,fy)})},5E:B(fw,7q){A 1m=d.1r(fw)[0];7q=7q||"72";R(A x=0;x<D.G;x++){d.5E(D[x],1m,7q)}C D},2c:B(fv,fu,ft){D.1n(B(1m){d.2c(1m,fv,fu,ft)});C D},lu:B(ad){A ac=(ad)?d.9t(D,ad):D;ac.1n(B(1m){if(1m["1L"]){1m.1L.fs(1m)}});C ac},lt:B(fr,fq){A 1m=D[0];C d.1r(fr).1n(B(ai){d.5E(ai,1m,(fq||"72"))})},1r:B(7p){7p=7p||"";A J=S d.1H();D.1n(B(1m){d.1r(7p,1m).1n(B(ab){if(V ab!="1k"){J.Y(ab)}})});C J},3T:B(fo){A 5F=D;A 1V=P;A r=S d.1H();A rp=B(t){if(V t!="1k"){r.Y(t)}};if(d.1R(fo)){5F=d.9t(D,1V[0]);if(1V.G==1){C 5F}d.1n(d.3T(5F,1V[1],1V[2]),rp);C r}d.1n(d.3T(5F,1V[0],1V[1]),rp);C r},lr:B(7o,7n){A 1S=d.1e.a9("lq");if(d.1R(7o)){1S.9L=7o}I{1S.4c(7o)}A ct=((7n=="9M")||(7n=="a8"))?"fm":"5A";D.1n(B(1m){A 24=1S.a7(K);1s(24[ct]){d.5E(24[ct],1m,7n)}});C D},7m:B(fl,F){A a5=[];F=F||{};D.1n(B(1m){A a6={E:1m};d.1x(a6,F);a5.Y(d[fl](a6))});C d.fx.lp(a5)},8I:B(F){C D.7m("8I",F)},8H:B(F){C D.7m("8H",F)},6y:B(F){C D.7m("6y",F)}});z.1n(["fk","lo","fj","fi","ln","lm","ll","fi","lk","lj","4b"],B(H){A a4="on"+H;z.1H.1C[a4]=B(a,b){C D.2c(a4,a,b)}})})()}if(!z.1h["z.X.1r"]){z.1h["z.X.1r"]=K;z.1Q("z.X.1r");(B(){A d=z;A 2I=B(q){C[q.T("#"),q.T("."),q.T("["),q.T(":")]};A a0=B(a3,fh){A ql=a3.G;A i=2I(a3);A 1d=ql;R(A x=fh;x<i.G;x++){if(i[x]>=0){if(i[x]<1d){1d=i[x]}}}C(1d<0)?ql:1d};A 6X=B(7l){A i=2I(7l);if(i[0]!=-1){C 7l.21(i[0]+1,a0(7l,1))}I{C""}};A 5r=B(7k){A 5D;A i=2I(7k);if((i[0]==0)||(i[1]==0)){5D=0}I{5D=a0(7k,0)}C((5D>0)?7k.3b(0,5D).1M():"*")};A fg=B(Q){A J=-1;R(A x=0;x<Q.G;x++){A 1S=Q[x];if(1S>=0){if((1S>J)||(J==-1)){J=1S}}}C J};A 9H=B(7i){A i=2I(7i);if(-1==i[1]){C""}A di=i[1]+1;A 7j=fg(i.2w(2));if(di<7j){C 7i.21(di,7j)}I{if(-1==7j){C 7i.3b(di)}I{C""}}};A f3=[{1i:"|=",1f:B(15,fe){C"[5z(3U(\' \',@"+15+",\' \'), \' "+fe+"-\')]"}},{1i:"~=",1f:B(15,fd){C"[5z(3U(\' \',@"+15+",\' \'), \' "+fd+" \')]"}},{1i:"^=",1f:B(15,fb){C"[li-4G(@"+15+", \'"+fb+"\')]"}},{1i:"*=",1f:B(15,fa){C"[5z(@"+15+", \'"+fa+"\')]"}},{1i:"$=",1f:B(15,9Z){C"[21(@"+15+", 3c-G(@"+15+")-"+(9Z.G-1)+")=\'"+9Z+"\']"}},{1i:"!=",1f:B(15,f9){C"[3O(@"+15+"=\'"+f9+"\')]"}},{1i:"=",1f:B(15,f8){C"[@"+15+"=\'"+f8+"\']"}}];A 9C=B(9Y,3Z,f7,f6){A 49;A i=2I(3Z);if(i[2]>=0){A 4L=3Z.T("]",i[2]);A 29=3Z.21(i[2]+1,4L);1s(29&&29.G){if(29.2s(0)=="@"){29=29.2w(1)}49=L;R(A x=0;x<9Y.G;x++){A 1S=9Y[x];A 7h=29.T(1S.1i);if(7h>=0){A 15=29.21(0,7h);A 4a=29.21(7h+1S.1i.G);if((4a.2s(0)=="\\"")||(4a.2s(0)=="\'")){4a=4a.21(1,4a.G-1)}49=1S.1f(d.7g(15),d.7g(4a));3f}}if((!49)&&(29.G)){49=f7(29)}if(49){f6(49)}29=L;A 7f=3Z.T("[",4L);if(0<=7f){4L=3Z.T("]",7f);if(0<=4L){29=3Z.21(7f+1,4L)}}}}};A f0=B(f5){A 4K=".";A 7e=f5.1A(" ");1s(7e.G){A 2K=7e.3a();A 7d;if(2K==">"){7d="/";2K=7e.3a()}I{7d="//"}A f4=5r(2K);4K+=7d+f4;A id=6X(2K);if(id.G){4K+="[@id=\'"+id+"\'][1]"}A cn=9H(2K);if(cn.G){A 9X=" ";if(cn.2s(cn.G-1)=="*"){9X="";cn=cn.3b(0,cn.G-1)}4K+="[5z(3U(\' \',@9P,\' \'), \' "+cn+9X+"\')]"}9C(f3,2K,B(f2){C"[@"+f2+"]"},B(f1){4K+=f1})}C 4K};A 7a={};A eC=B(28){if(7a[28]){C 7a[28]}A 1e=d.1e;A 9W=f0(28);A 4H=B(9V){A J=[];A 7b;1u{7b=1e.9x(9W,9V,L,lh.lg,L)}1y(e){1z.1K("lf in le:",9W,"lc:",9V);1z.1K(e)}A 7c=7b.eZ();1s(7c){J.Y(7c);7c=7b.eZ()}C J};C 7a[28]=4H};A 5x={};A 9B={};A 3y=B(79,78){if(!79){C 78}if(!78){C 79}C B(){C 79.14(26,P)&&78.14(26,P)}};A 75=B(9U,3Y,5B,2J){A 2v=2J+1;A 76=(3Y.G==2v);A 2K=3Y[2J];if(2K==">"){A 77=9U.3W;if(!77.G){C}2v++;76=(3Y.G==2v);A 4H=6O(3Y[2J+1]);R(A x=0,11;x<77.G,11=77[x];x++){if(4H(11)){if(76){5B.Y(11)}I{75(11,3Y,5B,2v)}}}}A 5C=6U(2K)(9U);if(76){1s(5C.G){5B.Y(5C.3a())}}I{1s(5C.G){75(5C.3a(),3Y,5B,2v)}}};A eE=B(9T,eY){A J=[];A x=9T.G-1,11;1s(11=9T[x--]){75(11,eY,J,0)}C J};A 6O=B(3D){if(5x[3D]){C 5x[3D]}A ff=L;A 9S=5r(3D);if(9S!="*"){ff=3y(ff,B(N){C((N.2t==1)&&(9S==N.5w.1M()))})}A 9R=6X(3D);if(9R.G){ff=3y(ff,B(N){C((N.2t==1)&&(N.id==9R))})}if(2Y.5q.14(D,2I(3D).2w(1))>=0){ff=3y(ff,9z(3D))}C 5x[3D]=ff};A 5y=B(E){A pn=E.1L;A 9Q=pn.3W;A 2v=-1;A 3C=pn.5A;if(!3C){C 2v}A ci=E["eW"];A cl=pn["eX"];if(((V cl=="4J")&&(cl!=9Q.G))||(V ci!="4J")){pn["eX"]=9Q.G;A 2J=1;do{if(3C===E){2v=2J}if(3C.2t==1){3C["eW"]=2J;2J++}3C=3C.71}1s(3C)}I{2v=ci}C 2v};A lb=0;A 3X=B(N,15){A 74="";if(15=="9P"){C N.3A||74}if(15=="R"){C N.la||74}C N.5t(15,2)||74};A eH=[{1i:"|=",1f:B(15,9O){A eV=" "+9O+"-";C B(N){A ea=" "+(N.5t(15,2)||"");C((ea==9O)||(ea.T(eV)==0))}}},{1i:"^=",1f:B(15,eU){C B(N){C(3X(N,15).T(eU)==0)}}},{1i:"*=",1f:B(15,eT){C B(N){C(3X(N,15).T(eT)>=0)}}},{1i:"~=",1f:B(15,eS){A 9N=" "+eS+" ";C B(N){A ea=" "+3X(N,15)+" ";C(ea.T(9N)>=0)}}},{1i:"$=",1f:B(15,73){A 9N=" "+73;C B(N){A ea=" "+3X(N,15);C(ea.31(73)==(ea.G-73.G))}}},{1i:"!=",1f:B(15,eR){C B(N){C(3X(N,15)!=eR)}}},{1i:"=",1f:B(15,eQ){C B(N){C(3X(N,15)==eQ)}}}];A 9E=[{1i:"9M-9K",1f:B(1p,l9){C B(N){if(N.2t!=1){C U}A fc=N.eP;1s(fc&&(fc.2t!=1)){fc=fc.eP}C(!fc)}}},{1i:"72-9K",1f:B(1p,l8){C B(N){if(N.2t!=1){C U}A nc=N.71;1s(nc&&(nc.2t!=1)){nc=nc.71}C(!nc)}}},{1i:"l7",1f:B(1p,l6){C B(N){A cn=N.3W;A eO=N.3W.G;R(A x=eO-1;x>=0;x--){A nt=cn[x].2t;if((nt==1)||(nt==3)){C U}}C K}}},{1i:"5z",1f:B(1p,eN){C B(N){C(N.9L.T(eN)>=0)}}},{1i:"3O",1f:B(1p,eM){A eL=6O(eM);C B(N){C(!eL(N))}}},{1i:"l5-9K",1f:B(1p,2u){A pi=eK;if(2u=="l4"){C B(N){C(((5y(N))%2)==1)}}I{if((2u=="2n")||(2u=="l3")){C B(N){C((5y(N)%2)==0)}}I{if(2u.T("l2+")==0){A 70=pi(2u.3b(3));C B(N){C(N.1L.3W[70-1]===N)}}I{if((2u.T("n+")>0)&&(2u.G>3)){A 9J=2u.1A("n+",2);A eJ=pi(9J[0]);A 2J=pi(9J[1]);C B(N){C((5y(N)%eJ)==2J)}}I{if(2u.T("n")==-1){A 70=pi(2u);C B(N){C(5y(N)==70)}}}}}}}}];A 9z=B(3e){A 9I=(9B[3e]||5x[3e]);if(9I){C 9I}A ff=L;A i=2I(3e);if(i[0]>=0){A 24=5r(3e);if(24!="*"){ff=3y(ff,B(N){C(N.5w.1M()==24)})}}A 5u;A 3B=9H(3e);if(3B.G){A 9F=3B.2s(3B.G-1)=="*";if(9F){3B=3B.3b(0,3B.G-1)}A re=S 9G("(?:^|\\\\s)"+3B+(9F?".*":"")+"(?:\\\\s|$)");ff=3y(ff,B(N){C re.6Z(N.3A)})}if(i[3]>=0){A 3z=3e.3b(i[3]+1);A 9D="";A 5v=3z.T("(");A 6Y=3z.31(")");if((0<=5v)&&(0<=6Y)&&(6Y>5v)){9D=3z.21(5v+1,6Y);3z=3z.3b(0,5v)}5u=L;R(A x=0;x<9E.G;x++){A 1S=9E[x];if(1S.1i==3z){5u=1S.1f(3z,9D);3f}}if(5u){ff=3y(ff,5u)}}A eG=(d.1l)?B(5s){A eI=5s.1M();C B(N){C N[5s]||N[eI]}}:B(5s){C B(N){C(N&&N.5t&&N.l1(5s))}};9C(eH,3e,eG,B(eF){ff=3y(ff,eF)});if(!ff){ff=B(){C K}}C 9B[3e]=ff};A 6W={};A 6U=B(3d,1B){A 9A=6W[3d];if(9A){C 9A}A i=2I(3d);A id=6X(3d);if(i[0]==0){C 6W[3d]=B(1B){C[d.1D(id)]}}A 9y=9z(3d);A 5p;if(i[0]>=0){5p=B(1B){A 11=d.1D(id);if(9y(11)){C[11]}}}I{A 3V;A 24=5r(3d);if(2Y.5q.14(D,2I(3d))==-1){5p=B(1B){A J=[];A 11,x=0,3V=1B.4I(24);1s(11=3V[x++]){J.Y(11)}C J}}I{5p=B(1B){A J=[];A 11,x=0,3V=1B.4I(24);1s(11=3V[x++]){if(9y(11)){J.Y(11)}}C J}}}C 6W[3d]=5p};A l0={};A 5o={">":B(1B){A J=[];A 11,x=0,3V=1B.3W;1s(11=3V[x++]){if(11.2t==1){J.Y(11)}}C J}};A 9w=B(6V){if(0>6V.T(" ")){C 6U(6V)}A eD=B(1B){A 6S=6V.1A(" ");A 6T;if(6S[0]==">"){6T=[1B]}I{6T=6U(6S.3a())(1B)}C eE(6T,6S)};C eD};A 9v=((1q["9x"]&&!d.3o)?B(3x){A 6R=3x.1A(" ");if((1q["9x"])&&(3x.T(":")==-1)&&((K))){if(((6R.G>2)&&(3x.T(">")==-1))||(6R.G>3)||(3x.T("[")>=0)||((1==6R.G)&&(0<=3x.T(".")))){C eC(3x)}}C 9w(3x)}:9w);A ey=B(3w){if(5o[3w]){C 5o[3w]}if(0>3w.T(",")){C 5o[3w]=9v(3w)}I{A eB=3w.1A(/\\s*,\\s*/);A 4H=B(1B){A eA=0;A J=[];A 6Q;1s(6Q=eB[eA++]){J=J.3U(9v(6Q,6Q.T(" "))(1B))}C J};C 5o[3w]=4H}};A 5n=0;A ez=B(Q){A J=S d.1H();if(!Q){C J}if(Q[0]){J.Y(Q[0])}if(Q.G<2){C J}5n++;Q[0]["9u"]=5n;R(A x=1,11;11=Q[x];x++){if(Q[x]["9u"]!=5n){J.Y(11)}11["9u"]=5n}C J};d.1r=B(6P,1B){if(V 6P!="3c"){C S d.1H(6P)}if(V 1B=="3c"){1B=d.1D(1B)}C ez(ey(6P)(1B||d.1e))};d.9t=B(ex,9s){A 9r=S d.1H();A ff=(9s)?6O(9s):B(){C K};R(A x=0,11;11=ex[x];x++){if(ff(11)){9r.Y(11)}}C 9r}})()}if(!z.1h["z.X.1b"]){z.1h["z.X.1b"]=K;z.1Q("z.X.1b");z.6K=B(ew){A J={};A iq="kZ[Z!=9q][Z!=kY][Z!=et][Z!=kX][Z!=kW], kV, kU";z.1r(iq,ew).3T(B(E){C(!E.kT)}).1n(B(1m){A 3v=1m.1p;A Z=(1m.Z||"").1M();if((Z=="kS")||(Z=="kR")){if(1m.kQ){J[3v]=1m.1Z}}I{if(1m.kP){A ev=J[3v]=[];z.1r("kO[kN]",1m).1n(B(eu){ev.Y(eu.1Z)})}I{J[3v]=1m.1Z;if(Z=="et"){J[3v+".x"]=J[3v+".y"]=J[3v].x=J[3v].y=0}}}});C J};z.9h=B(23){A ec=kM;A J="";A es={};R(A x in 23){if(23[x]!=es[x]){if(z.2l(23[x])){R(A y=0;y<23[x].G;y++){J+=ec(x)+"="+ec(23[x][y])+"&"}}I{J+=ec(x)+"="+ec(23[x])+"&"}}}if((J.G)&&(J.2s(J.G-1)=="&")){J=J.3b(0,J.G-1)}C J};z.kL=B(er){C z.9h(z.6K(er))};z.kK=B(ep){C z.eq(z.6K(ep))};z.kJ=B(2H){A J={};A qp=2H.1A("&");A dc=kI;z.1n(qp,B(1m){if(1m.G){A 9p=1m.1A("=");A 1p=dc(9p.3a());A 1U=dc(9p.22("="));if(z.1R(J[1p])){J[1p]=[J[1p]]}if(z.2l(J[1p])){J[1p].Y(1U)}I{J[1p]=1U}}});C J};z.e1=U;z.e6={"9g":B(1b){C 1b.2G},"2e":B(1b){if(!1o.eo){1z.1K("kH kG kF a kE of 9g/2e-6M-9m"+" 4F kD kC kB kA 4G en kz"+" (ky 1o.eo=K 4F kx kw D kv)")}C z.5m(1b.2G)},"2e-6M-ku":B(1b){A 6N=1b.2G;A 9o=6N.T("/*");A 9n=6N.31("*/");if((9o==-1)||(9n==-1)){C z.5m(1b.2G)}C z.5m(6N.21(9o+2,9n))},"2e-6M-9m":B(1b){A 6L=1b.2G;A 9l=6L.T("/*");A 9k=6L.31("*/");if((9l==-1)||(9k==-1)){1z.1K("kt en ks\'t 6M 9m!");C""}C z.5m(6L.21(9l+2,9k))},"kr":B(1b){C z.3u(1b.2G)},"kq":B(1b){if(z.1l&&!1b.el){z.1n(["ko","em","kn","km"],B(i){1u{A 1e=S 9j(kl[i]+".kk");1e.kj=U;1e.ki(1b.2G);C 1e}1y(e){}})}I{C 1b.el}}};(B(){z.e5=B(F,ej,ei,eh){A 2F={};2F.F=F;A 6J=L;if(F.3R){A 3R=z.1D(F.3R);A 9i=3R.kh("kg");2F.2E=F.2E||(9i?9i.1Z:L);6J=z.6K(3R)}I{2F.2E=F.2E}A 5l=[{}];if(6J){5l.Y(6J)}if(F.5g){5l.Y(F.5g)}if(F.ek){5l.Y({"z.ek":S 5d().8O()})}2F.1r=z.9h(z.1x.14(L,5l));2F.9d=F.9d||"9g";A d=S z.30(ej);d.5k(ei,B(eg){C eh(eg,d)});A ld=F.4E;if(ld&&z.1Y(ld)){d.ef(B(ee){C ld.2d(F,ee,2F)})}A 1G=F.9f;if(1G&&z.1Y(1G)){d.ed(B(e9){C 1G.2d(F,e9,2F)})}A 6I=F.kf;if(6I&&z.1Y(6I)){d.9e(B(e8){C 6I.2d(F,e8,2F)})}d.1F=2F;C d};A e4=B(O){O.e0=K;A 1b=O.1F.1b;if(V 1b.e7=="B"){1b.e7()}};A e3=B(O){C z.e6[O.1F.9d](O.1F.1b)};A e2=B(9c,O){1z.1K(9c);C 9c};A 3Q=B(F){A O=z.e5(F,e4,e3,e2);O.1F.1b=z.9b(O.1F.F);C O};A 5j=L;A 3t=[];A 94=B(){A dZ=(S 5d()).dU();if(!z.e1){z.1n(3t,B(4D,6H){if(!4D){C}A O=4D.O;1u{if(!O||O.e0||!4D.dT(O)){3t.3S(6H,1);C}if(4D.dR(O)){3t.3S(6H,1);4D.dP(O)}I{if(O.9a){if(O.9a+(O.1F.F.6G||0)<dZ){3t.3S(6H,1);A 1G=S 1O("6G ke");1G.dY="6G";O.5i(1G);O.4C()}}}}1y(e){1z.1K(e);O.5i(S 1O("kc!"))}})}if(!3t.G){dX(5j);5j=L;C}};z.dV=B(){1u{z.1n(3t,B(i){i.O.4C()})}1y(e){}};if(z.1l){z.dW(z.dV)}z.dH=B(O,dS,dQ,dO){if(O.1F.F.6G){O.9a=(S 5d()).dU()}3t.Y({O:O,dT:dS,dR:dQ,dP:dO});if(!5j){5j=dN(94,50)}94()};A dJ="8Z/x-kb-3R-ka";A dG=B(O){C O.1F.1b.6F};A dF=B(O){C 4==O.1F.1b.6F};A dE=B(O){if(z.8Y(O.1F.1b)){O.dM(O)}I{O.5i(S 1O("k9 k8 k7 5h:"+O.1F.1b.3N))}};A 3P=B(Z,O){A 3s=O.1F;A F=3s.F;3s.1b.dL(Z,3s.2E,(F.k6!==K),(F.8X?F.8X:1k),(F.8W?F.8W:1k));if(F.6E){R(A 5f in F.6E){if(5f.1M()==="5g-Z"&&!F.8V){F.8V=F.6E[5f]}I{3s.1b.dK(5f,F.6E[5f])}}}3s.1b.dK("k5-k4",(F.8V||dJ));1u{3s.1b.dI(3s.1r)}1y(e){O.4C()}z.dH(O,dG,dF,dE);C O};z.8T=B(4B){if(4B.1r.G){4B.2E+=(4B.2E.T("?")==-1?"?":"&")+4B.1r;4B.1r=L}};z.k3=B(F){A O=3Q(F);z.8T(O.1F);C 3P("dD",O)};z.k2=B(F){C 3P("dC",3Q(F))};z.k1=B(F){A O=3Q(F);O.1F.1r=F.k0;C 3P("dC",O)};z.jZ=B(F){C 3P("dA",3Q(F))};z.jY=B(F){A O=3Q(F);A dB=O.1F;if(F["8U"]){dB.1r=F.8U;F.8U=L}C 3P("dA",O)};z.jX=B(F){A O=3Q(F);z.8T(O.1F);C 3P("8S",O)};z.dz=B(jW){2m S 1O("z.dz 3O jV jU")}})()}if(!z.1h["z.X.fx"]){z.1h["z.X.fx"]=K;z.1Q("z.X.fx");z.dx=B(dy,1d){D.1w=dy;D.1d=1d;D.4x=B(n){C((D.1d-D.1w)*n)+D.1w}};z.2r("z.d6",L,{1P:B(F){z.1x(D,F);if(z.2l(D.2C)){D.2C=S z.dx(D.2C[0],D.2C[1])}},2C:L,8Q:jT,5a:L,4z:0,dj:10,du:L,6x:L,dt:L,8B:L,dh:L,ds:L,dr:L,dm:L,2D:U,2Z:U,4A:L,8N:L,3r:L,2o:0,4y:0,3q:B(H,F){if(D[H]){D[H].14(D,F||[])}C D},5b:B(dw,8R){if(8R){5e(D.3r);D.2D=D.2Z=U;D.2o=0}I{if(D.2D&&!D.2Z){C D}}D.3q("6x");A d=dw||D.du;if(d>0){5c(z.2p(D,B(){D.5b(L,8R)}),d);C D}D.4A=S 5d().8O();if(D.2Z){D.4A-=D.8Q*D.2o}D.8N=D.4A+D.8Q;D.2D=K;D.2Z=U;A 8P=D.2C.4x(D.2o);if(!D.2o){if(!D.4y){D.4y=D.4z}D.3q("dt",[8P])}D.3q("ds",[8P]);D.8M();C D},jS:B(){5e(D.3r);if(!D.2D){C D}D.2Z=K;D.3q("dr",[D.2C.4x(D.2o)]);C D},jR:B(dq,dp){5e(D.3r);D.2D=D.2Z=K;D.2o=dq*6D;if(dp){D.5b()}C D},jQ:B(dn){if(!D.3r){C}5e(D.3r);if(dn){D.2o=1}D.3q("dm",[D.2C.4x(D.2o)]);D.2D=D.2Z=U;C D},3N:B(){if(D.2D){C D.2Z?"3M":"jP"}C"jO"},8M:B(){5e(D.3r);if(D.2D){A dl=S 5d().8O();A 2q=(dl-D.4A)/(D.8N-D.4A);if(2q>=1){2q=1}D.2o=2q;if(D.5a){2q=D.5a(2q)}D.3q("8B",[D.2C.4x(2q)]);if(2q<1){D.3r=5c(z.2p(D,"8M"),D.dj)}I{D.2D=U;if(D.4z>0){D.4z--;D.5b(L,K)}I{if(D.4z==-1){D.5b(L,K)}I{if(D.4y){D.4z=D.4y;D.4y=0}}}D.2o=0;D.3q("dh")}}C D}});(B(){A df=B(E){if(z.1l){A ns=E.1c;if(!ns.8L.G&&z.1c(E,"8L")=="dg"){ns.8L="1"}if(!ns.3n.G&&z.1c(E,"3n")=="8K"){ns.3n="8K"}}};z.6C=B(F){if(V F.1d=="1k"){2m S 1O("z.6C jN an 1d 1Z")}F.E=z.1D(F.E);A 3p=z.1x({6w:{}},F);A 8J=(3p.6w.2W={});8J.1w=(V 3p.1w=="1k")?B(){C 2V(z.1c(3p.E,"2W"))}:3p.1w;8J.1d=3p.1d;A 2U=z.6y(3p);z.2c(2U,"6x",L,B(){df(3p.E)});C 2U};z.8I=B(F){C z.6C(z.1x({1d:1},F))};z.8H=B(F){C z.6C(z.1x({1d:0},F))};if(z.6B&&!z.3o){z.8E=B(n){C 2k("0.5")+((2Y.da((n+2k("1.5"))*2Y.d9))/2)}}I{z.8E=B(n){C 0.5+((2Y.da((n+1.5)*2Y.d9))/2)}}A d4=B(6A){D.8G=6A;R(A p in 6A){A 1a=6A[p];if(1a.1w 1N z.1J){1a.d7=S z.1J()}}D.4x=B(r){A J={};R(A p in D.8G){A 1a=D.8G[p];A 6z=L;if(1a.1w 1N z.1J){6z=z.d8(1a.1w,1a.1d,r,1a.d7).8F()}I{if(!z.2l(1a.1w)){6z=((1a.1d-1a.1w)*r)+1a.1w+(p!="2W"?1a.jM||"px":"")}}J[p]=6z}C J}};z.6y=B(F){F.E=z.1D(F.E);if(!F.5a){F.5a=z.8E}A 2U=S z.d6(F);z.2c(2U,"6x",2U,B(){A pm={};R(A p in D.6w){A 1a=pm[p]=z.1x({},D.6w[p]);if(z.1Y(1a.1w)){1a.1w=1a.1w()}if(z.1Y(1a.1d)){1a.1d=1a.1d()}A d5=(p.1M().T("jL")>=0);B 8C(E,p){4w(p){2X"58":C E.8D;2X"3n":C E.6v}A v=z.1c(E,p);C(p=="2W")?2V(v):2k(v)};if(V 1a.1d=="1k"){1a.1d=8C(D.E,p)}I{if(V 1a.1w=="1k"){1a.1w=8C(D.E,p)}}if(d5){1a.1w=S z.1J(1a.1w);1a.1d=S z.1J(1a.1d)}I{1a.1w=(p=="2W")?2V(1a.1w):2k(1a.1w)}}D.2C=S d4(pm)});z.2c(2U,"8B",2U,B(8A){R(A s in 8A){z.1c(D.E,s,8A[s])}});C 2U}})()}',62,1711,'|||||||||||||||||||||||||||||||||||dojo|var|function|return|this|node|args|length|evt|else|ret|true|null|obj|elem|dfd|arguments|arr|for|new|indexOf|false|typeof||_base|push|type||te|||apply|attr|||||prop|xhr|style|end|doc|match|uri|_hasResource|key|del|undefined|isIE|item|forEach|djConfig|name|document|query|while|_66|try|res|start|mixin|catch|console|split|root|prototype|byId|gcs|ioArgs|err|NodeList|_p|Color|debug|parentNode|toLowerCase|instanceof|Error|constructor|provide|isString|ta|255|val|_a|global|_69|isFunction|value||substring|join|map|tn||window||path|_343|_220|_listeners|connect|call|json|replace|left|_b|toString|128|parseFloat|isArray|throw||_percent|hitch|step|declare|charAt|nodeType|_3c3|nidx|slice|faux|fired|_c4|_7e|loc|curve|_active|url|_44c|responseText|str|_312|idx|tqp|isNaN|isOpera|_22d|callee|add|_18b|_f8|_e2|_41|anim|Number|opacity|case|Math|_paused|Deferred|lastIndexOf|||||||||shift|substr|string|_3e7|_3ce|break|_w|charCode|_listener|_d5|_c5|authority|_49|width|isSafari|_49e|fire|_timer|_47b|_465|eval|_in|_40c|_409|_362|_3d9|className|_3d5|_386|_37a|body|getComputedStyle|box|_221|keyCode|remove|_8d|_46|paused|status|not|_478|_461|form|splice|filter|concat|tret|childNodes|_38b|_367|_33d||||||||||_340|_348|keypress|appendChild|_toArray|Array|_2b0|_toPixelValue|ref|_fixEvent|_19f|_14c|_14a|_150|_141|declaredClass|_d4|_99|_Url|_83|scheme|_67|_3d|switch|getValue|_startRepeatCount|repeat|_startTime|_47e|cancel|tif|load|to|with|tf|getElementsByTagName|number|_34c|_342|extend|_1e3|_normalizeEventName|_14b|_14e|results|self|cbfn|_f9|_d8|_b2|src|_88|dav||baseUrl|fragment|_loadedModules|_44|_43|_loaders|mll|height||easing|play|setTimeout|Date|clearTimeout|hdr|content|code|errback|_464|addCallbacks|_450|fromJson|_413|_3fc|_3ee|max|_31e|cond|getAttribute|_3d4|obi|tagName|_360|_381|contains|firstChild|_368|_372|_320|place|_2fa|scrollTop|_299|scrollLeft|top|documentElement|_288|_287|_getBorderExtents|_23f|_23d|_239|_218|_216|_211|eles|target|keys|shiftKey|ctrlKey|event|192|iel|_1db|delete|_1cf||addEventListener|String|_1af|_157|array|_14d|continue|_14f|_137|_11f|_106|_findMethod|has|_delegate|_dc|_d3|loaded|_9a|_loadInit|_inFlightCount|getObject|tv|_4f|_postLoad|_2d|offsetWidth|properties|beforeBegin|animateProperty|_4ad|_4a6|isKhtml|_fade|100|headers|readyState|timeout|_469|_457|_44d|formToObject|_441|comment|_43d|_36f|_419|tp|_40a|_406|_407|_373|_403|_3e6|_31b|cbi|test|_3c7|nextSibling|last|_3a1|_38e|_365|_36b|ecn|_364|_363|_356|_35e|_35f|_34f|_34d|_349|trim|tci|_328|_32b|_31f|_31c|_anim|_300|_2ff|_2f5|_2e7|removeClass|addClass|func|_2c4|cls|_2a9|_2ae|_280|_27f|_getPadExtents|isMoz|none|_233|cssText|_214|_fixCallback|_synthesizeEvent|stopPropagation|preventDefault|_setKeyChar|_1e1|ieh|_1d7|_1be|colorFromArray|sanitize|bits|rgb|_156|_fire|_resback|_13d|partial|_13a|silentlyCancelled|_topics|_127|_f1|_f0|superclass|_ec|_e3|mct|setObject|_bf|_b3|object|require|_92|_khtmlTimer|location|XMLHTTP|locale|dua|_71|_modulePrefixes|_55|_loadModule|_51|_50|_4e|pop|_3f|_callLoaded|_unloaders|_loadNotifying|_loadedUrls|_27|_24|_1d|_5|_4b7|onAnimate|getStyle|offsetHeight|_defaultEasing|toCss|_properties|fadeOut|fadeIn|_49f|auto|zoom|_cycle|_endTime|valueOf|_494|duration|_492|DELETE|_ioAddQueryToUrl|putData|contentType|password|user|_isDocumentOk|application|||||_466||||||startTime|_xhrObj|_45f|handleAs|addBoth|error|text|objectToQuery|_44f|ActiveXObject|_443|_442|filtered|_43f|_43e|_437|file|tnl|_41c|_filterQueryResult|_zipIdx|_408|_402|evaluate|_3ed|_380|fHit|_361|_33b|_3da|_3ab|_3d6|RegExp|_327|_3cf|_3c9|child|innerHTML|first|tval|_391|class|pnc|_37e|_37c|_375|_366|_35c|_35a|_353|_33c|_336|_314|||_315|_oe|_307|_309|cloneNode|after|createElement||_2f8|_2ef|_2ee|unshift|coords|some|every||_2cb|script|_2c9|parent||a2p||_2c3|_2bd||abs|_getMarginBox|_2b3|_2a6|position|_2a7|_2ac|_2ab|_getIeDocumentElementOffset|getBoundingClientRect|ownerDocument|_2a3|clientWidth|_isBodyLtr|_fixIeBiDiScrollLeft|_bodyLtr|_29d|_getContentBox|_setBox|_getMarginExtents|_getPadBorderExtents|_usesBorderBox|boxModel|pcs|st|sl|_240|runtimeStyle|_dcm|BackCompat|compatMode|default|_21b|_d|html|_event_listener|handlers|PAGE_DOWN|PAGE_UP|RIGHT_ARROW|LEFT_ARROW|DOWN_ARROW|UP_ARROW|_preventDefault||_stopPropagation|returnValue||_trySetKeyCode|cancelBubble|currentTarget|106|_1ee|111||_1e8|_1e7|||se|srcElement|onkeydown||_1d0|_disconnect|lid|_1c0|_connect|_set|_195|_185|_183|_17d|_everyOrSome|_16b|_172|_15b|Function|_154|_escapeString|_140|chain|_check|canceller|_12d|_124|_11a|_10d|_107|inherited|_fa|_f2|_findMixin|_constructor|preamble|_de|clone|tmp|_c7|TMP|_be|_ba|_mixin|isBrowser|lang|firebug||param|modulePaths|_a7|_fireCallback|_a0|setContext||_9c|unloaded||||_96|_93|navigator|_90|_89||protocol|_84|_86|_XMLHTTP_PROGIDS|gears|google|setAttribute|_80|_77|cfg|_6f|_getModuleSymbols|_5a|_58|_53|_4d|_4c|_45|_40|_moduleHasPrefix|_loadUri|_28|_26|_21|_22|tests|doh|_20|_1f|_1c|version|_1b|_19|_getProp|_11|_4|_4a5|_4b3|_Animation|tempColor|blendColors|PI|sin|||||_49a|normal|onEnd||rate||curr|onStop|_497||_496|pct|onPause|onPlay|onBegin|delay||_491|_Line|_48b|wrapForm|PUT|_487|POST|GET|_476|_474|_472|_ioWatch|send|_471|setRequestHeader|open|callback|setInterval|_470|resHandle|_46f|ioCheck|_46e|validCheck|getTime|_ioCancelAll|addOnUnload|clearInterval|dojoType|now|canceled|_blockAsync|_45e|_45c|_459|_ioSetArgs|_contentHandlers|abort|_458|_456||||addErrback|_454|addCallback|_452|_44b|_44a|_449|preventCache|responseXML|Microsoft|JSON|usePlainJson|_431|toJson|_430|_42d|image|opt|ria|_421|_41b|_40b|_zip|_410|_40d|_357|sqf|_374|_3e5|_3df|_38f|clc|pred|parseInt|ntf|_3bf|_3bc|cnl|previousSibling|_3a9|_3a6|_39c|_399|_396|_392|__cachedIndex|__cachedLength|_376|iterateNext|_34a|_355|_354|_32c|_350|_34b|_33f|_33e|_33a|_338|_334|_332||_330|_32e||_322|_316|mousemove|mouseout|mouseover|_305|lastChild||_2f9||_2f2|_2f1|removeChild|_2ec|_2eb|_2ea|_2e6||_2e4|_2e2|_2d6|_2d5|_2d4|_2d3|_2d2|_2d1|_2cd|_2cc|scs|write|_2c8|hasClass|_2c0|_2bb|_2b5|_abs|_docScroll|offsetParent|offsetTop|offsetLeft|absolute|getBoxObjectFor|clientLeft|_setContentSize|_setMarginBox|_28d|_286|_285|_289|NaN|_281|border|_272|_26b|_260|_258|_253|_24c|_246|_23a|_getOpacity|_setOpacity|_238|td|tr|nodeName|FILTER|_22f|_22e|currentStyle|_22c|_22b|display|QuirksMode|unselectable|_217|isMozilla|getElementById|attributes|all|_ie_listener|_getIeDispatcher|_1fd|NUM_LOCK|SCROLL_LOCK|INSERT|END|HOME|PAUSE|F12|F11|F10|F9|F8|F7|F6|F5|F4|F3|F2|F1|63232|SHIFT_TAB|TAB|keyIdentifier|_1f3|stopEvent|_punctMap|222|219|186|onkeypress|_stealthKeyDown|_fixKeys|relatedTarget|_1e0|_1df|_stealthKeydown|_1d6|_1d5|_1d1|_1ca|_1c9|_1cb|_1c2|_1c1|_1c3|_1c4|_1bc|_1b3|_1b2|colorFromHex|colorFromRgb|named|colorFromString|mask|rgba|_19c|_197|_192|setColor|_180|_178|_177|_175|_174|_16d|_166|_164|_163|_162|_15c|_15d|_15e|index|__json__|toJsonIndentStr|_nextId|_12f|_12b|publish|_128|_126|_125|_122|_121|_123|_11c|_11b|_10c|_10b|_108|getDispatcher|argument|nom|_construct|_core|_makeCtor|_df|_db|deprecated|isObject|_cc||scope||_hitchArgs|_c2||pre|_c1|native|isDebug||registerModulePath|_a8||finally|||_a6|_a5|_a4|_a3|_a2|_a1|_9f|_9e|_9d|_9b|_98|_97|onbeforeunload|ipt|scr|complete|_95|userAgent|_modulesLoaded|initialized|_initFired|_8c|_8a|_getText|_87|ieForceActiveXXhr|Msxml2|isGears|_81|_gearsObject|googlegears|GearsFactory|isFF|_7d|Safari|_72|_name|_6c|ire|ore|_68|i18n|_5b|requireIf|_56|_52|loading|_4a|_loadPath|_47|_48|_global_omit_module_check|_getModulePrefix|_3c|_3a|_37|_30|Boolean|_loadUriAndCheck|_2e||cacheBust|_1e|_1a|_17|_16|_15|_14|_f|_10|_e|_9|_8|revision|flag|patch|minor|major|_6|color|units|needs|stopped|playing|stop|gotoPercent|pause|1000|implemented|yet|_48a|xhrDelete|rawXhrPut|xhrPut|postData|rawXhrPost|xhrPost|xhrGet|Type|Content|sync|response|http|bad|urlencoded|www|_watchInFlightError||exceeded|handle|action|getAttributeNode|loadXML|async|XMLDOM|prefixes|MSXML3|MSXML|MSXML2||xml|javascript|wasn|your|optional|message|off|turn|use|endpoints|issues|security|potential|avoid|mimetype|using|consider|please|decodeURIComponent|queryToObject|formToJson|formToQuery|encodeURIComponent|selected|option|multiple|checked|checkbox|radio|disabled|textarea|select|button|reset|submit|input|_3fb|hasAttribute|0n|even|odd|nth|_3b5|empty|_3b1|_3ad|htmlFor|_38a|under||exprssion|failure|ANY_TYPE|XPathResult|starts|keyup|keydown|mouseup|mousedown|blur|click|combine|span|addContent||adopt|orphan|_2de|_2dd|styles|_2da|_2d9|_2cf|_2ce|show|createPopup|toggleClass|scrollWidth|clientTop|ltr|direction|pageXOffset|pageYOffset|fixed|contentBox|marginBox|BUTTON|TABLE|_getBorderBox|clientHeight|visible|overflow|marginBottom|marginRight|marginTop|marginLeft|borderBottomWidth|borderBottomStyle|borderRightWidth|borderRightStyle|borderTopWidth|borderTopStyle|borderLeftWidth|borderLeftStyle|paddingBottom|paddingRight|paddingTop|paddingLeft|offset||min|padding||margin|Opacity|Alpha|alpha|filters|pixelLeft|medium|_22a|defaultView|before||insertBefore|KhtmlUserSelect|MozUserSelect|setSelectable|isDescendant|div|_destroyElement|BackgroundImageCache|execCommand|PageDown|PageUp|Right|Left|Down|Up|63289|63249|63248|PRINT_SCREEN|63302|63277|63276|63275|63273|63272|63250|63247|63246|63245|63244|63243|63242|63241|63240|63239|63238|63237|63236|63235|63234|63233|Enter|_1f9|which|_1f6|bubbledKeyCode|221|220||||191|190|189|188|187|toElement|fromElement|clientY|pageY||clientX|pageX|offsetY|||layerY|offsetX|layerX|parentWindow|_nop|_allow_leaks|145|144|126|F15|125|F14|124|F13|123|122|121|120|119|118|117|116|115|114|113|112|NUMPAD_DIVIDE|110|NUMPAD_PERIOD|109|NUMPAD_MINUS|108|NUMPAD_ENTER|107|NUMPAD_PLUS|NUMPAD_MULTIPLY|105|NUMPAD_9|104|NUMPAD_8|103|NUMPAD_7|102|NUMPAD_6|101|NUMPAD_5|NUMPAD_4||NUMPAD_3|NUMPAD_2|NUMPAD_1|NUMPAD_0||SELECT|RIGHT_WINDOW||LEFT_WINDOW||HELP|SPACE|ESCAPE|CAPS_LOCK|ALT|CTRL|SHIFT|ENTER|CLEAR|BACKSPACE|attachEvent|fixEvent|fromCharCode|keyChar|_1b9|removeEventListener|0x|round|toHex|toRgba|toRgb|aqua|teal|blue|navy|yellow|olive|lime|green|fuchsia|purple|red|maroon|white|gray|silver|black|boolean|called|already|Cancelled|connectPublisher|unsubscribe|subscribe|disconnect|_113|_112||_111|_110|||found|was||must|_|module|||required|likely|It|declaration|Mixin|separate|instead|property|initializer||pass|_c9|_bb|_b7|nfunction|isAlien|isFinite|isArrayLike|_firebug|withDoc|withGlobal|_writeIncludes|VML|behavior|addRule|createStyleSheet|vml|com|microsoft|schemas|urn|namespaces|onunload|onreadystatechange|defer|khtml|WebKit|DOMContentLoaded|enableMozDomContentLoaded|domcontentloaded|Unable|base|chrome|1223|304|300|200|available|XMLHttpRequest|_println|language|userLanguage|isQuirks|factory|mimeTypes|Factory|Gears|_7f|MSIE||Firefox|Gecko|Konqueror||Opera|appVersion|xd|browser|moduleUrl|port|host|hostenv|_requireLocalization|_5f|_5e|_5d|_5c|requireLocalization|requireAfterIf|_57|common|platformRequire|defined|symbol|_isXDomain|tried|Could|__package__|packageFileName|_42|useXDomain|flight|still|files|addOnLoad|failed|sourceURL|util|notice|without|change|subject|APIs|EXPERIMENTAL|experimental|removed|will|DEPRECATED|exists|10315|Rev|Mobile|Spidermonkey|Rhino||Browser|delayMozLoadingFix|preventBackButtonFix|libraryScriptUri|baseRelativePath|baseScriptUri|allowQueryConfig|warn|trace|timeEnd||time|profileEnd|profile|log|info|groupEnd|group|dirxml|dir|count|assert'.split('|'),0,{});


/*

Prototype 1.5 rc0
 - Adapted from Ruby on Rails - http://dev.rubyonrails.org/browser/spinoffs/prototype/src
 - By Lunarmedia, 06 August, 2006
 - Available at (and packed with) JavascriptCompressor.com

Please note this version is missing the selector.js component of the full Prototype library. 
You can get the compressed version of selector at JavascriptCompressor.com

*/

var decompressedPrototype = function(p,a,c,k,e,d){e=function(c){return(c<a?"":e(parseInt(c/a)))+((c=c%a)>35?String.fromCharCode(c+29):c.toString(36))};if(!''.replace(/^/,String)){while(c--){d[e(c)]=k[c]||e(c)}k=[(function(e){return d[e]})];e=(function(){return'\\w+'});c=1};while(c--){if(k[c]){p=p.replace(new RegExp('\\b'+e(c)+'\\b','g'),k[c])}}return p}('d T={4l:\'1.5.8P\',3E:\'(?:<3G.*?>)((\\n|\\r|.)*?)(?:<\\/3G>)\',2v:7(){},K:7(x){c x}};d 1b={17:7(){c 7(){6.1I.2n(6,N)}}};d 1e=z q();q.u=7(5d,O){G(d 1G 2M O){5d[1G]=O[1G]}c 5d};q.1U=7(U){1j{f(U==1v)c\'1v\';f(U==1L)c\'1L\';c U.1U?U.1U():U.2C()}1s(e){f(e 8R 9l)c\'...\';25 e}};7j.v.1d=7(){d 43=6,23=$A(N),U=23.8S();c 7(){c 43.2n(U,23.3s($A(N)))}};7j.v.8U=7(U){d 43=6;c 7(C){c 43.8V(U,C||1W.C)}};q.u(8Q.v,{8W:7(){d 4Z=6.2C(16);f(6<16)c\'0\'+4Z;c 4Z},5j:7(){c 6+1},8Y:7(o){$R(0,6,11).V(o);c 6}});d 6s={6j:7(){d 48;G(d i=0;i<N.t;i++){d 6L=N[i];1j{48=6L();1y}1s(e){}}c 48}};d 6Q=1b.17();6Q.v={1I:7(1a,1J){6.1a=1a;6.1J=1J;6.41=Y;6.2A()},2A:7(){5Z(6.2D.1d(6),6.1J*4z)},2D:7(){f(!6.41){1j{6.41=11;6.1a()}8Z{6.41=Y}}}};q.u(4b.v,{2T:7(1A,1z){d L=\'\',O=6,I;1z=N.90.52(1z);1H(O.t>0){f(I=O.I(1A)){L+=O.47(0,I.w);L+=(1z(I)||\'\').2C();O=O.47(I.w+I[0].t)}1D{L+=O,O=\'\'}}c L},92:7(1A,1z,3i){1z=6.2T.52(1z);3i=3i===1v?1:3i;c 6.2T(1A,7(I){f(--3i<0)c I[0];c 1z(I)})},93:7(1A,o){6.2T(1A,o);c 6},94:7(t,2S){t=t||30;2S=2S===1v?\'...\':2S;c 6.t>t?6.47(0,t-2S.t)+2S:6},9F:7(){c 6.2y(/^\\s+/,\'\').2y(/\\s+$/,\'\')},71:7(){c 6.2y(/<\\/?[^>]+>/7Y,\'\')},2Q:7(){c 6.2y(z 3O(T.3E,\'5P\'),\'\')},70:7(){d 6Y=z 3O(T.3E,\'5P\');d 5p=z 3O(T.3E,\'98\');c(6.I(6Y)||[]).1C(7(5o){c(5o.I(5p)||[\'\',\'\'])[1]})},3q:7(){c 6.70().1C(7(3G){c 4q(3G)})},9E:7(){d 1q=J.4Y(\'1q\');d 1Y=J.9D(6);1q.75(1Y);c 1q.3h},9c:7(){d 1q=J.4Y(\'1q\');1q.3h=6.71();c 1q.2z[0]?1q.2z[0].6q:\'\'},78:7(){d 7i=6.I(/^\\??(.*)$/)[1].3j(\'&\');c 7i.36({},7(5b,72){d 1i=72.3j(\'=\');5b[1i[0]]=1i[1];c 5b})},1Z:7(){c 6.3j(\'\')},3P:7(){d 2l=6.3j(\'-\');f(2l.t==1)c 2l[0];d 54=6.5g(\'-\')==0?2l[0].7e(0).3Y()+2l[0].7g(1):2l[0];G(d i=1,73=2l.t;i<73;i++){d s=2l[i];54+=s.7e(0).3Y()+s.7g(1)}c 54},1U:7(){c"\'"+6.2y(/\\\\/g,\'\\\\\\\\\').2y(/\'/g,\'\\\\\\\'\')+"\'"}});4b.v.2T.52=7(1z){f(2i 1z==\'7\')c 1z;d 2U=z 3n(1z);c 7(I){c 2U.7a(I)}};4b.v.9h=4b.v.78;d 3n=1b.17();3n.79=/(^|.|\\r|\\n)(#\\{(.*?)\\})/;3n.v={1I:7(2U,1A){6.2U=2U.2C();6.1A=1A||3n.79},7a:7(U){c 6.2U.2T(6.1A,7(I){d 53=I[1];f(53==\'\\\\\')c I[2];c 53+(U[I[3]]||\'\').2C()})}};d $1y=z q();d $49=z q();d 1p={V:7(o){d w=0;1j{6.2m(7(h){1j{o(h,w++)}1s(e){f(e!=$49)25 e}})}1s(e){f(e!=$1y)25 e}},9n:7(o){d L=11;6.V(7(h,w){L=L&&!!(o||T.K)(h,w);f(!L)25 $1y});c L},9o:7(o){d L=11;6.V(7(h,w){f(L=!!(o||T.K)(h,w))25 $1y});c L},3e:7(o){d P=[];6.V(7(h,w){P.W(o(h,w))});c P},7n:7(o){d L;6.V(7(h,w){f(o(h,w)){L=h;25 $1y}});c L},7o:7(o){d P=[];6.V(7(h,w){f(o(h,w))P.W(h)});c P},9p:7(1A,o){d P=[];6.V(7(h,w){d 7c=h.2C();f(7c.I(1A))P.W((o||T.K)(h,w))});c P},1M:7(U){d 51=Y;6.V(7(h){f(h==U){51=11;25 $1y}});c 51},36:7(45,o){6.V(7(h,w){45=o(45,h,w)});c 45},9q:7(1F){d 23=$A(N).47(1);c 6.3e(7(h){c h[1F].2n(h,23)})},9s:7(o){d L;6.V(7(h,w){h=(o||T.K)(h,w);f(L==1v||h>=L)L=h});c L},9u:7(o){d L;6.V(7(h,w){h=(o||T.K)(h,w);f(L==1v||h<L)L=h});c L},9v:7(o){d 50=[],58=[];6.V(7(h,w){((o||T.K)(h,w)?50:58).W(h)});c[50,58]},3r:7(1G){d P=[];6.V(7(h,w){P.W(h[1G])});c P},9x:7(o){d P=[];6.V(7(h,w){f(!o(h,w))P.W(h)});c P},9y:7(o){c 6.3e(7(h,w){c{h:h,59:o(h,w)}}).9z(7(18,3U){d a=18.59,b=3U.59;c a<b?-1:a>b?1:0}).3r(\'h\')},1Z:7(){c 6.3e(T.K)},9B:7(){d o=T.K,23=$A(N);f(2i 23.5e()==\'7\')o=23.9C();d 7l=[6].3s(23).1C($A);c 6.1C(7(h,w){c o(7l.3r(w))})},1U:7(){c\'#<1p:\'+6.1Z().1U()+\'>\'}};q.u(1p,{1C:1p.3e,5v:1p.7n,1k:1p.7o,8M:1p.1M,7p:1p.1Z});d $A=1E.7q=7(2R){f(!2R)c[];f(2R.1Z){c 2R.1Z()}1D{d P=[];G(d i=0;i<2R.t;i++)P.W(2R[i]);c P}};q.u(1E.v,1p);f(!1E.v.4d)1E.v.4d=1E.v.4m;q.u(1E.v,{2m:7(o){G(d i=0;i<6.t;i++)o(6[i])},5i:7(){6.t=0;c 6},7r:7(){c 6[0]},5e:7(){c 6[6.t-1]},7s:7(){c 6.1k(7(h){c h!=1v||h!=1L})},6J:7(){c 6.36([],7(6H,h){c 6H.3s(h&&h.5D==1E?h.6J():[h])})},5s:7(){d 4N=$A(N);c 6.1k(7(h){c!4N.1M(h)})},5g:7(U){G(d i=0;i<6.t;i++)f(6[i]==U)c i;c-1},4m:7(5h){c(5h!==Y?6:6.1Z()).4d()},1U:7(){c\'[\'+6.1C(q.1U).1N(\', \')+\']\'}});d 4h={2m:7(o){G(d 1O 2M 6){d h=6[1O];f(2i h==\'7\')49;d 1i=[1O,h];1i.1O=1O;1i.h=h;o(1i)}},7t:7(){c 6.3r(\'1O\')},4N:7(){c 6.3r(\'h\')},7u:7(2N){c $H(2N).36($H(6),7(4Q,1i){4Q[1i.1O]=1i.h;c 4Q})},7w:7(){c 6.1C(7(1i){c 1i.1C(4n).1N(\'=\')}).1N(\'&\')},1U:7(){c\'#<4h:{\'+6.1C(7(1i){c 1i.1C(q.1U).1N(\': \')}).1N(\', \')+\'}>\'}};7 $H(U){d 2N=q.u({},U||{});q.u(2N,1p);q.u(2N,4h);c 2N};3L=1b.17();q.u(3L.v,1p);q.u(3L.v,{1I:7(22,2x,2H){6.22=22;6.2x=2x;6.2H=2H},2m:7(o){d h=6.22;2q{o(h);h=h.5j()}1H(6.1M(h))},1M:7(h){f(h<6.22)c Y;f(6.2H)c h<6.2x;c h<=6.2x}});d $R=7(22,2x,2H){c z 3L(22,2x,2H)};d M={4w:7(){c 6s.6j(7(){c z 5C()},7(){c z 5n(\'7y.6d\')},7(){c z 5n(\'7z.6d\')})||Y},4s:0};M.2W={3b:[],2m:7(o){6.3b.2m(o)},69:7(4F){f(!6.1M(4F))6.3b.W(4F)},7A:7(5t){6.3b=6.3b.5s(5t)},3y:7(1a,26,E,2Z){6.V(7(3o){f(3o[1a]&&2i 3o[1a]==\'7\'){1j{3o[1a].2n(3o,[26,E,2Z])}1s(e){}}})}};q.u(M.2W,1p);M.2W.69({5G:7(){M.4s++},1B:7(){M.4s--}});M.44=7(){};M.44.v={4a:7(m){6.m={1F:\'4j\',4p:11,5H:\'5E/x-86-Q-7C\',28:\'\'};q.u(6.m,m||{})},3l:7(){c 6.E.32==1v||6.E.32==0||(6.E.32>=84&&6.E.32<7E)},7G:7(){c!6.3l()}};M.3t=1b.17();M.3t.5L=[\'7H\',\'80\',\'7I\',\'7J\',\'4t\'];M.3t.v=q.u(z M.44(),{1I:7(1l,m){6.E=M.4w();6.4a(m);6.26(1l)},26:7(1l){d 28=6.m.28||\'\';f(28.t>0)28+=\'&7K=\';1j{6.1l=1l;f(6.m.1F==\'7L\'&&28.t>0)6.1l+=(6.1l.I(/\\?/)?\'&\':\'?\')+28;M.2W.3y(\'5G\',6,6.E);6.E.7N(6.m.1F,6.1l,6.m.4p);f(6.m.4p){6.E.5T=6.5J.1d(6);2Y((7(){6.4r(1)}).1d(6),10)}6.5A();d 1c=6.m.5V?6.m.5V:28;6.E.7O(6.m.1F==\'4j\'?1c:1L)}1s(e){6.3p(e)}},5A:7(){d 1P=[\'X-7P-7Q\',\'5C\',\'X-T-4l\',T.4l,\'7R\',\'1Y/7m, 1Y/2e, 5E/5F, 1Y/5F, */*\'];f(6.m.1F==\'4j\'){1P.W(\'5Q-2g\',6.m.5H);f(6.E.7S)1P.W(\'7T\',\'7U\')}f(6.m.1P)1P.W.2n(1P,6.m.1P);G(d i=0;i<1P.t;i+=2)6.E.7V(1P[i],1P[i+1])},5J:7(){d 2F=6.E.2F;f(2F!=1)6.4r(6.E.2F)},4A:7(B){1j{c 6.E.7W(B)}1s(e){}},5M:7(){1j{c 4q(\'(\'+6.4A(\'X-7X\')+\')\')}1s(e){}},5R:7(){1j{c 4q(6.E.3F)}1s(e){6.3p(e)}},4r:7(2F){d C=M.3t.5L[2F];d E=6.E,2Z=6.5M();f(C==\'4t\'){1j{(6.m[\'2I\'+6.E.32]||6.m[\'2I\'+(6.3l()?\'81\':\'82\')]||T.2v)(E,2Z)}1s(e){6.3p(e)}f((6.4A(\'5Q-2g\')||\'\').I(/^1Y\\/7m/i))6.5R()}1j{(6.m[\'2I\'+C]||T.2v)(E,2Z);M.2W.3y(\'2I\'+C,6,E,2Z)}1s(e){6.3p(e)}f(C==\'4t\')6.E.5T=T.2v},3p:7(57){(6.m.5W||T.2v)(6,57);M.2W.3y(\'5W\',6,57)}});M.4C=1b.17();q.u(q.u(M.4C.v,M.3t.v),{1I:7(1w,1l,m){6.4x={3m:1w.3m?$(1w.3m):$(1w),3z:1w.3z?$(1w.3z):(1w.3m?1L:$(1w))};6.E=M.4w();6.4a(m);d 1B=6.m.1B||T.2v;6.m.1B=(7(E,U){6.5Y();1B(E,U)}).1d(6);6.26(1l)},5Y:7(){d 3A=6.3l()?6.4x.3m:6.4x.3z;d 3k=6.E.3F;f(!6.m.3q)3k=3k.2Q();f(3A){f(6.m.60){z 6.m.60(3A,3k)}1D{k.6h(3A,3k)}}f(6.3l()){f(6.1B)2Y(6.1B.1d(6),10)}}});M.61=1b.17();M.61.v=q.u(z M.44(),{1I:7(1w,1l,m){6.4a(m);6.1B=6.m.1B;6.1J=(6.m.1J||2);6.2s=(6.m.2s||1);6.4B={};6.1w=1w;6.1l=1l;6.22()},22:7(){6.m.1B=6.63.1d(6);6.2D()},7b:7(){6.4B.1B=1v;89(6.65);(6.1B||T.2v).2n(6,N)},63:7(26){f(6.m.2s){6.2s=(26.3F==6.64?6.2s*6.m.2s:1);6.64=26.3F}6.65=2Y(6.2D.1d(6),6.2s*6.1J*4z)},2D:7(){6.4B=z M.4C(6.1w,6.1l,6.m)}});7 $(){d P=[],4;G(d i=0;i<N.t;i++){4=N[i];f(2i 4==\'8c\')4=J.8d(4);P.W(k.u(4))}c P.t<2?P[0]:P};J.8f=7(1f,6a){d 6b=($(6a)||J.1c).4D(\'*\');c $A(6b).36([],7(12,4E){f(4E.1f.I(z 3O("(^|\\\\s)"+1f+"(\\\\s|$)")))12.W(k.u(4E));c 12})};f(!1W.k)d k=z q();k.u=7(4){f(!4)c;f(4X)c 4;f(!4.6e&&4.1h&&4!=1W){d 2a=k.3d,2r=k.u.2r;G(d 1G 2M 2a){d h=2a[1G];f(2i h==\'7\')4[1G]=2r.4W(h)}}4.6e=11;c 4};k.u.2r={4W:7(h){c 6[h]=6[h]||7(){c h.2n(1L,[6].3s($A(N)))}}};k.3d={4U:7(4){c $(4).l.2B!=\'3Q\'},6N:7(){G(d i=0;i<N.t;i++){d 4=$(N[i]);k[k.4U(4)?\'6f\':\'6w\'](4)}},6f:7(){G(d i=0;i<N.t;i++){d 4=$(N[i]);4.l.2B=\'3Q\'}},6w:7(){G(d i=0;i<N.t;i++){d 4=$(N[i]);4.l.2B=\'\'}},42:7(4){4=$(4);4.1X.8h(4)},6h:7(4,2e){$(4).3h=2e.2Q();2Y(7(){2e.3q()},10)},2y:7(4,2e){4=$(4);f(4.6k){4.6k=2e.2Q()}1D{d 1K=4.6R.6S();1K.56(4);4.1X.8i(1K.6T(2e.2Q()),4)}2Y(7(){2e.3q()},10)},8k:7(4){4=$(4);c 4.2k},3K:7(4){c z k.3S(4)},8l:7(4,1f){f(!(4=$(4)))c;c k.3K(4).1M(1f)},8m:7(4,1f){f(!(4=$(4)))c;c k.3K(4).7k(1f)},8n:7(4,1f){f(!(4=$(4)))c;c k.3K(4).42(1f)},8p:7(4){4=$(4);G(d i=0;i<4.2z.t;i++){d 3M=4.2z[i];f(3M.8q==3&&!/\\S/.4v(3M.6q))k.42(3M)}},8r:7(4){c $(4).3h.I(/^\\s*$/)},8s:7(4,3I){4=$(4),3I=$(3I);1H(4=4.1X)f(4==3I)c 11;c Y},6t:7(4){4=$(4);d x=4.x?4.x:4.2f,y=4.y?4.y:4.29;1W.6t(x,y)},1R:7(4,l){4=$(4);d h=4.l[l.3P()];f(!h){f(J.4J&&J.4J.6v){d 4L=J.4J.6v(4,1L);h=4L?4L.8v(l):1L}1D f(4.6x){h=4.6x[l.3P()]}}f(1W.6E&&[\'18\',\'1n\',\'3U\',\'6G\'].1M(l))f(k.1R(4,\'14\')==\'4G\')h=\'6y\';c h==\'6y\'?1L:h},8x:7(4,l){4=$(4);G(d B 2M l)4.l[B.3P()]=l[B]},8y:7(4){4=$(4);f(k.1R(4,\'2B\')!=\'3Q\')c{21:4.2p,24:4.2k};d 20=4.l;d 6B=20.4O;d 6A=20.14;20.4O=\'31\';20.14=\'2o\';20.2B=\'\';d 6C=4.6m;d 6D=4.6p;20.2B=\'3Q\';20.14=6A;20.4O=6B;c{21:6C,24:6D}},8z:7(4){4=$(4);d 4R=k.1R(4,\'14\');f(4R==\'4G\'||!4R){4.4T=11;4.l.14=\'3T\';f(1W.6E){4.l.1n=0;4.l.18=0}}},8A:7(4){4=$(4);f(4.4T){4.4T=1v;4.l.14=4.l.1n=4.l.18=4.l.6G=4.l.3U=\'\'}},8B:7(4){4=$(4);f(4.3c)c;4.3c=4.l.3V;f((k.1R(4,\'3V\')||\'4U\')!=\'31\')4.l.3V=\'31\'},8D:7(4){4=$(4);f(4.3c)c;4.l.3V=4.3c;4.3c=1v}};q.u(k,k.3d);d 4X=Y;f(!3W&&/3x|3w|3u/.4v(33.62)){d 3W={}};k.6K=7(2a){q.u(k.3d,2a||{});f(2i 3W!=\'1v\'){d 2a=k.3d,2r=k.u.2r;G(d 1G 2M 2a){d h=2a[1G];f(2i h==\'7\')3W.v[1G]=2r.4W(h)}4X=11}};k.6K();d 6M=z q();6M.2B=k.6N;1e.1g=7(3f){6.3f=3f};1e.1g.v={1I:7(4,2t){6.4=$(4);6.2t=2t.2Q();f(6.3f&&6.4.6O){1j{6.4.6O(6.3f,6.2t)}1s(e){d 1h=6.4.1h.2w();f(1h==\'4V\'||1h==\'8N\'){6.2X(6.6U())}1D{25 e}}}1D{6.1K=6.4.6R.6S();f(6.2V)6.2V();6.2X([6.1K.6T(6.2t)])}2Y(7(){2t.3q()},10)},6U:7(){d 1q=J.4Y(\'1q\');1q.3h=\'<6V><4V>\'+6.2t+\'</4V></6V>\';c $A(1q.2z[0].2z[0].2z)}};d 1g=z q();1g.6W=1b.17();1g.6W.v=q.u(z 1e.1g(\'96\'),{2V:7(){6.1K.97(6.4)},2X:7(2h){2h.V((7(2j){6.4.1X.55(2j,6.4)}).1d(6))}});1g.5m=1b.17();1g.5m.v=q.u(z 1e.1g(\'99\'),{2V:7(){6.1K.56(6.4);6.1K.74(11)},2X:7(2h){2h.4m(Y).V((7(2j){6.4.55(2j,6.4.9a)}).1d(6))}});1g.7h=1b.17();1g.7h.v=q.u(z 1e.1g(\'9d\'),{2V:7(){6.1K.56(6.4);6.1K.74(6.4)},2X:7(2h){2h.V((7(2j){6.4.75(2j)}).1d(6))}});1g.76=1b.17();1g.76.v=q.u(z 1e.1g(\'9i\'),{2V:7(){6.1K.9m(6.4)},2X:7(2h){2h.V((7(2j){6.4.1X.55(2j,6.4.9t)}).1d(6))}});k.3S=1b.17();k.3S.v={1I:7(4){6.4=$(4)},2m:7(o){6.4.1f.3j(/\\s+/).1k(7(B){c B.t>0}).2m(o)},5c:7(1f){6.4.1f=1f},7k:7(5a){f(6.1M(5a))c;6.5c(6.1Z().3s(5a).1N(\' \'))},42:7(4c){f(!6.1M(4c))c;6.5c(6.1k(7(1f){c 1f!=4c}).1N(\' \'))},2C:7(){c 6.1Z().1N(\' \')}};q.u(k.3S.v,1p);d 5I={5i:7(){G(d i=0;i<N.t;i++)$(N[i]).h=\'\'},4f:7(4){$(4).4f()},7v:7(){G(d i=0;i<N.t;i++)f($(N[i]).h==\'\')c Y;c 11},1k:7(4){$(4).1k()},5y:7(4){4=$(4);4.4f();f(4.1k)4.1k()}};d D={3a:7(Q){d 12=D.2L($(Q));d 4I=z 1E();G(d i=0;i<12.t;i++){d 4g=D.k.3a(12[i]);f(4g)4I.W(4g)}c 4I.1N(\'&\')},2L:7(Q){Q=$(Q);d 12=z 1E();G(d 1h 2M D.k.2E){d 4H=Q.4D(1h);G(d j=0;j<4H.t;j++)12.W(4H[j])}c 12},7x:7(Q,3N,B){Q=$(Q);d 3H=Q.4D(\'2u\');f(!3N&&!B)c 3H;d 4y=z 1E();G(d i=0;i<3H.t;i++){d 2u=3H[i];f((3N&&2u.2g!=3N)||(B&&2u.B!=B))49;4y.W(2u)}c 4y},7B:7(Q){d 12=D.2L(Q);G(d i=0;i<12.t;i++){d 4=12[i];4.7D();4.4o=\'11\'}},7F:7(Q){d 12=D.2L(Q);G(d i=0;i<12.t;i++){d 4=12[i];4.4o=\'\'}},5z:7(Q){c D.2L(Q).5v(7(4){c 4.2g!=\'31\'&&!4.4o&&[\'2u\',\'1k\',\'3J\'].1M(4.1h.2w())})},7M:7(Q){5I.5y(D.5z(Q))},5w:7(Q){$(Q).5w()}};D.k={3a:7(4){4=$(4);d 1F=4.1h.2w();d 1S=D.k.2E[1F](4);f(1S){d 1O=4n(1S[0]);f(1O.t==0)c;f(1S[1].5D!=1E)1S[1]=[1S[1]];c 1S[1].1C(7(h){c 1O+\'=\'+4n(h)}).1N(\'&\')}},1x:7(4){4=$(4);d 1F=4.1h.2w();d 1S=D.k.2E[1F](4);f(1S)c 1S[1]}};D.k.2E={2u:7(4){6c(4.2g.2w()){1r\'7Z\':1r\'31\':1r\'6l\':1r\'1Y\':c D.k.2E.3J(4);1r\'6g\':1r\'6i\':c D.k.2E.5O(4)}c Y},5O:7(4){f(4.83)c[4.B,4.h]},3J:7(4){c[4.B,4.h]},1k:7(4){c D.k.2E[4.2g==\'1k-6n\'?\'5S\':\'5X\'](4)},5S:7(4){d h=\'\',2b,w=4.85;f(w>=0){2b=4.m[w];h=2b.h||2b.1Y}c[4.B,h]},5X:7(4){d h=[];G(d i=0;i<4.t;i++){d 2b=4.m[i];f(2b.87)h.W(2b.h||2b.1Y)}c[4.B,h]}};d $F=D.k.1x;1e.3D=7(){};1e.3D.v={1I:7(4,1J,1a){6.1J=1J;6.4=$(4);6.1a=1a;6.2K=6.1x();6.2A()},2A:7(){5Z(6.2D.1d(6),6.1J*4z)},2D:7(){d h=6.1x();f(6.2K!=h){6.1a(6.4,h);6.2K=h}}};D.k.3C=1b.17();D.k.3C.v=q.u(z 1e.3D(),{1x:7(){c D.k.1x(6.4)}});D.3C=1b.17();D.3C.v=q.u(z 1e.3D(),{1x:7(){c D.3a(6.4)}});1e.2c=7(){};1e.2c.v={1I:7(4,1a){6.4=$(4);6.1a=1a;6.2K=6.1x();f(6.4.1h.2w()==\'Q\')6.67();1D 6.2A(6.4)},4K:7(){d h=6.1x();f(6.2K!=h){6.1a(6.4,h);6.2K=h}},67:7(){d 12=D.2L(6.4);G(d i=0;i<12.t;i++)6.2A(12[i])},2A:7(4){f(4.2g){6c(4.2g.2w()){1r\'6g\':1r\'6i\':1o.3B(4,\'8j\',6.4K.1d(6));1y;1r\'6l\':1r\'1Y\':1r\'3J\':1r\'1k-6n\':1r\'1k-8t\':1o.3B(4,\'8u\',6.4K.1d(6));1y}}}};D.k.2c=1b.17();D.k.2c.v=q.u(z 1e.2c(),{1x:7(){c D.k.1x(6.4)}});D.2c=1b.17();D.2c.v=q.u(z 1e.2c(),{1x:7(){c D.3a(6.4)}});f(!1W.1o){d 1o=z q()}q.u(1o,{8C:8,8F:9,8H:13,8I:27,8J:37,8L:38,8O:39,8T:40,8X:46,4:7(C){c C.Z||C.91},95:7(C){c(((C.6X)&&(C.6X==1))||((C.6Z)&&(C.6Z==1)))},9b:7(C){c C.9e||(C.9f+(J.3R.2G||J.1c.2G))},9g:7(C){c C.9j||(C.9k+(J.3R.2O||J.1c.2O))},7b:7(C){f(C.7d){C.7d();C.9r()}1D{C.48=Y;C.9w=11}},9A:7(C,1h){d 4=1o.4(C);1H(4.1X&&(!4.1h||(4.1h.3Y()!=1h.3Y())))4=4.1X;c 4},1T:Y,5u:7(4,B,1V,1u){f(!6.1T)6.1T=[];f(4.5f){6.1T.W([4,B,1V,1u]);4.5f(B,1V,1u)}1D f(4.4i){6.1T.W([4,B,1V,1u]);4.4i(\'2I\'+B,1V)}},66:7(){f(!1o.1T)c;G(d i=0;i<1o.1T.t;i++){1o.5N.2n(6,1o.1T[i]);1o.1T[i][0]=1L}1o.1T=Y},3B:7(4,B,1V,1u){d 4=$(4);1u=1u||Y;f(B==\'5U\'&&(33.4u.I(/3x|3w|3u/)||4.4i))B=\'5K\';6.5u(4,B,1V,1u)},5N:7(4,B,1V,1u){d 4=$(4);1u=1u||Y;f(B==\'5U\'&&(33.4u.I(/3x|3w|3u/)||4.4k))B=\'5K\';f(4.5x){4.5x(B,1V,1u)}1D f(4.4k){1j{4.4k(\'2I\'+B,1V)}1s(e){}}}});f(33.4u.I(/\\88\\b/))1o.3B(1W,\'8a\',1o.66,Y);d 2d={6o:Y,4P:7(){6.6z=1W.8e||J.3R.2G||J.1c.2G||0;6.6F=1W.8g||J.3R.2O||J.1c.2O||0},6u:7(4){d 19=0,15=0;2q{19+=4.2O||0;15+=4.2G||0;4=4.1X}1H(4);c[15,19]},35:7(4){d 19=0,15=0;2q{19+=4.29||0;15+=4.2f||0;4=4.1Q}1H(4);c[15,19]},68:7(4){d 19=0,15=0;2q{19+=4.29||0;15+=4.2f||0;4=4.1Q;f(4){p=k.1R(4,\'14\');f(p==\'3T\'||p==\'2o\')1y}}1H(4);c[15,19]},1Q:7(4){f(4.1Q)c 4.1Q;f(4==J.1c)c 4;1H((4=4.1X)&&4!=J.1c)f(k.1R(4,\'14\')!=\'4G\')c 4;c J.1c},8o:7(4,x,y){f(6.6o)c 6.6r(4,x,y);6.3g=x;6.34=y;6.1t=6.35(4);c(y>=6.1t[1]&&y<6.1t[1]+4.2k&&x>=6.1t[0]&&x<6.1t[0]+4.2p)},6r:7(4,x,y){d 4S=6.6u(4);6.3g=x+4S[0]-6.6z;6.34=y+4S[1]-6.6F;6.1t=6.35(4);c(6.34>=6.1t[1]&&6.34<6.1t[1]+4.2k&&6.3g>=6.1t[0]&&6.3g<6.1t[0]+4.2p)},8E:7(3Z,4){f(!3Z)c 0;f(3Z==\'8G\')c((6.1t[1]+4.2k)-6.34)/4.2k;f(3Z==\'8K\')c((6.1t[0]+4.2p)-6.3g)/4.2p},77:7(O,Z){O=$(O);Z=$(Z);Z.l.14=\'2o\';d 2P=6.35(O);Z.l.1n=2P[1]+\'1m\';Z.l.18=2P[0]+\'1m\';Z.l.21=O.2p+\'1m\';Z.l.24=O.2k+\'1m\'},4e:7(4M){d 19=0,15=0;d 4=4M;2q{19+=4.29||0;15+=4.2f||0;f(4.1Q==J.1c)f(k.1R(4,\'14\')==\'2o\')1y}1H(4=4.1Q);4=4M;2q{19-=4.2O||0;15-=4.2G||0}1H(4=4.1X);c[15,19]},77:7(O,Z){d m=q.u({5l:11,5r:11,5B:11,5q:11,29:0,2f:0},N[2]||{});O=$(O);d p=2d.4e(O);Z=$(Z);d 2J=[0,0];d 3v=1L;f(k.1R(Z,\'14\')==\'2o\'){3v=2d.1Q(Z);2J=2d.4e(3v)}f(3v==J.1c){2J[0]-=J.1c.2f;2J[1]-=J.1c.29}f(m.5l)Z.l.18=(p[0]-2J[0]+m.2f)+\'1m\';f(m.5r)Z.l.1n=(p[1]-2J[1]+m.29)+\'1m\';f(m.5B)Z.l.21=O.2p+\'1m\';f(m.5q)Z.l.24=O.2k+\'1m\'},8b:7(4){4=$(4);f(4.l.14==\'2o\')c;2d.4P();d 2P=2d.68(4);d 1n=2P[1];d 18=2P[0];d 21=4.6m;d 24=4.6p;4.6P=18-3X(4.l.18||0);4.6I=1n-3X(4.l.1n||0);4.5k=4.l.21;4.7f=4.l.24;4.l.14=\'2o\';4.l.1n=1n+\'1m\';4.l.18=18+\'1m\';4.l.21=21+\'1m\';4.l.24=24+\'1m\'},8w:7(4){4=$(4);f(4.l.14==\'3T\')c;2d.4P();4.l.14=\'3T\';d 1n=3X(4.l.1n||0)-(4.6I||0);d 18=3X(4.l.18||0)-(4.6P||0);4.l.1n=1n+\'1m\';4.l.18=18+\'1m\';4.l.24=4.7f;4.l.21=4.5k}};f(/3x|3w|3u/.4v(33.62)){2d.35=7(4){d 19=0,15=0;2q{19+=4.29||0;15+=4.2f||0;f(4.1Q==J.1c)f(k.1R(4,\'14\')==\'2o\')1y;4=4.1Q}1H(4);c[15,19]}};',62,600,'||||element||this|function|||||return|var||if||value|||Element|style|options||iterator||Object|||length|extend|prototype|index|||new||name|event|Form|transport||for||match|document||result|Ajax|arguments|source|results|form|||Prototype|object|each|push||false|target||true|elements||position|valueL||create|left|valueT|callback|Class|body|bind|Abstract|className|Insertion|tagName|pair|try|select|url|px|top|Event|Enumerable|div|case|catch|offset|useCapture|undefined|container|getValue|break|replacement|pattern|onComplete|map|else|Array|method|property|while|initialize|frequency|range|null|include|join|key|requestHeaders|offsetParent|getStyle|parameter|observers|inspect|observer|window|parentNode|text|toArray|els|width|start|args|height|throw|request||parameters|offsetTop|methods|opt|EventObserver|Position|html|offsetLeft|type|fragments|typeof|fragment|offsetHeight|oStringList|_each|apply|absolute|offsetWidth|do|cache|decay|content|input|emptyFunction|toLowerCase|end|replace|childNodes|registerCallback|display|toString|onTimerEvent|Serializers|readyState|scrollLeft|exclusive|on|delta|lastValue|getElements|in|hash|scrollTop|offsets|stripScripts|iterable|truncation|gsub|template|initializeRange|Responders|insertContent|setTimeout|json||hidden|status|navigator|ycomp|cumulativeOffset|inject||||serialize|responders|_overflow|Methods|collect|adjacency|xcomp|innerHTML|count|split|response|responseIsSuccess|success|Template|responder|dispatchException|evalScripts|pluck|concat|Request|KHTML|parent|Safari|Konqueror|dispatch|failure|receiver|observe|Observer|TimedObserver|ScriptFragment|responseText|script|inputs|ancestor|textarea|classNames|ObjectRange|node|typeName|RegExp|camelize|none|documentElement|ClassNames|relative|right|overflow|HTMLElement|parseFloat|toUpperCase|mode||currentlyExecuting|remove|__method|Base|memo||slice|returnValue|continue|setOptions|String|classNameToRemove|_reverse|page|focus|queryComponent|Hash|attachEvent|post|detachEvent|Version|reverse|encodeURIComponent|disabled|asynchronous|eval|respondToReadyState|activeRequestCount|Complete|appVersion|test|getTransport|containers|matchingInputs|1000|header|updater|Updater|getElementsByTagName|child|responderToAdd|static|tagElements|queryComponents|defaultView|onElementEvent|css|forElement|values|visibility|prepare|mergedHash|pos|offsetcache|_madePositioned|visible|tbody|findOrStore|_nativeExtensions|createElement|digits|trues|found|prepareReplacement|before|camelizedString|insertBefore|selectNodeContents|exception|falses|criteria|classNameToAdd|params|set|destination|last|addEventListener|indexOf|inline|clear|succ|_originalWidth|setLeft|Top|ActiveXObject|scriptTag|matchOne|setHeight|setTop|without|responderToRemove|_observeAndCache|find|reset|removeEventListener|activate|findFirstElement|setRequestHeaders|setWidth|XMLHttpRequest|constructor|application|xml|onCreate|contentType|Field|onStateChange|keydown|Events|evalJSON|stopObserving|inputSelector|img|Content|evalResponse|selectOne|onreadystatechange|keypress|postBody|onException|selectMany|updateContent|setInterval|insertion|PeriodicalUpdater|userAgent|updateComplete|lastText|timer|unloadCache|registerFormCallbacks|positionedOffset|register|parentElement|children|switch|XMLHTTP|_extended|hide|checkbox|update|radio|these|outerHTML|password|clientWidth|one|includeScrollOffsets|clientHeight|nodeValue|withinIncludingScrolloffsets|Try|scrollTo|realOffset|getComputedStyle|show|currentStyle|auto|deltaX|originalPosition|originalVisibility|originalWidth|originalHeight|opera|deltaY|bottom|array|_originalTop|flatten|addMethods|lambda|Toggle|toggle|insertAdjacentHTML|_originalLeft|PeriodicalExecuter|ownerDocument|createRange|createContextualFragment|contentFromAnonymousTable|table|Before|which|matchAll|button|extractScripts|stripTags|pairString|len|collapse|appendChild|After|clone|toQueryParams|Pattern|evaluate|stop|stringValue|preventDefault|charAt|_originalHeight|substring|Bottom|pairs|Function|add|collections|javascript|detect|findAll|entries|from|first|compact|keys|merge|present|toQueryString|getInputs|Msxml2|Microsoft|unregister|disable|urlencoded|blur|300|enable|responseIsFailure|Uninitialized|Loaded|Interactive|_|get|focusFirstElement|open|send|Requested|With|Accept|overrideMimeType|Connection|close|setRequestHeader|getResponseHeader|JSON|gi|submit|Loading|Success|Failure|checked|200|selectedIndex|www|selected|bMSIE|clearTimeout|unload|absolutize|string|getElementById|pageXOffset|getElementsByClassName|pageYOffset|removeChild|replaceChild|click|getHeight|hasClassName|addClassName|removeClassName|within|cleanWhitespace|nodeType|empty|childOf|multiple|change|getPropertyValue|relativize|setStyle|getDimensions|makePositioned|undoPositioned|makeClipping|KEY_BACKSPACE|undoClipping|overlap|KEY_TAB|vertical|KEY_RETURN|KEY_ESC|KEY_LEFT|horizontal|KEY_UP|member|tr|KEY_RIGHT|0_RC_0|Number|instanceof|shift|KEY_DOWN|bindAsEventListener|call|toColorPart|KEY_DELETE|times|finally|callee|srcElement|sub|scan|truncate|isLeftClick|beforeBegin|setStartBefore|im|afterBegin|firstChild|pointerX|unescapeHTML|beforeEnd|pageX|clientX|pointerY|parseQuery|afterEnd|pageY|clientY|RangeError|setStartAfter|all|any|grep|invoke|stopPropagation|max|nextSibling|min|partition|cancelBubble|reject|sortBy|sort|findElement|zip|pop|createTextNode|escapeHTML|strip'.split('|'),0,{})

}letters = new Array("a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z");
numbers = new Array(1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26);
colors  = new Array("FF","CC","99","66","33","00");

var endResult;

function doTest()
{
   endResult = "";

   // make up email address
   for (var k=0;k<4000;k++)
   {
      name = makeName(6);
      (k%2)?email=name+"@mac.com":email=name+"(at)mac.com";

      // validate the email address
      var pattern = /^[a-zA-Z0-9\-\._]+@[a-zA-Z0-9\-_]+(\.?[a-zA-Z0-9\-_]*)\.[a-zA-Z]{2,3}$/;

      if(pattern.test(email))
      {
         var r = email + " appears to be a valid email address.";
         addResult(r);
      }
      else
      {
         r = email + " does NOT appear to be a valid email address.";
         addResult(r);
      }
   }

   // make up ZIP codes
   for (var s=0;s<4000;s++)
   {
      var zipGood = true;
      var zip = makeNumber(4);
      (s%2)?zip=zip+"xyz":zip=zip.concat("7");

      // validate the zip code
      for (var i = 0; i < zip.length; i++) {
          var ch = zip.charAt(i);
          if (ch < "0" || ch > "9") {
              zipGood = false;
              r = zip + " contains letters.";
              addResult(r);
          }
      }
      if (zipGood && zip.length>5)
      {
         zipGood = false;
         r = zip + " is longer than five characters.";
         addResult(r);
      }
      if (zipGood)
      {
         r = zip + " appears to be a valid ZIP code.";
         addResult(r);
      }
   }
}

function makeName(n)
{
   var tmp = "";
   for (var i=0;i<n;i++)
   {
      var l = Math.floor(26*Math.random());
      tmp += letters[l];
   }
   return tmp;
}

function makeNumber(n)
{
   var tmp = "";
   for (var i=0;i<n;i++)
   {
      var l = Math.floor(9*Math.random());
      tmp = tmp.concat(l);
   }
   return tmp;
}

function addResult(r)
{
   endResult += "\n" + r;
}

doTest();
/*
 * Copyright (c) 2003-2005  Tom Wu
 * All Rights Reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS-IS" AND WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS, IMPLIED OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY
 * WARRANTY OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.
 *
 * IN NO EVENT SHALL TOM WU BE LIABLE FOR ANY SPECIAL, INCIDENTAL,
 * INDIRECT OR CONSEQUENTIAL DAMAGES OF ANY KIND, OR ANY DAMAGES WHATSOEVER
 * RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER OR NOT ADVISED OF
 * THE POSSIBILITY OF DAMAGE, AND ON ANY THEORY OF LIABILITY, ARISING OUT
 * OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 *
 * In addition, the following condition applies:
 *
 * All redistributions must retain an intact copy of this copyright notice
 * and disclaimer.
 */

// Basic JavaScript BN library - subset useful for RSA encryption.

// Bits per digit
var dbits;
var BI_DB;
var BI_DM;
var BI_DV;

var BI_FP;
var BI_FV;
var BI_F1;
var BI_F2;

// JavaScript engine analysis
var canary = 0xdeadbeefcafe;
var j_lm = ((canary&0xffffff)==0xefcafe);

// (public) Constructor
function BigInteger(a,b,c) {
  this.array = new Array();
  if(a != null)
    if("number" == typeof a) this.fromNumber(a,b,c);
    else if(b == null && "string" != typeof a) this.fromString(a,256);
    else this.fromString(a,b);
}

// return new, unset BigInteger
function nbi() { return new BigInteger(null); }

// am: Compute w_j += (x*this_i), propagate carries,
// c is initial carry, returns final carry.
// c < 3*dvalue, x < 2*dvalue, this_i < dvalue
// We need to select the fastest one that works in this environment.

// am1: use a single mult and divide to get the high bits,
// max digit bits should be 26 because
// max internal value = 2*dvalue^2-2*dvalue (< 2^53)
function am1(i,x,w,j,c,n) {
  var this_array = this.array;
  var w_array    = w.array;
  while(--n >= 0) {
    var v = x*this_array[i++]+w_array[j]+c;
    c = Math.floor(v/0x4000000);
    w_array[j++] = v&0x3ffffff;
  }
  return c;
}

// am2 avoids a big mult-and-extract completely.
// Max digit bits should be <= 30 because we do bitwise ops
// on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
function am2(i,x,w,j,c,n) {
  var this_array = this.array;
  var w_array    = w.array;
  var xl = x&0x7fff, xh = x>>15;
  while(--n >= 0) {
    var l = this_array[i]&0x7fff;
    var h = this_array[i++]>>15;
    var m = xh*l+h*xl;
    l = xl*l+((m&0x7fff)<<15)+w_array[j]+(c&0x3fffffff);
    c = (l>>>30)+(m>>>15)+xh*h+(c>>>30);
    w_array[j++] = l&0x3fffffff;
  }
  return c;
}

// Alternately, set max digit bits to 28 since some
// browsers slow down when dealing with 32-bit numbers.
function am3(i,x,w,j,c,n) {
  var this_array = this.array;
  var w_array    = w.array;

  var xl = x&0x3fff, xh = x>>14;
  while(--n >= 0) {
    var l = this_array[i]&0x3fff;
    var h = this_array[i++]>>14;
    var m = xh*l+h*xl;
    l = xl*l+((m&0x3fff)<<14)+w_array[j]+c;
    c = (l>>28)+(m>>14)+xh*h;
    w_array[j++] = l&0xfffffff;
  }
  return c;
}

// This is tailored to VMs with 2-bit tagging. It makes sure
// that all the computations stay within the 29 bits available.
function am4(i,x,w,j,c,n) {
  var this_array = this.array;
  var w_array    = w.array;

  var xl = x&0x1fff, xh = x>>13;
  while(--n >= 0) {
    var l = this_array[i]&0x1fff;
    var h = this_array[i++]>>13;
    var m = xh*l+h*xl;
    l = xl*l+((m&0x1fff)<<13)+w_array[j]+c;
    c = (l>>26)+(m>>13)+xh*h;
    w_array[j++] = l&0x3ffffff;
  }
  return c;
}

// am3/28 is best for SM, Rhino, but am4/26 is best for v8.
// Kestrel (Opera 9.5) gets its best result with am4/26.
// IE7 does 9% better with am3/28 than with am4/26.
// Firefox (SM) gets 10% faster with am3/28 than with am4/26.

setupEngine = function(fn, bits) {
  BigInteger.prototype.am = fn;
  dbits = bits;

  BI_DB = dbits;
  BI_DM = ((1<<dbits)-1);
  BI_DV = (1<<dbits);

  BI_FP = 52;
  BI_FV = Math.pow(2,BI_FP);
  BI_F1 = BI_FP-dbits;
  BI_F2 = 2*dbits-BI_FP;
}


// Digit conversions
var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
var BI_RC = new Array();
var rr,vv;
rr = "0".charCodeAt(0);
for(vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
rr = "a".charCodeAt(0);
for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
rr = "A".charCodeAt(0);
for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;

function int2char(n) { return BI_RM.charAt(n); }
function intAt(s,i) {
  var c = BI_RC[s.charCodeAt(i)];
  return (c==null)?-1:c;
}

// (protected) copy this to r
function bnpCopyTo(r) {
  var this_array = this.array;
  var r_array    = r.array;

  for(var i = this.t-1; i >= 0; --i) r_array[i] = this_array[i];
  r.t = this.t;
  r.s = this.s;
}

// (protected) set from integer value x, -DV <= x < DV
function bnpFromInt(x) {
  var this_array = this.array;
  this.t = 1;
  this.s = (x<0)?-1:0;
  if(x > 0) this_array[0] = x;
  else if(x < -1) this_array[0] = x+DV;
  else this.t = 0;
}

// return bigint initialized to value
function nbv(i) { var r = nbi(); r.fromInt(i); return r; }

// (protected) set from string and radix
function bnpFromString(s,b) {
  var this_array = this.array;
  var k;
  if(b == 16) k = 4;
  else if(b == 8) k = 3;
  else if(b == 256) k = 8; // byte array
  else if(b == 2) k = 1;
  else if(b == 32) k = 5;
  else if(b == 4) k = 2;
  else { this.fromRadix(s,b); return; }
  this.t = 0;
  this.s = 0;
  var i = s.length, mi = false, sh = 0;
  while(--i >= 0) {
    var x = (k==8)?s[i]&0xff:intAt(s,i);
    if(x < 0) {
      if(s.charAt(i) == "-") mi = true;
      continue;
    }
    mi = false;
    if(sh == 0)
      this_array[this.t++] = x;
    else if(sh+k > BI_DB) {
      this_array[this.t-1] |= (x&((1<<(BI_DB-sh))-1))<<sh;
      this_array[this.t++] = (x>>(BI_DB-sh));
    }
    else
      this_array[this.t-1] |= x<<sh;
    sh += k;
    if(sh >= BI_DB) sh -= BI_DB;
  }
  if(k == 8 && (s[0]&0x80) != 0) {
    this.s = -1;
    if(sh > 0) this_array[this.t-1] |= ((1<<(BI_DB-sh))-1)<<sh;
  }
  this.clamp();
  if(mi) BigInteger.ZERO.subTo(this,this);
}

// (protected) clamp off excess high words
function bnpClamp() {
  var this_array = this.array;
  var c = this.s&BI_DM;
  while(this.t > 0 && this_array[this.t-1] == c) --this.t;
}

// (public) return string representation in given radix
function bnToString(b) {
  var this_array = this.array;
  if(this.s < 0) return "-"+this.negate().toString(b);
  var k;
  if(b == 16) k = 4;
  else if(b == 8) k = 3;
  else if(b == 2) k = 1;
  else if(b == 32) k = 5;
  else if(b == 4) k = 2;
  else return this.toRadix(b);
  var km = (1<<k)-1, d, m = false, r = "", i = this.t;
  var p = BI_DB-(i*BI_DB)%k;
  if(i-- > 0) {
    if(p < BI_DB && (d = this_array[i]>>p) > 0) { m = true; r = int2char(d); }
    while(i >= 0) {
      if(p < k) {
        d = (this_array[i]&((1<<p)-1))<<(k-p);
        d |= this_array[--i]>>(p+=BI_DB-k);
      }
      else {
        d = (this_array[i]>>(p-=k))&km;
        if(p <= 0) { p += BI_DB; --i; }
      }
      if(d > 0) m = true;
      if(m) r += int2char(d);
    }
  }
  return m?r:"0";
}

// (public) -this
function bnNegate() { var r = nbi(); BigInteger.ZERO.subTo(this,r); return r; }

// (public) |this|
function bnAbs() { return (this.s<0)?this.negate():this; }

// (public) return + if this > a, - if this < a, 0 if equal
function bnCompareTo(a) {
  var this_array = this.array;
  var a_array = a.array;

  var r = this.s-a.s;
  if(r != 0) return r;
  var i = this.t;
  r = i-a.t;
  if(r != 0) return r;
  while(--i >= 0) if((r=this_array[i]-a_array[i]) != 0) return r;
  return 0;
}

// returns bit length of the integer x
function nbits(x) {
  var r = 1, t;
  if((t=x>>>16) != 0) { x = t; r += 16; }
  if((t=x>>8) != 0) { x = t; r += 8; }
  if((t=x>>4) != 0) { x = t; r += 4; }
  if((t=x>>2) != 0) { x = t; r += 2; }
  if((t=x>>1) != 0) { x = t; r += 1; }
  return r;
}

// (public) return the number of bits in "this"
function bnBitLength() {
  var this_array = this.array;
  if(this.t <= 0) return 0;
  return BI_DB*(this.t-1)+nbits(this_array[this.t-1]^(this.s&BI_DM));
}

// (protected) r = this << n*DB
function bnpDLShiftTo(n,r) {
  var this_array = this.array;
  var r_array = r.array;
  var i;
  for(i = this.t-1; i >= 0; --i) r_array[i+n] = this_array[i];
  for(i = n-1; i >= 0; --i) r_array[i] = 0;
  r.t = this.t+n;
  r.s = this.s;
}

// (protected) r = this >> n*DB
function bnpDRShiftTo(n,r) {
  var this_array = this.array;
  var r_array = r.array;
  for(var i = n; i < this.t; ++i) r_array[i-n] = this_array[i];
  r.t = Math.max(this.t-n,0);
  r.s = this.s;
}

// (protected) r = this << n
function bnpLShiftTo(n,r) {
  var this_array = this.array;
  var r_array = r.array;
  var bs = n%BI_DB;
  var cbs = BI_DB-bs;
  var bm = (1<<cbs)-1;
  var ds = Math.floor(n/BI_DB), c = (this.s<<bs)&BI_DM, i;
  for(i = this.t-1; i >= 0; --i) {
    r_array[i+ds+1] = (this_array[i]>>cbs)|c;
    c = (this_array[i]&bm)<<bs;
  }
  for(i = ds-1; i >= 0; --i) r_array[i] = 0;
  r_array[ds] = c;
  r.t = this.t+ds+1;
  r.s = this.s;
  r.clamp();
}

// (protected) r = this >> n
function bnpRShiftTo(n,r) {
  var this_array = this.array;
  var r_array = r.array;
  r.s = this.s;
  var ds = Math.floor(n/BI_DB);
  if(ds >= this.t) { r.t = 0; return; }
  var bs = n%BI_DB;
  var cbs = BI_DB-bs;
  var bm = (1<<bs)-1;
  r_array[0] = this_array[ds]>>bs;
  for(var i = ds+1; i < this.t; ++i) {
    r_array[i-ds-1] |= (this_array[i]&bm)<<cbs;
    r_array[i-ds] = this_array[i]>>bs;
  }
  if(bs > 0) r_array[this.t-ds-1] |= (this.s&bm)<<cbs;
  r.t = this.t-ds;
  r.clamp();
}

// (protected) r = this - a
function bnpSubTo(a,r) {
  var this_array = this.array;
  var r_array = r.array;
  var a_array = a.array;
  var i = 0, c = 0, m = Math.min(a.t,this.t);
  while(i < m) {
    c += this_array[i]-a_array[i];
    r_array[i++] = c&BI_DM;
    c >>= BI_DB;
  }
  if(a.t < this.t) {
    c -= a.s;
    while(i < this.t) {
      c += this_array[i];
      r_array[i++] = c&BI_DM;
      c >>= BI_DB;
    }
    c += this.s;
  }
  else {
    c += this.s;
    while(i < a.t) {
      c -= a_array[i];
      r_array[i++] = c&BI_DM;
      c >>= BI_DB;
    }
    c -= a.s;
  }
  r.s = (c<0)?-1:0;
  if(c < -1) r_array[i++] = BI_DV+c;
  else if(c > 0) r_array[i++] = c;
  r.t = i;
  r.clamp();
}

// (protected) r = this * a, r != this,a (HAC 14.12)
// "this" should be the larger one if appropriate.
function bnpMultiplyTo(a,r) {
  var this_array = this.array;
  var r_array = r.array;
  var x = this.abs(), y = a.abs();
  var y_array = y.array;

  var i = x.t;
  r.t = i+y.t;
  while(--i >= 0) r_array[i] = 0;
  for(i = 0; i < y.t; ++i) r_array[i+x.t] = x.am(0,y_array[i],r,i,0,x.t);
  r.s = 0;
  r.clamp();
  if(this.s != a.s) BigInteger.ZERO.subTo(r,r);
}

// (protected) r = this^2, r != this (HAC 14.16)
function bnpSquareTo(r) {
  var x = this.abs();
  var x_array = x.array;
  var r_array = r.array;

  var i = r.t = 2*x.t;
  while(--i >= 0) r_array[i] = 0;
  for(i = 0; i < x.t-1; ++i) {
    var c = x.am(i,x_array[i],r,2*i,0,1);
    if((r_array[i+x.t]+=x.am(i+1,2*x_array[i],r,2*i+1,c,x.t-i-1)) >= BI_DV) {
      r_array[i+x.t] -= BI_DV;
      r_array[i+x.t+1] = 1;
    }
  }
  if(r.t > 0) r_array[r.t-1] += x.am(i,x_array[i],r,2*i,0,1);
  r.s = 0;
  r.clamp();
}

// (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
// r != q, this != m.  q or r may be null.
function bnpDivRemTo(m,q,r) {
  var pm = m.abs();
  if(pm.t <= 0) return;
  var pt = this.abs();
  if(pt.t < pm.t) {
    if(q != null) q.fromInt(0);
    if(r != null) this.copyTo(r);
    return;
  }
  if(r == null) r = nbi();
  var y = nbi(), ts = this.s, ms = m.s;
  var pm_array = pm.array;
  var nsh = BI_DB-nbits(pm_array[pm.t-1]);	// normalize modulus
  if(nsh > 0) { pm.lShiftTo(nsh,y); pt.lShiftTo(nsh,r); }
  else { pm.copyTo(y); pt.copyTo(r); }
  var ys = y.t;

  var y_array = y.array;
  var y0 = y_array[ys-1];
  if(y0 == 0) return;
  var yt = y0*(1<<BI_F1)+((ys>1)?y_array[ys-2]>>BI_F2:0);
  var d1 = BI_FV/yt, d2 = (1<<BI_F1)/yt, e = 1<<BI_F2;
  var i = r.t, j = i-ys, t = (q==null)?nbi():q;
  y.dlShiftTo(j,t);

  var r_array = r.array;
  if(r.compareTo(t) >= 0) {
    r_array[r.t++] = 1;
    r.subTo(t,r);
  }
  BigInteger.ONE.dlShiftTo(ys,t);
  t.subTo(y,y);	// "negative" y so we can replace sub with am later
  while(y.t < ys) y_array[y.t++] = 0;
  while(--j >= 0) {
    // Estimate quotient digit
    var qd = (r_array[--i]==y0)?BI_DM:Math.floor(r_array[i]*d1+(r_array[i-1]+e)*d2);
    if((r_array[i]+=y.am(0,qd,r,j,0,ys)) < qd) {	// Try it out
      y.dlShiftTo(j,t);
      r.subTo(t,r);
      while(r_array[i] < --qd) r.subTo(t,r);
    }
  }
  if(q != null) {
    r.drShiftTo(ys,q);
    if(ts != ms) BigInteger.ZERO.subTo(q,q);
  }
  r.t = ys;
  r.clamp();
  if(nsh > 0) r.rShiftTo(nsh,r);	// Denormalize remainder
  if(ts < 0) BigInteger.ZERO.subTo(r,r);
}

// (public) this mod a
function bnMod(a) {
  var r = nbi();
  this.abs().divRemTo(a,null,r);
  if(this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r,r);
  return r;
}

// Modular reduction using "classic" algorithm
function Classic(m) { this.m = m; }
function cConvert(x) {
  if(x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
  else return x;
}
function cRevert(x) { return x; }
function cReduce(x) { x.divRemTo(this.m,null,x); }
function cMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
function cSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

Classic.prototype.convert = cConvert;
Classic.prototype.revert = cRevert;
Classic.prototype.reduce = cReduce;
Classic.prototype.mulTo = cMulTo;
Classic.prototype.sqrTo = cSqrTo;

// (protected) return "-1/this % 2^DB"; useful for Mont. reduction
// justification:
//         xy == 1 (mod m)
//         xy =  1+km
//   xy(2-xy) = (1+km)(1-km)
// x[y(2-xy)] = 1-k^2m^2
// x[y(2-xy)] == 1 (mod m^2)
// if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
// should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
// JS multiply "overflows" differently from C/C++, so care is needed here.
function bnpInvDigit() {
  var this_array = this.array;
  if(this.t < 1) return 0;
  var x = this_array[0];
  if((x&1) == 0) return 0;
  var y = x&3;		// y == 1/x mod 2^2
  y = (y*(2-(x&0xf)*y))&0xf;	// y == 1/x mod 2^4
  y = (y*(2-(x&0xff)*y))&0xff;	// y == 1/x mod 2^8
  y = (y*(2-(((x&0xffff)*y)&0xffff)))&0xffff;	// y == 1/x mod 2^16
  // last step - calculate inverse mod DV directly;
  // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
  y = (y*(2-x*y%BI_DV))%BI_DV;		// y == 1/x mod 2^dbits
  // we really want the negative inverse, and -DV < y < DV
  return (y>0)?BI_DV-y:-y;
}

// Montgomery reduction
function Montgomery(m) {
  this.m = m;
  this.mp = m.invDigit();
  this.mpl = this.mp&0x7fff;
  this.mph = this.mp>>15;
  this.um = (1<<(BI_DB-15))-1;
  this.mt2 = 2*m.t;
}

// xR mod m
function montConvert(x) {
  var r = nbi();
  x.abs().dlShiftTo(this.m.t,r);
  r.divRemTo(this.m,null,r);
  if(x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r,r);
  return r;
}

// x/R mod m
function montRevert(x) {
  var r = nbi();
  x.copyTo(r);
  this.reduce(r);
  return r;
}

// x = x/R mod m (HAC 14.32)
function montReduce(x) {
  var x_array = x.array;
  while(x.t <= this.mt2)	// pad x so am has enough room later
    x_array[x.t++] = 0;
  for(var i = 0; i < this.m.t; ++i) {
    // faster way of calculating u0 = x[i]*mp mod DV
    var j = x_array[i]&0x7fff;
    var u0 = (j*this.mpl+(((j*this.mph+(x_array[i]>>15)*this.mpl)&this.um)<<15))&BI_DM;
    // use am to combine the multiply-shift-add into one call
    j = i+this.m.t;
    x_array[j] += this.m.am(0,u0,x,i,0,this.m.t);
    // propagate carry
    while(x_array[j] >= BI_DV) { x_array[j] -= BI_DV; x_array[++j]++; }
  }
  x.clamp();
  x.drShiftTo(this.m.t,x);
  if(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
}

// r = "x^2/R mod m"; x != r
function montSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

// r = "xy/R mod m"; x,y != r
function montMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }

Montgomery.prototype.convert = montConvert;
Montgomery.prototype.revert = montRevert;
Montgomery.prototype.reduce = montReduce;
Montgomery.prototype.mulTo = montMulTo;
Montgomery.prototype.sqrTo = montSqrTo;

// (protected) true iff this is even
function bnpIsEven() {
  var this_array = this.array;
  return ((this.t>0)?(this_array[0]&1):this.s) == 0;
}

// (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
function bnpExp(e,z) {
  if(e > 0xffffffff || e < 1) return BigInteger.ONE;
  var r = nbi(), r2 = nbi(), g = z.convert(this), i = nbits(e)-1;
  g.copyTo(r);
  while(--i >= 0) {
    z.sqrTo(r,r2);
    if((e&(1<<i)) > 0) z.mulTo(r2,g,r);
    else { var t = r; r = r2; r2 = t; }
  }
  return z.revert(r);
}

// (public) this^e % m, 0 <= e < 2^32
function bnModPowInt(e,m) {
  var z;
  if(e < 256 || m.isEven()) z = new Classic(m); else z = new Montgomery(m);
  return this.exp(e,z);
}

// protected
BigInteger.prototype.copyTo = bnpCopyTo;
BigInteger.prototype.fromInt = bnpFromInt;
BigInteger.prototype.fromString = bnpFromString;
BigInteger.prototype.clamp = bnpClamp;
BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
BigInteger.prototype.drShiftTo = bnpDRShiftTo;
BigInteger.prototype.lShiftTo = bnpLShiftTo;
BigInteger.prototype.rShiftTo = bnpRShiftTo;
BigInteger.prototype.subTo = bnpSubTo;
BigInteger.prototype.multiplyTo = bnpMultiplyTo;
BigInteger.prototype.squareTo = bnpSquareTo;
BigInteger.prototype.divRemTo = bnpDivRemTo;
BigInteger.prototype.invDigit = bnpInvDigit;
BigInteger.prototype.isEven = bnpIsEven;
BigInteger.prototype.exp = bnpExp;

// public
BigInteger.prototype.toString = bnToString;
BigInteger.prototype.negate = bnNegate;
BigInteger.prototype.abs = bnAbs;
BigInteger.prototype.compareTo = bnCompareTo;
BigInteger.prototype.bitLength = bnBitLength;
BigInteger.prototype.mod = bnMod;
BigInteger.prototype.modPowInt = bnModPowInt;

// "constants"
BigInteger.ZERO = nbv(0);
BigInteger.ONE = nbv(1);
// Copyright (c) 2005  Tom Wu
// All Rights Reserved.
// See "LICENSE" for details.

// Extended JavaScript BN functions, required for RSA private ops.

// (public)
function bnClone() { var r = nbi(); this.copyTo(r); return r; }

// (public) return value as integer
function bnIntValue() {
  var this_array = this.array;
  if(this.s < 0) {
    if(this.t == 1) return this_array[0]-BI_DV;
    else if(this.t == 0) return -1;
  }
  else if(this.t == 1) return this_array[0];
  else if(this.t == 0) return 0;
  // assumes 16 < DB < 32
  return ((this_array[1]&((1<<(32-BI_DB))-1))<<BI_DB)|this_array[0];
}

// (public) return value as byte
function bnByteValue() {
  var this_array = this.array;
  return (this.t==0)?this.s:(this_array[0]<<24)>>24;
}

// (public) return value as short (assumes DB>=16)
function bnShortValue() {
  var this_array = this.array;
  return (this.t==0)?this.s:(this_array[0]<<16)>>16;
}

// (protected) return x s.t. r^x < DV
function bnpChunkSize(r) { return Math.floor(Math.LN2*BI_DB/Math.log(r)); }

// (public) 0 if this == 0, 1 if this > 0
function bnSigNum() {
  var this_array = this.array;
  if(this.s < 0) return -1;
  else if(this.t <= 0 || (this.t == 1 && this_array[0] <= 0)) return 0;
  else return 1;
}

// (protected) convert to radix string
function bnpToRadix(b) {
  if(b == null) b = 10;
  if(this.signum() == 0 || b < 2 || b > 36) return "0";
  var cs = this.chunkSize(b);
  var a = Math.pow(b,cs);
  var d = nbv(a), y = nbi(), z = nbi(), r = "";
  this.divRemTo(d,y,z);
  while(y.signum() > 0) {
    r = (a+z.intValue()).toString(b).substr(1) + r;
    y.divRemTo(d,y,z);
  }
  return z.intValue().toString(b) + r;
}

// (protected) convert from radix string
function bnpFromRadix(s,b) {
  this.fromInt(0);
  if(b == null) b = 10;
  var cs = this.chunkSize(b);
  var d = Math.pow(b,cs), mi = false, j = 0, w = 0;
  for(var i = 0; i < s.length; ++i) {
    var x = intAt(s,i);
    if(x < 0) {
      if(s.charAt(i) == "-" && this.signum() == 0) mi = true;
      continue;
    }
    w = b*w+x;
    if(++j >= cs) {
      this.dMultiply(d);
      this.dAddOffset(w,0);
      j = 0;
      w = 0;
    }
  }
  if(j > 0) {
    this.dMultiply(Math.pow(b,j));
    this.dAddOffset(w,0);
  }
  if(mi) BigInteger.ZERO.subTo(this,this);
}

// (protected) alternate constructor
function bnpFromNumber(a,b,c) {
  if("number" == typeof b) {
    // new BigInteger(int,int,RNG)
    if(a < 2) this.fromInt(1);
    else {
      this.fromNumber(a,c);
      if(!this.testBit(a-1))	// force MSB set
        this.bitwiseTo(BigInteger.ONE.shiftLeft(a-1),op_or,this);
      if(this.isEven()) this.dAddOffset(1,0); // force odd
      while(!this.isProbablePrime(b)) {
        this.dAddOffset(2,0);
        if(this.bitLength() > a) this.subTo(BigInteger.ONE.shiftLeft(a-1),this);
      }
    }
  }
  else {
    // new BigInteger(int,RNG)
    var x = new Array(), t = a&7;
    x.length = (a>>3)+1;
    b.nextBytes(x);
    if(t > 0) x[0] &= ((1<<t)-1); else x[0] = 0;
    this.fromString(x,256);
  }
}

// (public) convert to bigendian byte array
function bnToByteArray() {
  var this_array = this.array;
  var i = this.t, r = new Array();
  r[0] = this.s;
  var p = BI_DB-(i*BI_DB)%8, d, k = 0;
  if(i-- > 0) {
    if(p < BI_DB && (d = this_array[i]>>p) != (this.s&BI_DM)>>p)
      r[k++] = d|(this.s<<(BI_DB-p));
    while(i >= 0) {
      if(p < 8) {
        d = (this_array[i]&((1<<p)-1))<<(8-p);
        d |= this_array[--i]>>(p+=BI_DB-8);
      }
      else {
        d = (this_array[i]>>(p-=8))&0xff;
        if(p <= 0) { p += BI_DB; --i; }
      }
      if((d&0x80) != 0) d |= -256;
      if(k == 0 && (this.s&0x80) != (d&0x80)) ++k;
      if(k > 0 || d != this.s) r[k++] = d;
    }
  }
  return r;
}

function bnEquals(a) { return(this.compareTo(a)==0); }
function bnMin(a) { return(this.compareTo(a)<0)?this:a; }
function bnMax(a) { return(this.compareTo(a)>0)?this:a; }

// (protected) r = this op a (bitwise)
function bnpBitwiseTo(a,op,r) {
  var this_array = this.array;
  var a_array    = a.array;
  var r_array    = r.array;
  var i, f, m = Math.min(a.t,this.t);
  for(i = 0; i < m; ++i) r_array[i] = op(this_array[i],a_array[i]);
  if(a.t < this.t) {
    f = a.s&BI_DM;
    for(i = m; i < this.t; ++i) r_array[i] = op(this_array[i],f);
    r.t = this.t;
  }
  else {
    f = this.s&BI_DM;
    for(i = m; i < a.t; ++i) r_array[i] = op(f,a_array[i]);
    r.t = a.t;
  }
  r.s = op(this.s,a.s);
  r.clamp();
}

// (public) this & a
function op_and(x,y) { return x&y; }
function bnAnd(a) { var r = nbi(); this.bitwiseTo(a,op_and,r); return r; }

// (public) this | a
function op_or(x,y) { return x|y; }
function bnOr(a) { var r = nbi(); this.bitwiseTo(a,op_or,r); return r; }

// (public) this ^ a
function op_xor(x,y) { return x^y; }
function bnXor(a) { var r = nbi(); this.bitwiseTo(a,op_xor,r); return r; }

// (public) this & ~a
function op_andnot(x,y) { return x&~y; }
function bnAndNot(a) { var r = nbi(); this.bitwiseTo(a,op_andnot,r); return r; }

// (public) ~this
function bnNot() {
  var this_array = this.array;
  var r = nbi();
  var r_array = r.array;

  for(var i = 0; i < this.t; ++i) r_array[i] = BI_DM&~this_array[i];
  r.t = this.t;
  r.s = ~this.s;
  return r;
}

// (public) this << n
function bnShiftLeft(n) {
  var r = nbi();
  if(n < 0) this.rShiftTo(-n,r); else this.lShiftTo(n,r);
  return r;
}

// (public) this >> n
function bnShiftRight(n) {
  var r = nbi();
  if(n < 0) this.lShiftTo(-n,r); else this.rShiftTo(n,r);
  return r;
}

// return index of lowest 1-bit in x, x < 2^31
function lbit(x) {
  if(x == 0) return -1;
  var r = 0;
  if((x&0xffff) == 0) { x >>= 16; r += 16; }
  if((x&0xff) == 0) { x >>= 8; r += 8; }
  if((x&0xf) == 0) { x >>= 4; r += 4; }
  if((x&3) == 0) { x >>= 2; r += 2; }
  if((x&1) == 0) ++r;
  return r;
}

// (public) returns index of lowest 1-bit (or -1 if none)
function bnGetLowestSetBit() {
  var this_array = this.array;
  for(var i = 0; i < this.t; ++i)
    if(this_array[i] != 0) return i*BI_DB+lbit(this_array[i]);
  if(this.s < 0) return this.t*BI_DB;
  return -1;
}

// return number of 1 bits in x
function cbit(x) {
  var r = 0;
  while(x != 0) { x &= x-1; ++r; }
  return r;
}

// (public) return number of set bits
function bnBitCount() {
  var r = 0, x = this.s&BI_DM;
  for(var i = 0; i < this.t; ++i) r += cbit(this_array[i]^x);
  return r;
}

// (public) true iff nth bit is set
function bnTestBit(n) {
  var this_array = this.array;
  var j = Math.floor(n/BI_DB);
  if(j >= this.t) return(this.s!=0);
  return((this_array[j]&(1<<(n%BI_DB)))!=0);
}

// (protected) this op (1<<n)
function bnpChangeBit(n,op) {
  var r = BigInteger.ONE.shiftLeft(n);
  this.bitwiseTo(r,op,r);
  return r;
}

// (public) this | (1<<n)
function bnSetBit(n) { return this.changeBit(n,op_or); }

// (public) this & ~(1<<n)
function bnClearBit(n) { return this.changeBit(n,op_andnot); }

// (public) this ^ (1<<n)
function bnFlipBit(n) { return this.changeBit(n,op_xor); }

// (protected) r = this + a
function bnpAddTo(a,r) {
  var this_array = this.array;
  var a_array = a.array;
  var r_array = r.array;
  var i = 0, c = 0, m = Math.min(a.t,this.t);
  while(i < m) {
    c += this_array[i]+a_array[i];
    r_array[i++] = c&BI_DM;
    c >>= BI_DB;
  }
  if(a.t < this.t) {
    c += a.s;
    while(i < this.t) {
      c += this_array[i];
      r_array[i++] = c&BI_DM;
      c >>= BI_DB;
    }
    c += this.s;
  }
  else {
    c += this.s;
    while(i < a.t) {
      c += a_array[i];
      r_array[i++] = c&BI_DM;
      c >>= BI_DB;
    }
    c += a.s;
  }
  r.s = (c<0)?-1:0;
  if(c > 0) r_array[i++] = c;
  else if(c < -1) r_array[i++] = BI_DV+c;
  r.t = i;
  r.clamp();
}

// (public) this + a
function bnAdd(a) { var r = nbi(); this.addTo(a,r); return r; }

// (public) this - a
function bnSubtract(a) { var r = nbi(); this.subTo(a,r); return r; }

// (public) this * a
function bnMultiply(a) { var r = nbi(); this.multiplyTo(a,r); return r; }

// (public) this / a
function bnDivide(a) { var r = nbi(); this.divRemTo(a,r,null); return r; }

// (public) this % a
function bnRemainder(a) { var r = nbi(); this.divRemTo(a,null,r); return r; }

// (public) [this/a,this%a]
function bnDivideAndRemainder(a) {
  var q = nbi(), r = nbi();
  this.divRemTo(a,q,r);
  return new Array(q,r);
}

// (protected) this *= n, this >= 0, 1 < n < DV
function bnpDMultiply(n) {
  var this_array = this.array;
  this_array[this.t] = this.am(0,n-1,this,0,0,this.t);
  ++this.t;
  this.clamp();
}

// (protected) this += n << w words, this >= 0
function bnpDAddOffset(n,w) {
  var this_array = this.array;
  while(this.t <= w) this_array[this.t++] = 0;
  this_array[w] += n;
  while(this_array[w] >= BI_DV) {
    this_array[w] -= BI_DV;
    if(++w >= this.t) this_array[this.t++] = 0;
    ++this_array[w];
  }
}

// A "null" reducer
function NullExp() {}
function nNop(x) { return x; }
function nMulTo(x,y,r) { x.multiplyTo(y,r); }
function nSqrTo(x,r) { x.squareTo(r); }

NullExp.prototype.convert = nNop;
NullExp.prototype.revert = nNop;
NullExp.prototype.mulTo = nMulTo;
NullExp.prototype.sqrTo = nSqrTo;

// (public) this^e
function bnPow(e) { return this.exp(e,new NullExp()); }

// (protected) r = lower n words of "this * a", a.t <= n
// "this" should be the larger one if appropriate.
function bnpMultiplyLowerTo(a,n,r) {
  var r_array = r.array;
  var a_array = a.array;
  var i = Math.min(this.t+a.t,n);
  r.s = 0; // assumes a,this >= 0
  r.t = i;
  while(i > 0) r_array[--i] = 0;
  var j;
  for(j = r.t-this.t; i < j; ++i) r_array[i+this.t] = this.am(0,a_array[i],r,i,0,this.t);
  for(j = Math.min(a.t,n); i < j; ++i) this.am(0,a_array[i],r,i,0,n-i);
  r.clamp();
}

// (protected) r = "this * a" without lower n words, n > 0
// "this" should be the larger one if appropriate.
function bnpMultiplyUpperTo(a,n,r) {
  var r_array = r.array;
  var a_array = a.array;
  --n;
  var i = r.t = this.t+a.t-n;
  r.s = 0; // assumes a,this >= 0
  while(--i >= 0) r_array[i] = 0;
  for(i = Math.max(n-this.t,0); i < a.t; ++i)
    r_array[this.t+i-n] = this.am(n-i,a_array[i],r,0,0,this.t+i-n);
  r.clamp();
  r.drShiftTo(1,r);
}

// Barrett modular reduction
function Barrett(m) {
  // setup Barrett
  this.r2 = nbi();
  this.q3 = nbi();
  BigInteger.ONE.dlShiftTo(2*m.t,this.r2);
  this.mu = this.r2.divide(m);
  this.m = m;
}

function barrettConvert(x) {
  if(x.s < 0 || x.t > 2*this.m.t) return x.mod(this.m);
  else if(x.compareTo(this.m) < 0) return x;
  else { var r = nbi(); x.copyTo(r); this.reduce(r); return r; }
}

function barrettRevert(x) { return x; }

// x = x mod m (HAC 14.42)
function barrettReduce(x) {
  x.drShiftTo(this.m.t-1,this.r2);
  if(x.t > this.m.t+1) { x.t = this.m.t+1; x.clamp(); }
  this.mu.multiplyUpperTo(this.r2,this.m.t+1,this.q3);
  this.m.multiplyLowerTo(this.q3,this.m.t+1,this.r2);
  while(x.compareTo(this.r2) < 0) x.dAddOffset(1,this.m.t+1);
  x.subTo(this.r2,x);
  while(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
}

// r = x^2 mod m; x != r
function barrettSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

// r = x*y mod m; x,y != r
function barrettMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }

Barrett.prototype.convert = barrettConvert;
Barrett.prototype.revert = barrettRevert;
Barrett.prototype.reduce = barrettReduce;
Barrett.prototype.mulTo = barrettMulTo;
Barrett.prototype.sqrTo = barrettSqrTo;

// (public) this^e % m (HAC 14.85)
function bnModPow(e,m) {
  var e_array = e.array;
  var i = e.bitLength(), k, r = nbv(1), z;
  if(i <= 0) return r;
  else if(i < 18) k = 1;
  else if(i < 48) k = 3;
  else if(i < 144) k = 4;
  else if(i < 768) k = 5;
  else k = 6;
  if(i < 8)
    z = new Classic(m);
  else if(m.isEven())
    z = new Barrett(m);
  else
    z = new Montgomery(m);

  // precomputation
  var g = new Array(), n = 3, k1 = k-1, km = (1<<k)-1;
  g[1] = z.convert(this);
  if(k > 1) {
    var g2 = nbi();
    z.sqrTo(g[1],g2);
    while(n <= km) {
      g[n] = nbi();
      z.mulTo(g2,g[n-2],g[n]);
      n += 2;
    }
  }

  var j = e.t-1, w, is1 = true, r2 = nbi(), t;
  i = nbits(e_array[j])-1;
  while(j >= 0) {
    if(i >= k1) w = (e_array[j]>>(i-k1))&km;
    else {
      w = (e_array[j]&((1<<(i+1))-1))<<(k1-i);
      if(j > 0) w |= e_array[j-1]>>(BI_DB+i-k1);
    }

    n = k;
    while((w&1) == 0) { w >>= 1; --n; }
    if((i -= n) < 0) { i += BI_DB; --j; }
    if(is1) {	// ret == 1, don't bother squaring or multiplying it
      g[w].copyTo(r);
      is1 = false;
    }
    else {
      while(n > 1) { z.sqrTo(r,r2); z.sqrTo(r2,r); n -= 2; }
      if(n > 0) z.sqrTo(r,r2); else { t = r; r = r2; r2 = t; }
      z.mulTo(r2,g[w],r);
    }

    while(j >= 0 && (e_array[j]&(1<<i)) == 0) {
      z.sqrTo(r,r2); t = r; r = r2; r2 = t;
      if(--i < 0) { i = BI_DB-1; --j; }
    }
  }
  return z.revert(r);
}

// (public) gcd(this,a) (HAC 14.54)
function bnGCD(a) {
  var x = (this.s<0)?this.negate():this.clone();
  var y = (a.s<0)?a.negate():a.clone();
  if(x.compareTo(y) < 0) { var t = x; x = y; y = t; }
  var i = x.getLowestSetBit(), g = y.getLowestSetBit();
  if(g < 0) return x;
  if(i < g) g = i;
  if(g > 0) {
    x.rShiftTo(g,x);
    y.rShiftTo(g,y);
  }
  while(x.signum() > 0) {
    if((i = x.getLowestSetBit()) > 0) x.rShiftTo(i,x);
    if((i = y.getLowestSetBit()) > 0) y.rShiftTo(i,y);
    if(x.compareTo(y) >= 0) {
      x.subTo(y,x);
      x.rShiftTo(1,x);
    }
    else {
      y.subTo(x,y);
      y.rShiftTo(1,y);
    }
  }
  if(g > 0) y.lShiftTo(g,y);
  return y;
}

// (protected) this % n, n < 2^26
function bnpModInt(n) {
  var this_array = this.array;
  if(n <= 0) return 0;
  var d = BI_DV%n, r = (this.s<0)?n-1:0;
  if(this.t > 0)
    if(d == 0) r = this_array[0]%n;
    else for(var i = this.t-1; i >= 0; --i) r = (d*r+this_array[i])%n;
  return r;
}

// (public) 1/this % m (HAC 14.61)
function bnModInverse(m) {
  var ac = m.isEven();
  if((this.isEven() && ac) || m.signum() == 0) return BigInteger.ZERO;
  var u = m.clone(), v = this.clone();
  var a = nbv(1), b = nbv(0), c = nbv(0), d = nbv(1);
  while(u.signum() != 0) {
    while(u.isEven()) {
      u.rShiftTo(1,u);
      if(ac) {
        if(!a.isEven() || !b.isEven()) { a.addTo(this,a); b.subTo(m,b); }
        a.rShiftTo(1,a);
      }
      else if(!b.isEven()) b.subTo(m,b);
      b.rShiftTo(1,b);
    }
    while(v.isEven()) {
      v.rShiftTo(1,v);
      if(ac) {
        if(!c.isEven() || !d.isEven()) { c.addTo(this,c); d.subTo(m,d); }
        c.rShiftTo(1,c);
      }
      else if(!d.isEven()) d.subTo(m,d);
      d.rShiftTo(1,d);
    }
    if(u.compareTo(v) >= 0) {
      u.subTo(v,u);
      if(ac) a.subTo(c,a);
      b.subTo(d,b);
    }
    else {
      v.subTo(u,v);
      if(ac) c.subTo(a,c);
      d.subTo(b,d);
    }
  }
  if(v.compareTo(BigInteger.ONE) != 0) return BigInteger.ZERO;
  if(d.compareTo(m) >= 0) return d.subtract(m);
  if(d.signum() < 0) d.addTo(m,d); else return d;
  if(d.signum() < 0) return d.add(m); else return d;
}

var lowprimes = [2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71,73,79,83,89,97,101,103,107,109,113,127,131,137,139,149,151,157,163,167,173,179,181,191,193,197,199,211,223,227,229,233,239,241,251,257,263,269,271,277,281,283,293,307,311,313,317,331,337,347,349,353,359,367,373,379,383,389,397,401,409,419,421,431,433,439,443,449,457,461,463,467,479,487,491,499,503,509];
var lplim = (1<<26)/lowprimes[lowprimes.length-1];

// (public) test primality with certainty >= 1-.5^t
function bnIsProbablePrime(t) {
  var i, x = this.abs();
  var x_array = x.array;
  if(x.t == 1 && x_array[0] <= lowprimes[lowprimes.length-1]) {
    for(i = 0; i < lowprimes.length; ++i)
      if(x_array[0] == lowprimes[i]) return true;
    return false;
  }
  if(x.isEven()) return false;
  i = 1;
  while(i < lowprimes.length) {
    var m = lowprimes[i], j = i+1;
    while(j < lowprimes.length && m < lplim) m *= lowprimes[j++];
    m = x.modInt(m);
    while(i < j) if(m%lowprimes[i++] == 0) return false;
  }
  return x.millerRabin(t);
}

// (protected) true if probably prime (HAC 4.24, Miller-Rabin)
function bnpMillerRabin(t) {
  var n1 = this.subtract(BigInteger.ONE);
  var k = n1.getLowestSetBit();
  if(k <= 0) return false;
  var r = n1.shiftRight(k);
  t = (t+1)>>1;
  if(t > lowprimes.length) t = lowprimes.length;
  var a = nbi();
  for(var i = 0; i < t; ++i) {
    a.fromInt(lowprimes[i]);
    var y = a.modPow(r,this);
    if(y.compareTo(BigInteger.ONE) != 0 && y.compareTo(n1) != 0) {
      var j = 1;
      while(j++ < k && y.compareTo(n1) != 0) {
        y = y.modPowInt(2,this);
        if(y.compareTo(BigInteger.ONE) == 0) return false;
      }
      if(y.compareTo(n1) != 0) return false;
    }
  }
  return true;
}

// protected
BigInteger.prototype.chunkSize = bnpChunkSize;
BigInteger.prototype.toRadix = bnpToRadix;
BigInteger.prototype.fromRadix = bnpFromRadix;
BigInteger.prototype.fromNumber = bnpFromNumber;
BigInteger.prototype.bitwiseTo = bnpBitwiseTo;
BigInteger.prototype.changeBit = bnpChangeBit;
BigInteger.prototype.addTo = bnpAddTo;
BigInteger.prototype.dMultiply = bnpDMultiply;
BigInteger.prototype.dAddOffset = bnpDAddOffset;
BigInteger.prototype.multiplyLowerTo = bnpMultiplyLowerTo;
BigInteger.prototype.multiplyUpperTo = bnpMultiplyUpperTo;
BigInteger.prototype.modInt = bnpModInt;
BigInteger.prototype.millerRabin = bnpMillerRabin;

// public
BigInteger.prototype.clone = bnClone;
BigInteger.prototype.intValue = bnIntValue;
BigInteger.prototype.byteValue = bnByteValue;
BigInteger.prototype.shortValue = bnShortValue;
BigInteger.prototype.signum = bnSigNum;
BigInteger.prototype.toByteArray = bnToByteArray;
BigInteger.prototype.equals = bnEquals;
BigInteger.prototype.min = bnMin;
BigInteger.prototype.max = bnMax;
BigInteger.prototype.and = bnAnd;
BigInteger.prototype.or = bnOr;
BigInteger.prototype.xor = bnXor;
BigInteger.prototype.andNot = bnAndNot;
BigInteger.prototype.not = bnNot;
BigInteger.prototype.shiftLeft = bnShiftLeft;
BigInteger.prototype.shiftRight = bnShiftRight;
BigInteger.prototype.getLowestSetBit = bnGetLowestSetBit;
BigInteger.prototype.bitCount = bnBitCount;
BigInteger.prototype.testBit = bnTestBit;
BigInteger.prototype.setBit = bnSetBit;
BigInteger.prototype.clearBit = bnClearBit;
BigInteger.prototype.flipBit = bnFlipBit;
BigInteger.prototype.add = bnAdd;
BigInteger.prototype.subtract = bnSubtract;
BigInteger.prototype.multiply = bnMultiply;
BigInteger.prototype.divide = bnDivide;
BigInteger.prototype.remainder = bnRemainder;
BigInteger.prototype.divideAndRemainder = bnDivideAndRemainder;
BigInteger.prototype.modPow = bnModPow;
BigInteger.prototype.modInverse = bnModInverse;
BigInteger.prototype.pow = bnPow;
BigInteger.prototype.gcd = bnGCD;
BigInteger.prototype.isProbablePrime = bnIsProbablePrime;

// BigInteger interfaces not implemented in jsbn:

// BigInteger(int signum, byte[] magnitude)
// double doubleValue()
// float floatValue()
// int hashCode()
// long longValue()
// static BigInteger valueOf(long val)
// prng4.js - uses Arcfour as a PRNG

function Arcfour() {
  this.i = 0;
  this.j = 0;
  this.S = new Array();
}

// Initialize arcfour context from key, an array of ints, each from [0..255]
function ARC4init(key) {
  var i, j, t;
  for(i = 0; i < 256; ++i)
    this.S[i] = i;
  j = 0;
  for(i = 0; i < 256; ++i) {
    j = (j + this.S[i] + key[i % key.length]) & 255;
    t = this.S[i];
    this.S[i] = this.S[j];
    this.S[j] = t;
  }
  this.i = 0;
  this.j = 0;
}

function ARC4next() {
  var t;
  this.i = (this.i + 1) & 255;
  this.j = (this.j + this.S[this.i]) & 255;
  t = this.S[this.i];
  this.S[this.i] = this.S[this.j];
  this.S[this.j] = t;
  return this.S[(t + this.S[this.i]) & 255];
}

Arcfour.prototype.init = ARC4init;
Arcfour.prototype.next = ARC4next;

// Plug in your RNG constructor here
function prng_newstate() {
  return new Arcfour();
}

// Pool size must be a multiple of 4 and greater than 32.
// An array of bytes the size of the pool will be passed to init()
var rng_psize = 256;
// Random number generator - requires a PRNG backend, e.g. prng4.js

// For best results, put code like
// <body onClick='rng_seed_time();' onKeyPress='rng_seed_time();'>
// in your main HTML document.

var rng_state;
var rng_pool;
var rng_pptr;

// Mix in a 32-bit integer into the pool
function rng_seed_int(x) {
  rng_pool[rng_pptr++] ^= x & 255;
  rng_pool[rng_pptr++] ^= (x >> 8) & 255;
  rng_pool[rng_pptr++] ^= (x >> 16) & 255;
  rng_pool[rng_pptr++] ^= (x >> 24) & 255;
  if(rng_pptr >= rng_psize) rng_pptr -= rng_psize;
}

// Mix in the current time (w/milliseconds) into the pool
function rng_seed_time() {
  rng_seed_int(new Date().getTime());
}

// Initialize the pool with junk if needed.
if(rng_pool == null) {
  rng_pool = new Array();
  rng_pptr = 0;
  var t;
  while(rng_pptr < rng_psize) {  // extract some randomness from Math.random()
    t = Math.floor(65536 * Math.random());
    rng_pool[rng_pptr++] = t >>> 8;
    rng_pool[rng_pptr++] = t & 255;
  }
  rng_pptr = 0;
  rng_seed_time();
  //rng_seed_int(window.screenX);
  //rng_seed_int(window.screenY);
}

function rng_get_byte() {
  if(rng_state == null) {
    rng_seed_time();
    rng_state = prng_newstate();
    rng_state.init(rng_pool);
    for(rng_pptr = 0; rng_pptr < rng_pool.length; ++rng_pptr)
      rng_pool[rng_pptr] = 0;
    rng_pptr = 0;
    //rng_pool = null;
  }
  // TODO: allow reseeding after first request
  return rng_state.next();
}

function rng_get_bytes(ba) {
  var i;
  for(i = 0; i < ba.length; ++i) ba[i] = rng_get_byte();
}

function SecureRandom() {}

SecureRandom.prototype.nextBytes = rng_get_bytes;
// Depends on jsbn.js and rng.js

// convert a (hex) string to a bignum object
function parseBigInt(str,r) {
  return new BigInteger(str,r);
}

function linebrk(s,n) {
  var ret = "";
  var i = 0;
  while(i + n < s.length) {
    ret += s.substring(i,i+n) + "\n";
    i += n;
  }
  return ret + s.substring(i,s.length);
}

function byte2Hex(b) {
  if(b < 0x10)
    return "0" + b.toString(16);
  else
    return b.toString(16);
}

// PKCS#1 (type 2, random) pad input string s to n bytes, and return a bigint
function pkcs1pad2(s,n) {
  if(n < s.length + 11) {
    alert("Message too long for RSA");
    return null;
  }
  var ba = new Array();
  var i = s.length - 1;
  while(i >= 0 && n > 0) ba[--n] = s.charCodeAt(i--);
  ba[--n] = 0;
  var rng = new SecureRandom();
  var x = new Array();
  while(n > 2) { // random non-zero pad
    x[0] = 0;
    while(x[0] == 0) rng.nextBytes(x);
    ba[--n] = x[0];
  }
  ba[--n] = 2;
  ba[--n] = 0;
  return new BigInteger(ba);
}

// "empty" RSA key constructor
function RSAKey() {
  this.n = null;
  this.e = 0;
  this.d = null;
  this.p = null;
  this.q = null;
  this.dmp1 = null;
  this.dmq1 = null;
  this.coeff = null;
}

// Set the public key fields N and e from hex strings
function RSASetPublic(N,E) {
  if(N != null && E != null && N.length > 0 && E.length > 0) {
    this.n = parseBigInt(N,16);
    this.e = parseInt(E,16);
  }
  else
    alert("Invalid RSA public key");
}

// Perform raw public operation on "x": return x^e (mod n)
function RSADoPublic(x) {
  return x.modPowInt(this.e, this.n);
}

// Return the PKCS#1 RSA encryption of "text" as an even-length hex string
function RSAEncrypt(text) {
  var m = pkcs1pad2(text,(this.n.bitLength()+7)>>3);
  if(m == null) return null;
  var c = this.doPublic(m);
  if(c == null) return null;
  var h = c.toString(16);
  if((h.length & 1) == 0) return h; else return "0" + h;
}

// Return the PKCS#1 RSA encryption of "text" as a Base64-encoded string
//function RSAEncryptB64(text) {
//  var h = this.encrypt(text);
//  if(h) return hex2b64(h); else return null;
//}

// protected
RSAKey.prototype.doPublic = RSADoPublic;

// public
RSAKey.prototype.setPublic = RSASetPublic;
RSAKey.prototype.encrypt = RSAEncrypt;
//RSAKey.prototype.encrypt_b64 = RSAEncryptB64;
// Depends on rsa.js and jsbn2.js

// Undo PKCS#1 (type 2, random) padding and, if valid, return the plaintext
function pkcs1unpad2(d,n) {
  var b = d.toByteArray();
  var i = 0;
  while(i < b.length && b[i] == 0) ++i;
  if(b.length-i != n-1 || b[i] != 2)
    return null;
  ++i;
  while(b[i] != 0)
    if(++i >= b.length) return null;
  var ret = "";
  while(++i < b.length)
    ret += String.fromCharCode(b[i]);
  return ret;
}

// Set the private key fields N, e, and d from hex strings
function RSASetPrivate(N,E,D) {
  if(N != null && E != null && N.length > 0 && E.length > 0) {
    this.n = parseBigInt(N,16);
    this.e = parseInt(E,16);
    this.d = parseBigInt(D,16);
  }
  else
    alert("Invalid RSA private key");
}

// Set the private key fields N, e, d and CRT params from hex strings
function RSASetPrivateEx(N,E,D,P,Q,DP,DQ,C) {
  if(N != null && E != null && N.length > 0 && E.length > 0) {
    this.n = parseBigInt(N,16);
    this.e = parseInt(E,16);
    this.d = parseBigInt(D,16);
    this.p = parseBigInt(P,16);
    this.q = parseBigInt(Q,16);
    this.dmp1 = parseBigInt(DP,16);
    this.dmq1 = parseBigInt(DQ,16);
    this.coeff = parseBigInt(C,16);
  }
  else
    alert("Invalid RSA private key");
}

// Generate a new random private key B bits long, using public expt E
function RSAGenerate(B,E) {
  var rng = new SecureRandom();
  var qs = B>>1;
  this.e = parseInt(E,16);
  var ee = new BigInteger(E,16);
  for(;;) {
    for(;;) {
      this.p = new BigInteger(B-qs,1,rng);
      if(this.p.subtract(BigInteger.ONE).gcd(ee).compareTo(BigInteger.ONE) == 0 && this.p.isProbablePrime(10)) break;
    }
    for(;;) {
      this.q = new BigInteger(qs,1,rng);
      if(this.q.subtract(BigInteger.ONE).gcd(ee).compareTo(BigInteger.ONE) == 0 && this.q.isProbablePrime(10)) break;
    }
    if(this.p.compareTo(this.q) <= 0) {
      var t = this.p;
      this.p = this.q;
      this.q = t;
    }
    var p1 = this.p.subtract(BigInteger.ONE);
    var q1 = this.q.subtract(BigInteger.ONE);
    var phi = p1.multiply(q1);
    if(phi.gcd(ee).compareTo(BigInteger.ONE) == 0) {
      this.n = this.p.multiply(this.q);
      this.d = ee.modInverse(phi);
      this.dmp1 = this.d.mod(p1);
      this.dmq1 = this.d.mod(q1);
      this.coeff = this.q.modInverse(this.p);
      break;
    }
  }
}

// Perform raw private operation on "x": return x^d (mod n)
function RSADoPrivate(x) {
  if(this.p == null || this.q == null)
    return x.modPow(this.d, this.n);

  // TODO: re-calculate any missing CRT params
  var xp = x.mod(this.p).modPow(this.dmp1, this.p);
  var xq = x.mod(this.q).modPow(this.dmq1, this.q);

  while(xp.compareTo(xq) < 0)
    xp = xp.add(this.p);
  return xp.subtract(xq).multiply(this.coeff).mod(this.p).multiply(this.q).add(xq);
}

// Return the PKCS#1 RSA decryption of "ctext".
// "ctext" is an even-length hex string and the output is a plain string.
function RSADecrypt(ctext) {
  var c = parseBigInt(ctext, 16);
  var m = this.doPrivate(c);
  if(m == null) return null;
  return pkcs1unpad2(m, (this.n.bitLength()+7)>>3);
}

// Return the PKCS#1 RSA decryption of "ctext".
// "ctext" is a Base64-encoded string and the output is a plain string.
//function RSAB64Decrypt(ctext) {
//  var h = b64tohex(ctext);
//  if(h) return this.decrypt(h); else return null;
//}

// protected
RSAKey.prototype.doPrivate = RSADoPrivate;

// public
RSAKey.prototype.setPrivate = RSASetPrivate;
RSAKey.prototype.setPrivateEx = RSASetPrivateEx;
RSAKey.prototype.generate = RSAGenerate;
RSAKey.prototype.decrypt = RSADecrypt;
//RSAKey.prototype.b64_decrypt = RSAB64Decrypt;


nValue="a5261939975948bb7a58dffe5ff54e65f0498f9175f5a09288810b8975871e99af3b5dd94057b0fc07535f5f97444504fa35169d461d0d30cf0192e307727c065168c788771c561a9400fb49175e9e6aa4e23fe11af69e9412dd23b0cb6684c4c2429bce139e848ab26d0829073351f4acd36074eafd036a5eb83359d2a698d3";
eValue="10001";
dValue="8e9912f6d3645894e8d38cb58c0db81ff516cf4c7e5a14c7f1eddb1459d2cded4d8d293fc97aee6aefb861859c8b6a3d1dfe710463e1f9ddc72048c09751971c4a580aa51eb523357a3cc48d31cfad1d4a165066ed92d4748fb6571211da5cb14bc11b6e2df7c1a559e6d5ac1cd5c94703a22891464fba23d0d965086277a161";
pValue="d090ce58a92c75233a6486cb0a9209bf3583b64f540c76f5294bb97d285eed33aec220bde14b2417951178ac152ceab6da7090905b478195498b352048f15e7d";
qValue="cab575dc652bb66df15a0359609d51d1db184750c00c6698b90ef3465c99655103edbf0d54c56aec0ce3c4d22592338092a126a0cc49f65a4a30d222b411e58f";
dmp1Value="1a24bca8e273df2f0e47c199bbf678604e7df7215480c77c8db39f49b000ce2cf7500038acfff5433b7d582a01f1826e6f4d42e1c57f5e1fef7b12aabc59fd25";
dmq1Value="3d06982efbbe47339e1f6d36b1216b8a741d410b0c662f54f7118b27b9a4ec9d914337eb39841d8666f3034408cf94f5b62f11c402fc994fe15a05493150d9fd";
coeffValue="3a3e731acd8960b7ff9eb81a7ff93bd1cfa74cbd56987db58b4594fb09c09084db1734c8143f98b602b981aaa9243ca28deb69b5b280ee8dcee0fd2625e53250";

setupEngine(am3, 28);

var RSA = new RSAKey();
var TEXT = "The quick brown fox jumped over the extremely lazy frogs!";

RSA.setPublic(nValue, eValue);
RSA.setPrivateEx(nValue, eValue, dValue, pValue, qValue, dmp1Value, dmq1Value, coeffValue);

function encrypt() {
  return RSA.encrypt(TEXT);
}

function decrypt() {
  return RSA.decrypt(TEXT);
}

for (var i = 0; i < 8; ++i) {
  encrypt();
  decrypt();
}
// Copyright 2008 Google Inc. All Rights Reserved.
// Copyright 1996 John Maloney and Mario Wolczko.

// This program is free software; you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation; either version 2 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program; if not, write to the Free Software
// Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA


// This implementation of the DeltaBlue benchmark is derived 
// from the Smalltalk implementation by John Maloney and Mario 
// Wolczko. Some parts have been translated directly, whereas 
// others have been modified more aggresively to make it feel 
// more like a JavaScript program.

/**
 * A JavaScript implementation of the DeltaBlue constrain-solving
 * algorithm, as described in:
 *
 * "The DeltaBlue Algorithm: An Incremental Constraint Hierarchy Solver"
 *   Bjorn N. Freeman-Benson and John Maloney
 *   January 1990 Communications of the ACM,
 *   also available as University of Washington TR 89-08-06.
 *
 * Beware: this benchmark is written in a grotesque style where
 * the constraint model is built by side-effects from constructors.
 * I've kept it this way to avoid deviating too much from the original
 * implementation.
 */


/* --- O b j e c t   M o d e l --- */

Object.prototype.inherits = function (shuper) {
  function Inheriter() { }
  Inheriter.prototype = shuper.prototype;
  this.prototype = new Inheriter();
  this.superConstructor = shuper;
}

function OrderedCollection() {
  this.elms = new Array();
}

OrderedCollection.prototype.add = function (elm) {
  this.elms.push(elm);
}

OrderedCollection.prototype.at = function (index) {
  return this.elms[index];
}

OrderedCollection.prototype.size = function () {
  return this.elms.length;
}

OrderedCollection.prototype.removeFirst = function () {
  return this.elms.pop();
}

OrderedCollection.prototype.remove = function (elm) {
  var index = 0, skipped = 0;
  for (var i = 0; i < this.elms.length; i++) {
    var value = this.elms[i];
    if (value != elm) {
      this.elms[index] = value;
      index++;
    } else {
      skipped++;
    }
  }
  for (var i = 0; i < skipped; i++)
    this.elms.pop();
}

/* --- *
 * S t r e n g t h
 * --- */

/**
 * Strengths are used to measure the relative importance of constraints.
 * New strengths may be inserted in the strength hierarchy without
 * disrupting current constraints.  Strengths cannot be created outside
 * this class, so pointer comparison can be used for value comparison.
 */
function Strength(strengthValue, name) {
  this.strengthValue = strengthValue;
  this.name = name;
}

Strength.stronger = function (s1, s2) {
  return s1.strengthValue < s2.strengthValue;
}

Strength.weaker = function (s1, s2) {
  return s1.strengthValue > s2.strengthValue;
}

Strength.weakestOf = function (s1, s2) {
  return this.weaker(s1, s2) ? s1 : s2;
}

Strength.strongest = function (s1, s2) {
  return this.stronger(s1, s2) ? s1 : s2;
}

Strength.prototype.nextWeaker = function () {
  switch (this.strengthValue) {
    case 0: return Strength.WEAKEST;
    case 1: return Strength.WEAK_DEFAULT;
    case 2: return Strength.NORMAL;
    case 3: return Strength.STRONG_DEFAULT;
    case 4: return Strength.PREFERRED;
    case 5: return Strength.REQUIRED;
  }
}

// Strength constants.
Strength.REQUIRED        = new Strength(0, "required");
Strength.STONG_PREFERRED = new Strength(1, "strongPreferred");
Strength.PREFERRED       = new Strength(2, "preferred");
Strength.STRONG_DEFAULT  = new Strength(3, "strongDefault");
Strength.NORMAL          = new Strength(4, "normal");
Strength.WEAK_DEFAULT    = new Strength(5, "weakDefault");
Strength.WEAKEST         = new Strength(6, "weakest");

/* --- *
 * C o n s t r a i n t
 * --- */

/**
 * An abstract class representing a system-maintainable relationship
 * (or "constraint") between a set of variables. A constraint supplies
 * a strength instance variable; concrete subclasses provide a means
 * of storing the constrained variables and other information required
 * to represent a constraint.
 */
function Constraint(strength) {
  this.strength = strength;
}

/**
 * Activate this constraint and attempt to satisfy it.
 */
Constraint.prototype.addConstraint = function () {
  this.addToGraph();
  planner.incrementalAdd(this);
}

/**
 * Attempt to find a way to enforce this constraint. If successful,
 * record the solution, perhaps modifying the current dataflow
 * graph. Answer the constraint that this constraint overrides, if
 * there is one, or nil, if there isn't.
 * Assume: I am not already satisfied.
 */
Constraint.prototype.satisfy = function (mark) {
  this.chooseMethod(mark);
  if (!this.isSatisfied()) {
    if (this.strength == Strength.REQUIRED)
      alert("Could not satisfy a required constraint!");
    return null;
  }
  this.markInputs(mark);
  var out = this.output();
  var overridden = out.determinedBy;
  if (overridden != null) overridden.markUnsatisfied();
  out.determinedBy = this;
  if (!planner.addPropagate(this, mark))
    alert("Cycle encountered");
  out.mark = mark;
  return overridden;
}

Constraint.prototype.destroyConstraint = function () {
  if (this.isSatisfied()) planner.incrementalRemove(this);
  else this.removeFromGraph();
}

/**
 * Normal constraints are not input constraints.  An input constraint
 * is one that depends on external state, such as the mouse, the
 * keybord, a clock, or some arbitraty piece of imperative code.
 */
Constraint.prototype.isInput = function () {
  return false;
}

/* --- *
 * U n a r y   C o n s t r a i n t
 * --- */

/**
 * Abstract superclass for constraints having a single possible output
 * variable.
 */
function UnaryConstraint(v, strength) {
  UnaryConstraint.superConstructor.call(this, strength);
  this.myOutput = v;
  this.satisfied = false;
  this.addConstraint();
}

UnaryConstraint.inherits(Constraint);

/**
 * Adds this constraint to the constraint graph
 */
UnaryConstraint.prototype.addToGraph = function () {
  this.myOutput.addConstraint(this);
  this.satisfied = false;
}

/**
 * Decides if this constraint can be satisfied and records that
 * decision.
 */
UnaryConstraint.prototype.chooseMethod = function (mark) {
  this.satisfied = (this.myOutput.mark != mark)
    && Strength.stronger(this.strength, this.myOutput.walkStrength);
}

/**
 * Returns true if this constraint is satisfied in the current solution.
 */
UnaryConstraint.prototype.isSatisfied = function () {
  return this.satisfied;
}

UnaryConstraint.prototype.markInputs = function (mark) {
  // has no inputs
}

/**
 * Returns the current output variable.
 */
UnaryConstraint.prototype.output = function () {
  return this.myOutput;
}

/**
 * Calculate the walkabout strength, the stay flag, and, if it is
 * 'stay', the value for the current output of this constraint. Assume
 * this constraint is satisfied.
 */
UnaryConstraint.prototype.recalculate = function () {
  this.myOutput.walkStrength = this.strength;
  this.myOutput.stay = !this.isInput();
  if (this.myOutput.stay) this.execute(); // Stay optimization
}

/**
 * Records that this constraint is unsatisfied
 */
UnaryConstraint.prototype.markUnsatisfied = function () {
  this.satisfied = false;
}

UnaryConstraint.prototype.inputsKnown = function () {
  return true;
}

UnaryConstraint.prototype.removeFromGraph = function () {
  if (this.myOutput != null) this.myOutput.removeConstraint(this);
  this.satisfied = false;
}

/* --- *
 * S t a y   C o n s t r a i n t
 * --- */

/**
 * Variables that should, with some level of preference, stay the same.
 * Planners may exploit the fact that instances, if satisfied, will not
 * change their output during plan execution.  This is called "stay
 * optimization".
 */
function StayConstraint(v, str) {
  StayConstraint.superConstructor.call(this, v, str);
}

StayConstraint.inherits(UnaryConstraint);

StayConstraint.prototype.execute = function () {
  // Stay constraints do nothing
}

/* --- *
 * E d i t   C o n s t r a i n t
 * --- */

/**
 * A unary input constraint used to mark a variable that the client
 * wishes to change.
 */
function EditConstraint(v, str) {
  EditConstraint.superConstructor.call(this, v, str);
}

EditConstraint.inherits(UnaryConstraint);

/**
 * Edits indicate that a variable is to be changed by imperative code.
 */
EditConstraint.prototype.isInput = function () {
  return true;
}

EditConstraint.prototype.execute = function () {
  // Edit constraints do nothing
}

/* --- *
 * B i n a r y   C o n s t r a i n t
 * --- */

var Direction = new Object();
Direction.NONE     = 0;
Direction.FORWARD  = 1;
Direction.BACKWARD = -1;

/**
 * Abstract superclass for constraints having two possible output
 * variables.
 */
function BinaryConstraint(var1, var2, strength) {
  BinaryConstraint.superConstructor.call(this, strength);
  this.v1 = var1;
  this.v2 = var2;
  this.direction = Direction.NONE;
  this.addConstraint();
}

BinaryConstraint.inherits(Constraint);

/**
 * Decides if this constratint can be satisfied and which way it
 * should flow based on the relative strength of the variables related,
 * and record that decision.
 */
BinaryConstraint.prototype.chooseMethod = function (mark) {
  if (this.v1.mark == mark) {
    this.direction = (this.v1.mark != mark && Strength.stronger(this.strength, this.v2.walkStrength))
      ? Direction.FORWARD
      : Direction.NONE;
  }
  if (this.v2.mark == mark) {
    this.direction = (this.v1.mark != mark && Strength.stronger(this.strength, this.v1.walkStrength))
      ? Direction.BACKWARD
      : Direction.NONE;
  }
  if (Strength.weaker(this.v1.walkStrength, this.v2.walkStrength)) {
    this.direction = Strength.stronger(this.strength, this.v1.walkStrength)
      ? Direction.BACKWARD
      : Direction.NONE;
  } else {
    this.direction = Strength.stronger(this.strength, this.v2.walkStrength)
      ? Direction.FORWARD
      : Direction.BACKWARD
  }
}

/**
 * Add this constraint to the constraint graph
 */
BinaryConstraint.prototype.addToGraph = function () {
  this.v1.addConstraint(this);
  this.v2.addConstraint(this);
  this.direction = Direction.NONE;
}

/**
 * Answer true if this constraint is satisfied in the current solution.
 */
BinaryConstraint.prototype.isSatisfied = function () {
  return this.direction != Direction.NONE;
}

/**
 * Mark the input variable with the given mark.
 */
BinaryConstraint.prototype.markInputs = function (mark) {
  this.input().mark = mark;
}

/**
 * Returns the current input variable
 */
BinaryConstraint.prototype.input = function () {
  return (this.direction == Direction.FORWARD) ? this.v1 : this.v2;
}

/**
 * Returns the current output variable
 */
BinaryConstraint.prototype.output = function () {
  return (this.direction == Direction.FORWARD) ? this.v2 : this.v1;
}

/**
 * Calculate the walkabout strength, the stay flag, and, if it is
 * 'stay', the value for the current output of this
 * constraint. Assume this constraint is satisfied.
 */
BinaryConstraint.prototype.recalculate = function () {
  var ihn = this.input(), out = this.output();
  out.walkStrength = Strength.weakestOf(this.strength, ihn.walkStrength);
  out.stay = ihn.stay;
  if (out.stay) this.execute();
}

/**
 * Record the fact that this constraint is unsatisfied.
 */
BinaryConstraint.prototype.markUnsatisfied = function () {
  this.direction = Direction.NONE;
}

BinaryConstraint.prototype.inputsKnown = function (mark) {
  var i = this.input();
  return i.mark == mark || i.stay || i.determinedBy == null;
}

BinaryConstraint.prototype.removeFromGraph = function () {
  if (this.v1 != null) this.v1.removeConstraint(this);
  if (this.v2 != null) this.v2.removeConstraint(this);
  this.direction = Direction.NONE;
}

/* --- *
 * S c a l e   C o n s t r a i n t
 * --- */

/**
 * Relates two variables by the linear scaling relationship: "v2 =
 * (v1 * scale) + offset". Either v1 or v2 may be changed to maintain
 * this relationship but the scale factor and offset are considered
 * read-only.
 */
function ScaleConstraint(src, scale, offset, dest, strength) {
  this.direction = Direction.NONE;
  this.scale = scale;
  this.offset = offset;
  ScaleConstraint.superConstructor.call(this, src, dest, strength);
}

ScaleConstraint.inherits(BinaryConstraint);

/**
 * Adds this constraint to the constraint graph.
 */
ScaleConstraint.prototype.addToGraph = function () {
  ScaleConstraint.superConstructor.prototype.addToGraph.call(this);
  this.scale.addConstraint(this);
  this.offset.addConstraint(this);
}

ScaleConstraint.prototype.removeFromGraph = function () {
  ScaleConstraint.superConstructor.prototype.removeFromGraph.call(this);
  if (this.scale != null) this.scale.removeConstraint(this);
  if (this.offset != null) this.offset.removeConstraint(this);
}

ScaleConstraint.prototype.markInputs = function (mark) {
  ScaleConstraint.superConstructor.prototype.markInputs.call(this, mark);
  this.scale.mark = this.offset.mark = mark;
}

/**
 * Enforce this constraint. Assume that it is satisfied.
 */
ScaleConstraint.prototype.execute = function () {
  if (this.direction == Direction.FORWARD) {
    this.v2.value = this.v1.value * this.scale.value + this.offset.value;
  } else {
    this.v1.value = (this.v2.value - this.offset.value) / this.scale.value;
  }
}

/**
 * Calculate the walkabout strength, the stay flag, and, if it is
 * 'stay', the value for the current output of this constraint. Assume
 * this constraint is satisfied.
 */
ScaleConstraint.prototype.recalculate = function () {
  var ihn = this.input(), out = this.output();
  out.walkStrength = Strength.weakestOf(this.strength, ihn.walkStrength);
  out.stay = ihn.stay && this.scale.stay && this.offset.stay;
  if (out.stay) this.execute();
}

/* --- *
 * E q u a l i t  y   C o n s t r a i n t
 * --- */

/**
 * Constrains two variables to have the same value.
 */
function EqualityConstraint(var1, var2, strength) {
  EqualityConstraint.superConstructor.call(this, var1, var2, strength);
}

EqualityConstraint.inherits(BinaryConstraint);

/**
 * Enforce this constraint. Assume that it is satisfied.
 */
EqualityConstraint.prototype.execute = function () {
  this.output().value = this.input().value;
}

/* --- *
 * V a r i a b l e
 * --- */

/**
 * A constrained variable. In addition to its value, it maintain the
 * structure of the constraint graph, the current dataflow graph, and
 * various parameters of interest to the DeltaBlue incremental
 * constraint solver.
 **/
function Variable(name, initialValue) {
  this.value = initialValue || 0;
  this.constraints = new OrderedCollection();
  this.determinedBy = null;
  this.mark = 0;
  this.walkStrength = Strength.WEAKEST;
  this.stay = true;
  this.name = name;
}

/**
 * Add the given constraint to the set of all constraints that refer
 * this variable.
 */
Variable.prototype.addConstraint = function (c) {
  this.constraints.add(c);
}

/**
 * Removes all traces of c from this variable.
 */
Variable.prototype.removeConstraint = function (c) {
  this.constraints.remove(c);
  if (this.determinedBy == c) this.determinedBy = null;
}

/* --- *
 * P l a n n e r
 * --- */

/**
 * The DeltaBlue planner
 */
function Planner() {
  this.currentMark = 0;
}

/**
 * Attempt to satisfy the given constraint and, if successful,
 * incrementally update the dataflow graph.  Details: If satifying
 * the constraint is successful, it may override a weaker constraint
 * on its output. The algorithm attempts to resatisfy that
 * constraint using some other method. This process is repeated
 * until either a) it reaches a variable that was not previously
 * determined by any constraint or b) it reaches a constraint that
 * is too weak to be satisfied using any of its methods. The
 * variables of constraints that have been processed are marked with
 * a unique mark value so that we know where we've been. This allows
 * the algorithm to avoid getting into an infinite loop even if the
 * constraint graph has an inadvertent cycle.
 */
Planner.prototype.incrementalAdd = function (c) {
  var mark = this.newMark();
  var overridden = c.satisfy(mark);
  while (overridden != null)
    overridden = overridden.satisfy(mark);
}

/**
 * Entry point for retracting a constraint. Remove the given
 * constraint and incrementally update the dataflow graph.
 * Details: Retracting the given constraint may allow some currently
 * unsatisfiable downstream constraint to be satisfied. We therefore collect
 * a list of unsatisfied downstream constraints and attempt to
 * satisfy each one in turn. This list is traversed by constraint
 * strength, strongest first, as a heuristic for avoiding
 * unnecessarily adding and then overriding weak constraints.
 * Assume: c is satisfied.
 */
Planner.prototype.incrementalRemove = function (c) {
  var out = c.output();
  c.markUnsatisfied();
  c.removeFromGraph();
  var unsatisfied = this.removePropagateFrom(out);
  var strength = Strength.REQUIRED;
  do {
    for (var i = 0; i < unsatisfied.size(); i++) {
      var u = unsatisfied.at(i);
      if (u.strength == strength)
        this.incrementalAdd(u);
    }
    strength = strength.nextWeaker();
  } while (strength != Strength.WEAKEST);
}

/**
 * Select a previously unused mark value.
 */
Planner.prototype.newMark = function () {
  return ++this.currentMark;
}

/**
 * Extract a plan for resatisfaction starting from the given source
 * constraints, usually a set of input constraints. This method
 * assumes that stay optimization is desired; the plan will contain
 * only constraints whose output variables are not stay. Constraints
 * that do no computation, such as stay and edit constraints, are
 * not included in the plan.
 * Details: The outputs of a constraint are marked when it is added
 * to the plan under construction. A constraint may be appended to
 * the plan when all its input variables are known. A variable is
 * known if either a) the variable is marked (indicating that has
 * been computed by a constraint appearing earlier in the plan), b)
 * the variable is 'stay' (i.e. it is a constant at plan execution
 * time), or c) the variable is not determined by any
 * constraint. The last provision is for past states of history
 * variables, which are not stay but which are also not computed by
 * any constraint.
 * Assume: sources are all satisfied.
 */
Planner.prototype.makePlan = function (sources) {
  var mark = this.newMark();
  var plan = new Plan();
  var todo = sources;
  while (todo.size() > 0) {
    var c = todo.removeFirst();
    if (c.output().mark != mark && c.inputsKnown(mark)) {
      plan.addConstraint(c);
      c.output().mark = mark;
      this.addConstraintsConsumingTo(c.output(), todo);
    }
  }
  return plan;
}

/**
 * Extract a plan for resatisfying starting from the output of the
 * given constraints, usually a set of input constraints.
 */
Planner.prototype.extractPlanFromConstraints = function (constraints) {
  var sources = new OrderedCollection();
  for (var i = 0; i < constraints.size(); i++) {
    var c = constraints.at(i);
    if (c.isInput() && c.isSatisfied())
      // not in plan already and eligible for inclusion
      sources.add(c);
  }
  return this.makePlan(sources);
}

/**
 * Recompute the walkabout strengths and stay flags of all variables
 * downstream of the given constraint and recompute the actual
 * values of all variables whose stay flag is true. If a cycle is
 * detected, remove the given constraint and answer
 * false. Otherwise, answer true.
 * Details: Cycles are detected when a marked variable is
 * encountered downstream of the given constraint. The sender is
 * assumed to have marked the inputs of the given constraint with
 * the given mark. Thus, encountering a marked node downstream of
 * the output constraint means that there is a path from the
 * constraint's output to one of its inputs.
 */
Planner.prototype.addPropagate = function (c, mark) {
  var todo = new OrderedCollection();
  todo.add(c);
  while (todo.size() > 0) {
    var d = todo.removeFirst();
    if (d.output().mark == mark) {
      this.incrementalRemove(c);
      return false;
    }
    d.recalculate();
    this.addConstraintsConsumingTo(d.output(), todo);
  }
  return true;
}


/**
 * Update the walkabout strengths and stay flags of all variables
 * downstream of the given constraint. Answer a collection of
 * unsatisfied constraints sorted in order of decreasing strength.
 */
Planner.prototype.removePropagateFrom = function (out) {
  out.determinedBy = null;
  out.walkStrength = Strength.WEAKEST;
  out.stay = true;
  var unsatisfied = new OrderedCollection();
  var todo = new OrderedCollection();
  todo.add(out);
  while (todo.size() > 0) {
    var v = todo.removeFirst();
    for (var i = 0; i < v.constraints.size(); i++) {
      var c = v.constraints.at(i);
      if (!c.isSatisfied())
        unsatisfied.add(c);
    }
    var determining = v.determinedBy;
    for (var i = 0; i < v.constraints.size(); i++) {
      var next = v.constraints.at(i);
      if (next != determining && next.isSatisfied()) {
        next.recalculate();
        todo.add(next.output());
      }
    }
  }
  return unsatisfied;
}

Planner.prototype.addConstraintsConsumingTo = function (v, coll) {
  var determining = v.determinedBy;
  var cc = v.constraints;
  for (var i = 0; i < cc.size(); i++) {
    var c = cc.at(i);
    if (c != determining && c.isSatisfied())
      coll.add(c);
  }
}

/* --- *
 * P l a n
 * --- */

/**
 * A Plan is an ordered list of constraints to be executed in sequence
 * to resatisfy all currently satisfiable constraints in the face of
 * one or more changing inputs.
 */
function Plan() {
  this.v = new OrderedCollection();
}

Plan.prototype.addConstraint = function (c) {
  this.v.add(c);
}

Plan.prototype.size = function () {
  return this.v.size();
}

Plan.prototype.constraintAt = function (index) {
  return this.v.at(index);
}

Plan.prototype.execute = function () {
  for (var i = 0; i < this.size(); i++) {
    var c = this.constraintAt(i);
    c.execute();
  }
}

/* --- *
 * M a i n
 * --- */

/**
 * This is the standard DeltaBlue benchmark. A long chain of equality
 * constraints is constructed with a stay constraint on one end. An
 * edit constraint is then added to the opposite end and the time is
 * measured for adding and removing this constraint, and extracting
 * and executing a constraint satisfaction plan. There are two cases.
 * In case 1, the added constraint is stronger than the stay
 * constraint and values must propagate down the entire length of the
 * chain. In case 2, the added constraint is weaker than the stay
 * constraint so it cannot be accomodated. The cost in this case is,
 * of course, very low. Typical situations lie somewhere between these
 * two extremes.
 */
function chainTest(n) {
  planner = new Planner();
  var prev = null, first = null, last = null;

  // Build chain of n equality constraints
  for (var i = 0; i <= n; i++) {
    var name = "v" + i;
    var v = new Variable(name);
    if (prev != null)
      new EqualityConstraint(prev, v, Strength.REQUIRED);
    if (i == 0) first = v;
    if (i == n) last = v;
    prev = v;
  }

  new StayConstraint(last, Strength.STRONG_DEFAULT);
  var edit = new EditConstraint(first, Strength.PREFERRED);
  var edits = new OrderedCollection();
  edits.add(edit);
  var plan = planner.extractPlanFromConstraints(edits);
  for (var i = 0; i < 100; i++) {
    first.value = i;
    plan.execute();
    if (last.value != i)
      alert("Chain test failed.");
  }
}

/**
 * This test constructs a two sets of variables related to each
 * other by a simple linear transformation (scale and offset). The
 * time is measured to change a variable on either side of the
 * mapping and to change the scale and offset factors.
 */
function projectionTest(n) {
  planner = new Planner();
  var scale = new Variable("scale", 10);
  var offset = new Variable("offset", 1000);
  var src = null, dst = null;

  var dests = new OrderedCollection();
  for (var i = 0; i < n; i++) {
    src = new Variable("src" + i, i);
    dst = new Variable("dst" + i, i);
    dests.add(dst);
    new StayConstraint(src, Strength.NORMAL);
    new ScaleConstraint(src, scale, offset, dst, Strength.REQUIRED);
  }

  change(src, 17);
  if (dst.value != 1170) alert("Projection 1 failed");
  change(dst, 1050);
  if (src.value != 5) alert("Projection 2 failed");
  change(scale, 5);
  for (var i = 0; i < n - 1; i++) {
    if (dests.at(i).value != i * 5 + 1000)
      alert("Projection 3 failed");
  }
  change(offset, 2000);
  for (var i = 0; i < n - 1; i++) {
    if (dests.at(i).value != i * 5 + 2000)
      alert("Projection 4 failed");
  }
}

function change(v, newValue) {
  var edit = new EditConstraint(v, Strength.PREFERRED);
  var edits = new OrderedCollection();
  edits.add(edit);
  var plan = planner.extractPlanFromConstraints(edits);
  for (var i = 0; i < 10; i++) {
    v.value = newValue;
    plan.execute();
  }
  edit.destroyConstraint();
}

// Global variable holding the current planner.
var planner = null;

function deltaBlue() {
  chainTest(100);
  projectionTest(100);
}

for (var i = 0; i < 155; ++i)
    deltaBlue();
// This file is automatically generated by scheme2js, except for the
// benchmark harness code at the beginning and end of the file.

/************* GENERATED FILE - DO NOT EDIT *************/
/************* GENERATED FILE - DO NOT EDIT *************/
/************* GENERATED FILE - DO NOT EDIT *************/
/************* GENERATED FILE - DO NOT EDIT *************/
/************* GENERATED FILE - DO NOT EDIT *************/
/************* GENERATED FILE - DO NOT EDIT *************/
/************* GENERATED FILE - DO NOT EDIT *************/
/************* GENERATED FILE - DO NOT EDIT *************/
/*
 * To use write/prints/... the default-output port has to be set first.
 * Simply setting SC_DEFAULT_OUT and SC_ERROR_OUT to the desired values
 * should do the trick.
 * In the following example the std-out and error-port are redirected to
 * a DIV.
function initRuntime() {
    function escapeHTML(s) {
	var tmp = s;
	tmp = tmp.replace(/&/g, "&amp;");
	tmp = tmp.replace(/</g, "&lt;");
	tmp = tmp.replace(/>/g, "&gt;");
	tmp = tmp.replace(/ /g, "&nbsp;");
	tmp = tmp.replace(/\n/g, "<br />");
	tmp = tmp.replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp");
	return tmp;
	
    }

    document.write("<div id='stdout'></div>");
    SC_DEFAULT_OUT = new sc_GenericOutputPort(
	function(s) {
	    var stdout = document.getElementById('stdout');
	    stdout.innerHTML = stdout.innerHTML + escapeHTML(s);
	});
    SC_ERROR_OUT = SC_DEFAULT_OUT;
}
*/


function sc_print_debug() {
    sc_print.apply(null, arguments);
}
/*** META ((export *js*)) */
var sc_JS_GLOBALS = this;

var __sc_LINE=-1;
var __sc_FILE="";

/*** META ((export #t)) */
function sc_alert() {
   var len = arguments.length;
   var s = "";
   var i;

   for( i = 0; i < len; i++ ) {
       s += sc_toDisplayString(arguments[ i ]);
   }

   return alert( s );
}

/*** META ((export #t)) */
function sc_typeof( x ) {
   return typeof x;
}

/*** META ((export #t)) */
function sc_error() {
    var a = [sc_jsstring2symbol("*error*")];
    for (var i = 0; i < arguments.length; i++) {
	a[i+1] = arguments[i];
    }
    throw a;
}

/*** META ((export #t)
           (peephole (prefix "throw ")))
*/
function sc_raise(obj) {
    throw obj;
}

/*** META ((export with-handler-lambda)) */
function sc_withHandlerLambda(handler, body) {
    try {
	return body();
    } catch(e) {
	if (!e._internalException)
	    return handler(e);
	else
	    throw e;
    }
}

var sc_properties = new Object();

/*** META ((export #t)) */
function sc_putpropBang(sym, key, val) {
    var ht = sc_properties[sym];
    if (!ht) {
	ht = new Object();
	sc_properties[sym] = ht;
    }
    ht[key] = val;
}

/*** META ((export #t)) */
function sc_getprop(sym, key) {
    var ht = sc_properties[sym];
    if (ht) {
	if (key in ht)
	    return ht[key];
	else
	    return false;
    } else
	return false;
}

/*** META ((export #t)) */
function sc_rempropBang(sym, key) {
    var ht = sc_properties[sym];
    if (ht)
	delete ht[key];
}

/*** META ((export #t)) */
function sc_any2String(o) {
    return jsstring2string(sc_toDisplayString(o));
}    

/*** META ((export #t)
           (peephole (infix 2 2 "==="))
           (type bool))
*/
function sc_isEqv(o1, o2) {
    return (o1 === o2);
}

/*** META ((export #t)
           (peephole (infix 2 2 "==="))
           (type bool))
*/
function sc_isEq(o1, o2) {
    return (o1 === o2);
}

/*** META ((export #t)
           (type bool))
*/
function sc_isNumber(n) {
    return (typeof n === "number");
}

/*** META ((export #t)
           (type bool))
*/
function sc_isComplex(n) {
    return sc_isNumber(n);
}

/*** META ((export #t)
           (type bool))
*/
function sc_isReal(n) {
    return sc_isNumber(n);
}

/*** META ((export #t)
           (type bool))
*/
function sc_isRational(n) {
    return sc_isReal(n);
}

/*** META ((export #t)
           (type bool))
*/
function sc_isInteger(n) {
    return (parseInt(n) === n);
}

/*** META ((export #t)
           (type bool)
           (peephole (postfix ", false")))
*/
// we don't have exact numbers...
function sc_isExact(n) {
    return false;
}

/*** META ((export #t)
           (peephole (postfix ", true"))
	   (type bool))
*/
function sc_isInexact(n) {
    return true;
}

/*** META ((export = =fx =fl)
           (type bool)
           (peephole (infix 2 2 "===")))
*/
function sc_equal(x) {
    for (var i = 1; i < arguments.length; i++)
	if (x !== arguments[i])
	    return false;
    return true;
}

/*** META ((export < <fx <fl)
           (type bool)
           (peephole (infix 2 2 "<")))
*/
function sc_less(x) {
    for (var i = 1; i < arguments.length; i++) {
	if (x >= arguments[i])
	    return false;
	x = arguments[i];
    }
    return true;
}

/*** META ((export > >fx >fl)
           (type bool)
           (peephole (infix 2 2 ">")))
*/
function sc_greater(x, y) {
    for (var i = 1; i < arguments.length; i++) {
	if (x <= arguments[i])
	    return false;
	x = arguments[i];
    }
    return true;
}

/*** META ((export <= <=fx <=fl)
           (type bool)
           (peephole (infix 2 2 "<=")))
*/
function sc_lessEqual(x, y) {
    for (var i = 1; i < arguments.length; i++) {
	if (x > arguments[i])
	    return false;
	x = arguments[i];
    }
    return true;
}

/*** META ((export >= >=fl >=fx)
           (type bool)
           (peephole (infix 2 2 ">=")))
*/
function sc_greaterEqual(x, y) {
    for (var i = 1; i < arguments.length; i++) {
	if (x < arguments[i])
	    return false;
	x = arguments[i];
    }
    return true;
}

/*** META ((export #t)
           (type bool)
           (peephole (postfix "=== 0")))
*/
function sc_isZero(x) {
    return (x === 0);
}

/*** META ((export #t)
           (type bool)
           (peephole (postfix "> 0")))
*/
function sc_isPositive(x) {
    return (x > 0);
}

/*** META ((export #t)
           (type bool)
           (peephole (postfix "< 0")))
*/
function sc_isNegative(x) {
    return (x < 0);
}

/*** META ((export #t)
           (type bool)
           (peephole (postfix "%2===1")))
*/
function sc_isOdd(x) {
    return (x % 2 === 1);
}

/*** META ((export #t)
           (type bool)
           (peephole (postfix "%2===0")))
*/
function sc_isEven(x) {
    return (x % 2 === 0);
}

/*** META ((export #t)) */
var sc_max = Math.max;
/*** META ((export #t)) */
var sc_min = Math.min;

/*** META ((export + +fx +fl)
           (peephole (infix 0 #f "+" "0")))
*/
function sc_plus() {
    var sum = 0;
    for (var i = 0; i < arguments.length; i++)
	sum += arguments[i];
    return sum;
}

/*** META ((export * *fx *fl)
           (peephole (infix 0 #f "*" "1")))
*/
function sc_multi() {
    var product = 1;
    for (var i = 0; i < arguments.length; i++)
	product *= arguments[i];
    return product;
}

/*** META ((export - -fx -fl)
           (peephole (minus)))
*/
function sc_minus(x) {
    if (arguments.length === 1)
	return -x;
    else {
	var res = x;
	for (var i = 1; i < arguments.length; i++)
	    res -= arguments[i];
	return res;
    }
}

/*** META ((export / /fl)
           (peephole (div)))
*/
function sc_div(x) {
    if (arguments.length === 1)
	return 1/x;
    else {
	var res = x;
	for (var i = 1; i < arguments.length; i++)
	    res /= arguments[i];
	return res;
    }
}

/*** META ((export #t)) */
var sc_abs = Math.abs;

/*** META ((export quotient /fx)
           (peephole (hole 2 "parseInt(" x "/" y ")")))
*/
function sc_quotient(x, y) {
    return parseInt(x / y);
}

/*** META ((export #t)
           (peephole (infix 2 2 "%")))
*/
function sc_remainder(x, y) {
    return x % y;
}

/*** META ((export #t)
           (peephole (modulo)))
*/
function sc_modulo(x, y) {
    var remainder = x % y;
    // if they don't have the same sign
    if ((remainder * y) < 0)
	return remainder + y;
    else
	return remainder;
}

function sc_euclid_gcd(a, b) {
    var temp;
    if (a === 0) return b;
    if (b === 0) return a;
    if (a < 0) {a = -a;};
    if (b < 0) {b = -b;};
    if (b > a) {temp = a; a = b; b = temp;};
    while (true) {
	a %= b;
	if(a === 0) {return b;};
	b %= a;
	if(b === 0) {return a;};
    };
    return b;
}

/*** META ((export #t)) */
function sc_gcd() {
    var gcd = 0;
    for (var i = 0; i < arguments.length; i++)
	gcd = sc_euclid_gcd(gcd, arguments[i]);
    return gcd;
}

/*** META ((export #t)) */
function sc_lcm() {
    var lcm = 1;
    for (var i = 0; i < arguments.length; i++) {
	var f = Math.round(arguments[i] / sc_euclid_gcd(arguments[i], lcm));
	lcm *= Math.abs(f);
    }
    return lcm;
}

// LIMITATION: numerator and denominator don't make sense in floating point world.
//var SC_MAX_DECIMALS = 1000000
//
// function sc_numerator(x) {
//     var rounded = Math.round(x * SC_MAX_DECIMALS);
//     return Math.round(rounded / sc_euclid_gcd(rounded, SC_MAX_DECIMALS));
// }

// function sc_denominator(x) {
//     var rounded = Math.round(x * SC_MAX_DECIMALS);
//     return Math.round(SC_MAX_DECIMALS / sc_euclid_gcd(rounded, SC_MAX_DECIMALS));
// }

/*** META ((export #t)) */
var sc_floor = Math.floor;
/*** META ((export #t)) */
var sc_ceiling = Math.ceil;
/*** META ((export #t)) */
var sc_truncate = parseInt;
/*** META ((export #t)) */
var sc_round = Math.round;

// LIMITATION: sc_rationalize doesn't make sense in a floating point world.

/*** META ((export #t)) */
var sc_exp = Math.exp;
/*** META ((export #t)) */
var sc_log = Math.log;
/*** META ((export #t)) */
var sc_sin = Math.sin;
/*** META ((export #t)) */
var sc_cos = Math.cos;
/*** META ((export #t)) */
var sc_tan = Math.tan;
/*** META ((export #t)) */
var sc_asin = Math.asin;
/*** META ((export #t)) */
var sc_acos = Math.acos;
/*** META ((export #t)) */
var sc_atan = Math.atan;

/*** META ((export #t)) */
var sc_sqrt = Math.sqrt;
/*** META ((export #t)) */
var sc_expt = Math.pow;

// LIMITATION: we don't have complex numbers.
// LIMITATION: the following functions are hence not implemented.
// LIMITATION: make-rectangular, make-polar, real-part, imag-part, magnitude, angle
// LIMITATION: 2 argument atan

/*** META ((export #t)
           (peephole (id)))
*/
function sc_exact2inexact(x) {
    return x;
}

/*** META ((export #t)
           (peephole (id)))
*/
function sc_inexact2exact(x) {
    return x;
}

function sc_number2jsstring(x, radix) {
    if (radix)
	return x.toString(radix);
    else
	return x.toString();
}

function sc_jsstring2number(s, radix) {
    if (s === "") return false;

    if (radix) {
	var t = parseInt(s, radix);
	if (!t && t !== 0) return false;
	// verify that each char is in range. (parseInt ignores leading
	// white and trailing chars)
	var allowedChars = "01234567890abcdefghijklmnopqrstuvwxyz".substring(0, radix+1);
	if ((new RegExp("^["+allowedChars+"]*$", "i")).test(s))
	    return t;
	else return false;
    } else {
	var t = +s; // does not ignore trailing chars.
	if (!t && t !== 0) return false;
	// simply verify that first char is not whitespace.
	var c = s.charAt(0);
	// if +c is 0, but the char is not "0", then we have a whitespace.
	if (+c === 0 && c !== "0") return false;
	return t;
    }
}

/*** META ((export #t)
           (type bool)
           (peephole (not)))
*/
function sc_not(b) {
    return b === false;
}

/*** META ((export #t)
           (type bool))
*/
function sc_isBoolean(b) {
    return (b === true) || (b === false);
}

function sc_Pair(car, cdr) {
    this.car = car;
    this.cdr = cdr;
}

sc_Pair.prototype.toString = function() {
    return sc_toDisplayString(this);
};
sc_Pair.prototype.sc_toWriteOrDisplayString = function(writeOrDisplay) {
    var current = this;

    var res = "(";

    while(true) {
	res += writeOrDisplay(current.car);
	if (sc_isPair(current.cdr)) {
	    res += " ";
	    current = current.cdr;
	} else if (current.cdr !== null) {
	    res += " . " + writeOrDisplay(current.cdr);
	    break;
	} else // current.cdr == null
	    break;
    }
	
    res += ")";

    return res;
};
sc_Pair.prototype.sc_toDisplayString = function() {
    return this.sc_toWriteOrDisplayString(sc_toDisplayString);
};
sc_Pair.prototype.sc_toWriteString = function() {
    return this.sc_toWriteOrDisplayString(sc_toWriteString);
};
// sc_Pair.prototype.sc_toWriteCircleString in IO.js

/*** META ((export #t)
           (type bool)
           (peephole (postfix " instanceof sc_Pair")))
*/
function sc_isPair(p) {
    return (p instanceof sc_Pair);
}

function sc_isPairEqual(p1, p2, comp) {
    return (comp(p1.car, p2.car) && comp(p1.cdr, p2.cdr));
}

/*** META ((export #t)
           (peephole (hole 2 "new sc_Pair(" car ", " cdr ")")))
*/
function sc_cons(car, cdr) {
    return new sc_Pair(car, cdr);
}

/*** META ((export cons*)) */
function sc_consStar() {
    var res = arguments[arguments.length - 1];
    for (var i = arguments.length-2; i >= 0; i--)
	res = new sc_Pair(arguments[i], res);
    return res;
}

/*** META ((export #t)
           (peephole (postfix ".car")))
*/
function sc_car(p) {
    return p.car;
}

/*** META ((export #t)
           (peephole (postfix ".cdr")))
*/
function sc_cdr(p) {
    return p.cdr;
}

/*** META ((export #t)
           (peephole (hole 2 p ".car = " val)))
*/
function sc_setCarBang(p, val) {
    p.car = val;
}

/*** META ((export #t)
           (peephole (hole 2 p ".cdr = " val)))
*/
function sc_setCdrBang(p, val) {
    p.cdr = val;
}

/*** META ((export #t)
           (peephole (postfix ".car.car")))
*/
function sc_caar(p) { return p.car.car; }
/*** META ((export #t)
           (peephole (postfix ".cdr.car")))
*/
function sc_cadr(p) { return p.cdr.car; }
/*** META ((export #t)
           (peephole (postfix ".car.cdr")))
*/
function sc_cdar(p) { return p.car.cdr; }
/*** META ((export #t)
           (peephole (postfix ".cdr.cdr")))
*/
function sc_cddr(p) { return p.cdr.cdr; }
/*** META ((export #t)
           (peephole (postfix ".car.car.car")))
*/
function sc_caaar(p) { return p.car.car.car; }
/*** META ((export #t)
           (peephole (postfix ".car.cdr.car")))
*/
function sc_cadar(p) { return p.car.cdr.car; }
/*** META ((export #t)
           (peephole (postfix ".cdr.car.car")))
*/
function sc_caadr(p) { return p.cdr.car.car; }
/*** META ((export #t)
           (peephole (postfix ".cdr.cdr.car")))
*/
function sc_caddr(p) { return p.cdr.cdr.car; }
/*** META ((export #t)
           (peephole (postfix ".car.car.cdr")))
*/
function sc_cdaar(p) { return p.car.car.cdr; }
/*** META ((export #t)
           (peephole (postfix ".cdr.car.cdr")))
*/
function sc_cdadr(p) { return p.cdr.car.cdr; }
/*** META ((export #t)
           (peephole (postfix ".car.cdr.cdr")))
*/
function sc_cddar(p) { return p.car.cdr.cdr; }
/*** META ((export #t)
           (peephole (postfix ".cdr.cdr.cdr")))
*/
function sc_cdddr(p) { return p.cdr.cdr.cdr; }
/*** META ((export #t)
           (peephole (postfix ".car.car.car.car")))
*/
function sc_caaaar(p) { return p.car.car.car.car; }
/*** META ((export #t)
           (peephole (postfix ".car.cdr.car.car")))
*/
function sc_caadar(p) { return p.car.cdr.car.car; }
/*** META ((export #t)
           (peephole (postfix ".cdr.car.car.car")))
*/
function sc_caaadr(p) { return p.cdr.car.car.car; }
/*** META ((export #t)
           (peephole (postfix ".cdr.cdr.car.car")))
*/
function sc_caaddr(p) { return p.cdr.cdr.car.car; }
/*** META ((export #t)
           (peephole (postfix ".car.car.car.cdr")))
*/
function sc_cdaaar(p) { return p.car.car.car.cdr; }
/*** META ((export #t)
           (peephole (postfix ".car.cdr.car.cdr")))
*/
function sc_cdadar(p) { return p.car.cdr.car.cdr; }
/*** META ((export #t)
           (peephole (postfix ".cdr.car.car.cdr")))
*/
function sc_cdaadr(p) { return p.cdr.car.car.cdr; }
/*** META ((export #t)
           (peephole (postfix ".cdr.cdr.car.cdr")))
*/
function sc_cdaddr(p) { return p.cdr.cdr.car.cdr; }
/*** META ((export #t)
           (peephole (postfix ".car.car.cdr.car")))
*/
function sc_cadaar(p) { return p.car.car.cdr.car; }
/*** META ((export #t)
           (peephole (postfix ".car.cdr.cdr.car")))
*/
function sc_caddar(p) { return p.car.cdr.cdr.car; }
/*** META ((export #t)
           (peephole (postfix ".cdr.car.cdr.car")))
*/
function sc_cadadr(p) { return p.cdr.car.cdr.car; }
/*** META ((export #t)
           (peephole (postfix ".cdr.cdr.cdr.car")))
*/
function sc_cadddr(p) { return p.cdr.cdr.cdr.car; }
/*** META ((export #t)
           (peephole (postfix ".car.car.cdr.cdr")))
*/
function sc_cddaar(p) { return p.car.car.cdr.cdr; }
/*** META ((export #t)
           (peephole (postfix ".car.cdr.cdr.cdr")))
*/
function sc_cdddar(p) { return p.car.cdr.cdr.cdr; }
/*** META ((export #t)
           (peephole (postfix ".cdr.car.cdr.cdr")))
*/
function sc_cddadr(p) { return p.cdr.car.cdr.cdr; }
/*** META ((export #t)
           (peephole (postfix ".cdr.cdr.cdr.cdr")))
*/
function sc_cddddr(p) { return p.cdr.cdr.cdr.cdr; }

/*** META ((export #t)) */
function sc_lastPair(l) {
    if (!sc_isPair(l)) sc_error("sc_lastPair: pair expected");
    var res = l;
    var cdr = l.cdr;
    while (sc_isPair(cdr)) {
	res = cdr;
	cdr = res.cdr;
    }
    return res;
}

/*** META ((export #t)
           (type bool)
           (peephole (postfix " === null")))
*/
function sc_isNull(o) {
    return (o === null);
}

/*** META ((export #t)
           (type bool))
*/
function sc_isList(o) {
    var rabbit;
    var turtle;

    var rabbit = o;
    var turtle = o;
    while (true) {
	if (rabbit === null ||
	    (rabbit instanceof sc_Pair && rabbit.cdr === null))
	    return true;  // end of list
	else if ((rabbit instanceof sc_Pair) &&
		 (rabbit.cdr instanceof sc_Pair)) {
	    rabbit = rabbit.cdr.cdr;
	    turtle = turtle.cdr;
	    if (rabbit === turtle) return false; // cycle
	} else
	    return false; // not pair
    }
}

/*** META ((export #t)) */
function sc_list() {
    var res = null;
    var a = arguments;
    for (var i = a.length-1; i >= 0; i--)
	res = new sc_Pair(a[i], res);
    return res;
}

/*** META ((export #t)) */
function sc_iota(num, init) {
   var res = null;
   if (!init) init = 0;
   for (var i = num - 1; i >= 0; i--)
      res = new sc_Pair(i + init, res);
   return res;
}

/*** META ((export #t)) */
function sc_makeList(nbEls, fill) {
    var res = null;
    for (var i = 0; i < nbEls; i++)
	res = new sc_Pair(fill, res);
    return res;
}

/*** META ((export #t)) */
function sc_length(l) {
    var res = 0;
    while (l !== null) {
	res++;
	l = l.cdr;
    }
    return res;
}

/*** META ((export #t)) */
function sc_remq(o, l) {
    var dummy = { cdr : null };
    var tail = dummy;
    while (l !== null) {
	if (l.car !== o) {
	    tail.cdr = sc_cons(l.car, null);
	    tail = tail.cdr;
	}
	l = l.cdr;
    }
    return dummy.cdr;
}

/*** META ((export #t)) */
function sc_remqBang(o, l) {
    var dummy = { cdr : null };
    var tail = dummy;
    var needsAssig = true;
    while (l !== null) {
	if (l.car === o) {
	    needsAssig = true;
	} else {
	    if (needsAssig) {
		tail.cdr = l;
		needsAssig = false;
	    }
	    tail = l;
	}
	l = l.cdr;
    }
    tail.cdr = null;
    return dummy.cdr;
}

/*** META ((export #t)) */
function sc_delete(o, l) {
    var dummy = { cdr : null };
    var tail = dummy;
    while (l !== null) {
	if (!sc_isEqual(l.car, o)) {
	    tail.cdr = sc_cons(l.car, null);
	    tail = tail.cdr;
	}
	l = l.cdr;
    }
    return dummy.cdr;
}

/*** META ((export #t)) */
function sc_deleteBang(o, l) {
    var dummy = { cdr : null };
    var tail = dummy;
    var needsAssig = true;
    while (l !== null) {
	if (sc_isEqual(l.car, o)) {
	    needsAssig = true;
	} else {
	    if (needsAssig) {
		tail.cdr = l;
		needsAssig = false;
	    }
	    tail = l;
	}
	l = l.cdr;
    }
    tail.cdr = null;
    return dummy.cdr;
}

function sc_reverseAppendBang(l1, l2) {
    var res = l2;
    while (l1 !== null) {
	var tmp = res;
	res = l1;
	l1 = l1.cdr;
	res.cdr = tmp;
    }
    return res;
}
	
function sc_dualAppend(l1, l2) {
    if (l1 === null) return l2;
    if (l2 === null) return l1;
    var rev = sc_reverse(l1);
    return sc_reverseAppendBang(rev, l2);
}

/*** META ((export #t)) */
function sc_append() {
    if (arguments.length === 0)
	return null;
    var res = arguments[arguments.length - 1];
    for (var i = arguments.length - 2; i >= 0; i--)
	res = sc_dualAppend(arguments[i], res);
    return res;
}

function sc_dualAppendBang(l1, l2) {
    if (l1 === null) return l2;
    if (l2 === null) return l1;
    var tmp = l1;
    while (tmp.cdr !== null) tmp=tmp.cdr;
    tmp.cdr = l2;
    return l1;
}
    
/*** META ((export #t)) */
function sc_appendBang() {
    var res = null;
    for (var i = 0; i < arguments.length; i++)
	res = sc_dualAppendBang(res, arguments[i]);
    return res;
}

/*** META ((export #t)) */
function sc_reverse(l1) {
    var res = null;
    while (l1 !== null) {
	res = sc_cons(l1.car, res);
	l1 = l1.cdr;
    }
    return res;
}

/*** META ((export #t)) */
function sc_reverseBang(l) {
    return sc_reverseAppendBang(l, null);
}

/*** META ((export #t)) */
function sc_listTail(l, k) {
    var res = l;
    for (var i = 0; i < k; i++) {
	res = res.cdr;
    }
    return res;
}

/*** META ((export #t)) */
function sc_listRef(l, k) {
    return sc_listTail(l, k).car;
}

/* // unoptimized generic versions
function sc_memX(o, l, comp) {
    while (l != null) {
	if (comp(l.car, o))
	    return l;
	l = l.cdr;
    }
    return false;
}
function sc_memq(o, l) { return sc_memX(o, l, sc_isEq); }
function sc_memv(o, l) { return sc_memX(o, l, sc_isEqv); }
function sc_member(o, l) { return sc_memX(o, l, sc_isEqual); }
*/

/* optimized versions */
/*** META ((export #t)) */
function sc_memq(o, l) {
    while (l !== null) {
	if (l.car === o)
	    return l;
	l = l.cdr;
    }
    return false;
}
/*** META ((export #t)) */
function sc_memv(o, l) {
    while (l !== null) {
	if (l.car === o)
	    return l;
	l = l.cdr;
    }
    return false;
}
/*** META ((export #t)) */
function sc_member(o, l) {
    while (l !== null) {
	if (sc_isEqual(l.car,o))
	    return l;
	l = l.cdr;
    }
    return false;
}

/* // generic unoptimized versions
function sc_assX(o, al, comp) {
    while (al != null) {
	if (comp(al.car.car, o))
	    return al.car;
	al = al.cdr;
    }
    return false;
}
function sc_assq(o, al) { return sc_assX(o, al, sc_isEq); }
function sc_assv(o, al) { return sc_assX(o, al, sc_isEqv); }
function sc_assoc(o, al) { return sc_assX(o, al, sc_isEqual); }
*/
// optimized versions
/*** META ((export #t)) */
function sc_assq(o, al) {
    while (al !== null) {
	if (al.car.car === o)
	    return al.car;
	al = al.cdr;
    }
    return false;
}
/*** META ((export #t)) */
function sc_assv(o, al) {
    while (al !== null) {
	if (al.car.car === o)
	    return al.car;
	al = al.cdr;
    }
    return false;
}
/*** META ((export #t)) */
function sc_assoc(o, al) {
    while (al !== null) {
	if (sc_isEqual(al.car.car, o))
	    return al.car;
	al = al.cdr;
    }
    return false;
}

/* can be used for mutable strings and characters */
function sc_isCharStringEqual(cs1, cs2) { return cs1.val === cs2.val; }
function sc_isCharStringLess(cs1, cs2) { return cs1.val < cs2.val; }
function sc_isCharStringGreater(cs1, cs2) { return cs1.val > cs2.val; }
function sc_isCharStringLessEqual(cs1, cs2) { return cs1.val <= cs2.val; }
function sc_isCharStringGreaterEqual(cs1, cs2) { return cs1.val >= cs2.val; }
function sc_isCharStringCIEqual(cs1, cs2)
    { return cs1.val.toLowerCase() === cs2.val.toLowerCase(); }
function sc_isCharStringCILess(cs1, cs2)
    { return cs1.val.toLowerCase() < cs2.val.toLowerCase(); }
function sc_isCharStringCIGreater(cs1, cs2)
    { return cs1.val.toLowerCase() > cs2.val.toLowerCase(); }
function sc_isCharStringCILessEqual(cs1, cs2)
    { return cs1.val.toLowerCase() <= cs2.val.toLowerCase(); }
function sc_isCharStringCIGreaterEqual(cs1, cs2)
    { return cs1.val.toLowerCase() >= cs2.val.toLowerCase(); }




function sc_Char(c) {
    var cached = sc_Char.lazy[c];
    if (cached)
	return cached;
    this.val = c;
    sc_Char.lazy[c] = this;
    // add return, so FF does not complain.
    return undefined;
}
sc_Char.lazy = new Object();
// thanks to Eric
sc_Char.char2readable = {
    "\000": "#\\null",
    "\007": "#\\bell",
    "\010": "#\\backspace",
    "\011": "#\\tab",
    "\012": "#\\newline",
    "\014": "#\\page",
    "\015": "#\\return",
    "\033": "#\\escape",
    "\040": "#\\space",
    "\177": "#\\delete",

  /* poeticless names */
    "\001": "#\\soh",
    "\002": "#\\stx",
    "\003": "#\\etx",
    "\004": "#\\eot",
    "\005": "#\\enq",
    "\006": "#\\ack",

    "\013": "#\\vt",
    "\016": "#\\so",
    "\017": "#\\si",

    "\020": "#\\dle",
    "\021": "#\\dc1",
    "\022": "#\\dc2",
    "\023": "#\\dc3",
    "\024": "#\\dc4",
    "\025": "#\\nak",
    "\026": "#\\syn",
    "\027": "#\\etb",

    "\030": "#\\can",
    "\031": "#\\em",
    "\032": "#\\sub",
    "\033": "#\\esc",
    "\034": "#\\fs",
    "\035": "#\\gs",
    "\036": "#\\rs",
    "\037": "#\\us"};

sc_Char.readable2char = {
    "null": "\000",
    "bell": "\007",
    "backspace": "\010",
    "tab": "\011",
    "newline": "\012",
    "page": "\014",
    "return": "\015",
    "escape": "\033",
    "space": "\040",
    "delete": "\000",
    "soh": "\001",
    "stx": "\002",
    "etx": "\003",
    "eot": "\004",
    "enq": "\005",
    "ack": "\006",
    "bel": "\007",
    "bs": "\010",
    "ht": "\011",
    "nl": "\012",
    "vt": "\013",
    "np": "\014",
    "cr": "\015",
    "so": "\016",
    "si": "\017",
    "dle": "\020",
    "dc1": "\021",
    "dc2": "\022",
    "dc3": "\023",
    "dc4": "\024",
    "nak": "\025",
    "syn": "\026",
    "etb": "\027",
    "can": "\030",
    "em": "\031",
    "sub": "\032",
    "esc": "\033",
    "fs": "\034",
    "gs": "\035",
    "rs": "\036",
    "us": "\037",
    "sp": "\040",
    "del": "\177"};
    
sc_Char.prototype.toString = function() {
    return this.val;
};
// sc_toDisplayString == toString
sc_Char.prototype.sc_toWriteString = function() {
    var entry = sc_Char.char2readable[this.val];
    if (entry)
	return entry;
    else
	return "#\\" + this.val;
};

/*** META ((export #t)
           (type bool)
           (peephole (postfix "instanceof sc_Char")))
*/
function sc_isChar(c) {
    return (c instanceof sc_Char);
}

/*** META ((export char=?)
           (type bool)
           (peephole (hole 2 c1 ".val === " c2 ".val")))
*/
var sc_isCharEqual = sc_isCharStringEqual;
/*** META ((export char<?)
           (type bool)
           (peephole (hole 2 c1 ".val < " c2 ".val")))
*/
var sc_isCharLess = sc_isCharStringLess;
/*** META ((export char>?)
           (type bool)
           (peephole (hole 2 c1 ".val > " c2 ".val")))
*/
var sc_isCharGreater = sc_isCharStringGreater;
/*** META ((export char<=?)
           (type bool)
           (peephole (hole 2 c1 ".val <= " c2 ".val")))
*/
var sc_isCharLessEqual = sc_isCharStringLessEqual;
/*** META ((export char>=?)
           (type bool)
           (peephole (hole 2 c1 ".val >= " c2 ".val")))
*/
var sc_isCharGreaterEqual = sc_isCharStringGreaterEqual;
/*** META ((export char-ci=?)
           (type bool)
           (peephole (hole 2 c1 ".val.toLowerCase() === " c2 ".val.toLowerCase()")))
*/
var sc_isCharCIEqual = sc_isCharStringCIEqual;
/*** META ((export char-ci<?)
           (type bool)
           (peephole (hole 2 c1 ".val.toLowerCase() < " c2 ".val.toLowerCase()")))
*/
var sc_isCharCILess = sc_isCharStringCILess;
/*** META ((export char-ci>?)
           (type bool)
           (peephole (hole 2 c1 ".val.toLowerCase() > " c2 ".val.toLowerCase()")))
*/
var sc_isCharCIGreater = sc_isCharStringCIGreater;
/*** META ((export char-ci<=?)
           (type bool)
           (peephole (hole 2 c1 ".val.toLowerCase() <= " c2 ".val.toLowerCase()")))
*/
var sc_isCharCILessEqual = sc_isCharStringCILessEqual;
/*** META ((export char-ci>=?)
           (type bool)
           (peephole (hole 2 c1 ".val.toLowerCase() >= " c2 ".val.toLowerCase()")))
*/
var sc_isCharCIGreaterEqual = sc_isCharStringCIGreaterEqual;

var SC_NUMBER_CLASS = "0123456789";
var SC_WHITESPACE_CLASS = ' \r\n\t\f';
var SC_LOWER_CLASS = 'abcdefghijklmnopqrstuvwxyz';
var SC_UPPER_CLASS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function sc_isCharOfClass(c, cl) { return (cl.indexOf(c) != -1); }
/*** META ((export #t)
           (type bool))
*/
function sc_isCharAlphabetic(c)
    { return sc_isCharOfClass(c.val, SC_LOWER_CLASS) ||
	  sc_isCharOfClass(c.val, SC_UPPER_CLASS); }
/*** META ((export #t)
           (type bool)
           (peephole (hole 1 "SC_NUMBER_CLASS.indexOf(" c ".val) != -1")))
*/
function sc_isCharNumeric(c)
    { return sc_isCharOfClass(c.val, SC_NUMBER_CLASS); }
/*** META ((export #t)
           (type bool))
*/
function sc_isCharWhitespace(c) {
    var tmp = c.val;
    return tmp === " " || tmp === "\r" || tmp === "\n" || tmp === "\t" || tmp === "\f";
}
/*** META ((export #t)
           (type bool)
           (peephole (hole 1 "SC_UPPER_CLASS.indexOf(" c ".val) != -1")))
*/
function sc_isCharUpperCase(c)
    { return sc_isCharOfClass(c.val, SC_UPPER_CLASS); }
/*** META ((export #t)
           (type bool)
           (peephole (hole 1 "SC_LOWER_CLASS.indexOf(" c ".val) != -1")))
*/
function sc_isCharLowerCase(c)
    { return sc_isCharOfClass(c.val, SC_LOWER_CLASS); }

/*** META ((export #t)
           (peephole (postfix ".val.charCodeAt(0)")))
*/
function sc_char2integer(c)
    { return c.val.charCodeAt(0); }
/*** META ((export #t)
           (peephole (hole 1 "new sc_Char(String.fromCharCode(" n "))")))
*/
function sc_integer2char(n)
    { return new sc_Char(String.fromCharCode(n)); }

/*** META ((export #t)
           (peephole (hole 1 "new sc_Char(" c ".val.toUpperCase())")))
*/
function sc_charUpcase(c)
    { return new sc_Char(c.val.toUpperCase()); }
/*** META ((export #t)
           (peephole (hole 1 "new sc_Char(" c ".val.toLowerCase())")))
*/
function sc_charDowncase(c)
    { return new sc_Char(c.val.toLowerCase()); }

function sc_makeJSStringOfLength(k, c) {
    var fill;
    if (c === undefined)
	fill = " ";
    else
	fill = c;
    var res = "";
    var len = 1;
    // every round doubles the size of fill.
    while (k >= len) {
	if (k & len)
	    res = res.concat(fill);
	fill = fill.concat(fill);
	len *= 2;
    }
    return res;
}

function sc_makejsString(k, c) {
    var fill;
    if (c)
	fill = c.val;
    else
	fill = " ";
    return sc_makeJSStringOfLength(k, fill);
}

function sc_jsstring2list(s) {
    var res = null;
    for (var i = s.length - 1; i >= 0; i--)
	res = sc_cons(new sc_Char(s.charAt(i)), res);
    return res;
}

function sc_list2jsstring(l) {
    var a = new Array();
    while(l !== null) {
	a.push(l.car.val);
	l = l.cdr;
    }
    return "".concat.apply("", a);
}

var sc_Vector = Array;

sc_Vector.prototype.sc_toWriteOrDisplayString = function(writeOrDisplay) {
    if (this.length === 0) return "#()";

    var res = "#(" + writeOrDisplay(this[0]);
    for (var i = 1; i < this.length; i++)
	res += " " + writeOrDisplay(this[i]);
    res += ")";
    return res;
};
sc_Vector.prototype.sc_toDisplayString = function() {
    return this.sc_toWriteOrDisplayString(sc_toDisplayString);
};
sc_Vector.prototype.sc_toWriteString = function() {
    return this.sc_toWriteOrDisplayString(sc_toWriteString);
};

/*** META ((export vector? array?)
           (type bool)
           (peephole (postfix " instanceof sc_Vector")))
*/
function sc_isVector(v) {
    return (v instanceof sc_Vector);
}

// only applies to vectors
function sc_isVectorEqual(v1, v2, comp) {
    if (v1.length !== v2.length) return false;
    for (var i = 0; i < v1.length; i++)
	if (!comp(v1[i], v2[i])) return false;
    return true;
}

/*** META ((export make-vector make-array)) */
function sc_makeVector(size, fill) {
    var a = new sc_Vector(size);
    if (fill !== undefined)
	sc_vectorFillBang(a, fill);
    return a;
}

/*** META ((export vector array)
           (peephole (vector)))
*/
function sc_vector() {
    var a = new sc_Vector();
    for (var i = 0; i < arguments.length; i++)
	a.push(arguments[i]);
    return a;
}

/*** META ((export vector-length array-length)
           (peephole (postfix ".length")))
*/
function sc_vectorLength(v) {
    return v.length;
}

/*** META ((export vector-ref array-ref)
           (peephole (hole 2 v "[" pos "]")))
*/
function sc_vectorRef(v, pos) {
    return v[pos];
}

/*** META ((export vector-set! array-set!)
           (peephole (hole 3 v "[" pos "] = " val)))
*/
function sc_vectorSetBang(v, pos, val) {
    v[pos] = val;
}

/*** META ((export vector->list array->list)) */
function sc_vector2list(a) {
    var res = null;
    for (var i = a.length-1; i >= 0; i--)
	res = sc_cons(a[i], res);
    return res;
}

/*** META ((export list->vector list->array)) */
function sc_list2vector(l) {
    var a = new sc_Vector();
    while(l !== null) {
	a.push(l.car);
	l = l.cdr;
    }
    return a;
}

/*** META ((export vector-fill! array-fill!)) */
function sc_vectorFillBang(a, fill) {
    for (var i = 0; i < a.length; i++)
	a[i] = fill;
}


/*** META ((export #t)) */
function sc_copyVector(a, len) {
    if (len <= a.length)
	return a.slice(0, len);
    else {
	var tmp = a.concat();
	tmp.length = len;
	return tmp;
    }
}

/*** META ((export #t)
           (peephole (hole 3 a ".slice(" start "," end ")")))
*/
function sc_vectorCopy(a, start, end) {
    return a.slice(start, end);
}

/*** META ((export #t)) */
function sc_vectorCopyBang(target, tstart, source, sstart, send) {
    if (!sstart) sstart = 0;
    if (!send) send = source.length;

    // if target == source we don't want to overwrite not yet copied elements.
    if (tstart <= sstart) {
	for (var i = tstart, j = sstart; j < send; i++, j++) {
	    target[i] = source[j];
	}
    } else {
	var diff = send - sstart;
	for (var i = tstart + diff - 1, j = send - 1;
	     j >= sstart;
	     i--, j--) {
	    target[i] = source[j];
	}
    }
    return target;
}

/*** META ((export #t)
           (type bool)
           (peephole (hole 1 "typeof " o " === 'function'")))
*/
function sc_isProcedure(o) {
    return (typeof o === "function");
}

/*** META ((export #t)) */
function sc_apply(proc) {
    var args = new Array();
    // first part of arguments are not in list-form.
    for (var i = 1; i < arguments.length - 1; i++)
	args.push(arguments[i]);
    var l = arguments[arguments.length - 1];
    while (l !== null) {
	args.push(l.car);
	l = l.cdr;
    }
    return proc.apply(null, args);
}

/*** META ((export #t)) */
function sc_map(proc, l1) {
    if (l1 === undefined)
	return null;
    // else
    var nbApplyArgs = arguments.length - 1;
    var applyArgs = new Array(nbApplyArgs);
    var revres = null;
    while (l1 !== null) {
	for (var i = 0; i < nbApplyArgs; i++) {
	    applyArgs[i] = arguments[i + 1].car;
	    arguments[i + 1] = arguments[i + 1].cdr;
	}
	revres = sc_cons(proc.apply(null, applyArgs), revres);
    }
    return sc_reverseAppendBang(revres, null);
}

/*** META ((export #t)) */
function sc_mapBang(proc, l1) {
    if (l1 === undefined)
	return null;
    // else
    var l1_orig = l1;
    var nbApplyArgs = arguments.length - 1;
    var applyArgs = new Array(nbApplyArgs);
    while (l1 !== null) {
	var tmp = l1;
	for (var i = 0; i < nbApplyArgs; i++) {
	    applyArgs[i] = arguments[i + 1].car;
	    arguments[i + 1] = arguments[i + 1].cdr;
	}
	tmp.car = proc.apply(null, applyArgs);
    }
    return l1_orig;
}
     
/*** META ((export #t)) */
function sc_forEach(proc, l1) {
    if (l1 === undefined)
	return undefined;
    // else
    var nbApplyArgs = arguments.length - 1;
    var applyArgs = new Array(nbApplyArgs);
    while (l1 !== null) {
	for (var i = 0; i < nbApplyArgs; i++) {
	    applyArgs[i] = arguments[i + 1].car;
	    arguments[i + 1] = arguments[i + 1].cdr;
	}
	proc.apply(null, applyArgs);
    }
    // add return so FF does not complain.
    return undefined;
}

/*** META ((export #t)) */
function sc_filter(proc, l1) {
    var dummy = { cdr : null };
    var tail = dummy;
    while (l1 !== null) {
	if (proc(l1.car) !== false) {
	    tail.cdr = sc_cons(l1.car, null);
	    tail = tail.cdr;
	}
	l1 = l1.cdr;
    }
    return dummy.cdr;
}

/*** META ((export #t)) */
function sc_filterBang(proc, l1) {
    var head = sc_cons("dummy", l1);
    var it = head;
    var next = l1;
    while (next !== null) {
        if (proc(next.car) !== false) {
	    it.cdr = next
	    it = next;
	}
	next = next.cdr;
    }
    it.cdr = null;
    return head.cdr;
}

function sc_filterMap1(proc, l1) {
    var revres = null;
    while (l1 !== null) {
        var tmp = proc(l1.car)
        if (tmp !== false) revres = sc_cons(tmp, revres);
        l1 = l1.cdr;
    }
    return sc_reverseAppendBang(revres, null);
}
function sc_filterMap2(proc, l1, l2) {
    var revres = null;
    while (l1 !== null) {
        var tmp = proc(l1.car, l2.car);
        if(tmp !== false) revres = sc_cons(tmp, revres);
	l1 = l1.cdr;
	l2 = l2.cdr
    }
    return sc_reverseAppendBang(revres, null);
}

/*** META ((export #t)) */
function sc_filterMap(proc, l1, l2, l3) {
    if (l2 === undefined)
	return sc_filterMap1(proc, l1);
    else if (l3 === undefined)
	return sc_filterMap2(proc, l1, l2);
    // else
    var nbApplyArgs = arguments.length - 1;
    var applyArgs = new Array(nbApplyArgs);
    var revres = null;
    while (l1 !== null) {
	for (var i = 0; i < nbApplyArgs; i++) {
	    applyArgs[i] = arguments[i + 1].car;
	    arguments[i + 1] = arguments[i + 1].cdr;
	}
	var tmp = proc.apply(null, applyArgs);
	if(tmp !== false) revres = sc_cons(tmp, revres);
    }
    return sc_reverseAppendBang(revres, null);
}

/*** META ((export #t)) */
function sc_any(proc, l) {
    var revres = null;
    while (l !== null) {
        var tmp = proc(l.car);
        if(tmp !== false) return tmp;
	l = l.cdr;
    }
    return false;
}

/*** META ((export any?)
           (peephole (hole 2 "sc_any(" proc "," l ") !== false")))
*/
function sc_anyPred(proc, l) {
    return sc_any(proc, l)!== false;
}

/*** META ((export #t)) */
function sc_every(proc, l) {
    var revres = null;
    var tmp = true;
    while (l !== null) {
        tmp = proc(l.car);
        if (tmp === false) return false;
	l = l.cdr;
    }
    return tmp;
}

/*** META ((export every?)
           (peephole (hole 2 "sc_every(" proc "," l ") !== false")))
*/
function sc_everyPred(proc, l) {
    var tmp = sc_every(proc, l);
    if (tmp !== false) return true;
    return false;
}

/*** META ((export #t)
           (peephole (postfix "()")))
*/
function sc_force(o) {
    return o();
}

/*** META ((export #t)) */
function sc_makePromise(proc) {
    var isResultReady = false;
    var result = undefined;
    return function() {
	if (!isResultReady) {
	    var tmp = proc();
	    if (!isResultReady) {
		isResultReady = true;
		result = tmp;
	    }
	}
	return result;
    };
}

function sc_Values(values) {
    this.values = values;
}

/*** META ((export #t)
           (peephole (values)))
*/
function sc_values() {
    if (arguments.length === 1)
	return arguments[0];
    else
	return new sc_Values(arguments);
}

/*** META ((export #t)) */
function sc_callWithValues(producer, consumer) {
    var produced = producer();
    if (produced instanceof sc_Values)
	return consumer.apply(null, produced.values);
    else
	return consumer(produced);
}

/*** META ((export #t)) */
function sc_dynamicWind(before, thunk, after) {
    before();
    try {
	var res = thunk();
	return res;
    } finally {
	after();
    }
}


// TODO: eval/scheme-report-environment/null-environment/interaction-environment

// LIMITATION: 'load' doesn't exist without files.
// LIMITATION: transcript-on/transcript-off doesn't exist without files.


function sc_Struct(name) {
    this.name = name;
}
sc_Struct.prototype.sc_toDisplayString = function() {
    return "#<struct" + sc_hash(this) + ">";
};
sc_Struct.prototype.sc_toWriteString = sc_Struct.prototype.sc_toDisplayString;

/*** META ((export #t)
           (peephole (hole 1 "new sc_Struct(" name ")")))
*/
function sc_makeStruct(name) {
    return new sc_Struct(name);
}

/*** META ((export #t)
           (type bool)
           (peephole (postfix " instanceof sc_Struct")))
*/
function sc_isStruct(o) {
    return (o instanceof sc_Struct);
}

/*** META ((export #t)
           (type bool)
           (peephole (hole 2 "(" 1 " instanceof sc_Struct) && ( " 1 ".name === " 0 ")")))
*/
function sc_isStructNamed(name, s) {
    return ((s instanceof sc_Struct) && (s.name === name));
}

/*** META ((export struct-field)
           (peephole (hole 3 0 "[" 2 "]")))
*/
function sc_getStructField(s, name, field) {
    return s[field];
}

/*** META ((export struct-field-set!)
           (peephole (hole 4 0 "[" 2 "] = " 3)))
*/
function sc_setStructFieldBang(s, name, field, val) {
    s[field] = val;
}

/*** META ((export #t)
           (peephole (prefix "~")))
*/
function sc_bitNot(x) {
    return ~x;
}

/*** META ((export #t)
           (peephole (infix 2 2 "&")))
*/
function sc_bitAnd(x, y) {
    return x & y;
}

/*** META ((export #t)
           (peephole (infix 2 2 "|")))
*/
function sc_bitOr(x, y) {
    return x | y;
}

/*** META ((export #t)
           (peephole (infix 2 2 "^")))
*/
function sc_bitXor(x, y) {
    return x ^ y;
}

/*** META ((export #t)
           (peephole (infix 2 2 "<<")))
*/
function sc_bitLsh(x, y) {
    return x << y;
}

/*** META ((export #t)
           (peephole (infix 2 2 ">>")))
*/
function sc_bitRsh(x, y) {
    return x >> y;
}

/*** META ((export #t)
           (peephole (infix 2 2 ">>>")))
*/
function sc_bitUrsh(x, y) {
    return x >>> y;
}

/*** META ((export js-field js-property)
           (peephole (hole 2 o "[" field "]")))
*/
function sc_jsField(o, field) {
    return o[field];
}

/*** META ((export js-field-set! js-property-set!)
           (peephole (hole 3 o "[" field "] = " val)))
*/
function sc_setJsFieldBang(o, field, val) {
    return o[field] = val;
}

/*** META ((export js-field-delete! js-property-delete!)
           (peephole (hole 2 "delete" o "[" field "]")))
*/
function sc_deleteJsFieldBang(o, field) {
    delete o[field];
}

/*** META ((export #t)
           (peephole (jsCall)))
*/
function sc_jsCall(o, fun) {
    var args = new Array();
    for (var i = 2; i < arguments.length; i++)
	args[i-2] = arguments[i];
    return fun.apply(o, args);
}

/*** META ((export #t)
           (peephole (jsMethodCall)))
*/
function sc_jsMethodCall(o, field) {
    var args = new Array();
    for (var i = 2; i < arguments.length; i++)
	args[i-2] = arguments[i];
    return o[field].apply(o, args);
}

/*** META ((export new js-new)
           (peephole (jsNew)))
*/
function sc_jsNew(c) {
    var evalStr = "new c(";
    evalStr +=arguments.length > 1? "arguments[1]": "";
    for (var i = 2; i < arguments.length; i++)
	evalStr += ", arguments[" + i + "]";
    evalStr +=")";
    return eval(evalStr);
}    

// ======================== RegExp ====================
/*** META ((export #t)) */
function sc_pregexp(re) {
    return new RegExp(sc_string2jsstring(re));
}

/*** META ((export #t)) */
function sc_pregexpMatch(re, s) {
    var reg = (re instanceof RegExp) ? re : sc_pregexp(re);
    var tmp = reg.exec(sc_string2jsstring(s));
    
    if (tmp == null) return false;
    
    var res = null;
    for (var i = tmp.length-1; i >= 0; i--) {
	if (tmp[i] !== null) {
	    res = sc_cons(sc_jsstring2string(tmp[i]), res);
	} else {
	    res = sc_cons(false, res);
	}
    }
    return res;
}
   
/*** META ((export #t)) */
function sc_pregexpReplace(re, s1, s2) {
   var reg;
   var jss1 = sc_string2jsstring(s1);
   var jss2 = sc_string2jsstring(s2);

   if (re instanceof RegExp) {
       if (re.global)
	   reg = re;
       else
	   reg = new RegExp(re.source);
   } else {
       reg = new RegExp(sc_string2jsstring(re));
   }

   return jss1.replace(reg, jss2);
}
   
/*** META ((export pregexp-replace*)) */
function sc_pregexpReplaceAll(re, s1, s2) {
   var reg;
   var jss1 = sc_string2jsstring(s1);
   var jss2 = sc_string2jsstring(s2);

   if (re instanceof RegExp) {
      if (re.global)
	  reg = re;
      else
	  reg = new RegExp(re.source, "g");
   } else {
       reg = new RegExp(sc_string2jsstring(re), "g");
   }

   return jss1.replace(reg, jss2);
}

/*** META ((export #t)) */
function sc_pregexpSplit(re, s) {
   var reg = ((re instanceof RegExp) ?
	      re :
	      new RegExp(sc_string2jsstring(re)));
   var jss = sc_string2jsstring(s);
   var tmp = jss.split(reg);

   if (tmp == null) return false;

   return sc_vector2list(tmp);
}
   

/* =========================================================================== */
/* Other library stuff */
/* =========================================================================== */

/*** META ((export #t)
           (peephole (hole 1 "Math.floor(Math.random()*" 'n ")")))
*/
function sc_random(n) {
    return Math.floor(Math.random()*n);
}

/*** META ((export current-date)
           (peephole (hole 0 "new Date()")))
*/
function sc_currentDate() {
   return new Date();
}

function sc_Hashtable() {
}
sc_Hashtable.prototype.toString = function() {
    return "#{%hashtable}";
};
// sc_toWriteString == sc_toDisplayString == toString

function sc_HashtableElement(key, val) {
    this.key = key;
    this.val = val;
}

/*** META ((export #t)
           (peephole (hole 0 "new sc_Hashtable()")))
*/
function sc_makeHashtable() {
    return new sc_Hashtable();
}

/*** META ((export #t)) */
function sc_hashtablePutBang(ht, key, val) {
    var hash = sc_hash(key);
    ht[hash] = new sc_HashtableElement(key, val);
}

/*** META ((export #t)) */
function sc_hashtableGet(ht, key) {
    var hash = sc_hash(key);
    if (hash in ht)
	return ht[hash].val;
    else
	return false;
}

/*** META ((export #t)) */
function sc_hashtableForEach(ht, f) {
    for (var v in ht) {
	if (ht[v] instanceof sc_HashtableElement)
	    f(ht[v].key, ht[v].val);
    }
}

/*** META ((export hashtable-contains?)
           (peephole (hole 2 "sc_hash(" 1 ") in " 0)))
*/
function sc_hashtableContains(ht, key) {
    var hash = sc_hash(key);
    if (hash in ht)
	return true;
    else
	return false;
}

var SC_HASH_COUNTER = 0;

function sc_hash(o) {
    if (o === null)
	return "null";
    else if (o === undefined)
	return "undefined";
    else if (o === true)
	return "true";
    else if (o === false)
	return "false";
    else if (typeof o === "number")
	return "num-" + o;
    else if (typeof o === "string")
	return "jsstr-" + o;
    else if (o.sc_getHash)
	return o.sc_getHash();
    else
	return sc_counterHash.call(o);
}
function sc_counterHash() {
    if (!this.sc_hash) {
	this.sc_hash = "hash-" + SC_HASH_COUNTER;
	SC_HASH_COUNTER++;
    }
    return this.sc_hash;
}

function sc_Trampoline(args, maxTailCalls) {
    this['__trampoline return__'] = true;
    this.args = args;
    this.MAX_TAIL_CALLs = maxTailCalls;
}
// TODO: call/cc stuff
sc_Trampoline.prototype.restart = function() {
    var o = this;
    while (true) {
	// set both globals.
	SC_TAIL_OBJECT.calls = o.MAX_TAIL_CALLs-1;
	var fun = o.args.callee;
	var res = fun.apply(SC_TAIL_OBJECT, o.args);
	if (res instanceof sc_Trampoline)
	    o = res;
	else
	    return res;
    }
}

/*** META ((export bind-exit-lambda)) */
function sc_bindExitLambda(proc) {
    var escape_obj = new sc_BindExitException();
    var escape = function(res) {
	escape_obj.res = res;
	throw escape_obj;
    };
    try {
	return proc(escape);
    } catch(e) {
	if (e === escape_obj) {
	    return e.res;
	}
	throw e;
    }
}
function sc_BindExitException() {
    this._internalException = true;
}

var SC_SCM2JS_GLOBALS = new Object();

// default tail-call depth.
// normally the program should set it again. but just in case...
var SC_TAIL_OBJECT = new Object();
SC_SCM2JS_GLOBALS.TAIL_OBJECT = SC_TAIL_OBJECT;
// ======================== I/O =======================

/*------------------------------------------------------------------*/

function sc_EOF() {
}
var SC_EOF_OBJECT = new sc_EOF();

function sc_Port() {
}

/* --------------- Input ports -------------------------------------*/

function sc_InputPort() {
}
sc_InputPort.prototype = new sc_Port();

sc_InputPort.prototype.peekChar = function() {
    if (!("peeked" in this))
	this.peeked = this.getNextChar();
    return this.peeked;
}
sc_InputPort.prototype.readChar = function() {
    var tmp = this.peekChar();
    delete this.peeked;
    return tmp;
}
sc_InputPort.prototype.isCharReady = function() {
    return true;
}
sc_InputPort.prototype.close = function() {
    // do nothing
}

/* .............. String port ..........................*/
function sc_ErrorInputPort() {
};
sc_ErrorInputPort.prototype = new sc_InputPort();
sc_ErrorInputPort.prototype.getNextChar = function() {
    throw "can't read from error-port.";
};
sc_ErrorInputPort.prototype.isCharReady = function() {
    return false;
};
    

/* .............. String port ..........................*/

function sc_StringInputPort(jsStr) {
    // we are going to do some charAts on the str.
    // instead of recreating all the time a String-object, we
    // create one in the beginning. (not sure, if this is really an optim)
    this.str = new String(jsStr);
    this.pos = 0;
}
sc_StringInputPort.prototype = new sc_InputPort();
sc_StringInputPort.prototype.getNextChar = function() {
    if (this.pos >= this.str.length)
	return SC_EOF_OBJECT;
    return this.str.charAt(this.pos++);
};

/* ------------- Read and other lib-funs  -------------------------------*/
function sc_Token(type, val, pos) {
    this.type = type;
    this.val = val;
    this.pos = pos;
}
sc_Token.EOF = 0/*EOF*/;
sc_Token.OPEN_PAR = 1/*OPEN_PAR*/;
sc_Token.CLOSE_PAR = 2/*CLOSE_PAR*/;
sc_Token.OPEN_BRACE = 3/*OPEN_BRACE*/;
sc_Token.CLOSE_BRACE = 4/*CLOSE_BRACE*/;
sc_Token.OPEN_BRACKET = 5/*OPEN_BRACKET*/;
sc_Token.CLOSE_BRACKET = 6/*CLOSE_BRACKET*/;
sc_Token.WHITESPACE = 7/*WHITESPACE*/;
sc_Token.QUOTE = 8/*QUOTE*/;
sc_Token.ID = 9/*ID*/;
sc_Token.DOT = 10/*DOT*/;
sc_Token.STRING = 11/*STRING*/;
sc_Token.NUMBER = 12/*NUMBER*/;
sc_Token.ERROR = 13/*ERROR*/;
sc_Token.VECTOR_BEGIN = 14/*VECTOR_BEGIN*/;
sc_Token.TRUE = 15/*TRUE*/;
sc_Token.FALSE = 16/*FALSE*/;
sc_Token.UNSPECIFIED = 17/*UNSPECIFIED*/;
sc_Token.REFERENCE = 18/*REFERENCE*/;
sc_Token.STORE = 19/*STORE*/;
sc_Token.CHAR = 20/*CHAR*/;

var SC_ID_CLASS = SC_LOWER_CLASS + SC_UPPER_CLASS + "!$%*+-./:<=>?@^_~";
function sc_Tokenizer(port) {
    this.port = port;
}
sc_Tokenizer.prototype.peekToken = function() {
    if (this.peeked)
	return this.peeked;
    var newToken = this.nextToken();
    this.peeked = newToken;
    return newToken;
};
sc_Tokenizer.prototype.readToken = function() {
    var tmp = this.peekToken();
    delete this.peeked;
    return tmp;
};
sc_Tokenizer.prototype.nextToken = function() {
    var port = this.port;
    
    function isNumberChar(c) {
	return (c >= "0" && c <= "9");
    };
    function isIdOrNumberChar(c) {
	return SC_ID_CLASS.indexOf(c) != -1 || // ID-char
	    (c >= "0" && c <= "9");
    }
    function isWhitespace(c) {
	return c === " " || c === "\r" || c === "\n" || c === "\t" || c === "\f";
    };
    function isWhitespaceOrEOF(c) {
	return isWhitespace(c) || c === SC_EOF_OBJECT;
    };

    function readString() {
	res = "";
	while (true) {
	    var c = port.readChar();
	    switch (c) {
	    case '"':
		return new sc_Token(11/*STRING*/, res);
	    case "\\":
		var tmp = port.readChar();
		switch (tmp) {
		case '0': res += "\0"; break;
		case 'a': res += "\a"; break;
		case 'b': res += "\b"; break;
		case 'f': res += "\f"; break;
		case 'n': res += "\n"; break;
		case 'r': res += "\r"; break;
		case 't': res += "\t"; break;
		case 'v': res += "\v"; break;
		case '"': res += '"'; break;
		case '\\': res += '\\'; break;
		case 'x':
		    /* hexa-number */
		    var nb = 0;
		    while (true) {
			var hexC = port.peekChar();
			if (hexC >= '0' && hexC <= '9') {
			    port.readChar();
			    nb = nb * 16 + hexC.charCodeAt(0) - '0'.charCodeAt(0);
			} else if (hexC >= 'a' && hexC <= 'f') {
			    port.readChar();
			    nb = nb * 16 + hexC.charCodeAt(0) - 'a'.charCodeAt(0);
			} else if (hexC >= 'A' && hexC <= 'F') {
			    port.readChar();
			    nb = nb * 16 + hexC.charCodeAt(0) - 'A'.charCodeAt(0);
			} else {
			    // next char isn't part of hex.
			    res += String.fromCharCode(nb);
			    break;
			}
		    }
		    break;
		default:
		    if (tmp === SC_EOF_OBJECT) {
			return new sc_Token(13/*ERROR*/, "unclosed string-literal" + res);
		    }
		    res += tmp;
		}
		break;
	    default:
		if (c === SC_EOF_OBJECT) {
		    return new sc_Token(13/*ERROR*/, "unclosed string-literal" + res);
		}
		res += c;
	    }
	}
    };
    function readIdOrNumber(firstChar) {
	var res = firstChar;
	while (isIdOrNumberChar(port.peekChar()))
	    res += port.readChar();
	if (isNaN(res))
	    return new sc_Token(9/*ID*/, res);
	else
	    return new sc_Token(12/*NUMBER*/, res - 0);
    };
    
    function skipWhitespaceAndComments() {
	var done = false;
	while (!done) {
	    done = true;
	    while (isWhitespace(port.peekChar()))
		port.readChar();
	    if (port.peekChar() === ';') {
		port.readChar();
		done = false;
		while (true) {
		    curChar = port.readChar();
		    if (curChar === SC_EOF_OBJECT ||
			curChar === '\n')
			break;
		}
	    }
	}
    };
    
    function readDot() {
	if (isWhitespace(port.peekChar()))
	    return new sc_Token(10/*DOT*/);
	else
	    return readIdOrNumber(".");
    };

    function readSharp() {
	var c = port.readChar();
	if (isWhitespace(c))
	    return new sc_Token(13/*ERROR*/, "bad #-pattern0.");

	// reference
	if (isNumberChar(c)) {
	    var nb = c - 0;
	    while (isNumberChar(port.peekChar()))
		nb = nb*10 + (port.readChar() - 0);
	    switch (port.readChar()) {
	    case '#':
		return new sc_Token(18/*REFERENCE*/, nb);
	    case '=':
		return new sc_Token(19/*STORE*/, nb);
	    default:
		return new sc_Token(13/*ERROR*/, "bad #-pattern1." + nb);
	    }
	}

	if (c === "(")
	    return new sc_Token(14/*VECTOR_BEGIN*/);
	
	if (c === "\\") { // character
	    var tmp = ""
	    while (!isWhitespaceOrEOF(port.peekChar()))
		tmp += port.readChar();
	    switch (tmp.length) {
	    case 0: // it's escaping a whitespace char:
		if (sc_isEOFObject(port.peekChar))
		    return new sc_Token(13/*ERROR*/, "bad #-pattern2.");
		else
		    return new sc_Token(20/*CHAR*/, port.readChar());
	    case 1:
		return new sc_Token(20/*CHAR*/, tmp);
	    default:
		var entry = sc_Char.readable2char[tmp.toLowerCase()];
		if (entry)
		    return new sc_Token(20/*CHAR*/, entry);
		else
		    return new sc_Token(13/*ERROR*/, "unknown character description: #\\" + tmp);
	    }
	}

	// some constants (#t, #f, #unspecified)
	var res;
	var needing;
	switch (c) {
	case 't': res = new sc_Token(15/*TRUE*/, true); needing = ""; break;
	case 'f': res = new sc_Token(16/*FALSE*/, false); needing = ""; break;
	case 'u': res = new sc_Token(17/*UNSPECIFIED*/, undefined); needing = "nspecified"; break;
	default:
	    return new sc_Token(13/*ERROR*/, "bad #-pattern3: " + c);
	}
	while(true) {
	    c = port.peekChar();
	    if ((isWhitespaceOrEOF(c) || c === ')') &&
		needing == "")
		return res;
	    else if (isWhitespace(c) || needing == "")
		return new sc_Token(13/*ERROR*/, "bad #-pattern4 " + c + " " + needing);
	    else if (needing.charAt(0) == c) {
		port.readChar(); // consume
		needing = needing.slice(1);
	    } else
		return new sc_Token(13/*ERROR*/, "bad #-pattern5");
	}
	
    };

    skipWhitespaceAndComments();
    var curChar = port.readChar();
    if (curChar === SC_EOF_OBJECT)
	return new sc_Token(0/*EOF*/, curChar);
    switch (curChar)
    {
    case " ":
    case "\n":
    case "\t":
	return readWhitespace();
    case "(":
	return new sc_Token(1/*OPEN_PAR*/);
    case ")":
	return new sc_Token(2/*CLOSE_PAR*/);
    case "{":
	return new sc_Token(3/*OPEN_BRACE*/);
    case "}":
	return new sc_Token(4/*CLOSE_BRACE*/);
    case "[":
	return new sc_Token(5/*OPEN_BRACKET*/);
    case "]":
	return new sc_Token(6/*CLOSE_BRACKET*/);
    case "'":
	return new sc_Token(8/*QUOTE*/);
    case "#":
	return readSharp();
    case ".":
	return readDot();
    case '"':
	return readString();
    default:
	if (isIdOrNumberChar(curChar))
	    return readIdOrNumber(curChar);
	throw "unexpected character: " + curChar;
    }
};

function sc_Reader(tokenizer) {
    this.tokenizer = tokenizer;
    this.backref = new Array();
}
sc_Reader.prototype.read = function() {
    function readList(listBeginType) {
	function matchesPeer(open, close) {
	    return open === 1/*OPEN_PAR*/ && close === 2/*CLOSE_PAR*/
	    	|| open === 3/*OPEN_BRACE*/ && close === 4/*CLOSE_BRACE*/
		|| open === 5/*OPEN_BRACKET*/ && close === 6/*CLOSE_BRACKET*/;
	};
	var res = null;

	while (true) {
	    var token = tokenizer.peekToken();
	    
	    switch (token.type) {
	    case 2/*CLOSE_PAR*/:
	    case 4/*CLOSE_BRACE*/:
	    case 6/*CLOSE_BRACKET*/:
		if (matchesPeer(listBeginType, token.type)) {
		    tokenizer.readToken(); // consume token
		    return sc_reverseBang(res);
		} else
		    throw "closing par doesn't match: " + listBeginType
			+ " " + listEndType;

	    case 0/*EOF*/:
		throw "unexpected end of file";

	    case 10/*DOT*/:
		tokenizer.readToken(); // consume token
		var cdr = this.read();
		var par = tokenizer.readToken();
		if (!matchesPeer(listBeginType, par.type))
		    throw "closing par doesn't match: " + listBeginType
			+ " " + par.type;
		else
		    return sc_reverseAppendBang(res, cdr);
		

	    default:
		res = sc_cons(this.read(), res);
	    }
	}
    };
    function readQuote() {
	return sc_cons("quote", sc_cons(this.read(), null));
    };
    function readVector() {
	// opening-parenthesis is already consumed
	var a = new Array();
	while (true) {
	    var token = tokenizer.peekToken();
	    switch (token.type) {
	    case 2/*CLOSE_PAR*/:
		tokenizer.readToken();
		return a;
		
	    default:
		a.push(this.read());
	    }
	}
    };

    function storeRefence(nb) {
	var tmp = this.read();
	this.backref[nb] = tmp;
	return tmp;
    };
	
    function readReference(nb) {
	if (nb in this.backref)
	    return this.backref[nb];
	else
	    throw "bad reference: " + nb;
    };
    
    var tokenizer = this.tokenizer;

    var token = tokenizer.readToken();

    // handle error
    if (token.type === 13/*ERROR*/)
	throw token.val;
    
    switch (token.type) {
    case 1/*OPEN_PAR*/:
    case 3/*OPEN_BRACE*/:
    case 5/*OPEN_BRACKET*/:
	return readList.call(this, token.type);
    case 8/*QUOTE*/:
	return readQuote.call(this);
    case 11/*STRING*/:
	return sc_jsstring2string(token.val);
    case 20/*CHAR*/:
	return new sc_Char(token.val);
    case 14/*VECTOR_BEGIN*/:
	return readVector.call(this);
    case 18/*REFERENCE*/:
	return readReference.call(this, token.val);
    case 19/*STORE*/:
	return storeRefence.call(this, token.val);
    case 9/*ID*/:
	return sc_jsstring2symbol(token.val);
    case 0/*EOF*/:
    case 12/*NUMBER*/:
    case 15/*TRUE*/:
    case 16/*FALSE*/:
    case 17/*UNSPECIFIED*/:
	return token.val;
    default:
	throw "unexpected token " + token.type + " " + token.val;
    }
};

/*** META ((export #t)) */
function sc_read(port) {
    if (port === undefined) // we assume the port hasn't been given.
	port = SC_DEFAULT_IN; // THREAD: shared var...
    var reader = new sc_Reader(new sc_Tokenizer(port));
    return reader.read();
}
/*** META ((export #t)) */
function sc_readChar(port) {
    if (port === undefined) // we assume the port hasn't been given.
	port = SC_DEFAULT_IN; // THREAD: shared var...
    var t = port.readChar();
    return t === SC_EOF_OBJECT? t: new sc_Char(t);
}
/*** META ((export #t)) */
function sc_peekChar(port) {
    if (port === undefined) // we assume the port hasn't been given.
	port = SC_DEFAULT_IN; // THREAD: shared var...
    var t = port.peekChar();
    return t === SC_EOF_OBJECT? t: new sc_Char(t);
}    
/*** META ((export #t)
           (type bool))
*/
function sc_isCharReady(port) {
    if (port === undefined) // we assume the port hasn't been given.
	port = SC_DEFAULT_IN; // THREAD: shared var...
    return port.isCharReady();
}
/*** META ((export #t)
           (peephole (postfix ".close()")))
*/
function sc_closeInputPort(p) {
    return p.close();
}

/*** META ((export #t)
           (type bool)
           (peephole (postfix " instanceof sc_InputPort")))
*/
function sc_isInputPort(o) {
    return (o instanceof sc_InputPort);
}

/*** META ((export eof-object?)
           (type bool)
           (peephole (postfix " === SC_EOF_OBJECT")))
*/
function sc_isEOFObject(o) {
    return o === SC_EOF_OBJECT;
}

/*** META ((export #t)
           (peephole (hole 0 "SC_DEFAULT_IN")))
*/
function sc_currentInputPort() {
    return SC_DEFAULT_IN;
}

/* ------------ file operations are not supported -----------*/
/*** META ((export #t)) */
function sc_callWithInputFile(s, proc) {
    throw "can't open " + s;
}

/*** META ((export #t)) */
function sc_callWithOutputFile(s, proc) {
    throw "can't open " + s;
}

/*** META ((export #t)) */
function sc_withInputFromFile(s, thunk) {
    throw "can't open " + s;
}

/*** META ((export #t)) */
function sc_withOutputToFile(s, thunk) {
    throw "can't open " + s;
}

/*** META ((export #t)) */
function sc_openInputFile(s) {
    throw "can't open " + s;
}

/*** META ((export #t)) */
function sc_openOutputFile(s) {
    throw "can't open " + s;
}

/* ----------------------------------------------------------------------------*/
/*** META ((export #t)) */
function sc_basename(p) {
   var i = p.lastIndexOf('/');

   if(i >= 0)
      return p.substring(i + 1, p.length);
   else
      return '';
}

/*** META ((export #t)) */
function sc_dirname(p) {
   var i = p.lastIndexOf('/');

   if(i >= 0)
      return p.substring(0, i);
   else
      return '';
}

/* ----------------------------------------------------------------------------*/

/*** META ((export #t)) */
function sc_withInputFromPort(p, thunk) {
    try {
	var tmp = SC_DEFAULT_IN; // THREAD: shared var.
	SC_DEFAULT_IN = p;
	return thunk();
    } finally {
	SC_DEFAULT_IN = tmp;
    }
}

/*** META ((export #t)) */
function sc_withInputFromString(s, thunk) {
    return sc_withInputFromPort(new sc_StringInputPort(sc_string2jsstring(s)), thunk);
}

/*** META ((export #t)) */
function sc_withOutputToPort(p, thunk) {
    try {
	var tmp = SC_DEFAULT_OUT; // THREAD: shared var.
	SC_DEFAULT_OUT = p;
	return thunk();
    } finally {
	SC_DEFAULT_OUT = tmp;
    }
}

/*** META ((export #t)) */
function sc_withOutputToString(thunk) {
    var p = new sc_StringOutputPort();
    sc_withOutputToPort(p, thunk);
    return p.close();
}

/*** META ((export #t)) */
function sc_withOutputToProcedure(proc, thunk) {
    var t = function(s) { proc(sc_jsstring2string(s)); };
    return sc_withOutputToPort(new sc_GenericOutputPort(t), thunk);
}

/*** META ((export #t)
           (peephole (hole 0 "new sc_StringOutputPort()")))
*/
function sc_openOutputString() {
    return new sc_StringOutputPort();
}

/*** META ((export #t)) */
function sc_openInputString(str) {
    return new sc_StringInputPort(sc_string2jsstring(str));
}

/* ----------------------------------------------------------------------------*/

function sc_OutputPort() {
}
sc_OutputPort.prototype = new sc_Port();
sc_OutputPort.prototype.appendJSString = function(obj) {
    /* do nothing */
}
sc_OutputPort.prototype.close = function() {
    /* do nothing */
}

function sc_StringOutputPort() {
    this.res = "";
}
sc_StringOutputPort.prototype = new sc_OutputPort();
sc_StringOutputPort.prototype.appendJSString = function(s) {
    this.res += s;
}
sc_StringOutputPort.prototype.close = function() {
    return sc_jsstring2string(this.res);
}

/*** META ((export #t)) */
function sc_getOutputString(sp) {
    return sc_jsstring2string(sp.res);
}
    

function sc_ErrorOutputPort() {
}
sc_ErrorOutputPort.prototype = new sc_OutputPort();
sc_ErrorOutputPort.prototype.appendJSString = function(s) {
    throw "don't write on ErrorPort!";
}
sc_ErrorOutputPort.prototype.close = function() {
    /* do nothing */
}

function sc_GenericOutputPort(appendJSString, close) {
    this.appendJSString = appendJSString;
    if (close)
	this.close = close;
}
sc_GenericOutputPort.prototype = new sc_OutputPort();

/*** META ((export #t)
           (type bool)
           (peephole (postfix " instanceof sc_OutputPort")))
*/
function sc_isOutputPort(o) {
    return (o instanceof sc_OutputPort);
}

/*** META ((export #t)
           (peephole (postfix ".close()")))
*/
function sc_closeOutputPort(p) {
    return p.close();
}

/* ------------------ write ---------------------------------------------------*/

/*** META ((export #t)) */
function sc_write(o, p) {
    if (p === undefined) // we assume not given
	p = SC_DEFAULT_OUT;
    p.appendJSString(sc_toWriteString(o));
}

function sc_toWriteString(o) {
    if (o === null)
	return "()";
    else if (o === true)
	return "#t";
    else if (o === false)
	return "#f";
    else if (o === undefined)
	return "#unspecified";
    else if (typeof o === 'function')
	return "#<procedure " + sc_hash(o) + ">";
    else if (o.sc_toWriteString)
	return o.sc_toWriteString();
    else
	return o.toString();
}

function sc_escapeWriteString(s) {
    var res = "";
    var j = 0;
    for (i = 0; i < s.length; i++) {
	switch (s.charAt(i)) {
	case "\0": res += s.substring(j, i) + "\\0"; j = i + 1; break;
	case "\b": res += s.substring(j, i) + "\\b"; j = i + 1; break;
	case "\f": res += s.substring(j, i) + "\\f"; j = i + 1; break;
	case "\n": res += s.substring(j, i) + "\\n"; j = i + 1; break;
	case "\r": res += s.substring(j, i) + "\\r"; j = i + 1; break;
	case "\t": res += s.substring(j, i) + "\\t"; j = i + 1; break;
	case "\v": res += s.substring(j, i) + "\\v"; j = i + 1; break;
	case '"': res += s.substring(j, i) + '\\"'; j = i + 1; break;
	case "\\": res += s.substring(j, i) + "\\\\"; j = i + 1; break;
	default:
	    var c = s.charAt(i);
	    if ("\a" !== "a" && c == "\a") {
		res += s.substring(j, i) + "\\a"; j = i + 1; continue;
	    }
	    if ("\v" !== "v" && c == "\v") {
		res += s.substring(j, i) + "\\v"; j = i + 1; continue;
	    }
	    //if (s.charAt(i) < ' ' || s.charCodeAt(i) > 127) {
	    // CARE: Manuel is this OK with HOP?
	    if (s.charAt(i) < ' ') {
		/* non printable character and special chars */
		res += s.substring(j, i) + "\\x" + s.charCodeAt(i).toString(16);
		j = i + 1;
	    }
	    // else just let i increase...
	}
    }
    res += s.substring(j, i);
    return res;
}

/* ------------------ display ---------------------------------------------------*/

/*** META ((export #t)) */
function sc_display(o, p) {
    if (p === undefined) // we assume not given
	p = SC_DEFAULT_OUT;
    p.appendJSString(sc_toDisplayString(o));
}

function sc_toDisplayString(o) {
    if (o === null)
	return "()";
    else if (o === true)
	return "#t";
    else if (o === false)
	return "#f";
    else if (o === undefined)
	return "#unspecified";
    else if (typeof o === 'function')
	return "#<procedure " + sc_hash(o) + ">";
    else if (o.sc_toDisplayString)
	return o.sc_toDisplayString();
    else
	return o.toString();
}

/* ------------------ newline ---------------------------------------------------*/

/*** META ((export #t)) */
function sc_newline(p) {
    if (p === undefined) // we assume not given
	p = SC_DEFAULT_OUT;
    p.appendJSString("\n");
}
    
/* ------------------ write-char ---------------------------------------------------*/

/*** META ((export #t)) */
function sc_writeChar(c, p) {
    if (p === undefined) // we assume not given
	p = SC_DEFAULT_OUT;
    p.appendJSString(c.val);
}

/* ------------------ write-circle ---------------------------------------------------*/

/*** META ((export #t)) */
function sc_writeCircle(o, p) {
    if (p === undefined) // we assume not given
	p = SC_DEFAULT_OUT;
    p.appendJSString(sc_toWriteCircleString(o));
}

function sc_toWriteCircleString(o) {
    var symb = sc_gensym("writeCircle");
    var nbPointer = new Object();
    nbPointer.nb = 0;
    sc_prepWriteCircle(o, symb, nbPointer);
    return sc_genToWriteCircleString(o, symb);
}

function sc_prepWriteCircle(o, symb, nbPointer) {
    // TODO sc_Struct
    if (o instanceof sc_Pair ||
	o instanceof sc_Vector) {
	if (o[symb] !== undefined) {
	    // not the first visit.
	    o[symb]++;
	    // unless there is already a number, assign one.
	    if (!o[symb + "nb"]) o[symb + "nb"] = nbPointer.nb++;
	    return;
	}
	o[symb] = 0;
	if (o instanceof sc_Pair) {
	    sc_prepWriteCircle(o.car, symb, nbPointer);
	    sc_prepWriteCircle(o.cdr, symb, nbPointer);
	} else {
	    for (var i = 0; i < o.length; i++)
		sc_prepWriteCircle(o[i], symb, nbPointer);
	}
    }
}

function sc_genToWriteCircleString(o, symb) {
    if (!(o instanceof sc_Pair ||
	  o instanceof sc_Vector))
	return sc_toWriteString(o);
    return o.sc_toWriteCircleString(symb);
}
sc_Pair.prototype.sc_toWriteCircleString = function(symb, inList) {
    if (this[symb + "use"]) { // use-flag is set. Just use it.
	var nb = this[symb + "nb"];
	if (this[symb]-- === 0) { // if we are the last use. remove all fields.
	    delete this[symb];
	    delete this[symb + "nb"];
	    delete this[symb + "use"];
	}
	if (inList)
	    return '. #' + nb + '#';
	else
	    return '#' + nb + '#';
    }
    if (this[symb]-- === 0) { // if we are the last use. remove all fields.
	delete this[symb];
	delete this[symb + "nb"];
	delete this[symb + "use"];
    }

    var res = "";
    
    if (this[symb] !== undefined) { // implies > 0
	this[symb + "use"] = true;
	if (inList)
	    res += '. #' + this[symb + "nb"] + '=';
	else
	    res += '#' + this[symb + "nb"] + '=';
	inList = false;
    }

    if (!inList)
	res += "(";
    
    // print car
    res += sc_genToWriteCircleString(this.car, symb);
    
    if (sc_isPair(this.cdr)) {
	res += " " + this.cdr.sc_toWriteCircleString(symb, true);
    } else if (this.cdr !== null) {
	res += " . " + sc_genToWriteCircleString(this.cdr, symb);
    }
    if (!inList)
	res += ")";
    return res;
};
sc_Vector.prototype.sc_toWriteCircleString = function(symb) {
    if (this[symb + "use"]) { // use-flag is set. Just use it.
	var nb = this[symb + "nb"];
	if (this[symb]-- === 0) { // if we are the last use. remove all fields.
	    delete this[symb];
	    delete this[symb + "nb"];
	    delete this[symb + "use"];
	}
	return '#' + nb + '#';
    }
    if (this[symb]-- === 0) { // if we are the last use. remove all fields.
	delete this[symb];
	delete this[symb + "nb"];
	delete this[symb + "use"];
    }

    var res = "";
    if (this[symb] !== undefined) { // implies > 0
	this[symb + "use"] = true;
	res += '#' + this[symb + "nb"] + '=';
    }
    res += "#(";
    for (var i = 0; i < this.length; i++) {
	res += sc_genToWriteCircleString(this[i], symb);
	if (i < this.length - 1) res += " ";
    }
    res += ")";
    return res;
};


/* ------------------ print ---------------------------------------------------*/

/*** META ((export #t)) */
function sc_print(s) {
    if (arguments.length === 1) {
	sc_display(s);
	sc_newline();
    }
    else {
	for (var i = 0; i < arguments.length; i++)
	    sc_display(arguments[i]);
	sc_newline();
    }
}

/* ------------------ format ---------------------------------------------------*/
/*** META ((export #t)) */
function sc_format(s, args) {
   var len = s.length;
   var p = new sc_StringOutputPort();
   var i = 0, j = 1;

   while( i < len ) {
      var i2 = s.indexOf("~", i);

      if (i2 == -1) {
	  p.appendJSString( s.substring( i, len ) );
	  return p.close();
      } else {
	 if (i2 > i) {
	    if (i2 == (len - 1)) {
		p.appendJSString(s.substring(i, len));
		return p.close();
	    } else {
	       p.appendJSString(s.substring(i, i2));
	       i = i2;
	    }
	 }

	 switch(s.charCodeAt(i2 + 1)) {
	    case 65:
	    case 97:
	       // a
	       sc_display(arguments[j], p);
	       i += 2; j++;
	       break;

	    case 83:
	    case 115:
	       // s
	       sc_write(arguments[j], p);
	       i += 2; j++;
	       break;

	    case 86:
	    case 118:
	       // v
	       sc_display(arguments[j], p);
	       p.appendJSString("\n");
	       i += 2; j++;
	       break;

	    case 67:
	    case 99:
	       // c
	       p.appendJSString(String.fromCharCode(arguments[j]));
	       i += 2; j++;
	       break;

	    case 88:
	    case 120:
	       // x
	       p.appendJSString(arguments[j].toString(6));
	       i += 2; j++;
	       break;

	    case 79:
	    case 111:
	       // o
	       p.appendJSString(arguments[j].toString(8));
	       i += 2; j++;
	       break;

	    case 66:
	    case 98:
	       // b
	       p.appendJSString(arguments[j].toString(2));
	       i += 2; j++;
	       break;
	       
	    case 37:
	    case 110:
	       // %, n
	       p.appendJSString("\n");
	       i += 2; break;

	    case 114:
	       // r
	       p.appendJSString("\r");
	       i += 2; break;

	    case 126:
	       // ~
	       p.appendJSString("~");
	       i += 2; break;

	    default:
	       sc_error( "format: illegal ~"
			 + String.fromCharCode(s.charCodeAt(i2 + 1))
			 + " sequence" );
	       return "";
	 }
      }
   }

   return p.close();
}

/* ------------------ global ports ---------------------------------------------------*/

var SC_DEFAULT_IN = new sc_ErrorInputPort();
var SC_DEFAULT_OUT = new sc_ErrorOutputPort();
var SC_ERROR_OUT = new sc_ErrorOutputPort();

var sc_SYMBOL_PREFIX = "\u1E9C";
var sc_KEYWORD_PREFIX = "\u1E9D";

/*** META ((export #t)
           (peephole (id))) */
function sc_jsstring2string(s) {
    return s;
}

/*** META ((export #t)
           (peephole (prefix "'\\u1E9C' +")))
*/
function sc_jsstring2symbol(s) {
    return sc_SYMBOL_PREFIX + s;
}

/*** META ((export #t)
           (peephole (id)))
*/
function sc_string2jsstring(s) {
    return s;
}

/*** META ((export #t)
           (peephole (symbol2jsstring_immutable)))
*/
function sc_symbol2jsstring(s) {
    return s.slice(1);
}

/*** META ((export #t)
           (peephole (postfix ".slice(1)")))
*/
function sc_keyword2jsstring(k) {
    return k.slice(1);
}

/*** META ((export #t)
           (peephole (prefix "'\\u1E9D' +")))
*/
function sc_jsstring2keyword(s) {
    return sc_KEYWORD_PREFIX + s;
}

/*** META ((export #t)
           (type bool))
*/
function sc_isKeyword(s) {
    return (typeof s === "string") &&
	(s.charAt(0) === sc_KEYWORD_PREFIX);
}


/*** META ((export #t)) */
var sc_gensym = function() {
    var counter = 1000;
    return function(sym) {
	counter++;
	if (!sym) sym = sc_SYMBOL_PREFIX;
	return sym + "s" + counter + "~" + "^sC-GeNsYm ";
    };
}();


/*** META ((export #t)
           (type bool))
*/
function sc_isEqual(o1, o2) {
    return ((o1 === o2) ||
	    (sc_isPair(o1) && sc_isPair(o2)
	     && sc_isPairEqual(o1, o2, sc_isEqual)) ||
	    (sc_isVector(o1) && sc_isVector(o2)
	     && sc_isVectorEqual(o1, o2, sc_isEqual)));
}

/*** META ((export number->symbol integer->symbol)) */
function sc_number2symbol(x, radix) {
    return sc_SYMBOL_PREFIX + sc_number2jsstring(x, radix);
}
    
/*** META ((export number->string integer->string)) */
var sc_number2string = sc_number2jsstring;

/*** META ((export #t)) */
function sc_symbol2number(s, radix) {
    return sc_jsstring2number(s.slice(1), radix);
}

/*** META ((export #t)) */
var sc_string2number = sc_jsstring2number;

/*** META ((export #t)
           (peephole (prefix "+" s)))
           ;; peephole will only apply if no radix is given.
*/
function sc_string2integer(s, radix) {
    if (!radix) return +s;
    return parseInt(s, radix);
}

/*** META ((export #t)
           (peephole (prefix "+")))
*/
function sc_string2real(s) {
    return +s;
}


/*** META ((export #t)
           (type bool))
*/
function sc_isSymbol(s) {
    return (typeof s === "string") &&
	(s.charAt(0) === sc_SYMBOL_PREFIX);
}

/*** META ((export #t)
           (peephole (symbol2string_immutable)))
*/
function sc_symbol2string(s) {
    return s.slice(1);
}

/*** META ((export #t)
           (peephole (prefix "'\\u1E9C' +")))
*/
function sc_string2symbol(s) {
    return sc_SYMBOL_PREFIX + s;
}

/*** META ((export symbol-append)
           (peephole (symbolAppend_immutable)))
*/
function sc_symbolAppend() {
    var res = sc_SYMBOL_PREFIX;
    for (var i = 0; i < arguments.length; i++)
	res += arguments[i].slice(1);
    return res;
}

/*** META ((export #t)
           (peephole (postfix ".val")))
*/
function sc_char2string(c) { return c.val; }

/*** META ((export #t)
           (peephole (hole 1 "'\\u1E9C' + " c ".val")))
*/
function sc_char2symbol(c) { return sc_SYMBOL_PREFIX + c.val; }

/*** META ((export #t)
           (type bool))
*/
function sc_isString(s) {
    return (typeof s === "string") &&
	(s.charAt(0) !== sc_SYMBOL_PREFIX);
}

/*** META ((export #t)) */
var sc_makeString = sc_makejsString;


/*** META ((export #t)) */
function sc_string() {
    for (var i = 0; i < arguments.length; i++)
	arguments[i] = arguments[i].val;
    return "".concat.apply("", arguments);
}

/*** META ((export #t)
           (peephole (postfix ".length")))
*/
function sc_stringLength(s) { return s.length; }

/*** META ((export #t)) */
function sc_stringRef(s, k) {
    return new sc_Char(s.charAt(k));
}

/* there's no stringSet in the immutable version
function sc_stringSet(s, k, c)
*/


/*** META ((export string=?)
	   (type bool)
           (peephole (hole 2 str1 " === " str2)))
*/
function sc_isStringEqual(s1, s2) {
    return s1 === s2;
}
/*** META ((export string<?)
	   (type bool)
           (peephole (hole 2 str1 " < " str2)))
*/
function sc_isStringLess(s1, s2) {
    return s1 < s2;
}
/*** META ((export string>?)
	   (type bool)
           (peephole (hole 2 str1 " > " str2)))
*/
function sc_isStringGreater(s1, s2) {
    return s1 > s2;
}
/*** META ((export string<=?)
	   (type bool)
           (peephole (hole 2 str1 " <= " str2)))
*/
function sc_isStringLessEqual(s1, s2) {
    return s1 <= s2;
}
/*** META ((export string>=?)
	   (type bool)
           (peephole (hole 2 str1 " >= " str2)))
*/
function sc_isStringGreaterEqual(s1, s2) {
    return s1 >= s2;
}
/*** META ((export string-ci=?)
	   (type bool)
           (peephole (hole 2 str1 ".toLowerCase() === " str2 ".toLowerCase()")))
*/
function sc_isStringCIEqual(s1, s2) {
    return s1.toLowerCase() === s2.toLowerCase();
}
/*** META ((export string-ci<?)
	   (type bool)
           (peephole (hole 2 str1 ".toLowerCase() < " str2 ".toLowerCase()")))
*/
function sc_isStringCILess(s1, s2) {
    return s1.toLowerCase() < s2.toLowerCase();
}
/*** META ((export string-ci>?)
	   (type bool)
           (peephole (hole 2 str1 ".toLowerCase() > " str2 ".toLowerCase()")))
*/
function sc_isStringCIGreater(s1, s2) {
    return s1.toLowerCase() > s2.toLowerCase();
}
/*** META ((export string-ci<=?)
	   (type bool)
           (peephole (hole 2 str1 ".toLowerCase() <= " str2 ".toLowerCase()")))
*/
function sc_isStringCILessEqual(s1, s2) {
    return s1.toLowerCase() <= s2.toLowerCase();
}
/*** META ((export string-ci>=?)
	   (type bool)
           (peephole (hole 2 str1 ".toLowerCase() >= " str2 ".toLowerCase()")))
*/
function sc_isStringCIGreaterEqual(s1, s2) {
    return s1.toLowerCase() >= s2.toLowerCase();
}

/*** META ((export #t)
           (peephole (hole 3 s ".substring(" start ", " end ")")))
*/
function sc_substring(s, start, end) {
    return s.substring(start, end);
}

/*** META ((export #t))
*/
function sc_isSubstring_at(s1, s2, i) {
    return s2 == s1.substring(i, i+ s2.length);
}

/*** META ((export #t)
           (peephole (infix 0 #f "+" "''")))
*/
function sc_stringAppend() {
    return "".concat.apply("", arguments);
}

/*** META ((export #t)) */
var sc_string2list = sc_jsstring2list;

/*** META ((export #t)) */
var sc_list2string = sc_list2jsstring;

/*** META ((export #t)
           (peephole (id)))
*/
function sc_stringCopy(s) {
    return s;
}

/* there's no string-fill in the immutable version
function sc_stringFill(s, c)
*/

/*** META ((export #t)
           (peephole (postfix ".slice(1)")))
*/
function sc_keyword2string(o) {
    return o.slice(1);
}

/*** META ((export #t)
           (peephole (prefix "'\\u1E9D' +")))
*/
function sc_string2keyword(o) {
    return sc_KEYWORD_PREFIX + o;
}

String.prototype.sc_toDisplayString = function() {
    if (this.charAt(0) === sc_SYMBOL_PREFIX)
	// TODO: care for symbols with spaces (escape-chars symbols).
	return this.slice(1);
    else if (this.charAt(0) === sc_KEYWORD_PREFIX)
	return ":" + this.slice(1);
    else
	return this.toString();
};

String.prototype.sc_toWriteString = function() {
    if (this.charAt(0) === sc_SYMBOL_PREFIX)
	// TODO: care for symbols with spaces (escape-chars symbols).
	return this.slice(1);
    else if (this.charAt(0) === sc_KEYWORD_PREFIX)
	return ":" + this.slice(1);
    else
	return '"' + sc_escapeWriteString(this) + '"';
};
/* Exported Variables */
var BgL_testzd2boyerzd2;
var BgL_nboyerzd2benchmarkzd2;
var BgL_setupzd2boyerzd2;
/* End Exports */

var translate_term_nboyer;
var translate_args_nboyer;
var untranslate_term_nboyer;
var BgL_sc_symbolzd2ze3symbolzd2record_1ze3_nboyer;
var BgL_sc_za2symbolzd2recordszd2alistza2_2z00_nboyer;
var translate_alist_nboyer;
var apply_subst_nboyer;
var apply_subst_lst_nboyer;
var tautologyp_nboyer;
var if_constructor_nboyer;
var rewrite_count_nboyer;
var rewrite_nboyer;
var rewrite_args_nboyer;
var unify_subst_nboyer;
var one_way_unify1_nboyer;
var false_term_nboyer;
var true_term_nboyer;
var trans_of_implies1_nboyer;
var is_term_equal_nboyer;
var is_term_member_nboyer;
var const_nboyer;
var sc_const_3_nboyer;
var sc_const_4_nboyer;
{
    (sc_const_4_nboyer = (new sc_Pair("\u1E9Cimplies",(new sc_Pair((new sc_Pair("\u1E9Cand",(new sc_Pair((new sc_Pair("\u1E9Cimplies",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cy",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cand",(new sc_Pair((new sc_Pair("\u1E9Cimplies",(new sc_Pair("\u1E9Cy",(new sc_Pair("\u1E9Cz",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cand",(new sc_Pair((new sc_Pair("\u1E9Cimplies",(new sc_Pair("\u1E9Cz",(new sc_Pair("\u1E9Cu",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cimplies",(new sc_Pair("\u1E9Cu",(new sc_Pair("\u1E9Cw",null)))))),null)))))),null)))))),null)))))),(new sc_Pair((new sc_Pair("\u1E9Cimplies",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cw",null)))))),null)))))));
    (sc_const_3_nboyer = sc_list((new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Ccompile",(new sc_Pair("\u1E9Cform",null)))),(new sc_Pair((new sc_Pair("\u1E9Creverse",(new sc_Pair((new sc_Pair("\u1E9Ccodegen",(new sc_Pair((new sc_Pair("\u1E9Coptimize",(new sc_Pair("\u1E9Cform",null)))),(new sc_Pair((new sc_Pair("\u1E9Cnil",null)),null)))))),null)))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Ceqp",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cy",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cfix",(new sc_Pair("\u1E9Cx",null)))),(new sc_Pair((new sc_Pair("\u1E9Cfix",(new sc_Pair("\u1E9Cy",null)))),null)))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cgreaterp",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cy",null)))))),(new sc_Pair((new sc_Pair("\u1E9Clessp",(new sc_Pair("\u1E9Cy",(new sc_Pair("\u1E9Cx",null)))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Clesseqp",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cy",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cnot",(new sc_Pair((new sc_Pair("\u1E9Clessp",(new sc_Pair("\u1E9Cy",(new sc_Pair("\u1E9Cx",null)))))),null)))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cgreatereqp",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cy",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cnot",(new sc_Pair((new sc_Pair("\u1E9Clessp",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cy",null)))))),null)))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cboolean",(new sc_Pair("\u1E9Cx",null)))),(new sc_Pair((new sc_Pair("\u1E9Cor",(new sc_Pair((new sc_Pair("\u1E9Cequal",(new sc_Pair("\u1E9Cx",(new sc_Pair((new sc_Pair("\u1E9Ct",null)),null)))))),(new sc_Pair((new sc_Pair("\u1E9Cequal",(new sc_Pair("\u1E9Cx",(new sc_Pair((new sc_Pair("\u1E9Cf",null)),null)))))),null)))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Ciff",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cy",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cand",(new sc_Pair((new sc_Pair("\u1E9Cimplies",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cy",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cimplies",(new sc_Pair("\u1E9Cy",(new sc_Pair("\u1E9Cx",null)))))),null)))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Ceven1",(new sc_Pair("\u1E9Cx",null)))),(new sc_Pair((new sc_Pair("\u1E9Cif",(new sc_Pair((new sc_Pair("\u1E9Czerop",(new sc_Pair("\u1E9Cx",null)))),(new sc_Pair((new sc_Pair("\u1E9Ct",null)),(new sc_Pair((new sc_Pair("\u1E9Codd",(new sc_Pair((new sc_Pair("\u1E9Csub1",(new sc_Pair("\u1E9Cx",null)))),null)))),null)))))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Ccountps-",(new sc_Pair("\u1E9Cl",(new sc_Pair("\u1E9Cpred",null)))))),(new sc_Pair((new sc_Pair("\u1E9Ccountps-loop",(new sc_Pair("\u1E9Cl",(new sc_Pair("\u1E9Cpred",(new sc_Pair((new sc_Pair("\u1E9Czero",null)),null)))))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cfact-",(new sc_Pair("\u1E9Ci",null)))),(new sc_Pair((new sc_Pair("\u1E9Cfact-loop",(new sc_Pair("\u1E9Ci",(new sc_Pair((1),null)))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Creverse-",(new sc_Pair("\u1E9Cx",null)))),(new sc_Pair((new sc_Pair("\u1E9Creverse-loop",(new sc_Pair("\u1E9Cx",(new sc_Pair((new sc_Pair("\u1E9Cnil",null)),null)))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cdivides",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cy",null)))))),(new sc_Pair((new sc_Pair("\u1E9Czerop",(new sc_Pair((new sc_Pair("\u1E9Cremainder",(new sc_Pair("\u1E9Cy",(new sc_Pair("\u1E9Cx",null)))))),null)))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cassume-true",(new sc_Pair("\u1E9Cvar",(new sc_Pair("\u1E9Calist",null)))))),(new sc_Pair((new sc_Pair("\u1E9Ccons",(new sc_Pair((new sc_Pair("\u1E9Ccons",(new sc_Pair("\u1E9Cvar",(new sc_Pair((new sc_Pair("\u1E9Ct",null)),null)))))),(new sc_Pair("\u1E9Calist",null)))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cassume-false",(new sc_Pair("\u1E9Cvar",(new sc_Pair("\u1E9Calist",null)))))),(new sc_Pair((new sc_Pair("\u1E9Ccons",(new sc_Pair((new sc_Pair("\u1E9Ccons",(new sc_Pair("\u1E9Cvar",(new sc_Pair((new sc_Pair("\u1E9Cf",null)),null)))))),(new sc_Pair("\u1E9Calist",null)))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Ctautology-checker",(new sc_Pair("\u1E9Cx",null)))),(new sc_Pair((new sc_Pair("\u1E9Ctautologyp",(new sc_Pair((new sc_Pair("\u1E9Cnormalize",(new sc_Pair("\u1E9Cx",null)))),(new sc_Pair((new sc_Pair("\u1E9Cnil",null)),null)))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cfalsify",(new sc_Pair("\u1E9Cx",null)))),(new sc_Pair((new sc_Pair("\u1E9Cfalsify1",(new sc_Pair((new sc_Pair("\u1E9Cnormalize",(new sc_Pair("\u1E9Cx",null)))),(new sc_Pair((new sc_Pair("\u1E9Cnil",null)),null)))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cprime",(new sc_Pair("\u1E9Cx",null)))),(new sc_Pair((new sc_Pair("\u1E9Cand",(new sc_Pair((new sc_Pair("\u1E9Cnot",(new sc_Pair((new sc_Pair("\u1E9Czerop",(new sc_Pair("\u1E9Cx",null)))),null)))),(new sc_Pair((new sc_Pair("\u1E9Cnot",(new sc_Pair((new sc_Pair("\u1E9Cequal",(new sc_Pair("\u1E9Cx",(new sc_Pair((new sc_Pair("\u1E9Cadd1",(new sc_Pair((new sc_Pair("\u1E9Czero",null)),null)))),null)))))),null)))),(new sc_Pair((new sc_Pair("\u1E9Cprime1",(new sc_Pair("\u1E9Cx",(new sc_Pair((new sc_Pair("\u1E9Csub1",(new sc_Pair("\u1E9Cx",null)))),null)))))),null)))))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cand",(new sc_Pair("\u1E9Cp",(new sc_Pair("\u1E9Cq",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cif",(new sc_Pair("\u1E9Cp",(new sc_Pair((new sc_Pair("\u1E9Cif",(new sc_Pair("\u1E9Cq",(new sc_Pair((new sc_Pair("\u1E9Ct",null)),(new sc_Pair((new sc_Pair("\u1E9Cf",null)),null)))))))),(new sc_Pair((new sc_Pair("\u1E9Cf",null)),null)))))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cor",(new sc_Pair("\u1E9Cp",(new sc_Pair("\u1E9Cq",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cif",(new sc_Pair("\u1E9Cp",(new sc_Pair((new sc_Pair("\u1E9Ct",null)),(new sc_Pair((new sc_Pair("\u1E9Cif",(new sc_Pair("\u1E9Cq",(new sc_Pair((new sc_Pair("\u1E9Ct",null)),(new sc_Pair((new sc_Pair("\u1E9Cf",null)),null)))))))),null)))))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cnot",(new sc_Pair("\u1E9Cp",null)))),(new sc_Pair((new sc_Pair("\u1E9Cif",(new sc_Pair("\u1E9Cp",(new sc_Pair((new sc_Pair("\u1E9Cf",null)),(new sc_Pair((new sc_Pair("\u1E9Ct",null)),null)))))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cimplies",(new sc_Pair("\u1E9Cp",(new sc_Pair("\u1E9Cq",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cif",(new sc_Pair("\u1E9Cp",(new sc_Pair((new sc_Pair("\u1E9Cif",(new sc_Pair("\u1E9Cq",(new sc_Pair((new sc_Pair("\u1E9Ct",null)),(new sc_Pair((new sc_Pair("\u1E9Cf",null)),null)))))))),(new sc_Pair((new sc_Pair("\u1E9Ct",null)),null)))))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cfix",(new sc_Pair("\u1E9Cx",null)))),(new sc_Pair((new sc_Pair("\u1E9Cif",(new sc_Pair((new sc_Pair("\u1E9Cnumberp",(new sc_Pair("\u1E9Cx",null)))),(new sc_Pair("\u1E9Cx",(new sc_Pair((new sc_Pair("\u1E9Czero",null)),null)))))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cif",(new sc_Pair((new sc_Pair("\u1E9Cif",(new sc_Pair("\u1E9Ca",(new sc_Pair("\u1E9Cb",(new sc_Pair("\u1E9Cc",null)))))))),(new sc_Pair("\u1E9Cd",(new sc_Pair("\u1E9Ce",null)))))))),(new sc_Pair((new sc_Pair("\u1E9Cif",(new sc_Pair("\u1E9Ca",(new sc_Pair((new sc_Pair("\u1E9Cif",(new sc_Pair("\u1E9Cb",(new sc_Pair("\u1E9Cd",(new sc_Pair("\u1E9Ce",null)))))))),(new sc_Pair((new sc_Pair("\u1E9Cif",(new sc_Pair("\u1E9Cc",(new sc_Pair("\u1E9Cd",(new sc_Pair("\u1E9Ce",null)))))))),null)))))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Czerop",(new sc_Pair("\u1E9Cx",null)))),(new sc_Pair((new sc_Pair("\u1E9Cor",(new sc_Pair((new sc_Pair("\u1E9Cequal",(new sc_Pair("\u1E9Cx",(new sc_Pair((new sc_Pair("\u1E9Czero",null)),null)))))),(new sc_Pair((new sc_Pair("\u1E9Cnot",(new sc_Pair((new sc_Pair("\u1E9Cnumberp",(new sc_Pair("\u1E9Cx",null)))),null)))),null)))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cplus",(new sc_Pair((new sc_Pair("\u1E9Cplus",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cy",null)))))),(new sc_Pair("\u1E9Cz",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cplus",(new sc_Pair("\u1E9Cx",(new sc_Pair((new sc_Pair("\u1E9Cplus",(new sc_Pair("\u1E9Cy",(new sc_Pair("\u1E9Cz",null)))))),null)))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cplus",(new sc_Pair("\u1E9Ca",(new sc_Pair("\u1E9Cb",null)))))),(new sc_Pair((new sc_Pair("\u1E9Czero",null)),null)))))),(new sc_Pair((new sc_Pair("\u1E9Cand",(new sc_Pair((new sc_Pair("\u1E9Czerop",(new sc_Pair("\u1E9Ca",null)))),(new sc_Pair((new sc_Pair("\u1E9Czerop",(new sc_Pair("\u1E9Cb",null)))),null)))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cdifference",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cx",null)))))),(new sc_Pair((new sc_Pair("\u1E9Czero",null)),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cplus",(new sc_Pair("\u1E9Ca",(new sc_Pair("\u1E9Cb",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cplus",(new sc_Pair("\u1E9Ca",(new sc_Pair("\u1E9Cc",null)))))),null)))))),(new sc_Pair((new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cfix",(new sc_Pair("\u1E9Cb",null)))),(new sc_Pair((new sc_Pair("\u1E9Cfix",(new sc_Pair("\u1E9Cc",null)))),null)))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Czero",null)),(new sc_Pair((new sc_Pair("\u1E9Cdifference",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cy",null)))))),null)))))),(new sc_Pair((new sc_Pair("\u1E9Cnot",(new sc_Pair((new sc_Pair("\u1E9Clessp",(new sc_Pair("\u1E9Cy",(new sc_Pair("\u1E9Cx",null)))))),null)))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cequal",(new sc_Pair("\u1E9Cx",(new sc_Pair((new sc_Pair("\u1E9Cdifference",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cy",null)))))),null)))))),(new sc_Pair((new sc_Pair("\u1E9Cand",(new sc_Pair((new sc_Pair("\u1E9Cnumberp",(new sc_Pair("\u1E9Cx",null)))),(new sc_Pair((new sc_Pair("\u1E9Cor",(new sc_Pair((new sc_Pair("\u1E9Cequal",(new sc_Pair("\u1E9Cx",(new sc_Pair((new sc_Pair("\u1E9Czero",null)),null)))))),(new sc_Pair((new sc_Pair("\u1E9Czerop",(new sc_Pair("\u1E9Cy",null)))),null)))))),null)))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cmeaning",(new sc_Pair((new sc_Pair("\u1E9Cplus-tree",(new sc_Pair((new sc_Pair("\u1E9Cappend",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cy",null)))))),null)))),(new sc_Pair("\u1E9Ca",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cplus",(new sc_Pair((new sc_Pair("\u1E9Cmeaning",(new sc_Pair((new sc_Pair("\u1E9Cplus-tree",(new sc_Pair("\u1E9Cx",null)))),(new sc_Pair("\u1E9Ca",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cmeaning",(new sc_Pair((new sc_Pair("\u1E9Cplus-tree",(new sc_Pair("\u1E9Cy",null)))),(new sc_Pair("\u1E9Ca",null)))))),null)))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cmeaning",(new sc_Pair((new sc_Pair("\u1E9Cplus-tree",(new sc_Pair((new sc_Pair("\u1E9Cplus-fringe",(new sc_Pair("\u1E9Cx",null)))),null)))),(new sc_Pair("\u1E9Ca",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cfix",(new sc_Pair((new sc_Pair("\u1E9Cmeaning",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Ca",null)))))),null)))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cappend",(new sc_Pair((new sc_Pair("\u1E9Cappend",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cy",null)))))),(new sc_Pair("\u1E9Cz",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cappend",(new sc_Pair("\u1E9Cx",(new sc_Pair((new sc_Pair("\u1E9Cappend",(new sc_Pair("\u1E9Cy",(new sc_Pair("\u1E9Cz",null)))))),null)))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Creverse",(new sc_Pair((new sc_Pair("\u1E9Cappend",(new sc_Pair("\u1E9Ca",(new sc_Pair("\u1E9Cb",null)))))),null)))),(new sc_Pair((new sc_Pair("\u1E9Cappend",(new sc_Pair((new sc_Pair("\u1E9Creverse",(new sc_Pair("\u1E9Cb",null)))),(new sc_Pair((new sc_Pair("\u1E9Creverse",(new sc_Pair("\u1E9Ca",null)))),null)))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Ctimes",(new sc_Pair("\u1E9Cx",(new sc_Pair((new sc_Pair("\u1E9Cplus",(new sc_Pair("\u1E9Cy",(new sc_Pair("\u1E9Cz",null)))))),null)))))),(new sc_Pair((new sc_Pair("\u1E9Cplus",(new sc_Pair((new sc_Pair("\u1E9Ctimes",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cy",null)))))),(new sc_Pair((new sc_Pair("\u1E9Ctimes",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cz",null)))))),null)))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Ctimes",(new sc_Pair((new sc_Pair("\u1E9Ctimes",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cy",null)))))),(new sc_Pair("\u1E9Cz",null)))))),(new sc_Pair((new sc_Pair("\u1E9Ctimes",(new sc_Pair("\u1E9Cx",(new sc_Pair((new sc_Pair("\u1E9Ctimes",(new sc_Pair("\u1E9Cy",(new sc_Pair("\u1E9Cz",null)))))),null)))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Ctimes",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cy",null)))))),(new sc_Pair((new sc_Pair("\u1E9Czero",null)),null)))))),(new sc_Pair((new sc_Pair("\u1E9Cor",(new sc_Pair((new sc_Pair("\u1E9Czerop",(new sc_Pair("\u1E9Cx",null)))),(new sc_Pair((new sc_Pair("\u1E9Czerop",(new sc_Pair("\u1E9Cy",null)))),null)))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cexec",(new sc_Pair((new sc_Pair("\u1E9Cappend",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cy",null)))))),(new sc_Pair("\u1E9Cpds",(new sc_Pair("\u1E9Cenvrn",null)))))))),(new sc_Pair((new sc_Pair("\u1E9Cexec",(new sc_Pair("\u1E9Cy",(new sc_Pair((new sc_Pair("\u1E9Cexec",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cpds",(new sc_Pair("\u1E9Cenvrn",null)))))))),(new sc_Pair("\u1E9Cenvrn",null)))))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cmc-flatten",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cy",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cappend",(new sc_Pair((new sc_Pair("\u1E9Cflatten",(new sc_Pair("\u1E9Cx",null)))),(new sc_Pair("\u1E9Cy",null)))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cmember",(new sc_Pair("\u1E9Cx",(new sc_Pair((new sc_Pair("\u1E9Cappend",(new sc_Pair("\u1E9Ca",(new sc_Pair("\u1E9Cb",null)))))),null)))))),(new sc_Pair((new sc_Pair("\u1E9Cor",(new sc_Pair((new sc_Pair("\u1E9Cmember",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Ca",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cmember",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cb",null)))))),null)))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cmember",(new sc_Pair("\u1E9Cx",(new sc_Pair((new sc_Pair("\u1E9Creverse",(new sc_Pair("\u1E9Cy",null)))),null)))))),(new sc_Pair((new sc_Pair("\u1E9Cmember",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cy",null)))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Clength",(new sc_Pair((new sc_Pair("\u1E9Creverse",(new sc_Pair("\u1E9Cx",null)))),null)))),(new sc_Pair((new sc_Pair("\u1E9Clength",(new sc_Pair("\u1E9Cx",null)))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cmember",(new sc_Pair("\u1E9Ca",(new sc_Pair((new sc_Pair("\u1E9Cintersect",(new sc_Pair("\u1E9Cb",(new sc_Pair("\u1E9Cc",null)))))),null)))))),(new sc_Pair((new sc_Pair("\u1E9Cand",(new sc_Pair((new sc_Pair("\u1E9Cmember",(new sc_Pair("\u1E9Ca",(new sc_Pair("\u1E9Cb",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cmember",(new sc_Pair("\u1E9Ca",(new sc_Pair("\u1E9Cc",null)))))),null)))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cnth",(new sc_Pair((new sc_Pair("\u1E9Czero",null)),(new sc_Pair("\u1E9Ci",null)))))),(new sc_Pair((new sc_Pair("\u1E9Czero",null)),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cexp",(new sc_Pair("\u1E9Ci",(new sc_Pair((new sc_Pair("\u1E9Cplus",(new sc_Pair("\u1E9Cj",(new sc_Pair("\u1E9Ck",null)))))),null)))))),(new sc_Pair((new sc_Pair("\u1E9Ctimes",(new sc_Pair((new sc_Pair("\u1E9Cexp",(new sc_Pair("\u1E9Ci",(new sc_Pair("\u1E9Cj",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cexp",(new sc_Pair("\u1E9Ci",(new sc_Pair("\u1E9Ck",null)))))),null)))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cexp",(new sc_Pair("\u1E9Ci",(new sc_Pair((new sc_Pair("\u1E9Ctimes",(new sc_Pair("\u1E9Cj",(new sc_Pair("\u1E9Ck",null)))))),null)))))),(new sc_Pair((new sc_Pair("\u1E9Cexp",(new sc_Pair((new sc_Pair("\u1E9Cexp",(new sc_Pair("\u1E9Ci",(new sc_Pair("\u1E9Cj",null)))))),(new sc_Pair("\u1E9Ck",null)))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Creverse-loop",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cy",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cappend",(new sc_Pair((new sc_Pair("\u1E9Creverse",(new sc_Pair("\u1E9Cx",null)))),(new sc_Pair("\u1E9Cy",null)))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Creverse-loop",(new sc_Pair("\u1E9Cx",(new sc_Pair((new sc_Pair("\u1E9Cnil",null)),null)))))),(new sc_Pair((new sc_Pair("\u1E9Creverse",(new sc_Pair("\u1E9Cx",null)))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Ccount-list",(new sc_Pair("\u1E9Cz",(new sc_Pair((new sc_Pair("\u1E9Csort-lp",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cy",null)))))),null)))))),(new sc_Pair((new sc_Pair("\u1E9Cplus",(new sc_Pair((new sc_Pair("\u1E9Ccount-list",(new sc_Pair("\u1E9Cz",(new sc_Pair("\u1E9Cx",null)))))),(new sc_Pair((new sc_Pair("\u1E9Ccount-list",(new sc_Pair("\u1E9Cz",(new sc_Pair("\u1E9Cy",null)))))),null)))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cappend",(new sc_Pair("\u1E9Ca",(new sc_Pair("\u1E9Cb",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cappend",(new sc_Pair("\u1E9Ca",(new sc_Pair("\u1E9Cc",null)))))),null)))))),(new sc_Pair((new sc_Pair("\u1E9Cequal",(new sc_Pair("\u1E9Cb",(new sc_Pair("\u1E9Cc",null)))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cplus",(new sc_Pair((new sc_Pair("\u1E9Cremainder",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cy",null)))))),(new sc_Pair((new sc_Pair("\u1E9Ctimes",(new sc_Pair("\u1E9Cy",(new sc_Pair((new sc_Pair("\u1E9Cquotient",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cy",null)))))),null)))))),null)))))),(new sc_Pair((new sc_Pair("\u1E9Cfix",(new sc_Pair("\u1E9Cx",null)))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cpower-eval",(new sc_Pair((new sc_Pair("\u1E9Cbig-plus1",(new sc_Pair("\u1E9Cl",(new sc_Pair("\u1E9Ci",(new sc_Pair("\u1E9Cbase",null)))))))),(new sc_Pair("\u1E9Cbase",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cplus",(new sc_Pair((new sc_Pair("\u1E9Cpower-eval",(new sc_Pair("\u1E9Cl",(new sc_Pair("\u1E9Cbase",null)))))),(new sc_Pair("\u1E9Ci",null)))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cpower-eval",(new sc_Pair((new sc_Pair("\u1E9Cbig-plus",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cy",(new sc_Pair("\u1E9Ci",(new sc_Pair("\u1E9Cbase",null)))))))))),(new sc_Pair("\u1E9Cbase",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cplus",(new sc_Pair("\u1E9Ci",(new sc_Pair((new sc_Pair("\u1E9Cplus",(new sc_Pair((new sc_Pair("\u1E9Cpower-eval",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cbase",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cpower-eval",(new sc_Pair("\u1E9Cy",(new sc_Pair("\u1E9Cbase",null)))))),null)))))),null)))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cremainder",(new sc_Pair("\u1E9Cy",(new sc_Pair((1),null)))))),(new sc_Pair((new sc_Pair("\u1E9Czero",null)),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Clessp",(new sc_Pair((new sc_Pair("\u1E9Cremainder",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cy",null)))))),(new sc_Pair("\u1E9Cy",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cnot",(new sc_Pair((new sc_Pair("\u1E9Czerop",(new sc_Pair("\u1E9Cy",null)))),null)))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cremainder",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cx",null)))))),(new sc_Pair((new sc_Pair("\u1E9Czero",null)),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Clessp",(new sc_Pair((new sc_Pair("\u1E9Cquotient",(new sc_Pair("\u1E9Ci",(new sc_Pair("\u1E9Cj",null)))))),(new sc_Pair("\u1E9Ci",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cand",(new sc_Pair((new sc_Pair("\u1E9Cnot",(new sc_Pair((new sc_Pair("\u1E9Czerop",(new sc_Pair("\u1E9Ci",null)))),null)))),(new sc_Pair((new sc_Pair("\u1E9Cor",(new sc_Pair((new sc_Pair("\u1E9Czerop",(new sc_Pair("\u1E9Cj",null)))),(new sc_Pair((new sc_Pair("\u1E9Cnot",(new sc_Pair((new sc_Pair("\u1E9Cequal",(new sc_Pair("\u1E9Cj",(new sc_Pair((1),null)))))),null)))),null)))))),null)))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Clessp",(new sc_Pair((new sc_Pair("\u1E9Cremainder",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cy",null)))))),(new sc_Pair("\u1E9Cx",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cand",(new sc_Pair((new sc_Pair("\u1E9Cnot",(new sc_Pair((new sc_Pair("\u1E9Czerop",(new sc_Pair("\u1E9Cy",null)))),null)))),(new sc_Pair((new sc_Pair("\u1E9Cnot",(new sc_Pair((new sc_Pair("\u1E9Czerop",(new sc_Pair("\u1E9Cx",null)))),null)))),(new sc_Pair((new sc_Pair("\u1E9Cnot",(new sc_Pair((new sc_Pair("\u1E9Clessp",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cy",null)))))),null)))),null)))))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cpower-eval",(new sc_Pair((new sc_Pair("\u1E9Cpower-rep",(new sc_Pair("\u1E9Ci",(new sc_Pair("\u1E9Cbase",null)))))),(new sc_Pair("\u1E9Cbase",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cfix",(new sc_Pair("\u1E9Ci",null)))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cpower-eval",(new sc_Pair((new sc_Pair("\u1E9Cbig-plus",(new sc_Pair((new sc_Pair("\u1E9Cpower-rep",(new sc_Pair("\u1E9Ci",(new sc_Pair("\u1E9Cbase",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cpower-rep",(new sc_Pair("\u1E9Cj",(new sc_Pair("\u1E9Cbase",null)))))),(new sc_Pair((new sc_Pair("\u1E9Czero",null)),(new sc_Pair("\u1E9Cbase",null)))))))))),(new sc_Pair("\u1E9Cbase",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cplus",(new sc_Pair("\u1E9Ci",(new sc_Pair("\u1E9Cj",null)))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cgcd",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cy",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cgcd",(new sc_Pair("\u1E9Cy",(new sc_Pair("\u1E9Cx",null)))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cnth",(new sc_Pair((new sc_Pair("\u1E9Cappend",(new sc_Pair("\u1E9Ca",(new sc_Pair("\u1E9Cb",null)))))),(new sc_Pair("\u1E9Ci",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cappend",(new sc_Pair((new sc_Pair("\u1E9Cnth",(new sc_Pair("\u1E9Ca",(new sc_Pair("\u1E9Ci",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cnth",(new sc_Pair("\u1E9Cb",(new sc_Pair((new sc_Pair("\u1E9Cdifference",(new sc_Pair("\u1E9Ci",(new sc_Pair((new sc_Pair("\u1E9Clength",(new sc_Pair("\u1E9Ca",null)))),null)))))),null)))))),null)))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cdifference",(new sc_Pair((new sc_Pair("\u1E9Cplus",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cy",null)))))),(new sc_Pair("\u1E9Cx",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cfix",(new sc_Pair("\u1E9Cy",null)))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cdifference",(new sc_Pair((new sc_Pair("\u1E9Cplus",(new sc_Pair("\u1E9Cy",(new sc_Pair("\u1E9Cx",null)))))),(new sc_Pair("\u1E9Cx",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cfix",(new sc_Pair("\u1E9Cy",null)))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cdifference",(new sc_Pair((new sc_Pair("\u1E9Cplus",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cy",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cplus",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cz",null)))))),null)))))),(new sc_Pair((new sc_Pair("\u1E9Cdifference",(new sc_Pair("\u1E9Cy",(new sc_Pair("\u1E9Cz",null)))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Ctimes",(new sc_Pair("\u1E9Cx",(new sc_Pair((new sc_Pair("\u1E9Cdifference",(new sc_Pair("\u1E9Cc",(new sc_Pair("\u1E9Cw",null)))))),null)))))),(new sc_Pair((new sc_Pair("\u1E9Cdifference",(new sc_Pair((new sc_Pair("\u1E9Ctimes",(new sc_Pair("\u1E9Cc",(new sc_Pair("\u1E9Cx",null)))))),(new sc_Pair((new sc_Pair("\u1E9Ctimes",(new sc_Pair("\u1E9Cw",(new sc_Pair("\u1E9Cx",null)))))),null)))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cremainder",(new sc_Pair((new sc_Pair("\u1E9Ctimes",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cz",null)))))),(new sc_Pair("\u1E9Cz",null)))))),(new sc_Pair((new sc_Pair("\u1E9Czero",null)),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cdifference",(new sc_Pair((new sc_Pair("\u1E9Cplus",(new sc_Pair("\u1E9Cb",(new sc_Pair((new sc_Pair("\u1E9Cplus",(new sc_Pair("\u1E9Ca",(new sc_Pair("\u1E9Cc",null)))))),null)))))),(new sc_Pair("\u1E9Ca",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cplus",(new sc_Pair("\u1E9Cb",(new sc_Pair("\u1E9Cc",null)))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cdifference",(new sc_Pair((new sc_Pair("\u1E9Cadd1",(new sc_Pair((new sc_Pair("\u1E9Cplus",(new sc_Pair("\u1E9Cy",(new sc_Pair("\u1E9Cz",null)))))),null)))),(new sc_Pair("\u1E9Cz",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cadd1",(new sc_Pair("\u1E9Cy",null)))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Clessp",(new sc_Pair((new sc_Pair("\u1E9Cplus",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cy",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cplus",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cz",null)))))),null)))))),(new sc_Pair((new sc_Pair("\u1E9Clessp",(new sc_Pair("\u1E9Cy",(new sc_Pair("\u1E9Cz",null)))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Clessp",(new sc_Pair((new sc_Pair("\u1E9Ctimes",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cz",null)))))),(new sc_Pair((new sc_Pair("\u1E9Ctimes",(new sc_Pair("\u1E9Cy",(new sc_Pair("\u1E9Cz",null)))))),null)))))),(new sc_Pair((new sc_Pair("\u1E9Cand",(new sc_Pair((new sc_Pair("\u1E9Cnot",(new sc_Pair((new sc_Pair("\u1E9Czerop",(new sc_Pair("\u1E9Cz",null)))),null)))),(new sc_Pair((new sc_Pair("\u1E9Clessp",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cy",null)))))),null)))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Clessp",(new sc_Pair("\u1E9Cy",(new sc_Pair((new sc_Pair("\u1E9Cplus",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cy",null)))))),null)))))),(new sc_Pair((new sc_Pair("\u1E9Cnot",(new sc_Pair((new sc_Pair("\u1E9Czerop",(new sc_Pair("\u1E9Cx",null)))),null)))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cgcd",(new sc_Pair((new sc_Pair("\u1E9Ctimes",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cz",null)))))),(new sc_Pair((new sc_Pair("\u1E9Ctimes",(new sc_Pair("\u1E9Cy",(new sc_Pair("\u1E9Cz",null)))))),null)))))),(new sc_Pair((new sc_Pair("\u1E9Ctimes",(new sc_Pair("\u1E9Cz",(new sc_Pair((new sc_Pair("\u1E9Cgcd",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cy",null)))))),null)))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cvalue",(new sc_Pair((new sc_Pair("\u1E9Cnormalize",(new sc_Pair("\u1E9Cx",null)))),(new sc_Pair("\u1E9Ca",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cvalue",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Ca",null)))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cflatten",(new sc_Pair("\u1E9Cx",null)))),(new sc_Pair((new sc_Pair("\u1E9Ccons",(new sc_Pair("\u1E9Cy",(new sc_Pair((new sc_Pair("\u1E9Cnil",null)),null)))))),null)))))),(new sc_Pair((new sc_Pair("\u1E9Cand",(new sc_Pair((new sc_Pair("\u1E9Cnlistp",(new sc_Pair("\u1E9Cx",null)))),(new sc_Pair((new sc_Pair("\u1E9Cequal",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cy",null)))))),null)))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Clistp",(new sc_Pair((new sc_Pair("\u1E9Cgopher",(new sc_Pair("\u1E9Cx",null)))),null)))),(new sc_Pair((new sc_Pair("\u1E9Clistp",(new sc_Pair("\u1E9Cx",null)))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Csamefringe",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cy",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cflatten",(new sc_Pair("\u1E9Cx",null)))),(new sc_Pair((new sc_Pair("\u1E9Cflatten",(new sc_Pair("\u1E9Cy",null)))),null)))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cgreatest-factor",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cy",null)))))),(new sc_Pair((new sc_Pair("\u1E9Czero",null)),null)))))),(new sc_Pair((new sc_Pair("\u1E9Cand",(new sc_Pair((new sc_Pair("\u1E9Cor",(new sc_Pair((new sc_Pair("\u1E9Czerop",(new sc_Pair("\u1E9Cy",null)))),(new sc_Pair((new sc_Pair("\u1E9Cequal",(new sc_Pair("\u1E9Cy",(new sc_Pair((1),null)))))),null)))))),(new sc_Pair((new sc_Pair("\u1E9Cequal",(new sc_Pair("\u1E9Cx",(new sc_Pair((new sc_Pair("\u1E9Czero",null)),null)))))),null)))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cgreatest-factor",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cy",null)))))),(new sc_Pair((1),null)))))),(new sc_Pair((new sc_Pair("\u1E9Cequal",(new sc_Pair("\u1E9Cx",(new sc_Pair((1),null)))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cnumberp",(new sc_Pair((new sc_Pair("\u1E9Cgreatest-factor",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cy",null)))))),null)))),(new sc_Pair((new sc_Pair("\u1E9Cnot",(new sc_Pair((new sc_Pair("\u1E9Cand",(new sc_Pair((new sc_Pair("\u1E9Cor",(new sc_Pair((new sc_Pair("\u1E9Czerop",(new sc_Pair("\u1E9Cy",null)))),(new sc_Pair((new sc_Pair("\u1E9Cequal",(new sc_Pair("\u1E9Cy",(new sc_Pair((1),null)))))),null)))))),(new sc_Pair((new sc_Pair("\u1E9Cnot",(new sc_Pair((new sc_Pair("\u1E9Cnumberp",(new sc_Pair("\u1E9Cx",null)))),null)))),null)))))),null)))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Ctimes-list",(new sc_Pair((new sc_Pair("\u1E9Cappend",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cy",null)))))),null)))),(new sc_Pair((new sc_Pair("\u1E9Ctimes",(new sc_Pair((new sc_Pair("\u1E9Ctimes-list",(new sc_Pair("\u1E9Cx",null)))),(new sc_Pair((new sc_Pair("\u1E9Ctimes-list",(new sc_Pair("\u1E9Cy",null)))),null)))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cprime-list",(new sc_Pair((new sc_Pair("\u1E9Cappend",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cy",null)))))),null)))),(new sc_Pair((new sc_Pair("\u1E9Cand",(new sc_Pair((new sc_Pair("\u1E9Cprime-list",(new sc_Pair("\u1E9Cx",null)))),(new sc_Pair((new sc_Pair("\u1E9Cprime-list",(new sc_Pair("\u1E9Cy",null)))),null)))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cequal",(new sc_Pair("\u1E9Cz",(new sc_Pair((new sc_Pair("\u1E9Ctimes",(new sc_Pair("\u1E9Cw",(new sc_Pair("\u1E9Cz",null)))))),null)))))),(new sc_Pair((new sc_Pair("\u1E9Cand",(new sc_Pair((new sc_Pair("\u1E9Cnumberp",(new sc_Pair("\u1E9Cz",null)))),(new sc_Pair((new sc_Pair("\u1E9Cor",(new sc_Pair((new sc_Pair("\u1E9Cequal",(new sc_Pair("\u1E9Cz",(new sc_Pair((new sc_Pair("\u1E9Czero",null)),null)))))),(new sc_Pair((new sc_Pair("\u1E9Cequal",(new sc_Pair("\u1E9Cw",(new sc_Pair((1),null)))))),null)))))),null)))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cgreatereqp",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cy",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cnot",(new sc_Pair((new sc_Pair("\u1E9Clessp",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cy",null)))))),null)))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cequal",(new sc_Pair("\u1E9Cx",(new sc_Pair((new sc_Pair("\u1E9Ctimes",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cy",null)))))),null)))))),(new sc_Pair((new sc_Pair("\u1E9Cor",(new sc_Pair((new sc_Pair("\u1E9Cequal",(new sc_Pair("\u1E9Cx",(new sc_Pair((new sc_Pair("\u1E9Czero",null)),null)))))),(new sc_Pair((new sc_Pair("\u1E9Cand",(new sc_Pair((new sc_Pair("\u1E9Cnumberp",(new sc_Pair("\u1E9Cx",null)))),(new sc_Pair((new sc_Pair("\u1E9Cequal",(new sc_Pair("\u1E9Cy",(new sc_Pair((1),null)))))),null)))))),null)))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cremainder",(new sc_Pair((new sc_Pair("\u1E9Ctimes",(new sc_Pair("\u1E9Cy",(new sc_Pair("\u1E9Cx",null)))))),(new sc_Pair("\u1E9Cy",null)))))),(new sc_Pair((new sc_Pair("\u1E9Czero",null)),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Ctimes",(new sc_Pair("\u1E9Ca",(new sc_Pair("\u1E9Cb",null)))))),(new sc_Pair((1),null)))))),(new sc_Pair(sc_list("\u1E9Cand", (new sc_Pair("\u1E9Cnot",(new sc_Pair((new sc_Pair("\u1E9Cequal",(new sc_Pair("\u1E9Ca",(new sc_Pair((new sc_Pair("\u1E9Czero",null)),null)))))),null)))), (new sc_Pair("\u1E9Cnot",(new sc_Pair((new sc_Pair("\u1E9Cequal",(new sc_Pair("\u1E9Cb",(new sc_Pair((new sc_Pair("\u1E9Czero",null)),null)))))),null)))), (new sc_Pair("\u1E9Cnumberp",(new sc_Pair("\u1E9Ca",null)))), (new sc_Pair("\u1E9Cnumberp",(new sc_Pair("\u1E9Cb",null)))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Csub1",(new sc_Pair("\u1E9Ca",null)))),(new sc_Pair((new sc_Pair("\u1E9Czero",null)),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Csub1",(new sc_Pair("\u1E9Cb",null)))),(new sc_Pair((new sc_Pair("\u1E9Czero",null)),null))))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Clessp",(new sc_Pair((new sc_Pair("\u1E9Clength",(new sc_Pair((new sc_Pair("\u1E9Cdelete",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cl",null)))))),null)))),(new sc_Pair((new sc_Pair("\u1E9Clength",(new sc_Pair("\u1E9Cl",null)))),null)))))),(new sc_Pair((new sc_Pair("\u1E9Cmember",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cl",null)))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Csort2",(new sc_Pair((new sc_Pair("\u1E9Cdelete",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cl",null)))))),null)))),(new sc_Pair((new sc_Pair("\u1E9Cdelete",(new sc_Pair("\u1E9Cx",(new sc_Pair((new sc_Pair("\u1E9Csort2",(new sc_Pair("\u1E9Cl",null)))),null)))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cdsort",(new sc_Pair("\u1E9Cx",null)))),(new sc_Pair((new sc_Pair("\u1E9Csort2",(new sc_Pair("\u1E9Cx",null)))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Clength",(new sc_Pair((new sc_Pair("\u1E9Ccons",(new sc_Pair("\u1E9Cx1",(new sc_Pair((new sc_Pair("\u1E9Ccons",(new sc_Pair("\u1E9Cx2",(new sc_Pair((new sc_Pair("\u1E9Ccons",(new sc_Pair("\u1E9Cx3",(new sc_Pair((new sc_Pair("\u1E9Ccons",(new sc_Pair("\u1E9Cx4",(new sc_Pair((new sc_Pair("\u1E9Ccons",(new sc_Pair("\u1E9Cx5",(new sc_Pair((new sc_Pair("\u1E9Ccons",(new sc_Pair("\u1E9Cx6",(new sc_Pair("\u1E9Cx7",null)))))),null)))))),null)))))),null)))))),null)))))),null)))))),null)))),(new sc_Pair((new sc_Pair("\u1E9Cplus",(new sc_Pair((6),(new sc_Pair((new sc_Pair("\u1E9Clength",(new sc_Pair("\u1E9Cx7",null)))),null)))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cdifference",(new sc_Pair((new sc_Pair("\u1E9Cadd1",(new sc_Pair((new sc_Pair("\u1E9Cadd1",(new sc_Pair("\u1E9Cx",null)))),null)))),(new sc_Pair((2),null)))))),(new sc_Pair((new sc_Pair("\u1E9Cfix",(new sc_Pair("\u1E9Cx",null)))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cquotient",(new sc_Pair((new sc_Pair("\u1E9Cplus",(new sc_Pair("\u1E9Cx",(new sc_Pair((new sc_Pair("\u1E9Cplus",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cy",null)))))),null)))))),(new sc_Pair((2),null)))))),(new sc_Pair((new sc_Pair("\u1E9Cplus",(new sc_Pair("\u1E9Cx",(new sc_Pair((new sc_Pair("\u1E9Cquotient",(new sc_Pair("\u1E9Cy",(new sc_Pair((2),null)))))),null)))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Csigma",(new sc_Pair((new sc_Pair("\u1E9Czero",null)),(new sc_Pair("\u1E9Ci",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cquotient",(new sc_Pair((new sc_Pair("\u1E9Ctimes",(new sc_Pair("\u1E9Ci",(new sc_Pair((new sc_Pair("\u1E9Cadd1",(new sc_Pair("\u1E9Ci",null)))),null)))))),(new sc_Pair((2),null)))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cplus",(new sc_Pair("\u1E9Cx",(new sc_Pair((new sc_Pair("\u1E9Cadd1",(new sc_Pair("\u1E9Cy",null)))),null)))))),(new sc_Pair((new sc_Pair("\u1E9Cif",(new sc_Pair((new sc_Pair("\u1E9Cnumberp",(new sc_Pair("\u1E9Cy",null)))),(new sc_Pair((new sc_Pair("\u1E9Cadd1",(new sc_Pair((new sc_Pair("\u1E9Cplus",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cy",null)))))),null)))),(new sc_Pair((new sc_Pair("\u1E9Cadd1",(new sc_Pair("\u1E9Cx",null)))),null)))))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cdifference",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cy",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cdifference",(new sc_Pair("\u1E9Cz",(new sc_Pair("\u1E9Cy",null)))))),null)))))),(new sc_Pair((new sc_Pair("\u1E9Cif",(new sc_Pair((new sc_Pair("\u1E9Clessp",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cy",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cnot",(new sc_Pair((new sc_Pair("\u1E9Clessp",(new sc_Pair("\u1E9Cy",(new sc_Pair("\u1E9Cz",null)))))),null)))),(new sc_Pair((new sc_Pair("\u1E9Cif",(new sc_Pair((new sc_Pair("\u1E9Clessp",(new sc_Pair("\u1E9Cz",(new sc_Pair("\u1E9Cy",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cnot",(new sc_Pair((new sc_Pair("\u1E9Clessp",(new sc_Pair("\u1E9Cy",(new sc_Pair("\u1E9Cx",null)))))),null)))),(new sc_Pair((new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cfix",(new sc_Pair("\u1E9Cx",null)))),(new sc_Pair((new sc_Pair("\u1E9Cfix",(new sc_Pair("\u1E9Cz",null)))),null)))))),null)))))))),null)))))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cmeaning",(new sc_Pair((new sc_Pair("\u1E9Cplus-tree",(new sc_Pair((new sc_Pair("\u1E9Cdelete",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cy",null)))))),null)))),(new sc_Pair("\u1E9Ca",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cif",(new sc_Pair((new sc_Pair("\u1E9Cmember",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cy",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cdifference",(new sc_Pair((new sc_Pair("\u1E9Cmeaning",(new sc_Pair((new sc_Pair("\u1E9Cplus-tree",(new sc_Pair("\u1E9Cy",null)))),(new sc_Pair("\u1E9Ca",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cmeaning",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Ca",null)))))),null)))))),(new sc_Pair((new sc_Pair("\u1E9Cmeaning",(new sc_Pair((new sc_Pair("\u1E9Cplus-tree",(new sc_Pair("\u1E9Cy",null)))),(new sc_Pair("\u1E9Ca",null)))))),null)))))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Ctimes",(new sc_Pair("\u1E9Cx",(new sc_Pair((new sc_Pair("\u1E9Cadd1",(new sc_Pair("\u1E9Cy",null)))),null)))))),(new sc_Pair((new sc_Pair("\u1E9Cif",(new sc_Pair((new sc_Pair("\u1E9Cnumberp",(new sc_Pair("\u1E9Cy",null)))),(new sc_Pair((new sc_Pair("\u1E9Cplus",(new sc_Pair("\u1E9Cx",(new sc_Pair((new sc_Pair("\u1E9Ctimes",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cy",null)))))),null)))))),(new sc_Pair((new sc_Pair("\u1E9Cfix",(new sc_Pair("\u1E9Cx",null)))),null)))))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cnth",(new sc_Pair((new sc_Pair("\u1E9Cnil",null)),(new sc_Pair("\u1E9Ci",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cif",(new sc_Pair((new sc_Pair("\u1E9Czerop",(new sc_Pair("\u1E9Ci",null)))),(new sc_Pair((new sc_Pair("\u1E9Cnil",null)),(new sc_Pair((new sc_Pair("\u1E9Czero",null)),null)))))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Clast",(new sc_Pair((new sc_Pair("\u1E9Cappend",(new sc_Pair("\u1E9Ca",(new sc_Pair("\u1E9Cb",null)))))),null)))),(new sc_Pair((new sc_Pair("\u1E9Cif",(new sc_Pair((new sc_Pair("\u1E9Clistp",(new sc_Pair("\u1E9Cb",null)))),(new sc_Pair((new sc_Pair("\u1E9Clast",(new sc_Pair("\u1E9Cb",null)))),(new sc_Pair((new sc_Pair("\u1E9Cif",(new sc_Pair((new sc_Pair("\u1E9Clistp",(new sc_Pair("\u1E9Ca",null)))),(new sc_Pair((new sc_Pair("\u1E9Ccons",(new sc_Pair((new sc_Pair("\u1E9Ccar",(new sc_Pair((new sc_Pair("\u1E9Clast",(new sc_Pair("\u1E9Ca",null)))),null)))),(new sc_Pair("\u1E9Cb",null)))))),(new sc_Pair("\u1E9Cb",null)))))))),null)))))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Clessp",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cy",null)))))),(new sc_Pair("\u1E9Cz",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cif",(new sc_Pair((new sc_Pair("\u1E9Clessp",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cy",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Ct",null)),(new sc_Pair("\u1E9Cz",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cf",null)),(new sc_Pair("\u1E9Cz",null)))))),null)))))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cassignment",(new sc_Pair("\u1E9Cx",(new sc_Pair((new sc_Pair("\u1E9Cappend",(new sc_Pair("\u1E9Ca",(new sc_Pair("\u1E9Cb",null)))))),null)))))),(new sc_Pair((new sc_Pair("\u1E9Cif",(new sc_Pair((new sc_Pair("\u1E9Cassignedp",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Ca",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cassignment",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Ca",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cassignment",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cb",null)))))),null)))))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Ccar",(new sc_Pair((new sc_Pair("\u1E9Cgopher",(new sc_Pair("\u1E9Cx",null)))),null)))),(new sc_Pair((new sc_Pair("\u1E9Cif",(new sc_Pair((new sc_Pair("\u1E9Clistp",(new sc_Pair("\u1E9Cx",null)))),(new sc_Pair((new sc_Pair("\u1E9Ccar",(new sc_Pair((new sc_Pair("\u1E9Cflatten",(new sc_Pair("\u1E9Cx",null)))),null)))),(new sc_Pair((new sc_Pair("\u1E9Czero",null)),null)))))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cflatten",(new sc_Pair((new sc_Pair("\u1E9Ccdr",(new sc_Pair((new sc_Pair("\u1E9Cgopher",(new sc_Pair("\u1E9Cx",null)))),null)))),null)))),(new sc_Pair((new sc_Pair("\u1E9Cif",(new sc_Pair((new sc_Pair("\u1E9Clistp",(new sc_Pair("\u1E9Cx",null)))),(new sc_Pair((new sc_Pair("\u1E9Ccdr",(new sc_Pair((new sc_Pair("\u1E9Cflatten",(new sc_Pair("\u1E9Cx",null)))),null)))),(new sc_Pair((new sc_Pair("\u1E9Ccons",(new sc_Pair((new sc_Pair("\u1E9Czero",null)),(new sc_Pair((new sc_Pair("\u1E9Cnil",null)),null)))))),null)))))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cquotient",(new sc_Pair((new sc_Pair("\u1E9Ctimes",(new sc_Pair("\u1E9Cy",(new sc_Pair("\u1E9Cx",null)))))),(new sc_Pair("\u1E9Cy",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cif",(new sc_Pair((new sc_Pair("\u1E9Czerop",(new sc_Pair("\u1E9Cy",null)))),(new sc_Pair((new sc_Pair("\u1E9Czero",null)),(new sc_Pair((new sc_Pair("\u1E9Cfix",(new sc_Pair("\u1E9Cx",null)))),null)))))))),null)))))), (new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cget",(new sc_Pair("\u1E9Cj",(new sc_Pair((new sc_Pair("\u1E9Cset",(new sc_Pair("\u1E9Ci",(new sc_Pair("\u1E9Cval",(new sc_Pair("\u1E9Cmem",null)))))))),null)))))),(new sc_Pair((new sc_Pair("\u1E9Cif",(new sc_Pair((new sc_Pair("\u1E9Ceqp",(new sc_Pair("\u1E9Cj",(new sc_Pair("\u1E9Ci",null)))))),(new sc_Pair("\u1E9Cval",(new sc_Pair((new sc_Pair("\u1E9Cget",(new sc_Pair("\u1E9Cj",(new sc_Pair("\u1E9Cmem",null)))))),null)))))))),null))))))));
    (const_nboyer = (new sc_Pair((new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cf",(new sc_Pair((new sc_Pair("\u1E9Cplus",(new sc_Pair((new sc_Pair("\u1E9Cplus",(new sc_Pair("\u1E9Ca",(new sc_Pair("\u1E9Cb",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cplus",(new sc_Pair("\u1E9Cc",(new sc_Pair((new sc_Pair("\u1E9Czero",null)),null)))))),null)))))),null)))))),(new sc_Pair((new sc_Pair("\u1E9Cy",(new sc_Pair("\u1E9Cf",(new sc_Pair((new sc_Pair("\u1E9Ctimes",(new sc_Pair((new sc_Pair("\u1E9Ctimes",(new sc_Pair("\u1E9Ca",(new sc_Pair("\u1E9Cb",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cplus",(new sc_Pair("\u1E9Cc",(new sc_Pair("\u1E9Cd",null)))))),null)))))),null)))))),(new sc_Pair((new sc_Pair("\u1E9Cz",(new sc_Pair("\u1E9Cf",(new sc_Pair((new sc_Pair("\u1E9Creverse",(new sc_Pair((new sc_Pair("\u1E9Cappend",(new sc_Pair((new sc_Pair("\u1E9Cappend",(new sc_Pair("\u1E9Ca",(new sc_Pair("\u1E9Cb",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cnil",null)),null)))))),null)))),null)))))),(new sc_Pair((new sc_Pair("\u1E9Cu",(new sc_Pair("\u1E9Cequal",(new sc_Pair((new sc_Pair("\u1E9Cplus",(new sc_Pair("\u1E9Ca",(new sc_Pair("\u1E9Cb",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cdifference",(new sc_Pair("\u1E9Cx",(new sc_Pair("\u1E9Cy",null)))))),null)))))))),(new sc_Pair((new sc_Pair("\u1E9Cw",(new sc_Pair("\u1E9Clessp",(new sc_Pair((new sc_Pair("\u1E9Cremainder",(new sc_Pair("\u1E9Ca",(new sc_Pair("\u1E9Cb",null)))))),(new sc_Pair((new sc_Pair("\u1E9Cmember",(new sc_Pair("\u1E9Ca",(new sc_Pair((new sc_Pair("\u1E9Clength",(new sc_Pair("\u1E9Cb",null)))),null)))))),null)))))))),null)))))))))));
    BgL_nboyerzd2benchmarkzd2 = function() {
        var args = null;
        for (var sc_tmp = arguments.length - 1; sc_tmp >= 0; sc_tmp--) {
            args = sc_cons(arguments[sc_tmp], args);
        }
        var n;
        return ((n = ((args === null)?(0):(args.car))), (BgL_setupzd2boyerzd2()), (BgL_runzd2benchmarkzd2(("nboyer"+(sc_number2string(n))), (1), function() {
            return (BgL_testzd2boyerzd2(n));
        }, function(rewrites) {
            if ((sc_isNumber(rewrites)))
                switch (n) {
                case (0):
                    return (rewrites===(95024));
                    break;
                case (1):
                    return (rewrites===(591777));
                    break;
                case (2):
                    return (rewrites===(1813975));
                    break;
                case (3):
                    return (rewrites===(5375678));
                    break;
                case (4):
                    return (rewrites===(16445406));
                    break;
                case (5):
                    return (rewrites===(51507739));
                    break;
                default:
                    return true;
                    break;
                }
            else
                return false;
        })));
    };
    BgL_setupzd2boyerzd2 = function() {
        return true;
    };
    BgL_testzd2boyerzd2 = function() {
        return true;
    };
    translate_term_nboyer = function(term) {
        var lst;
        return (!(term instanceof sc_Pair)?term:(new sc_Pair((BgL_sc_symbolzd2ze3symbolzd2record_1ze3_nboyer((term.car))), ((lst = (term.cdr)), ((lst === null)?null:(new sc_Pair((translate_term_nboyer((lst.car))), (translate_args_nboyer((lst.cdr))))))))));
    };
    translate_args_nboyer = function(lst) {
        var sc_lst_5;
        var term;
        return ((lst === null)?null:(new sc_Pair(((term = (lst.car)), (!(term instanceof sc_Pair)?term:(new sc_Pair((BgL_sc_symbolzd2ze3symbolzd2record_1ze3_nboyer((term.car))), (translate_args_nboyer((term.cdr))))))), ((sc_lst_5 = (lst.cdr)), ((sc_lst_5 === null)?null:(new sc_Pair((translate_term_nboyer((sc_lst_5.car))), (translate_args_nboyer((sc_lst_5.cdr))))))))));
    };
    untranslate_term_nboyer = function(term) {
        var optrOpnd;
        var tail1131;
        var L1127;
        var falseHead1130;
        var symbol_record;
        if (!(term instanceof sc_Pair))
            return term;
        else
            {
                (falseHead1130 = (new sc_Pair(null, null)));
                (L1127 = (term.cdr));
                (tail1131 = falseHead1130);
                while (!(L1127 === null)) {
                    {
                        (tail1131.cdr = (new sc_Pair((untranslate_term_nboyer((L1127.car))), null)));
                        (tail1131 = (tail1131.cdr));
                        (L1127 = (L1127.cdr));
                    }
                }
                (optrOpnd = (falseHead1130.cdr));
                return (new sc_Pair(((symbol_record = (term.car)), (symbol_record[(0)])), optrOpnd));
            }
    };
    BgL_sc_symbolzd2ze3symbolzd2record_1ze3_nboyer = function(sym) {
        var r;
        var x;
        return ((x = (sc_assq(sym, BgL_sc_za2symbolzd2recordszd2alistza2_2z00_nboyer))), ((x!== false)?(x.cdr):((r = [sym, null]), (BgL_sc_za2symbolzd2recordszd2alistza2_2z00_nboyer = (new sc_Pair((new sc_Pair(sym, r)), BgL_sc_za2symbolzd2recordszd2alistza2_2z00_nboyer))), r)));
    };
    (BgL_sc_za2symbolzd2recordszd2alistza2_2z00_nboyer = null);
    translate_alist_nboyer = function(alist) {
        var sc_alist_6;
        var term;
        return ((alist === null)?null:(new sc_Pair((new sc_Pair((alist.car.car), ((term = (alist.car.cdr)), (!(term instanceof sc_Pair)?term:(new sc_Pair((BgL_sc_symbolzd2ze3symbolzd2record_1ze3_nboyer((term.car))), (translate_args_nboyer((term.cdr))))))))), ((sc_alist_6 = (alist.cdr)), ((sc_alist_6 === null)?null:(new sc_Pair((new sc_Pair((sc_alist_6.car.car), (translate_term_nboyer((sc_alist_6.car.cdr))))), (translate_alist_nboyer((sc_alist_6.cdr))))))))));
    };
    apply_subst_nboyer = function(alist, term) {
        var lst;
        var temp_temp;
        return (!(term instanceof sc_Pair)?((temp_temp = (sc_assq(term, alist))), ((temp_temp!== false)?(temp_temp.cdr):term)):(new sc_Pair((term.car), ((lst = (term.cdr)), ((lst === null)?null:(new sc_Pair((apply_subst_nboyer(alist, (lst.car))), (apply_subst_lst_nboyer(alist, (lst.cdr))))))))));
    };
    apply_subst_lst_nboyer = function(alist, lst) {
        var sc_lst_7;
        return ((lst === null)?null:(new sc_Pair((apply_subst_nboyer(alist, (lst.car))), ((sc_lst_7 = (lst.cdr)), ((sc_lst_7 === null)?null:(new sc_Pair((apply_subst_nboyer(alist, (sc_lst_7.car))), (apply_subst_lst_nboyer(alist, (sc_lst_7.cdr))))))))));
    };
    tautologyp_nboyer = function(sc_x_11, true_lst, false_lst) {
        var tmp1125;
        var x;
        var tmp1126;
        var sc_x_8;
        var sc_tmp1125_9;
        var sc_tmp1126_10;
        var sc_x_11;
        var true_lst;
        var false_lst;
        while (true) {
            if ((((sc_tmp1126_10 = (is_term_equal_nboyer(sc_x_11, true_term_nboyer))), ((sc_tmp1126_10!== false)?sc_tmp1126_10:(is_term_member_nboyer(sc_x_11, true_lst))))!== false))
                return true;
            else
                if ((((sc_tmp1125_9 = (is_term_equal_nboyer(sc_x_11, false_term_nboyer))), ((sc_tmp1125_9!== false)?sc_tmp1125_9:(is_term_member_nboyer(sc_x_11, false_lst))))!== false))
                    return false;
                else
                    if (!(sc_x_11 instanceof sc_Pair))
                        return false;
                    else
                        if (((sc_x_11.car)===if_constructor_nboyer))
                            if ((((sc_x_8 = (sc_x_11.cdr.car)), (tmp1126 = (is_term_equal_nboyer(sc_x_8, true_term_nboyer))), ((tmp1126!== false)?tmp1126:(is_term_member_nboyer(sc_x_8, true_lst))))!== false))
                                (sc_x_11 = (sc_x_11.cdr.cdr.car));
                            else
                                if ((((x = (sc_x_11.cdr.car)), (tmp1125 = (is_term_equal_nboyer(x, false_term_nboyer))), ((tmp1125!== false)?tmp1125:(is_term_member_nboyer(x, false_lst))))!== false))
                                    (sc_x_11 = (sc_x_11.cdr.cdr.cdr.car));
                                else
                                    if (((tautologyp_nboyer((sc_x_11.cdr.cdr.car), (new sc_Pair((sc_x_11.cdr.car), true_lst)), false_lst))!== false))
                                        {
                                            (false_lst = (new sc_Pair((sc_x_11.cdr.car), false_lst)));
                                            (sc_x_11 = (sc_x_11.cdr.cdr.cdr.car));
                                        }
                                    else
                                        return false;
                        else
                            return false;
        }
    };
    (if_constructor_nboyer = "\u1E9C*");
    (rewrite_count_nboyer = (0));
    rewrite_nboyer = function(term) {
        var term2;
        var sc_term_12;
        var lst;
        var symbol_record;
        var sc_lst_13;
        {
            (++rewrite_count_nboyer);
            if (!(term instanceof sc_Pair))
                return term;
            else
                {
                    (sc_term_12 = (new sc_Pair((term.car), ((sc_lst_13 = (term.cdr)), ((sc_lst_13 === null)?null:(new sc_Pair((rewrite_nboyer((sc_lst_13.car))), (rewrite_args_nboyer((sc_lst_13.cdr))))))))));
                    (lst = ((symbol_record = (term.car)), (symbol_record[(1)])));
                    while (true) {
                        if ((lst === null))
                            return sc_term_12;
                        else
                            if ((((term2 = ((lst.car).cdr.car)), (unify_subst_nboyer = null), (one_way_unify1_nboyer(sc_term_12, term2)))!== false))
                                return (rewrite_nboyer((apply_subst_nboyer(unify_subst_nboyer, ((lst.car).cdr.cdr.car)))));
                            else
                                (lst = (lst.cdr));
                    }
                }
        }
    };
    rewrite_args_nboyer = function(lst) {
        var sc_lst_14;
        return ((lst === null)?null:(new sc_Pair((rewrite_nboyer((lst.car))), ((sc_lst_14 = (lst.cdr)), ((sc_lst_14 === null)?null:(new sc_Pair((rewrite_nboyer((sc_lst_14.car))), (rewrite_args_nboyer((sc_lst_14.cdr))))))))));
    };
    (unify_subst_nboyer = "\u1E9C*");
    one_way_unify1_nboyer = function(term1, term2) {
        var lst1;
        var lst2;
        var temp_temp;
        if (!(term2 instanceof sc_Pair))
            {
                (temp_temp = (sc_assq(term2, unify_subst_nboyer)));
                if ((temp_temp!== false))
                    return (is_term_equal_nboyer(term1, (temp_temp.cdr)));
                else
                    if ((sc_isNumber(term2)))
                        return (sc_isEqual(term1, term2));
                    else
                        {
                            (unify_subst_nboyer = (new sc_Pair((new sc_Pair(term2, term1)), unify_subst_nboyer)));
                            return true;
                        }
            }
        else
            if (!(term1 instanceof sc_Pair))
                return false;
            else
                if (((term1.car)===(term2.car)))
                    {
                        (lst1 = (term1.cdr));
                        (lst2 = (term2.cdr));
                        while (true) {
                            if ((lst1 === null))
                                return (lst2 === null);
                            else
                                if ((lst2 === null))
                                    return false;
                                else
                                    if (((one_way_unify1_nboyer((lst1.car), (lst2.car)))!== false))
                                        {
                                            (lst1 = (lst1.cdr));
                                            (lst2 = (lst2.cdr));
                                        }
                                    else
                                        return false;
                        }
                    }
                else
                    return false;
    };
    (false_term_nboyer = "\u1E9C*");
    (true_term_nboyer = "\u1E9C*");
    trans_of_implies1_nboyer = function(n) {
        var sc_n_15;
        return ((sc_isEqual(n, (1)))?(sc_list("\u1E9Cimplies", (0), (1))):(sc_list("\u1E9Cand", (sc_list("\u1E9Cimplies", (n-(1)), n)), ((sc_n_15 = (n-(1))), ((sc_isEqual(sc_n_15, (1)))?(sc_list("\u1E9Cimplies", (0), (1))):(sc_list("\u1E9Cand", (sc_list("\u1E9Cimplies", (sc_n_15-(1)), sc_n_15)), (trans_of_implies1_nboyer((sc_n_15-(1)))))))))));
    };
    is_term_equal_nboyer = function(x, y) {
        var lst1;
        var lst2;
        var r2;
        var r1;
        if ((x instanceof sc_Pair))
            if ((y instanceof sc_Pair))
                if ((((r1 = (x.car)), (r2 = (y.car)), (r1===r2))!== false))
                    {
                        (lst1 = (x.cdr));
                        (lst2 = (y.cdr));
                        while (true) {
                            if ((lst1 === null))
                                return (lst2 === null);
                            else
                                if ((lst2 === null))
                                    return false;
                                else
                                    if (((is_term_equal_nboyer((lst1.car), (lst2.car)))!== false))
                                        {
                                            (lst1 = (lst1.cdr));
                                            (lst2 = (lst2.cdr));
                                        }
                                    else
                                        return false;
                        }
                    }
                else
                    return false;
            else
                return false;
        else
            return (sc_isEqual(x, y));
    };
    is_term_member_nboyer = function(x, lst) {
        var x;
        var lst;
        while (true) {
            if ((lst === null))
                return false;
            else
                if (((is_term_equal_nboyer(x, (lst.car)))!== false))
                    return true;
                else
                    (lst = (lst.cdr));
        }
    };
    BgL_setupzd2boyerzd2 = function() {
        var symbol_record;
        var value;
        var BgL_sc_symbolzd2record_16zd2;
        var sym;
        var sc_sym_17;
        var term;
        var lst;
        var sc_term_18;
        var sc_term_19;
        {
            (BgL_sc_za2symbolzd2recordszd2alistza2_2z00_nboyer = null);
            (if_constructor_nboyer = (BgL_sc_symbolzd2ze3symbolzd2record_1ze3_nboyer("\u1E9Cif")));
            (false_term_nboyer = ((sc_term_19 = (new sc_Pair("\u1E9Cf",null))), (!(sc_term_19 instanceof sc_Pair)?sc_term_19:(new sc_Pair((BgL_sc_symbolzd2ze3symbolzd2record_1ze3_nboyer((sc_term_19.car))), (translate_args_nboyer((sc_term_19.cdr))))))));
            (true_term_nboyer = ((sc_term_18 = (new sc_Pair("\u1E9Ct",null))), (!(sc_term_18 instanceof sc_Pair)?sc_term_18:(new sc_Pair((BgL_sc_symbolzd2ze3symbolzd2record_1ze3_nboyer((sc_term_18.car))), (translate_args_nboyer((sc_term_18.cdr))))))));
            (lst = sc_const_3_nboyer);
            while (!(lst === null)) {
                {
                    (term = (lst.car));
                    if (((term instanceof sc_Pair)&&(((term.car)==="\u1E9Cequal")&&((term.cdr.car) instanceof sc_Pair))))
                        {
                            (sc_sym_17 = ((term.cdr.car).car));
                            (value = (new sc_Pair((!(term instanceof sc_Pair)?term:(new sc_Pair((BgL_sc_symbolzd2ze3symbolzd2record_1ze3_nboyer((term.car))), (translate_args_nboyer((term.cdr)))))), ((sym = ((term.cdr.car).car)), (BgL_sc_symbolzd2record_16zd2 = (BgL_sc_symbolzd2ze3symbolzd2record_1ze3_nboyer(sym))), (BgL_sc_symbolzd2record_16zd2[(1)])))));
                            (symbol_record = (BgL_sc_symbolzd2ze3symbolzd2record_1ze3_nboyer(sc_sym_17)));
                            (symbol_record[(1)] = value);
                        }
                    else
                        (sc_error("ADD-LEMMA did not like term:  ", term));
                    (lst = (lst.cdr));
                }
            }
            return true;
        }
    };
    BgL_testzd2boyerzd2 = function(n) {
        var optrOpnd;
        var term;
        var sc_n_20;
        var answer;
        var sc_term_21;
        var sc_term_22;
        {
            (rewrite_count_nboyer = (0));
            (term = sc_const_4_nboyer);
            (sc_n_20 = n);
            while (!(sc_n_20=== 0)) {
                {
                    (term = (sc_list("\u1E9Cor", term, (new sc_Pair("\u1E9Cf",null)))));
                    (--sc_n_20);
                }
            }
            (sc_term_22 = term);
            if (!(sc_term_22 instanceof sc_Pair))
                (optrOpnd = sc_term_22);
            else
                (optrOpnd = (new sc_Pair((BgL_sc_symbolzd2ze3symbolzd2record_1ze3_nboyer((sc_term_22.car))), (translate_args_nboyer((sc_term_22.cdr))))));
            (sc_term_21 = (apply_subst_nboyer(((const_nboyer === null)?null:(new sc_Pair((new sc_Pair((const_nboyer.car.car), (translate_term_nboyer((const_nboyer.car.cdr))))), (translate_alist_nboyer((const_nboyer.cdr)))))), optrOpnd)));
            (answer = (tautologyp_nboyer((rewrite_nboyer(sc_term_21)), null, null)));
            (sc_write(rewrite_count_nboyer));
            (sc_display(" rewrites"));
            (sc_newline());
            if ((answer!== false))
                return rewrite_count_nboyer;
            else
                return false;
        }
    };
}
/* Exported Variables */
var BgL_parsezd2ze3nbzd2treesze3;
var BgL_earleyzd2benchmarkzd2;
var BgL_parsezd2ze3parsedzf3zc2;
var test;
var BgL_parsezd2ze3treesz31;
var BgL_makezd2parserzd2;
/* End Exports */

var const_earley;
{
    (const_earley = (new sc_Pair((new sc_Pair("\u1E9Cs",(new sc_Pair((new sc_Pair("\u1E9Ca",null)),(new sc_Pair((new sc_Pair("\u1E9Cs",(new sc_Pair("\u1E9Cs",null)))),null)))))),null)));
    BgL_makezd2parserzd2 = function(grammar, lexer) {
        var i;
        var parser_descr;
        var def_loop;
        var nb_nts;
        var names;
        var steps;
        var predictors;
        var enders;
        var starters;
        var nts;
        var sc_names_1;
        var sc_steps_2;
        var sc_predictors_3;
        var sc_enders_4;
        var sc_starters_5;
        var nb_confs;
        var BgL_sc_defzd2loop_6zd2;
        var BgL_sc_nbzd2nts_7zd2;
        var sc_nts_8;
        var BgL_sc_defzd2loop_9zd2;
        var ind;
        {
            ind = function(nt, sc_nts_10) {
                var i;
                {
                    (i = ((sc_nts_10.length)-(1)));
                    while (true) {
                        if ((i>=(0)))
                            if ((sc_isEqual((sc_nts_10[i]), nt)))
                                return i;
                            else
                                (--i);
                        else
                            return false;
                    }
                }
            };
            (sc_nts_8 = ((BgL_sc_defzd2loop_9zd2 = function(defs, sc_nts_11) {
                var rule_loop;
                var head;
                var def;
                return ((defs instanceof sc_Pair)?((def = (defs.car)), (head = (def.car)), (rule_loop = function(rules, sc_nts_12) {
                    var nt;
                    var l;
                    var sc_nts_13;
                    var rule;
                    if ((rules instanceof sc_Pair))
                        {
                            (rule = (rules.car));
                            (l = rule);
                            (sc_nts_13 = sc_nts_12);
                            while ((l instanceof sc_Pair)) {
                                {
                                    (nt = (l.car));
                                    (l = (l.cdr));
                                    (sc_nts_13 = (((sc_member(nt, sc_nts_13))!== false)?sc_nts_13:(new sc_Pair(nt, sc_nts_13))));
                                }
                            }
                            return (rule_loop((rules.cdr), sc_nts_13));
                        }
                    else
                        return (BgL_sc_defzd2loop_9zd2((defs.cdr), sc_nts_12));
                }), (rule_loop((def.cdr), (((sc_member(head, sc_nts_11))!== false)?sc_nts_11:(new sc_Pair(head, sc_nts_11)))))):(sc_list2vector((sc_reverse(sc_nts_11)))));
            }), (BgL_sc_defzd2loop_9zd2(grammar, null))));
            (BgL_sc_nbzd2nts_7zd2 = (sc_nts_8.length));
            (nb_confs = (((BgL_sc_defzd2loop_6zd2 = function(defs, BgL_sc_nbzd2confs_14zd2) {
                var rule_loop;
                var def;
                return ((defs instanceof sc_Pair)?((def = (defs.car)), (rule_loop = function(rules, BgL_sc_nbzd2confs_15zd2) {
                    var l;
                    var BgL_sc_nbzd2confs_16zd2;
                    var rule;
                    if ((rules instanceof sc_Pair))
                        {
                            (rule = (rules.car));
                            (l = rule);
                            (BgL_sc_nbzd2confs_16zd2 = BgL_sc_nbzd2confs_15zd2);
                            while ((l instanceof sc_Pair)) {
                                {
                                    (l = (l.cdr));
                                    (++BgL_sc_nbzd2confs_16zd2);
                                }
                            }
                            return (rule_loop((rules.cdr), (BgL_sc_nbzd2confs_16zd2+(1))));
                        }
                    else
                        return (BgL_sc_defzd2loop_6zd2((defs.cdr), BgL_sc_nbzd2confs_15zd2));
                }), (rule_loop((def.cdr), BgL_sc_nbzd2confs_14zd2))):BgL_sc_nbzd2confs_14zd2);
            }), (BgL_sc_defzd2loop_6zd2(grammar, (0))))+BgL_sc_nbzd2nts_7zd2));
            (sc_starters_5 = (sc_makeVector(BgL_sc_nbzd2nts_7zd2, null)));
            (sc_enders_4 = (sc_makeVector(BgL_sc_nbzd2nts_7zd2, null)));
            (sc_predictors_3 = (sc_makeVector(BgL_sc_nbzd2nts_7zd2, null)));
            (sc_steps_2 = (sc_makeVector(nb_confs, false)));
            (sc_names_1 = (sc_makeVector(nb_confs, false)));
            (nts = sc_nts_8);
            (starters = sc_starters_5);
            (enders = sc_enders_4);
            (predictors = sc_predictors_3);
            (steps = sc_steps_2);
            (names = sc_names_1);
            (nb_nts = (sc_nts_8.length));
            (i = (nb_nts-(1)));
            while ((i>=(0))) {
                {
                    (sc_steps_2[i] = (i-nb_nts));
                    (sc_names_1[i] = (sc_list((sc_nts_8[i]), (0))));
                    (sc_enders_4[i] = (sc_list(i)));
                    (--i);
                }
            }
            def_loop = function(defs, conf) {
                var rule_loop;
                var head;
                var def;
                return ((defs instanceof sc_Pair)?((def = (defs.car)), (head = (def.car)), (rule_loop = function(rules, conf, rule_num) {
                    var i;
                    var sc_i_17;
                    var nt;
                    var l;
                    var sc_conf_18;
                    var sc_i_19;
                    var rule;
                    if ((rules instanceof sc_Pair))
                        {
                            (rule = (rules.car));
                            (names[conf] = (sc_list(head, rule_num)));
                            (sc_i_19 = (ind(head, nts)));
                            (starters[sc_i_19] = (new sc_Pair(conf, (starters[sc_i_19]))));
                            (l = rule);
                            (sc_conf_18 = conf);
                            while ((l instanceof sc_Pair)) {
                                {
                                    (nt = (l.car));
                                    (steps[sc_conf_18] = (ind(nt, nts)));
                                    (sc_i_17 = (ind(nt, nts)));
                                    (predictors[sc_i_17] = (new sc_Pair(sc_conf_18, (predictors[sc_i_17]))));
                                    (l = (l.cdr));
                                    (++sc_conf_18);
                                }
                            }
                            (steps[sc_conf_18] = ((ind(head, nts))-nb_nts));
                            (i = (ind(head, nts)));
                            (enders[i] = (new sc_Pair(sc_conf_18, (enders[i]))));
                            return (rule_loop((rules.cdr), (sc_conf_18+(1)), (rule_num+(1))));
                        }
                    else
                        return (def_loop((defs.cdr), conf));
                }), (rule_loop((def.cdr), conf, (1)))):undefined);
            };
            (def_loop(grammar, (sc_nts_8.length)));
            (parser_descr = [lexer, sc_nts_8, sc_starters_5, sc_enders_4, sc_predictors_3, sc_steps_2, sc_names_1]);
            return function(input) {
                var optrOpnd;
                var sc_optrOpnd_20;
                var sc_optrOpnd_21;
                var sc_optrOpnd_22;
                var loop1;
                var BgL_sc_stateza2_23za2;
                var toks;
                var BgL_sc_nbzd2nts_24zd2;
                var sc_steps_25;
                var sc_enders_26;
                var state_num;
                var BgL_sc_statesza2_27za2;
                var states;
                var i;
                var conf;
                var l;
                var tok_nts;
                var sc_i_28;
                var sc_i_29;
                var l1;
                var l2;
                var tok;
                var tail1129;
                var L1125;
                var goal_enders;
                var BgL_sc_statesza2_30za2;
                var BgL_sc_nbzd2nts_31zd2;
                var BgL_sc_nbzd2confs_32zd2;
                var nb_toks;
                var goal_starters;
                var sc_states_33;
                var BgL_sc_nbzd2confs_34zd2;
                var BgL_sc_nbzd2toks_35zd2;
                var sc_toks_36;
                var falseHead1128;
                var sc_names_37;
                var sc_steps_38;
                var sc_predictors_39;
                var sc_enders_40;
                var sc_starters_41;
                var sc_nts_42;
                var lexer;
                var sc_ind_43;
                var make_states;
                var BgL_sc_confzd2setzd2getza2_44za2;
                var conf_set_merge_new_bang;
                var conf_set_adjoin;
                var BgL_sc_confzd2setzd2adjoinza2_45za2;
                var BgL_sc_confzd2setzd2adjoinza2za2_46z00;
                var conf_set_union;
                var forw;
                var is_parsed;
                var deriv_trees;
                var BgL_sc_derivzd2treesza2_47z70;
                var nb_deriv_trees;
                var BgL_sc_nbzd2derivzd2treesza2_48za2;
                {
                    sc_ind_43 = function(nt, sc_nts_49) {
                        var i;
                        {
                            (i = ((sc_nts_49.length)-(1)));
                            while (true) {
                                if ((i>=(0)))
                                    if ((sc_isEqual((sc_nts_49[i]), nt)))
                                        return i;
                                    else
                                        (--i);
                                else
                                    return false;
                            }
                        }
                    };
                    make_states = function(BgL_sc_nbzd2toks_50zd2, BgL_sc_nbzd2confs_51zd2) {
                        var v;
                        var i;
                        var sc_states_52;
                        {
                            (sc_states_52 = (sc_makeVector((BgL_sc_nbzd2toks_50zd2+(1)), false)));
                            (i = BgL_sc_nbzd2toks_50zd2);
                            while ((i>=(0))) {
                                {
                                    (v = (sc_makeVector((BgL_sc_nbzd2confs_51zd2+(1)), false)));
                                    (v[(0)] = (-1));
                                    (sc_states_52[i] = v);
                                    (--i);
                                }
                            }
                            return sc_states_52;
                        }
                    };
                    BgL_sc_confzd2setzd2getza2_44za2 = function(state, BgL_sc_statezd2num_53zd2, sc_conf_54) {
                        var conf_set;
                        var BgL_sc_confzd2set_55zd2;
                        return ((BgL_sc_confzd2set_55zd2 = (state[(sc_conf_54+(1))])), ((BgL_sc_confzd2set_55zd2!== false)?BgL_sc_confzd2set_55zd2:((conf_set = (sc_makeVector((BgL_sc_statezd2num_53zd2+(6)), false))), (conf_set[(1)] = (-3)), (conf_set[(2)] = (-1)), (conf_set[(3)] = (-1)), (conf_set[(4)] = (-1)), (state[(sc_conf_54+(1))] = conf_set), conf_set)));
                    };
                    conf_set_merge_new_bang = function(conf_set) {
                        return ((conf_set[((conf_set[(1)])+(5))] = (conf_set[(4)])), (conf_set[(1)] = (conf_set[(3)])), (conf_set[(3)] = (-1)), (conf_set[(4)] = (-1)));
                    };
                    conf_set_adjoin = function(state, conf_set, sc_conf_56, i) {
                        var tail;
                        return ((tail = (conf_set[(3)])), (conf_set[(i+(5))] = (-1)), (conf_set[(tail+(5))] = i), (conf_set[(3)] = i), ((tail<(0))?((conf_set[(0)] = (state[(0)])), (state[(0)] = sc_conf_56)):undefined));
                    };
                    BgL_sc_confzd2setzd2adjoinza2_45za2 = function(sc_states_57, BgL_sc_statezd2num_58zd2, l, i) {
                        var conf_set;
                        var sc_conf_59;
                        var l1;
                        var state;
                        {
                            (state = (sc_states_57[BgL_sc_statezd2num_58zd2]));
                            (l1 = l);
                            while ((l1 instanceof sc_Pair)) {
                                {
                                    (sc_conf_59 = (l1.car));
                                    (conf_set = (BgL_sc_confzd2setzd2getza2_44za2(state, BgL_sc_statezd2num_58zd2, sc_conf_59)));
                                    if (((conf_set[(i+(5))])=== false))
                                        {
                                            (conf_set_adjoin(state, conf_set, sc_conf_59, i));
                                            (l1 = (l1.cdr));
                                        }
                                    else
                                        (l1 = (l1.cdr));
                                }
                            }
                            return undefined;
                        }
                    };
                    BgL_sc_confzd2setzd2adjoinza2za2_46z00 = function(sc_states_60, BgL_sc_statesza2_61za2, BgL_sc_statezd2num_62zd2, sc_conf_63, i) {
                        var BgL_sc_confzd2setza2_64z70;
                        var BgL_sc_stateza2_65za2;
                        var conf_set;
                        var state;
                        return ((state = (sc_states_60[BgL_sc_statezd2num_62zd2])), ((((conf_set = (state[(sc_conf_63+(1))])), ((conf_set!== false)?(conf_set[(i+(5))]):false))!== false)?((BgL_sc_stateza2_65za2 = (BgL_sc_statesza2_61za2[BgL_sc_statezd2num_62zd2])), (BgL_sc_confzd2setza2_64z70 = (BgL_sc_confzd2setzd2getza2_44za2(BgL_sc_stateza2_65za2, BgL_sc_statezd2num_62zd2, sc_conf_63))), (((BgL_sc_confzd2setza2_64z70[(i+(5))])=== false)?(conf_set_adjoin(BgL_sc_stateza2_65za2, BgL_sc_confzd2setza2_64z70, sc_conf_63, i)):undefined), true):false));
                    };
                    conf_set_union = function(state, conf_set, sc_conf_66, other_set) {
                        var i;
                        {
                            (i = (other_set[(2)]));
                            while ((i>=(0))) {
                                if (((conf_set[(i+(5))])=== false))
                                    {
                                        (conf_set_adjoin(state, conf_set, sc_conf_66, i));
                                        (i = (other_set[(i+(5))]));
                                    }
                                else
                                    (i = (other_set[(i+(5))]));
                            }
                            return undefined;
                        }
                    };
                    forw = function(sc_states_67, BgL_sc_statezd2num_68zd2, sc_starters_69, sc_enders_70, sc_predictors_71, sc_steps_72, sc_nts_73) {
                        var next_set;
                        var next;
                        var conf_set;
                        var ender;
                        var l;
                        var starter_set;
                        var starter;
                        var sc_l_74;
                        var sc_loop1_75;
                        var head;
                        var BgL_sc_confzd2set_76zd2;
                        var BgL_sc_statezd2num_77zd2;
                        var state;
                        var sc_states_78;
                        var preds;
                        var BgL_sc_confzd2set_79zd2;
                        var step;
                        var sc_conf_80;
                        var BgL_sc_nbzd2nts_81zd2;
                        var sc_state_82;
                        {
                            (sc_state_82 = (sc_states_67[BgL_sc_statezd2num_68zd2]));
                            (BgL_sc_nbzd2nts_81zd2 = (sc_nts_73.length));
                            while (true) {
                                {
                                    (sc_conf_80 = (sc_state_82[(0)]));
                                    if ((sc_conf_80>=(0)))
                                        {
                                            (step = (sc_steps_72[sc_conf_80]));
                                            (BgL_sc_confzd2set_79zd2 = (sc_state_82[(sc_conf_80+(1))]));
                                            (head = (BgL_sc_confzd2set_79zd2[(4)]));
                                            (sc_state_82[(0)] = (BgL_sc_confzd2set_79zd2[(0)]));
                                            (conf_set_merge_new_bang(BgL_sc_confzd2set_79zd2));
                                            if ((step>=(0)))
                                                {
                                                    (sc_l_74 = (sc_starters_69[step]));
                                                    while ((sc_l_74 instanceof sc_Pair)) {
                                                        {
                                                            (starter = (sc_l_74.car));
                                                            (starter_set = (BgL_sc_confzd2setzd2getza2_44za2(sc_state_82, BgL_sc_statezd2num_68zd2, starter)));
                                                            if (((starter_set[(BgL_sc_statezd2num_68zd2+(5))])=== false))
                                                                {
                                                                    (conf_set_adjoin(sc_state_82, starter_set, starter, BgL_sc_statezd2num_68zd2));
                                                                    (sc_l_74 = (sc_l_74.cdr));
                                                                }
                                                            else
                                                                (sc_l_74 = (sc_l_74.cdr));
                                                        }
                                                    }
                                                    (l = (sc_enders_70[step]));
                                                    while ((l instanceof sc_Pair)) {
                                                        {
                                                            (ender = (l.car));
                                                            if ((((conf_set = (sc_state_82[(ender+(1))])), ((conf_set!== false)?(conf_set[(BgL_sc_statezd2num_68zd2+(5))]):false))!== false))
                                                                {
                                                                    (next = (sc_conf_80+(1)));
                                                                    (next_set = (BgL_sc_confzd2setzd2getza2_44za2(sc_state_82, BgL_sc_statezd2num_68zd2, next)));
                                                                    (conf_set_union(sc_state_82, next_set, next, BgL_sc_confzd2set_79zd2));
                                                                    (l = (l.cdr));
                                                                }
                                                            else
                                                                (l = (l.cdr));
                                                        }
                                                    }
                                                }
                                            else
                                                {
                                                    (preds = (sc_predictors_71[(step+BgL_sc_nbzd2nts_81zd2)]));
                                                    (sc_states_78 = sc_states_67);
                                                    (state = sc_state_82);
                                                    (BgL_sc_statezd2num_77zd2 = BgL_sc_statezd2num_68zd2);
                                                    (BgL_sc_confzd2set_76zd2 = BgL_sc_confzd2set_79zd2);
                                                    sc_loop1_75 = function(l) {
                                                        var sc_state_83;
                                                        var BgL_sc_nextzd2set_84zd2;
                                                        var sc_next_85;
                                                        var pred_set;
                                                        var i;
                                                        var pred;
                                                        if ((l instanceof sc_Pair))
                                                            {
                                                                (pred = (l.car));
                                                                (i = head);
                                                                while ((i>=(0))) {
                                                                    {
                                                                        (pred_set = ((sc_state_83 = (sc_states_78[i])), (sc_state_83[(pred+(1))])));
                                                                        if ((pred_set!== false))
                                                                            {
                                                                                (sc_next_85 = (pred+(1)));
                                                                                (BgL_sc_nextzd2set_84zd2 = (BgL_sc_confzd2setzd2getza2_44za2(state, BgL_sc_statezd2num_77zd2, sc_next_85)));
                                                                                (conf_set_union(state, BgL_sc_nextzd2set_84zd2, sc_next_85, pred_set));
                                                                            }
                                                                        (i = (BgL_sc_confzd2set_76zd2[(i+(5))]));
                                                                    }
                                                                }
                                                                return (sc_loop1_75((l.cdr)));
                                                            }
                                                        else
                                                            return undefined;
                                                    };
                                                    (sc_loop1_75(preds));
                                                }
                                        }
                                    else
                                        return undefined;
                                }
                            }
                        }
                    };
                    is_parsed = function(nt, i, j, sc_nts_86, sc_enders_87, sc_states_88) {
                        var conf_set;
                        var state;
                        var sc_conf_89;
                        var l;
                        var BgL_sc_ntza2_90za2;
                        {
                            (BgL_sc_ntza2_90za2 = (sc_ind_43(nt, sc_nts_86)));
                            if ((BgL_sc_ntza2_90za2!== false))
                                {
                                    (sc_nts_86.length);
                                    (l = (sc_enders_87[BgL_sc_ntza2_90za2]));
                                    while (true) {
                                        if ((l instanceof sc_Pair))
                                            {
                                                (sc_conf_89 = (l.car));
                                                if ((((state = (sc_states_88[j])), (conf_set = (state[(sc_conf_89+(1))])), ((conf_set!== false)?(conf_set[(i+(5))]):false))!== false))
                                                    return true;
                                                else
                                                    (l = (l.cdr));
                                            }
                                        else
                                            return false;
                                    }
                                }
                            else
                                return false;
                        }
                    };
                    deriv_trees = function(sc_conf_91, i, j, sc_enders_92, sc_steps_93, sc_names_94, sc_toks_95, sc_states_96, BgL_sc_nbzd2nts_97zd2) {
                        var sc_loop1_98;
                        var prev;
                        var name;
                        return ((name = (sc_names_94[sc_conf_91])), ((name!== false)?((sc_conf_91<BgL_sc_nbzd2nts_97zd2)?(sc_list((sc_list(name, ((sc_toks_95[i]).car))))):(sc_list((sc_list(name))))):((prev = (sc_conf_91-(1))), (sc_loop1_98 = function(l1, l2) {
                            var loop2;
                            var ender_set;
                            var state;
                            var ender;
                            var l1;
                            var l2;
                            while (true) {
                                if ((l1 instanceof sc_Pair))
                                    {
                                        (ender = (l1.car));
                                        (ender_set = ((state = (sc_states_96[j])), (state[(ender+(1))])));
                                        if ((ender_set!== false))
                                            {
                                                loop2 = function(k, l2) {
                                                    var loop3;
                                                    var ender_trees;
                                                    var prev_trees;
                                                    var conf_set;
                                                    var sc_state_99;
                                                    var k;
                                                    var l2;
                                                    while (true) {
                                                        if ((k>=(0)))
                                                            if (((k>=i)&&(((sc_state_99 = (sc_states_96[k])), (conf_set = (sc_state_99[(prev+(1))])), ((conf_set!== false)?(conf_set[(i+(5))]):false))!== false)))
                                                                {
                                                                    (prev_trees = (deriv_trees(prev, i, k, sc_enders_92, sc_steps_93, sc_names_94, sc_toks_95, sc_states_96, BgL_sc_nbzd2nts_97zd2)));
                                                                    (ender_trees = (deriv_trees(ender, k, j, sc_enders_92, sc_steps_93, sc_names_94, sc_toks_95, sc_states_96, BgL_sc_nbzd2nts_97zd2)));
                                                                    loop3 = function(l3, l2) {
                                                                        var l4;
                                                                        var sc_l2_100;
                                                                        var ender_tree;
                                                                        if ((l3 instanceof sc_Pair))
                                                                            {
                                                                                (ender_tree = (sc_list((l3.car))));
                                                                                (l4 = prev_trees);
                                                                                (sc_l2_100 = l2);
                                                                                while ((l4 instanceof sc_Pair)) {
                                                                                    {
                                                                                        (sc_l2_100 = (new sc_Pair((sc_append((l4.car), ender_tree)), sc_l2_100)));
                                                                                        (l4 = (l4.cdr));
                                                                                    }
                                                                                }
                                                                                return (loop3((l3.cdr), sc_l2_100));
                                                                            }
                                                                        else
                                                                            return (loop2((ender_set[(k+(5))]), l2));
                                                                    };
                                                                    return (loop3(ender_trees, l2));
                                                                }
                                                            else
                                                                (k = (ender_set[(k+(5))]));
                                                        else
                                                            return (sc_loop1_98((l1.cdr), l2));
                                                    }
                                                };
                                                return (loop2((ender_set[(2)]), l2));
                                            }
                                        else
                                            (l1 = (l1.cdr));
                                    }
                                else
                                    return l2;
                            }
                        }), (sc_loop1_98((sc_enders_92[(sc_steps_93[prev])]), null)))));
                    };
                    BgL_sc_derivzd2treesza2_47z70 = function(nt, i, j, sc_nts_101, sc_enders_102, sc_steps_103, sc_names_104, sc_toks_105, sc_states_106) {
                        var conf_set;
                        var state;
                        var sc_conf_107;
                        var l;
                        var trees;
                        var BgL_sc_nbzd2nts_108zd2;
                        var BgL_sc_ntza2_109za2;
                        {
                            (BgL_sc_ntza2_109za2 = (sc_ind_43(nt, sc_nts_101)));
                            if ((BgL_sc_ntza2_109za2!== false))
                                {
                                    (BgL_sc_nbzd2nts_108zd2 = (sc_nts_101.length));
                                    (l = (sc_enders_102[BgL_sc_ntza2_109za2]));
                                    (trees = null);
                                    while ((l instanceof sc_Pair)) {
                                        {
                                            (sc_conf_107 = (l.car));
                                            if ((((state = (sc_states_106[j])), (conf_set = (state[(sc_conf_107+(1))])), ((conf_set!== false)?(conf_set[(i+(5))]):false))!== false))
                                                {
                                                    (l = (l.cdr));
                                                    (trees = (sc_append((deriv_trees(sc_conf_107, i, j, sc_enders_102, sc_steps_103, sc_names_104, sc_toks_105, sc_states_106, BgL_sc_nbzd2nts_108zd2)), trees)));
                                                }
                                            else
                                                (l = (l.cdr));
                                        }
                                    }
                                    return trees;
                                }
                            else
                                return false;
                        }
                    };
                    nb_deriv_trees = function(sc_conf_110, i, j, sc_enders_111, sc_steps_112, sc_toks_113, sc_states_114, BgL_sc_nbzd2nts_115zd2) {
                        var sc_loop1_116;
                        var tmp1124;
                        var prev;
                        return ((prev = (sc_conf_110-(1))), ((((tmp1124 = (sc_conf_110<BgL_sc_nbzd2nts_115zd2)), ((tmp1124!== false)?tmp1124:((sc_steps_112[prev])<(0))))!== false)?(1):((sc_loop1_116 = function(l, sc_n_118) {
                            var nb_ender_trees;
                            var nb_prev_trees;
                            var conf_set;
                            var state;
                            var k;
                            var n;
                            var ender_set;
                            var sc_state_117;
                            var ender;
                            var l;
                            var sc_n_118;
                            while (true) {
                                if ((l instanceof sc_Pair))
                                    {
                                        (ender = (l.car));
                                        (ender_set = ((sc_state_117 = (sc_states_114[j])), (sc_state_117[(ender+(1))])));
                                        if ((ender_set!== false))
                                            {
                                                (k = (ender_set[(2)]));
                                                (n = sc_n_118);
                                                while ((k>=(0))) {
                                                    if (((k>=i)&&(((state = (sc_states_114[k])), (conf_set = (state[(prev+(1))])), ((conf_set!== false)?(conf_set[(i+(5))]):false))!== false)))
                                                        {
                                                            (nb_prev_trees = (nb_deriv_trees(prev, i, k, sc_enders_111, sc_steps_112, sc_toks_113, sc_states_114, BgL_sc_nbzd2nts_115zd2)));
                                                            (nb_ender_trees = (nb_deriv_trees(ender, k, j, sc_enders_111, sc_steps_112, sc_toks_113, sc_states_114, BgL_sc_nbzd2nts_115zd2)));
                                                            (k = (ender_set[(k+(5))]));
                                                            (n +=(nb_prev_trees*nb_ender_trees));
                                                        }
                                                    else
                                                        (k = (ender_set[(k+(5))]));
                                                }
                                                return (sc_loop1_116((l.cdr), n));
                                            }
                                        else
                                            (l = (l.cdr));
                                    }
                                else
                                    return sc_n_118;
                            }
                        }), (sc_loop1_116((sc_enders_111[(sc_steps_112[prev])]), (0))))));
                    };
                    BgL_sc_nbzd2derivzd2treesza2_48za2 = function(nt, i, j, sc_nts_119, sc_enders_120, sc_steps_121, sc_toks_122, sc_states_123) {
                        var conf_set;
                        var state;
                        var sc_conf_124;
                        var l;
                        var nb_trees;
                        var BgL_sc_nbzd2nts_125zd2;
                        var BgL_sc_ntza2_126za2;
                        {
                            (BgL_sc_ntza2_126za2 = (sc_ind_43(nt, sc_nts_119)));
                            if ((BgL_sc_ntza2_126za2!== false))
                                {
                                    (BgL_sc_nbzd2nts_125zd2 = (sc_nts_119.length));
                                    (l = (sc_enders_120[BgL_sc_ntza2_126za2]));
                                    (nb_trees = (0));
                                    while ((l instanceof sc_Pair)) {
                                        {
                                            (sc_conf_124 = (l.car));
                                            if ((((state = (sc_states_123[j])), (conf_set = (state[(sc_conf_124+(1))])), ((conf_set!== false)?(conf_set[(i+(5))]):false))!== false))
                                                {
                                                    (l = (l.cdr));
                                                    (nb_trees = ((nb_deriv_trees(sc_conf_124, i, j, sc_enders_120, sc_steps_121, sc_toks_122, sc_states_123, BgL_sc_nbzd2nts_125zd2))+nb_trees));
                                                }
                                            else
                                                (l = (l.cdr));
                                        }
                                    }
                                    return nb_trees;
                                }
                            else
                                return false;
                        }
                    };
                    (lexer = (parser_descr[(0)]));
                    (sc_nts_42 = (parser_descr[(1)]));
                    (sc_starters_41 = (parser_descr[(2)]));
                    (sc_enders_40 = (parser_descr[(3)]));
                    (sc_predictors_39 = (parser_descr[(4)]));
                    (sc_steps_38 = (parser_descr[(5)]));
                    (sc_names_37 = (parser_descr[(6)]));
                    (falseHead1128 = (new sc_Pair(null, null)));
                    (L1125 = (lexer(input)));
                    (tail1129 = falseHead1128);
                    while (!(L1125 === null)) {
                        {
                            (tok = (L1125.car));
                            (l1 = (tok.cdr));
                            (l2 = null);
                            while ((l1 instanceof sc_Pair)) {
                                {
                                    (sc_i_29 = (sc_ind_43((l1.car), sc_nts_42)));
                                    if ((sc_i_29!== false))
                                        {
                                            (l1 = (l1.cdr));
                                            (l2 = (new sc_Pair(sc_i_29, l2)));
                                        }
                                    else
                                        (l1 = (l1.cdr));
                                }
                            }
                            (sc_optrOpnd_22 = (new sc_Pair((tok.car), (sc_reverse(l2)))));
                            (sc_optrOpnd_21 = (new sc_Pair(sc_optrOpnd_22, null)));
                            (tail1129.cdr = sc_optrOpnd_21);
                            (tail1129 = (tail1129.cdr));
                            (L1125 = (L1125.cdr));
                        }
                    }
                    (sc_optrOpnd_20 = (falseHead1128.cdr));
                    (sc_toks_36 = (sc_list2vector(sc_optrOpnd_20)));
                    (BgL_sc_nbzd2toks_35zd2 = (sc_toks_36.length));
                    (BgL_sc_nbzd2confs_34zd2 = (sc_steps_38.length));
                    (sc_states_33 = (make_states(BgL_sc_nbzd2toks_35zd2, BgL_sc_nbzd2confs_34zd2)));
                    (goal_starters = (sc_starters_41[(0)]));
                    (BgL_sc_confzd2setzd2adjoinza2_45za2(sc_states_33, (0), goal_starters, (0)));
                    (forw(sc_states_33, (0), sc_starters_41, sc_enders_40, sc_predictors_39, sc_steps_38, sc_nts_42));
                    (sc_i_28 = (0));
                    while ((sc_i_28<BgL_sc_nbzd2toks_35zd2)) {
                        {
                            (tok_nts = ((sc_toks_36[sc_i_28]).cdr));
                            (BgL_sc_confzd2setzd2adjoinza2_45za2(sc_states_33, (sc_i_28+(1)), tok_nts, sc_i_28));
                            (forw(sc_states_33, (sc_i_28+(1)), sc_starters_41, sc_enders_40, sc_predictors_39, sc_steps_38, sc_nts_42));
                            (++sc_i_28);
                        }
                    }
                    (nb_toks = (sc_toks_36.length));
                    (BgL_sc_nbzd2confs_32zd2 = (sc_steps_38.length));
                    (BgL_sc_nbzd2nts_31zd2 = (sc_nts_42.length));
                    (BgL_sc_statesza2_30za2 = (make_states(nb_toks, BgL_sc_nbzd2confs_32zd2)));
                    (goal_enders = (sc_enders_40[(0)]));
                    (l = goal_enders);
                    while ((l instanceof sc_Pair)) {
                        {
                            (conf = (l.car));
                            (BgL_sc_confzd2setzd2adjoinza2za2_46z00(sc_states_33, BgL_sc_statesza2_30za2, nb_toks, conf, (0)));
                            (l = (l.cdr));
                        }
                    }
                    (i = nb_toks);
                    while ((i>=(0))) {
                        {
                            (states = sc_states_33);
                            (BgL_sc_statesza2_27za2 = BgL_sc_statesza2_30za2);
                            (state_num = i);
                            (sc_enders_26 = sc_enders_40);
                            (sc_steps_25 = sc_steps_38);
                            (BgL_sc_nbzd2nts_24zd2 = BgL_sc_nbzd2nts_31zd2);
                            (toks = sc_toks_36);
                            (BgL_sc_stateza2_23za2 = (BgL_sc_statesza2_30za2[i]));
                            loop1 = function() {
                                var sc_loop1_127;
                                var prev;
                                var BgL_sc_statesza2_128za2;
                                var sc_states_129;
                                var j;
                                var i;
                                var sc_i_130;
                                var head;
                                var conf_set;
                                var sc_conf_131;
                                {
                                    (sc_conf_131 = (BgL_sc_stateza2_23za2[(0)]));
                                    if ((sc_conf_131>=(0)))
                                        {
                                            (conf_set = (BgL_sc_stateza2_23za2[(sc_conf_131+(1))]));
                                            (head = (conf_set[(4)]));
                                            (BgL_sc_stateza2_23za2[(0)] = (conf_set[(0)]));
                                            (conf_set_merge_new_bang(conf_set));
                                            (sc_i_130 = head);
                                            while ((sc_i_130>=(0))) {
                                                {
                                                    (i = sc_i_130);
                                                    (j = state_num);
                                                    (sc_states_129 = states);
                                                    (BgL_sc_statesza2_128za2 = BgL_sc_statesza2_27za2);
                                                    (prev = (sc_conf_131-(1)));
                                                    if (((sc_conf_131>=BgL_sc_nbzd2nts_24zd2)&&((sc_steps_25[prev])>=(0))))
                                                        {
                                                            sc_loop1_127 = function(l) {
                                                                var k;
                                                                var ender_set;
                                                                var state;
                                                                var ender;
                                                                var l;
                                                                while (true) {
                                                                    if ((l instanceof sc_Pair))
                                                                        {
                                                                            (ender = (l.car));
                                                                            (ender_set = ((state = (sc_states_129[j])), (state[(ender+(1))])));
                                                                            if ((ender_set!== false))
                                                                                {
                                                                                    (k = (ender_set[(2)]));
                                                                                    while ((k>=(0))) {
                                                                                        {
                                                                                            if ((k>=i))
                                                                                                if (((BgL_sc_confzd2setzd2adjoinza2za2_46z00(sc_states_129, BgL_sc_statesza2_128za2, k, prev, i))!== false))
                                                                                                    (BgL_sc_confzd2setzd2adjoinza2za2_46z00(sc_states_129, BgL_sc_statesza2_128za2, j, ender, k));
                                                                                            (k = (ender_set[(k+(5))]));
                                                                                        }
                                                                                    }
                                                                                    return (sc_loop1_127((l.cdr)));
                                                                                }
                                                                            else
                                                                                (l = (l.cdr));
                                                                        }
                                                                    else
                                                                        return undefined;
                                                                }
                                                            };
                                                            (sc_loop1_127((sc_enders_26[(sc_steps_25[prev])])));
                                                        }
                                                    (sc_i_130 = (conf_set[(sc_i_130+(5))]));
                                                }
                                            }
                                            return (loop1());
                                        }
                                    else
                                        return undefined;
                                }
                            };
                            (loop1());
                            (--i);
                        }
                    }
                    (optrOpnd = BgL_sc_statesza2_30za2);
                    return [sc_nts_42, sc_starters_41, sc_enders_40, sc_predictors_39, sc_steps_38, sc_names_37, sc_toks_36, optrOpnd, is_parsed, BgL_sc_derivzd2treesza2_47z70, BgL_sc_nbzd2derivzd2treesza2_48za2];
                }
            };
        }
    };
    BgL_parsezd2ze3parsedzf3zc2 = function(parse, nt, i, j) {
        var is_parsed;
        var states;
        var enders;
        var nts;
        return ((nts = (parse[(0)])), (enders = (parse[(2)])), (states = (parse[(7)])), (is_parsed = (parse[(8)])), (is_parsed(nt, i, j, nts, enders, states)));
    };
    BgL_parsezd2ze3treesz31 = function(parse, nt, i, j) {
        var BgL_sc_derivzd2treesza2_132z70;
        var states;
        var toks;
        var names;
        var steps;
        var enders;
        var nts;
        return ((nts = (parse[(0)])), (enders = (parse[(2)])), (steps = (parse[(4)])), (names = (parse[(5)])), (toks = (parse[(6)])), (states = (parse[(7)])), (BgL_sc_derivzd2treesza2_132z70 = (parse[(9)])), (BgL_sc_derivzd2treesza2_132z70(nt, i, j, nts, enders, steps, names, toks, states)));
    };
    BgL_parsezd2ze3nbzd2treesze3 = function(parse, nt, i, j) {
        var BgL_sc_nbzd2derivzd2treesza2_133za2;
        var states;
        var toks;
        var steps;
        var enders;
        var nts;
        return ((nts = (parse[(0)])), (enders = (parse[(2)])), (steps = (parse[(4)])), (toks = (parse[(6)])), (states = (parse[(7)])), (BgL_sc_nbzd2derivzd2treesza2_133za2 = (parse[(10)])), (BgL_sc_nbzd2derivzd2treesza2_133za2(nt, i, j, nts, enders, steps, toks, states)));
    };
    test = function(k) {
        var x;
        var p;
        return ((p = (BgL_makezd2parserzd2(const_earley, function(l) {
            var sc_x_134;
            var tail1134;
            var L1130;
            var falseHead1133;
            {
                (falseHead1133 = (new sc_Pair(null, null)));
                (tail1134 = falseHead1133);
                (L1130 = l);
                while (!(L1130 === null)) {
                    {
                        (tail1134.cdr = (new sc_Pair(((sc_x_134 = (L1130.car)), (sc_list(sc_x_134, sc_x_134))), null)));
                        (tail1134 = (tail1134.cdr));
                        (L1130 = (L1130.cdr));
                    }
                }
                return (falseHead1133.cdr);
            }
        }))), (x = (p((sc_vector2list((sc_makeVector(k, "\u1E9Ca"))))))), (sc_length((BgL_parsezd2ze3treesz31(x, "\u1E9Cs", (0), k)))));
    };
    BgL_earleyzd2benchmarkzd2 = function() {
        var args = null;
        for (var sc_tmp = arguments.length - 1; sc_tmp >= 0; sc_tmp--) {
            args = sc_cons(arguments[sc_tmp], args);
        }
        var k;
        return ((k = ((args === null)?(7):(args.car))), (BgL_runzd2benchmarkzd2("earley", (1), function() {
            return (test(k));
        }, function(result) {
            return ((sc_display(result)), (sc_newline()), true);
        })));
    };
}


/************* END OF GENERATED CODE *************/
// Invoke this function to run a benchmark.
// The first argument is a string identifying the benchmark.
// The second argument is the number of times to run the benchmark.
// The third argument is a function that runs the benchmark.
// The fourth argument is a unary function that warns if the result
// returned by the benchmark is incorrect.
//
// Example:
// RunBenchmark("new Array()",
//              1,
//              function () { new Array(1000000); }
//              function (v) {
//                return (v instanceof Array) && (v.length == 1000000);
//              });

SC_DEFAULT_OUT = new sc_GenericOutputPort(function(s) {});
SC_ERROR_OUT = SC_DEFAULT_OUT;

function RunBenchmark(name, count, run, warn) {
  for (var n = 0; n < count; ++n) {
    result = run();
  }
}

var BgL_runzd2benchmarkzd2 = RunBenchmark;

for (var i = 0; i < 4; ++i) {
  BgL_earleyzd2benchmarkzd2();
  BgL_nboyerzd2benchmarkzd2();
}
// The ray tracer code in this file is written by Adam Burmister. It
// is available in its original form from:
//
//   http://labs.flog.nz.co/raytracer/
//
// It has been modified slightly by Google to work as a standalone
// benchmark, but the all the computational code remains
// untouched. This file also contains a copy of the Prototype
// JavaScript framework which is used by the ray tracer.

// Create dummy objects if we're not running in a browser.
if (typeof document == 'undefined') {
  document = { };
  window = { opera: null };
  navigator = { userAgent: null, appVersion: "" };
}


// ------------------------------------------------------------------------
// ------------------------------------------------------------------------


/*  Prototype JavaScript framework, version 1.5.0
 *  (c) 2005-2007 Sam Stephenson
 *
 *  Prototype is freely distributable under the terms of an MIT-style license.
 *  For details, see the Prototype web site: http://prototype.conio.net/
 *
/*--------------------------------------------------------------------------*/

//--------------------
var Prototype = {
  Version: '1.5.0',
  BrowserFeatures: {
    XPath: !!document.evaluate
  },

  ScriptFragment: '(?:<script.*?>)((\n|\r|.)*?)(?:<\/script>)',
  emptyFunction: function() {},
  K: function(x) { return x }
}

var Class = {
  create: function() {
    return function() {
      this.initialize.apply(this, arguments);
    }
  }
}

var Abstract = new Object();

Object.extend = function(destination, source) {
  for (var property in source) {
    destination[property] = source[property];
  }
  return destination;
}

Object.extend(Object, {
  inspect: function(object) {
    try {
      if (object === undefined) return 'undefined';
      if (object === null) return 'null';
      return object.inspect ? object.inspect() : object.toString();
    } catch (e) {
      if (e instanceof RangeError) return '...';
      throw e;
    }
  },

  keys: function(object) {
    var keys = [];
    for (var property in object)
      keys.push(property);
    return keys;
  },

  values: function(object) {
    var values = [];
    for (var property in object)
      values.push(object[property]);
    return values;
  },

  clone: function(object) {
    return Object.extend({}, object);
  }
});

Function.prototype.bind = function() {
  var __method = this, args = $A(arguments), object = args.shift();
  return function() {
    return __method.apply(object, args.concat($A(arguments)));
  }
}

Function.prototype.bindAsEventListener = function(object) {
  var __method = this, args = $A(arguments), object = args.shift();
  return function(event) {
    return __method.apply(object, [( event || window.event)].concat(args).concat($A(arguments)));
  }
}

Object.extend(Number.prototype, {
  toColorPart: function() {
    var digits = this.toString(16);
    if (this < 16) return '0' + digits;
    return digits;
  },

  succ: function() {
    return this + 1;
  },

  times: function(iterator) {
    $R(0, this, true).each(iterator);
    return this;
  }
});

var Try = {
  these: function() {
    var returnValue;

    for (var i = 0, length = arguments.length; i < length; i++) {
      var lambda = arguments[i];
      try {
        returnValue = lambda();
        break;
      } catch (e) {}
    }

    return returnValue;
  }
}

/*--------------------------------------------------------------------------*/

var PeriodicalExecuter = Class.create();
PeriodicalExecuter.prototype = {
  initialize: function(callback, frequency) {
    this.callback = callback;
    this.frequency = frequency;
    this.currentlyExecuting = false;

    this.registerCallback();
  },

  registerCallback: function() {
    this.timer = setInterval(this.onTimerEvent.bind(this), this.frequency * 1000);
  },

  stop: function() {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
  },

  onTimerEvent: function() {
    if (!this.currentlyExecuting) {
      try {
        this.currentlyExecuting = true;
        this.callback(this);
      } finally {
        this.currentlyExecuting = false;
      }
    }
  }
}
String.interpret = function(value){
  return value == null ? '' : String(value);
}

Object.extend(String.prototype, {
  gsub: function(pattern, replacement) {
    var result = '', source = this, match;
    replacement = arguments.callee.prepareReplacement(replacement);

    while (source.length > 0) {
      if (match = source.match(pattern)) {
        result += source.slice(0, match.index);
        result += String.interpret(replacement(match));
        source  = source.slice(match.index + match[0].length);
      } else {
        result += source, source = '';
      }
    }
    return result;
  },

  sub: function(pattern, replacement, count) {
    replacement = this.gsub.prepareReplacement(replacement);
    count = count === undefined ? 1 : count;

    return this.gsub(pattern, function(match) {
      if (--count < 0) return match[0];
      return replacement(match);
    });
  },

  scan: function(pattern, iterator) {
    this.gsub(pattern, iterator);
    return this;
  },

  truncate: function(length, truncation) {
    length = length || 30;
    truncation = truncation === undefined ? '...' : truncation;
    return this.length > length ?
      this.slice(0, length - truncation.length) + truncation : this;
  },

  strip: function() {
    return this.replace(/^\s+/, '').replace(/\s+$/, '');
  },

  stripTags: function() {
    return this.replace(/<\/?[^>]+>/gi, '');
  },

  stripScripts: function() {
    return this.replace(new RegExp(Prototype.ScriptFragment, 'img'), '');
  },

  extractScripts: function() {
    var matchAll = new RegExp(Prototype.ScriptFragment, 'img');
    var matchOne = new RegExp(Prototype.ScriptFragment, 'im');
    return (this.match(matchAll) || []).map(function(scriptTag) {
      return (scriptTag.match(matchOne) || ['', ''])[1];
    });
  },

  evalScripts: function() {
    return this.extractScripts().map(function(script) { return eval(script) });
  },

  escapeHTML: function() {
    var div = document.createElement('div');
    var text = document.createTextNode(this);
    div.appendChild(text);
    return div.innerHTML;
  },

  unescapeHTML: function() {
    var div = document.createElement('div');
    div.innerHTML = this.stripTags();
    return div.childNodes[0] ? (div.childNodes.length > 1 ?
      $A(div.childNodes).inject('',function(memo,node){ return memo+node.nodeValue }) :
      div.childNodes[0].nodeValue) : '';
  },

  toQueryParams: function(separator) {
    var match = this.strip().match(/([^?#]*)(#.*)?$/);
    if (!match) return {};

    return match[1].split(separator || '&').inject({}, function(hash, pair) {
      if ((pair = pair.split('='))[0]) {
        var name = decodeURIComponent(pair[0]);
        var value = pair[1] ? decodeURIComponent(pair[1]) : undefined;

        if (hash[name] !== undefined) {
          if (hash[name].constructor != Array)
            hash[name] = [hash[name]];
          if (value) hash[name].push(value);
        }
        else hash[name] = value;
      }
      return hash;
    });
  },

  toArray: function() {
    return this.split('');
  },

  succ: function() {
    return this.slice(0, this.length - 1) +
      String.fromCharCode(this.charCodeAt(this.length - 1) + 1);
  },

  camelize: function() {
    var parts = this.split('-'), len = parts.length;
    if (len == 1) return parts[0];

    var camelized = this.charAt(0) == '-'
      ? parts[0].charAt(0).toUpperCase() + parts[0].substring(1)
      : parts[0];

    for (var i = 1; i < len; i++)
      camelized += parts[i].charAt(0).toUpperCase() + parts[i].substring(1);

    return camelized;
  },

  capitalize: function(){
    return this.charAt(0).toUpperCase() + this.substring(1).toLowerCase();
  },

  underscore: function() {
    return this.gsub(/::/, '/').gsub(/([A-Z]+)([A-Z][a-z])/,'#{1}_#{2}').gsub(/([a-z\d])([A-Z])/,'#{1}_#{2}').gsub(/-/,'_').toLowerCase();
  },

  dasherize: function() {
    return this.gsub(/_/,'-');
  },

  inspect: function(useDoubleQuotes) {
    var escapedString = this.replace(/\\/g, '\\\\');
    if (useDoubleQuotes)
      return '"' + escapedString.replace(/"/g, '\\"') + '"';
    else
      return "'" + escapedString.replace(/'/g, '\\\'') + "'";
  }
});

String.prototype.gsub.prepareReplacement = function(replacement) {
  if (typeof replacement == 'function') return replacement;
  var template = new Template(replacement);
  return function(match) { return template.evaluate(match) };
}

String.prototype.parseQuery = String.prototype.toQueryParams;

var Template = Class.create();
Template.Pattern = /(^|.|\r|\n)(#\{(.*?)\})/;
Template.prototype = {
  initialize: function(template, pattern) {
    this.template = template.toString();
    this.pattern  = pattern || Template.Pattern;
  },

  evaluate: function(object) {
    return this.template.gsub(this.pattern, function(match) {
      var before = match[1];
      if (before == '\\') return match[2];
      return before + String.interpret(object[match[3]]);
    });
  }
}

var $break    = new Object();
var $continue = new Object();

var Enumerable = {
  each: function(iterator) {
    var index = 0;
    try {
      this._each(function(value) {
        try {
          iterator(value, index++);
        } catch (e) {
          if (e != $continue) throw e;
        }
      });
    } catch (e) {
      if (e != $break) throw e;
    }
    return this;
  },

  eachSlice: function(number, iterator) {
    var index = -number, slices = [], array = this.toArray();
    while ((index += number) < array.length)
      slices.push(array.slice(index, index+number));
    return slices.map(iterator);
  },

  all: function(iterator) {
    var result = true;
    this.each(function(value, index) {
      result = result && !!(iterator || Prototype.K)(value, index);
      if (!result) throw $break;
    });
    return result;
  },

  any: function(iterator) {
    var result = false;
    this.each(function(value, index) {
      if (result = !!(iterator || Prototype.K)(value, index))
        throw $break;
    });
    return result;
  },

  collect: function(iterator) {
    var results = [];
    this.each(function(value, index) {
      results.push((iterator || Prototype.K)(value, index));
    });
    return results;
  },

  detect: function(iterator) {
    var result;
    this.each(function(value, index) {
      if (iterator(value, index)) {
        result = value;
        throw $break;
      }
    });
    return result;
  },

  findAll: function(iterator) {
    var results = [];
    this.each(function(value, index) {
      if (iterator(value, index))
        results.push(value);
    });
    return results;
  },

  grep: function(pattern, iterator) {
    var results = [];
    this.each(function(value, index) {
      var stringValue = value.toString();
      if (stringValue.match(pattern))
        results.push((iterator || Prototype.K)(value, index));
    })
    return results;
  },

  include: function(object) {
    var found = false;
    this.each(function(value) {
      if (value == object) {
        found = true;
        throw $break;
      }
    });
    return found;
  },

  inGroupsOf: function(number, fillWith) {
    fillWith = fillWith === undefined ? null : fillWith;
    return this.eachSlice(number, function(slice) {
      while(slice.length < number) slice.push(fillWith);
      return slice;
    });
  },

  inject: function(memo, iterator) {
    this.each(function(value, index) {
      memo = iterator(memo, value, index);
    });
    return memo;
  },

  invoke: function(method) {
    var args = $A(arguments).slice(1);
    return this.map(function(value) {
      return value[method].apply(value, args);
    });
  },

  max: function(iterator) {
    var result;
    this.each(function(value, index) {
      value = (iterator || Prototype.K)(value, index);
      if (result == undefined || value >= result)
        result = value;
    });
    return result;
  },

  min: function(iterator) {
    var result;
    this.each(function(value, index) {
      value = (iterator || Prototype.K)(value, index);
      if (result == undefined || value < result)
        result = value;
    });
    return result;
  },

  partition: function(iterator) {
    var trues = [], falses = [];
    this.each(function(value, index) {
      ((iterator || Prototype.K)(value, index) ?
        trues : falses).push(value);
    });
    return [trues, falses];
  },

  pluck: function(property) {
    var results = [];
    this.each(function(value, index) {
      results.push(value[property]);
    });
    return results;
  },

  reject: function(iterator) {
    var results = [];
    this.each(function(value, index) {
      if (!iterator(value, index))
        results.push(value);
    });
    return results;
  },

  sortBy: function(iterator) {
    return this.map(function(value, index) {
      return {value: value, criteria: iterator(value, index)};
    }).sort(function(left, right) {
      var a = left.criteria, b = right.criteria;
      return a < b ? -1 : a > b ? 1 : 0;
    }).pluck('value');
  },

  toArray: function() {
    return this.map();
  },

  zip: function() {
    var iterator = Prototype.K, args = $A(arguments);
    if (typeof args.last() == 'function')
      iterator = args.pop();

    var collections = [this].concat(args).map($A);
    return this.map(function(value, index) {
      return iterator(collections.pluck(index));
    });
  },

  size: function() {
    return this.toArray().length;
  },

  inspect: function() {
    return '#<Enumerable:' + this.toArray().inspect() + '>';
  }
}

Object.extend(Enumerable, {
  map:     Enumerable.collect,
  find:    Enumerable.detect,
  select:  Enumerable.findAll,
  member:  Enumerable.include,
  entries: Enumerable.toArray
});
var $A = Array.from = function(iterable) {
  if (!iterable) return [];
  if (iterable.toArray) {
    return iterable.toArray();
  } else {
    var results = [];
    for (var i = 0, length = iterable.length; i < length; i++)
      results.push(iterable[i]);
    return results;
  }
}

Object.extend(Array.prototype, Enumerable);

if (!Array.prototype._reverse)
  Array.prototype._reverse = Array.prototype.reverse;

Object.extend(Array.prototype, {
  _each: function(iterator) {
    for (var i = 0, length = this.length; i < length; i++)
      iterator(this[i]);
  },

  clear: function() {
    this.length = 0;
    return this;
  },

  first: function() {
    return this[0];
  },

  last: function() {
    return this[this.length - 1];
  },

  compact: function() {
    return this.select(function(value) {
      return value != null;
    });
  },

  flatten: function() {
    return this.inject([], function(array, value) {
      return array.concat(value && value.constructor == Array ?
        value.flatten() : [value]);
    });
  },

  without: function() {
    var values = $A(arguments);
    return this.select(function(value) {
      return !values.include(value);
    });
  },

  indexOf: function(object) {
    for (var i = 0, length = this.length; i < length; i++)
      if (this[i] == object) return i;
    return -1;
  },

  reverse: function(inline) {
    return (inline !== false ? this : this.toArray())._reverse();
  },

  reduce: function() {
    return this.length > 1 ? this : this[0];
  },

  uniq: function() {
    return this.inject([], function(array, value) {
      return array.include(value) ? array : array.concat([value]);
    });
  },

  clone: function() {
    return [].concat(this);
  },

  size: function() {
    return this.length;
  },

  inspect: function() {
    return '[' + this.map(Object.inspect).join(', ') + ']';
  }
});

Array.prototype.toArray = Array.prototype.clone;

function $w(string){
  string = string.strip();
  return string ? string.split(/\s+/) : [];
}

if(window.opera){
  Array.prototype.concat = function(){
    var array = [];
    for(var i = 0, length = this.length; i < length; i++) array.push(this[i]);
    for(var i = 0, length = arguments.length; i < length; i++) {
      if(arguments[i].constructor == Array) {
        for(var j = 0, arrayLength = arguments[i].length; j < arrayLength; j++)
          array.push(arguments[i][j]);
      } else {
        array.push(arguments[i]);
      }
    }
    return array;
  }
}
var Hash = function(obj) {
  Object.extend(this, obj || {});
};

Object.extend(Hash, {
  toQueryString: function(obj) {
    var parts = [];

	  this.prototype._each.call(obj, function(pair) {
      if (!pair.key) return;

      if (pair.value && pair.value.constructor == Array) {
        var values = pair.value.compact();
        if (values.length < 2) pair.value = values.reduce();
        else {
        	key = encodeURIComponent(pair.key);
          values.each(function(value) {
            value = value != undefined ? encodeURIComponent(value) : '';
            parts.push(key + '=' + encodeURIComponent(value));
          });
          return;
        }
      }
      if (pair.value == undefined) pair[1] = '';
      parts.push(pair.map(encodeURIComponent).join('='));
	  });

    return parts.join('&');
  }
});

Object.extend(Hash.prototype, Enumerable);
Object.extend(Hash.prototype, {
  _each: function(iterator) {
    for (var key in this) {
      var value = this[key];
      if (value && value == Hash.prototype[key]) continue;

      var pair = [key, value];
      pair.key = key;
      pair.value = value;
      iterator(pair);
    }
  },

  keys: function() {
    return this.pluck('key');
  },

  values: function() {
    return this.pluck('value');
  },

  merge: function(hash) {
    return $H(hash).inject(this, function(mergedHash, pair) {
      mergedHash[pair.key] = pair.value;
      return mergedHash;
    });
  },

  remove: function() {
    var result;
    for(var i = 0, length = arguments.length; i < length; i++) {
      var value = this[arguments[i]];
      if (value !== undefined){
        if (result === undefined) result = value;
        else {
          if (result.constructor != Array) result = [result];
          result.push(value)
        }
      }
      delete this[arguments[i]];
    }
    return result;
  },

  toQueryString: function() {
    return Hash.toQueryString(this);
  },

  inspect: function() {
    return '#<Hash:{' + this.map(function(pair) {
      return pair.map(Object.inspect).join(': ');
    }).join(', ') + '}>';
  }
});

function $H(object) {
  if (object && object.constructor == Hash) return object;
  return new Hash(object);
};
ObjectRange = Class.create();
Object.extend(ObjectRange.prototype, Enumerable);
Object.extend(ObjectRange.prototype, {
  initialize: function(start, end, exclusive) {
    this.start = start;
    this.end = end;
    this.exclusive = exclusive;
  },

  _each: function(iterator) {
    var value = this.start;
    while (this.include(value)) {
      iterator(value);
      value = value.succ();
    }
  },

  include: function(value) {
    if (value < this.start)
      return false;
    if (this.exclusive)
      return value < this.end;
    return value <= this.end;
  }
});

var $R = function(start, end, exclusive) {
  return new ObjectRange(start, end, exclusive);
}

var Ajax = {
  getTransport: function() {
    return Try.these(
      function() {return new XMLHttpRequest()},
      function() {return new ActiveXObject('Msxml2.XMLHTTP')},
      function() {return new ActiveXObject('Microsoft.XMLHTTP')}
    ) || false;
  },

  activeRequestCount: 0
}

Ajax.Responders = {
  responders: [],

  _each: function(iterator) {
    this.responders._each(iterator);
  },

  register: function(responder) {
    if (!this.include(responder))
      this.responders.push(responder);
  },

  unregister: function(responder) {
    this.responders = this.responders.without(responder);
  },

  dispatch: function(callback, request, transport, json) {
    this.each(function(responder) {
      if (typeof responder[callback] == 'function') {
        try {
          responder[callback].apply(responder, [request, transport, json]);
        } catch (e) {}
      }
    });
  }
};

Object.extend(Ajax.Responders, Enumerable);

Ajax.Responders.register({
  onCreate: function() {
    Ajax.activeRequestCount++;
  },
  onComplete: function() {
    Ajax.activeRequestCount--;
  }
});

Ajax.Base = function() {};
Ajax.Base.prototype = {
  setOptions: function(options) {
    this.options = {
      method:       'post',
      asynchronous: true,
      contentType:  'application/x-www-form-urlencoded',
      encoding:     'UTF-8',
      parameters:   ''
    }
    Object.extend(this.options, options || {});

    this.options.method = this.options.method.toLowerCase();
    if (typeof this.options.parameters == 'string')
      this.options.parameters = this.options.parameters.toQueryParams();
  }
}

Ajax.Request = Class.create();
Ajax.Request.Events =
  ['Uninitialized', 'Loading', 'Loaded', 'Interactive', 'Complete'];

Ajax.Request.prototype = Object.extend(new Ajax.Base(), {
  _complete: false,

  initialize: function(url, options) {
    this.transport = Ajax.getTransport();
    this.setOptions(options);
    this.request(url);
  },

  request: function(url) {
    this.url = url;
    this.method = this.options.method;
    var params = this.options.parameters;

    if (!['get', 'post'].include(this.method)) {
      // simulate other verbs over post
      params['_method'] = this.method;
      this.method = 'post';
    }

    params = Hash.toQueryString(params);
    if (params && /Konqueror|Safari|KHTML/.test(navigator.userAgent)) params += '&_='

    // when GET, append parameters to URL
    if (this.method == 'get' && params)
      this.url += (this.url.indexOf('?') > -1 ? '&' : '?') + params;

    try {
      Ajax.Responders.dispatch('onCreate', this, this.transport);

      this.transport.open(this.method.toUpperCase(), this.url,
        this.options.asynchronous);

      if (this.options.asynchronous)
        setTimeout(function() { this.respondToReadyState(1) }.bind(this), 10);

      this.transport.onreadystatechange = this.onStateChange.bind(this);
      this.setRequestHeaders();

      var body = this.method == 'post' ? (this.options.postBody || params) : null;

      this.transport.send(body);

      /* Force Firefox to handle ready state 4 for synchronous requests */
      if (!this.options.asynchronous && this.transport.overrideMimeType)
        this.onStateChange();

    }
    catch (e) {
      this.dispatchException(e);
    }
  },

  onStateChange: function() {
    var readyState = this.transport.readyState;
    if (readyState > 1 && !((readyState == 4) && this._complete))
      this.respondToReadyState(this.transport.readyState);
  },

  setRequestHeaders: function() {
    var headers = {
      'X-Requested-With': 'XMLHttpRequest',
      'X-Prototype-Version': Prototype.Version,
      'Accept': 'text/javascript, text/html, application/xml, text/xml, */*'
    };

    if (this.method == 'post') {
      headers['Content-type'] = this.options.contentType +
        (this.options.encoding ? '; charset=' + this.options.encoding : '');

      /* Force "Connection: close" for older Mozilla browsers to work
       * around a bug where XMLHttpRequest sends an incorrect
       * Content-length header. See Mozilla Bugzilla #246651.
       */
      if (this.transport.overrideMimeType &&
          (navigator.userAgent.match(/Gecko\/(\d{4})/) || [0,2005])[1] < 2005)
            headers['Connection'] = 'close';
    }

    // user-defined headers
    if (typeof this.options.requestHeaders == 'object') {
      var extras = this.options.requestHeaders;

      if (typeof extras.push == 'function')
        for (var i = 0, length = extras.length; i < length; i += 2)
          headers[extras[i]] = extras[i+1];
      else
        $H(extras).each(function(pair) { headers[pair.key] = pair.value });
    }

    for (var name in headers)
      this.transport.setRequestHeader(name, headers[name]);
  },

  success: function() {
    return !this.transport.status
        || (this.transport.status >= 200 && this.transport.status < 300);
  },

  respondToReadyState: function(readyState) {
    var state = Ajax.Request.Events[readyState];
    var transport = this.transport, json = this.evalJSON();

    if (state == 'Complete') {
      try {
        this._complete = true;
        (this.options['on' + this.transport.status]
         || this.options['on' + (this.success() ? 'Success' : 'Failure')]
         || Prototype.emptyFunction)(transport, json);
      } catch (e) {
        this.dispatchException(e);
      }

      if ((this.getHeader('Content-type') || 'text/javascript').strip().
        match(/^(text|application)\/(x-)?(java|ecma)script(;.*)?$/i))
          this.evalResponse();
    }

    try {
      (this.options['on' + state] || Prototype.emptyFunction)(transport, json);
      Ajax.Responders.dispatch('on' + state, this, transport, json);
    } catch (e) {
      this.dispatchException(e);
    }

    if (state == 'Complete') {
      // avoid memory leak in MSIE: clean up
      this.transport.onreadystatechange = Prototype.emptyFunction;
    }
  },

  getHeader: function(name) {
    try {
      return this.transport.getResponseHeader(name);
    } catch (e) { return null }
  },

  evalJSON: function() {
    try {
      var json = this.getHeader('X-JSON');
      return json ? eval('(' + json + ')') : null;
    } catch (e) { return null }
  },

  evalResponse: function() {
    try {
      return eval(this.transport.responseText);
    } catch (e) {
      this.dispatchException(e);
    }
  },

  dispatchException: function(exception) {
    (this.options.onException || Prototype.emptyFunction)(this, exception);
    Ajax.Responders.dispatch('onException', this, exception);
  }
});

Ajax.Updater = Class.create();

Object.extend(Object.extend(Ajax.Updater.prototype, Ajax.Request.prototype), {
  initialize: function(container, url, options) {
    this.container = {
      success: (container.success || container),
      failure: (container.failure || (container.success ? null : container))
    }

    this.transport = Ajax.getTransport();
    this.setOptions(options);

    var onComplete = this.options.onComplete || Prototype.emptyFunction;
    this.options.onComplete = (function(transport, param) {
      this.updateContent();
      onComplete(transport, param);
    }).bind(this);

    this.request(url);
  },

  updateContent: function() {
    var receiver = this.container[this.success() ? 'success' : 'failure'];
    var response = this.transport.responseText;

    if (!this.options.evalScripts) response = response.stripScripts();

    if (receiver = $(receiver)) {
      if (this.options.insertion)
        new this.options.insertion(receiver, response);
      else
        receiver.update(response);
    }

    if (this.success()) {
      if (this.onComplete)
        setTimeout(this.onComplete.bind(this), 10);
    }
  }
});

Ajax.PeriodicalUpdater = Class.create();
Ajax.PeriodicalUpdater.prototype = Object.extend(new Ajax.Base(), {
  initialize: function(container, url, options) {
    this.setOptions(options);
    this.onComplete = this.options.onComplete;

    this.frequency = (this.options.frequency || 2);
    this.decay = (this.options.decay || 1);

    this.updater = {};
    this.container = container;
    this.url = url;

    this.start();
  },

  start: function() {
    this.options.onComplete = this.updateComplete.bind(this);
    this.onTimerEvent();
  },

  stop: function() {
    this.updater.options.onComplete = undefined;
    clearTimeout(this.timer);
    (this.onComplete || Prototype.emptyFunction).apply(this, arguments);
  },

  updateComplete: function(request) {
    if (this.options.decay) {
      this.decay = (request.responseText == this.lastText ?
        this.decay * this.options.decay : 1);

      this.lastText = request.responseText;
    }
    this.timer = setTimeout(this.onTimerEvent.bind(this),
      this.decay * this.frequency * 1000);
  },

  onTimerEvent: function() {
    this.updater = new Ajax.Updater(this.container, this.url, this.options);
  }
});
function $(element) {
  if (arguments.length > 1) {
    for (var i = 0, elements = [], length = arguments.length; i < length; i++)
      elements.push($(arguments[i]));
    return elements;
  }
  if (typeof element == 'string')
    element = document.getElementById(element);
  return Element.extend(element);
}

if (Prototype.BrowserFeatures.XPath) {
  document._getElementsByXPath = function(expression, parentElement) {
    var results = [];
    var query = document.evaluate(expression, $(parentElement) || document,
      null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    for (var i = 0, length = query.snapshotLength; i < length; i++)
      results.push(query.snapshotItem(i));
    return results;
  };
}

document.getElementsByClassName = function(className, parentElement) {
  if (Prototype.BrowserFeatures.XPath) {
    var q = ".//*[contains(concat(' ', @class, ' '), ' " + className + " ')]";
    return document._getElementsByXPath(q, parentElement);
  } else {
    var children = ($(parentElement) || document.body).getElementsByTagName('*');
    var elements = [], child;
    for (var i = 0, length = children.length; i < length; i++) {
      child = children[i];
      if (Element.hasClassName(child, className))
        elements.push(Element.extend(child));
    }
    return elements;
  }
};

/*--------------------------------------------------------------------------*/

if (!window.Element)
  var Element = new Object();

Element.extend = function(element) {
  if (!element || _nativeExtensions || element.nodeType == 3) return element;

  if (!element._extended && element.tagName && element != window) {
    var methods = Object.clone(Element.Methods), cache = Element.extend.cache;

    if (element.tagName == 'FORM')
      Object.extend(methods, Form.Methods);
    if (['INPUT', 'TEXTAREA', 'SELECT'].include(element.tagName))
      Object.extend(methods, Form.Element.Methods);

    Object.extend(methods, Element.Methods.Simulated);

    for (var property in methods) {
      var value = methods[property];
      if (typeof value == 'function' && !(property in element))
        element[property] = cache.findOrStore(value);
    }
  }

  element._extended = true;
  return element;
};

Element.extend.cache = {
  findOrStore: function(value) {
    return this[value] = this[value] || function() {
      return value.apply(null, [this].concat($A(arguments)));
    }
  }
};

Element.Methods = {
  visible: function(element) {
    return $(element).style.display != 'none';
  },

  toggle: function(element) {
    element = $(element);
    Element[Element.visible(element) ? 'hide' : 'show'](element);
    return element;
  },

  hide: function(element) {
    $(element).style.display = 'none';
    return element;
  },

  show: function(element) {
    $(element).style.display = '';
    return element;
  },

  remove: function(element) {
    element = $(element);
    element.parentNode.removeChild(element);
    return element;
  },

  update: function(element, html) {
    html = typeof html == 'undefined' ? '' : html.toString();
    $(element).innerHTML = html.stripScripts();
    setTimeout(function() {html.evalScripts()}, 10);
    return element;
  },

  replace: function(element, html) {
    element = $(element);
    html = typeof html == 'undefined' ? '' : html.toString();
    if (element.outerHTML) {
      element.outerHTML = html.stripScripts();
    } else {
      var range = element.ownerDocument.createRange();
      range.selectNodeContents(element);
      element.parentNode.replaceChild(
        range.createContextualFragment(html.stripScripts()), element);
    }
    setTimeout(function() {html.evalScripts()}, 10);
    return element;
  },

  inspect: function(element) {
    element = $(element);
    var result = '<' + element.tagName.toLowerCase();
    $H({'id': 'id', 'className': 'class'}).each(function(pair) {
      var property = pair.first(), attribute = pair.last();
      var value = (element[property] || '').toString();
      if (value) result += ' ' + attribute + '=' + value.inspect(true);
    });
    return result + '>';
  },

  recursivelyCollect: function(element, property) {
    element = $(element);
    var elements = [];
    while (element = element[property])
      if (element.nodeType == 1)
        elements.push(Element.extend(element));
    return elements;
  },

  ancestors: function(element) {
    return $(element).recursivelyCollect('parentNode');
  },

  descendants: function(element) {
    return $A($(element).getElementsByTagName('*'));
  },

  immediateDescendants: function(element) {
    if (!(element = $(element).firstChild)) return [];
    while (element && element.nodeType != 1) element = element.nextSibling;
    if (element) return [element].concat($(element).nextSiblings());
    return [];
  },

  previousSiblings: function(element) {
    return $(element).recursivelyCollect('previousSibling');
  },

  nextSiblings: function(element) {
    return $(element).recursivelyCollect('nextSibling');
  },

  siblings: function(element) {
    element = $(element);
    return element.previousSiblings().reverse().concat(element.nextSiblings());
  },

  match: function(element, selector) {
    if (typeof selector == 'string')
      selector = new Selector(selector);
    return selector.match($(element));
  },

  up: function(element, expression, index) {
    return Selector.findElement($(element).ancestors(), expression, index);
  },

  down: function(element, expression, index) {
    return Selector.findElement($(element).descendants(), expression, index);
  },

  previous: function(element, expression, index) {
    return Selector.findElement($(element).previousSiblings(), expression, index);
  },

  next: function(element, expression, index) {
    return Selector.findElement($(element).nextSiblings(), expression, index);
  },

  getElementsBySelector: function() {
    var args = $A(arguments), element = $(args.shift());
    return Selector.findChildElements(element, args);
  },

  getElementsByClassName: function(element, className) {
    return document.getElementsByClassName(className, element);
  },

  readAttribute: function(element, name) {
    element = $(element);
    if (document.all && !window.opera) {
      var t = Element._attributeTranslations;
      if (t.values[name]) return t.values[name](element, name);
      if (t.names[name])  name = t.names[name];
      var attribute = element.attributes[name];
      if(attribute) return attribute.nodeValue;
    }
    return element.getAttribute(name);
  },

  getHeight: function(element) {
    return $(element).getDimensions().height;
  },

  getWidth: function(element) {
    return $(element).getDimensions().width;
  },

  classNames: function(element) {
    return new Element.ClassNames(element);
  },

  hasClassName: function(element, className) {
    if (!(element = $(element))) return;
    var elementClassName = element.className;
    if (elementClassName.length == 0) return false;
    if (elementClassName == className ||
        elementClassName.match(new RegExp("(^|\\s)" + className + "(\\s|$)")))
      return true;
    return false;
  },

  addClassName: function(element, className) {
    if (!(element = $(element))) return;
    Element.classNames(element).add(className);
    return element;
  },

  removeClassName: function(element, className) {
    if (!(element = $(element))) return;
    Element.classNames(element).remove(className);
    return element;
  },

  toggleClassName: function(element, className) {
    if (!(element = $(element))) return;
    Element.classNames(element)[element.hasClassName(className) ? 'remove' : 'add'](className);
    return element;
  },

  observe: function() {
    Event.observe.apply(Event, arguments);
    return $A(arguments).first();
  },

  stopObserving: function() {
    Event.stopObserving.apply(Event, arguments);
    return $A(arguments).first();
  },

  // removes whitespace-only text node children
  cleanWhitespace: function(element) {
    element = $(element);
    var node = element.firstChild;
    while (node) {
      var nextNode = node.nextSibling;
      if (node.nodeType == 3 && !/\S/.test(node.nodeValue))
        element.removeChild(node);
      node = nextNode;
    }
    return element;
  },

  empty: function(element) {
    return $(element).innerHTML.match(/^\s*$/);
  },

  descendantOf: function(element, ancestor) {
    element = $(element), ancestor = $(ancestor);
    while (element = element.parentNode)
      if (element == ancestor) return true;
    return false;
  },

  scrollTo: function(element) {
    element = $(element);
    var pos = Position.cumulativeOffset(element);
    window.scrollTo(pos[0], pos[1]);
    return element;
  },

  getStyle: function(element, style) {
    element = $(element);
    if (['float','cssFloat'].include(style))
      style = (typeof element.style.styleFloat != 'undefined' ? 'styleFloat' : 'cssFloat');
    style = style.camelize();
    var value = element.style[style];
    if (!value) {
      if (document.defaultView && document.defaultView.getComputedStyle) {
        var css = document.defaultView.getComputedStyle(element, null);
        value = css ? css[style] : null;
      } else if (element.currentStyle) {
        value = element.currentStyle[style];
      }
    }

    if((value == 'auto') && ['width','height'].include(style) && (element.getStyle('display') != 'none'))
      value = element['offset'+style.capitalize()] + 'px';

    if (window.opera && ['left', 'top', 'right', 'bottom'].include(style))
      if (Element.getStyle(element, 'position') == 'static') value = 'auto';
    if(style == 'opacity') {
      if(value) return parseFloat(value);
      if(value = (element.getStyle('filter') || '').match(/alpha\(opacity=(.*)\)/))
        if(value[1]) return parseFloat(value[1]) / 100;
      return 1.0;
    }
    return value == 'auto' ? null : value;
  },

  setStyle: function(element, style) {
    element = $(element);
    for (var name in style) {
      var value = style[name];
      if(name == 'opacity') {
        if (value == 1) {
          value = (/Gecko/.test(navigator.userAgent) &&
            !/Konqueror|Safari|KHTML/.test(navigator.userAgent)) ? 0.999999 : 1.0;
          if(/MSIE/.test(navigator.userAgent) && !window.opera)
            element.style.filter = element.getStyle('filter').replace(/alpha\([^\)]*\)/gi,'');
        } else if(value == '') {
          if(/MSIE/.test(navigator.userAgent) && !window.opera)
            element.style.filter = element.getStyle('filter').replace(/alpha\([^\)]*\)/gi,'');
        } else {
          if(value < 0.00001) value = 0;
          if(/MSIE/.test(navigator.userAgent) && !window.opera)
            element.style.filter = element.getStyle('filter').replace(/alpha\([^\)]*\)/gi,'') +
              'alpha(opacity='+value*100+')';
        }
      } else if(['float','cssFloat'].include(name)) name = (typeof element.style.styleFloat != 'undefined') ? 'styleFloat' : 'cssFloat';
      element.style[name.camelize()] = value;
    }
    return element;
  },

  getDimensions: function(element) {
    element = $(element);
    var display = $(element).getStyle('display');
    if (display != 'none' && display != null) // Safari bug
      return {width: element.offsetWidth, height: element.offsetHeight};

    // All *Width and *Height properties give 0 on elements with display none,
    // so enable the element temporarily
    var els = element.style;
    var originalVisibility = els.visibility;
    var originalPosition = els.position;
    var originalDisplay = els.display;
    els.visibility = 'hidden';
    els.position = 'absolute';
    els.display = 'block';
    var originalWidth = element.clientWidth;
    var originalHeight = element.clientHeight;
    els.display = originalDisplay;
    els.position = originalPosition;
    els.visibility = originalVisibility;
    return {width: originalWidth, height: originalHeight};
  },

  makePositioned: function(element) {
    element = $(element);
    var pos = Element.getStyle(element, 'position');
    if (pos == 'static' || !pos) {
      element._madePositioned = true;
      element.style.position = 'relative';
      // Opera returns the offset relative to the positioning context, when an
      // element is position relative but top and left have not been defined
      if (window.opera) {
        element.style.top = 0;
        element.style.left = 0;
      }
    }
    return element;
  },

  undoPositioned: function(element) {
    element = $(element);
    if (element._madePositioned) {
      element._madePositioned = undefined;
      element.style.position =
        element.style.top =
        element.style.left =
        element.style.bottom =
        element.style.right = '';
    }
    return element;
  },

  makeClipping: function(element) {
    element = $(element);
    if (element._overflow) return element;
    element._overflow = element.style.overflow || 'auto';
    if ((Element.getStyle(element, 'overflow') || 'visible') != 'hidden')
      element.style.overflow = 'hidden';
    return element;
  },

  undoClipping: function(element) {
    element = $(element);
    if (!element._overflow) return element;
    element.style.overflow = element._overflow == 'auto' ? '' : element._overflow;
    element._overflow = null;
    return element;
  }
};

Object.extend(Element.Methods, {childOf: Element.Methods.descendantOf});

Element._attributeTranslations = {};

Element._attributeTranslations.names = {
  colspan:   "colSpan",
  rowspan:   "rowSpan",
  valign:    "vAlign",
  datetime:  "dateTime",
  accesskey: "accessKey",
  tabindex:  "tabIndex",
  enctype:   "encType",
  maxlength: "maxLength",
  readonly:  "readOnly",
  longdesc:  "longDesc"
};

Element._attributeTranslations.values = {
  _getAttr: function(element, attribute) {
    return element.getAttribute(attribute, 2);
  },

  _flag: function(element, attribute) {
    return $(element).hasAttribute(attribute) ? attribute : null;
  },

  style: function(element) {
    return element.style.cssText.toLowerCase();
  },

  title: function(element) {
    var node = element.getAttributeNode('title');
    return node.specified ? node.nodeValue : null;
  }
};

Object.extend(Element._attributeTranslations.values, {
  href: Element._attributeTranslations.values._getAttr,
  src:  Element._attributeTranslations.values._getAttr,
  disabled: Element._attributeTranslations.values._flag,
  checked:  Element._attributeTranslations.values._flag,
  readonly: Element._attributeTranslations.values._flag,
  multiple: Element._attributeTranslations.values._flag
});

Element.Methods.Simulated = {
  hasAttribute: function(element, attribute) {
    var t = Element._attributeTranslations;
    attribute = t.names[attribute] || attribute;
    return $(element).getAttributeNode(attribute).specified;
  }
};

// IE is missing .innerHTML support for TABLE-related elements
if (document.all && !window.opera){
  Element.Methods.update = function(element, html) {
    element = $(element);
    html = typeof html == 'undefined' ? '' : html.toString();
    var tagName = element.tagName.toUpperCase();
    if (['THEAD','TBODY','TR','TD'].include(tagName)) {
      var div = document.createElement('div');
      switch (tagName) {
        case 'THEAD':
        case 'TBODY':
          div.innerHTML = '<table><tbody>' +  html.stripScripts() + '</tbody></table>';
          depth = 2;
          break;
        case 'TR':
          div.innerHTML = '<table><tbody><tr>' +  html.stripScripts() + '</tr></tbody></table>';
          depth = 3;
          break;
        case 'TD':
          div.innerHTML = '<table><tbody><tr><td>' +  html.stripScripts() + '</td></tr></tbody></table>';
          depth = 4;
      }
      $A(element.childNodes).each(function(node){
        element.removeChild(node)
      });
      depth.times(function(){ div = div.firstChild });

      $A(div.childNodes).each(
        function(node){ element.appendChild(node) });
    } else {
      element.innerHTML = html.stripScripts();
    }
    setTimeout(function() {html.evalScripts()}, 10);
    return element;
  }
};

Object.extend(Element, Element.Methods);

var _nativeExtensions = false;

if(/Konqueror|Safari|KHTML/.test(navigator.userAgent))
  ['', 'Form', 'Input', 'TextArea', 'Select'].each(function(tag) {
    var className = 'HTML' + tag + 'Element';
    if(window[className]) return;
    var klass = window[className] = {};
    klass.prototype = document.createElement(tag ? tag.toLowerCase() : 'div').__proto__;
  });

Element.addMethods = function(methods) {
  Object.extend(Element.Methods, methods || {});

  function copy(methods, destination, onlyIfAbsent) {
    onlyIfAbsent = onlyIfAbsent || false;
    var cache = Element.extend.cache;
    for (var property in methods) {
      var value = methods[property];
      if (!onlyIfAbsent || !(property in destination))
        destination[property] = cache.findOrStore(value);
    }
  }

  if (typeof HTMLElement != 'undefined') {
    copy(Element.Methods, HTMLElement.prototype);
    copy(Element.Methods.Simulated, HTMLElement.prototype, true);
    copy(Form.Methods, HTMLFormElement.prototype);
    [HTMLInputElement, HTMLTextAreaElement, HTMLSelectElement].each(function(klass) {
      copy(Form.Element.Methods, klass.prototype);
    });
    _nativeExtensions = true;
  }
}

var Toggle = new Object();
Toggle.display = Element.toggle;

/*--------------------------------------------------------------------------*/

Abstract.Insertion = function(adjacency) {
  this.adjacency = adjacency;
}

Abstract.Insertion.prototype = {
  initialize: function(element, content) {
    this.element = $(element);
    this.content = content.stripScripts();

    if (this.adjacency && this.element.insertAdjacentHTML) {
      try {
        this.element.insertAdjacentHTML(this.adjacency, this.content);
      } catch (e) {
        var tagName = this.element.tagName.toUpperCase();
        if (['TBODY', 'TR'].include(tagName)) {
          this.insertContent(this.contentFromAnonymousTable());
        } else {
          throw e;
        }
      }
    } else {
      this.range = this.element.ownerDocument.createRange();
      if (this.initializeRange) this.initializeRange();
      this.insertContent([this.range.createContextualFragment(this.content)]);
    }

    setTimeout(function() {content.evalScripts()}, 10);
  },

  contentFromAnonymousTable: function() {
    var div = document.createElement('div');
    div.innerHTML = '<table><tbody>' + this.content + '</tbody></table>';
    return $A(div.childNodes[0].childNodes[0].childNodes);
  }
}

var Insertion = new Object();

Insertion.Before = Class.create();
Insertion.Before.prototype = Object.extend(new Abstract.Insertion('beforeBegin'), {
  initializeRange: function() {
    this.range.setStartBefore(this.element);
  },

  insertContent: function(fragments) {
    fragments.each((function(fragment) {
      this.element.parentNode.insertBefore(fragment, this.element);
    }).bind(this));
  }
});

Insertion.Top = Class.create();
Insertion.Top.prototype = Object.extend(new Abstract.Insertion('afterBegin'), {
  initializeRange: function() {
    this.range.selectNodeContents(this.element);
    this.range.collapse(true);
  },

  insertContent: function(fragments) {
    fragments.reverse(false).each((function(fragment) {
      this.element.insertBefore(fragment, this.element.firstChild);
    }).bind(this));
  }
});

Insertion.Bottom = Class.create();
Insertion.Bottom.prototype = Object.extend(new Abstract.Insertion('beforeEnd'), {
  initializeRange: function() {
    this.range.selectNodeContents(this.element);
    this.range.collapse(this.element);
  },

  insertContent: function(fragments) {
    fragments.each((function(fragment) {
      this.element.appendChild(fragment);
    }).bind(this));
  }
});

Insertion.After = Class.create();
Insertion.After.prototype = Object.extend(new Abstract.Insertion('afterEnd'), {
  initializeRange: function() {
    this.range.setStartAfter(this.element);
  },

  insertContent: function(fragments) {
    fragments.each((function(fragment) {
      this.element.parentNode.insertBefore(fragment,
        this.element.nextSibling);
    }).bind(this));
  }
});

/*--------------------------------------------------------------------------*/

Element.ClassNames = Class.create();
Element.ClassNames.prototype = {
  initialize: function(element) {
    this.element = $(element);
  },

  _each: function(iterator) {
    this.element.className.split(/\s+/).select(function(name) {
      return name.length > 0;
    })._each(iterator);
  },

  set: function(className) {
    this.element.className = className;
  },

  add: function(classNameToAdd) {
    if (this.include(classNameToAdd)) return;
    this.set($A(this).concat(classNameToAdd).join(' '));
  },

  remove: function(classNameToRemove) {
    if (!this.include(classNameToRemove)) return;
    this.set($A(this).without(classNameToRemove).join(' '));
  },

  toString: function() {
    return $A(this).join(' ');
  }
};

Object.extend(Element.ClassNames.prototype, Enumerable);
var Selector = Class.create();
Selector.prototype = {
  initialize: function(expression) {
    this.params = {classNames: []};
    this.expression = expression.toString().strip();
    this.parseExpression();
    this.compileMatcher();
  },

  parseExpression: function() {
    function abort(message) { throw 'Parse error in selector: ' + message; }

    if (this.expression == '')  abort('empty expression');

    var params = this.params, expr = this.expression, match, modifier, clause, rest;
    while (match = expr.match(/^(.*)\[([a-z0-9_:-]+?)(?:([~\|!]?=)(?:"([^"]*)"|([^\]\s]*)))?\]$/i)) {
      params.attributes = params.attributes || [];
      params.attributes.push({name: match[2], operator: match[3], value: match[4] || match[5] || ''});
      expr = match[1];
    }

    if (expr == '*') return this.params.wildcard = true;

    while (match = expr.match(/^([^a-z0-9_-])?([a-z0-9_-]+)(.*)/i)) {
      modifier = match[1], clause = match[2], rest = match[3];
      switch (modifier) {
        case '#':       params.id = clause; break;
        case '.':       params.classNames.push(clause); break;
        case '':
        case undefined: params.tagName = clause.toUpperCase(); break;
        default:        abort(expr.inspect());
      }
      expr = rest;
    }

    if (expr.length > 0) abort(expr.inspect());
  },

  buildMatchExpression: function() {
    var params = this.params, conditions = [], clause;

    if (params.wildcard)
      conditions.push('true');
    if (clause = params.id)
      conditions.push('element.readAttribute("id") == ' + clause.inspect());
    if (clause = params.tagName)
      conditions.push('element.tagName.toUpperCase() == ' + clause.inspect());
    if ((clause = params.classNames).length > 0)
      for (var i = 0, length = clause.length; i < length; i++)
        conditions.push('element.hasClassName(' + clause[i].inspect() + ')');
    if (clause = params.attributes) {
      clause.each(function(attribute) {
        var value = 'element.readAttribute(' + attribute.name.inspect() + ')';
        var splitValueBy = function(delimiter) {
          return value + ' && ' + value + '.split(' + delimiter.inspect() + ')';
        }

        switch (attribute.operator) {
          case '=':       conditions.push(value + ' == ' + attribute.value.inspect()); break;
          case '~=':      conditions.push(splitValueBy(' ') + '.include(' + attribute.value.inspect() + ')'); break;
          case '|=':      conditions.push(
                            splitValueBy('-') + '.first().toUpperCase() == ' + attribute.value.toUpperCase().inspect()
                          ); break;
          case '!=':      conditions.push(value + ' != ' + attribute.value.inspect()); break;
          case '':
          case undefined: conditions.push('element.hasAttribute(' + attribute.name.inspect() + ')'); break;
          default:        throw 'Unknown operator ' + attribute.operator + ' in selector';
        }
      });
    }

    return conditions.join(' && ');
  },

  compileMatcher: function() {
    this.match = new Function('element', 'if (!element.tagName) return false; \
      element = $(element); \
      return ' + this.buildMatchExpression());
  },

  findElements: function(scope) {
    var element;

    if (element = $(this.params.id))
      if (this.match(element))
        if (!scope || Element.childOf(element, scope))
          return [element];

    scope = (scope || document).getElementsByTagName(this.params.tagName || '*');

    var results = [];
    for (var i = 0, length = scope.length; i < length; i++)
      if (this.match(element = scope[i]))
        results.push(Element.extend(element));

    return results;
  },

  toString: function() {
    return this.expression;
  }
}

Object.extend(Selector, {
  matchElements: function(elements, expression) {
    var selector = new Selector(expression);
    return elements.select(selector.match.bind(selector)).map(Element.extend);
  },

  findElement: function(elements, expression, index) {
    if (typeof expression == 'number') index = expression, expression = false;
    return Selector.matchElements(elements, expression || '*')[index || 0];
  },

  findChildElements: function(element, expressions) {
    return expressions.map(function(expression) {
      return expression.match(/[^\s"]+(?:"[^"]*"[^\s"]+)*/g).inject([null], function(results, expr) {
        var selector = new Selector(expr);
        return results.inject([], function(elements, result) {
          return elements.concat(selector.findElements(result || element));
        });
      });
    }).flatten();
  }
});

function $$() {
  return Selector.findChildElements(document, $A(arguments));
}
var Form = {
  reset: function(form) {
    $(form).reset();
    return form;
  },

  serializeElements: function(elements, getHash) {
    var data = elements.inject({}, function(result, element) {
      if (!element.disabled && element.name) {
        var key = element.name, value = $(element).getValue();
        if (value != undefined) {
          if (result[key]) {
            if (result[key].constructor != Array) result[key] = [result[key]];
            result[key].push(value);
          }
          else result[key] = value;
        }
      }
      return result;
    });

    return getHash ? data : Hash.toQueryString(data);
  }
};

Form.Methods = {
  serialize: function(form, getHash) {
    return Form.serializeElements(Form.getElements(form), getHash);
  },

  getElements: function(form) {
    return $A($(form).getElementsByTagName('*')).inject([],
      function(elements, child) {
        if (Form.Element.Serializers[child.tagName.toLowerCase()])
          elements.push(Element.extend(child));
        return elements;
      }
    );
  },

  getInputs: function(form, typeName, name) {
    form = $(form);
    var inputs = form.getElementsByTagName('input');

    if (!typeName && !name) return $A(inputs).map(Element.extend);

    for (var i = 0, matchingInputs = [], length = inputs.length; i < length; i++) {
      var input = inputs[i];
      if ((typeName && input.type != typeName) || (name && input.name != name))
        continue;
      matchingInputs.push(Element.extend(input));
    }

    return matchingInputs;
  },

  disable: function(form) {
    form = $(form);
    form.getElements().each(function(element) {
      element.blur();
      element.disabled = 'true';
    });
    return form;
  },

  enable: function(form) {
    form = $(form);
    form.getElements().each(function(element) {
      element.disabled = '';
    });
    return form;
  },

  findFirstElement: function(form) {
    return $(form).getElements().find(function(element) {
      return element.type != 'hidden' && !element.disabled &&
        ['input', 'select', 'textarea'].include(element.tagName.toLowerCase());
    });
  },

  focusFirstElement: function(form) {
    form = $(form);
    form.findFirstElement().activate();
    return form;
  }
}

Object.extend(Form, Form.Methods);

/*--------------------------------------------------------------------------*/

Form.Element = {
  focus: function(element) {
    $(element).focus();
    return element;
  },

  select: function(element) {
    $(element).select();
    return element;
  }
}

Form.Element.Methods = {
  serialize: function(element) {
    element = $(element);
    if (!element.disabled && element.name) {
      var value = element.getValue();
      if (value != undefined) {
        var pair = {};
        pair[element.name] = value;
        return Hash.toQueryString(pair);
      }
    }
    return '';
  },

  getValue: function(element) {
    element = $(element);
    var method = element.tagName.toLowerCase();
    return Form.Element.Serializers[method](element);
  },

  clear: function(element) {
    $(element).value = '';
    return element;
  },

  present: function(element) {
    return $(element).value != '';
  },

  activate: function(element) {
    element = $(element);
    element.focus();
    if (element.select && ( element.tagName.toLowerCase() != 'input' ||
      !['button', 'reset', 'submit'].include(element.type) ) )
      element.select();
    return element;
  },

  disable: function(element) {
    element = $(element);
    element.disabled = true;
    return element;
  },

  enable: function(element) {
    element = $(element);
    element.blur();
    element.disabled = false;
    return element;
  }
}

Object.extend(Form.Element, Form.Element.Methods);
var Field = Form.Element;
var $F = Form.Element.getValue;

/*--------------------------------------------------------------------------*/

Form.Element.Serializers = {
  input: function(element) {
    switch (element.type.toLowerCase()) {
      case 'checkbox':
      case 'radio':
        return Form.Element.Serializers.inputSelector(element);
      default:
        return Form.Element.Serializers.textarea(element);
    }
  },

  inputSelector: function(element) {
    return element.checked ? element.value : null;
  },

  textarea: function(element) {
    return element.value;
  },

  select: function(element) {
    return this[element.type == 'select-one' ?
      'selectOne' : 'selectMany'](element);
  },

  selectOne: function(element) {
    var index = element.selectedIndex;
    return index >= 0 ? this.optionValue(element.options[index]) : null;
  },

  selectMany: function(element) {
    var values, length = element.length;
    if (!length) return null;

    for (var i = 0, values = []; i < length; i++) {
      var opt = element.options[i];
      if (opt.selected) values.push(this.optionValue(opt));
    }
    return values;
  },

  optionValue: function(opt) {
    // extend element because hasAttribute may not be native
    return Element.extend(opt).hasAttribute('value') ? opt.value : opt.text;
  }
}

/*--------------------------------------------------------------------------*/

Abstract.TimedObserver = function() {}
Abstract.TimedObserver.prototype = {
  initialize: function(element, frequency, callback) {
    this.frequency = frequency;
    this.element   = $(element);
    this.callback  = callback;

    this.lastValue = this.getValue();
    this.registerCallback();
  },

  registerCallback: function() {
    setInterval(this.onTimerEvent.bind(this), this.frequency * 1000);
  },

  onTimerEvent: function() {
    var value = this.getValue();
    var changed = ('string' == typeof this.lastValue && 'string' == typeof value
      ? this.lastValue != value : String(this.lastValue) != String(value));
    if (changed) {
      this.callback(this.element, value);
      this.lastValue = value;
    }
  }
}

Form.Element.Observer = Class.create();
Form.Element.Observer.prototype = Object.extend(new Abstract.TimedObserver(), {
  getValue: function() {
    return Form.Element.getValue(this.element);
  }
});

Form.Observer = Class.create();
Form.Observer.prototype = Object.extend(new Abstract.TimedObserver(), {
  getValue: function() {
    return Form.serialize(this.element);
  }
});

/*--------------------------------------------------------------------------*/

Abstract.EventObserver = function() {}
Abstract.EventObserver.prototype = {
  initialize: function(element, callback) {
    this.element  = $(element);
    this.callback = callback;

    this.lastValue = this.getValue();
    if (this.element.tagName.toLowerCase() == 'form')
      this.registerFormCallbacks();
    else
      this.registerCallback(this.element);
  },

  onElementEvent: function() {
    var value = this.getValue();
    if (this.lastValue != value) {
      this.callback(this.element, value);
      this.lastValue = value;
    }
  },

  registerFormCallbacks: function() {
    Form.getElements(this.element).each(this.registerCallback.bind(this));
  },

  registerCallback: function(element) {
    if (element.type) {
      switch (element.type.toLowerCase()) {
        case 'checkbox':
        case 'radio':
          Event.observe(element, 'click', this.onElementEvent.bind(this));
          break;
        default:
          Event.observe(element, 'change', this.onElementEvent.bind(this));
          break;
      }
    }
  }
}

Form.Element.EventObserver = Class.create();
Form.Element.EventObserver.prototype = Object.extend(new Abstract.EventObserver(), {
  getValue: function() {
    return Form.Element.getValue(this.element);
  }
});

Form.EventObserver = Class.create();
Form.EventObserver.prototype = Object.extend(new Abstract.EventObserver(), {
  getValue: function() {
    return Form.serialize(this.element);
  }
});
if (!window.Event) {
  var Event = new Object();
}

Object.extend(Event, {
  KEY_BACKSPACE: 8,
  KEY_TAB:       9,
  KEY_RETURN:   13,
  KEY_ESC:      27,
  KEY_LEFT:     37,
  KEY_UP:       38,
  KEY_RIGHT:    39,
  KEY_DOWN:     40,
  KEY_DELETE:   46,
  KEY_HOME:     36,
  KEY_END:      35,
  KEY_PAGEUP:   33,
  KEY_PAGEDOWN: 34,

  element: function(event) {
    return event.target || event.srcElement;
  },

  isLeftClick: function(event) {
    return (((event.which) && (event.which == 1)) ||
            ((event.button) && (event.button == 1)));
  },

  pointerX: function(event) {
    return event.pageX || (event.clientX +
      (document.documentElement.scrollLeft || document.body.scrollLeft));
  },

  pointerY: function(event) {
    return event.pageY || (event.clientY +
      (document.documentElement.scrollTop || document.body.scrollTop));
  },

  stop: function(event) {
    if (event.preventDefault) {
      event.preventDefault();
      event.stopPropagation();
    } else {
      event.returnValue = false;
      event.cancelBubble = true;
    }
  },

  // find the first node with the given tagName, starting from the
  // node the event was triggered on; traverses the DOM upwards
  findElement: function(event, tagName) {
    var element = Event.element(event);
    while (element.parentNode && (!element.tagName ||
        (element.tagName.toUpperCase() != tagName.toUpperCase())))
      element = element.parentNode;
    return element;
  },

  observers: false,

  _observeAndCache: function(element, name, observer, useCapture) {
    if (!this.observers) this.observers = [];
    if (element.addEventListener) {
      this.observers.push([element, name, observer, useCapture]);
      element.addEventListener(name, observer, useCapture);
    } else if (element.attachEvent) {
      this.observers.push([element, name, observer, useCapture]);
      element.attachEvent('on' + name, observer);
    }
  },

  unloadCache: function() {
    if (!Event.observers) return;
    for (var i = 0, length = Event.observers.length; i < length; i++) {
      Event.stopObserving.apply(this, Event.observers[i]);
      Event.observers[i][0] = null;
    }
    Event.observers = false;
  },

  observe: function(element, name, observer, useCapture) {
    element = $(element);
    useCapture = useCapture || false;

    if (name == 'keypress' &&
        (navigator.appVersion.match(/Konqueror|Safari|KHTML/)
        || element.attachEvent))
      name = 'keydown';

    Event._observeAndCache(element, name, observer, useCapture);
  },

  stopObserving: function(element, name, observer, useCapture) {
    element = $(element);
    useCapture = useCapture || false;

    if (name == 'keypress' &&
        (navigator.appVersion.match(/Konqueror|Safari|KHTML/)
        || element.detachEvent))
      name = 'keydown';

    if (element.removeEventListener) {
      element.removeEventListener(name, observer, useCapture);
    } else if (element.detachEvent) {
      try {
        element.detachEvent('on' + name, observer);
      } catch (e) {}
    }
  }
});

/* prevent memory leaks in IE */
if (navigator.appVersion.match(/\bMSIE\b/))
  Event.observe(window, 'unload', Event.unloadCache, false);
var Position = {
  // set to true if needed, warning: firefox performance problems
  // NOT neeeded for page scrolling, only if draggable contained in
  // scrollable elements
  includeScrollOffsets: false,

  // must be called before calling withinIncludingScrolloffset, every time the
  // page is scrolled
  prepare: function() {
    this.deltaX =  window.pageXOffset
                || document.documentElement.scrollLeft
                || document.body.scrollLeft
                || 0;
    this.deltaY =  window.pageYOffset
                || document.documentElement.scrollTop
                || document.body.scrollTop
                || 0;
  },

  realOffset: function(element) {
    var valueT = 0, valueL = 0;
    do {
      valueT += element.scrollTop  || 0;
      valueL += element.scrollLeft || 0;
      element = element.parentNode;
    } while (element);
    return [valueL, valueT];
  },

  cumulativeOffset: function(element) {
    var valueT = 0, valueL = 0;
    do {
      valueT += element.offsetTop  || 0;
      valueL += element.offsetLeft || 0;
      element = element.offsetParent;
    } while (element);
    return [valueL, valueT];
  },

  positionedOffset: function(element) {
    var valueT = 0, valueL = 0;
    do {
      valueT += element.offsetTop  || 0;
      valueL += element.offsetLeft || 0;
      element = element.offsetParent;
      if (element) {
        if(element.tagName=='BODY') break;
        var p = Element.getStyle(element, 'position');
        if (p == 'relative' || p == 'absolute') break;
      }
    } while (element);
    return [valueL, valueT];
  },

  offsetParent: function(element) {
    if (element.offsetParent) return element.offsetParent;
    if (element == document.body) return element;

    while ((element = element.parentNode) && element != document.body)
      if (Element.getStyle(element, 'position') != 'static')
        return element;

    return document.body;
  },

  // caches x/y coordinate pair to use with overlap
  within: function(element, x, y) {
    if (this.includeScrollOffsets)
      return this.withinIncludingScrolloffsets(element, x, y);
    this.xcomp = x;
    this.ycomp = y;
    this.offset = this.cumulativeOffset(element);

    return (y >= this.offset[1] &&
            y <  this.offset[1] + element.offsetHeight &&
            x >= this.offset[0] &&
            x <  this.offset[0] + element.offsetWidth);
  },

  withinIncludingScrolloffsets: function(element, x, y) {
    var offsetcache = this.realOffset(element);

    this.xcomp = x + offsetcache[0] - this.deltaX;
    this.ycomp = y + offsetcache[1] - this.deltaY;
    this.offset = this.cumulativeOffset(element);

    return (this.ycomp >= this.offset[1] &&
            this.ycomp <  this.offset[1] + element.offsetHeight &&
            this.xcomp >= this.offset[0] &&
            this.xcomp <  this.offset[0] + element.offsetWidth);
  },

  // within must be called directly before
  overlap: function(mode, element) {
    if (!mode) return 0;
    if (mode == 'vertical')
      return ((this.offset[1] + element.offsetHeight) - this.ycomp) /
        element.offsetHeight;
    if (mode == 'horizontal')
      return ((this.offset[0] + element.offsetWidth) - this.xcomp) /
        element.offsetWidth;
  },

  page: function(forElement) {
    var valueT = 0, valueL = 0;

    var element = forElement;
    do {
      valueT += element.offsetTop  || 0;
      valueL += element.offsetLeft || 0;

      // Safari fix
      if (element.offsetParent==document.body)
        if (Element.getStyle(element,'position')=='absolute') break;

    } while (element = element.offsetParent);

    element = forElement;
    do {
      if (!window.opera || element.tagName=='BODY') {
        valueT -= element.scrollTop  || 0;
        valueL -= element.scrollLeft || 0;
      }
    } while (element = element.parentNode);

    return [valueL, valueT];
  },

  clone: function(source, target) {
    var options = Object.extend({
      setLeft:    true,
      setTop:     true,
      setWidth:   true,
      setHeight:  true,
      offsetTop:  0,
      offsetLeft: 0
    }, arguments[2] || {})

    // find page position of source
    source = $(source);
    var p = Position.page(source);

    // find coordinate system to use
    target = $(target);
    var delta = [0, 0];
    var parent = null;
    // delta [0,0] will do fine with position: fixed elements,
    // position:absolute needs offsetParent deltas
    if (Element.getStyle(target,'position') == 'absolute') {
      parent = Position.offsetParent(target);
      delta = Position.page(parent);
    }

    // correct by body offsets (fixes Safari)
    if (parent == document.body) {
      delta[0] -= document.body.offsetLeft;
      delta[1] -= document.body.offsetTop;
    }

    // set position
    if(options.setLeft)   target.style.left  = (p[0] - delta[0] + options.offsetLeft) + 'px';
    if(options.setTop)    target.style.top   = (p[1] - delta[1] + options.offsetTop) + 'px';
    if(options.setWidth)  target.style.width = source.offsetWidth + 'px';
    if(options.setHeight) target.style.height = source.offsetHeight + 'px';
  },

  absolutize: function(element) {
    element = $(element);
    if (element.style.position == 'absolute') return;
    Position.prepare();

    var offsets = Position.positionedOffset(element);
    var top     = offsets[1];
    var left    = offsets[0];
    var width   = element.clientWidth;
    var height  = element.clientHeight;

    element._originalLeft   = left - parseFloat(element.style.left  || 0);
    element._originalTop    = top  - parseFloat(element.style.top || 0);
    element._originalWidth  = element.style.width;
    element._originalHeight = element.style.height;

    element.style.position = 'absolute';
    element.style.top    = top + 'px';
    element.style.left   = left + 'px';
    element.style.width  = width + 'px';
    element.style.height = height + 'px';
  },

  relativize: function(element) {
    element = $(element);
    if (element.style.position == 'relative') return;
    Position.prepare();

    element.style.position = 'relative';
    var top  = parseFloat(element.style.top  || 0) - (element._originalTop || 0);
    var left = parseFloat(element.style.left || 0) - (element._originalLeft || 0);

    element.style.top    = top + 'px';
    element.style.left   = left + 'px';
    element.style.height = element._originalHeight;
    element.style.width  = element._originalWidth;
  }
}

// Safari returns margins on body which is incorrect if the child is absolutely
// positioned.  For performance reasons, redefine Position.cumulativeOffset for
// KHTML/WebKit only.
if (/Konqueror|Safari|KHTML/.test(navigator.userAgent)) {
  Position.cumulativeOffset = function(element) {
    var valueT = 0, valueL = 0;
    do {
      valueT += element.offsetTop  || 0;
      valueL += element.offsetLeft || 0;
      if (element.offsetParent == document.body)
        if (Element.getStyle(element, 'position') == 'absolute') break;

      element = element.offsetParent;
    } while (element);

    return [valueL, valueT];
  }
}

Element.addMethods();


// ------------------------------------------------------------------------
// ------------------------------------------------------------------------

// The rest of this file is the actual ray tracer written by Adam
// Burmister. It's a concatenation of the following files:
//
//   flog/color.js
//   flog/light.js
//   flog/vector.js
//   flog/ray.js
//   flog/scene.js
//   flog/material/basematerial.js
//   flog/material/solid.js
//   flog/material/chessboard.js
//   flog/shape/baseshape.js
//   flog/shape/sphere.js
//   flog/shape/plane.js
//   flog/intersectioninfo.js
//   flog/camera.js
//   flog/background.js
//   flog/engine.js


/* Fake a Flog.* namespace */
if(typeof(Flog) == 'undefined') var Flog = {};
if(typeof(Flog.RayTracer) == 'undefined') Flog.RayTracer = {};

Flog.RayTracer.Color = Class.create();

Flog.RayTracer.Color.prototype = {
    red : 0.0,
    green : 0.0,
    blue : 0.0,

    initialize : function(r, g, b) {
        if(!r) r = 0.0;
        if(!g) g = 0.0;
        if(!b) b = 0.0;

        this.red = r;
        this.green = g;
        this.blue = b;
    },

    add : function(c1, c2){
        var result = new Flog.RayTracer.Color(0,0,0);

        result.red = c1.red + c2.red;
        result.green = c1.green + c2.green;
        result.blue = c1.blue + c2.blue;

        return result;
    },

    addScalar: function(c1, s){
        var result = new Flog.RayTracer.Color(0,0,0);

        result.red = c1.red + s;
        result.green = c1.green + s;
        result.blue = c1.blue + s;

        result.limit();

        return result;
    },

    subtract: function(c1, c2){
        var result = new Flog.RayTracer.Color(0,0,0);

        result.red = c1.red - c2.red;
        result.green = c1.green - c2.green;
        result.blue = c1.blue - c2.blue;

        return result;
    },

    multiply : function(c1, c2) {
        var result = new Flog.RayTracer.Color(0,0,0);

        result.red = c1.red * c2.red;
        result.green = c1.green * c2.green;
        result.blue = c1.blue * c2.blue;

        return result;
    },

    multiplyScalar : function(c1, f) {
        var result = new Flog.RayTracer.Color(0,0,0);

        result.red = c1.red * f;
        result.green = c1.green * f;
        result.blue = c1.blue * f;

        return result;
    },

    divideFactor : function(c1, f) {
        var result = new Flog.RayTracer.Color(0,0,0);

        result.red = c1.red / f;
        result.green = c1.green / f;
        result.blue = c1.blue / f;

        return result;
    },

    limit: function(){
        this.red = (this.red > 0.0) ? ( (this.red > 1.0) ? 1.0 : this.red ) : 0.0;
        this.green = (this.green > 0.0) ? ( (this.green > 1.0) ? 1.0 : this.green ) : 0.0;
        this.blue = (this.blue > 0.0) ? ( (this.blue > 1.0) ? 1.0 : this.blue ) : 0.0;
    },

    distance : function(color) {
        var d = Math.abs(this.red - color.red) + Math.abs(this.green - color.green) + Math.abs(this.blue - color.blue);
        return d;
    },

    blend: function(c1, c2, w){
        var result = new Flog.RayTracer.Color(0,0,0);
        result = Flog.RayTracer.Color.prototype.add(
                    Flog.RayTracer.Color.prototype.multiplyScalar(c1, 1 - w),
                    Flog.RayTracer.Color.prototype.multiplyScalar(c2, w)
                  );
        return result;
    },

    toString : function () {
        var r = Math.floor(this.red*255);
        var g = Math.floor(this.green*255);
        var b = Math.floor(this.blue*255);

        return "rgb("+ r +","+ g +","+ b +")";
    }
}
/* Fake a Flog.* namespace */
if(typeof(Flog) == 'undefined') var Flog = {};
if(typeof(Flog.RayTracer) == 'undefined') Flog.RayTracer = {};

Flog.RayTracer.Light = Class.create();

Flog.RayTracer.Light.prototype = {
    position: null,
    color: null,
    intensity: 10.0,

    initialize : function(pos, color, intensity) {
        this.position = pos;
        this.color = color;
        this.intensity = (intensity ? intensity : 10.0);
    },

    getIntensity: function(distance){
        if(distance >= intensity) return 0;

        return Math.pow((intensity - distance) / strength, 0.2);
    },

    toString : function () {
        return 'Light [' + this.position.x + ',' + this.position.y + ',' + this.position.z + ']';
    }
}
/* Fake a Flog.* namespace */
if(typeof(Flog) == 'undefined') var Flog = {};
if(typeof(Flog.RayTracer) == 'undefined') Flog.RayTracer = {};

Flog.RayTracer.Vector = Class.create();

Flog.RayTracer.Vector.prototype = {
    x : 0.0,
    y : 0.0,
    z : 0.0,

    initialize : function(x, y, z) {
        this.x = (x ? x : 0);
        this.y = (y ? y : 0);
        this.z = (z ? z : 0);
    },

    copy: function(vector){
        this.x = vector.x;
        this.y = vector.y;
        this.z = vector.z;
    },

    normalize : function() {
        var m = this.magnitude();
        return new Flog.RayTracer.Vector(this.x / m, this.y / m, this.z / m);
    },

    magnitude : function() {
        return Math.sqrt((this.x * this.x) + (this.y * this.y) + (this.z * this.z));
    },

    cross : function(w) {
        return new Flog.RayTracer.Vector(
                                            -this.z * w.y + this.y * w.z,
                                           this.z * w.x - this.x * w.z,
                                          -this.y * w.x + this.x * w.y);
    },

    dot : function(w) {
        return this.x * w.x + this.y * w.y + this.z * w.z;
    },

    add : function(v, w) {
        return new Flog.RayTracer.Vector(w.x + v.x, w.y + v.y, w.z + v.z);
    },

    subtract : function(v, w) {
        if(!w || !v) throw 'Vectors must be defined [' + v + ',' + w + ']';
        return new Flog.RayTracer.Vector(v.x - w.x, v.y - w.y, v.z - w.z);
    },

    multiplyVector : function(v, w) {
        return new Flog.RayTracer.Vector(v.x * w.x, v.y * w.y, v.z * w.z);
    },

    multiplyScalar : function(v, w) {
        return new Flog.RayTracer.Vector(v.x * w, v.y * w, v.z * w);
    },

    toString : function () {
        return 'Vector [' + this.x + ',' + this.y + ',' + this.z + ']';
    }
}
/* Fake a Flog.* namespace */
if(typeof(Flog) == 'undefined') var Flog = {};
if(typeof(Flog.RayTracer) == 'undefined') Flog.RayTracer = {};

Flog.RayTracer.Ray = Class.create();

Flog.RayTracer.Ray.prototype = {
    position : null,
    direction : null,
    initialize : function(pos, dir) {
        this.position = pos;
        this.direction = dir;
    },

    toString : function () {
        return 'Ray [' + this.position + ',' + this.direction + ']';
    }
}
/* Fake a Flog.* namespace */
if(typeof(Flog) == 'undefined') var Flog = {};
if(typeof(Flog.RayTracer) == 'undefined') Flog.RayTracer = {};

Flog.RayTracer.Scene = Class.create();

Flog.RayTracer.Scene.prototype = {
    camera : null,
    shapes : [],
    lights : [],
    background : null,

    initialize : function() {
        this.camera = new Flog.RayTracer.Camera(
            new Flog.RayTracer.Vector(0,0,-5),
            new Flog.RayTracer.Vector(0,0,1),
            new Flog.RayTracer.Vector(0,1,0)
        );
        this.shapes = new Array();
        this.lights = new Array();
        this.background = new Flog.RayTracer.Background(new Flog.RayTracer.Color(0,0,0.5), 0.2);
    }
}
/* Fake a Flog.* namespace */
if(typeof(Flog) == 'undefined') var Flog = {};
if(typeof(Flog.RayTracer) == 'undefined') Flog.RayTracer = {};
if(typeof(Flog.RayTracer.Material) == 'undefined') Flog.RayTracer.Material = {};

Flog.RayTracer.Material.BaseMaterial = Class.create();

Flog.RayTracer.Material.BaseMaterial.prototype = {

    gloss: 2.0,             // [0...infinity] 0 = matt
    transparency: 0.0,      // 0=opaque
    reflection: 0.0,        // [0...infinity] 0 = no reflection
    refraction: 0.50,
    hasTexture: false,

    initialize : function() {

    },

    getColor: function(u, v){

    },

    wrapUp: function(t){
        t = t % 2.0;
        if(t < -1) t += 2.0;
        if(t >= 1) t -= 2.0;
        return t;
    },

    toString : function () {
        return 'Material [gloss=' + this.gloss + ', transparency=' + this.transparency + ', hasTexture=' + this.hasTexture +']';
    }
}
/* Fake a Flog.* namespace */
if(typeof(Flog) == 'undefined') var Flog = {};
if(typeof(Flog.RayTracer) == 'undefined') Flog.RayTracer = {};

Flog.RayTracer.Material.Solid = Class.create();

Flog.RayTracer.Material.Solid.prototype = Object.extend(
    new Flog.RayTracer.Material.BaseMaterial(), {
        initialize : function(color, reflection, refraction, transparency, gloss) {
            this.color = color;
            this.reflection = reflection;
            this.transparency = transparency;
            this.gloss = gloss;
            this.hasTexture = false;
        },

        getColor: function(u, v){
            return this.color;
        },

        toString : function () {
            return 'SolidMaterial [gloss=' + this.gloss + ', transparency=' + this.transparency + ', hasTexture=' + this.hasTexture +']';
        }
    }
);
/* Fake a Flog.* namespace */
if(typeof(Flog) == 'undefined') var Flog = {};
if(typeof(Flog.RayTracer) == 'undefined') Flog.RayTracer = {};

Flog.RayTracer.Material.Chessboard = Class.create();

Flog.RayTracer.Material.Chessboard.prototype = Object.extend(
    new Flog.RayTracer.Material.BaseMaterial(), {
        colorEven: null,
        colorOdd: null,
        density: 0.5,

        initialize : function(colorEven, colorOdd, reflection, transparency, gloss, density) {
            this.colorEven = colorEven;
            this.colorOdd = colorOdd;
            this.reflection = reflection;
            this.transparency = transparency;
            this.gloss = gloss;
            this.density = density;
            this.hasTexture = true;
        },

        getColor: function(u, v){
            var t = this.wrapUp(u * this.density) * this.wrapUp(v * this.density);

            if(t < 0.0)
                return this.colorEven;
            else
                return this.colorOdd;
        },

        toString : function () {
            return 'ChessMaterial [gloss=' + this.gloss + ', transparency=' + this.transparency + ', hasTexture=' + this.hasTexture +']';
        }
    }
);
/* Fake a Flog.* namespace */
if(typeof(Flog) == 'undefined') var Flog = {};
if(typeof(Flog.RayTracer) == 'undefined') Flog.RayTracer = {};
if(typeof(Flog.RayTracer.Shape) == 'undefined') Flog.RayTracer.Shape = {};

Flog.RayTracer.Shape.BaseShape = Class.create();

Flog.RayTracer.Shape.BaseShape.prototype = {
    position: null,
    material: null,

    initialize : function() {
        this.position = new Vector(0,0,0);
        this.material = new Flog.RayTracer.Material.SolidMaterial(
            new Flog.RayTracer.Color(1,0,1),
            0,
            0,
            0
        );
    },

    toString : function () {
        return 'Material [gloss=' + this.gloss + ', transparency=' + this.transparency + ', hasTexture=' + this.hasTexture +']';
    }
}
/* Fake a Flog.* namespace */
if(typeof(Flog) == 'undefined') var Flog = {};
if(typeof(Flog.RayTracer) == 'undefined') Flog.RayTracer = {};
if(typeof(Flog.RayTracer.Shape) == 'undefined') Flog.RayTracer.Shape = {};

Flog.RayTracer.Shape.Sphere = Class.create();

Flog.RayTracer.Shape.Sphere.prototype = {
    initialize : function(pos, radius, material) {
        this.radius = radius;
        this.position = pos;
        this.material = material;
    },

    intersect: function(ray){
        var info = new Flog.RayTracer.IntersectionInfo();
        info.shape = this;

        var dst = Flog.RayTracer.Vector.prototype.subtract(ray.position, this.position);

        var B = dst.dot(ray.direction);
        var C = dst.dot(dst) - (this.radius * this.radius);
        var D = (B * B) - C;

        if(D > 0){ // intersection!
            info.isHit = true;
            info.distance = (-B) - Math.sqrt(D);
            info.position = Flog.RayTracer.Vector.prototype.add(
                                                ray.position,
                                                Flog.RayTracer.Vector.prototype.multiplyScalar(
                                                    ray.direction,
                                                    info.distance
                                                )
                                            );
            info.normal = Flog.RayTracer.Vector.prototype.subtract(
                                            info.position,
                                            this.position
                                        ).normalize();

            info.color = this.material.getColor(0,0);
        } else {
            info.isHit = false;
        }
        return info;
    },

    toString : function () {
        return 'Sphere [position=' + this.position + ', radius=' + this.radius + ']';
    }
}
/* Fake a Flog.* namespace */
if(typeof(Flog) == 'undefined') var Flog = {};
if(typeof(Flog.RayTracer) == 'undefined') Flog.RayTracer = {};
if(typeof(Flog.RayTracer.Shape) == 'undefined') Flog.RayTracer.Shape = {};

Flog.RayTracer.Shape.Plane = Class.create();

Flog.RayTracer.Shape.Plane.prototype = {
    d: 0.0,

    initialize : function(pos, d, material) {
        this.position = pos;
        this.d = d;
        this.material = material;
    },

    intersect: function(ray){
        var info = new Flog.RayTracer.IntersectionInfo();

        var Vd = this.position.dot(ray.direction);
        if(Vd == 0) return info; // no intersection

        var t = -(this.position.dot(ray.position) + this.d) / Vd;
        if(t <= 0) return info;

        info.shape = this;
        info.isHit = true;
        info.position = Flog.RayTracer.Vector.prototype.add(
                                            ray.position,
                                            Flog.RayTracer.Vector.prototype.multiplyScalar(
                                                ray.direction,
                                                t
                                            )
                                        );
        info.normal = this.position;
        info.distance = t;

        if(this.material.hasTexture){
            var vU = new Flog.RayTracer.Vector(this.position.y, this.position.z, -this.position.x);
            var vV = vU.cross(this.position);
            var u = info.position.dot(vU);
            var v = info.position.dot(vV);
            info.color = this.material.getColor(u,v);
        } else {
            info.color = this.material.getColor(0,0);
        }

        return info;
    },

    toString : function () {
        return 'Plane [' + this.position + ', d=' + this.d + ']';
    }
}
/* Fake a Flog.* namespace */
if(typeof(Flog) == 'undefined') var Flog = {};
if(typeof(Flog.RayTracer) == 'undefined') Flog.RayTracer = {};

Flog.RayTracer.IntersectionInfo = Class.create();

Flog.RayTracer.IntersectionInfo.prototype = {
    isHit: false,
    hitCount: 0,
    shape: null,
    position: null,
    normal: null,
    color: null,
    distance: null,

    initialize : function() {
        this.color = new Flog.RayTracer.Color(0,0,0);
    },

    toString : function () {
        return 'Intersection [' + this.position + ']';
    }
}
/* Fake a Flog.* namespace */
if(typeof(Flog) == 'undefined') var Flog = {};
if(typeof(Flog.RayTracer) == 'undefined') Flog.RayTracer = {};

Flog.RayTracer.Camera = Class.create();

Flog.RayTracer.Camera.prototype = {
    position: null,
    lookAt: null,
    equator: null,
    up: null,
    screen: null,

    initialize : function(pos, lookAt, up) {
        this.position = pos;
        this.lookAt = lookAt;
        this.up = up;
        this.equator = lookAt.normalize().cross(this.up);
        this.screen = Flog.RayTracer.Vector.prototype.add(this.position, this.lookAt);
    },

    getRay: function(vx, vy){
        var pos = Flog.RayTracer.Vector.prototype.subtract(
            this.screen,
            Flog.RayTracer.Vector.prototype.subtract(
                Flog.RayTracer.Vector.prototype.multiplyScalar(this.equator, vx),
                Flog.RayTracer.Vector.prototype.multiplyScalar(this.up, vy)
            )
        );
        pos.y = pos.y * -1;
        var dir = Flog.RayTracer.Vector.prototype.subtract(
            pos,
            this.position
        );

        var ray = new Flog.RayTracer.Ray(pos, dir.normalize());

        return ray;
    },

    toString : function () {
        return 'Ray []';
    }
}
/* Fake a Flog.* namespace */
if(typeof(Flog) == 'undefined') var Flog = {};
if(typeof(Flog.RayTracer) == 'undefined') Flog.RayTracer = {};

Flog.RayTracer.Background = Class.create();

Flog.RayTracer.Background.prototype = {
    color : null,
    ambience : 0.0,

    initialize : function(color, ambience) {
        this.color = color;
        this.ambience = ambience;
    }
}
/* Fake a Flog.* namespace */
if(typeof(Flog) == 'undefined') var Flog = {};
if(typeof(Flog.RayTracer) == 'undefined') Flog.RayTracer = {};

Flog.RayTracer.Engine = Class.create();

Flog.RayTracer.Engine.prototype = {
    canvas: null, /* 2d context we can render to */

    initialize: function(options){
        this.options = Object.extend({
                canvasHeight: 100,
                canvasWidth: 100,
                pixelWidth: 2,
                pixelHeight: 2,
                renderDiffuse: false,
                renderShadows: false,
                renderHighlights: false,
                renderReflections: false,
                rayDepth: 2
            }, options || {});

        this.options.canvasHeight /= this.options.pixelHeight;
        this.options.canvasWidth /= this.options.pixelWidth;

        /* TODO: dynamically include other scripts */
    },

    setPixel: function(x, y, color){
        var pxW, pxH;
        pxW = this.options.pixelWidth;
        pxH = this.options.pixelHeight;

        if (this.canvas) {
          this.canvas.fillStyle = color.toString();
          this.canvas.fillRect (x * pxW, y * pxH, pxW, pxH);
        } else {
          // print(x * pxW, y * pxH, pxW, pxH);
        }
    },

    renderScene: function(scene, canvas){
        /* Get canvas */
        if (canvas) {
          this.canvas = canvas.getContext("2d");
        } else {
          this.canvas = null;
        }

        var canvasHeight = this.options.canvasHeight;
        var canvasWidth = this.options.canvasWidth;

        for(var y=0; y < canvasHeight; y++){
            for(var x=0; x < canvasWidth; x++){
                var yp = y * 1.0 / canvasHeight * 2 - 1;
          		var xp = x * 1.0 / canvasWidth * 2 - 1;

          		var ray = scene.camera.getRay(xp, yp);

          		var color = this.getPixelColor(ray, scene);

            	this.setPixel(x, y, color);
            }
        }
    },

    getPixelColor: function(ray, scene){
        var info = this.testIntersection(ray, scene, null);
        if(info.isHit){
            var color = this.rayTrace(info, ray, scene, 0);
            return color;
        }
        return scene.background.color;
    },

    testIntersection: function(ray, scene, exclude){
        var hits = 0;
        var best = new Flog.RayTracer.IntersectionInfo();
        best.distance = 2000;

        for(var i=0; i<scene.shapes.length; i++){
            var shape = scene.shapes[i];

            if(shape != exclude){
                var info = shape.intersect(ray);
                if(info.isHit && info.distance >= 0 && info.distance < best.distance){
                    best = info;
                    hits++;
                }
            }
        }
        best.hitCount = hits;
        return best;
    },

    getReflectionRay: function(P,N,V){
        var c1 = -N.dot(V);
        var R1 = Flog.RayTracer.Vector.prototype.add(
            Flog.RayTracer.Vector.prototype.multiplyScalar(N, 2*c1),
            V
        );
        return new Flog.RayTracer.Ray(P, R1);
    },

    rayTrace: function(info, ray, scene, depth){
        // Calc ambient
        var color = Flog.RayTracer.Color.prototype.multiplyScalar(info.color, scene.background.ambience);
        var oldColor = color;
        var shininess = Math.pow(10, info.shape.material.gloss + 1);

        for(var i=0; i<scene.lights.length; i++){
            var light = scene.lights[i];

            // Calc diffuse lighting
            var v = Flog.RayTracer.Vector.prototype.subtract(
                                light.position,
                                info.position
                            ).normalize();

            if(this.options.renderDiffuse){
                var L = v.dot(info.normal);
                if(L > 0.0){
                    color = Flog.RayTracer.Color.prototype.add(
                                        color,
                                        Flog.RayTracer.Color.prototype.multiply(
                                            info.color,
                                            Flog.RayTracer.Color.prototype.multiplyScalar(
                                                light.color,
                                                L
                                            )
                                        )
                                    );
                }
            }

            // The greater the depth the more accurate the colours, but
            // this is exponentially (!) expensive
            if(depth <= this.options.rayDepth){
          // calculate reflection ray
          if(this.options.renderReflections && info.shape.material.reflection > 0)
          {
              var reflectionRay = this.getReflectionRay(info.position, info.normal, ray.direction);
              var refl = this.testIntersection(reflectionRay, scene, info.shape);

              if (refl.isHit && refl.distance > 0){
                  refl.color = this.rayTrace(refl, reflectionRay, scene, depth + 1);
              } else {
                  refl.color = scene.background.color;
                        }

                  color = Flog.RayTracer.Color.prototype.blend(
                    color,
                    refl.color,
                    info.shape.material.reflection
                  );
          }

                // Refraction
                /* TODO */
            }

            /* Render shadows and highlights */

            var shadowInfo = new Flog.RayTracer.IntersectionInfo();

            if(this.options.renderShadows){
                var shadowRay = new Flog.RayTracer.Ray(info.position, v);

                shadowInfo = this.testIntersection(shadowRay, scene, info.shape);
                if(shadowInfo.isHit && shadowInfo.shape != info.shape /*&& shadowInfo.shape.type != 'PLANE'*/){
                    var vA = Flog.RayTracer.Color.prototype.multiplyScalar(color, 0.5);
                    var dB = (0.5 * Math.pow(shadowInfo.shape.material.transparency, 0.5));
                    color = Flog.RayTracer.Color.prototype.addScalar(vA,dB);
                }
            }

      // Phong specular highlights
      if(this.options.renderHighlights && !shadowInfo.isHit && info.shape.material.gloss > 0){
        var Lv = Flog.RayTracer.Vector.prototype.subtract(
                            info.shape.position,
                            light.position
                        ).normalize();

        var E = Flog.RayTracer.Vector.prototype.subtract(
                            scene.camera.position,
                            info.shape.position
                        ).normalize();

        var H = Flog.RayTracer.Vector.prototype.subtract(
                            E,
                            Lv
                        ).normalize();

        var glossWeight = Math.pow(Math.max(info.normal.dot(H), 0), shininess);
        color = Flog.RayTracer.Color.prototype.add(
                            Flog.RayTracer.Color.prototype.multiplyScalar(light.color, glossWeight),
                            color
                        );
      }
        }
        color.limit();
        return color;
    }
};


function renderScene(){
    var scene = new Flog.RayTracer.Scene();

    scene.camera = new Flog.RayTracer.Camera(
                        new Flog.RayTracer.Vector(0, 0, -15),
                        new Flog.RayTracer.Vector(-0.2, 0, 5),
                        new Flog.RayTracer.Vector(0, 1, 0)
                    );

    scene.background = new Flog.RayTracer.Background(
                                new Flog.RayTracer.Color(0.5, 0.5, 0.5),
                                0.4
                            );

    var sphere = new Flog.RayTracer.Shape.Sphere(
        new Flog.RayTracer.Vector(-1.5, 1.5, 2),
        1.5,
        new Flog.RayTracer.Material.Solid(
            new Flog.RayTracer.Color(0,0.5,0.5),
            0.3,
            0.0,
            0.0,
            2.0
        )
    );

    var sphere1 = new Flog.RayTracer.Shape.Sphere(
        new Flog.RayTracer.Vector(1, 0.25, 1),
        0.5,
        new Flog.RayTracer.Material.Solid(
            new Flog.RayTracer.Color(0.9,0.9,0.9),
            0.1,
            0.0,
            0.0,
            1.5
        )
    );

    var plane = new Flog.RayTracer.Shape.Plane(
                                new Flog.RayTracer.Vector(0.1, 0.9, -0.5).normalize(),
                                1.2,
                                new Flog.RayTracer.Material.Chessboard(
                                    new Flog.RayTracer.Color(1,1,1),
                                    new Flog.RayTracer.Color(0,0,0),
                                    0.2,
                                    0.0,
                                    1.0,
                                    0.7
                                )
                            );

    scene.shapes.push(plane);
    scene.shapes.push(sphere);
    scene.shapes.push(sphere1);

    var light = new Flog.RayTracer.Light(
        new Flog.RayTracer.Vector(5, 10, -1),
        new Flog.RayTracer.Color(0.8, 0.8, 0.8)
    );

    var light1 = new Flog.RayTracer.Light(
        new Flog.RayTracer.Vector(-3, 5, -15),
        new Flog.RayTracer.Color(0.8, 0.8, 0.8),
        100
    );

    scene.lights.push(light);
    scene.lights.push(light1);

    var imageWidth = 100; // $F('imageWidth');
    var imageHeight = 100; // $F('imageHeight');
    var pixelSize = "5,5".split(','); //  $F('pixelSize').split(',');
    var renderDiffuse = true; // $F('renderDiffuse');
    var renderShadows = true; // $F('renderShadows');
    var renderHighlights = true; // $F('renderHighlights');
    var renderReflections = true; // $F('renderReflections');
    var rayDepth = 2;//$F('rayDepth');

    var raytracer = new Flog.RayTracer.Engine(
        {
            canvasWidth: imageWidth,
            canvasHeight: imageHeight,
            pixelWidth: pixelSize[0],
            pixelHeight: pixelSize[1],
            "renderDiffuse": renderDiffuse,
            "renderHighlights": renderHighlights,
            "renderShadows": renderShadows,
            "renderReflections": renderReflections,
            "rayDepth": rayDepth
        }
    );

    raytracer.renderScene(scene, null, 0);
}

for (var i = 0; i < 6; ++i)
  renderScene();
// Copyright 2007 Google Inc. All rights reserved.
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above
//       copyright notice, this list of conditions and the following
//       disclaimer in the documentation and/or other materials provided
//       with the distribution.
//     * Neither the name of Google Inc. nor the names of its
//       contributors may be used to endorse or promote products derived
//       from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.


// This is a JavaScript implementation of the Richards
// benchmark from:
//
//    http://www.cl.cam.ac.uk/~mr10/Bench.html
// 
// The benchmark was originally implemented in BCPL by
// Martin Richards.

/**
 * The Richards benchmark simulates the task dispatcher of an
 * operating system.
 **/
function runRichards() {
  var scheduler = new Scheduler();
  scheduler.addIdleTask(ID_IDLE, 0, null, COUNT);

  var queue = new Packet(null, ID_WORKER, KIND_WORK);
  queue = new Packet(queue,  ID_WORKER, KIND_WORK);
  scheduler.addWorkerTask(ID_WORKER, 1000, queue);

  queue = new Packet(null, ID_DEVICE_A, KIND_DEVICE);
  queue = new Packet(queue,  ID_DEVICE_A, KIND_DEVICE);
  queue = new Packet(queue,  ID_DEVICE_A, KIND_DEVICE);
  scheduler.addHandlerTask(ID_HANDLER_A, 2000, queue);

  queue = new Packet(null, ID_DEVICE_B, KIND_DEVICE);
  queue = new Packet(queue,  ID_DEVICE_B, KIND_DEVICE);
  queue = new Packet(queue,  ID_DEVICE_B, KIND_DEVICE);
  scheduler.addHandlerTask(ID_HANDLER_B, 3000, queue);

  scheduler.addDeviceTask(ID_DEVICE_A, 4000, null);

  scheduler.addDeviceTask(ID_DEVICE_B, 5000, null);

  scheduler.schedule();

  if (scheduler.queueCount != EXPECTED_QUEUE_COUNT ||
      scheduler.holdCount != EXPECTED_HOLD_COUNT) {
    var msg =
        "Error during execution: queueCount = " + scheduler.queueCount +
        ", holdCount = " + scheduler.holdCount + ".";
    print(msg);
  }
}

var COUNT = 1000;

/**
 * These two constants specify how many times a packet is queued and
 * how many times a task is put on hold in a correct run of richards.
 * They don't have any meaning a such but are characteristic of a
 * correct run so if the actual queue or hold count is different from
 * the expected there must be a bug in the implementation.
 **/
var EXPECTED_QUEUE_COUNT = 2322;
var EXPECTED_HOLD_COUNT = 928;


/**
 * A scheduler can be used to schedule a set of tasks based on their relative
 * priorities.  Scheduling is done by maintaining a list of task control blocks
 * which holds tasks and the data queue they are processing.
 * @constructor
 */
function Scheduler() {
  this.queueCount = 0;
  this.holdCount = 0;
  this.blocks = new Array(NUMBER_OF_IDS);
  this.list = null;
  this.currentTcb = null;
  this.currentId = null;
}

var ID_IDLE       = 0;
var ID_WORKER     = 1;
var ID_HANDLER_A  = 2;
var ID_HANDLER_B  = 3;
var ID_DEVICE_A   = 4;
var ID_DEVICE_B   = 5;
var NUMBER_OF_IDS = 6;

var KIND_DEVICE   = 0;
var KIND_WORK     = 1;

/**
 * Add an idle task to this scheduler.
 * @param {int} id the identity of the task
 * @param {int} priority the task's priority
 * @param {Packet} queue the queue of work to be processed by the task
 * @param {int} count the number of times to schedule the task
 */
Scheduler.prototype.addIdleTask = function (id, priority, queue, count) {
  this.addRunningTask(id, priority, queue, new IdleTask(this, 1, count));
};

/**
 * Add a work task to this scheduler.
 * @param {int} id the identity of the task
 * @param {int} priority the task's priority
 * @param {Packet} queue the queue of work to be processed by the task
 */
Scheduler.prototype.addWorkerTask = function (id, priority, queue) {
  this.addTask(id, priority, queue, new WorkerTask(this, ID_HANDLER_A, 0));
};

/**
 * Add a handler task to this scheduler.
 * @param {int} id the identity of the task
 * @param {int} priority the task's priority
 * @param {Packet} queue the queue of work to be processed by the task
 */
Scheduler.prototype.addHandlerTask = function (id, priority, queue) {
  this.addTask(id, priority, queue, new HandlerTask(this));
};

/**
 * Add a handler task to this scheduler.
 * @param {int} id the identity of the task
 * @param {int} priority the task's priority
 * @param {Packet} queue the queue of work to be processed by the task
 */
Scheduler.prototype.addDeviceTask = function (id, priority, queue) {
  this.addTask(id, priority, queue, new DeviceTask(this))
};

/**
 * Add the specified task and mark it as running.
 * @param {int} id the identity of the task
 * @param {int} priority the task's priority
 * @param {Packet} queue the queue of work to be processed by the task
 * @param {Task} task the task to add
 */
Scheduler.prototype.addRunningTask = function (id, priority, queue, task) {
  this.addTask(id, priority, queue, task);
  this.currentTcb.setRunning();
};

/**
 * Add the specified task to this scheduler.
 * @param {int} id the identity of the task
 * @param {int} priority the task's priority
 * @param {Packet} queue the queue of work to be processed by the task
 * @param {Task} task the task to add
 */
Scheduler.prototype.addTask = function (id, priority, queue, task) {
  this.currentTcb = new TaskControlBlock(this.list, id, priority, queue, task);
  this.list = this.currentTcb;
  this.blocks[id] = this.currentTcb;
};

/**
 * Execute the tasks managed by this scheduler.
 */
Scheduler.prototype.schedule = function () {
  this.currentTcb = this.list;
  while (this.currentTcb != null) {
    if (this.currentTcb.isHeldOrSuspended()) {
      this.currentTcb = this.currentTcb.link;
    } else {
      this.currentId = this.currentTcb.id;
      this.currentTcb = this.currentTcb.run();
    }
  }
};

/**
 * Release a task that is currently blocked and return the next block to run.
 * @param {int} id the id of the task to suspend
 */
Scheduler.prototype.release = function (id) {
  var tcb = this.blocks[id];
  if (tcb == null) return tcb;
  tcb.markAsNotHeld();
  if (tcb.priority > this.currentTcb.priority) {
    return tcb;
  } else {
    return this.currentTcb;
  }
};

/**
 * Block the currently executing task and return the next task control block
 * to run.  The blocked task will not be made runnable until it is explicitly
 * released, even if new work is added to it.
 */
Scheduler.prototype.holdCurrent = function () {
  this.holdCount++;
  this.currentTcb.markAsHeld();
  return this.currentTcb.link;
};

/**
 * Suspend the currently executing task and return the next task control block
 * to run.  If new work is added to the suspended task it will be made runnable.
 */
Scheduler.prototype.suspendCurrent = function () {
  this.currentTcb.markAsSuspended();
  return this.currentTcb;
};

/**
 * Add the specified packet to the end of the worklist used by the task
 * associated with the packet and make the task runnable if it is currently
 * suspended.
 * @param {Packet} packet the packet to add
 */
Scheduler.prototype.queue = function (packet) {
  var t = this.blocks[packet.id];
  if (t == null) return t;
  this.queueCount++;
  packet.link = null;
  packet.id = this.currentId;
  return t.checkPriorityAdd(this.currentTcb, packet);
};

/**
 * A task control block manages a task and the queue of work packages associated
 * with it.
 * @param {TaskControlBlock} link the preceding block in the linked block list
 * @param {int} id the id of this block
 * @param {int} priority the priority of this block
 * @param {Packet} queue the queue of packages to be processed by the task
 * @param {Task} task the task
 * @constructor
 */
function TaskControlBlock(link, id, priority, queue, task) {
  this.link = link;
  this.id = id;
  this.priority = priority;
  this.queue = queue;
  this.task = task;
  if (queue == null) {
    this.state = STATE_SUSPENDED;
  } else {
    this.state = STATE_SUSPENDED_RUNNABLE;
  }
}

/**
 * The task is running and is currently scheduled.
 */
var STATE_RUNNING = 0;

/**
 * The task has packets left to process.
 */
var STATE_RUNNABLE = 1;

/**
 * The task is not currently running.  The task is not blocked as such and may
* be started by the scheduler.
 */
var STATE_SUSPENDED = 2;

/**
 * The task is blocked and cannot be run until it is explicitly released.
 */
var STATE_HELD = 4;

var STATE_SUSPENDED_RUNNABLE = STATE_SUSPENDED | STATE_RUNNABLE;
var STATE_NOT_HELD = ~STATE_HELD;

TaskControlBlock.prototype.setRunning = function () {
  this.state = STATE_RUNNING;
};

TaskControlBlock.prototype.markAsNotHeld = function () {
  this.state = this.state & STATE_NOT_HELD;
};

TaskControlBlock.prototype.markAsHeld = function () {
  this.state = this.state | STATE_HELD;
};

TaskControlBlock.prototype.isHeldOrSuspended = function () {
  return (this.state & STATE_HELD) != 0 || (this.state == STATE_SUSPENDED);
};

TaskControlBlock.prototype.markAsSuspended = function () {
  this.state = this.state | STATE_SUSPENDED;
};

TaskControlBlock.prototype.markAsRunnable = function () {
  this.state = this.state | STATE_RUNNABLE;
};

/**
 * Runs this task, if it is ready to be run, and returns the next task to run.
 */
TaskControlBlock.prototype.run = function () {
  var packet;
  if (this.state == STATE_SUSPENDED_RUNNABLE) {
    packet = this.queue;
    this.queue = packet.link;
    if (this.queue == null) {
      this.state = STATE_RUNNING;
    } else {
      this.state = STATE_RUNNABLE;
    }
  } else {
    packet = null;
  }
  return this.task.run(packet);
};

/**
 * Adds a packet to the worklist of this block's task, marks this as runnable if
 * necessary, and returns the next runnable object to run (the one
 * with the highest priority).
 */
TaskControlBlock.prototype.checkPriorityAdd = function (task, packet) {
  if (this.queue == null) {
    this.queue = packet;
    this.markAsRunnable();
    if (this.priority > task.priority) return this;
  } else {
    this.queue = packet.addTo(this.queue);
  }
  return task;
};

TaskControlBlock.prototype.toString = function () {
  return "tcb { " + this.task + "@" + this.state + " }";
};

/**
 * An idle task doesn't do any work itself but cycles control between the two
 * device tasks.
 * @param {Scheduler} scheduler the scheduler that manages this task
 * @param {int} v1 a seed value that controls how the device tasks are scheduled
 * @param {int} count the number of times this task should be scheduled
 * @constructor
 */
function IdleTask(scheduler, v1, count) {
  this.scheduler = scheduler;
  this.v1 = v1;
  this.count = count;
}

IdleTask.prototype.run = function (packet) {
  this.count--;
  if (this.count == 0) return this.scheduler.holdCurrent();
  if ((this.v1 & 1) == 0) {
    this.v1 = this.v1 >> 1;
    return this.scheduler.release(ID_DEVICE_A);
  } else {
    this.v1 = (this.v1 >> 1) ^ 0xD008;
    return this.scheduler.release(ID_DEVICE_B);
  }
};

IdleTask.prototype.toString = function () {
  return "IdleTask"
};

/**
 * A task that suspends itself after each time it has been run to simulate
 * waiting for data from an external device.
 * @param {Scheduler} scheduler the scheduler that manages this task
 * @constructor
 */
function DeviceTask(scheduler) {
  this.scheduler = scheduler;
  this.v1 = null;
}

DeviceTask.prototype.run = function (packet) {
  if (packet == null) {
    if (this.v1 == null) return this.scheduler.suspendCurrent();
    var v = this.v1;
    this.v1 = null;
    return this.scheduler.queue(v);
  } else {
    this.v1 = packet;
    return this.scheduler.holdCurrent();
  }
};

DeviceTask.prototype.toString = function () {
  return "DeviceTask";
};

/**
 * A task that manipulates work packets.
 * @param {Scheduler} scheduler the scheduler that manages this task
 * @param {int} v1 a seed used to specify how work packets are manipulated
 * @param {int} v2 another seed used to specify how work packets are manipulated
 * @constructor
 */
function WorkerTask(scheduler, v1, v2) {
  this.scheduler = scheduler;
  this.v1 = v1;
  this.v2 = v2;
}

WorkerTask.prototype.run = function (packet) {
  if (packet == null) {
    return this.scheduler.suspendCurrent();
  } else {
    if (this.v1 == ID_HANDLER_A) {
      this.v1 = ID_HANDLER_B;
    } else {
      this.v1 = ID_HANDLER_A;
    }
    packet.id = this.v1;
    packet.a1 = 0;
    for (var i = 0; i < DATA_SIZE; i++) {
      this.v2++;
      if (this.v2 > 26) this.v2 = 1;
      packet.a2[i] = this.v2;
    }
    return this.scheduler.queue(packet);
  }
};

WorkerTask.prototype.toString = function () {
  return "WorkerTask";
};

/**
 * A task that manipulates work packets and then suspends itself.
 * @param {Scheduler} scheduler the scheduler that manages this task
 * @constructor
 */
function HandlerTask(scheduler) {
  this.scheduler = scheduler;
  this.v1 = null;
  this.v2 = null;
}

HandlerTask.prototype.run = function (packet) {
  if (packet != null) {
    if (packet.kind == KIND_WORK) {
      this.v1 = packet.addTo(this.v1);
    } else {
      this.v2 = packet.addTo(this.v2);
    }
  }
  if (this.v1 != null) {
    var count = this.v1.a1;
    var v;
    if (count < DATA_SIZE) {
      if (this.v2 != null) {
        v = this.v2;
        this.v2 = this.v2.link;
        v.a1 = this.v1.a2[count];
        this.v1.a1 = count + 1;
        return this.scheduler.queue(v);
      }
    } else {
      v = this.v1;
      this.v1 = this.v1.link;
      return this.scheduler.queue(v);
    }
  }
  return this.scheduler.suspendCurrent();
};

HandlerTask.prototype.toString = function () {
  return "HandlerTask";
};

/* --- *
 * P a c k e t
 * --- */

var DATA_SIZE = 4;

/**
 * A simple package of data that is manipulated by the tasks.  The exact layout
 * of the payload data carried by a packet is not importaint, and neither is the
 * nature of the work performed on packets by the tasks.
 *
 * Besides carrying data, packets form linked lists and are hence used both as
 * data and worklists.
 * @param {Packet} link the tail of the linked list of packets
 * @param {int} id an ID for this packet
 * @param {int} kind the type of this packet
 * @constructor
 */
function Packet(link, id, kind) {
  this.link = link;
  this.id = id;
  this.kind = kind;
  this.a1 = 0;
  this.a2 = new Array(DATA_SIZE);
}

/**
 * Add this packet to the end of a worklist, and return the worklist.
 * @param {Packet} queue the worklist to add this packet to
 */
Packet.prototype.addTo = function (queue) {
  this.link = null;
  if (queue == null) return this;
  var peek, next = queue;
  while ((peek = next.link) != null)
    next = peek;
  next.link = this;
  return queue;
};

Packet.prototype.toString = function () {
  return "Packet";
};

for (var i = 0; i < 350; ++i)
  runRichards();
function f()
{
    function g() { }
}

for (var i = 0; i < 300000; ++i)
    f();
function f(x0, x1, x2, x3, x4, x5, x6, x7, x8, x9)
{
}

for (var i = 0; i < 3000000; ++i)
    f(0, 1, 2, 3, 4, 5, 6, 7, 8, 9);
function f()
{
}

for (var i = 0; i < 4000000; ++i)
    f();
function f(x0, x1, x2, x3, x4)
{
}

for (var i = 0; i < 3000000; ++i)
    f(0, 1, 2, 3, 4, 5, 6, 7, 8, 9);
function f(x0, x1, x2, x3, x4, x5, x6, x7, x8, x9)
{
}

for (var i = 0; i < 3000000; ++i)
    f();
function f(x, y, z)
{
    return x + y + z;
}

for (var i = 0; i < 2500000; ++i)
    f(1, 2, 3);
for (x = 0; x < 1200000; ++x)
    ;
for (var i = 0; i < 10000000; ++i)
    ;
var count = 6000000;
var sum = 0;
for (var i = 0; i < count; i++) {
    sum = i + count;
}
