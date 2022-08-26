import { rete } from './rete';

describe('rete', () => {
  it('should work', () => {
    const session = rete.initSession<{name: string}>()
    expect(session.thenQueue.size).toBe(0)
  });
});
