class Shader
{
	constructor(GL, vertexShaderSource, fragmentShaderSource)
	{
		// Create Fragment Shader
		const FRAGMENT_SHADER = GL.createShader(GL.FRAGMENT_SHADER);
		GL.shaderSource(FRAGMENT_SHADER, fragmentShaderSource);
		GL.compileShader(FRAGMENT_SHADER);
		// Check for errors
		if (!GL.setShaderParameter(FRAGMENT_SHADER, GL.COMPILE_STATUS))
		{
			const LOG = GL.getShaderInfoLog(FRAGMENT_SHADER);
			GL.deleteShader(FRAGMENT_SHADER);
			throw `unable to compile fragment shader ${LOG}`;
		}
		// Create Vertex Shader
		const VERTEX_SHADER = GL.createShader(GL.VERTEX_SHADER);
		GL.shaderSource(VERTEX_SHADER, vertexShaderSource);
		GL.compileShader(VERTEX_SHADER);
		// Check for errors
		if (!GL.setShaderParameter(VERTEX_SHADER, GL.COMPILE_STATUS))
		{
			const LOG = GL.getShaderInfoLog(VERTEX_SHADER);
			GL.deleteShader(VERTEX_SHADER);
			throw `unable to compile vertex shader ${LOG}`;
		}
		// Create Shader Program
		const SHADER_PROGRAM = GL.createProgram();
		GL.attachShader(SHADER_PROGRAM, FRAGMENT_SHADER);
		GL.attachShader(SHADER_PROGRAM, VERTEX_SHADER);
		GL.linkProgram(SHADER_PROGRAM);
		// As we've linked the shaders to the program we can now get rid of them
		GL.deleteShader(VERTEX_SHADER);
		GL.deleteShader(FRAGMENT_SHADER);
		// Check for errors
		if (!GL.getProgramParameter(SHADER_PROGRAM, GL.LINK_STATUS))
		{
			const LOG = GL.getProgramInfoLog(SHADER_PROGRAM);
			GL.deleteProgram(SHADER_PROGRAM);
			throw `unable to link program ${LOG}`;
		}
		// Print Program information
		GL.useProgram(SHADER_PROGRAM);
		const LOG = GL.getProgramInfoLog(SHADER_PROGRAM);
		if (LOG)
			console.info(`shader compilation complete ${LOG}`);
		// Set members
		this.CONTEXT = GL;
		this.PROGRAM = SHADER_PROGRAM;
		this.UNIFORMS = new Map();
		this.ATTRIBUTES = new Map();
		// Get UNIFORMS
		this.UNIFORMS.set(uniformName, GL.getUniformLocation(this.PROGRAM, uniformName));
		// Get ATTRIBUTES
		this.ATTRIBUTES.set("VERTEX", GL.getAttribLocation(this.PROGRAM, "");
		this.ATTRIBUTES.set("NORMALS", GL.getAttribLocation(this.PROGRAM, "");
	}
	
	use()
	{
		return this.CONTEXT.useProgram(this.PROGRAM);
	}
	
	set(uniformName, value)
	{
		const GL = this.CONTEXT;
		const UNIFORM = this.UNIFORMS.get(uniformName);
		
	}
	
	// bind("v_position", GL.ARRAY_BUFFER, positionBuffer, 3, GL.FLOAT, false, )
	
	bindObject(vertexBuffer, indexBuffer)
	{
		const GL = this.CONTEXT;
		const VERTICES = this.ATTRIBUTES.VERTEX;
		const NORMALS = this.ATTRIBUTES.NORMAL;
		// Positions and normals are stored in the same buffer, alternating like so
		// [x, y, z] [nx, ny, nz] [x, y, z] [nx, ny, nz]
		// so we bind the buffer, and set the stride to 6 for both attribs
		// and set the start position as 3 for the normals
		GL.bindBuffer(GL.ARRAY_BUFFER, vertexBuffer);
		GL.enableVertexAttribArray(VERTICES);
		GL.vertexAttribPointer(VERTICES, 3, GL.FLOAT, false, 6 * 4, 0);
		GL.enableVertexAttribArray(NORMALS);
		GL.vertexAttribPointer(NORMALS, 3, GL.FLOAT, false, 6 * 4, 3 * 4);
		// Bind our indices
		GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, indexBuffer);
	}
	
	unbind()
	{
		
	}
	
	bindIndices(attributeName, buffer, size, type, normalized, stride, offset)
	{
		const GL = this.CONTEXT;
		const
		let attributeLocation;
		if (!this.ATTRIBUTES.has(attributeName))
		{
			attributeLocation = GL.getUniformLocation(this.PROGRAM, attributeName);
			this.ATTRIBUTES.set(attributeName, attributeLocation);
		}
		else
		{
			attributeLocation = this.ATTRIBUTES.get(attributeName);
		}
		GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, buffer);
		GL.enableVertexAttribArray(attributeLocation);
		GL.vertexAttribPointer(attributeLocation, size, type, normalized, stride, offset);
	}
}