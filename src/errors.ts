export class NonTaggedTemplateCallError extends SyntaxError {
  public constructor() {
    super(`This function can only be called as a template string tag`);
  }
}
