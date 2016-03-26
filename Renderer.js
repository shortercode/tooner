function checkForGLError( GL ) {
  const err = GL.getError();
  err !== GL.NO_ERROR && console.error( err );
}
class Renderer {
  constructor() {
    this.ELEMENT = document.createElement( 'canvas' );
    this.CONTEXT = this.ELEMENT.getContext( '2d' );
    this.OUTLINE_SHADER = new Shader( this.CONTEXT, OUTLINE_VERT_SHADER_SOURCE, OUTLINE_FRAG_SHADER_SOURCE );
    this.CEL_SHADER = new Shader( this.CONTEXT, CEL_VERT_SHADER_SOURCE, CEL_FRAG_SHADER_SOURCE );
    this.OBJECTS = [];
    this.VIEW_MATRIX = new Matrix();
    this.PROJECTION_MATRIX = new Matrix();
  }
  render() {
    const GL = this.CONTEXT;
    GL.clearColor( 0.5, 0.5, 0.5, 1 );
    GL.clear( GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT );
    //GL.enable(GL.CULL_FACE);
    this.OUTLINE_SHADER.use();
    this.OUTLINE_SHADER.set( 'u_projectionMat', this.PROJECTION_MATRIX );
    for ( let OBJECT of this.OBJECTS ) {
			this.OUTLINE_SHADER.set( 'u_offset', OUTLINE_WIDTH );
	    this.OUTLINE_SHADER.set( 'u_color', OUTLINE_COLOR );
			this.OUTLINE_SHADER.set( 'u_modelviewMat', OBJECT.MODEL_VIEW_MATRIX );
      OBJECT.draw( this.OUTLINE_SHADER );
    }
    //GL.disable(GL.CULL_FACE);
    checkForGLError( GL );
    this.CEL_SHADER.use();
		this.CEL_SHADER.set('u_projectionMat');
		this.CEL_SHADER.set('u_light');
		for ( let OBJECT of this.OBJECTS)
		{
			this.CEL_SHADER.set('u_diffuse');
			this.CEL_SHADER.set('u_ambient');
			this.CEL_SHADER.set('u_specular');
			this.CEL_SHADER.set('u_shine');
			this.CEL_SHADER.set('u_celShading');
			this.CEL_SHADER.set('u_modelviewMat');
			this.CEL_SHADER.set('u_normalMat');
			OBJECT.draw( this.CEL_SHADER);
		}
		checkForGLError( GL );
  }
}