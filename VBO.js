class vertexAttribPointer {
  constructor( GL, vertices, indices ) {
    this.CONTEXT = GL;
    this.VERTICES = null;
    this.INDICES = null;
		this.INDEX_COUNT = 0;
    this.VERTEX_BUFFER = GL.createBuffer();
    this.INDEX_BUFFER = GL.createBuffer();
		this.MODEL_VIEW_MATRIX = new Matrix();
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
	draw(SHADER) {
		const GL = this.CONTEXT;
		SHADER.bind(this.VERTEX_BUFFER, this.INDEX_BUFFER);
		GL.drawElements(GL.TRIANGLES, this.INDEX_COUNT, GL.UNSIGNED_SHORT, 0);
	}
}