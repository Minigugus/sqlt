import type { Parameter, Row, SimpleParameter } from './definitions';
import { SQLDriverControler } from './driver';
import { SQLHelper, invokeHelper } from './helper';
import { SQLResponse } from './response';

export type { SQLBuilder };

class SQLBuilder {
  #sql = '';
  #parameters: SimpleParameter[] = [];
  #rawMode: boolean;

  public constructor(
    private readonly controller: SQLDriverControler,
    printer: boolean = false
  ) {
    this.#rawMode = printer;
  }

  get sql() {
    return this.#sql.trim();
  }

  get parameters(): readonly SimpleParameter[] {
    return this.parameters;
  }

  get request(): SQLRequest {
    return [this.#sql, this.#parameters];
  }

  get nextId() {
    return this.#parameters.length;
  }

  identifier(name: string) {
    return this.controller.identifier(name);
  }

  addSQL(trusted: string) {
    this.#sql += trusted;
  }

  addSimpleParameter(placeholder: string, parameter: SimpleParameter) {
    try {
      if (this.#rawMode)
        this.addSQL(this.controller.print(parameter));
      else {
        this.addSQL(placeholder);
        this.#parameters.push(parameter);
      }
    } catch (err) {
      if (err instanceof Error)
        err.message = this.#sql + placeholder + ' << ' + err.message;
      throw err;
    }
  }

  renderSimpleParameter(value: SimpleParameter) {
    this.controller.encode(this, value, this.nextId);
  }

  renderParameter(value: Parameter) {
    if (value instanceof SQLTemplate)
      value[RENDER_SYMBOL](this);
    else if (value instanceof SQLHelper)
      invokeHelper(this, value);
    else if (Array.isArray(value)) {
      if (value.length) {
        this.renderParameter(value[0]);
        for (let i = 1; i < value.length; i++) {
          this.addSQL(', ');
          this.renderParameter(value[i]);
        }
      }
    } else
      this.renderSimpleParameter(value);
  }
}

export type SQLRequest = [string, SimpleParameter[]];

export function renderTemplate(template: SQLTemplate, builder: SQLBuilder) {
  return template[RENDER_SYMBOL](builder);
}

const RENDER_SYMBOL = Symbol();

export class SQLTemplate<T extends Row = Row> implements PromiseLike<SQLResponse<T>> {
  #sql: readonly string[];
  #parameters: Parameter[];

  #cached: SQLRequest | null = null;
  #rawCached: string | null = null;
  #controller: SQLDriverControler;

  public constructor(
    controller: SQLDriverControler,
    public readonly raw: boolean,
    sql: readonly string[],
    parameters: Parameter[]
  ) {
    this.#sql = sql;
    this.#parameters = parameters;
    this.#controller = controller;
  }

  renderSQL() {
    if (this.#rawCached === null)
      this.#rawCached = this[RENDER_SYMBOL](new SQLBuilder(this.#controller, true)).sql;
    return this.#rawCached;
  }

  renderWithParameters() {
    return this.render(false);
  }

  render(raw: boolean = this.raw) {
    if (this.#cached === null)
      this.#cached = this[RENDER_SYMBOL](new SQLBuilder(this.#controller, raw)).request;
    return this.#cached;
  }

  private [RENDER_SYMBOL](buidler: SQLBuilder) {
    const sql = this.#sql;
    const parameters = this.#parameters;
    let i;
    for (i = 0; i < parameters.length; i++) {
      buidler.addSQL(sql[i]);
      buidler.renderParameter(parameters[i]);
    }
    if (i in sql)
      buidler.addSQL(sql[i]);
    return buidler;
  }

  then<TResult1 = SQLResponse<T>, TResult2 = never>(onfulfilled?: ((value: SQLResponse<T>) => TResult1 | PromiseLike<TResult1>) | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null): PromiseLike<TResult1 | TResult2> {
    return this.#controller.query<T>(...this.render())
      .then(onfulfilled, onrejected);
  }

  toString() {
    return this.render(true);
  }
}
