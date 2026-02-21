declare module 'json-logic-js' {
  const jsonLogic: {
    apply(logic: unknown, data?: unknown): unknown;
    add_operation(name: string, code: (...args: any[]) => any): void;
    rm_operation(name: string): void;
    rule_like(rule: unknown, pattern: unknown): boolean;
  };
  export default jsonLogic;
}
