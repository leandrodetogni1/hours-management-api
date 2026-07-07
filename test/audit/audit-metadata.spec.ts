import {
  defaultMetadata,
  unwrapEnvelope,
} from '../../src/audit/audit.interceptor';

describe('unwrapEnvelope', () => {
  it('unwraps the global ResponseInterceptor { data } envelope', () => {
    const payload = { firstName: 'Ana', lastName: 'Silva' };
    expect(unwrapEnvelope({ data: payload })).toBe(payload);
  });

  it('leaves objects with keys other than data untouched', () => {
    const result = { data: { x: 1 }, meta: { page: 1 } };
    expect(unwrapEnvelope(result)).toBe(result);
  });

  it('leaves non-object results untouched', () => {
    expect(unwrapEnvelope(null)).toBeNull();
    expect(unwrapEnvelope(undefined)).toBeUndefined();
    expect(unwrapEnvelope('ok')).toBe('ok');
    expect(unwrapEnvelope([{ data: 1 }])).toEqual([{ data: 1 }]);
  });
});

describe('defaultMetadata', () => {
  it('extracts a user snapshot from an unwrapped handler result', () => {
    const wrapped = {
      data: {
        firstName: 'Victor',
        lastName: 'Santos',
        email: 'victor@inf.ufpel.edu.br',
      },
    };
    expect(defaultMetadata(unwrapEnvelope(wrapped))).toEqual({
      label: 'Victor Santos',
      email: 'victor@inf.ufpel.edu.br',
    });
  });

  it('extracts activity snapshots via event and userId', () => {
    expect(
      defaultMetadata({ event: 'Semana Acadêmica', userId: 'uuid-1' }),
    ).toEqual({ label: 'Semana Acadêmica', userId: 'uuid-1' });
  });

  it('extracts invitation snapshots via email and role', () => {
    expect(defaultMetadata({ email: 'a@b.com', role: 'member' })).toEqual({
      label: 'a@b.com',
      email: 'a@b.com',
      role: 'member',
    });
  });

  it('never copies non-whitelisted fields', () => {
    const metadata = defaultMetadata({
      firstName: 'Ana',
      token: 'jwt-secret',
      password: 'hunter2',
      body: { anything: true },
    });
    expect(metadata).toEqual({ label: 'Ana' });
  });

  it('returns null when nothing is extractable', () => {
    expect(defaultMetadata(null)).toBeNull();
    expect(defaultMetadata('ok')).toBeNull();
    expect(defaultMetadata([])).toBeNull();
    expect(defaultMetadata({ data: 'still wrapped' })).toBeNull();
    expect(defaultMetadata({ id: 'uuid' })).toBeNull();
  });
});
