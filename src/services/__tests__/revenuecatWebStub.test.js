import { describe, it, expect } from 'vitest';
import stub, { Purchases } from '../revenuecatWebStub';

describe('revenuecatWebStub', () => {
  it('throws on configure (must not run on native)', () => {
    expect(() => Purchases.configure()).toThrow(/stubbed in native builds/);
  });

  it('throws on getSharedInstance', () => {
    expect(() => Purchases.getSharedInstance()).toThrow(/native/);
  });

  it('default export wraps the same Purchases object', () => {
    expect(stub.Purchases).toBe(Purchases);
  });
});
