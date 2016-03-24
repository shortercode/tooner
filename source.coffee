
DIFFUSE = vec3.fromValues 1.00, 0.66, 0.00
AMBIENT = vec3.fromValues 0.1, 0.1, 0.1
SPECULAR = vec3.fromValues 0.50, 0.50, 0.50
SHININESS = 50

LIGHT_POSITION = vec3.fromValues 0.25, 0.25, 1

TRANSLATION = vec3.fromValues 0, 0, -3

FIELD_OF_VIEW_DEG = 45
Z_NEAR = 0.01
Z_FAR = 50

SLICES = 192
STACKS = 48

TREFOIL_A = 0.6
TREFOIL_B = 0.3
TREFOIL_C = 0.5
TREFOIL_D = 0.15

CEL_SHADING_LEVEL = 4

OUTLINE_WIDTH = 0.02
OUTLINE_COLOR = vec4.fromValues 0.0, 0.0, 0.0, 1

Epsilon = 0.01

VertexCount = SLICES * STACKS
IndexCount = VertexCount * 6

Tau = 2 * Math.PI

OutlineVertShaderSrc = """
precision mediump float;
attribute vec3 a_position;
attribute vec3 a_normal;

uniform mat4 u_projectionMat;
uniform mat4 u_modelviewMat;
uniform float u_offset;

void main() {
  vec4 p = vec4(a_position+a_normal*u_offset, 1.0);
  gl_Position = u_projectionMat * u_modelviewMat * p;
}
"""

OutlineFragShaderSrc = """
precision mediump float;
uniform vec4 u_color;

void main() {
  gl_FragColor = u_color;
}
"""

CelVertShaderSrc = """
precision mediump float;
attribute vec3 a_position;
attribute vec3 a_normal;

uniform mat4 u_projectionMat;
uniform mat4 u_modelviewMat;
uniform mat3 u_normalMat;
uniform vec3 u_diffuse;

varying vec3 v_eyeNormal;
varying vec3 v_diffuse;

void main() {
  v_eyeNormal = u_normalMat * a_normal;
  v_diffuse = u_diffuse;
  gl_Position = u_projectionMat * u_modelviewMat * vec4(a_position, 1.0);
}
"""

CelFragShaderSrc = """
precision mediump float;
varying vec3 v_eyeNormal;
varying vec3 v_diffuse;

uniform vec3 u_light;
uniform vec3 u_ambient;
uniform vec3 u_specular;
uniform float u_shine;
uniform float u_celShading;

float celShade(float d) {
  float E = 0.05;
  d *= u_celShading;
  float r = 1.0 / (u_celShading-0.5);
  float fd = floor(d);
  float dr = d * r;
  if (d > fd-E && d < fd+E) {
    float last = (fd - sign(d - fd))*r;
    return mix(last, fd*r,
      smoothstep((fd-E)*r, (fd+E)*r, dr));
  } else {
    return fd*r;
  }
}

void main() {
  vec3 en = normalize(v_eyeNormal);
  vec3 ln = normalize(u_light);
  vec3 hn = normalize(ln + vec3(0, 0, 1));
  float E = 0.05;

  float df = max(0.0, dot(en, ln));
  float sf = max(0.0, dot(en, hn));

  float cdf = celShade(df);

  sf = pow(sf, u_shine);

  if (sf > 0.5 - E && sf < 0.5 + E) {
    sf = smoothstep(0.5 - E, 0.5 + E, sf);
  } else {
    sf = step(0.5, sf);
  }

  float csf = sf;

  vec3 color = u_ambient + cdf * v_diffuse + csf * u_specular;


  gl_FragColor = vec4(color, 1.0);
}
"""

glEnumToString = (gl, glenum) ->
  return name for own name, val of gl when val is glenum
  "0x#{glenum.toString 16}"

glCheckAndLogError = (gl) ->
  err = gl.getError()
  console.error glEnumToString gl, err unless err is gl.NO_ERROR

fatalError = (canvas, message) ->
  ctx = canvas.getContext '2d'
  ctx.fillStyle = 'black'
  ctx.fillRect 0, 0, canvas.width, canvas.height
  ctx.fillStyle = 'red'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = '20px san-serif'
  ctx.fillText message, canvas.width/2, canvas.height/2
  throw new Error message

getWebGLContext = (canvas, glattrs=null) ->
  for alias in ["webgl", "experimental-webgl", "moz-webgl", "webkit-3d"]
    try return ctx if ctx = canvas.getContext alias, glattrs
  fatalError canvas, 'WebGL initialization failed (check browser support?)'

trefoil = (s, t) ->
  [u, v] = [(1-s) * 2 * Tau, t * Tau]
  [sinu, cosu] = [Math.sin(1.0*u), Math.cos(1.0*u)]
  [sinv, cosv] = [Math.sin(1.0*v), Math.cos(1.0*v)]
  [su15, cu15] = [Math.sin(1.5*u), Math.cos(1.5*u)]

  r = TREFOIL_A + TREFOIL_B * cu15;

  dv = [
    -1.5 * TREFOIL_B * su15 * cosu - r * sinu
    -1.5 * TREFOIL_B * su15 * sinu + r * cosu
    +1.5 * TREFOIL_C * cu15
  ]

  q = vec3.normalize vec3.create(), dv
  qv = vec3.normalize vec3.create(), [q[1], -q[0], 0]
  ww = vec3.cross vec3.create(), q, qv

  [ r * cosu + TREFOIL_D * (qv[0]*cosv + (-dv[2]*qv[1])*sinv),
    r * sinu + TREFOIL_D * (qv[1]*cosv + (+dv[2]*qv[0])*sinv),
    TREFOIL_C * su15 + TREFOIL_D * (dv[0]*qv[1]-dv[1]*qv[0])*sinv ]

class VertexBuffer
  constructor: (gl) ->
    [ds, dt] = [1.0/SLICES, 1.0/STACKS]
    buf = []
    for s in [0...1-ds/2] by ds
      for t in [0...1-dt/2] by dt
        p = trefoil(s, t)
        u = vec3.sub [], trefoil(s+Epsilon, t), p
        v = vec3.sub [], trefoil(s, t+Epsilon), p
        n = vec3.cross [], u, v
        u = vec3.cross u, u, v
        vec3.normalize u, u
        buf.push p[0]; buf.push p[1]; buf.push p[2]
        buf.push u[0]; buf.push u[1]; buf.push u[2]
    verts = new Float32Array(buf)
    @handle = gl.createBuffer()

    console.assert @handle != null, "gl.createBuffer failed"+glEnumToString(gl, gl.getError())

    gl.bindBuffer gl.ARRAY_BUFFER, @handle
    gl.bufferData gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW

  bind: (gl) ->
    gl.bindBuffer gl.ARRAY_BUFFER, @handle

class IndexBuffer
  constructor: (gl) ->
    idxs = new Uint16Array IndexCount
    n = ii = 0
    for i in [0...SLICES]
      for j in [0...STACKS]
        idxs[ii++] = n+j
        idxs[ii++] = n + (j + 1) % STACKS
        idxs[ii++] = (n + j + STACKS) % VertexCount

        idxs[ii++] = (n + j + STACKS) % VertexCount
        idxs[ii++] = (n + (j + 1) % STACKS) % VertexCount
        idxs[ii++] = (n + (j + 1) % STACKS + STACKS) % VertexCount
      n += STACKS

    @handle = gl.createBuffer()
    console.assert @handle != null, "gl.createBuffer failed"

    gl.bindBuffer gl.ELEMENT_ARRAY_BUFFER, @handle
    gl.bufferData gl.ELEMENT_ARRAY_BUFFER, idxs, gl.STATIC_DRAW

  bind: (gl) -> gl.bindBuffer gl.ELEMENT_ARRAY_BUFFER, @handle

class ShaderProgram
  compileShader: (gl, src, typestr) ->
    shader = gl.createShader gl[typestr]
    console.assert shader, "createShader failed. type='#{typestr}'"
    gl.shaderSource shader, src.trim()
    gl.compileShader shader
    if !gl.getShaderParameter shader, gl.COMPILE_STATUS
      log = gl.getShaderInfoLog shader
      gl.deleteShader shader
      console.error "#{typestr} shader info log:\n#{log}"
      fatalError "failed to compile #{typestr}"
    shader

  constructor: (gl, vsrc, fsrc, attribLocs) ->
    fs = @compileShader gl, fsrc, 'FRAGMENT_SHADER'
    vs = @compileShader gl, vsrc, 'VERTEX_SHADER'

    @program = gl.createProgram()
    console.assert !!@program, "gl.createProgram failed"

    gl.attachShader @program, vs
    gl.attachShader @program, fs
    gl.bindAttribLocation @program, loc, attrib for own attrib, loc of attribLocs

    gl.linkProgram @program
    gl.deleteShader vs
    gl.deleteShader fs

    if !gl.getProgramParameter @program, gl.LINK_STATUS
      log = gl.getProgramInfoLog @program
      gl.deleteProgram @program
      console.error "program info log:\n#{log}"
      fatalError "shader link failed: #{log}"

    @uniforms = {}
    len = gl.getProgramParameter(@program, gl.ACTIVE_UNIFORMS)||0
    for i in [0...len]
      info = gl.getActiveUniform @program, i
      @uniforms[info.name] = gl.getUniformLocation @program, info.name if info?

    @attributes = {}
    len = gl.getProgramParameter(@program, gl.ACTIVE_ATTRIBUTES)||0
    for i in [0...len]
      info = gl.getActiveAttrib @program, i
      @attributes[info.name] = gl.getAttribLocation @program, info.name if info?

  use: (gl) -> gl.useProgram @program

  setUniform1f: (gl, name, x) -> gl.uniform1f loc, x if (loc = @uniforms[name])?
  setUniform2f: (gl, name, x, y) -> gl.uniform2f loc, x, y if (loc = @uniforms[name])?
  setUniform3f: (gl, name, x, y, z) -> gl.uniform3f loc, x, y, z if (loc = @uniforms[name])?
  setUniform4f: (gl, name, x, y, z, w) -> gl.uniform4f loc, x, y, z, w if (loc = @uniforms[name])?

  setUniform1fv: (gl, name, arr) -> gl.uniform1fv loc, arr if (loc = @uniforms[name])?
  setUniform2fv: (gl, name, arr) -> gl.uniform2fv loc, arr if (loc = @uniforms[name])?
  setUniform3fv: (gl, name, arr) -> gl.uniform3fv loc, arr if (loc = @uniforms[name])?
  setUniform4fv: (gl, name, arr) -> gl.uniform4fv loc, arr if (loc = @uniforms[name])?

  setUniformMatrix1fv: (gl, name, m) -> gl.uniformMatrix1fv loc, gl.FALSE, m if (loc = @uniforms[name])?
  setUniformMatrix2fv: (gl, name, m) -> gl.uniformMatrix2fv loc, gl.FALSE, m if (loc = @uniforms[name])?
  setUniformMatrix3fv: (gl, name, m) -> gl.uniformMatrix3fv loc, gl.FALSE, m if (loc = @uniforms[name])?
  setUniformMatrix4fv: (gl, name, m) -> gl.uniformMatrix4fv loc, gl.FALSE, m if (loc = @uniforms[name])?

animationFrame = window.requestAnimationFrame \
              || window.webkitRequestAnimationFrame \
              || window.mozRequestAnimationFrame \
              || window.oRequestAnimationFrame \
              || window.msRequestAnimationFrame \
              || ((callback) -> window.setTimeout(callback, 1000 / 60))

class Demo
  constructor: (@canvas) ->
    @gl = getWebGLContext @canvas

    @celShader = new ShaderProgram @gl, CelVertShaderSrc, CelFragShaderSrc, {a_position: 0, a_normal: 1}
    @outlineShader = new ShaderProgram @gl, OutlineVertShaderSrc, OutlineFragShaderSrc, {a_position: 0, a_normal: 1}
    @vbo = new VertexBuffer @gl
    @ibo = new IndexBuffer @gl
    @gl.enable @gl.DEPTH_TEST

    @projection = mat4.create()
    @modelview = mat4.create()
    @normalMat = mat3.create()

    @translation = TRANSLATION

    @rotation = mat4.identity mat4.create()

    @modelview = mat4.translate @modelview, @modelview, @translation

    @mouse = vec2.create()
    @mouseDown = false

    @canvas.onmousedown = (e) => @onMouse_ e, e.clientX, e.clientY, true, false
    document.onmouseup = (e) => @onMouse_ e, e.clientX, e.clientY, false, false
    document.onmousemove = (e) => @onMouse_ e, e.clientX, e.clientY, @mouseDown, true

    @canvas.ontouchstart = (e) => @onMouse_ e, e.touches[0].clientX, e.touches[0].clientY, true, false
    document.ontouchend = (e) => @onMouse_ e, e.touches[0].clientX, e.touches[0].clientY, false, false
    document.ontouchmove = (e) => @onMouse_ e, e.touches[0].clientX, e.touches[0].clientY, @mouseDown, true

    document.onmousewheel = @onScroll_


    window.addEventListener 'DOMMouseScroll', @onScroll_, false

    window.addEventListener 'resize', @resize
    @resize()

  onScroll_: ({wheelDelta}) =>
    @translation[2] += if wheelDelta >= 0 then 0.05 else -0.05

  onMouse_: (e, x, y, @mouseDown, moved) ->
    rect = @canvas.getBoundingClientRect()
    mx = x - rect.left
    my = y - rect.top
    e.preventDefault()
    if @mouseDown and moved
      deg2rad = Math.PI/180
      nmat = mat4.identity mat4.create()
      [dx, dy] = [mx - @mouse[0], my - @mouse[1]]
      mat4.rotateY nmat, nmat, dx*deg2rad/5
      mat4.rotateX nmat, nmat, dy*deg2rad/5
      mat4.multiply @rotation, nmat, @rotation
    vec2.set @mouse, mx, my


  zoom: (amt) -> translation[2] += amt

  resize: =>
    @canvas.width = window.innerWidth
    @canvas.height = window.innerHeight
    @gl.viewport 0, 0, @canvas.width, @canvas.height
    deg2rad = Math.PI/180
    fovy = FIELD_OF_VIEW_DEG * deg2rad
    aspect = @canvas.width / @canvas.height
    @projection = mat4.perspective @projection, fovy, aspect, Z_NEAR, Z_FAR

  update: (time, dt) ->
    mat4.rotateY @rotation, @rotation, dt/1000 unless @mouseDown
    mat4.identity @modelview
    mat4.translate @modelview, @modelview, @translation
    mat4.multiply @modelview, @modelview, @rotation
  
    mat3.normalFromMat4 @normalMat, @modelview
   
  bindAttrs: (gl, shader) ->
    #@vbo.bind gl
    #@ibo.bind gl
    gl.enableVertexAttribArray shader.attributes.a_position
    gl.enableVertexAttribArray shader.attributes.a_normal
    gl.vertexAttribPointer shader.attributes.a_position, 3, gl.FLOAT, false, 6*4, 0
    gl.vertexAttribPointer shader.attributes.a_normal, 3, gl.FLOAT, false, 6*4, 3*4
    
  render: (time, dt, accum) ->
    gl = @gl
    gl.clearColor 0.5, 0.5, 0.5, 1

    gl.clear gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT

    @outlineShader.use gl
   # @bindAttrs gl, @outlineShader
  
    @outlineShader.setUniformMatrix4fv gl, 'u_projectionMat', @projection
    @outlineShader.setUniformMatrix4fv gl, 'u_modelviewMat', @modelview
    #gl.disable gl.DEPTH_TEST
    gl.enable gl.CULL_FACE

    #gl.cullFace gl.FRONT
    #gl.depthMask gl.TRUE
    
    @outlineShader.setUniform1f gl, 'u_offset', OUTLINE_WIDTH
    @outlineShader.setUniform4fv gl, 'u_color', OUTLINE_COLOR
    
    gl.drawElements gl.TRIANGLES, IndexCount, gl.UNSIGNED_SHORT, 0

    #gl.cullFace gl.BACK
    #gl.depthMask gl.FALSE
    @outlineShader.setUniform1f gl, 'u_offset', 0.0
    @outlineShader.setUniform4fv gl, 'u_color', vec4.fromValues(1, 1, 1, 1)
    #gl.drawElements gl.TRIANGLES, IndexCount, gl.UNSIGNED_SHORT, 0

    #gl.cullFace gl.BACK
    gl.disable gl.CULL_FACE
    #gl.disable gl.DEPTH_TEST
    #gl.depthMask gl.TRUE
    glCheckAndLogError gl
    @celShader.use gl
    
    @celShader.setUniform3fv gl, 'u_diffuse', DIFFUSE
    @celShader.setUniform3fv gl, 'u_ambient', AMBIENT
    @celShader.setUniform3fv gl, 'u_specular', SPECULAR
    @celShader.setUniform1f gl, 'u_shine', SHININESS
    @celShader.setUniform3fv gl, 'u_light', LIGHT_POSITION
    
    @celShader.setUniform1f gl, 'u_celShading', CEL_SHADING_LEVEL

    @celShader.setUniformMatrix4fv gl, 'u_projectionMat', @projection
    @celShader.setUniformMatrix4fv gl, 'u_modelviewMat', @modelview
    @celShader.setUniformMatrix3fv gl, 'u_normalMat', @normalMat

    #@bindAttrs gl, @celShader

    gl.drawElements gl.TRIANGLES, IndexCount, gl.UNSIGNED_SHORT, 0

  tick: =>
    newTime = new Date().getTime();
    frameTime = newTime - @currentTime
    dt = 1 / 60
    @currentTime = newTime

    @accum += frameTime

    while @accum >= dt
      @update @t, dt
      @t += dt
      @accum -= dt

    animationFrame @tick

    @render @t, dt, @accum

  start: ->
    @t = 0
    @currentTime = new Date().getTime()
    @accum = 0
    @tick()



demo = new Demo document.getElementById 'screen'

demo.start()
