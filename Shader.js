const OUTLINE_VERT_SHADER_SOURCE = `
	precision mediump float;
	attribute vec3 a_position;
	attribute vec3 a_normal;

	uniform mat4 u_projectionMat;
	uniform mat4 u_modelviewMat;
	uniform float u_offset;

	void main() {
	  vec4 p = vec4(a_position+a_normal*u_offset, 1.0);
	  gl_Position = u_projectionMat * u_modelviewMat * p;
	}`;
const OUTLINE_FRAG_SHADER_SOURCE = `
	precision mediump float;
	uniform vec3 u_color;

	void main() {
		gl_FragColor = vec4(u_color, 1.0);
	}`;
const CEL_VERT_SHADER_SOURCE = `
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
	}`;
const CEL_FRAG_SHADER_SOURCE = `
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
	}`;
class Shader {
  constructor( GL, vertexShaderSource, fragmentShaderSource ) {
    // Create Fragment Shader
    const FRAGMENT_SHADER = GL.createShader( GL.FRAGMENT_SHADER );
    GL.shaderSource( FRAGMENT_SHADER, fragmentShaderSource );
    GL.compileShader( FRAGMENT_SHADER );
    // Check for errors
    if ( !GL.setShaderParameter( FRAGMENT_SHADER, GL.COMPILE_STATUS ) ) {
      const LOG = GL.getShaderInfoLog( FRAGMENT_SHADER );
      GL.deleteShader( FRAGMENT_SHADER );
      throw `unable to compile fragment shader ${LOG}`;
    }
    // Create Vertex Shader
    const VERTEX_SHADER = GL.createShader( GL.VERTEX_SHADER );
    GL.shaderSource( VERTEX_SHADER, vertexShaderSource );
    GL.compileShader( VERTEX_SHADER );
    // Check for errors
    if ( !GL.setShaderParameter( VERTEX_SHADER, GL.COMPILE_STATUS ) ) {
      const LOG = GL.getShaderInfoLog( VERTEX_SHADER );
      GL.deleteShader( VERTEX_SHADER );
      throw `unable to compile vertex shader ${LOG}`;
    }
    // Create Shader Program
    const SHADER_PROGRAM = GL.createProgram();
    GL.attachShader( SHADER_PROGRAM, FRAGMENT_SHADER );
    GL.attachShader( SHADER_PROGRAM, VERTEX_SHADER );
    GL.linkProgram( SHADER_PROGRAM );
    // As we've linked the shaders to the program we can now get rid of them
    GL.deleteShader( VERTEX_SHADER );
    GL.deleteShader( FRAGMENT_SHADER );
    // Check for errors
    if ( !GL.getProgramParameter( SHADER_PROGRAM, GL.LINK_STATUS ) ) {
      const LOG = GL.getProgramInfoLog( SHADER_PROGRAM );
      GL.deleteProgram( SHADER_PROGRAM );
      throw `unable to link program ${LOG}`;
    }
    // Print Program information
    GL.useProgram( SHADER_PROGRAM );
    const LOG = GL.getProgramInfoLog( SHADER_PROGRAM );
    if ( LOG ) console.info( `shader compilation complete ${LOG}` );
    // Set members
    this.CONTEXT = GL;
    this.PROGRAM = SHADER_PROGRAM;
    this.UNIFORMS = new Map();
    this.ATTRIBUTES = new Map();
    // Get UNIFORMS
    this.UNIFORMS.set( uniformName, GL.getUniformLocation( this.PROGRAM, uniformName ) );
    // Get ATTRIBUTES
    this.ATTRIBUTES.set( "VERTEX", GL.getAttribLocation( this.PROGRAM, "" ) );
    this.ATTRIBUTES.set( "NORMALS", GL.getAttribLocation( this.PROGRAM, "" ) );
  }
  use() {
    return this.CONTEXT.useProgram( this.PROGRAM );
  }
  set( uniformName, value ) {
    const GL = this.CONTEXT;
    const UNIFORM = this.UNIFORMS.get( uniformName );
    const L = value.length;
    switch ( L ) {
      case 1:
        // float
        this.PROGRAM.setUniform1f( GL, uniformName, UNIFORM );
        break;
      case 3:
        // vector3
        this.PROGRAM.setUniform3fv( GL, uniformName, UNIFORM );
        break;
      case 4:
        // vector4
        this.PROGRAM.setUniform4fv( GL, uniformName, UNIFORM );
        break;
      case 9:
        // mat3
        this.PROGRAM.setUniformMatrix3fv( GL, uniformName, UNIFORM );
        break;
      case 16:
        // mat4
        this.PROGRAM.setUniformMatrix4fv( GL, uniformName, UNIFORM );
        break;
    }
  }
  bind( vertexBuffer, indexBuffer ) {
    const GL = this.CONTEXT;
    const VERTICES = this.ATTRIBUTES.VERTEX;
    const NORMALS = this.ATTRIBUTES.NORMAL;
    // Positions and normals are stored in the same buffer, alternating like so
    // [x, y, z] [nx, ny, nz] [x, y, z] [nx, ny, nz]
    // so we bind the buffer, and set the stride to 6 for both attribs
    // and set the start position as 3 for the normals
    GL.bindBuffer( GL.ARRAY_BUFFER, vertexBuffer );
    GL.enableVertexAttribArray( VERTICES );
    GL.vertexAttribPointer( VERTICES, 3, GL.FLOAT, false, 6 * 4, 0 );
    GL.enableVertexAttribArray( NORMALS );
    GL.vertexAttribPointer( NORMALS, 3, GL.FLOAT, false, 6 * 4, 3 * 4 );
    // Bind our indices
    GL.bindBuffer( GL.ELEMENT_ARRAY_BUFFER, indexBuffer );
  }
  unbind() {
    const GL = this.CONTEXT;
    GL.bindBuffer( GL.ARRAY_BUFFER, null );
    GL.bindBuffer( GL.ELEMENT_ARRAY_BUFFER, null );
  }
}