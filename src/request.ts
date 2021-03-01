import type { SQLDriver, Parameter, PrepapredParameter, SimpleParameter } from './definitions';

import { invokeHelper, isHelper, isStaticSQL } from './helpers_def';

export type { SQLBuilder };

class SQLBuilder {
  private sql = '';
  private parameters = [] as PrepapredParameter[];
  private cachable = true;

  public constructor(
    public readonly driver: SQLDriver,
    public readonly render: (this: SQLBuilder, template: SQLTemplate) => void
  ) { }

  get isCachable() {
    return this.cachable;
  }

  get SQL() {
    return this.sql;
  }

  get params(): readonly PrepapredParameter[] {
    return this.parameters;
  }

  public disableCache() {
    if (this.cachable === true)
      this.cachable = false;
  }

  public addSQL(trusted: string) {
    this.sql += trusted;
  }

  private parametersCache = new Map<PrepapredParameter, string>();

  public addPreparedParameter(value: PrepapredParameter) {
    const id = this.parameters.length;
    const sqlId = this.driver.placeholder(id);
    const cachedSqlId = this.parametersCache.get(value);
    if (cachedSqlId && sqlId !== cachedSqlId) // Ensure the driver use name parameters
      this.addSQL(cachedSqlId);
    else {
      this.parameters.push(this.driver.encode ? this.driver.encode(value, id) : value);
      this.addSQL(sqlId);
      this.parametersCache.set(value, sqlId);
    }
  }

  public addSimpleParameter(value: SimpleParameter) {
    if (isRequest(value))
      this.render(getTemplate(value));
    else if (isStaticSQL(value))
      this.addSQL(value.sql);
    else if (isHelper(value))
      invokeHelper(value, this);
    else if (typeof value !== 'object'
      || value === null
      || value instanceof Date
      || value instanceof Uint8Array)
      this.addPreparedParameter(value);
    else
      throw new TypeError('Cannot infer parameter type - use the json helper to pass an object');
  }

  public addParameter(value: Parameter) {
    if (typeof value === 'function') {
      this.disableCache();
      value = value();
    }
    if (isRequest(value) || !Array.isArray(value))
      this.addSimpleParameter(value);
    else {
      if (!value.length)
        return;
      this.addParameter(value[0]);
      for (let i = 1; i < value.length; i++) {
        this.addSQL(', ');
        this.addParameter(value[i]);
      }
    }
  }
}

const TEMPLATE_MAP = new WeakMap<SQLRequest, SQLTemplate>();

function isRequest(req: any): req is SQLRequest {
  return TEMPLATE_MAP.has(req);
}

function getTemplate(req: SQLRequest) {
  const template = TEMPLATE_MAP.get(req);
  if (template === undefined)
    throw new Error("This request wasn't generated by sqlt");
  return template;
}

export type SQLRequest = readonly [sql: string, parameters: readonly PrepapredParameter[]];

export class SQLTemplate {
  #sql: string[];
  #driver: SQLDriver;
  #params: readonly Parameter[];
  #cache = new WeakMap<SQLDriver, SQLRequest>();

  public constructor(
    driver: SQLDriver,
    sql: string[],
    public readonly parameters: readonly Parameter[]
  ) {
    this.#sql = sql;
    this.#driver = driver;
    this.#params = parameters;
  }

  public render(driver: SQLDriver = this.#driver): SQLRequest {
    const cached = this.#cache.get(driver);
    if (cached !== undefined)
      return cached;
    function render(this: SQLBuilder, template: SQLTemplate) {
      const sql = template.#sql;
      const parameters = template.#params;
      let i = 0;
      for (; i < parameters.length; i++) {
        this.addSQL(sql[i]);
        this.addParameter(parameters[i]);
      }
      if (i < sql.length)
        this.addSQL(sql[i]);
    }
    const builder = new SQLBuilder(driver, render);
    render.call(builder, this);
    // const request = new SQLRequest(builder.SQL, builder.params);
    const request = [builder.SQL.trim(), builder.params] as const;
    if (builder.isCachable)
      this.#cache.set(driver, request);
    TEMPLATE_MAP.set(request, this);
    return request;
  }

  [Symbol.iterator]() {
    return this.render()[Symbol.iterator]();
  }
}