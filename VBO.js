class vertexAttribPointer {
  constructor( GL, vertices, indices ) {
    this.CONTEXT = GL;
    this.VERTICES = null;
    this.INDICES = null;
		this.INDEX_COUNT = 0;
		this.DIFFUSE_COLOR = vec3.create();
		this.SPECULAR_COLOR = vec3.create();
		this.AMBIENT_COLOR = vec3.create();
		this.OUTLINE_WIDTH = 0.02;
		this.OUTLINE_COLOR = vec3.create();
		this.position = vec3.create();
		this.rotation = quat.create();
    this.VERTEX_BUFFER = GL.createBuffer();
    this.INDEX_BUFFER = GL.createBuffer();
		this.MODEL_VIEW_MATRIX = mat4.create();
    this.setVertices( vertices );
    this.setIndices( indices );
  }
  setVertices( vertices ) {
    const GL = this.CONTEXT;
    this.VERTICES = vertices;
    GL.bindBuffer( GL.ARRAY_BUFFER, this.VERTEX_BUFFER );
    GL.bufferData( GL.ARRAY_BUFFER, vertices, GL.STATIC_DRAW );
		GL.bindBuffer( GL.ARRAY_BUFFER, null );
  }
  setIndices( indices ) {
    const GL = this.CONTEXT;
    this.INDICES = indices;
    GL.bindBuffer( GL.ELEMENT_ARRAY_BUFFER, this.INDEX_BUFFER );
    GL.bufferData( GL.ELEMENT_ARRAY_BUFFER, indices, GL.STATIC_DRAW );
		GL.bindBuffer( GL.ELEMENT_ARRAY_BUFFER, null);
  }
	updateMatrix() {
		
	}
	draw(SHADER) {
		const GL = this.CONTEXT;
		SHADER.bind(this.VERTEX_BUFFER, this.INDEX_BUFFER);
		GL.drawElements(GL.TRIANGLES, this.INDEX_COUNT, GL.UNSIGNED_SHORT, 0);
	}
}